import { NextResponse } from "next/server";
import { z } from "zod";
import { jsonError } from "@/lib/http";
import { getCurrentRate } from "@/lib/store";

const pairSchema = z.enum(["XOF_NGN", "NGN_XOF"]);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pairResult = pairSchema.safeParse(searchParams.get("pair") ?? "XOF_NGN");

  if (!pairResult.success) {
    return jsonError(400, {
      code: "VALIDATION_ERROR",
      message: "pair must be XOF_NGN or NGN_XOF",
    });
  }

  const rate = getCurrentRate(pairResult.data);
  if (!rate) {
    return jsonError(404, {
      code: "RATE_NOT_FOUND",
      message: "No active rate found for the requested pair.",
    });
  }

  return NextResponse.json({ rate });
}
