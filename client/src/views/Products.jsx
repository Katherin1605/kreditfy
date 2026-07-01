import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import FormProducts from '../components/FormProducts';
import TableSkeleton from '../components/TableSkeleton';
import AmountDisplay from '../components/AmountDisplay';
import { useExchangeRates } from '../context/ExchangeRatesContext';
import useConfirm from '../hooks/useConfirm';

const Products = () => {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({ name: '', price: '', description: '', stock: '' });
  const [formErrors, setFormErrors] = useState({});
  const { confirmModal, ask } = useConfirm();
  const { rates } = useExchangeRates();

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = () => {
    axios.get('/products')
      .then(res => setProducts(res.data))
      .catch(err => toast.error(err.response?.data?.error || 'Error al cargar productos'))
      .finally(() => setLoading(false));
  };

  const handleNew = () => {
    setFormData({ name: '', price: '', description: '', stock: '' });
    setEditingProduct(null);
    setFormErrors({});
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
    setFormErrors({});
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const ok = await ask('¿Eliminar este producto?');
    if (!ok) return;
    axios.delete(`/products/${id}`)
      .then(() => {
        toast.success('Producto eliminado');
        loadProducts();
      })
      .catch(err => toast.error(err.response?.data?.error || 'Error al procesar la solicitud'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = {};
    if (!formData.name.trim()) errs.name = 'El nombre es obligatorio';
    const priceRaw = parseFloat(formData.price.toString().replace(/,/g, ''));
    if (!formData.price || isNaN(priceRaw)) errs.price = 'El precio es obligatorio';
    if (Object.keys(errs).length) { setFormErrors(errs); return; }
    setFormErrors({});
    const cleanData = { ...formData, price: priceRaw };
    const request = editingProduct
      ? axios.put(`/products/${editingProduct.id}`, cleanData)
      : axios.post('/products', cleanData);
    request
      .then(() => {
        toast.success(editingProduct ? 'Producto actualizado' : 'Producto creado');
        resetForm();
        loadProducts();
      })
      .catch(err => {
        const msg = err.response?.data?.error || 'Error al procesar la solicitud';
        const lower = msg.toLowerCase();
        if (lower.includes('nombre') && lower.includes('exist')) {
          setFormErrors({ name: 'Ya existe un producto con ese nombre' });
        } else if (lower.includes('precio')) {
          setFormErrors({ price: msg });
        } else if (lower.includes('stock')) {
          setFormErrors({ stock: msg });
        } else {
          toast.error(msg);
        }
      });
  };

  const resetForm = () => {
    setFormData({ name: '', price: '', description: '', stock: '' });
    setEditingProduct(null);
    setFormErrors({});
    setShowForm(false);
  };

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {confirmModal}
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
          errors={formErrors}
        />
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="sales-table-head">
              <tr>
                <th className="px-4 py-3">Nombre</th>
                <th className="px-4 py-3">Descripción</th>
                <th className="px-4 py-3">Precio</th>
                <th className="px-4 py-3">Stock</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={5} />
              ) : filteredProducts.length === 0 ? (
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
                    <td className="px-4 py-2"><AmountDisplay amount={p.price} rates={rates} /></td>
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
      </div>
    </>
  );
};

export default Products;
