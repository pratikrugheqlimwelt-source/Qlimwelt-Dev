# Supabase Setup for Qlimwelt

This guide covers Google OAuth authentication, onboarding, and database setup for the Qlimwelt carbon intelligence platform.

## 1. Create a Supabase project

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Create a new project
3. Note your **Project URL** and **anon public key** (Settings → API)

## 2. Environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

> **Note:** This project uses **Next.js** (port 3000). If you use Vite, set `VITE_*` equivalents and use port 5173.

Never commit `.env.local` or expose the **service role key** in frontend code.

## 3. Run database migrations

Open the Supabase SQL Editor and run:

```
supabase/migrations/001_auth_and_onboarding.sql
```

This creates:

- `profiles`, `companies`, `company_members`, `onboarding_responses`
- Row Level Security policies
- Auto profile creation trigger
- `complete_onboarding()` RPC function

## 4. Configure Supabase Auth

In Supabase Dashboard → **Authentication → URL Configuration**:

| Setting | Development value |
|---------|-------------------|
| Site URL | `http://localhost:3000` |
| Redirect URLs | `http://localhost:3000/auth/callback` |

Add production URLs when deploying (e.g. `https://app.qlimwelt.com/auth/callback`).

## 5. Enable Google OAuth provider

1. Supabase Dashboard → **Authentication → Providers → Google**
2. Enable Google provider
3. Copy the **Callback URL** shown by Supabase (e.g. `https://your-project.supabase.co/auth/v1/callback`)

## 6. Google Cloud OAuth setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create or select a project
3. **APIs & Services → OAuth consent screen**
   - User type: External (or Internal for workspace)
   - App name: Qlimwelt
   - Scopes: only `openid`, `email`, `profile` (basic account info)
   - Do **not** request Gmail, Drive, Calendar, or Contacts scopes
4. **APIs & Services → Credentials → Create OAuth client ID**
   - Application type: **Web application**
   - Authorised JavaScript origins:
     - `http://localhost:3000`
     - `http://localhost:5173` (if using Vite)
     - Your production domain
   - Authorised redirect URIs:
     - The Supabase callback URL from step 5
5. Copy **Client ID** and **Client Secret** into Supabase Google provider settings

## 7. Start the application

```bash
npm install
npm run dev
```

Or with a clean cache:

```bash
npm run dev:clean
```

Open [http://localhost:3000](http://localhost:3000) and click **Open Dashboard** → you will be redirected to `/login`.

## Authentication flow

1. User clicks **Open Dashboard** → `/login`
2. User clicks **Continue with Google**
3. Google OAuth (name, email, profile image only)
4. Redirect to `/auth/callback`
5. If onboarding incomplete → `/onboarding`
6. If complete → `/dashboard/overview`

## Development URLs summary

| URL | Purpose |
|-----|---------|
| `http://localhost:3000` | App (Next.js) |
| `http://localhost:3000/login` | Login page |
| `http://localhost:3000/auth/callback` | OAuth callback |
| `http://localhost:3000/onboarding` | Onboarding wizard |
| `http://localhost:5173` | Vite dev server (if applicable) |
| `http://localhost:5173/auth/callback` | Vite OAuth callback |

## Troubleshooting

- **Redirect loop:** Ensure Site URL and Redirect URLs match exactly in Supabase
- **OAuth error:** Verify Google redirect URI matches Supabase callback URL
- **RLS errors:** Confirm migration ran successfully and user is authenticated
- **Profile not created:** Check `handle_new_user` trigger in SQL migration
