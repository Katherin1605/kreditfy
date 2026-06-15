import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const METRICS = [
  { key: 'totalVentas',      label: 'Total Ventas',      icon: 'bi-currency-dollar', iconClass: 'metric-icon-primary' },
  { key: 'totalCobrado',     label: 'Total Cobrado',     icon: 'bi-check-circle',    iconClass: 'metric-icon-success' },
  { key: 'saldoPendiente',   label: 'Saldo Pendiente',   icon: 'bi-clock-history',   iconClass: 'metric-icon-warning' },
  { key: 'totalClientes',    label: 'Clientes',          icon: 'bi-people',          iconClass: 'metric-icon-info'    },
  { key: 'totalProductos',   label: 'Productos',         icon: 'bi-box-seam',        iconClass: 'metric-icon-purple'  },
  { key: 'ventasPendientes', label: 'Ventas Pendientes', icon: 'bi-receipt',         iconClass: 'metric-icon-danger'  },
];

const formatMonth = (monthStr) => {
  const d = new Date(monthStr);
  return d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
};

const Dashboard = () => {
  const { currentAdmin } = useAuth();
  const [stats, setStats] = useState(null);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:3000/dashboard/stats'),
      axios.get('http://localhost:3000/dashboard/monthly-stats'),
    ])
      .then(([statsRes, monthlyRes]) => {
        setStats(statsRes.data);
        setMonthlyStats(monthlyRes.data);
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const fmt = (n) => `$${parseFloat(n || 0).toFixed(2)}`;

  const chartData = monthlyStats.map(m => ({
    mes: formatMonth(m.month),
    Ventas: parseFloat(m.total_ventas),
    Cobrado: parseFloat(m.total_cobrado),
  }));

  const values = stats ? {
    totalVentas:      fmt(stats.total_ventas),
    totalCobrado:     fmt(stats.total_cobrado),
    saldoPendiente:   fmt(stats.saldo_pendiente),
    totalClientes:    stats.total_clientes,
    totalProductos:   stats.total_productos,
    ventasPendientes: stats.ventas_pendientes,
  } : {};

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

      <div className="card border-0 shadow-sm mb-4">
        <div className="card-header dashboard-card-header">
          <i className="bi bi-bar-chart me-2"></i>Ventas últimos 6 meses
        </div>
        <div className="card-body">
          {chartData.length === 0 ? (
            <div className="text-center text-muted py-4">Sin datos de ventas en los últimos 6 meses</div>
          ) : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mes" />
                <YAxis />
                <Tooltip formatter={(value) => `$${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="Ventas" fill="#4e1da9" />
                <Bar dataKey="Cobrado" fill="#157347" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      <div className="row g-3">

        <div className="col-lg-7">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header dashboard-card-header">
              <i className="bi bi-clock-history me-2"></i>Pagos Pendientes
            </div>
            <div className="card-body p-0">
              {stats.pending_sales.length === 0 ? (
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
                    {stats.pending_sales.map(s => (
                      <tr key={s.id}>
                        <td className="px-3 py-2">
                          <span className="badge bg-light text-dark border">#{s.id}</span>
                        </td>
                        <td className="px-3 py-2">{s.customer_name || '-'}</td>
                        <td className="px-3 py-2">{fmt(s.total)}</td>
                        <td className="px-3 py-2 text-success">{fmt(s.total_paid)}</td>
                        <td className="px-3 py-2 fw-bold text-warning">{fmt(s.balance)}</td>
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
              {stats.low_stock_products.length > 0 && (
                <span className="badge bg-danger ms-2">{stats.low_stock_products.length}</span>
              )}
            </div>
            <div className="card-body p-0">
              {stats.low_stock_products.length === 0 ? (
                <div className="text-center py-4 text-muted">
                  <i className="bi bi-check-circle fs-3 text-success d-block mb-2"></i>
                  Todos los productos tienen stock suficiente
                </div>
              ) : (
                <ul className="list-group list-group-flush">
                  {stats.low_stock_products.map(p => (
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
