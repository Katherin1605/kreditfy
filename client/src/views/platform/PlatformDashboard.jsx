import { useEffect, useState } from 'react';
import axios from 'axios';

const PlatformDashboard = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:3000/platform/stats')
      .then(res => setStats(res.data))
      .catch(() => {});
  }, []);

  return (
    <div>
      <h2 className="mb-4">Panel de Plataforma</h2>
      {stats ? (
        <div className="row g-3">
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
    </div>
  );
};

export default PlatformDashboard;
