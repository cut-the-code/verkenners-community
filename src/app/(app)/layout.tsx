import Link from "next/link";
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs";
import { requireOrg } from "@/lib/auth";

const nav = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/contacts", label: "Contacten" },
  { href: "/companies", label: "Bedrijven" },
  { href: "/deals", label: "Deals" },
] as const;

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Vereist login + actieve organisatie; redirect anders.
  await requireOrg();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between border-b border-border px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="font-semibold">
            Verkenners CRM
          </Link>
          <nav className="flex gap-4 text-sm text-muted-foreground">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3">
          <OrganizationSwitcher hidePersonal />
          <UserButton />
        </div>
      </header>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
