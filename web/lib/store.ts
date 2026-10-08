import { randomUUID } from "crypto";
import { Direction, Language, Quote, Rate, Transaction, TransactionStatus, User } from "./types";

interface AppState {
  users: User[];
  rates: Rate[];
  quotes: Quote[];
  transactions: Transaction[];
}

const DEFAULT_RATES: Rate[] = [
  {
    pair: "XOF_NGN",
    rate: 2.47,
    feePercent: 1.1,
    updatedAt: new Date().toISOString(),
  },
  {
    pair: "NGN_XOF",
    rate: 0.4,
    feePercent: 1.1,
    updatedAt: new Date().toISOString(),
  },
];

const globalState = globalThis as typeof globalThis & { __xcaseState?: AppState };

const state =
  globalState.__xcaseState ??
  (globalState.__xcaseState = {
    users: [],
    rates: DEFAULT_RATES,
    quotes: [],
    transactions: [],
  });

function nowIso() {
  return new Date().toISOString();
}

export function upsertUser(input: {
  fullName: string;
  phone: string;
  country: string;
  preferredLanguage: Language;
}) {
  const existing = state.users.find((user) => user.phone === input.phone);
  if (existing) {
    existing.fullName = input.fullName;
    existing.country = input.country;
    existing.preferredLanguage = input.preferredLanguage;
    existing.updatedAt = nowIso();
    return existing;
  }

  const user: User = {
    id: randomUUID(),
    fullName: input.fullName,
    phone: input.phone,
    country: input.country,
    preferredLanguage: input.preferredLanguage,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  state.users.push(user);
  return user;
}

export function getUserById(userId: string) {
  return state.users.find((user) => user.id === userId);
}

export function getCurrentRate(pair: Direction) {
  return state.rates.find((rate) => rate.pair === pair);
}

export function createQuote(userId: string, direction: Direction, sendAmount: number) {
  const activeRate = getCurrentRate(direction);
  if (!activeRate) {
    throw new Error("Rate is unavailable for this pair.");
  }

  const feeAmount = Number(((sendAmount * activeRate.feePercent) / 100).toFixed(2));
  const converted = direction === "XOF_NGN" ? sendAmount * activeRate.rate : sendAmount * activeRate.rate;
  const receiveAmount = Number((converted - feeAmount).toFixed(2));

  const quote: Quote = {
    id: randomUUID(),
    userId,
    direction,
    sendAmount,
    rateUsed: activeRate.rate,
    feeAmount,
    receiveAmount,
    expiresAt: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    createdAt: nowIso(),
  };

  state.quotes.push(quote);
  return quote;
}

export function createTransaction(userId: string, quoteId: string, paymentProofNote: string) {
  const quote = state.quotes.find((item) => item.id === quoteId && item.userId === userId);
  if (!quote) {
    throw new Error("Quote not found.");
  }

  if (new Date(quote.expiresAt).getTime() < Date.now()) {
    throw new Error("Quote has expired. Please request a new quote.");
  }

  const transaction: Transaction = {
    id: randomUUID(),
    reference: `XC-${Math.floor(Math.random() * 9_000_000 + 1_000_000)}`,
    userId,
    quoteId,
    direction: quote.direction,
    sendAmount: quote.sendAmount,
    receiveAmount: quote.receiveAmount,
    status: "Pending",
    paymentProofNote,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  state.transactions.push(transaction);
  return transaction;
}

export function getUserTransactions(userId: string) {
  return state.transactions
    .filter((transaction) => transaction.userId === userId)
    .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function getAllTransactions() {
  return state.transactions.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export function updateTransactionStatus(
  transactionId: string,
  status: TransactionStatus,
  rejectionReason?: string,
) {
  const transaction = state.transactions.find((item) => item.id === transactionId);
  if (!transaction) {
    return undefined;
  }

  transaction.status = status;
  transaction.rejectionReason = status === "Rejected" ? rejectionReason : undefined;
  transaction.updatedAt = nowIso();

  return transaction;
}

export function getDashboardMetrics() {
  const dailyVolume = state.transactions.reduce((total, transaction) => total + transaction.sendAmount, 0);
  const pendingCount = state.transactions.filter((transaction) => transaction.status === "Pending").length;
  const completed = state.transactions.filter((transaction) => transaction.status === "Completed");
  const estimatedRevenue = completed.reduce((sum, item) => {
    const quote = state.quotes.find((q) => q.id === item.quoteId);
    return sum + (quote?.feeAmount ?? 0);
  }, 0);

  return {
    dailyVolume: Number(dailyVolume.toFixed(2)),
    pendingCount,
    estimatedRevenue: Number(estimatedRevenue.toFixed(2)),
  };
}
