import { Link, useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function AuthRequiredLink({ to, onClick, ...props }) {
  const { isAuthenticated, user, isVerificationPending } = useAuth();
  const { openLogin } = useOutletContext();
  return <Link {...props} to={to} onClick={event => {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    if (!isAuthenticated || !user?.token || isVerificationPending) {
      event.preventDefault();
      openLogin(to);
    }
  }} />;
}
