import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Xcase Borderless Exchange",
  description: "WhatsApp-first XOF ⇄ NGN borderless exchange MVP dashboard",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">{children}</body>
    </html>
  );
}
