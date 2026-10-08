import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/http";
import { getUserSession } from "@/lib/session";
import { createQuote } from "@/lib/store";
import { quoteSchema } from "@/lib/validation";

export async function POST(request: Request) {
  const session = await getUserSession();
  if (!session) {
    return jsonError(401, {
      code: "UNAUTHORIZED",
      message: "Please sign in to request a quote.",
    });
  }

  const parsed = await readJson(request, quoteSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const quote = createQuote(session.sub, parsed.data.direction, parsed.data.sendAmount);
    return NextResponse.json({ quote });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create quote";
    return jsonError(400, {
      code: "QUOTE_ERROR",
      message,
    });
  }
}
