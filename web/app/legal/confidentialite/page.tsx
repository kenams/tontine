import Link from "next/link";

export const metadata = { title: "Politique de confidentialité — Kotizy", description: "Comment Kotizy collecte, utilise et protège vos données personnelles." };

export default function PrivacyPage() {
  const updated = "31 mai 2026";
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)]">
        ← Retour
      </Link>
      <h1 className="mb-2 text-3xl font-black">Politique de confidentialité</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">Dernière mise à jour : {updated} — Conforme RGPD (UE) 2016/679</p>

      <div className="space-y-6 text-[var(--text)]">
        <section>
          <h2 className="mb-3 text-xl font-bold">1. Responsable du traitement</h2>
          <p className="leading-7 text-[var(--muted)]">KAH Digital — kahdigital42@gmail.com. Données hébergées sur Supabase (UE) et Vercel (UE).</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">2. Données collectées</h2>
          <ul className="space-y-2 text-[var(--muted)]">
            <li>• <strong className="text-[var(--text)]">Identité :</strong> nom complet, adresse email, numéro de téléphone</li>
            <li>• <strong className="text-[var(--text)]">Financières :</strong> historique des transactions, solde wallet (pas de données bancaires brutes)</li>
            <li>• <strong className="text-[var(--text)]">Comportementales :</strong> participation aux tontines, score de confiance calculé</li>
            <li>• <strong className="text-[var(--text)]">Techniques :</strong> adresse IP (logs de sécurité), horodatage des connexions</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">3. Finalités et bases légales</h2>
          <ul className="space-y-2 text-[var(--muted)]">
            <li>• Exécution du contrat (gestion du compte, tontines, wallet)</li>
            <li>• Obligations légales (lutte contre la fraude, LCB-FT)</li>
            <li>• Intérêt légitime (sécurité de la plateforme, prévention des abus)</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">4. Durée de conservation</h2>
          <ul className="space-y-2 text-[var(--muted)]">
            <li>• Données de compte : jusqu'à suppression du compte + 1 an</li>
            <li>• Transactions financières : 5 ans (obligation légale)</li>
            <li>• Logs de sécurité : 1 an</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">5. Vos droits (RGPD)</h2>
          <p className="mb-3 leading-7 text-[var(--muted)]">Vous disposez des droits suivants, exercables à tout moment à l'adresse kahdigital42@gmail.com :</p>
          <ul className="space-y-2 text-[var(--muted)]">
            <li>• <strong className="text-[var(--text)]">Accès</strong> — obtenir une copie de vos données</li>
            <li>• <strong className="text-[var(--text)]">Rectification</strong> — corriger vos données inexactes</li>
            <li>• <strong className="text-[var(--text)]">Effacement</strong> — supprimer votre compte et vos données (hors obligations légales)</li>
            <li>• <strong className="text-[var(--text)]">Portabilité</strong> — recevoir vos données dans un format structuré</li>
            <li>• <strong className="text-[var(--text)]">Opposition</strong> — vous opposer à certains traitements</li>
          </ul>
          <p className="mt-3 leading-7 text-[var(--muted)]">Délai de réponse : 30 jours. Recours possible auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener" className="text-emerald-400 hover:underline">CNIL</a>.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">6. Sous-traitants</h2>
          <ul className="space-y-2 text-[var(--muted)]">
            <li>• <strong className="text-[var(--text)]">Stripe</strong> (paiements) — PCI-DSS Level 1, DPA signé</li>
            <li>• <strong className="text-[var(--text)]">Supabase</strong> (base de données) — hébergement UE, conforme RGPD</li>
            <li>• <strong className="text-[var(--text)]">Vercel</strong> (hébergement) — conformité SOC 2</li>
            <li>• <strong className="text-[var(--text)]">Resend</strong> (emails transactionnels) — conformité RGPD</li>
            <li>• <strong className="text-[var(--text)]">OpenAI</strong> (coach IA) — données non utilisées pour l'entraînement</li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">7. Cookies</h2>
          <p className="leading-7 text-[var(--muted)]">Kotizy utilise uniquement un cookie de session sécurisé (httpOnly, SameSite) nécessaire au fonctionnement de l'authentification. Aucun cookie publicitaire ou de tracking tiers.</p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">8. Contact DPO</h2>
          <p className="leading-7 text-[var(--muted)]"><a href="mailto:kahdigital42@gmail.com" className="text-emerald-400 hover:underline">kahdigital42@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
}
