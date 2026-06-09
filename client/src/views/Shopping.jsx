import { useState, useEffect } from 'react';
import axios from 'axios';
import FormShopping from '../components/FormShopping';

const Shopping = () => {
  const [shopping, setShopping] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ product_id: '', quantity: '', cost: '' });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    Promise.all([
      axios.get('http://localhost:3000/shopping'),
      axios.get('http://localhost:3000/products'),
    ])
      .then(([shoppingRes, productsRes]) => {
        setShopping(shoppingRes.data);
        setProducts(productsRes.data);
      })
      .catch(err => alert(err.response?.data?.error || 'Error al cargar los datos'));
  };

  const handleNew = () => {
    setFormData({ product_id: '', quantity: '', cost: '' });
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('¿Seguro que deseas eliminar esta compra?')) return;
    axios.delete(`http://localhost:3000/shopping/${id}`)
      .then(() => loadData())
      .catch(err => alert(err.response?.data?.error || 'Error al eliminar'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    axios.post('http://localhost:3000/shopping', formData)
      .then(() => {
        setFormData({ product_id: '', quantity: '', cost: '' });
        setShowForm(false);
        loadData();
      })
      .catch(err => alert(err.response?.data?.error || 'Error al procesar la solicitud'));
  };

  const resetForm = () => {
    setFormData({ product_id: '', quantity: '', cost: '' });
    setShowForm(false);
  };

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Compras</h5>
        <button className="btn btn-primary" onClick={handleNew}>
          <i className="bi bi-plus-lg me-1"></i> Nueva Compra
        </button>
      </div>

      {showForm && (
        <FormShopping
          formData={formData}
          setFormData={setFormData}
          products={products}
          onSubmit={handleSubmit}
          onClose={resetForm}
        />
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="table table-hover mb-0">
          <thead style={{ backgroundColor: 'var(--bg-section)' }}>
            <tr>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Cantidad</th>
              <th className="px-4 py-3">Costo</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {shopping.length === 0 ? (
              <tr>
                <td className="text-center px-4 py-5 text-secondary" colSpan={5}>
                  No hay compras registradas
                </td>
              </tr>
            ) : (
              shopping.map(row => (
                <tr key={row.id}>
                  <td className="px-4 py-3">{new Date(row.date).toLocaleDateString()}</td>
                  <td className="px-4 py-3">{products.find(p => p.id === row.product_id)?.name || '-'}</td>
                  <td className="px-4 py-3">{row.quantity}</td>
                  <td className="px-4 py-3">${parseFloat(row.cost).toFixed(2)}</td>
                  <td className="px-4 py-3">
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => handleDelete(row.id)}
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
    </>
  );
};

export default Shopping;
