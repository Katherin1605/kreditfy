import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const NAV_ITEMS = [
  { to: "/", label: "Dashboard", icon: "bi-columns-gap", view: null, end: true },
  { to: "/customers", label: "Clientes", icon: "bi-people", view: "customers" },
  { to: "/products", label: "Productos", icon: "bi-box-seam", view: "products" },
  { to: "/shopping", label: "Compras", icon: "bi-cart", view: "shopping" },
  { to: "/sales", label: "Ventas", icon: "bi-currency-dollar", view: "sales" },
  { to: "/payments", label: "Pagos", icon: "bi-credit-card", view: "payments" },
  { to: "/admin", label: "Administradores", icon: "bi-shield", view: "admin" },
  { to: "/audit", label: "Auditoría", icon: "bi-file-earmark-text", view: "audit" },
];

const Layout = () => {
  const { currentAdmin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    if (window.confirm('¿Seguro que deseas cerrar sesión?')) {
      logout();
      navigate('/login');
    }
  };

  const visibleItems = NAV_ITEMS.filter(item => {
    if (!item.view) return true;
    if (currentAdmin?.role === 'superadmin') return true;
    if (item.view === 'admin') return false;
    return currentAdmin?.permissions?.includes(item.view);
  });

  return (
    <>
      <div className="dash d-flex justify-content-between align-items-center">
        <div>
          <h1 className="mb-0">CrediShoping</h1>
          <p className="mb-0">Bienvenido al panel de control de CrediShoping.</p>
        </div>
        {currentAdmin && (
          <div className="d-flex align-items-center gap-3">
            <span className="text-dark fw-semibold">
              <i className="bi bi-person-circle me-1"></i>
              {currentAdmin.name}
              {currentAdmin.role === 'superadmin' && (
                <span className="badge bg-primary ms-2 small">superadmin</span>
              )}
            </span>
            <button className="btn btn-sm btn-outline-secondary" onClick={handleLogout}>
              <i className="bi bi-box-arrow-right me-1"></i>Salir
            </button>
          </div>
        )}
      </div>

      <nav className="navbar navbar-expand-lg">
        <div className="container-fluid">
          {visibleItems.map(item => (
            <NavLink
              key={item.to}
              className={({ isActive }) => isActive ? "nav-link active" : "nav-link"}
              to={item.to}
              end={item.end}
            >
              <i className={`bi ${item.icon}`}></i> {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <Outlet />
    </>
  );
};

export default Layout;
