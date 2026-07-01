import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await axios.post('/auth/forgot-password', { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container">
      <div className="d-flex justify-content-center align-items-center vh-100 bd-page">
        <div className="card shadow p-4 border-0 form-card">
          <div className="text-center mb-4 mt-2">
            <div className="icon-circle d-inline-flex mb-3 shadow-sm">
              <i className="bi bi-envelope-at fs-2" aria-hidden></i>
            </div>
            <h1>Kreditfy</h1>
            <p>Recuperación de contraseña</p>
          </div>

          {sent ? (
            <div className="text-center">
              <div className="alert alert-success">
                <i className="bi bi-check-circle me-2"></i>
                Si el email está registrado, recibirás un enlace de recuperación en los próximos minutos.
              </div>
              <Link to="/login" className="btn btn-outline-secondary w-100 mt-2">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <p className="text-muted small mb-3">
                Ingresa tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <div className="mb-3">
                <label htmlFor="email" className="form-label text-secondary fw-semibold mb-1 text-sm">
                  Email
                </label>
                <input
                  type="email"
                  className="form-control"
                  id="email"
                  placeholder="Ingresa tu email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              {error && <div className="alert alert-danger py-2">{error}</div>}
              <button type="submit" className="btn-primary w-100 py-2 mb-3" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar enlace de recuperación'}
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

export default ForgotPassword;
