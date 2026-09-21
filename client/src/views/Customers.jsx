import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
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
  const debounceRef = useRef(null);
  const { confirmModal, ask } = useConfirm();

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

    </>
  );
};

export default Customers;
