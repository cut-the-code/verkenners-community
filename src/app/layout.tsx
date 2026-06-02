import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";

export const metadata: Metadata = {
  title: "Verkenners CRM",
  description: "Een klein, multi-tenant CRM",
};

/**
 * Placeholder publishable key zodat builds/preview-deploys zonder echte Clerk-
 * config toch slagen. Zet NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY als env var voor een
 * werkende login; die waarde overschrijft deze fallback.
 */
const PLACEHOLDER_CLERK_PK =
  "pk_test_ZHVtbXktY2xlcmstZG9tYWluLmNsZXJrLmFjY291bnRzLmRldiQ";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider
      publishableKey={
        process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY ?? PLACEHOLDER_CLERK_PK
      }
    >
      <html lang="nl">
        <body className="min-h-screen antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
