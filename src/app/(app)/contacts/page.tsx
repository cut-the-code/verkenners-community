import Link from "next/link";
import { requireOrg } from "@/lib/auth";
import { listContacts } from "@/server/services/contacts";
import { deleteContactAction } from "@/server/actions/contacts";
import { Button } from "@/components/ui/button";

export default async function ContactsPage() {
  const ctx = await requireOrg();
  const contacts = await listContacts(ctx);
  const canDelete = ctx.role === "owner" || ctx.role === "admin";

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Contacten</h1>
        <Link href="/contacts/new">
          <Button>Nieuw contact</Button>
        </Link>
      </div>

      {contacts.length === 0 ? (
        <p className="text-muted-foreground">
          Nog geen contacten. Maak je eerste contact aan.
        </p>
      ) : (
        <div className="overflow-hidden rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr>
                <th className="px-4 py-2 font-medium">Naam</th>
                <th className="px-4 py-2 font-medium">E-mail</th>
                <th className="px-4 py-2 font-medium">Telefoon</th>
                <th className="px-4 py-2 font-medium">Functie</th>
                {canDelete && <th className="px-4 py-2" />}
              </tr>
            </thead>
            <tbody>
              {contacts.map((c) => (
                <tr key={c.id} className="border-t border-border">
                  <td className="px-4 py-2">
                    {c.firstName} {c.lastName ?? ""}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {c.email ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {c.phone ?? "—"}
                  </td>
                  <td className="px-4 py-2 text-muted-foreground">
                    {c.jobTitle ?? "—"}
                  </td>
                  {canDelete && (
                    <td className="px-4 py-2 text-right">
                      <form action={deleteContactAction}>
                        <input type="hidden" name="id" value={c.id} />
                        <Button variant="ghost" size="sm" type="submit">
                          Verwijderen
                        </Button>
                      </form>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
