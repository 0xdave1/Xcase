export type Language = "en" | "fr";

export type Direction = "XOF_NGN" | "NGN_XOF";

export type TransactionStatus =
  | "Pending"
  | "Processing"
  | "Completed"
  | "Rejected";

export interface User {
  id: string;
  fullName: string;
  phone: string;
  country: string;
  preferredLanguage: Language;
  createdAt: string;
  updatedAt: string;
}

export interface Rate {
  pair: Direction;
  rate: number;
  feePercent: number;
  updatedAt: string;
}

export interface Quote {
  id: string;
  userId: string;
  direction: Direction;
  sendAmount: number;
  rateUsed: number;
  feeAmount: number;
  receiveAmount: number;
  expiresAt: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  reference: string;
  userId: string;
  quoteId: string;
  direction: Direction;
  sendAmount: number;
  receiveAmount: number;
  status: TransactionStatus;
  rejectionReason?: string;
  paymentProofNote: string;
  createdAt: string;
  updatedAt: string;
}
