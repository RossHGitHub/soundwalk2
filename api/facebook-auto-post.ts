import { requireAdmin } from "./_adminAuth.js";
import { runFacebookAutoPostJob } from "./_facebookAutopost.js";

function isCronAuthorized(req: any) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return false;
  }

  const header = req.headers?.authorization ?? req.headers?.Authorization;
  return header === `Bearer ${secret}`;
}

export default async function handler(req: any, res: any) {
  try {
    if (req.method === "GET") {
      if (!isCronAuthorized(req)) {
        return res.status(401).json({ error: "Unauthorized cron request." });
      }

      const result = await runFacebookAutoPostJob({ req });
      return res.status(200).json(result);
    }

    if (req.method === "POST") {
      requireAdmin(req);
      const forceGigId =
        typeof req.body?.gigId === "string" ? req.body.gigId.trim() : null;
      const result = await runFacebookAutoPostJob({ req, forceGigId });
      return res.status(200).json(result);
    }

    res.setHeader("Allow", ["GET", "POST"]);
    return res.status(405).json({ error: "Method not allowed" });
  } catch (error: any) {
    const status = error?.status ?? 500;
    console.error("Facebook auto-post API error:", error);
    return res.status(status).json({
      error: status === 500 ? "Server error" : error?.message ?? "Request failed",
    });
  }
}
