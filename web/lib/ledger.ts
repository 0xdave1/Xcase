import { randomUUID } from "crypto";
import { Currency, LedgerEntry } from "./types";

export function createLedgerEntry(input: {
  transactionId: string;
  debitAccount: string;
  creditAccount: string;
  currency: Currency;
  amountMinor: bigint;
  state?: LedgerEntry["state"];
}): LedgerEntry {
  if (input.amountMinor <= 0n) {
    throw new Error("Ledger amount must be greater than zero.");
  }

  return {
    id: randomUUID(),
    transactionId: input.transactionId,
    debitAccount: input.debitAccount,
    creditAccount: input.creditAccount,
    currency: input.currency,
    amountMinor: input.amountMinor.toString(),
    state: input.state ?? "pending",
    createdAt: new Date().toISOString(),
  };
}

export function validateBalancedEntries(entries: LedgerEntry[]) {
  const balanceByCurrency = new Map<Currency, bigint>();

  for (const entry of entries) {
    const amount = BigInt(entry.amountMinor);
    const current = balanceByCurrency.get(entry.currency) ?? 0n;
    balanceByCurrency.set(entry.currency, current + amount);
  }

  for (const amount of balanceByCurrency.values()) {
    if (amount <= 0n) {
      throw new Error("Ledger batch must have positive totals per currency.");
    }
  }

  return true;
}
