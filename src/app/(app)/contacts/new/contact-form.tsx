"use client";

import { useActionState } from "react";
import Link from "next/link";
import {
  createContactAction,
  type ActionState,
} from "@/server/actions/contacts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const initial: ActionState = {};

export function ContactForm() {
  const [state, formAction, pending] = useActionState(
    createContactAction,
    initial,
  );

  return (
    <form action={formAction} className="max-w-lg space-y-4">
      {state.error && (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <Field label="Voornaam *" name="firstName" required />
      <Field label="Achternaam" name="lastName" />
      <Field label="E-mail" name="email" type="email" />
      <Field label="Telefoon" name="phone" />
      <Field label="Functie" name="jobTitle" />

      <div className="space-y-1">
        <label htmlFor="notes" className="text-sm font-medium">
          Notities
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          className="flex w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Opslaan…" : "Opslaan"}
        </Button>
        <Link href="/contacts">
          <Button type="button" variant="outline">
            Annuleren
          </Button>
        </Link>
      </div>
    </form>
  );
}

function Field({
  label,
  name,
  type = "text",
  required = false,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <div className="space-y-1">
      <label htmlFor={name} className="text-sm font-medium">
        {label}
      </label>
      <Input id={name} name={name} type={type} required={required} />
    </div>
  );
}
