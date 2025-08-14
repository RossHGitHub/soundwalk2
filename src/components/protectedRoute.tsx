// components/ProtectedRoute.tsx
import type { JSX } from "react";
import { Navigate } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const token = localStorage.getItem("token"); // JWT stored in localStorage

  if (!token) {
    // Redirect to login if no token
    return <Navigate to="/login" replace />;
  }

  // Optional: add token validation logic here (e.g., decode and check expiry)

  return children;
}