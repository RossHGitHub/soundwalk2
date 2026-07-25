// components/ProtectedRoute.tsx
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const [authStatus, setAuthStatus] = useState<"checking" | "valid" | "invalid">(
    "checking"
  );
  const token = localStorage.getItem("auth-token");
  const redirectTarget = `${location.pathname}${location.search}${location.hash}`;

  useEffect(() => {
    const storedToken = localStorage.getItem("auth-token");

    if (!storedToken) {
      setAuthStatus("invalid");
      return;
    }

    const controller = new AbortController();

    async function verifyToken() {
      try {
        const res = await fetch("/api/auth", {
          method: "GET",
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          localStorage.removeItem("auth-token");
          setAuthStatus("invalid");
          return;
        }

        setAuthStatus("valid");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        localStorage.removeItem("auth-token");
        setAuthStatus("invalid");
      }
    }

    setAuthStatus("checking");
    void verifyToken();

    return () => controller.abort();
  }, [location.pathname, location.search, location.hash]);

  if (!token || authStatus === "invalid") {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
        replace
      />
    );
  }

  if (authStatus === "checking") {
    return (
      <div className="grid min-h-[40vh] place-items-center text-sm text-white/70">
        Checking admin access...
      </div>
    );
  }

  return children;
}
