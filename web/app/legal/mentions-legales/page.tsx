import Link from "next/link";

export const metadata = { title: "Mentions légales — Kotizy" };

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)]">← Retour</Link>
      <h1 className="mb-8 text-3xl font-black">Mentions légales</h1>
      <div className="space-y-6 text-[var(--muted)]">
        <section>
          <h2 className="mb-2 text-lg font-bold text-[var(--text)]">Éditeur</h2>
          <p>KAH Digital — kahdigital42@gmail.com<br />Micro-entreprise — France</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-[var(--text)]">Hébergement</h2>
          <p>Vercel Inc. — 340 Pine Street, San Francisco, CA 94104, USA<br />Base de données : Supabase (région EU)</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-[var(--text)]">Paiements</h2>
          <p>Stripe Payments Europe Ltd — établissement de paiement agréé (FSA Reference: 513142)</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-[var(--text)]">Contact</h2>
          <p><a href="mailto:kahdigital42@gmail.com" className="text-emerald-400 hover:underline">kahdigital42@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
}
