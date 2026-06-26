import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./views/Login";
import ForgotPassword from "./views/ForgotPassword";
import ResetPassword from "./views/ResetPassword";
import Register from "./views/Register";
import Dashboard from "./views/Dashboard";
import Customers from "./views/Customers";
import Products from "./views/Products";
import Shopping from "./views/Shopping";
import Sales from "./views/Sales";
import Payments from "./views/Payments";
import Admin from "./views/Admin";
import Audit from "./views/Audit";
import Earnings from "./views/Earnings";
import PlatformLayout from "./views/platform/PlatformLayout";
import PlatformDashboard from "./views/platform/PlatformDashboard";
import PlatformTenants from "./views/platform/PlatformTenants";
import PlatformTenantDetail from "./views/platform/PlatformTenantDetail";
import PlatformPlans from "./views/platform/PlatformPlans";

const SUPERADMIN_VIEWS = ['admin', 'audit', 'earnings'];

const ProtectedRoute = ({ element, view }) => {
  const { currentAdmin, loading } = useAuth();
  if (loading) return null;
  if (!currentAdmin) return <Navigate to="/login" replace />;
  if (currentAdmin.role === 'platform_admin') return <Navigate to="/platform" replace />;
  if (currentAdmin.role === 'superadmin') return element;
  if (SUPERADMIN_VIEWS.includes(view)) return <Navigate to="/" replace />;
  if (view && !currentAdmin.permissions?.includes(view)) return <Navigate to="/" replace />;
  return element;
};

const PlatformRoute = ({ element }) => {
  const { currentAdmin, loading } = useAuth();
  if (loading) return null;
  if (!currentAdmin) return <Navigate to="/login" replace />;
  if (currentAdmin.role !== 'platform_admin') return <Navigate to="/" replace />;
  return element;
};

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login"            element={<Login />} />
        <Route path="/forgot-password"  element={<ForgotPassword />} />
        <Route path="/reset-password"   element={<ResetPassword />} />
        <Route path="/register"         element={<Register />} />
        <Route path="/platform" element={<PlatformRoute element={<PlatformLayout />} />}>
          <Route index element={<PlatformDashboard />} />
          <Route path="tenants" element={<PlatformTenants />} />
          <Route path="tenants/:id" element={<PlatformTenantDetail />} />
          <Route path="plans"       element={<PlatformPlans />} />
        </Route>
        <Route path="/" element={<ProtectedRoute element={<Layout />} />}>
          <Route index element={<Dashboard />} />
          <Route path="customers" element={<ProtectedRoute element={<Customers />} view="customers" />} />
          <Route path="products"  element={<ProtectedRoute element={<Products />}  view="products" />} />
          <Route path="shopping"  element={<ProtectedRoute element={<Shopping />}  view="shopping" />} />
          <Route path="sales"     element={<ProtectedRoute element={<Sales />}     view="sales" />} />
          <Route path="payments"  element={<ProtectedRoute element={<Payments />}  view="payments" />} />
          <Route path="admin"     element={<ProtectedRoute element={<Admin />}     view="admin" />} />
          <Route path="audit"     element={<ProtectedRoute element={<Audit />}     view="audit" />} />
          <Route path="earnings"  element={<ProtectedRoute element={<Earnings />}  view="earnings" />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
