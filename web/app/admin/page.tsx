"use client";

import { FormEvent, useEffect, useState } from "react";

type AdminTransaction = {
  id: string;
  reference: string;
  direction: string;
  sendAmount: number;
  receiveAmount: number;
  status: "Pending" | "Processing" | "Completed" | "Rejected";
  rejectionReason?: string;
};

type Metrics = {
  dailyVolume: number;
  pendingCount: number;
  estimatedRevenue: number;
};

export default function AdminPage() {
  const [email, setEmail] = useState("admin@xcase.local");
  const [password, setPassword] = useState("ChangeMe123!");
  const [error, setError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<AdminTransaction[]>([]);
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [authenticated, setAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);

  async function loadAdminData() {
    const response = await fetch("/api/admin/transactions");
    if (!response.ok) {
      setAuthenticated(false);
      return;
    }

    const data = await response.json();
    setTransactions(data.transactions);
    setMetrics(data.metrics);
    setAuthenticated(true);
  }

  useEffect(() => {
    loadAdminData();
  }, []);

  async function login(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const payload = await response.json();
      setError(payload?.error?.message ?? "Unable to log in.");
      setLoading(false);
      return;
    }

    await loadAdminData();
    setLoading(false);
  }

  async function updateStatus(
    transactionId: string,
    status: "Processing" | "Completed" | "Rejected",
  ) {
    const rejectionReason =
      status === "Rejected"
        ? window.prompt("Reason for rejection") ?? "Missing payment details"
        : undefined;

    const response = await fetch(`/api/admin/transactions/${transactionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, rejectionReason }),
    });

    if (!response.ok) {
      const payload = await response.json();
      setError(payload?.error?.message ?? "Failed to update status.");
      return;
    }

    await loadAdminData();
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-4 sm:p-6">
      <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <p className="text-sm text-slate-500">Operations console</p>
        <h1 className="text-2xl font-semibold">Xcase Admin Dashboard</h1>
      </header>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {!authenticated ? (
        <section className="max-w-md rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold">Admin login</h2>
          <form className="mt-4 grid gap-3" onSubmit={login}>
            <input
              className="rounded-md border border-slate-300 px-3 py-2"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
            <input
              className="rounded-md border border-slate-300 px-3 py-2"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
            <button
              className="rounded-md bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
              disabled={loading}
              type="submit"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>
        </section>
      ) : (
        <>
          {metrics ? (
            <section className="grid gap-4 sm:grid-cols-3">
              <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Daily volume</p>
                <p className="text-xl font-semibold">{metrics.dailyVolume.toLocaleString()}</p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Pending transfers</p>
                <p className="text-xl font-semibold">{metrics.pendingCount}</p>
              </article>
              <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
                <p className="text-sm text-slate-500">Estimated fee revenue</p>
                <p className="text-xl font-semibold">{metrics.estimatedRevenue.toLocaleString()}</p>
              </article>
            </section>
          ) : null}

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">Transactions queue</h2>
            {transactions.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No customer transactions yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500">
                      <th className="py-2 pr-4">Reference</th>
                      <th className="py-2 pr-4">Direction</th>
                      <th className="py-2 pr-4">Send</th>
                      <th className="py-2 pr-4">Receive</th>
                      <th className="py-2 pr-4">Status</th>
                      <th className="py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-slate-100 align-top">
                        <td className="py-2 pr-4">{transaction.reference}</td>
                        <td className="py-2 pr-4">{transaction.direction.replace("_", " → ")}</td>
                        <td className="py-2 pr-4">{transaction.sendAmount.toLocaleString()}</td>
                        <td className="py-2 pr-4">{transaction.receiveAmount.toLocaleString()}</td>
                        <td className="py-2 pr-4">
                          {transaction.status}
                          {transaction.rejectionReason ? (
                            <p className="text-xs text-red-600">{transaction.rejectionReason}</p>
                          ) : null}
                        </td>
                        <td className="py-2">
                          <div className="flex flex-wrap gap-2">
                            <button
                              className="rounded bg-amber-100 px-2 py-1 text-xs text-amber-900"
                              onClick={() => updateStatus(transaction.id, "Processing")}
                              type="button"
                            >
                              Processing
                            </button>
                            <button
                              className="rounded bg-emerald-100 px-2 py-1 text-xs text-emerald-900"
                              onClick={() => updateStatus(transaction.id, "Completed")}
                              type="button"
                            >
                              Complete
                            </button>
                            <button
                              className="rounded bg-red-100 px-2 py-1 text-xs text-red-900"
                              onClick={() => updateStatus(transaction.id, "Rejected")}
                              type="button"
                            >
                              Reject
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}
    </main>
  );
}
