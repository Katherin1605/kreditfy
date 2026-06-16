import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import FormCustomers from '../components/FormCustomers';
import TableSkeleton from '../components/TableSkeleton';
import Pagination from '../components/Pagination';
import useConfirm from '../hooks/useConfirm';

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

  const handlePageChange = (newPage) => {
    setPage(newPage);
  };

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

  return (
    <>
      {confirmModal}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Clientes</h5>
        <button className="btn btn-primary" onClick={handleNew}>
          <i className="bi bi-plus-lg me-1"></i> Nuevo Cliente
        </button>
      </div>

      <div className="mb-3">
        <div className="input-group">
          <span className="input-group-text bg-white">
            <i className="bi bi-search text-muted"></i>
          </span>
          <input
            type="text"
            className="form-control"
            placeholder="Buscar por nombre o cédula..."
            value={search}
            onChange={handleSearchChange}
          />
          {search && (
            <button
              className="btn btn-outline-secondary"
              onClick={() => { setSearch(''); setPage(1); loadCustomers('', 1); }}
            >
              <i className="bi bi-x-lg"></i>
            </button>
          )}
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
                      <button
                        className="btn btn-sm btn-outline-primary me-1"
                        onClick={() => handleEdit(c)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleDelete(c.id)}
                      >
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
