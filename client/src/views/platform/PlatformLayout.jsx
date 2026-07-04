import { useState, useEffect, useRef } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useAuth } from '../../context/AuthContext';

const NAV_ITEMS = [
  { to: '/platform', label: 'Dashboard', icon: 'bi-columns-gap', end: true },
  { to: '/platform/tenants', label: 'Tenants', icon: 'bi-building' },
  { to: '/platform/plans', label: 'Planes', icon: 'bi-stars' },
];

const PlatformLayout = () => {
  const { currentAdmin, logout, updateCurrentAdmin } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const savedCollapsed = localStorage.getItem('platform_sidebar_collapsed') === 'true';
  const [collapsed, setCollapsed] = useState(savedCollapsed);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('logo', file);
    setUploadingLogo(true);
    try {
      const res = await axios.post('/platform/logo', formData);
      updateCurrentAdmin({ tenant_logo: res.data.logo_url });
      toast.success('Logo actualizado');
    } catch {
      toast.error('Error al subir el logo');
    } finally {
      setUploadingLogo(false);
      e.target.value = '';
    }
  };

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
          <div
            className={`sidebar-brand-icon ${currentAdmin?.tenant_logo ? 'has-logo' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            title="Cambiar logo"
          >
            {currentAdmin?.tenant_logo
              ? <img src={currentAdmin.tenant_logo} alt="Logo" className="sidebar-brand-logo" />
              : <i className="bi bi-grid-3x3-gap-fill"></i>
            }
            {uploadingLogo && <span className="spinner-border spinner-border-sm position-absolute" />}
          </div>
          <span className="sidebar-brand-text">Kreditfy</span>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="d-none"
            onChange={handleLogoUpload}
          />
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
              <span className="badge bg-dark badge-platform-role">Plataforma administrativa</span>
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
