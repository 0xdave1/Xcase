import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getUserSession } from "@/lib/session";
import { getUserById } from "@/lib/store";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return jsonError(401, {
      code: "UNAUTHORIZED",
      message: "Please sign in to continue.",
    });
  }

  const user = getUserById(session.sub);
  if (!user) {
    return jsonError(401, {
      code: "UNAUTHORIZED",
      message: "Session is invalid.",
    });
  }

  return NextResponse.json({ user });
}
