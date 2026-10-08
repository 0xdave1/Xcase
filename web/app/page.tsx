"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

type Direction = "XOF_NGN" | "NGN_XOF";

type User = {
  id: string;
  fullName: string;
  phone: string;
  country: string;
  preferredLanguage: "en" | "fr";
};

type Quote = {
  id: string;
  direction: Direction;
  sendAmount: number;
  rateUsed: number;
  feeAmount: number;
  receiveAmount: number;
  expiresAt: string;
};

type Transaction = {
  id: string;
  reference: string;
  direction: Direction;
  sendAmount: number;
  receiveAmount: number;
  status: "Pending" | "Processing" | "Completed" | "Rejected";
  rejectionReason?: string;
  createdAt: string;
};

const defaultForm = {
  fullName: "",
  phone: "",
  country: "",
  preferredLanguage: "en",
};

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState(defaultForm);
  const [direction, setDirection] = useState<Direction>("XOF_NGN");
  const [sendAmount, setSendAmount] = useState("10000");
  const [quote, setQuote] = useState<Quote | null>(null);
  const [proofNote, setProofNote] = useState("");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [rate, setRate] = useState<number | null>(null);

  async function loadSession() {
    setLoading(true);
    const result = await fetch("/api/me");
    if (result.ok) {
      const data = await result.json();
      setUser(data.user);
      setForm({
        fullName: data.user.fullName,
        phone: data.user.phone,
        country: data.user.country,
        preferredLanguage: data.user.preferredLanguage,
      });
      setError(null);
    } else {
      setUser(null);
    }
    setLoading(false);
  }

  async function loadRate(selectedDirection: Direction) {
    const result = await fetch(`/api/rates/current?pair=${selectedDirection}`);
    if (!result.ok) {
      setRate(null);
      return;
    }

    const data = await result.json();
    setRate(data.rate.rate);
  }

  useEffect(() => {
    loadSession();
    loadRate("XOF_NGN");
  }, []);

  useEffect(() => {
    loadRate(direction);
  }, [direction]);

  useEffect(() => {
    if (!user) {
      return;
    }

    void (async () => {
      const result = await fetch("/api/transactions");
      if (!result.ok) {
        return;
      }

      const data = await result.json();
      setTransactions(data.transactions);
    })();
  }, [user]);

  const quoteSummary = useMemo(() => {
    if (!quote) {
      return null;
    }

    const sourceCurrency = quote.direction === "XOF_NGN" ? "XOF" : "NGN";
    const targetCurrency = quote.direction === "XOF_NGN" ? "NGN" : "XOF";

    return `${quote.sendAmount.toLocaleString()} ${sourceCurrency} → ${quote.receiveAmount.toLocaleString()} ${targetCurrency}`;
  }, [quote]);

  async function submitRegistration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/auth/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload?.error?.message ?? "Unable to create session.");
      setSubmitting(false);
      return;
    }

    setUser(payload.user);
    setSubmitting(false);
  }

  async function requestQuote(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/quotes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        direction,
        sendAmount: Number(sendAmount),
      }),
    });

    const payload = await response.json();

    if (!response.ok) {
      setError(payload?.error?.message ?? "Unable to generate quote.");
      setSubmitting(false);
      return;
    }

    setQuote(payload.quote);
    setSubmitting(false);
  }

  async function createTransaction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!quote) return;

    setSubmitting(true);
    setError(null);

    const response = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        quoteId: quote.id,
        paymentProofNote: proofNote,
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error?.message ?? "Unable to create transaction.");
      setSubmitting(false);
      return;
    }

    setProofNote("");
    setQuote(null);
    setTransactions((current) => [payload.transaction, ...current]);
    setSubmitting(false);
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setQuote(null);
    setTransactions([]);
  }

  if (loading) {
    return <main className="mx-auto w-full max-w-5xl p-4 sm:p-6">Loading your exchange dashboard…</main>;
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-6">
      <header className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-slate-500">Borderless Exchange</p>
            <h1 className="text-2xl font-semibold">Xcase XOF ⇄ NGN</h1>
          </div>
          {user ? (
            <div className="flex flex-wrap items-center gap-3">
              <a className="text-sm font-medium text-indigo-600 hover:text-indigo-500" href="/admin">
                Admin panel
              </a>
              <button
                type="button"
                className="rounded-md bg-slate-900 px-4 py-2 text-sm text-white"
                onClick={logout}
              >
                Log out
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {error ? <p className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}

      {!user ? (
        <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
          <h2 className="text-lg font-semibold">Create your exchange profile</h2>
          <p className="mt-1 text-sm text-slate-600">
            Register with your WhatsApp phone number to request rates and submit transfer proofs.
          </p>
          <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={submitRegistration}>
            <input
              className="rounded-md border border-slate-300 px-3 py-2"
              placeholder="Full name"
              value={form.fullName}
              onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
              required
            />
            <input
              className="rounded-md border border-slate-300 px-3 py-2"
              placeholder="Phone (+229...)"
              value={form.phone}
              onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
              required
            />
            <input
              className="rounded-md border border-slate-300 px-3 py-2"
              placeholder="Country"
              value={form.country}
              onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))}
              required
            />
            <select
              className="rounded-md border border-slate-300 px-3 py-2"
              value={form.preferredLanguage}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  preferredLanguage: event.target.value as "en" | "fr",
                }))
              }
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
            </select>
            <button
              disabled={submitting}
              className="sm:col-span-2 rounded-md bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
              type="submit"
            >
              {submitting ? "Creating profile..." : "Continue"}
            </button>
          </form>
        </section>
      ) : (
        <>
          <section className="grid gap-4 md:grid-cols-3">
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Signed in as</p>
              <p className="mt-1 font-medium">{user.fullName}</p>
              <p className="text-sm text-slate-600">{user.phone}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Active pair</p>
              <p className="mt-1 font-medium">{direction.replace("_", " → ")}</p>
              <p className="text-sm text-slate-600">Rate: {rate ? rate.toLocaleString() : "--"}</p>
            </article>
            <article className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
              <p className="text-sm text-slate-500">Language</p>
              <p className="mt-1 font-medium">{user.preferredLanguage === "en" ? "English" : "Français"}</p>
            </article>
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">Request quote</h2>
            <form className="mt-4 grid gap-3 sm:grid-cols-3" onSubmit={requestQuote}>
              <select
                className="rounded-md border border-slate-300 px-3 py-2"
                value={direction}
                onChange={(event) => setDirection(event.target.value as Direction)}
              >
                <option value="XOF_NGN">XOF → NGN</option>
                <option value="NGN_XOF">NGN → XOF</option>
              </select>
              <input
                className="rounded-md border border-slate-300 px-3 py-2"
                type="number"
                min="1"
                value={sendAmount}
                onChange={(event) => setSendAmount(event.target.value)}
              />
              <button
                disabled={submitting}
                className="rounded-md bg-indigo-600 px-4 py-2 text-white disabled:opacity-60"
                type="submit"
              >
                {submitting ? "Calculating..." : "Get quote"}
              </button>
            </form>

            {quote ? (
              <div className="mt-4 rounded-md border border-indigo-200 bg-indigo-50 p-4 text-sm text-indigo-900">
                <p className="font-medium">Quote ready: {quoteSummary}</p>
                <p>Rate: {quote.rateUsed.toLocaleString()} • Fee: {quote.feeAmount.toLocaleString()}</p>
                <p>Expires at: {new Date(quote.expiresAt).toLocaleTimeString()}</p>

                <form className="mt-3 grid gap-2 sm:grid-cols-[1fr_auto]" onSubmit={createTransaction}>
                  <input
                    className="rounded-md border border-indigo-300 bg-white px-3 py-2"
                    placeholder="Payment proof note/reference"
                    value={proofNote}
                    onChange={(event) => setProofNote(event.target.value)}
                    required
                  />
                  <button
                    disabled={submitting}
                    className="rounded-md bg-slate-900 px-4 py-2 text-white disabled:opacity-60"
                    type="submit"
                  >
                    {submitting ? "Submitting..." : "Confirm transfer"}
                  </button>
                </form>
              </div>
            ) : null}
          </section>

          <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
            <h2 className="text-lg font-semibold">Transaction history</h2>
            {transactions.length === 0 ? (
              <p className="mt-3 text-sm text-slate-600">No transfers yet. Request your first quote above.</p>
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
                    </tr>
                  </thead>
                  <tbody>
                    {transactions.map((transaction) => (
                      <tr key={transaction.id} className="border-b border-slate-100">
                        <td className="py-2 pr-4">{transaction.reference}</td>
                        <td className="py-2 pr-4">{transaction.direction.replace("_", " → ")}</td>
                        <td className="py-2 pr-4">{transaction.sendAmount.toLocaleString()}</td>
                        <td className="py-2 pr-4">{transaction.receiveAmount.toLocaleString()}</td>
                        <td className="py-2 pr-4">
                          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs">
                            {transaction.status}
                          </span>
                          {transaction.rejectionReason ? (
                            <span className="ml-2 text-xs text-red-600">{transaction.rejectionReason}</span>
                          ) : null}
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
