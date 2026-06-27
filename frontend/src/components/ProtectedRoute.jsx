import { Navigate } from "react-router-dom";

const getRoleFromToken = (token) => {
  try {
    const base64Payload = token.split(".")[1];
    if (!base64Payload) return null;

    const payload = JSON.parse(atob(base64Payload));
    return payload?.role || null;
  } catch (error) {
    return null;
  }
};

function ProtectedRoute({ children, allowedRole }) {
  const token = localStorage.getItem("token");
  const tokenRole = token ? getRoleFromToken(token) : null;
  const storedRole = localStorage.getItem("role");

  // Check if user is authenticated
  if (!token) {
    return <Navigate to="/" />;
  }

  // Token exists but unreadable/invalid: clear stale auth and redirect.
  if (!tokenRole) {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("username");
    localStorage.removeItem("userId");
    return <Navigate to="/" />;
  }

  // Keep local storage role synchronized with token payload role.
  if (storedRole !== tokenRole) {
    localStorage.setItem("role", tokenRole);
  }

  // Check if user has the required role
  if (allowedRole && tokenRole !== allowedRole) {
    return <Navigate to="/" />;
  }

  return children;
}

export default ProtectedRoute;