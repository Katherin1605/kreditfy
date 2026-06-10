import { useState, useEffect } from 'react';
import axios from 'axios';
import FormProducts from '../components/FormProducts';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', description: '', stock: '' });

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    axios.get('http://localhost:3000/products')
      .then(res => setProducts(res.data))
      .catch(err => alert(err.response?.data?.error || 'Error al procesar la solicitud'));
  };

  const handleNew = () => {
    setFormData({ name: '', price: '', description: '', stock: '' });
    setEditingProduct(null);
    setShowForm(true);
  };

  const handleEdit = (product) => {
    setFormData({
      name: product.name,
      price: product.price.toString(),
      description: product.description || '',
      stock: product.stock !== undefined ? product.stock.toString() : '',
    });
    setEditingProduct(product);
    setShowForm(true);
  };

  const handleDelete = (id) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    axios.delete(`http://localhost:3000/products/${id}`)
      .then(() => loadProducts())
      .catch(err => alert(err.response?.data?.error || 'Error al procesar la solicitud'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const request = editingProduct
      ? axios.put(`http://localhost:3000/products/${editingProduct.id}`, formData)
      : axios.post('http://localhost:3000/products', formData);
    request
      .then(() => { resetForm(); loadProducts(); })
      .catch(err => alert(err.response?.data?.error || 'Error al procesar la solicitud'));
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', description: '', stock: '' });
    setEditingProduct(null);
    setShowForm(false);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Productos</h5>
        <div className="d-flex gap-2 align-items-center">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ minWidth: '200px' }}
            />
          </div>
          <button className="btn btn-primary text-nowrap" onClick={handleNew}>
            <i className="bi bi-plus-lg me-1"></i> Nuevo Producto
          </button>
        </div>
      </div>

      {showForm && (
        <FormProducts
          formData={formData}
          setFormData={setFormData}
          editingProduct={editingProduct}
          onSubmit={handleSubmit}
          onClose={resetForm}
        />
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <table className="table table-hover mb-0">
          <thead style={{ backgroundColor: 'var(--bg-section)' }}>
            <tr>
              <th className="px-4 py-3">Nombre</th>
              <th className="px-4 py-3">Descripción</th>
              <th className="px-4 py-3">Precio</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-5 text-muted">
                  {products.length === 0 ? 'No hay productos registrados' : 'No se encontraron productos con ese nombre'}
                </td>
              </tr>
            ) : (
              filteredProducts.map(p => (
                <tr key={p.id}>
                  <td className="px-4 py-2">{p.name}</td>
                  <td className="px-4 py-2">{p.description || '-'}</td>
                  <td className="px-4 py-2">${parseFloat(p.price).toFixed(2)}</td>
                  <td className="px-4 py-2">{p.stock}</td>
                  <td className="px-4 py-2">
                    <button className="btn btn-sm btn-outline-primary me-1" onClick={() => handleEdit(p)}>
                      <i className="bi bi-pencil"></i>
                    </button>
                    <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(p.id)}>
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

export default Products;
