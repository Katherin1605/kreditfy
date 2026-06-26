import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/platform', label: 'Dashboard', icon: 'bi-columns-gap', end: true },
  { to: '/platform/tenants', label: 'Tenants', icon: 'bi-building' },
  { to: '/platform/plans', label: 'Planes', icon: 'bi-stars' },
];

const PlatformLayout = () => {
  const { currentAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const savedCollapsed = localStorage.getItem('platform_sidebar_collapsed') === 'true';
  const [collapsed, setCollapsed] = useState(savedCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('platform_sidebar_collapsed', collapsed);
  }, [collapsed]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleCollapse = () => setCollapsed(prev => !prev);
  const toggleMobile = () => setMobileOpen(prev => !prev);
  const closeMobile = () => setMobileOpen(false);

  const sidebarClass = ['sidebar', collapsed ? 'collapsed' : '', mobileOpen ? 'mobile-open' : '']
    .filter(Boolean).join(' ');
  const mainClass = ['layout-main', collapsed ? 'collapsed' : ''].filter(Boolean).join(' ');
  const toggleBtnClass = `sidebar-toggle-btn d-none d-md-flex ${collapsed ? 'is-collapsed' : 'is-expanded'}`;

  return (
    <>
      <div className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`} onClick={closeMobile} />

      <aside className={sidebarClass}>
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">
            <i className="bi bi-grid-3x3-gap-fill"></i>
          </div>
          <span className="sidebar-brand-text">Kreditfy</span>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) => `sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={closeMobile}
              title={collapsed ? item.label : undefined}
            >
              <i className={`bi ${item.icon}`}></i>
              <span className="sidebar-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <i className="bi bi-person-circle fs-4 text-primary flex-shrink-0"></i>
            <div className="sidebar-user-info">
              <div className="fw-semibold small text-truncate sidebar-user-name">
                {currentAdmin?.name}
              </div>
              <span className="badge bg-dark badge-platform-role">platform admin</span>
            </div>
          </div>
          <button
            className="btn btn-sm btn-outline-secondary sidebar-logout"
            onClick={handleLogout}
            title={collapsed ? 'Cerrar sesión' : undefined}
          >
            <i className="bi bi-box-arrow-right flex-shrink-0"></i>
            <span>Cerrar sesión</span>
          </button>
        </div>
      </aside>

      <button
        className={toggleBtnClass}
        onClick={toggleCollapse}
        aria-label="Toggle sidebar"
      >
        <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
      </button>

      <button
        className="d-md-none btn btn-sm btn-outline-secondary mobile-hamburger"
        onClick={toggleMobile}
        aria-label="Abrir menú"
      >
        <i className="bi bi-list"></i>
      </button>

      <main className={mainClass}>
        <Outlet />
      </main>
    </>
  );
};

export default PlatformLayout;
