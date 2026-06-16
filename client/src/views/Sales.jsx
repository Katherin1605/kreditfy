import { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import FormSales from '../components/FormSales';
import TableSkeleton from '../components/TableSkeleton';
import Pagination from '../components/Pagination';
import useConfirm from '../hooks/useConfirm';

const Sales = () => {
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [expandedId, setExpandedId] = useState(null);
  const [saleDetails, setSaleDetails] = useState({});
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [items, setItems] = useState([]);
  const [editingSale, setEditingSale] = useState(null);
  const [cuotas, setCuotas] = useState('1');
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });
  const debounceRef = useRef(null);
  const { confirmModal, ask } = useConfirm();

  useEffect(() => {
    loadCatalogs();
  }, []);

  useEffect(() => {
    loadSales(search, page);
  }, [page]);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setPage(1);
      loadSales(search, 1);
    }, 350);
  }, [search]);

  const loadCatalogs = () => {
    Promise.all([
      axios.get('http://localhost:3000/customers', { params: { limit: 500 } }),
      axios.get('http://localhost:3000/products'),
    ])
      .then(([customersRes, productsRes]) => {
        const cData = customersRes.data;
        setCustomers(Array.isArray(cData) ? cData : (cData.data || []));
        setProducts(productsRes.data);
      })
      .catch(err => console.error(err));
  };

  const loadSales = (q = '', p = 1) => {
    setLoading(true);
    const params = { page: p, limit: 15 };
    if (q) params.q = q;
    axios.get('http://localhost:3000/sales', { params })
      .then(res => {
        const data = res.data;
        if (Array.isArray(data)) {
          setSales(data);
          setPagination({ total: data.length, totalPages: 1 });
        } else {
          setSales(data.data || []);
          setPagination({ total: data.total || 0, totalPages: data.totalPages || 1 });
        }
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const toggleDetail = (saleId) => {
    if (expandedId === saleId) {
      setExpandedId(null);
      return;
    }
    setExpandedId(saleId);
    if (!saleDetails[saleId]) {
      axios.get(`http://localhost:3000/sales/${saleId}`)
        .then(res => {
          setSaleDetails(prev => ({ ...prev, [saleId]: res.data }));
        })
        .catch(err => toast.error(err.response?.data?.error || 'Error al cargar los detalles'));
    }
  };

  const resetForm = () => {
    setSelectedCustomerId('');
    setItems([]);
    setShowForm(false);
    setEditingSale(null);
    setCuotas('1');
    setSaleDate(new Date().toISOString().split('T')[0]);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedCustomerId) {
      toast.error('Selecciona un cliente para continuar');
      return;
    }
    if (items.length === 0) {
      toast.error('Agrega al menos un producto a la venta');
      return;
    }
    const payload = {
      customer_id: parseInt(selectedCustomerId),
      cuotas: parseInt(cuotas) || 1,
      sale_date: saleDate,
      products: items.map(i => ({
        product_id: i.product_id,
        quantity: i.quantity,
        price: i.price,
      })),
    };
    if (editingSale) {
      axios.put(`http://localhost:3000/sales/${editingSale.id}`, payload)
        .then(() => {
          toast.success('Venta actualizada');
          resetForm();
          loadSales(search, page);
        })
        .catch(err => toast.error(err.response?.data?.error || 'Error al actualizar la venta'));
    } else {
      axios.post('http://localhost:3000/sales', payload)
        .then(() => {
          toast.success('Venta creada');
          resetForm();
          loadSales(search, page);
        })
        .catch(err => toast.error(err.response?.data?.error || 'Error al crear la venta'));
    }
  };

  const handleEdit = async (sale) => {
    try {
      const res = await axios.get(`http://localhost:3000/sales/${sale.id}`);
      const detail = res.data;
      setEditingSale(sale);
      setSelectedCustomerId(sale.customer_id.toString());
      setItems(detail.details.map(d => ({
        product_id: d.product_id,
        product_name: d.product_name,
        quantity: d.quantity,
        price: parseFloat(d.price),
        subtotal: d.quantity * parseFloat(d.price),
      })));
      setCuotas(detail.cuotas?.toString() || '1');
      setSaleDate(detail.sale_date ? detail.sale_date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setShowForm(true);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cargar la venta');
    }
  };

  const handleDelete = async (saleId) => {
    const ok = await ask('¿Eliminar esta venta? El stock de los productos será restaurado.');
    if (!ok) return;
    axios.delete(`http://localhost:3000/sales/${saleId}`)
      .then(() => {
        toast.success('Venta eliminada');
        loadSales(search, page);
      })
      .catch(err => toast.error(err.response?.data?.error || 'Error al eliminar la venta'));
  };

  return (
    <>
      {confirmModal}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-0">Ventas a Crédito</h5>
        </div>
        <div className="d-flex gap-2 align-items-center">
          <div className="input-group sales-search-input">
            <span className="input-group-text bg-white border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Buscar por ID, cliente..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <button className="btn btn-primary text-nowrap" onClick={() => setShowForm(true)}>
            <i className="bi bi-plus-lg me-1"></i>
            Nueva Venta
          </button>
        </div>
      </div>

      {showForm && (
        <FormSales
          customers={customers}
          products={products}
          selectedCustomerId={selectedCustomerId}
          setSelectedCustomerId={setSelectedCustomerId}
          items={items}
          setItems={setItems}
          editingSale={editingSale}
          cuotas={cuotas}
          setCuotas={setCuotas}
          saleDate={saleDate}
          setSaleDate={setSaleDate}
          onSubmit={handleSubmit}
          onClose={resetForm}
        />
      )}

      <div className="rounded shadow overflow-hidden">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead className="sales-table-head">
              <tr>
                <th className="px-4 py-2">#ID</th>
                <th className="px-4 py-2">Fecha</th>
                <th className="px-4 py-2">Cliente</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Cuotas</th>
                <th className="px-4 py-2">Pagado</th>
                <th className="px-4 py-2">Saldo</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableSkeleton cols={9} />
              ) : sales.length === 0 ? (
                <tr>
                  <td className="text-center px-4 py-5 text-secondary" colSpan={9}>
                    {pagination.total === 0 && !search ? 'No hay ventas registradas' : 'No se encontraron ventas con ese criterio'}
                  </td>
                </tr>
              ) : (
                sales.map(s => (
                  <>
                    <tr key={s.id}>
                      <td className="px-4 py-2">
                        <span className="badge bg-light text-dark border">#{s.id}</span>
                      </td>
                      <td className="px-4 py-2">
                        {new Date(s.sale_date || s.created_at).toLocaleDateString('es-ES')}
                      </td>
                      <td className="px-4 py-2">{s.customer_name || '-'}</td>
                      <td className="px-4 py-2">${parseFloat(s.total).toFixed(2)}</td>
                      <td className="px-4 py-2">
                        <span>{s.cuotas} cuotas</span><br />
                        <small className="text-muted">${parseFloat(s.valor_cuota || 0).toFixed(2)}/c.</small>
                      </td>
                      <td className="px-4 py-2 text-success">
                        ${parseFloat(s.total_paid).toFixed(2)}
                      </td>
                      <td className="px-4 py-2 text-warning">
                        ${parseFloat(s.balance).toFixed(2)}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`badge ${s.status === 'paid' ? 'bg-success' : 'bg-warning text-dark'}`}>
                          {s.status === 'paid' ? 'Pagado' : 'Pendiente'}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <button
                          className="btn btn-sm btn-outline-secondary me-1"
                          onClick={() => toggleDetail(s.id)}
                          title="Ver productos"
                        >
                          <i className={`bi ${expandedId === s.id ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-primary me-1"
                          onClick={() => handleEdit(s)}
                          title="Editar"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(s.id)}
                          title="Eliminar"
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      </td>
                    </tr>
                    {expandedId === s.id && (
                      <tr key={`detail-${s.id}`} className="table-light">
                        <td colSpan={9} className="px-4 py-3">
                          {saleDetails[s.id] ? (
                            <table className="table table-sm mb-0">
                              <thead>
                                <tr>
                                  <th>Producto</th>
                                  <th>Cantidad</th>
                                  <th>Precio Unit.</th>
                                  <th>Subtotal</th>
                                </tr>
                              </thead>
                              <tbody>
                                {saleDetails[s.id].details.map(d => (
                                  <tr key={d.id}>
                                    <td>{d.product_name}</td>
                                    <td>{d.quantity}</td>
                                    <td>${parseFloat(d.price).toFixed(2)}</td>
                                    <td>${(d.quantity * parseFloat(d.price)).toFixed(2)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          ) : (
                            <span className="text-muted">Cargando...</span>
                          )}
                        </td>
                      </tr>
                    )}
                  </>
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
        onPageChange={setPage}
      />
    </>
  );
};

export default Sales;
