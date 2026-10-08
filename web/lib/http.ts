import { z } from "zod";
import { NextResponse } from "next/server";

interface ApiError {
  code: string;
  message: string;
  details?: unknown;
}

export function jsonError(status: number, error: ApiError) {
  return NextResponse.json({ error }, { status });
}

export async function readJson<T extends z.ZodTypeAny>(request: Request, schema: T) {
  try {
    const payload = await request.json();
    const parsed = schema.safeParse(payload);

    if (!parsed.success) {
      return {
        success: false as const,
        response: jsonError(400, {
          code: "VALIDATION_ERROR",
          message: "Request payload validation failed.",
          details: parsed.error.flatten(),
        }),
      };
    }

    return { success: true as const, data: parsed.data };
  } catch {
    return {
      success: false as const,
      response: jsonError(400, {
        code: "INVALID_JSON",
        message: "Invalid JSON payload.",
      }),
    };
  }
}
