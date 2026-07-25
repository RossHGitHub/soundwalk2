import type { FacebookAutoPostRunResult } from "../types";
import { getAdminHeaders } from "./adminAuth";

export async function runFacebookAutoPost(): Promise<FacebookAutoPostRunResult> {
  const res = await fetch("/api/facebook-auto-post", {
    method: "POST",
    headers: getAdminHeaders(true),
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
