import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const ROLE_LABELS = { platform_admin: 'Plataforma', superadmin: 'Superadmin', admin: 'Admin' };
const ROLE_ICONS  = { platform_admin: 'bi-shield-fill', superadmin: 'bi-building', admin: 'bi-person-badge' };

const ProfileSwitcher = ({ collapsed }) => {
  const { currentAdmin, availableProfiles, login } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen]       = useState(false);
  const [switching, setSwitching] = useState(null);

  const otherProfiles = availableProfiles.filter(p =>
    p.tenant_id === null
      ? currentAdmin?.tenant_id !== null
      : p.tenant_id !== currentAdmin?.tenant_id
  );

  if (otherProfiles.length === 0) return null;

  const handleSwitch = async (tenantId) => {
    setSwitching(tenantId ?? 'platform');
    try {
      const res = await axios.post('/auth/switch', { tenant_id: tenantId });
      const refreshToken = localStorage.getItem('refreshToken');
      login(res.data.admin, res.data.token, res.data.refreshToken ?? refreshToken, res.data.profiles ?? null);
      setOpen(false);
      navigate(res.data.admin.role === 'platform_admin' ? '/platform' : '/', { replace: true });
    } catch {
      setSwitching(null);
    }
  };

  return (
    <>
      {open && <div className="profile-switcher-backdrop" onClick={() => setOpen(false)} />}

      <div className="profile-switcher-wrap">
        <button
          className="btn btn-sm btn-outline-secondary sidebar-logout"
          onClick={() => setOpen(p => !p)}
          title={collapsed ? 'Cambiar perfil' : undefined}
        >
          <i className="bi bi-arrow-left-right flex-shrink-0"></i>
          <span>Cambiar perfil</span>
        </button>

        {open && (
          <div className="profile-switcher-panel">
            <div className="profile-switcher-title">Cambiar a</div>
            {otherProfiles.map(p => {
              const key        = p.tenant_id ?? 'platform';
              const isLoading  = switching === key;
              return (
                <button
                  key={key}
                  className="profile-switcher-item"
                  onClick={() => handleSwitch(p.tenant_id)}
                  disabled={switching !== null}
                >
                  {isLoading
                    ? <span className="spinner-border spinner-border-sm me-3 text-primary" />
                    : <i className={`bi ${ROLE_ICONS[p.role] || 'bi-building'} me-3 text-primary`}></i>
                  }
                  <div className="flex-grow-1 text-start">
                    <div className="fw-semibold small">{p.tenant_name}</div>
                    <div className="text-muted profile-switcher-role">{ROLE_LABELS[p.role] || p.role}</div>
                  </div>
                  <i className="bi bi-chevron-right text-muted small"></i>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default ProfileSwitcher;
