import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const fmtDate = (d) => d
  ? new Date(d).toLocaleString('es-VE', { dateStyle: 'medium', timeStyle: 'short' })
  : '—';

const fmtDateShort = (d) => d
  ? new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' })
  : '—';

const PLAN_COLORS = { basic: 'bg-secondary', pro: 'bg-primary' };

const PlatformDashboard = () => {
  const [stats, setStats]         = useState(null);
  const [breakdown, setBreakdown] = useState([]);
  const [extras, setExtras]       = useState(null);
  const [backupInfo, setBackupInfo] = useState(undefined);
  const [triggering, setTriggering] = useState(false);

  const loadBackupInfo = () =>
    axios.get('/platform/backup-info')
      .then(res => setBackupInfo(res.data))
      .catch(() => setBackupInfo(null));

  useEffect(() => {
    Promise.all([
      axios.get('/platform/stats'),
      axios.get('/platform/breakdown'),
      axios.get('/platform/extras'),
    ])
      .then(([statsRes, breakdownRes, extrasRes]) => {
        setStats(statsRes.data);
        setBreakdown(breakdownRes.data);
        setExtras(extrasRes.data);
      })
      .catch(() => {});
    loadBackupInfo();
  }, []);

  const handleTriggerBackup = async () => {
    setTriggering(true);
    try {
      await axios.post('/platform/backup');
      await loadBackupInfo();
    } catch {}
    finally { setTriggering(false); }
  };

  const totalActivePlans = extras?.plan_distribution?.reduce((s, r) => s + r.count, 0) || 0;

  return (
    <div>
      <h2 className="mb-4">Panel de Control</h2>

      {stats?.pending_tenants > 0 && (
        <div className="alert alert-warning d-flex align-items-center gap-2 mb-4">
          <i className="bi bi-hourglass-split fs-5"></i>
          <div>
            <strong>{stats.pending_tenants} empresa{stats.pending_tenants > 1 ? 's' : ''} pendiente{stats.pending_tenants > 1 ? 's' : ''} de aprobación.</strong>
            {' '}<Link to="/platform/tenants" className="alert-link">Ir a Tenants</Link> para revisar y aprobar.
          </div>
        </div>
      )}

      {/* ── Métricas globales ── */}
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

      {/* ── Tres secciones nuevas ── */}
      <div className="row g-4 mb-4">

        {/* Distribución de planes */}
        <div className="col-md-4">
          <div className="card h-100">
            <div className="card-header dashboard-card-header">
              <i className="bi bi-pie-chart me-2"></i>Distribución de planes
            </div>
            <div className="card-body">
              {!extras ? (
                <p className="text-muted small">Cargando...</p>
              ) : extras.plan_distribution.length === 0 ? (
                <p className="text-muted small">Sin tenants activos</p>
              ) : (
                <>
                  {extras.plan_distribution.map(row => {
                    const pct = totalActivePlans > 0 ? Math.round((row.count / totalActivePlans) * 100) : 0;
                    return (
                      <div key={row.plan} className="mb-3">
                        <div className="d-flex justify-content-between align-items-center mb-1">
                          <span className={`badge ${PLAN_COLORS[row.plan] || 'bg-secondary'} text-capitalize`}>
                            {row.plan}
                          </span>
                          <span className="fw-semibold">{row.count} <span className="text-muted fw-normal small">({pct}%)</span></span>
                        </div>
                        <div className="progress progress-sm">
                          <div
                            className={`progress-bar progress-bar-dynamic ${PLAN_COLORS[row.plan] || 'bg-secondary'}`}
                            style={{ '--bar-width': `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-muted small mb-0 mt-2">
                    {totalActivePlans} tenant{totalActivePlans !== 1 ? 's' : ''} activo{totalActivePlans !== 1 ? 's' : ''} en total
                  </p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tenants registrados recientemente */}
        <div className="col-md-8">
          <div className="card h-100">
            <div className="card-header dashboard-card-header">
              <i className="bi bi-person-plus me-2"></i>Tenants recientes
            </div>
            <div className="card-body p-0">
              {!extras ? (
                <p className="text-muted small p-3">Cargando...</p>
              ) : extras.recent_tenants.length === 0 ? (
                <p className="text-muted small p-3">Sin registros</p>
              ) : (
                <table className="table table-sm table-hover mb-0">
                  <thead className="table-light">
                    <tr>
                      <th className="px-3 py-2">Tenant</th>
                      <th className="px-3 py-2">Plan</th>
                      <th className="px-3 py-2">Estado</th>
                      <th className="px-3 py-2">Registrado</th>
                      <th className="px-3 py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {extras.recent_tenants.map(t => (
                      <tr key={t.id}>
                        <td className="px-3 py-2">
                          <div className="fw-semibold">{t.name}</div>
                          <div className="text-muted small"><code>{t.slug}</code></div>
                        </td>
                        <td className="px-3 py-2">
                          <span className={`badge ${PLAN_COLORS[t.plan] || 'bg-secondary'} text-capitalize`}>{t.plan}</span>
                        </td>
                        <td className="px-3 py-2">
                          {t.pending_review
                            ? <span className="badge bg-warning text-dark">Pendiente</span>
                            : <span className={`badge ${t.active ? 'bg-success' : 'bg-secondary'}`}>{t.active ? 'Activo' : 'Inactivo'}</span>
                          }
                        </td>
                        <td className="px-3 py-2 text-muted small">{fmtDateShort(t.created_at)}</td>
                        <td className="px-3 py-2">
                          <Link to={`/platform/tenants/${t.id}`} className="btn btn-outline-secondary btn-sm">
                            <i className="bi bi-arrow-right"></i>
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tenants sin actividad reciente */}
      {extras?.inactive_tenants?.length > 0 && (
        <div className="card mb-4 border-warning">
          <div className="card-header dashboard-card-header d-flex align-items-center gap-2">
            <i className="bi bi-exclamation-circle text-warning"></i>
            Tenants sin actividad en los últimos 30 días
            <span className="badge bg-warning text-dark ms-1">{extras.inactive_tenants.length}</span>
          </div>
          <div className="card-body p-0">
            <table className="table table-sm table-hover mb-0">
              <thead className="table-light">
                <tr>
                  <th className="px-3 py-2">Tenant</th>
                  <th className="px-3 py-2">Plan</th>
                  <th className="px-3 py-2">Última venta</th>
                  <th className="px-3 py-2">Total ventas</th>
                  <th className="px-3 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {extras.inactive_tenants.map(t => (
                  <tr key={t.id}>
                    <td className="px-3 py-2">
                      <div className="fw-semibold">{t.name}</div>
                      <div className="text-muted small"><code>{t.slug}</code></div>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`badge ${PLAN_COLORS[t.plan] || 'bg-secondary'} text-capitalize`}>{t.plan}</span>
                    </td>
                    <td className="px-3 py-2">
                      {t.last_sale_date
                        ? <span className="text-warning">{fmtDateShort(t.last_sale_date)}</span>
                        : <span className="text-danger">Sin ventas</span>
                      }
                    </td>
                    <td className="px-3 py-2 text-muted">{t.total_sales}</td>
                    <td className="px-3 py-2">
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
      )}

      {/* Backup */}
      <div className="card mb-4">
        <div className="card-body d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <h6 className="mb-1"><i className="bi bi-archive me-2 text-primary"></i>Backup automático</h6>
            {backupInfo === undefined && <span className="text-muted small">Cargando…</span>}
            {backupInfo === null && <span className="text-muted small">Sin backups registrados aún.</span>}
            {backupInfo && (
              <div className="text-muted small">
                Último: <strong>{backupInfo.filename}</strong> —{' '}
                {backupInfo.size_mb} MB · {fmtDate(backupInfo.created_at)}
                <span className="ms-2 badge bg-secondary">{backupInfo.count} archivo(s)</span>
              </div>
            )}
          </div>
          <button
            className="btn btn-outline-primary btn-sm"
            onClick={handleTriggerBackup}
            disabled={triggering}
          >
            <i className="bi bi-arrow-repeat me-1"></i>
            {triggering ? 'Ejecutando…' : 'Ejecutar ahora'}
          </button>
        </div>
      </div>

      {/* Desglose por tenant */}
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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {breakdown.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">Sin tenants registrados</td>
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
