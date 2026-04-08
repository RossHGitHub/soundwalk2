import jwt from "jsonwebtoken";
import { requireEnv } from "./_envGuard.js";

type JwtPayload = {
  id: string;
  username: string;
  iat?: number;
  exp?: number;
};

function extractBearerToken(req: any) {
  const header = req.headers?.authorization ?? req.headers?.Authorization;
  if (!header || typeof header !== "string") {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token.trim();
}

export function requireAdmin(req: any) {
  const token = extractBearerToken(req);
  if (!token) {
    const error = new Error("Missing admin token.");
    (error as Error & { status?: number }).status = 401;
    throw error;
  }

  const secret = requireEnv("JWT_SECRET");
  return jwt.verify(token, secret) as JwtPayload;
}
