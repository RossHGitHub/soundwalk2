// components/ProtectedRoute.tsx
import type { JSX } from "react";
import { useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";

interface ProtectedRouteProps {
  children: JSX.Element;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const location = useLocation();
  const [authStatus, setAuthStatus] = useState<"checking" | "valid" | "invalid" | "error">(
    "checking"
  );
  const [retry, setRetry] = useState(0);
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
          cache: "no-store",
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
          signal: controller.signal,
        });

        if (res.status === 401) {
          localStorage.removeItem("auth-token");
          setAuthStatus("invalid");
          return;
        }

        setAuthStatus(res.ok ? "valid" : "error");
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }

        setAuthStatus("error");
      }
    }

    setAuthStatus("checking");
    void verifyToken();

    return () => controller.abort();
  }, [retry]);

  if (!token || authStatus === "invalid") {
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirectTarget)}`}
        replace
      />
    );
  }

  if (authStatus === "error") {
    return <div className="grid min-h-[40vh] place-content-center gap-4 text-center text-white">
      <p>Unable to check your session. Your saved login is still here.</p>
      <button type="button" className="rounded-full border p-3" onClick={() => setRetry((value) => value + 1)}>Try again</button>
    </div>;
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
