import { CreateTontineForm } from "@/components/app/create-tontine-form";
import { MobileShell } from "@/components/app/mobile-shell";
import { PageHeading } from "@/components/app/page-heading";
import { requireUser } from "@/lib/auth";
import { getServerT } from "@/lib/i18n/server";

export default async function CreateTontinePage() {
  const session = await requireUser();
  const { t } = await getServerT();
  return (
    <MobileShell user={session} title={t("createTontine", "navTitle")}>
      <PageHeading eyebrow={t("createTontine", "eyebrow")} title={t("createTontine", "title")}>
        {t("createTontine", "subtitle")}
      </PageHeading>
      <div className="glass rounded-[1.75rem] p-4">
        <CreateTontineForm />
      </div>
    </MobileShell>
  );
}
