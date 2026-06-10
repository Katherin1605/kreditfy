import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const METRICS = [
  { key: 'totalVentas',      label: 'Total Ventas',      icon: 'bi-currency-dollar', iconClass: 'metric-icon-primary' },
  { key: 'totalCobrado',     label: 'Total Cobrado',     icon: 'bi-check-circle',    iconClass: 'metric-icon-success' },
  { key: 'saldoPendiente',   label: 'Saldo Pendiente',   icon: 'bi-clock-history',   iconClass: 'metric-icon-warning' },
  { key: 'totalClientes',    label: 'Clientes',          icon: 'bi-people',          iconClass: 'metric-icon-info'    },
  { key: 'totalProductos',   label: 'Productos',         icon: 'bi-box-seam',        iconClass: 'metric-icon-purple'  },
  { key: 'ventasPendientes', label: 'Ventas Pendientes', icon: 'bi-receipt',         iconClass: 'metric-icon-danger'  },
];

const Dashboard = () => {
  const { currentAdmin } = useAuth();
  const [sales, setSales] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:3000/sales'),
      axios.get('http://localhost:3000/customers'),
      axios.get('http://localhost:3000/products'),
    ])
      .then(([salesRes, customersRes, productsRes]) => {
        setSales(salesRes.data);
        setCustomers(customersRes.data);
        setProducts(productsRes.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const pendingSales = sales.filter(s => s.status !== 'paid');
  const lowStockProducts = products.filter(p => p.stock <= 5);

  const values = {
    totalVentas:      `$${sales.reduce((s, v) => s + parseFloat(v.total || 0), 0).toFixed(2)}`,
    totalCobrado:     `$${sales.reduce((s, v) => s + parseFloat(v.total_paid || 0), 0).toFixed(2)}`,
    saldoPendiente:   `$${sales.reduce((s, v) => s + parseFloat(v.balance || 0), 0).toFixed(2)}`,
    totalClientes:    customers.length,
    totalProductos:   products.length,
    ventasPendientes: pendingSales.length,
  };

  if (loading) {
    return (
      <div className="text-center py-5 text-muted">
        <div className="spinner-border text-primary mb-3" role="status"></div>
        <p>Cargando dashboard...</p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4">
        <h5 className="mb-0">Dashboard</h5>
        <small className="text-muted">
          Bienvenido, <strong>{currentAdmin?.name}</strong>
        </small>
      </div>

      <div className="row g-3 mb-4">
        {METRICS.map(m => (
          <div key={m.key} className="col-6 col-md-4 col-lg-2">
            <div className="metric-card card h-100">
              <div className="card-body d-flex align-items-center gap-3 p-3">
                <div className={`metric-icon ${m.iconClass}`}>
                  <i className={`bi ${m.icon}`}></i>
                </div>
                <div className="min-w-0">
                  <p className="metric-label">{m.label}</p>
                  <p className="metric-value">{values[m.key]}</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="row g-3">

        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header dashboard-card-header">
              <i className="bi bi-clock-history me-2"></i>Pagos Pendientes
            </div>
            <div className="card-body p-0">
              {pendingSales.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-check-circle fs-3 text-success d-block mb-2"></i>
                  No hay pagos pendientes
                </div>
              ) : (
                <table className="table table-hover dashboard-table mb-0">
                  <thead>
                    <tr>
                      <th className="px-3 py-2">#</th>
                      <th className="px-3 py-2">Cliente</th>
                      <th className="px-3 py-2">Total</th>
                      <th className="px-3 py-2">Cobrado</th>
                      <th className="px-3 py-2">Saldo</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingSales.slice(0, 8).map(s => (
                      <tr key={s.id}>
                        <td className="px-3 py-2">
                          <span className="badge bg-light text-dark border">#{s.id}</span>
                        </td>
                        <td className="px-3 py-2">{s.customer_name || '-'}</td>
                        <td className="px-3 py-2">${parseFloat(s.total).toFixed(2)}</td>
                        <td className="px-3 py-2 text-success">${parseFloat(s.total_paid).toFixed(2)}</td>
                        <td className="px-3 py-2 fw-bold text-warning">${parseFloat(s.balance).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        <div className="col-lg-5">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header dashboard-card-header">
              <i className="bi bi-exclamation-triangle me-2 text-danger"></i>
              Productos con Stock Bajo
              {lowStockProducts.length > 0 && (
                <span className="badge bg-danger ms-2">{lowStockProducts.length}</span>
              )}
            </div>
            <div className="card-body p-0">
              {lowStockProducts.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-check-circle fs-3 text-success d-block mb-2"></i>
                  Todos los productos tienen stock suficiente
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {lowStockProducts.map(p => (
                    <li key={p.id} className="list-group-item d-flex justify-content-between align-items-center px-3 py-2">
                      <span className="dashboard-table">{p.name}</span>
                      <span className={`badge ${p.stock === 0 ? 'bg-danger' : 'bg-warning text-dark'}`}>
                        {p.stock === 0 ? 'Sin stock' : `${p.stock} unid.`}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>

      </div>
    </>
  );
};

export default Dashboard;
