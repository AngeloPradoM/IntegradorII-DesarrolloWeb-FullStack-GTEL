import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { getDefaultRouteForRole, getSafeAuthRedirect } from "../../utils/auth";

export default function LoginModalRedirect() {
  const { search } = useLocation();
  const { isAuthenticated, user, isVerificationPending } = useAuth();
  const params = new URLSearchParams(search);
  const redirect = getSafeAuthRedirect(params.get("redirect"));
  if (isAuthenticated && user?.token && !isVerificationPending) {
    return <Navigate replace to={user.rol === "CANDIDATO" && redirect ? redirect : getDefaultRouteForRole(user.rol)} />;
  }
  const next = new URLSearchParams({ auth: params.get("registro") === "1" ? "register" : "login" });
  if (redirect) next.set("redirect", redirect);
  return <Navigate replace to={`${redirect?.startsWith("/postulacion") ? "/ofertas" : "/"}?${next}`} />;
}
