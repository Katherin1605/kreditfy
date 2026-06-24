import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const fmt = (n) => Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const PlatformDashboard = () => {
  const [stats, setStats] = useState(null);
  const [breakdown, setBreakdown] = useState([]);

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:3000/platform/stats'),
      axios.get('http://localhost:3000/platform/breakdown'),
    ])
      .then(([statsRes, breakdownRes]) => {
        setStats(statsRes.data);
        setBreakdown(breakdownRes.data);
      })
      .catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="mb-4">Panel de Plataforma</h2>

      {stats ? (
        <div className="row g-3 mb-4">
          <div className="col-6 col-md-3">
            <div className="card text-center p-3">
              <div className="fs-2 fw-bold">{stats.active_tenants}</div>
              <div className="text-muted small">Tenants activos</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card text-center p-3">
              <div className="fs-2 fw-bold">{stats.total_tenants}</div>
              <div className="text-muted small">Total tenants</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card text-center p-3">
              <div className="fs-2 fw-bold">{stats.total_customers}</div>
              <div className="text-muted small">Clientes totales</div>
            </div>
          </div>
          <div className="col-6 col-md-3">
            <div className="card text-center p-3">
              <div className="fs-2 fw-bold">{stats.total_sales}</div>
              <div className="text-muted small">Ventas totales</div>
            </div>
          </div>
        </div>
      ) : (
        <p className="text-muted">Cargando estadísticas...</p>
      )}

      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Desglose por tenant</h5>
      </div>
      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr className="customers-table-head">
                <th>Tenant</th>
                <th>Estado</th>
                <th className="text-end">Clientes</th>
                <th className="text-end">Ventas</th>
                <th className="text-end">Ingresos totales</th>
                <th className="text-end">Ventas pendientes</th>
                <th className="text-end">Saldo pendiente</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {breakdown.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center text-muted py-4">Sin tenants registrados</td>
                </tr>
              ) : breakdown.map(t => (
                <tr key={t.id}>
                  <td>
                    <div className="fw-semibold">{t.name}</div>
                    <div className="text-muted small"><code>{t.slug}</code></div>
                  </td>
                  <td>
                    <span className={`badge ${t.active ? 'bg-success' : 'bg-secondary'}`}>
                      {t.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-end">{t.total_customers}</td>
                  <td className="text-end">{t.total_sales}</td>
                  <td className="text-end">${fmt(t.total_revenue)}</td>
                  <td className="text-end">
                    {t.pending_sales > 0
                      ? <span className="badge bg-warning text-dark">{t.pending_sales}</span>
                      : <span className="text-muted">—</span>}
                  </td>
                  <td className="text-end">
                    {Number(t.pending_balance) > 0
                      ? <span className="text-danger fw-semibold">${fmt(t.pending_balance)}</span>
                      : <span className="text-success">$0.00</span>}
                  </td>
                  <td>
                    <Link to={`/platform/tenants/${t.id}`} className="btn btn-outline-secondary btn-sm">
                      <i className="bi bi-arrow-right"></i>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PlatformDashboard;
