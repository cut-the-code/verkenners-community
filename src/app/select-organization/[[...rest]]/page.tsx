import { OrganizationList } from "@clerk/nextjs";

/**
 * Getoond wanneer een ingelogde user nog geen actieve organisatie heeft.
 * Hier kan men een organisatie aanmaken of er een kiezen.
 */
export default function SelectOrganizationPage() {
  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <OrganizationList
        hidePersonal
        afterSelectOrganizationUrl="/dashboard"
        afterCreateOrganizationUrl="/dashboard"
      />
    </main>
  );
}
