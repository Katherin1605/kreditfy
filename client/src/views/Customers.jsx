import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatCurrency, formatDate } from '../utils/currency';
import { useExchangeRates } from '../context/ExchangeRatesContext';
import AmountDisplay from '../components/AmountDisplay';
import FormCustomers from '../components/FormCustomers';
import ImportModal from '../components/ImportModal';
import TableSkeleton from '../components/TableSkeleton';
import Pagination from '../components/Pagination';
import useConfirm from '../hooks/useConfirm';

const CUSTOMER_FIELDS = [
  { key: 'name',          label: 'Nombre',    required: true,  aliases: ['nombre', 'cliente'] },
  { key: 'identity_card', label: 'Cédula',    required: true,  aliases: ['cedula', 'ci', 'identity', 'documento', 'dni'] },
  { key: 'phone',         label: 'Teléfono',  required: false, aliases: ['telefono', 'tel', 'celular', 'movil'] },
  { key: 'address',       label: 'Dirección', required: false, aliases: ['direccion', 'dir', 'domicilio'] },
];

const fmtCI = (v) => v ? String(v).replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '—';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', identity_card: '', phone: '', address: '' });
  const [formErrors, setFormErrors] = useState({});
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const [exporting, setExporting] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [accountModal, setAccountModal] = useState({ show: false, customer: null, data: null, loading: false });
  const debounceRef = useRef(null);
  const { confirmModal, ask } = useConfirm();
  const { rates } = useExchangeRates();

  useEffect(() => {
    loadCustomers('', 1);
  }, []);

  useEffect(() => {
    loadCustomers(search, page);
  }, [page]);

  const loadCustomers = (q = '', p = 1) => {
    setLoading(true);
    const params = { page: p, limit: 20 };
    if (q) params.q = q;
    axios.get('/customers', { params })
      .then(res => {
        const data = res.data;
        if (Array.isArray(data)) {
          setCustomers(data);
          setPagination({ total: data.length, totalPages: 1 });
        } else {
          setCustomers(data.data || []);
          setPagination({ total: data.total || 0, totalPages: data.totalPages || 1 });
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearch(value);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadCustomers(value.trim(), 1);
    }, 350);
  };

  const handlePageChange = (newPage) => setPage(newPage);

  const resetForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setFormData({ name: '', identity_card: '', phone: '', address: '' });
    setFormErrors({});
  };

  const handleNew = () => {
    setEditingCustomer(null);
    setFormData({ name: '', identity_card: '', phone: '', address: '' });
    setFormErrors({});
    setShowForm(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      identity_card: customer.identity_card,
      phone: customer.phone || '',
      address: customer.address || '',
    });
    setFormErrors({});
    setShowForm(true);
  };

  const handleViewAccount = (customer) => {
    setAccountModal({ show: true, customer, data: null, loading: true });
    axios.get(`/customers/${customer.id}/account`)
      .then(res => setAccountModal(prev => ({ ...prev, data: res.data, loading: false })))
      .catch(err => {
        toast.error(err.response?.data?.error || 'Error al cargar el estado de cuenta');
        setAccountModal({ show: false, customer: null, data: null, loading: false });
      });
  };

  const closeAccountModal = () => setAccountModal({ show: false, customer: null, data: null, loading: false });

  const handleDelete = async (id) => {
    const ok = await ask('¿Está seguro de eliminar este cliente?');
    if (!ok) return;
    axios.delete(`/customers/${id}`)
      .then(() => {
        toast.success('Cliente eliminado');
        loadCustomers(search.trim(), page);
      })
      .catch(err => toast.error(err.response?.data?.error || 'Error al procesar la solicitud'));
  };

  const VALID_PREFIXES = ['0412', '0414', '0416', '0424', '0426'];

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.name.trim()) errs.name = 'El nombre es obligatorio';
    if (!formData.identity_card.trim()) errs.identity_card = 'La cédula es obligatoria';
    if (formData.phone) {
      if (formData.phone.length !== 11) {
        errs.phone = 'El teléfono debe tener 11 dígitos';
      } else if (!VALID_PREFIXES.some(p => formData.phone.startsWith(p))) {
        errs.phone = 'Prefijo inválido. Use: 0412, 0414, 0416, 0424 o 0426';
      }
    }
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    const request = editingCustomer
      ? axios.put(`/customers/${editingCustomer.id}`, formData)
      : axios.post('/customers', formData);

    request
      .then(() => {
        toast.success(editingCustomer ? 'Cliente actualizado' : 'Cliente creado');
        resetForm();
        loadCustomers(search.trim(), page);
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Error al procesar la solicitud';
        if (msg.toLowerCase().includes('cédula') && msg.toLowerCase().includes('exist')) {
          setFormErrors({ identity_card: 'Esta cédula ya está registrada' });
        } else {
          toast.error(msg);
        }
      });
  };

  const handleExportCSV = async () => {
    setExporting(true);
    try {
      const params = { page: 1, limit: 99999 };
      if (search) params.q = search.trim();
      const res  = await axios.get('/customers', { params });
      const data = Array.isArray(res.data) ? res.data : (res.data.data || []);

      const escape = (v) => {
        const s = v === null || v === undefined ? '' : String(v);
        return s.includes(';') || s.includes('"') || s.includes('\n')
          ? `"${s.replace(/"/g, '""')}"` : s;
      };

      const headers = ['Nombre', 'Cédula', 'Teléfono', 'Dirección'];
      const rows = data.map(c => [c.name, c.identity_card, c.phone ?? '', c.address ?? '']);
      const csv  = [headers, ...rows].map(r => r.map(escape).join(';')).join('\r\n');
      const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `clientes_${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`${data.length} clientes exportados`);
    } catch {
      toast.error('Error al exportar el CSV');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async (rows) => {
    const valid = rows.filter(r => r.name?.trim() && r.identity_card?.trim());
    if (!valid.length) { toast.error('No se encontraron filas con nombre y cédula'); return; }
    setImporting(true);
    try {
      const res = await axios.post('/customers/import', { customers: valid });
      const { inserted, updated, skipped } = res.data;
      const parts = [];
      if (inserted) parts.push(`${inserted} nuevos`);
      if (updated)  parts.push(`${updated} actualizados`);
      if (skipped)  parts.push(`${skipped} omitidos`);
      toast.success(`Importación completada: ${parts.join(' · ')}`);
      setShowImportModal(false);
      loadCustomers(search.trim(), 1);
      setPage(1);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al importar');
    } finally {
      setImporting(false);
    }
  };

  return (
    <>
      {confirmModal}

      <ImportModal
        show={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImport={handleImport}
        fields={CUSTOMER_FIELDS}
        title="Importar Clientes"
        importing={importing}
      />

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Clientes</h5>
        <div className="d-flex gap-2 align-items-center">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Buscar por nombre o cédula..."
              value={search}
              onChange={handleSearchChange}
            />
            {search && (
              <button
                className="btn btn-primary text-nowrap"
                onClick={() => { setSearch(''); setPage(1); loadCustomers('', 1); }}
              >
                <i className="bi bi-x-lg"></i>
              </button>
            )}
          </div>
          <button
            className="btn btn-outline-success text-nowrap"
            onClick={handleExportCSV}
            disabled={exporting || pagination.total === 0}
            title="Exportar clientes a CSV"
          >
            {exporting
              ? <><span className="spinner-border spinner-border-sm me-1" role="status"></span>Exportando...</>
              : <><i className="bi bi-file-earmark-spreadsheet me-1"></i>Exportar</>
            }
          </button>
          <button
            className="btn btn-outline-primary text-nowrap"
            onClick={() => setShowImportModal(true)}
          >
            <i className="bi bi-file-earmark-arrow-up me-1"></i>Importar
          </button>
          <button className="btn btn-primary text-nowrap" onClick={handleNew}>
            <i className="bi bi-plus-lg me-1"></i> Nuevo Cliente
          </button>
        </div>
      </div>

      {showForm && (
        <FormCustomers
          formData={formData}
          setFormData={setFormData}
          editingCustomer={editingCustomer}
          onSubmit={handleSubmit}
          onClose={resetForm}
          errors={formErrors}
        />
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="customers-table-head">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Cédula</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={5} />
              ) : customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    {search ? `Sin resultados para "${search}"` : 'No hay clientes registrados'}
                  </td>
                </tr>
              ) : (
                customers.map(c => (
                  <tr key={c.id}>
                    <td className="px-4 py-2">{c.name}</td>
                    <td className="px-4 py-2">{fmtCI(c.identity_card)}</td>
                    <td className="px-4 py-2">{c.phone || '-'}</td>
                    <td className="px-4 py-2">{c.address || '-'}</td>
                    <td className="px-4 py-2">
                      <button className="btn btn-sm btn-outline-secondary me-1" onClick={() => handleViewAccount(c)} title="Ver estado de cuenta">
                        <i className="bi bi-file-text"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(c)}>
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(c.id)}>
                        <i className="bi bi-trash"></i>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        page={page}
        totalPages={pagination.totalPages}
        total={pagination.total}
        onPageChange={handlePageChange}
      />

      {accountModal.show && (
        <>
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-xl modal-dialog-scrollable">
              <div className="modal-content">

                <div className="modal-header no-print">
                  <h5 className="modal-title">
                    <i className="bi bi-file-text me-2"></i>
                    Estado de Cuenta — {accountModal.customer?.name}
                  </h5>
                  <div className="d-flex gap-2 align-items-center ms-auto">
                    {!accountModal.loading && accountModal.data && (
                      <button className="btn btn-sm btn-primary" onClick={() => {
                          const prev = document.title;
                          document.title = `kreditfy-${accountModal.customer?.name || 'estado-de-cuenta'}`;
                          window.print();
                          document.title = prev;
                        }}>
                        <i className="bi bi-printer me-1"></i>Imprimir / PDF
                      </button>
                    )}
                    <button type="button" className="btn-close" onClick={closeAccountModal} />
                  </div>
                </div>

                <div className="modal-body">
                  {accountModal.loading ? (
                    <div className="text-center py-5 text-muted">
                      <div className="spinner-border text-primary mb-3" role="status" />
                      <p>Cargando estado de cuenta...</p>
                    </div>
                  ) : accountModal.data && (
                    <div className="account-statement-printable">

                      {/* Encabezado solo visible al imprimir */}
                      <div className="print-only account-statement-print-header mb-4">
                        <div>
                          <h4 className="fw-bold">Estado de Cuenta</h4>
                          <small>Historial de ventas y pagos</small>
                        </div>
                        <div className="text-end">
                          <small>Generado el {new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' })}</small>
                        </div>
                      </div>

                      {/* Datos del cliente */}
                      <div className="account-statement-customer-box mb-4">
                        <p className="account-statement-section-label">Datos del cliente</p>
                        <div className="row g-2">
                          <div className="col-6 col-md-3">
                            <span className="text-muted small">Nombre</span>
                            <p className="mb-0 fw-semibold">{accountModal.data.customer.name}</p>
                          </div>
                          <div className="col-6 col-md-3">
                            <span className="text-muted small">Cédula</span>
                            <p className="mb-0">{fmtCI(accountModal.data.customer.identity_card)}</p>
                          </div>
                          <div className="col-6 col-md-3">
                            <span className="text-muted small">Teléfono</span>
                            <p className="mb-0">{accountModal.data.customer.phone || '—'}</p>
                          </div>
                          <div className="col-6 col-md-3">
                            <span className="text-muted small">Dirección</span>
                            <p className="mb-0">{accountModal.data.customer.address || '—'}</p>
                          </div>
                        </div>
                      </div>

                      {/* Resumen */}
                      <div className="row g-3 mb-4">
                        <div className="col-4">
                          <div className="account-statement-summary-box account-statement-summary-ventas">
                            <p className="account-statement-summary-label">Total en ventas</p>
                            <p className="account-statement-summary-value">{formatCurrency(accountModal.data.summary.totalVentas, 'USD')}</p>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className="account-statement-summary-box account-statement-summary-cobrado">
                            <p className="account-statement-summary-label">Total cobrado</p>
                            <p className="account-statement-summary-value">{formatCurrency(accountModal.data.summary.totalCobrado, 'USD')}</p>
                          </div>
                        </div>
                        <div className="col-4">
                          <div className={`account-statement-summary-box ${accountModal.data.summary.saldoPendiente > 0 ? 'account-statement-summary-pendiente' : 'account-statement-summary-cobrado'}`}>
                            <p className="account-statement-summary-label">Saldo pendiente</p>
                            <p className="account-statement-summary-value">{formatCurrency(accountModal.data.summary.saldoPendiente, 'USD')}</p>
                          </div>
                        </div>
                      </div>

                      {/* Lista de ventas */}
                      <p className="account-statement-section-label mb-3">Detalle de ventas</p>
                      {accountModal.data.sales.length === 0 ? (
                        <p className="text-muted text-center py-3">Este cliente no tiene ventas registradas</p>
                      ) : (
                        accountModal.data.sales.map((sale, idx) => (
                          <div key={sale.id} className={`account-statement-sale-block${idx < accountModal.data.sales.length - 1 ? ' mb-4' : ''}`}>
                            <div className="account-statement-sale-header">
                              <div className="d-flex align-items-center gap-2 flex-wrap">
                                <span className="badge bg-light text-dark border">Venta #{sale.id}</span>
                                <span className="small text-muted">{formatDate(sale.sale_date)}</span>
                                <span className="fw-semibold">{formatCurrency(sale.total, 'USD')}</span>
                                <span className="small text-muted">· {sale.cuotas} cuota{sale.cuotas !== 1 ? 's' : ''} de {formatCurrency(sale.valor_cuota, 'USD')}</span>
                              </div>
                              <span className={`badge ${sale.status === 'paid' ? 'bg-success' : 'bg-warning text-dark'}`}>
                                {sale.status === 'paid' ? 'Pagado' : 'Pendiente'}
                              </span>
                            </div>

                            {sale.payments.length > 0 ? (
                              <table className="table table-sm mb-0 account-statement-payments-table">
                                <thead>
                                  <tr>
                                    <th>Fecha</th>
                                    <th>Monto</th>
                                    <th>Método</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {sale.payments.map(p => (
                                    <tr key={p.id}>
                                      <td className="text-muted">{formatDate(p.payment_date)}</td>
                                      <td>
                                        <AmountDisplay amount={p.amount} rates={rates} storedRate={p.exchange_rate} className="text-success fw-semibold" />
                                      </td>
                                      <td className="text-muted">{{ cash: 'Efectivo', transfer: 'Pago Móvil', card: 'Cobro Externo' }[p.method] || '—'}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            ) : (
                              <p className="text-muted small px-3 py-2 mb-0">Sin pagos registrados</p>
                            )}

                            <div className="account-statement-sale-footer">
                              <span>Cobrado: <strong className="text-success">{formatCurrency(sale.total_paid, 'USD')}</strong></span>
                              <span>Saldo: <strong className={sale.balance > 0 ? 'text-warning' : 'text-success'}>{formatCurrency(sale.balance, 'USD')}</strong></span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show no-print" onClick={closeAccountModal} />
        </>
      )}

    </>
  );
};

export default Customers;
