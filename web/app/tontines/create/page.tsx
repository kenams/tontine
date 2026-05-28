import { CreateTontineForm } from "@/components/app/create-tontine-form";
import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { requireUser } from "@/lib/auth";

export default async function CreateTontinePage() {
  const session = await requireUser();
  return (
    <MobileShell user={session} title="Creation">
      <PageHeading eyebrow="Nouveau groupe" title="Creer une tontine">
        Definissez montant, frequence, regles, penalites et fonds urgence.
      </PageHeading>
      <div className="glass rounded-[1.75rem] p-4">
        <CreateTontineForm />
      </div>
    </MobileShell>
  );
}
