import Link from "next/link";

export const metadata = {
  title: "Politique de cookies — Kotizy",
  description: "Comment Kotizy utilise les cookies et technologies de suivi.",
};

export default function CookiesPage() {
  const updated = "31 mai 2026";
  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <Link
        href="/"
        className="mb-8 inline-flex items-center gap-2 text-sm text-[var(--muted)] hover:text-[var(--text)]"
      >
        ← Retour
      </Link>
      <h1 className="mb-2 text-3xl font-black">Politique de cookies</h1>
      <p className="mb-8 text-sm text-[var(--muted)]">Dernière mise à jour : {updated}</p>

      <div className="space-y-6 text-[var(--text)]">
        <section>
          <h2 className="mb-3 text-xl font-bold">1. Qu&apos;est-ce qu&apos;un cookie ?</h2>
          <p className="leading-7 text-[var(--muted)]">
            Un cookie est un petit fichier texte déposé sur votre appareil lors de votre visite sur un site web. Il
            permet au site de mémoriser certaines informations sur votre session.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">2. Cookies utilisés par Kotizy</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-[var(--muted)]">
              <thead>
                <tr className="border-b border-[var(--surface-strong)]">
                  <th className="py-2 text-left font-bold text-[var(--text)]">Nom</th>
                  <th className="py-2 text-left font-bold text-[var(--text)]">Type</th>
                  <th className="py-2 text-left font-bold text-[var(--text)]">Durée</th>
                  <th className="py-2 text-left font-bold text-[var(--text)]">Finalité</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-[var(--surface-strong)]">
                  <td className="py-3 pr-4 font-mono text-xs">tontine_session</td>
                  <td className="py-3 pr-4">Strictement nécessaire</td>
                  <td className="py-3 pr-4">7 jours</td>
                  <td className="py-3">Authentification — maintien de la session utilisateur. httpOnly, SameSite=Lax.</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 leading-7 text-[var(--muted)]">
            Kotizy n&apos;utilise <strong className="text-[var(--text)]">aucun cookie publicitaire</strong>, aucun
            cookie de tracking tiers (Google Analytics, Facebook Pixel, etc.) et aucun cookie de personnalisation.
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">3. Base légale</h2>
          <p className="leading-7 text-[var(--muted)]">
            Le cookie de session est strictement nécessaire au fonctionnement du service d&apos;authentification. Il est
            exempt de consentement préalable conformément aux directives ePrivacy et aux recommandations de la CNIL
            (délibération n° 2020-091).
          </p>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">4. Gestion des cookies</h2>
          <p className="leading-7 text-[var(--muted)]">
            Vous pouvez supprimer les cookies à tout moment depuis les paramètres de votre navigateur. La suppression du
            cookie de session entraîne la déconnexion de votre compte. Les paramètres de gestion des cookies varient
            selon les navigateurs :
          </p>
          <ul className="mt-3 space-y-1 text-[var(--muted)]">
            <li>
              •{" "}
              <a
                href="https://support.google.com/chrome/answer/95647"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                Google Chrome
              </a>
            </li>
            <li>
              •{" "}
              <a
                href="https://support.mozilla.org/fr/kb/effacer-cookies-donnees-site-firefox"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                Mozilla Firefox
              </a>
            </li>
            <li>
              •{" "}
              <a
                href="https://support.apple.com/fr-fr/guide/safari/sfri11471/mac"
                target="_blank"
                rel="noopener noreferrer"
                className="text-emerald-400 hover:underline"
              >
                Safari
              </a>
            </li>
          </ul>
        </section>

        <section>
          <h2 className="mb-3 text-xl font-bold">5. Contact</h2>
          <p className="leading-7 text-[var(--muted)]">
            Pour toute question relative aux cookies :{" "}
            <a href="mailto:kahdigital42@gmail.com" className="text-emerald-400 hover:underline">
              kahdigital42@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
