import { useState, useEffect } from 'react';
import axios from 'axios';
import FormCustomers from '../components/FormCustomers';

const Customers = () => {
  const [customers, setCustomers] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [formData, setFormData] = useState({ name: '', identity_card: '', phone: '', address: '' });

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = () => {
    axios.get('http://localhost:3000/customers')
      .then(res => setCustomers(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingCustomer(null);
    setFormData({ name: '', identity_card: '', phone: '', address: '' });
  };

  const handleNew = () => {
    setEditingCustomer(null);
    setFormData({ name: '', identity_card: '', phone: '', address: '' });
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
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('¿Está seguro de eliminar este cliente?')) return;
    axios.delete(`http://localhost:3000/customers/${id}`)
      .then(() => loadCustomers())
      .catch(err => alert(err.response?.data?.error || 'Error al procesar la solicitud'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const request = editingCustomer
      ? axios.put(`http://localhost:3000/customers/${editingCustomer.id}`, formData)
      : axios.post('http://localhost:3000/customers', formData);

    request
      .then(() => {
        resetForm();
        loadCustomers();
      })
      .catch(err => alert(err.response?.data?.error || 'Error al procesar la solicitud'));
  };

  if (loading) return (
    <div className="text-center py-5 text-muted">
      <div className="spinner-border text-primary mb-3" role="status"></div>
      <p>Cargando...</p>
    </div>
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Clientes</h5>
        <button className="btn btn-primary" onClick={handleNew}>
          <i className="bi bi-plus-lg me-1"></i> Nuevo Cliente
        </button>
      </div>

      {showForm && (
        <FormCustomers
          formData={formData}
          setFormData={setFormData}
          editingCustomer={editingCustomer}
          onSubmit={handleSubmit}
          onClose={resetForm}
        />
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead style={{ backgroundColor: 'var(--bg-section)' }}>
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Cédula</th>
                <th className="px-4 py-3">Teléfono</th>
                <th className="px-4 py-3">Dirección</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {customers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-5 text-muted">
                    No hay clientes registrados
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
    </>
  );
};

export default Customers;
