import Link from "next/link";

export const metadata = { title: "CGU — Kotizy", description: "Conditions Générales d'Utilisation de Kotizy" };

export default function CGUPage() {
  const updated = "31 mai 2026";
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link href="/" className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)]">
        ← Retour
      </Link>
      <h1 className="mb-2 text-3xl font-black">Conditions Générales d'Utilisation</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">Dernière mise à jour : {updated}</p>

      <div className="prose prose-invert max-w-none space-y-6 text-[var(--text)]">
        <section>
          <h2 className="text-xl font-bold">1. Objet</h2>
          <p className="text-[var(--muted)] leading-7">Kotizy est une plateforme de tontines digitales éditée par KAH Digital. Les présentes CGU régissent l'utilisation de la plateforme accessible à l'adresse tontineapp-web.vercel.app ainsi que de l'application mobile Kotizy.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">2. Inscription et compte</h2>
          <p className="text-[var(--muted)] leading-7">L'inscription est réservée aux personnes majeures (+18 ans). L'utilisateur s'engage à fournir des informations exactes et à maintenir la confidentialité de ses identifiants. KAH Digital se réserve le droit de suspendre tout compte en cas d'activité frauduleuse ou de violation des présentes CGU.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">3. Wallet et paiements</h2>
          <p className="text-[var(--muted)] leading-7">Le wallet Kotizy permet d'alimenter un solde pour participer aux tontines. Les paiements par carte bancaire et les services de monnaie électronique sont fournis par <strong>Stripe Payments Europe Ltd</strong>, établissement de monnaie électronique agréé par la Banque Centrale d'Irlande (numéro d'autorisation : C187865), conformément à la Directive européenne sur les services de paiement (DSP2). Kotizy ne stocke aucune donnée bancaire.</p>
          <p className="text-[var(--muted)] leading-7 mt-2">Les fonds déposés sont utilisables exclusivement au sein de la plateforme pour les cotisations de tontines. Les retraits supérieurs à 500€ nécessitent une vérification d'identité (KYC) conformément aux obligations anti-blanchiment (LCB-FT). Les retraits validés sont traités sous 3 jours ouvrés.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">3bis. Conformité réglementaire</h2>
          <p className="text-[var(--muted)] leading-7">KAH Digital agit en qualité d'agent de services de paiement de Stripe Payments Europe Ltd. Les services de collecte et de redistribution de fonds dans le cadre des tontines sont opérés via l'infrastructure réglementée de Stripe. En cas de dépassement des seuils légaux de monnaie électronique, KAH Digital s'engage à procéder aux déclarations requises auprès de l'ACPR (Autorité de Contrôle Prudentiel et de Résolution).</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">4. Tontines et engagements</h2>
          <p className="text-[var(--muted)] leading-7">En rejoignant une tontine, l'utilisateur s'engage à honorer les cotisations aux échéances prévues. Le non-paiement répété peut entraîner la suspension du compte et une dégradation du score de confiance. Kotizy n'est pas responsable des litiges entre membres d'un groupe.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">5. Score de confiance</h2>
          <p className="text-[var(--muted)] leading-7">Le score de confiance est calculé automatiquement en fonction du comportement de paiement. Il n'a aucune valeur légale ni financière au sens du scoring bancaire. Il est strictement interne à la plateforme Kotizy.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">6. Responsabilités</h2>
          <p className="text-[var(--muted)] leading-7">Kotizy est un outil de coordination. KAH Digital ne garantit pas le paiement des membres d'une tontine et ne peut être tenu responsable des pertes financières résultant de défaillances de paiement au sein d'un groupe. L'utilisateur utilise la plateforme sous sa propre responsabilité.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">7. Propriété intellectuelle</h2>
          <p className="text-[var(--muted)] leading-7">La marque Kotizy, le logo et l'ensemble du contenu sont la propriété exclusive de KAH Digital. Toute reproduction sans autorisation est interdite.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">8. Droit applicable</h2>
          <p className="text-[var(--muted)] leading-7">Les présentes CGU sont soumises au droit français. En cas de litige, les parties s'engagent à rechercher une solution amiable avant toute action judiciaire. Le tribunal compétent sera celui du ressort de KAH Digital.</p>
        </section>

        <section>
          <h2 className="text-xl font-bold">9. Contact</h2>
          <p className="text-[var(--muted)] leading-7">Pour toute question : <a href="mailto:kahdigital42@gmail.com" className="text-emerald-400 hover:underline">kahdigital42@gmail.com</a></p>
        </section>
      </div>
    </div>
  );
}
