import { requireUser } from "@/lib/auth";
import { ReferralClient } from "./client";

export default async function ReferralPage() {
  const session = await requireUser();
  return <ReferralClient user={session} />;
}
