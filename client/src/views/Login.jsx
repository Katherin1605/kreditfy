import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { login, currentAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentAdmin) {
      navigate(currentAdmin.role === 'platform_admin' ? '/platform' : '/', { replace: true });
    }
  }, [currentAdmin, navigate]);
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await axios.post('/auth/login', formData);
      login(res.data.admin, res.data.token, res.data.refreshToken);
      navigate(res.data.admin.role === 'platform_admin' ? '/platform' : '/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
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
            <p className="login-subtitle">Ingresa tus credenciales para continuar</p>
          </div>
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
        </div>
      </div>
    </div>
  );
};

export default Login;
