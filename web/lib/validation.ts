import { z } from "zod";

const phoneRegex = /^\+?[0-9]{8,15}$/;

export const sessionSchema = z.object({
  fullName: z.string().trim().min(3).max(80),
  phone: z.string().trim().regex(phoneRegex, "Use a valid phone number with country code."),
  country: z.string().trim().min(2).max(56),
  preferredLanguage: z.enum(["en", "fr"]),
});

export const quoteSchema = z.object({
  direction: z.enum(["XOF_NGN", "NGN_XOF"]),
  sendAmount: z.number().gt(0).lte(5000000),
});

export const transactionSchema = z.object({
  quoteId: z.string().uuid(),
  paymentProofNote: z.string().trim().min(6).max(500),
});

export const adminLoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export const updateStatusSchema = z
  .object({
    status: z.enum(["Processing", "Completed", "Rejected"]),
    rejectionReason: z.string().trim().min(5).max(200).optional(),
  })
  .superRefine((value, ctx) => {
    if (value.status === "Rejected" && !value.rejectionReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "rejectionReason is required when status is Rejected",
        path: ["rejectionReason"],
      });
    }
  });
