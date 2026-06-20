import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../context/AuthContext';
import useConfirm from '../hooks/useConfirm';

const AVAILABLE_VIEWS = [
  { key: 'customers', label: 'Clientes' },
  { key: 'products', label: 'Productos' },
  { key: 'shopping', label: 'Compras' },
  { key: 'sales', label: 'Ventas' },
  { key: 'payments', label: 'Pagos' },
  { key: 'audit', label: 'Auditoría' },
  { key: 'earnings', label: 'Cobros' },
];

const Admin = () => {
  const { currentAdmin } = useAuth();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'admin' });
  const [showPassword, setShowPassword] = useState(false);
  const { confirmModal, ask } = useConfirm();

  useEffect(() => {
    loadAdmins();
  }, []);

  const loadAdmins = () => {
    setLoading(true);
    axios.get('http://localhost:3000/admins')
      .then(res => setAdmins(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleNew = () => {
    setFormData({ name: '', email: '', password: '', role: 'admin' });
    setEditingAdmin(null);
    setShowPassword(false);
    setShowForm(true);
  };

  const handleEdit = (admin) => {
    setFormData({
      name: admin.name,
      email: admin.email,
      password: '',
      role: admin.role || 'admin',
    });
    setEditingAdmin(admin);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const ok = await ask('¿Estás seguro de que deseas eliminar este administrador?');
    if (!ok) return;
    axios.delete(`http://localhost:3000/admins/${id}`)
      .then(() => {
        toast.success('Administrador eliminado');
        loadAdmins();
      })
      .catch(err => toast.error(err.response?.data?.error || 'Error al procesar la solicitud'));
  };

  const handleToggleActive = async (admin) => {
    const action = admin.active ? 'deshabilitar' : 'habilitar';
    const ok = await ask(`¿Seguro que deseas ${action} a ${admin.name}?`);
    if (!ok) return;
    axios.patch(`http://localhost:3000/admins/${admin.id}/active`)
      .then(() => {
        toast.success(`Administrador ${admin.active ? 'deshabilitado' : 'habilitado'}`);
        loadAdmins();
      })
      .catch(err => toast.error(err.response?.data?.error || 'Error al cambiar estado'));
  };

  const handleTogglePermission = (adminId, viewKey, currentPermissions) => {
    const perms = currentPermissions || [];
    const newPerms = perms.includes(viewKey)
      ? perms.filter(p => p !== viewKey)
      : [...perms, viewKey];
    axios.patch(`http://localhost:3000/admins/${adminId}/permissions`, { permissions: newPerms })
      .then(() => loadAdmins())
      .catch(err => toast.error(err.response?.data?.error || 'Error al actualizar permisos'));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.name.trim()) { toast.error('El nombre es obligatorio'); return; }
    if (!formData.email.trim()) { toast.error('El email es obligatorio'); return; }
    if (!editingAdmin && !formData.password) { toast.error('La contraseña es obligatoria'); return; }
    if (editingAdmin) {
      const body = { name: formData.name, email: formData.email, role: formData.role };
      if (formData.password) body.password = formData.password;
      axios.put(`http://localhost:3000/admins/${editingAdmin.id}`, body)
        .then(() => {
          toast.success('Administrador actualizado');
          resetForm();
          loadAdmins();
        })
        .catch(err => toast.error(err.response?.data?.error || 'Error al procesar la solicitud'));
    } else {
      axios.post('http://localhost:3000/admins', formData)
        .then(() => {
          toast.success('Administrador creado');
          resetForm();
          loadAdmins();
        })
        .catch(err => toast.error(err.response?.data?.error || 'Error al procesar la solicitud'));
    }
  };

  const resetForm = () => {
    setFormData({ name: '', email: '', password: '', role: 'admin' });
    setShowForm(false);
    setEditingAdmin(null);
  };

  return (
    <>
      {confirmModal}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h5>Administradores</h5>
        {currentAdmin?.role === 'superadmin' && (
          <button className="btn btn-primary" onClick={handleNew}>
            <i className="bi bi-plus-lg me-1"></i> Nuevo Administrador
          </button>
        )}
      </div>

      {showForm && (
        <div className="bg-white rounded shadow p-4 mb-4">
          <div className="d-flex justify-content-between align-items-center mb-3">
            <h5>{editingAdmin ? 'Editar Administrador' : 'Nuevo Administrador'}</h5>
            <button type="button" className="btn-close" onClick={resetForm} />
          </div>
          <form onSubmit={handleSubmit} className="row g-3" noValidate>
            <div className="col-md-6">
              <label className="form-label">Nombre *</label>
              <input
                type="text"
                className="form-control"
                name="name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">Email *</label>
              <input
                type="email"
                className="form-control"
                name="email"
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div className="col-md-6">
              <label className="form-label">
                {editingAdmin ? 'Nueva contraseña (dejar vacío para no cambiar)' : 'Contraseña *'}
              </label>
              <div className="input-group">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="form-control"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
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
            <div className="col-md-6">
              <label className="form-label">Rol</label>
              <select
                className="form-select"
                name="role"
                value={formData.role}
                onChange={handleChange}
              >
                <option value="admin">admin</option>
                <option value="superadmin">superadmin</option>
              </select>
            </div>
            <div className="col-12">
              <button type="submit" className="btn btn-success me-2">
                {editingAdmin ? 'Actualizar' : 'Guardar'}
              </button>
              <button type="button" className="btn btn-danger" onClick={resetForm}>
                Cancelar
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="row g-3">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="col-md-6 col-lg-4">
              <div className="skeleton-card"></div>
            </div>
          ))
        ) : admins.length === 0 ? (
          <div className="col-12">
            <p className="text-muted text-center py-5">No hay administradores registrados</p>
          </div>
        ) : (
          admins.map(admin => (
            <div className="col-md-6 col-lg-4" key={admin.id}>
              <div className="card h-100">
                <div className="card-body">
                  <div className="d-flex justify-content-between align-items-start mb-2">
                    <div className="d-flex align-items-center gap-2">
                      <i className="bi bi-person-circle fs-3 text-primary"></i>
                      <div>
                        <h6 className="mb-0">
                          {admin.name}
                          {!admin.active && <span className="badge bg-danger ms-1 small">Inactivo</span>}
                        </h6>
                        <span className={`badge ${admin.role === 'superadmin' ? 'bg-primary' : 'bg-secondary'}`}>
                          {admin.role}
                        </span>
                      </div>
                    </div>
                    <div className="d-flex gap-1">
                      <button
                        className="btn btn-sm btn-outline-primary"
                        onClick={() => handleEdit(admin)}
                      >
                        <i className="bi bi-pencil"></i>
                      </button>
                      {currentAdmin?.role === 'superadmin' && admin.id !== currentAdmin.id && (
                        <button
                          className={`btn btn-sm ${admin.active ? 'btn-outline-warning' : 'btn-outline-success'}`}
                          onClick={() => handleToggleActive(admin)}
                          title={admin.active ? 'Deshabilitar' : 'Habilitar'}
                        >
                          <i className={`bi ${admin.active ? 'bi-person-slash' : 'bi-person-check'}`}></i>
                        </button>
                      )}
                      {currentAdmin?.role === 'superadmin' && (
                        <button
                          className="btn btn-sm btn-outline-danger"
                          onClick={() => handleDelete(admin.id)}
                        >
                          <i className="bi bi-trash"></i>
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-muted small mb-1">
                    <i className="bi bi-envelope me-1"></i>{admin.email}
                  </p>
                  <p className="text-muted small mb-0">
                    <i className="bi bi-calendar me-1"></i>
                    Desde {new Date(admin.created_at).toLocaleDateString()}
                  </p>
                  {currentAdmin?.role === 'superadmin' && admin.role !== 'superadmin' && (
                    <div className="mt-3 pt-3 border-top">
                      <p className="small fw-bold mb-2 text-muted">Acceso a vistas:</p>
                      <div className="d-flex flex-wrap gap-2">
                        {AVAILABLE_VIEWS.map(v => (
                          <div key={v.key} className="form-check form-check-inline m-0">
                            <input
                              type="checkbox"
                              className="form-check-input"
                              id={`perm-${admin.id}-${v.key}`}
                              checked={admin.permissions?.includes(v.key) || false}
                              onChange={() => handleTogglePermission(admin.id, v.key, admin.permissions)}
                            />
                            <label className="form-check-label small" htmlFor={`perm-${admin.id}-${v.key}`}>
                              {v.label}
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </>
  );
};

export default Admin;
