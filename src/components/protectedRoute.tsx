// components/ProtectedRoute.tsx
import type { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const token = localStorage.getItem("auth-token"); // JWT stored in localStorage

  if (!token) {
    const redirectTarget = `${location.pathname}${location.search}${location.hash}`;
    // Redirect to login if no token
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
        replace
      />
    );
  }

  // Optional: add token validation logic here (e.g., decode and check expiry)

  return children;
}
