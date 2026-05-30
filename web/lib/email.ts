import "server-only";
import { Resend } from "resend";

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
const FROM = process.env.EMAIL_FROM ?? "Kotizy <noreply@kotizy.app>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3021";

async function send(to: string, subject: string, html: string) {
  if (!resend) {
    console.log(`[email] ${subject} → ${to}\n${html}`);
    return;
  }
  await resend.emails.send({ from: FROM, to, subject, html });
}

export async function sendWelcomeEmail(to: string, fullName: string) {
  await send(
    to,
    "Bienvenue sur Kotizy 🎉",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h1 style="font-size:28px;font-weight:900;margin:0 0 8px">Bienvenue, ${fullName} !</h1>
      <p style="color:#6b7280;margin:0 0 24px">Votre compte Kotizy est prêt. L'épargne collective, réinventée.</p>
      <a href="${APP_URL}/dashboard" style="display:inline-block;background:#22c55e;color:#050706;font-weight:900;padding:14px 28px;border-radius:16px;text-decoration:none;font-size:15px">Ouvrir mon dashboard</a>
      <p style="color:#9ca3af;font-size:13px;margin-top:32px">Votre wallet test de démarrage est déjà crédité. Rejoignez ou créez une tontine dès maintenant.</p>
    </div>`
  );
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${APP_URL}/reset-password?token=${token}`;
  await send(
    to,
    "Réinitialisation de votre mot de passe Kotizy",
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h1 style="font-size:24px;font-weight:900;margin:0 0 8px">Réinitialisation mot de passe</h1>
      <p style="color:#6b7280;margin:0 0 24px">Cliquez sur le bouton ci-dessous pour définir un nouveau mot de passe. Ce lien expire dans <strong>1 heure</strong>.</p>
      <a href="${url}" style="display:inline-block;background:#22c55e;color:#050706;font-weight:900;padding:14px 28px;border-radius:16px;text-decoration:none;font-size:15px">Réinitialiser mon mot de passe</a>
      <p style="color:#9ca3af;font-size:13px;margin-top:24px">Si vous n'avez pas demandé cette réinitialisation, ignorez cet email.</p>
      <p style="color:#d1d5db;font-size:11px;margin-top:8px;word-break:break-all">${url}</p>
    </div>`
  );
}

export async function sendContributionConfirmEmail(to: string, fullName: string, groupName: string, amount: string) {
  await send(
    to,
    `Cotisation confirmée — ${groupName}`,
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h1 style="font-size:24px;font-weight:900;margin:0 0 8px">Cotisation validée ✓</h1>
      <p style="color:#6b7280;margin:0 0 24px">Bonjour ${fullName}, votre cotisation de <strong>${amount}</strong> pour le groupe <strong>${groupName}</strong> a bien été enregistrée.</p>
      <a href="${APP_URL}/tontines" style="display:inline-block;background:#22c55e;color:#050706;font-weight:900;padding:14px 28px;border-radius:16px;text-decoration:none;font-size:15px">Voir mes groupes</a>
    </div>`
  );
}

export async function sendDueReminderEmail(to: string, fullName: string, groupName: string, amount: string, dueDate: string, autoPayEnabled: boolean) {
  await send(
    to,
    `⏰ Rappel — Cotisation ${groupName} dans 3 jours`,
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <div style="background:#fef9c3;border-radius:12px;padding:12px 16px;margin-bottom:24px;display:inline-block">
        <span style="font-size:13px;font-weight:700;color:#854d0e">⏰ Échéance dans 3 jours</span>
      </div>
      <h1 style="font-size:24px;font-weight:900;margin:0 0 8px">Rappel cotisation</h1>
      <p style="color:#6b7280;margin:0 0 8px">Bonjour ${fullName}, votre cotisation pour <strong>${groupName}</strong> arrive à échéance le <strong>${dueDate}</strong>.</p>
      <p style="color:#6b7280;margin:0 0 24px">Montant : <strong>${amount}</strong>${autoPayEnabled ? ' · <span style="color:#16a34a">Auto-paiement activé ✓</span>' : ''}</p>
      ${autoPayEnabled
        ? `<p style="background:#f0fdf4;border-radius:12px;padding:12px 16px;color:#15803d;font-size:13px;font-weight:700">Le prélèvement automatique est activé. Assurez-vous d'avoir le solde suffisant sur votre wallet.</p>`
        : `<a href="${APP_URL}/tontines" style="display:inline-block;background:#22c55e;color:#050706;font-weight:900;padding:14px 28px;border-radius:16px;text-decoration:none;font-size:15px">Payer maintenant</a>`}
    </div>`
  );
}

export async function sendPayoutEmail(to: string, fullName: string, groupName: string, amount: string, round: number) {
  await send(
    to,
    `🎉 C'est votre tour — ${groupName} vous verse ${amount}`,
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <div style="background:#f0fdf4;border-radius:12px;padding:12px 16px;margin-bottom:24px;display:inline-block">
        <span style="font-size:13px;font-weight:700;color:#15803d">🎉 Payout Round ${round}</span>
      </div>
      <h1 style="font-size:24px;font-weight:900;margin:0 0 8px">Vous recevez <span style="color:#22c55e">${amount}</span> !</h1>
      <p style="color:#6b7280;margin:0 0 24px">Bonjour ${fullName}, c'est votre tour de recevoir le pot du groupe <strong>${groupName}</strong>. Les fonds ont été crédités sur votre wallet Kotizy.</p>
      <a href="${APP_URL}/wallet" style="display:inline-block;background:#22c55e;color:#050706;font-weight:900;padding:14px 28px;border-radius:16px;text-decoration:none;font-size:15px">Voir mon wallet</a>
    </div>`
  );
}

export async function sendAutoPayConfirmEmail(to: string, fullName: string, groupName: string, amount: string) {
  await send(
    to,
    `✅ Paiement automatique effectué — ${groupName}`,
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <h1 style="font-size:24px;font-weight:900;margin:0 0 8px">Auto-paiement ✅</h1>
      <p style="color:#6b7280;margin:0 0 24px">Bonjour ${fullName}, votre cotisation de <strong>${amount}</strong> pour <strong>${groupName}</strong> a été prélevée automatiquement depuis votre wallet.</p>
      <a href="${APP_URL}/wallet" style="display:inline-block;background:#22c55e;color:#050706;font-weight:900;padding:14px 28px;border-radius:16px;text-decoration:none;font-size:15px">Voir mon wallet</a>
    </div>`
  );
}

export async function sendAutoPayFailEmail(to: string, fullName: string, groupName: string, amount: string) {
  await send(
    to,
    `⚠️ Solde insuffisant — Auto-paiement échoué — ${groupName}`,
    `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <div style="background:#fef2f2;border-radius:12px;padding:12px 16px;margin-bottom:24px;display:inline-block">
        <span style="font-size:13px;font-weight:700;color:#991b1b">⚠️ Solde insuffisant</span>
      </div>
      <h1 style="font-size:24px;font-weight:900;margin:0 0 8px">Auto-paiement échoué</h1>
      <p style="color:#6b7280;margin:0 0 24px">Bonjour ${fullName}, le prélèvement automatique de <strong>${amount}</strong> pour <strong>${groupName}</strong> a échoué : solde wallet insuffisant. Payez manuellement pour éviter une pénalité.</p>
      <a href="${APP_URL}/wallet/deposit" style="display:inline-block;background:#ef4444;color:#fff;font-weight:900;padding:14px 28px;border-radius:16px;text-decoration:none;font-size:15px">Recharger mon wallet</a>
    </div>`
  );
}
