import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import FormCustomers from '../components/FormCustomers';
import TableSkeleton from '../components/TableSkeleton';
import Pagination from '../components/Pagination';
import useConfirm from '../hooks/useConfirm';

const splitCSVLine = (line, sep) => {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (ch === sep && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current);
  return result;
};

const parseCustomersCSV = (text) => {
  const clean = text.replace(/^﻿/, '');
  const lines = clean.split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return null;

  const sep = lines[0].includes(';') ? ';' : ',';
  const headers = splitCSVLine(lines[0], sep).map(h =>
    h.trim().replace(/^"|"$/g, '').toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
  );

  const idx = {
    name:          headers.findIndex(h => h.includes('nombre') || h === 'name'),
    identity_card: headers.findIndex(h => h.includes('cedula') || h.includes('identity')),
    phone:         headers.findIndex(h => h.includes('telefono') || h === 'phone'),
    address:       headers.findIndex(h => h.includes('direccion') || h === 'address'),
  };

  if (idx.name === -1 || idx.identity_card === -1) return null;

  return lines.slice(1)
    .map(line => {
      const cols = splitCSVLine(line, sep).map(c => c.trim().replace(/^"|"$/g, ''));
      return {
        name:          cols[idx.name]          || '',
        identity_card: cols[idx.identity_card] || '',
        phone:         idx.phone  !== -1 ? (cols[idx.phone]  || '') : '',
        address:       idx.address !== -1 ? (cols[idx.address] || '') : '',
      };
    })
    .filter(r => r.name && r.identity_card);
};

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
  const [importPreview, setImportPreview] = useState([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const debounceRef = useRef(null);
  const importRef = useRef(null);
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
    axios.get('http://localhost:3000/customers', { params })
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
    axios.delete(`http://localhost:3000/customers/${id}`)
      .then(() => {
        toast.success('Cliente eliminado');
        loadCustomers(search.trim(), page);
      })
      .catch(err => toast.error(err.response?.data?.error || 'Error al procesar la solicitud'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.name.trim()) errs.name = 'El nombre es obligatorio';
    if (!formData.identity_card.trim()) errs.identity_card = 'La cédula es obligatoria';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    const request = editingCustomer
      ? axios.put(`http://localhost:3000/customers/${editingCustomer.id}`, formData)
      : axios.post('http://localhost:3000/customers', formData);

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
      const res  = await axios.get('http://localhost:3000/customers', { params });
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

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    e.target.value = '';
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseCustomersCSV(ev.target.result);
      if (parsed === null) {
        toast.error('El CSV debe tener columnas "Nombre" y "Cédula"');
        return;
      }
      if (parsed.length === 0) {
        toast.error('No se encontraron filas válidas en el archivo');
        return;
      }
      setImportPreview(parsed);
      setShowImportModal(true);
    };
    reader.readAsText(file, 'UTF-8');
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      const res = await axios.post('http://localhost:3000/customers/import', { customers: importPreview });
      const { inserted, skipped } = res.data;
      toast.success(`${inserted} clientes importados${skipped ? ` · ${skipped} duplicados omitidos` : ''}`);
      setShowImportModal(false);
      setImportPreview([]);
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

      <input ref={importRef} type="file" accept=".csv" className="d-none" onChange={handleFileSelect} />

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
            onClick={() => importRef.current.click()}
            title="Importar clientes desde CSV"
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
                    <td className="px-4 py-2">{c.identity_card}</td>
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

      {showImportModal && (
        <>
          <div className="modal-backdrop fade show" onClick={() => !importing && setShowImportModal(false)} />
          <div className="modal fade show d-block" tabIndex="-1">
            <div className="modal-dialog modal-lg modal-dialog-scrollable">
              <div className="modal-content">
                <div className="modal-header">
                  <h5 className="modal-title">
                    <i className="bi bi-file-earmark-arrow-up me-2"></i>
                    Importar Clientes desde CSV
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setShowImportModal(false)}
                    disabled={importing}
                  />
                </div>
                <div className="modal-body">
                  <p className="text-muted small mb-3">
                    Se encontraron <strong>{importPreview.length}</strong> clientes en el archivo.
                    Las cédulas ya registradas serán omitidas automáticamente.
                  </p>
                  <div className="table-responsive">
                    <table className="table table-sm table-bordered mb-0">
                      <thead className="table-light">
                        <tr>
                          <th>Nombre</th>
                          <th>Cédula</th>
                          <th>Teléfono</th>
                          <th>Dirección</th>
                        </tr>
                      </thead>
                      <tbody>
                        {importPreview.slice(0, 10).map((r, i) => (
                          <tr key={i}>
                            <td>{r.name}</td>
                            <td>{r.identity_card}</td>
                            <td>{r.phone || '-'}</td>
                            <td>{r.address || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {importPreview.length > 10 && (
                    <p className="text-muted small mt-2 mb-0">
                      ... y {importPreview.length - 10} filas más
                    </p>
                  )}
                </div>
                <div className="modal-footer">
                  <button
                    className="btn btn-outline-secondary"
                    onClick={() => setShowImportModal(false)}
                    disabled={importing}
                  >
                    Cancelar
                  </button>
                  <button
                    className="btn btn-success"
                    onClick={handleConfirmImport}
                    disabled={importing}
                  >
                    {importing
                      ? <><span className="spinner-border spinner-border-sm me-1" role="status"></span>Importando...</>
                      : <><i className="bi bi-check-lg me-1"></i>Confirmar importación</>
                    }
                  </button>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
};

export default Customers;
