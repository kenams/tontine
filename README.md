# TontineApp

Application mobile de tontine numerique.

## Structure

- `mobile` : application React Native avec Expo et TypeScript
- `backend` : API Node.js / Express en TypeScript
- `shared` : types metier partages
- `web` : application Next.js PWA mobile-first avec Prisma, auth, admin, monitoring temps reel et donnees demo multi-devises

## Demarrage

### Web App Next.js

```bash
cd web
npm install --cache .\.npm-cache
npm run db:setup
npm run dev:local
```

URL locale : `http://localhost:3021`

Le serveur local `dev:local` lance Next.js et Socket.io sur le meme port. Le dashboard utilisateur et le backoffice admin affichent un flux live simule pret a raccorder a une infrastructure temps reel de production.

La web app gere plusieurs devises en demo : XOF, XAF, EUR, USD, GBP, CAD, AUD, NGN, GHS, KES, ZAR, MAD, AED, INR, JPY et BRL. Le XOF reste disponible comme devise principale locale, mais les wallets, tontines, transactions et exports admin portent leur propre devise.

Production en ligne : `https://tontineapp-web.vercel.app`

La web app est branchee sur Supabase Postgres, schema `tontineapp`, via Prisma. Les donnees utilisateurs, tontines, transactions, logs admin et paiements ne sont plus sur une base demo ephemere.

Stripe est branche cote web : `STRIPE_SECRET_KEY` et `STRIPE_WEBHOOK_SECRET` restent dans les variables Vercel, Checkout est utilise pour Stripe/carte internationale, et le webhook production est `https://tontineapp-web.vercel.app/api/payments/stripe/webhook`.

Comptes demo :

- Admin : `admin@tontineapp.com` / `Admin123!`
- Utilisateur : `user@tontineapp.com` / `User123!`

Mode PostgreSQL / Supabase :

```bash
cd web
npm run prisma:generate
npm run db:setup
npm run dev:local
```

### Mobile

```bash
cd mobile
npm install
npm run start
```

### Backend

```bash
cd backend
npm install
npm run dev
```
