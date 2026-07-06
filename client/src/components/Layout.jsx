import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import toast from 'react-hot-toast';
import useConfirm from '../hooks/useConfirm';
import { useAuth } from '../context/AuthContext';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: 'bi-columns-gap', view: null, end: true },
  { to: '/customers', label: 'Clientes', icon: 'bi-people', view: 'customers' },
  { to: '/products', label: 'Productos', icon: 'bi-box-seam', view: 'products' },
  { to: '/shopping', label: 'Compras', icon: 'bi-cart', view: 'shopping' },
  { to: '/sales', label: 'Ventas', icon: 'bi-currency-dollar', view: 'sales' },
  { to: '/payments', label: 'Pagos', icon: 'bi-credit-card', view: 'payments' },
  { to: '/earnings', label: 'Contabilidad', icon: 'bi-wallet2', view: 'earnings' },
  { to: '/admin', label: 'Administradores', icon: 'bi-shield', view: 'admin' },
  { to: '/audit', label: 'Auditoría', icon: 'bi-file-earmark-text', view: 'audit' },
];

const Layout = () => {
  const { currentAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentNavItem = NAV_ITEMS.find(
    item => item.to !== '/' && location.pathname === item.to
  );
  const { confirmModal, ask } = useConfirm();

  const savedCollapsed = localStorage.getItem('sidebar_collapsed') === 'true';
  const [collapsed, setCollapsed] = useState(savedCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    localStorage.setItem('sidebar_collapsed', collapsed);
  }, [collapsed]);

  const handleLogout = async () => {
    const ok = await ask('¿Seguro que deseas cerrar sesión?');
    if (!ok) return;
    logout();
    toast.success('Sesión cerrada');
    navigate('/login');
  };

  const toggleCollapse = () => setCollapsed(prev => !prev);
  const toggleMobile = () => setMobileOpen(prev => !prev);
  const closeMobile = () => setMobileOpen(false);

  const visibleItems = NAV_ITEMS.filter(item => {
    if (!item.view) return true;
    if (currentAdmin?.plan_modules && !currentAdmin.plan_modules.includes(item.view)) return false;
    if (currentAdmin?.role === 'superadmin') return true;
    if (item.view === 'admin') return false;
    return currentAdmin?.permissions?.includes(item.view);
  });

  const sidebarClass = [
    'sidebar',
    collapsed ? 'collapsed' : '',
    mobileOpen ? 'mobile-open' : '',
  ].filter(Boolean).join(' ');

  const mainClass = ['layout-main', collapsed ? 'collapsed' : ''].filter(Boolean).join(' ');

  return (
    <>
      {confirmModal}

      <div
        className={`sidebar-overlay ${mobileOpen ? 'active' : ''}`}
        onClick={closeMobile}
      />

      <aside className={sidebarClass}>
        <div className="sidebar-brand">
          <div className={`sidebar-brand-icon${currentAdmin?.tenant_logo ? ' has-logo' : ''}`}>
            {currentAdmin?.tenant_logo
              ? <img src={currentAdmin.tenant_logo} alt="logo" className="sidebar-brand-logo" />
              : <i className="bi bi-bag-heart"></i>
            }
          </div>
          <span className="sidebar-brand-text">{currentAdmin?.tenant_name || 'CrediShoping'}</span>
        </div>

        <nav className="sidebar-nav">
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `sidebar-nav-item ${isActive ? 'active' : ''}`
              }
              onClick={closeMobile}
              title={collapsed ? item.label : undefined}
            >
              <i className={`bi ${item.icon}`}></i>
              <span className="sidebar-nav-label">{item.label}</span>
            </NavLink>
          ))}
        </nav>

        {currentAdmin && (
          <div className="sidebar-footer">
            <div className="sidebar-user">
              <i className="bi bi-person-circle fs-4 text-primary flex-shrink-0"></i>
              <div className="sidebar-user-info">
                <div className="fw-semibold small text-truncate sidebar-user-name">
                  {currentAdmin.name}
                </div>
                {currentAdmin.role === 'superadmin' && (
                  <span className="badge bg-primary badge-platform-role">superadmin</span>
                )}
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
        )}
      </aside>

      {/* Toggle desktop — fuera del aside para no ser cortado por overflow:hidden */}
      <button
        className="sidebar-toggle-btn d-none d-md-flex"
        style={{ left: collapsed ? 46 : 226 }}
        onClick={toggleCollapse}
        aria-label="Toggle sidebar"
      >
        <i className={`bi ${collapsed ? 'bi-chevron-right' : 'bi-chevron-left'}`}></i>
      </button>

      {/* Hamburger mobile */}
      <button
        className="d-md-none btn btn-sm btn-outline-secondary"
        style={{ position: 'fixed', top: '1rem', left: '1rem', zIndex: 1100 }}
        onClick={toggleMobile}
        aria-label="Abrir menú"
      >
        <i className="bi bi-list"></i>
      </button>

      <main className={mainClass} style={{ padding: '1.5rem 2rem' }}>
        {currentNavItem && (
          <nav aria-label="breadcrumb" className="layout-breadcrumb">
            <ol className="breadcrumb">
              <li className="breadcrumb-item">
                <NavLink to="/">Dashboard</NavLink>
              </li>
              <li className="breadcrumb-item active" aria-current="page">
                <i className={`bi ${currentNavItem.icon} me-1`}></i>
                {currentNavItem.label}
              </li>
            </ol>
          </nav>
        )}
        <Outlet />
      </main>
    </>
  );
};

export default Layout;
