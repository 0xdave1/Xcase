import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/http";
import { getAdminSession } from "@/lib/session";
import { updateTransactionStatus } from "@/lib/store";
import { updateStatusSchema } from "@/lib/validation";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await getAdminSession();
  if (!session) {
    return jsonError(401, {
      code: "UNAUTHORIZED",
      message: "Admin authentication required.",
    });
  }

  const parsed = await readJson(request, updateStatusSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  const { id } = await params;
  const transaction = updateTransactionStatus(
    id,
    parsed.data.status,
    parsed.data.rejectionReason,
  );

  if (!transaction) {
    return jsonError(404, {
      code: "NOT_FOUND",
      message: "Transaction not found.",
    });
  }

  return NextResponse.json({ transaction });
}
