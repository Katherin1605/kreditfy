import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = { platform_admin: 'Plataforma', superadmin: 'Superadmin', admin: 'Admin' };
const ROLE_ICONS  = { platform_admin: 'bi-shield-fill', superadmin: 'bi-building', admin: 'bi-person-badge' };
const ROLE_COLORS = { platform_admin: 'text-primary', superadmin: 'text-primary', admin: 'text-secondary' };

const Login = () => {
  const { login, currentAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentAdmin) {
      navigate(currentAdmin.role === 'platform_admin' ? '/platform' : '/', { replace: true });
    }
  }, [currentAdmin, navigate]);

  const [formData, setFormData]     = useState({ email: '', password: '' });
  const [error, setError]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [tenants, setTenants]       = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/auth/login', formData);
      if (res.data.requireTenantSelection) {
        setTenants(res.data.tenants);
        return;
      }
      login(res.data.admin, res.data.token, res.data.refreshToken);
      navigate(res.data.admin.role === 'platform_admin' ? '/platform' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectTenant = async (tenantId) => {
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/auth/login', {
        email:     formData.email,
        password:  formData.password,
        tenant_id: tenantId,
      });
      login(res.data.admin, res.data.token, res.data.refreshToken);
      navigate(res.data.admin.role === 'platform_admin' ? '/platform' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
      setTenants(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card card border-0">
        <div className="card-body p-4 p-sm-5">
          <div className="text-center mb-4">
            <div className="login-brand-icon mb-3">
              <i className="bi bi-hexagon-fill"></i>
            </div>
            <h1 className="login-title">Kreditfy</h1>
            {tenants
              ? <p className="login-subtitle">Selecciona el negocio con el que deseas ingresar</p>
              : <p className="login-subtitle">Ingresa tus credenciales para continuar</p>
            }
          </div>

          {tenants ? (
            <div>
              <div className="login-tenant-list mb-3">
                {tenants.map((t) => (
                  <button
                    key={t.tenant_id ?? 'platform'}
                    className="login-tenant-item w-100 text-start"
                    onClick={() => handleSelectTenant(t.tenant_id)}
                    disabled={loading}
                  >
                    <i className={`bi ${ROLE_ICONS[t.role] || 'bi-building'} ${ROLE_COLORS[t.role] || 'text-primary'} me-3 fs-5`}></i>
                    <div className="flex-grow-1">
                      <div className="fw-semibold">{t.tenant_name}</div>
                      <div className="text-muted small">{ROLE_LABELS[t.role] || t.role}</div>
                    </div>
                    <i className="bi bi-chevron-right text-muted"></i>
                  </button>
                ))}
              </div>
              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              <button
                type="button"
                className="btn btn-link w-100 small text-muted p-0"
                onClick={() => { setTenants(null); setError(''); }}
              >
                <i className="bi bi-arrow-left me-1"></i>Volver al inicio de sesión
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="email" className="form-label fw-semibold small">
                  Correo electrónico
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  name="email"
                  placeholder="tu@correo.com"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label htmlFor="password" className="form-label fw-semibold small">
                  Contraseña
                </label>
                <div className="input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    id="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(prev => !prev)}
                    tabIndex={-1}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>
              {error && <div className="alert alert-danger py-2 small">{error}</div>}
              <button type="submit" className="btn btn-primary w-100 py-2 mb-3 fw-semibold" disabled={loading}>
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>
              <div className="d-flex justify-content-between">
                <Link to="/forgot-password" className="login-link small">
                  ¿Olvidaste tu contraseña?
                </Link>
                <Link to="/register" className="login-link small">
                  Registrar empresa
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
