export type Language = "en" | "fr";

export type Direction = "XOF_NGN" | "NGN_XOF";

export type Currency = "XOF" | "NGN";

export type TransactionStatus =
  | "Pending"
  | "Processing"
  | "Completed"
  | "Rejected"
  | "Failed";

export type KycStatus = "NotStarted" | "Pending" | "UnderReview" | "Approved" | "Rejected";

export type UserRole = "customer" | "support" | "compliance" | "ops" | "admin";

export interface User {
  id: string;
  fullName: string;
  phone: string;
  country: string;
  preferredLanguage: Language;
  role: UserRole;
  linkedExternalAccountId?: string;
  kycStatus: KycStatus;
  riskFlags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Rate {
  pair: Direction;
  rate: string;
  rateMicros: number;
  feeBps: number;
  spreadBps: number;
  updatedAt: string;
}

export interface Quote {
  id: string;
  userId: string;
  direction: Direction;
  sendAmount: string;
  sendAmountMinor: string;
  rateUsed: string;
  feeAmount: string;
  feeAmountMinor: string;
  receiveAmount: string;
  receiveAmountMinor: string;
  expiresAt: string;
  status: "PENDING_CONFIRMATION" | "CONFIRMED" | "EXPIRED";
  createdAt: string;
}

export interface Transaction {
  id: string;
  reference: string;
  userId: string;
  quoteId: string;
  direction: Direction;
  sourceCurrency: Currency;
  targetCurrency: Currency;
  sendAmount: string;
  sendAmountMinor: string;
  receiveAmount: string;
  receiveAmountMinor: string;
  status: TransactionStatus;
  rejectionReason?: string;
  paymentProofNote: string;
  createdAt: string;
  updatedAt: string;
}

export interface Wallet {
  id: string;
  userId: string;
  currency: Currency;
  availableMinor: string;
  heldMinor: string;
  createdAt: string;
  updatedAt: string;
}

export interface LedgerEntry {
  id: string;
  transactionId: string;
  debitAccount: string;
  creditAccount: string;
  currency: Currency;
  amountMinor: string;
  state: "pending" | "completed" | "failed";
  createdAt: string;
}

export interface AuditEvent {
  id: string;
  actorId: string;
  actorRole: UserRole | "system";
  action: string;
  entityType: string;
  entityId: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}
