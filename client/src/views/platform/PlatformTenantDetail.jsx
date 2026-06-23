import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';

const EMPTY_ADMIN = { name: '', email: '', password: '', role: 'superadmin' };

const PlatformTenantDetail = () => {
  const { id } = useParams();
  const [tenant, setTenant] = useState(null);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ADMIN);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    Promise.all([
      axios.get(`http://localhost:3000/platform/tenants/${id}`),
      axios.get(`http://localhost:3000/platform/tenants/${id}/admins`),
    ])
      .then(([tenantRes, adminsRes]) => {
        setTenant(tenantRes.data);
        setAdmins(adminsRes.data);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const handleField = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const toggleTenantActive = async () => {
    try {
      await axios.put(`http://localhost:3000/platform/tenants/${id}`, {
        name: tenant.name,
        slug: tenant.slug,
        currency: tenant.currency,
        logo_url: tenant.logo_url,
        active: !tenant.active,
      });
      load();
    } catch {}
  };

  const handleAddAdmin = async () => {
    if (!form.name || !form.email || !form.password) {
      setError('Nombre, email y contraseña son obligatorios');
      return;
    }
    setSaving(true);
    setError('');
    try {
      await axios.post(`http://localhost:3000/platform/tenants/${id}/admins`, form);
      setForm(EMPTY_ADMIN);
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear administrador');
    } finally {
      setSaving(false);
    }
  };

  const cancelForm = () => { setShowForm(false); setError(''); setForm(EMPTY_ADMIN); };

  if (loading) return <p className="text-muted">Cargando…</p>;
  if (!tenant) return <p className="text-danger">Tenant no encontrado.</p>;

  return (
    <div>
      <nav aria-label="breadcrumb" className="layout-breadcrumb mb-3">
        <ol className="breadcrumb">
          <li className="breadcrumb-item"><Link to="/platform">Dashboard</Link></li>
          <li className="breadcrumb-item"><Link to="/platform/tenants">Tenants</Link></li>
          <li className="breadcrumb-item active">{tenant.name}</li>
        </ol>
      </nav>

      {/* Header del tenant */}
      <div className="card mb-4">
        <div className="card-body d-flex justify-content-between align-items-start flex-wrap gap-3">
          <div>
            <h4 className="mb-1">{tenant.name}</h4>
            <div className="d-flex flex-wrap gap-3 text-muted small mt-1">
              <span><i className="bi bi-link-45deg me-1"></i><code>{tenant.slug}</code></span>
              <span><i className="bi bi-currency-exchange me-1"></i>{tenant.currency}</span>
              <span>
                <span className={`badge ${tenant.active ? 'bg-success' : 'bg-secondary'}`}>
                  {tenant.active ? 'Activo' : 'Inactivo'}
                </span>
              </span>
            </div>
          </div>
          <button
            className={`btn btn-sm ${tenant.active ? 'btn-outline-warning' : 'btn-outline-success'}`}
            onClick={toggleTenantActive}
          >
            <i className={`bi ${tenant.active ? 'bi-pause-circle' : 'bi-play-circle'} me-1`}></i>
            {tenant.active ? 'Desactivar' : 'Activar'}
          </button>
        </div>
      </div>

      {/* Admins */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Administradores</h5>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(p => !p)}>
          <i className="bi bi-plus-lg me-1"></i>Agregar admin
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h6 className="card-title mb-3">Nuevo administrador</h6>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label small fw-semibold">Nombre</label>
                <input
                  className="form-control form-control-sm"
                  name="name"
                  value={form.name}
                  onChange={handleField}
                  placeholder="Nombre completo"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-semibold">Email</label>
                <input
                  type="email"
                  className="form-control form-control-sm"
                  name="email"
                  value={form.email}
                  onChange={handleField}
                  placeholder="correo@empresa.com"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-semibold">Contraseña</label>
                <input
                  type="password"
                  className="form-control form-control-sm"
                  name="password"
                  value={form.password}
                  onChange={handleField}
                  placeholder="Contraseña inicial"
                />
              </div>
              <div className="col-md-1">
                <label className="form-label small fw-semibold">Rol</label>
                <select
                  className="form-select form-select-sm"
                  name="role"
                  value={form.role}
                  onChange={handleField}
                >
                  <option value="superadmin">superadmin</option>
                  <option value="admin">admin</option>
                </select>
              </div>
              <div className="col-md-2 d-flex align-items-end gap-2">
                <button className="btn btn-primary btn-sm" onClick={handleAddAdmin} disabled={saving}>
                  {saving ? 'Guardando…' : 'Guardar'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={cancelForm}>
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="table-responsive">
          <table className="table table-hover mb-0">
            <thead>
              <tr className="customers-table-head">
                <th>Nombre</th>
                <th>Email</th>
                <th>Rol</th>
                <th>Estado</th>
                <th>Creado</th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center text-muted py-4">Sin administradores</td>
                </tr>
              ) : admins.map(a => (
                <tr key={a.id}>
                  <td className="fw-semibold">{a.name}</td>
                  <td className="text-muted small">{a.email}</td>
                  <td>
                    <span className={`badge ${a.role === 'superadmin' ? 'bg-primary' : 'bg-secondary'}`}>
                      {a.role}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${a.active ? 'bg-success' : 'bg-secondary'}`}>
                      {a.active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="text-muted small">
                    {new Date(a.created_at).toLocaleDateString('es-VE')}
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

export default PlatformTenantDetail;
