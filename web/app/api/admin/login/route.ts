import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/http";
import { setAdminSession } from "@/lib/session";
import { adminLoginSchema } from "@/lib/validation";

const defaultEmail = process.env.XCASE_ADMIN_EMAIL ?? "admin@xcase.local";
const defaultPassword = process.env.XCASE_ADMIN_PASSWORD ?? "ChangeMe123!";

export async function POST(request: Request) {
  const parsed = await readJson(request, adminLoginSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  if (
    parsed.data.email.toLowerCase() !== defaultEmail.toLowerCase() ||
    parsed.data.password !== defaultPassword
  ) {
    return jsonError(401, {
      code: "INVALID_CREDENTIALS",
      message: "Incorrect email or password.",
    });
  }

  await setAdminSession(defaultEmail);

  return NextResponse.json({ ok: true });
}
