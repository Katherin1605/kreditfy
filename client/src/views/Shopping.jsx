import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { formatDate } from '../utils/currency';
import { useExchangeRates } from '../context/ExchangeRatesContext';
import AmountDisplay from '../components/AmountDisplay';
import FormShopping from '../components/FormShopping';
import TableSkeleton from '../components/TableSkeleton';
import useConfirm from '../hooks/useConfirm';

const Shopping = () => {
  const [shopping, setShopping] = useState([]);
  const [products, setProducts] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [formData, setFormData] = useState({ product_id: '', quantity: '', cost: '', date: new Date().toISOString().split('T')[0], exchange_rate: '' });
  const { confirmModal, ask } = useConfirm();
  const { rates } = useExchangeRates();

  const [mYear, mMonth] = selectedMonth.split('-').map(Number);
  const monthFrom = `${selectedMonth}-01`;
  const monthTo   = new Date(mYear, mMonth, 0).toISOString().split('T')[0];

  useEffect(() => {
    loadProducts();
  }, []);

  useEffect(() => {
    loadShopping();
  }, [selectedMonth]);

  const loadProducts = () => {
    axios.get('/products')
      .then(res => setProducts(res.data))
      .catch(() => {});
  };

  const loadData = () => {
    loadShopping();
    loadProducts();
  };

  const loadShopping = () => {
    setLoading(true);
    axios.get('/shopping', { params: { date_from: monthFrom, date_to: monthTo } })
      .then(res => setShopping(res.data))
      .catch(err => toast.error(err.response?.data?.error || 'Error al cargar las compras'))
      .finally(() => setLoading(false));
  };

  const handleNew = () => {
    const today = new Date().toISOString().split('T')[0];
    setFormData({ product_id: '', quantity: '', cost: '', date: today, exchange_rate: rates.USD ? String(rates.USD) : '' });
    setShowForm(true);
  };

  const handleDateChange = (date) => {
    axios.get('/exchange-rates', { params: { date } })
      .then(res => {
        if (res.data.USD) {
          setFormData(prev => ({ ...prev, exchange_rate: String(res.data.USD) }));
        }
      })
      .catch(() => {});
  };

  const handleDelete = async (id) => {
    const ok = await ask('¿Seguro que deseas eliminar esta compra?');
    if (!ok) return;
    axios.delete(`/shopping/${id}`)
      .then(() => {
        toast.success('Compra eliminada');
        loadShopping();
      })
      .catch(err => toast.error(err.response?.data?.error || 'Error al eliminar'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.product_id) { toast.error('Selecciona un producto'); return; }
    if (!formData.quantity || parseInt(formData.quantity) < 1) { toast.error('Ingresa una cantidad válida'); return; }
    const costRaw = parseFloat(formData.cost.toString().replace(/,/g, ''));
    if (isNaN(costRaw) || costRaw < 0) { toast.error('Ingresa un costo válido'); return; }
    axios.post('/shopping', { ...formData, cost: costRaw, exchange_rate: parseFloat(formData.exchange_rate) || null })
      .then(() => {
        toast.success('Compra registrada');
        setFormData({ product_id: '', quantity: '', cost: '', date: new Date().toISOString().split('T')[0], exchange_rate: '' });
        setShowForm(false);
        loadShopping();
      })
      .catch(err => toast.error(err.response?.data?.error || 'Error al procesar la solicitud'));
  };

  const resetForm = () => {
    setFormData({ product_id: '', quantity: '', cost: '', date: new Date().toISOString().split('T')[0], exchange_rate: '' });
    setShowForm(false);
  };

  return (
    <>
      {confirmModal}
      <div className="d-flex justify-content-between align-items-center flex-wrap gap-3 mb-3">
        <h5 className="mb-0">Compras</h5>
        <div className="d-flex align-items-center gap-2">
          <span className="text-muted small">Período:</span>
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => {
              const [y, m] = selectedMonth.split('-').map(Number);
              const prev = new Date(y, m - 2, 1);
              setSelectedMonth(`${prev.getFullYear()}-${String(prev.getMonth() + 1).padStart(2, '0')}`);
            }}
          >
            <i className="bi bi-chevron-left"></i>
          </button>
          <input
            type="month"
            className="form-control form-control-sm period-month-input"
            value={selectedMonth}
            max={new Date().toISOString().slice(0, 7)}
            onChange={e => setSelectedMonth(e.target.value)}
          />
          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={() => {
              const [y, m] = selectedMonth.split('-').map(Number);
              const next = new Date(y, m, 1);
              setSelectedMonth(`${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, '0')}`);
            }}
            disabled={selectedMonth >= new Date().toISOString().slice(0, 7)}
          >
            <i className="bi bi-chevron-right"></i>
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleNew}>
            <i className="bi bi-plus-lg me-1"></i>Nueva Compra
          </button>
        </div>
      </div>

      {showForm && (
        <FormShopping
          formData={formData}
          setFormData={setFormData}
          products={products}
          onSubmit={handleSubmit}
          onClose={resetForm}
          onDateChange={handleDateChange}
        />
      )}

      <div className="bg-white rounded shadow overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="sales-table-head">
              <tr>
                <th className="px-4 py-3">Fecha</th>
                <th className="px-4 py-3">Producto</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Cantidad</th>
                <th className="px-4 py-3">Moneda</th>
                <th className="px-4 py-3">Costo Unit.</th>
                <th className="px-4 py-3">Total Costo</th>
                <th className="px-4 py-3">Ganancia</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={9} />
              ) : shopping.length === 0 ? (
                <tr>
                  <td className="text-center px-4 py-5 text-secondary" colSpan={9}>
                    No hay compras registradas
                  </td>
                </tr>
              ) : (
                shopping.map(row => (
                  <tr key={row.id}>
                    <td className="px-4 py-3">{formatDate(row.date)}</td>
                    <td className="px-4 py-3">{products.find(p => p.id === row.product_id)?.name || '-'}</td>
                    <td className="px-4 py-3">
                      {(() => {
                        const sku = products.find(p => p.id === row.product_id)?.sku;
                        return sku
                          ? <span className="badge bg-light text-secondary border">{sku}</span>
                          : <span className="text-muted">—</span>;
                      })()}
                    </td>
                    <td className="px-4 py-3">{row.quantity}</td>
                    <td className="px-4 py-3">
                      <span className="badge bg-light text-dark border">Bs</span>
                    </td>
                    <td className="px-4 py-3">
                      <AmountDisplay amount={row.cost} rates={rates} storedRate={row.exchange_rate} />
                    </td>
                    <td className="px-4 py-3">
                      <AmountDisplay amount={parseFloat(row.cost) * row.quantity} rates={rates} storedRate={row.exchange_rate} />
                    </td>
                    <td className="px-4 py-3">
                      {(() => {
                        const product = products.find(p => p.id === row.product_id);
                        if (!product) return '-';
                        const ganancia = (parseFloat(product.price) - parseFloat(row.cost)) * row.quantity;
                        return (
                          <span className={ganancia >= 0 ? 'text-success' : 'text-danger'}>
                            <AmountDisplay amount={ganancia} rates={rates} storedRate={row.exchange_rate} />
                          </span>
                        );
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
