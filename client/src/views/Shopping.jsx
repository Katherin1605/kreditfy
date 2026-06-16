import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import FormShopping from '../components/FormShopping';
import TableSkeleton from '../components/TableSkeleton';
import useConfirm from '../hooks/useConfirm';

const Shopping = () => {
  const [shopping, setShopping] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({ product_id: '', quantity: '', cost: '' });
  const { confirmModal, ask } = useConfirm();

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
      .catch(err => toast.error(err.response?.data?.error || 'Error al cargar los datos'))
      .finally(() => setLoading(false));
  };

  const handleNew = () => {
    setFormData({ product_id: '', quantity: '', cost: '' });
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const ok = await ask('¿Seguro que deseas eliminar esta compra?');
    if (!ok) return;
    axios.delete(`http://localhost:3000/shopping/${id}`)
      .then(() => {
        toast.success('Compra eliminada');
        loadData();
      })
      .catch(err => toast.error(err.response?.data?.error || 'Error al eliminar'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.product_id) {
      toast.error('Selecciona un producto');
      return;
    }
    if (!formData.quantity || parseInt(formData.quantity) < 1) {
      toast.error('Ingresa una cantidad válida');
      return;
    }
    if (!formData.cost || parseFloat(formData.cost) < 0) {
      toast.error('Ingresa un costo válido');
      return;
    }
    axios.post('http://localhost:3000/shopping', formData)
      .then(() => {
        toast.success('Compra registrada');
        setFormData({ product_id: '', quantity: '', cost: '' });
        setShowForm(false);
        loadData();
      })
      .catch(err => toast.error(err.response?.data?.error || 'Error al procesar la solicitud'));
  };

  const resetForm = () => {
    setFormData({ product_id: '', quantity: '', cost: '' });
    setShowForm(false);
  };

  return (
    <>
      {confirmModal}
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
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="sales-table-head">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Costo</th>
                <th className="px-4 py-3">Ganancia</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={6} />
              ) : shopping.length === 0 ? (
                <tr>
                  <td className="text-center px-4 py-5 text-secondary" colSpan={6}>
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
                      {(() => {
                        const product = products.find(p => p.id === row.product_id);
                        if (!product) return '-';
                        const ganancia = (parseFloat(product.price) - parseFloat(row.cost)) * row.quantity;
                        return <span className={ganancia >= 0 ? 'text-success' : 'text-danger'}>${ganancia.toFixed(2)}</span>;
                      })()}
                    </td>
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
      </div>
    </>
  );
};

export default Shopping;
