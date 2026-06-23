import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const PlatformLayout = () => {
  const { currentAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="d-flex flex-column min-vh-100">
      <nav className="navbar navbar-dark bg-dark px-4">
        <span className="navbar-brand fw-bold">
          <i className="bi bi-grid-3x3-gap-fill me-2"></i>
          Kreditfy — Plataforma Administrativa
        </span>
        <div className="d-flex align-items-center gap-3">
          <span className="text-white-50 small">{currentAdmin?.name}</span>
          <button className="btn btn-outline-light btn-sm" onClick={handleLogout}>
            <i className="bi bi-box-arrow-right me-1"></i>Salir
          </button>
        </div>
      </nav>
      <main className="flex-grow-1 p-4">
        <Outlet />
      </main>
    </div>
  );
};

export default PlatformLayout;
