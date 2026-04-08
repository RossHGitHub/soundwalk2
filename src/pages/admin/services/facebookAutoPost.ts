import type { FacebookAutoPostRunResult } from "../types";

function getAdminHeaders() {
  const token = localStorage.getItem("auth-token");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

export async function runFacebookAutoPost(): Promise<FacebookAutoPostRunResult> {
  const res = await fetch("/api/facebook-auto-post", {
    method: "POST",
    headers: getAdminHeaders(),
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(
      errorData?.error || `Failed to run Facebook auto-post (${res.status})`
    );
  }

  return res.json();
}
