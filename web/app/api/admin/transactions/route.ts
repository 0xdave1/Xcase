import { NextResponse } from "next/server";
import { jsonError } from "@/lib/http";
import { getAdminSession } from "@/lib/session";
import { getAllTransactions, getDashboardMetrics } from "@/lib/store";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return jsonError(401, {
      code: "UNAUTHORIZED",
      message: "Admin authentication required.",
    });
  }

  return NextResponse.json({
    metrics: getDashboardMetrics(),
    transactions: getAllTransactions(),
  });
}
