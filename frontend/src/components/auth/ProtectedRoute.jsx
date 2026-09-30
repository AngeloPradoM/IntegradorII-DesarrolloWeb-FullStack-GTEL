import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDefaultRouteForRole } from "../../utils/auth";

export default function ProtectedRoute({ children, allowedRoles = [], redirectTo = "/login" }) {
  const location = useLocation();
  const { user, isAuthenticated, isVerificationPending } = useAuth();

  if (isVerificationPending || !isAuthenticated || !user?.token) {
    const next = `${redirectTo}?authRequired=1&redirect=${encodeURIComponent(location.pathname)}`;
    return <Navigate to={next} replace />;
  }

  if (user.rol !== "ADMIN" && allowedRoles.length > 0 && !allowedRoles.includes(user.rol)) {
    const fallback = getDefaultRouteForRole(user.rol);
    return <Navigate to={fallback} replace />;
  }

  return children;
}
