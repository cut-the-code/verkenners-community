import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export default function MarketingPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center gap-8 px-6 text-center">
      <div className="space-y-4">
        <h1 className="text-4xl font-bold tracking-tight">Verkenners CRM</h1>
        <p className="text-lg text-muted-foreground">
          Een klein, snel CRM voor je team. Contacten, bedrijven en deals op
          één plek — netjes gescheiden per organisatie.
        </p>
      </div>
      <div className="flex gap-3">
        <SignedOut>
          <Link href="/sign-up">
            <Button size="lg">Aan de slag</Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline">
              Inloggen
            </Button>
          </Link>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard">
            <Button size="lg">Naar dashboard</Button>
          </Link>
        </SignedIn>
      </div>
    </main>
  );
}
