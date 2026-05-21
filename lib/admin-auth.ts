// lib/admin-auth.ts
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.ADMIN_JWT_SECRET || "your-super-secret-admin-key-change-in-env"
);

export interface AdminToken {
  email: string;
  adminId: string;
  iat: number;
}

export async function verifyAdminToken(token: string): Promise<AdminToken | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as AdminToken;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export function getAdminTokenFromRequest(request: Request): string | null {
  // Try authorization header first
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    return authHeader.slice(7); // Remove "Bearer " prefix
  }

  // Try cookies for server-side requests
  const cookieHeader = request.headers.get("cookie");
  if (cookieHeader) {
    const cookies = cookieHeader.split(";").map((c) => c.trim());
    const adminTokenCookie = cookies.find((c) => c.startsWith("admin_token="));
    if (adminTokenCookie) {
      return adminTokenCookie.slice("admin_token=".length);
    }
  }

  return null;
}

export async function verifyAdminFromRequest(
  request: Request
): Promise<AdminToken | null> {
  const token = getAdminTokenFromRequest(request);
  if (!token) return null;
  return verifyAdminToken(token);
}
