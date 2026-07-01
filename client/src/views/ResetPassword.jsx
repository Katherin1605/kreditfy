import { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get('token');

  const [form, setForm] = useState({ password: '', confirm: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirm) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (form.password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/auth/reset-password', {
        token,
        password: form.password,
      });
      setSuccess(true);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="main-container">
        <div className="d-flex justify-content-center align-items-center vh-100 bd-page">
          <div className="card shadow p-4 border-0 form-card text-center">
            <div className="alert alert-danger mb-3">
              Enlace inválido. Por favor solicita un nuevo enlace de recuperación.
            </div>
            <Link to="/forgot-password" className="btn btn-primary">
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="main-container">
      <div className="d-flex justify-content-center align-items-center vh-100 bd-page">
        <div className="card shadow p-4 border-0 form-card">
          <div className="text-center mb-4 mt-2">
            <div className="icon-circle d-inline-flex mb-3 shadow-sm">
              <i className="bi bi-shield-lock fs-2" aria-hidden></i>
            </div>
            <h1>Kreditfy</h1>
            <p>Nueva contraseña</p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="alert alert-success">
                <i className="bi bi-check-circle me-2"></i>
                Contraseña actualizada correctamente. Redirigiendo al inicio de sesión...
              </div>
              <Link to="/login" className="btn btn-outline-secondary w-100 mt-2">
                Ir al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="mb-3">
                <label htmlFor="password" className="form-label text-secondary fw-semibold mb-1 text-sm">
                  Nueva contraseña
                </label>
                <div className="input-group">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    id="password"
                    name="password"
                    placeholder="Mínimo 6 caracteres"
                    value={form.password}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="btn btn-outline-secondary"
                    onClick={() => setShowPassword(p => !p)}
                    tabIndex={-1}
                  >
                    <i className={`bi ${showPassword ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                  </button>
                </div>
              </div>
              <div className="mb-3">
                <label htmlFor="confirm" className="form-label text-secondary fw-semibold mb-1 text-sm">
                  Confirmar contraseña
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  id="confirm"
                  name="confirm"
                  placeholder="Repite la contraseña"
                  value={form.confirm}
                  onChange={handleChange}
                  required
                />
              </div>
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <button type="submit" className="btn-primary w-100 py-2 mb-3" disabled={loading}>
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
              <div className="text-center">
                <Link to="/login" className="text-muted small">
                  Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
