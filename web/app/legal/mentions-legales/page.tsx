import Link from "next/link";

export const metadata = { title: "Mentions légales — Kotizy" };

export default function MentionsLegalesPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)]">← Retour</Link>
      <h1 className="mb-8 text-3xl font-black">Mentions légales</h1>
      <div className="space-y-6 text-[var(--muted)]">
        <section>
          <h2 className="mb-2 text-lg font-bold text-[var(--text)]">Éditeur du site</h2>
          <p>
            <strong className="text-[var(--text)]">KAH Digital</strong><br />
            Micro-entreprise — entreprise en cours d&apos;immatriculation<br />
            Site web : <a href="https://kah-digital.ch/" target="_blank" rel="noopener noreferrer" className="text-emerald-400 hover:underline">kah-digital.ch</a><br />
            Email : <a href="mailto:kahdigital42@gmail.com" className="text-emerald-400 hover:underline">kahdigital42@gmail.com</a>
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-[var(--text)]">Directeur de la publication</h2>
          <p>KAH Digital — kahdigital42@gmail.com</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-[var(--text)]">Hébergement</h2>
          <p>
            <strong className="text-[var(--text)]">Vercel Inc.</strong> — 340 Pine Street, Suite 900, San Francisco, CA 94104, USA<br />
            Base de données : <strong className="text-[var(--text)]">Supabase</strong> — hébergement région EU (Frankfurt)
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-[var(--text)]">Services de paiement</h2>
          <p>
            <strong className="text-[var(--text)]">Stripe Payments Europe Ltd</strong> — 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, D02 H210, Irlande<br />
            Établissement de monnaie électronique agréé par la Banque Centrale d&apos;Irlande (n° C187865)
          </p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-[var(--text)]">Propriété intellectuelle</h2>
          <p>L&apos;ensemble du contenu du site Kotizy (textes, images, code, marque) est la propriété exclusive de KAH Digital. Toute reproduction sans autorisation écrite préalable est interdite.</p>
        </section>
        <section>
          <h2 className="mb-2 text-lg font-bold text-[var(--text)]">Contact</h2>
          <p><a href="mailto:kahdigital42@gmail.com" className="text-emerald-400 hover:underline">kahdigital42@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
}
