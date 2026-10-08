import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/http";
import { setUserSession } from "@/lib/session";
import { upsertUser } from "@/lib/store";
import { sessionSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const parsed = await readJson(request, sessionSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const user = upsertUser(parsed.data);
  await setUserSession(user.id);

  return NextResponse.json({ user });
}

export async function GET() {
  return jsonError(405, {
    code: "METHOD_NOT_ALLOWED",
    message: "Use POST for this endpoint.",
  });
}
