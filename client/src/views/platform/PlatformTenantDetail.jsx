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
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [togglingAdmin, setTogglingAdmin] = useState(null);
  const [resetingAdmin, setResetingAdmin] = useState(null);
  const [resetForm, setResetForm] = useState({ password: '', confirm: '' });
  const [resetSaving, setResetSaving] = useState(false);
  const [resetError, setResetError] = useState('');
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

  const handleDownloadBackup = async () => {
    setDownloadingBackup(true);
    try {
      const res = await axios.get(
        `http://localhost:3000/platform/tenants/${id}/backup`,
        { responseType: 'blob' }
      );
      const url      = URL.createObjectURL(new Blob([res.data], { type: 'application/sql' }));
      const date     = new Date().toISOString().slice(0, 10);
      const filename = `backup_${tenant.slug}_${date}.sql`;
      const a        = document.createElement('a');
      a.href         = url;
      a.download     = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
    finally { setDownloadingBackup(false); }
  };

  const openResetAdmin = (admin) => {
    setResetingAdmin(admin);
    setResetForm({ password: '', confirm: '' });
    setResetError('');
  };
  const cancelReset = () => { setResetingAdmin(null); setResetError(''); };

  const handleResetPassword = async () => {
    if (!resetForm.password) { setResetError('Ingresa la nueva contraseña'); return; }
    if (resetForm.password.length < 6) { setResetError('Mínimo 6 caracteres'); return; }
    if (resetForm.password !== resetForm.confirm) { setResetError('Las contraseñas no coinciden'); return; }
    setResetSaving(true);
    setResetError('');
    try {
      await axios.put(
        `http://localhost:3000/platform/tenants/${id}/admins/${resetingAdmin.id}/reset-password`,
        { password: resetForm.password }
      );
      cancelReset();
    } catch (err) {
      setResetError(err.response?.data?.error || 'Error al actualizar la contraseña');
    } finally {
      setResetSaving(false);
    }
  };

  const handleToggleAdmin = async (adminId) => {
    setTogglingAdmin(adminId);
    try {
      await axios.put(`http://localhost:3000/platform/tenants/${id}/admins/${adminId}/toggle`);
      load();
    } catch {}
    finally { setTogglingAdmin(null); }
  };

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
          <div className="d-flex gap-2">
            <button
              className="btn btn-sm btn-outline-secondary"
              onClick={handleDownloadBackup}
              disabled={downloadingBackup}
              title="Descargar backup SQL de este tenant"
            >
              <i className="bi bi-download me-1"></i>
              {downloadingBackup ? 'Generando…' : 'Backup SQL'}
            </button>
            <button
              className={`btn btn-sm ${tenant.active ? 'btn-outline-warning' : 'btn-outline-success'}`}
              onClick={toggleTenantActive}
            >
              <i className={`bi ${tenant.active ? 'bi-pause-circle' : 'bi-play-circle'} me-1`}></i>
              {tenant.active ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        </div>
      </div>

      {/* Admins */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5 className="mb-0">Administradores</h5>
        <button className="btn btn-primary btn-sm" onClick={() => setShowForm(p => !p)}>
          <i className="bi bi-plus-lg me-1"></i>Agregar admin
        </button>
      </div>

      {resetingAdmin && (
        <div className="card mb-4">
          <div className="card-body">
            <h6 className="card-title mb-1">Cambiar contraseña</h6>
            <p className="text-muted small mb-3">Admin: <strong>{resetingAdmin.name}</strong> ({resetingAdmin.email})</p>
            {resetError && <div className="alert alert-danger py-2 small">{resetError}</div>}
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Nueva contraseña</label>
                <input
                  type="password"
                  className="form-control form-control-sm"
                  placeholder="Mínimo 6 caracteres"
                  value={resetForm.password}
                  onChange={e => setResetForm(p => ({ ...p, password: e.target.value }))}
                />
              </div>
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Confirmar contraseña</label>
                <input
                  type="password"
                  className="form-control form-control-sm"
                  placeholder="Repite la contraseña"
                  value={resetForm.confirm}
                  onChange={e => setResetForm(p => ({ ...p, confirm: e.target.value }))}
                />
              </div>
              <div className="col-md-4 d-flex align-items-end gap-2">
                <button className="btn btn-primary btn-sm" onClick={handleResetPassword} disabled={resetSaving}>
                  {resetSaving ? 'Guardando…' : 'Guardar'}
                </button>
                <button className="btn btn-secondary btn-sm" onClick={cancelReset}>Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <th></th>
              </tr>
            </thead>
            <tbody>
              {admins.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center text-muted py-4">Sin administradores</td>
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
                  <td>
                    <div className="d-flex gap-2">
                      <button
                        className="btn btn-sm btn-outline-secondary"
                        onClick={() => openResetAdmin(a)}
                        title="Cambiar contraseña"
                      >
                        <i className="bi bi-key"></i>
                      </button>
                      <button
                        className={`btn btn-sm ${a.active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                        onClick={() => handleToggleAdmin(a.id)}
                        disabled={togglingAdmin === a.id}
                        title={a.active ? 'Desactivar' : 'Activar'}
                      >
                        <i className={`bi ${a.active ? 'bi-pause-circle' : 'bi-play-circle'}`}></i>
                      </button>
                    </div>
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
