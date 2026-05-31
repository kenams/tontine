import { CreateTontineForm } from "@/components/app/create-tontine-form";
import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { requireUser } from "@/lib/auth";

export default async function CreateTontinePage() {
  const session = await requireUser();
  return (
    <MobileShell user={session} title="Création">
      <PageHeading eyebrow="Nouveau groupe" title="Créer une tontine">
        Définissez montant, fréquence, règles, pénalités et fonds d'urgence.
      </PageHeading>
      <div className="glass rounded-[1.75rem] p-4">
        <CreateTontineForm />
      </div>
    </MobileShell>
  );
}
