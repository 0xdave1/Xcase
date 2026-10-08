import { createHmac } from "crypto";
import { cookies } from "next/headers";

const USER_COOKIE = "xcase_user_session";
const ADMIN_COOKIE = "xcase_admin_session";

type SessionRole = "user" | "admin";

interface SessionPayload {
  sub: string;
  role: SessionRole;
  exp: number;
}

function base64UrlEncode(value: string) {
  return Buffer.from(value, "utf8").toString("base64url");
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, "base64url").toString("utf8");
}

function getSecret() {
  return process.env.XCASE_SESSION_SECRET ?? "xcase-dev-secret-change-me";
}

function signPayload(payload: string) {
  return createHmac("sha256", getSecret()).update(payload).digest("base64url");
}

function createToken(payload: SessionPayload) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const signature = signPayload(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

function parseToken(token?: string | null) {
  if (!token) {
    return null;
  }

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) {
    return null;
  }

  const expectedSignature = signPayload(encodedPayload);
  if (signature !== expectedSignature) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload)) as SessionPayload;
    if (payload.exp <= Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function getUserSession() {
  const cookieStore = await cookies();
  const payload = parseToken(cookieStore.get(USER_COOKIE)?.value);
  if (!payload || payload.role !== "user") {
    return null;
  }
  return payload;
}

export async function getAdminSession() {
  const cookieStore = await cookies();
  const payload = parseToken(cookieStore.get(ADMIN_COOKIE)?.value);
  if (!payload || payload.role !== "admin") {
    return null;
  }
  return payload;
}

export async function setUserSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE, createToken({ sub: userId, role: "user", exp: Date.now() + 8 * 60 * 60 * 1000 }), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
}

export async function setAdminSession(adminId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, createToken({ sub: adminId, role: "admin", exp: Date.now() + 4 * 60 * 60 * 1000 }), {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 4,
  });
}

export async function clearUserSession() {
  const cookieStore = await cookies();
  cookieStore.set(USER_COOKIE, "", { path: "/", maxAge: 0 });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
}
