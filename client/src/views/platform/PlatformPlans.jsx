import { useEffect, useState } from 'react';
import axios from 'axios';

const ALL_MODULES = [
  { key: 'customers', label: 'Clientes' },
  { key: 'products',  label: 'Productos' },
  { key: 'shopping',  label: 'Compras' },
  { key: 'sales',     label: 'Ventas' },
  { key: 'payments',  label: 'Pagos' },
  { key: 'earnings',  label: 'Contabilidad' },
  { key: 'audit',     label: 'Auditoría' },
];

const PLAN_LABELS = {
  basic: { label: 'Basic', color: 'bg-secondary' },
  pro:   { label: 'Pro',   color: 'bg-primary' },
};

const PlanCard = ({ config, onSaved }) => {
  const [maxAdmins, setMaxAdmins]   = useState(config.max_admins);
  const [unlimited, setUnlimited]   = useState(config.max_admins === -1);
  const [modules, setModules]       = useState(config.modules);
  const [saving, setSaving]         = useState(false);
  const [success, setSuccess]       = useState(false);
  const [error, setError]           = useState('');

  const toggleModule = (key) =>
    setModules(prev =>
      prev.includes(key) ? prev.filter(m => m !== key) : [...prev, key]
    );

  const handleUnlimitedChange = (e) => {
    setUnlimited(e.target.checked);
    if (e.target.checked) setMaxAdmins(-1);
    else setMaxAdmins(2);
  };

  const handleSave = async () => {
    setSaving(true);
    setError('');
    setSuccess(false);
    try {
      await axios.put(`/platform/plan-configs/${config.plan}`, {
        max_admins: unlimited ? -1 : parseInt(maxAdmins),
        modules,
      });
      setSuccess(true);
      onSaved();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar');
    } finally {
      setSaving(false);
    }
  };

  const badge = PLAN_LABELS[config.plan] ?? { label: config.plan, color: 'bg-secondary' };

  return (
    <div className="card h-100">
      <div className="card-body">
        <div className="d-flex align-items-center gap-2 mb-4">
          <span className={`badge fs-6 ${badge.color}`}>{badge.label}</span>
        </div>

        <h6 className="fw-semibold mb-2">Administradores</h6>
        <div className="d-flex align-items-center gap-3 mb-4">
          <div className="form-check mb-0">
            <input
              className="form-check-input"
              type="checkbox"
              id={`unlimited-${config.plan}`}
              checked={unlimited}
              onChange={handleUnlimitedChange}
            />
            <label className="form-check-label small" htmlFor={`unlimited-${config.plan}`}>
              Sin límite
            </label>
          </div>
          {!unlimited && (
            <div className="d-flex align-items-center gap-2">
              <label className="small text-muted mb-0">Máximo:</label>
              <input
                type="number"
                className="form-control form-control-sm"
                min={1}
                value={maxAdmins}
                onChange={e => setMaxAdmins(e.target.value)}
              />
            </div>
          )}
        </div>

        <h6 className="fw-semibold mb-2">Módulos disponibles</h6>
        <div className="row g-2 mb-4">
          {ALL_MODULES.map(m => (
            <div className="col-6" key={m.key}>
              <div className="form-check">
                <input
                  className="form-check-input"
                  type="checkbox"
                  id={`${config.plan}-${m.key}`}
                  checked={modules.includes(m.key)}
                  onChange={() => toggleModule(m.key)}
                />
                <label className="form-check-label small" htmlFor={`${config.plan}-${m.key}`}>
                  {m.label}
                </label>
              </div>
            </div>
          ))}
        </div>

        {error   && <div className="alert alert-danger py-2 small mb-2">{error}</div>}
        {success && <div className="alert alert-success py-2 small mb-2">Guardado correctamente</div>}

        <button className="btn btn-primary btn-sm w-100" onClick={handleSave} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </div>
  );
};

const PlatformPlans = () => {
  const [configs, setConfigs] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    axios.get('/platform/plan-configs')
      .then(res => setConfigs(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  return (
    <div>
      <div className="mb-4">
        <h2 className="mb-1">Planes de precios</h2>
        <p className="text-muted small mb-0">
          Los cambios aplican a los nuevos logins. Las sesiones activas se actualizan al expirar el token.
        </p>
      </div>

      {loading ? (
        <p className="text-muted">Cargando…</p>
      ) : (
        <div className="row g-4">
          {configs.map(config => (
            <div className="col-md-6" key={config.plan}>
              <PlanCard config={config} onSaved={load} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PlatformPlans;
