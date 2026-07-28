# Qlimwelt

Carbon intelligence platform — emissions dashboard, CSRD-ready reporting, and Google OAuth onboarding.

## Stack

- **Next.js 15** (App Router)
- **TypeScript**, **Tailwind CSS**, **shadcn/ui**
- **Supabase** (auth, profiles, onboarding)
- **Recharts** (dashboard analytics)

## Local development

```bash
npm install
cp .env.example .env.local
# Fill in Supabase URL, anon key, and APP_URL
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

See [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) for auth and database setup.

## Deploy

See [DEPLOYMENT.md](./DEPLOYMENT.md) for GitHub + Vercel + custom domain instructions.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run dev:clean` | Clear `.next` cache and start dev |
| `npm run build` | Production build |
| `npm run start` | Run production server locally |
| `npm run lint` | ESLint |
