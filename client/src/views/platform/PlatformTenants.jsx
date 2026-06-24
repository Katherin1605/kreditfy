import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const EMPTY_FORM = { name: '', slug: '', currency: 'USD', logo_url: '' };

const PlatformTenants = () => {
  const [tenants, setTenants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const load = () => {
    setLoading(true);
    axios.get('http://localhost:3000/platform/tenants')
      .then(res => setTenants(res.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleField = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const openCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setError('');
    setShowForm(true);
  };

  const openEdit = (tenant) => {
    setEditingId(tenant.id);
    setForm({
      name:     tenant.name,
      slug:     tenant.slug,
      currency: tenant.currency,
      logo_url: tenant.logo_url || '',
    });
    setError('');
    setShowForm(true);
  };

  const cancelForm = () => { setShowForm(false); setEditingId(null); setError(''); setForm(EMPTY_FORM); };

  const handleSubmit = async () => {
    if (!form.name || !form.slug) { setError('Nombre y slug son obligatorios'); return; }
    setSaving(true);
    setError('');
    try {
      if (editingId) {
        const tenant = tenants.find(t => t.id === editingId);
        await axios.put(`http://localhost:3000/platform/tenants/${editingId}`, {
          ...form,
          logo_url: form.logo_url || null,
          active: tenant.active,
        });
      } else {
        await axios.post('http://localhost:3000/platform/tenants', {
          ...form,
          logo_url: form.logo_url || null,
        });
      }
      cancelForm();
      load();
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar tenant');
    } finally {
      setSaving(false);
    }
  };

  const toggleActive = async (tenant) => {
    try {
      await axios.put(`http://localhost:3000/platform/tenants/${tenant.id}`, {
        name:     tenant.name,
        slug:     tenant.slug,
        currency: tenant.currency,
        logo_url: tenant.logo_url,
        active:   !tenant.active,
      });
      load();
    } catch {}
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2 className="mb-0">Tenants</h2>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>
          <i className="bi bi-plus-lg me-1"></i>Nuevo tenant
        </button>
      </div>

      {showForm && (
        <div className="card mb-4">
          <div className="card-body">
            <h6 className="card-title mb-3">{editingId ? 'Editar tenant' : 'Nuevo tenant'}</h6>
            {error && <div className="alert alert-danger py-2 small">{error}</div>}
            <div className="row g-3">
              <div className="col-md-4">
                <label className="form-label small fw-semibold">Nombre</label>
                <input
                  className="form-control form-control-sm"
                  name="name"
                  value={form.name}
                  onChange={handleField}
                  placeholder="Ej: Farmacia López"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-semibold">Slug</label>
                <input
                  className="form-control form-control-sm"
                  name="slug"
                  value={form.slug}
                  onChange={handleField}
                  placeholder="Ej: farmacia-lopez"
                />
              </div>
              <div className="col-md-2">
                <label className="form-label small fw-semibold">Moneda</label>
                <select
                  className="form-select form-select-sm"
                  name="currency"
                  value={form.currency}
                  onChange={handleField}
                >
                  <option>USD</option>
                  <option>VES</option>
                  <option>COP</option>
                  <option>EUR</option>
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label small fw-semibold">URL del logo <span className="text-muted fw-normal">(opcional)</span></label>
                <div className="d-flex gap-2 align-items-center">
                  <input
                    className="form-control form-control-sm"
                    name="logo_url"
                    value={form.logo_url}
                    onChange={handleField}
                    placeholder="https://..."
                  />
                  {form.logo_url && (
                    <img
                      src={form.logo_url}
                      alt="preview"
                      className="sidebar-brand-logo flex-shrink-0"
                      onError={e => { e.target.style.display = 'none'; }}
                    />
                  )}
                </div>
              </div>
              <div className="col-12 d-flex gap-2">
                <button className="btn btn-primary btn-sm" onClick={handleSubmit} disabled={saving}>
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

      {loading ? (
        <p className="text-muted">Cargando…</p>
      ) : (
        <div className="card">
          <div className="table-responsive">
            <table className="table table-hover mb-0">
              <thead>
                <tr className="customers-table-head">
                  <th>#</th>
                  <th>Nombre</th>
                  <th>Slug</th>
                  <th>Moneda</th>
                  <th>Estado</th>
                  <th>Creado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {tenants.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center text-muted py-4">Sin tenants registrados</td>
                  </tr>
                ) : tenants.map(t => (
                  <tr key={t.id}>
                    <td className="text-muted small">{t.id}</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        {t.logo_url && (
                          <img
                            src={t.logo_url}
                            alt="logo"
                            className="sidebar-brand-logo flex-shrink-0"
                            onError={e => { e.target.style.display = 'none'; }}
                          />
                        )}
                        <span className="fw-semibold">{t.name}</span>
                      </div>
                    </td>
                    <td><code className="small">{t.slug}</code></td>
                    <td>{t.currency}</td>
                    <td>
                      <span className={`badge ${t.active ? 'bg-success' : 'bg-secondary'}`}>
                        {t.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="text-muted small">
                      {new Date(t.created_at).toLocaleDateString('es-VE')}
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-2 justify-content-end">
                        <button
                          className="btn btn-sm btn-outline-secondary"
                          onClick={() => openEdit(t)}
                          title="Editar"
                        >
                          <i className="bi bi-pencil"></i>
                        </button>
                        <button
                          className={`btn btn-sm ${t.active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          onClick={() => toggleActive(t)}
                          title={t.active ? 'Desactivar' : 'Activar'}
                        >
                          <i className={`bi ${t.active ? 'bi-pause-circle' : 'bi-play-circle'}`}></i>
                        </button>
                        <Link
                          to={`/platform/tenants/${t.id}`}
                          className="btn btn-sm btn-outline-primary"
                          title="Ver detalle"
                        >
                          <i className="bi bi-chevron-right"></i>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default PlatformTenants;
