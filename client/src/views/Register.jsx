import { useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

const toSlug = (str) =>
  str.toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .trim()
    .replace(/\s+/g, '-');

const Register = () => {
  const [form, setForm] = useState({
    company_name: '',
    slug:         '',
    admin_name:   '',
    email:        '',
    password:     '',
    confirm:      '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading]           = useState(false);
  const [success, setSuccess]           = useState(false);
  const [error, setError]               = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => {
      const updated = { ...prev, [name]: value };
      if (name === 'company_name') updated.slug = toSlug(value);
      return updated;
    });
  };

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
    if (!form.slug) {
      setError('El identificador no puede estar vacío');
      return;
    }

    setLoading(true);
    try {
      await axios.post('/auth/register-tenant', {
        company_name: form.company_name,
        slug:         form.slug,
        admin_name:   form.admin_name,
        email:        form.email,
        password:     form.password,
      });
      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al enviar la solicitud');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="main-container">
      <div className="d-flex justify-content-center align-items-center min-vh-100 bd-page py-4">
        <div className="card shadow p-4 border-0 form-card">
          <div className="text-center mb-4 mt-2">
            <div className="icon-circle d-inline-flex mb-3 shadow-sm">
              <i className="bi bi-building-add fs-2" aria-hidden></i>
            </div>
            <h1>Kreditfy</h1>
            <p>Registra tu empresa para comenzar</p>
          </div>

          {success ? (
            <div className="text-center">
              <div className="alert alert-success">
                <i className="bi bi-check-circle-fill me-2"></i>
                <strong>¡Solicitud enviada!</strong>
                <p className="mb-0 mt-1 small">
                  El equipo de Kreditfy revisará tu solicitud y activará tu empresa en breve.
                  Recibirás acceso una vez aprobada.
                </p>
              </div>
              <Link to="/login" className="btn btn-outline-secondary w-100 mt-2">
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="row g-3">
                <div className="col-12">
                  <label className="form-label text-secondary fw-semibold mb-1 text-sm">
                    Nombre de la empresa
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="company_name"
                    placeholder="Ej: Farmacia López"
                    value={form.company_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label text-secondary fw-semibold mb-1 text-sm">
                    Identificador <span className="text-muted fw-normal">(generado automáticamente)</span>
                  </label>
                  <div className="input-group">
                    <span className="input-group-text text-muted small">kreditfy.com/</span>
                    <input
                      type="text"
                      className="form-control"
                      name="slug"
                      placeholder="farmacia-lopez"
                      value={form.slug}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>
                <div className="col-12">
                  <label className="form-label text-secondary fw-semibold mb-1 text-sm">
                    Tu nombre
                  </label>
                  <input
                    type="text"
                    className="form-control"
                    name="admin_name"
                    placeholder="Nombre completo del administrador"
                    value={form.admin_name}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label text-secondary fw-semibold mb-1 text-sm">
                    Email
                  </label>
                  <input
                    type="email"
                    className="form-control"
                    name="email"
                    placeholder="correo@empresa.com"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="col-12">
                  <label className="form-label text-secondary fw-semibold mb-1 text-sm">
                    Contraseña
                  </label>
                  <div className="input-group">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className="form-control"
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
                <div className="col-12">
                  <label className="form-label text-secondary fw-semibold mb-1 text-sm">
                    Confirmar contraseña
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    className="form-control"
                    name="confirm"
                    placeholder="Repite la contraseña"
                    value={form.confirm}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              {error && <div className="alert alert-danger py-2 mt-3">{error}</div>}

              <button type="submit" className="btn-primary w-100 py-2 mt-3 mb-3" disabled={loading}>
                {loading ? 'Enviando solicitud…' : 'Solicitar acceso'}
              </button>

              <div className="text-center">
                <span className="text-muted small">¿Ya tienes cuenta? </span>
                <Link to="/login" className="small">Iniciar sesión</Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Register;
