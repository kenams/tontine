# TontineApp Web

Web app Next.js mobile-first pour tontines, wallet, paiements, admin fintech, monitoring live et donnees multi-devises sur Supabase Postgres.

## Production

URL: `https://tontineapp-web.vercel.app`

Base: Supabase Postgres, schema `tontineapp`, via Prisma.

Paiement: Stripe Checkout et webhook public `/api/payments/stripe/webhook`.

## Lancement local

```bash
npm install --cache .\.npm-cache
npm run prisma:generate
npm run dev:local
```

URL locale: `http://localhost:3021`

Comptes:

- Admin: `admin@tontineapp.com` / `Admin123!`
- Utilisateur: `user@tontineapp.com` / `User123!`

## Base Supabase

Le schema principal Prisma utilise PostgreSQL. Pour initialiser ou resynchroniser la base cible:

```bash
npm run db:setup
```

Les variables `DATABASE_URL` et `DIRECT_URL` doivent pointer vers Supabase avec `schema=tontineapp`.

## Modules inclus

- Auth sessions signees, roles user/admin, mots de passe hashes.
- Wallet multi-devises: XOF, XAF, EUR, USD, GBP, CAD, AUD, NGN, GHS, KES, ZAR, MAD, AED, INR, JPY, BRL.
- Tontines: creation, invitation, join code, cotisation, rotation, retards, penalites, votes, fonds urgence.
- Paiements: Stripe, cards, Apple Pay, Google Pay, Wave, Orange Money, MTN MoMo, Flutterwave, bank transfer.
- Stripe: Checkout reel, webhook `/api/payments/stripe/webhook`, synchronisation retour `/api/payments/stripe/sync`.
- IA: coach financier local pret OpenAI, signaux fraude, scoring comportemental.
- Backoffice: analytics, utilisateurs, tontines, transactions, CSV, alertes fraude, logs, monitoring live.
- PWA: manifest, mobile-first, dark/light mode, animations Framer Motion.
