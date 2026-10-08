import { NextResponse } from "next/server";
import { jsonError, readJson } from "@/lib/http";
import { getUserSession } from "@/lib/session";
import { createTransaction, getUserTransactions } from "@/lib/store";
import { transactionSchema } from "@/lib/validation";

export async function GET() {
  const session = await getUserSession();
  if (!session) {
    return jsonError(401, {
      code: "UNAUTHORIZED",
      message: "Please sign in to view transactions.",
    });
  }

  return NextResponse.json({ transactions: getUserTransactions(session.sub) });
}

export async function POST(request: Request) {
  const session = await getUserSession();
  if (!session) {
    return jsonError(401, {
      code: "UNAUTHORIZED",
      message: "Please sign in to create a transaction.",
    });
  }

  const parsed = await readJson(request, transactionSchema);
  if (!parsed.success) {
    return parsed.response;
  }

  try {
    const transaction = createTransaction(
      session.sub,
      parsed.data.quoteId,
      parsed.data.paymentProofNote,
    );
    return NextResponse.json({ transaction });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unable to create transaction";
    return jsonError(400, {
      code: "TRANSACTION_ERROR",
      message,
    });
  }
}
