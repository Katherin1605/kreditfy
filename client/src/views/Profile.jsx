import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';

const Profile = () => {
  const { currentAdmin, login } = useAuth();

  const [profileForm, setProfileForm] = useState({ name: '', email: '' });
  const [profileLoading, setProfileLoading] = useState(false);

  const [passForm, setPassForm] = useState({ current_password: '', new_password: '', confirm_password: '' });
  const [passLoading, setPassLoading] = useState(false);
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);

  useEffect(() => {
    axios.get('/profile')
      .then(res => setProfileForm({ name: res.data.name, email: res.data.email }))
      .catch(() => {});
  }, []);

  const handleProfileChange = (e) => setProfileForm({ ...profileForm, [e.target.name]: e.target.value });
  const handlePassChange    = (e) => setPassForm({ ...passForm, [e.target.name]: e.target.value });

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    try {
      const res = await axios.put('/profile', profileForm);
      const refreshToken = localStorage.getItem('refreshToken');
      login(res.data.admin, res.data.token, refreshToken);
      toast.success('Perfil actualizado correctamente');
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar el perfil');
    } finally {
      setProfileLoading(false);
    }
  };

  const handlePassSubmit = async (e) => {
    e.preventDefault();
    if (passForm.new_password !== passForm.confirm_password) {
      toast.error('Las contraseñas nuevas no coinciden');
      return;
    }
    setPassLoading(true);
    try {
      await axios.put('/profile/password', {
        current_password: passForm.current_password,
        new_password:     passForm.new_password,
      });
      toast.success('Contraseña actualizada correctamente');
      setPassForm({ current_password: '', new_password: '', confirm_password: '' });
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setPassLoading(false);
    }
  };

  return (
    <div className="view-container">
      <div className="d-flex align-items-center gap-2 mb-4">
        <i className="bi bi-person-gear fs-4 text-primary"></i>
        <h4 className="mb-0">Mi perfil</h4>
      </div>

      <div className="row g-4">

        {/* Información personal */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header dashboard-card-header">
              <i className="bi bi-person me-2"></i>Información personal
            </div>
            <div className="card-body">
              <form onSubmit={handleProfileSubmit}>
                <div className="mb-3">
                  <label htmlFor="profile-name" className="form-label">Nombre</label>
                  <input
                    type="text"
                    className="form-control"
                    id="profile-name"
                    name="name"
                    value={profileForm.name}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                <div className="mb-4">
                  <label htmlFor="profile-email" className="form-label">Correo electrónico</label>
                  <input
                    type="email"
                    className="form-control"
                    id="profile-email"
                    name="email"
                    value={profileForm.email}
                    onChange={handleProfileChange}
                    required
                  />
                </div>
                <div className="mb-3 p-3 profile-role-box rounded">
                  <span className="text-muted small">Rol actual: </span>
                  <span className="badge bg-primary ms-1">
                    {currentAdmin?.role === 'platform_admin' ? 'Administrador de plataforma'
                      : currentAdmin?.role === 'superadmin' ? 'Superadmin'
                      : 'Admin'}
                  </span>
                  {currentAdmin?.tenant_name && (
                    <span className="text-muted small ms-2">— {currentAdmin.tenant_name}</span>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={profileLoading}
                >
                  {profileLoading
                    ? <><span className="spinner-border spinner-border-sm me-2" />Guardando...</>
                    : <><i className="bi bi-check-lg me-1"></i>Guardar cambios</>
                  }
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Cambiar contraseña */}
        <div className="col-lg-6">
          <div className="card h-100">
            <div className="card-header dashboard-card-header">
              <i className="bi bi-shield-lock me-2"></i>Cambiar contraseña
            </div>
            <div className="card-body">
              <form onSubmit={handlePassSubmit}>
                <div className="mb-3">
                  <label htmlFor="current-pass" className="form-label">Contraseña actual</label>
                  <div className="input-group">
                    <input
                      type={showCurrent ? 'text' : 'password'}
                      className="form-control"
                      id="current-pass"
                      name="current_password"
                      value={passForm.current_password}
                      onChange={handlePassChange}
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowCurrent(p => !p)}
                      tabIndex={-1}
                    >
                      <i className={`bi ${showCurrent ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="new-pass" className="form-label">Nueva contraseña</label>
                  <div className="input-group">
                    <input
                      type={showNew ? 'text' : 'password'}
                      className="form-control"
                      id="new-pass"
                      name="new_password"
                      value={passForm.new_password}
                      onChange={handlePassChange}
                      placeholder="Mínimo 6 caracteres"
                      required
                    />
                    <button
                      type="button"
                      className="btn btn-outline-secondary"
                      onClick={() => setShowNew(p => !p)}
                      tabIndex={-1}
                    >
                      <i className={`bi ${showNew ? 'bi-eye-slash' : 'bi-eye'}`}></i>
                    </button>
                  </div>
                </div>
                <div className="mb-4">
                  <label htmlFor="confirm-pass" className="form-label">Confirmar nueva contraseña</label>
                  <input
                    type={showNew ? 'text' : 'password'}
                    className="form-control"
                    id="confirm-pass"
                    name="confirm_password"
                    value={passForm.confirm_password}
                    onChange={handlePassChange}
                    placeholder="Repite la nueva contraseña"
                    required
                  />
                  {passForm.new_password && passForm.confirm_password && passForm.new_password !== passForm.confirm_password && (
                    <div className="form-text text-danger">
                      <i className="bi bi-exclamation-circle me-1"></i>Las contraseñas no coinciden
                    </div>
                  )}
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={passLoading}
                >
                  {passLoading
                    ? <><span className="spinner-border spinner-border-sm me-2" />Actualizando...</>
                    : <><i className="bi bi-shield-check me-1"></i>Cambiar contraseña</>
                  }
                </button>
              </form>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Profile;
