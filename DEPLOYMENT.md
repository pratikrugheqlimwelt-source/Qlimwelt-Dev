# Deploy Qlimwelt to GitHub + Custom Domain

This guide covers pushing the app to GitHub and deploying on **Vercel** with your own domain (recommended for Next.js).

Replace `yourdomain.com` with your actual domain (e.g. `qlimwelt.com` or `app.qlimwelt.com`).

---

## Part 1 — Push to GitHub

### 1. Install Git (if needed)

Download and install: [https://git-scm.com/download/win](https://git-scm.com/download/win)

Restart your terminal after install.

### 2. Create a GitHub repository

1. Go to [https://github.com/new](https://github.com/new)
2. Repository name: `qlimwelt` (or your choice)
3. **Private** or **Public**
4. Do **not** add README, .gitignore, or license (this project already has them)
5. Click **Create repository**

### 3. Initialize and push (run in project folder)

Open PowerShell in `C:\Users\rughe\Documents\Qlimwelt FInal`:

```powershell
git init
git add .
git commit -m "Initial commit: Qlimwelt carbon intelligence platform"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/qlimwelt.git
git push -u origin main
```

Replace `YOUR_USERNAME/qlimwelt` with your GitHub repo URL.

> **Never commit** `.env.local` — it is already in `.gitignore`.

---

## Part 2 — Deploy on Vercel

### 1. Import project

1. Go to [https://vercel.com](https://vercel.com) and sign in with GitHub
2. **Add New → Project**
3. Import your `qlimwelt` repository
4. Framework preset: **Next.js** (auto-detected)

### 2. Environment variables

Before deploying, add these under **Environment Variables**:

| Name | Value | Environments |
|------|-------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://yijbhapdgndraxqxeryv.supabase.co` | Production, Preview, Development |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase anon key | Production, Preview, Development |
| `NEXT_PUBLIC_APP_URL` | `https://yourdomain.com` | **Production only** |
| `NEXT_PUBLIC_APP_URL` | `https://your-vercel-url.vercel.app` | Preview (optional) |

For Preview deployments, you can use the Vercel preview URL as `NEXT_PUBLIC_APP_URL` or leave preview auth disabled.

Click **Deploy**.

---

## Part 3 — Custom domain on Vercel

### 1. Add domain in Vercel

1. Project → **Settings → Domains**
2. Add your domain: `yourdomain.com` and/or `www.yourdomain.com`
3. Vercel shows DNS records to add

### 2. Configure DNS (at your registrar)

Typical setup:

| Type | Name | Value |
|------|------|--------|
| **A** | `@` | `76.76.21.21` |
| **CNAME** | `www` | `cname.vercel-dns.com` |

(Use the exact values Vercel shows for your project.)

Wait 5–30 minutes for DNS propagation.

### 3. Update production env var

In Vercel → **Settings → Environment Variables**:

```
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Redeploy: **Deployments → ⋯ → Redeploy**.

---

## Part 4 — Supabase (production auth)

Supabase Dashboard → **Authentication → URL Configuration**:

| Setting | Value |
|---------|--------|
| **Site URL** | `https://yourdomain.com` |
| **Redirect URLs** | `https://yourdomain.com/auth/callback` |

Keep localhost URLs too if you still develop locally:

```
http://localhost:3000/auth/callback
https://yourdomain.com/auth/callback
```

---

## Part 5 — Google OAuth (production)

### Google Cloud Console

**APIs & Services → Credentials → your OAuth client**

Add to **Authorized JavaScript origins**:

```
https://yourdomain.com
```

Keep existing:

```
http://localhost:3000
https://yijbhapdgndraxqxeryv.supabase.co/auth/v1/callback
```

Redirect URI stays the **Supabase** callback (do not change):

```
https://yijbhapdgndraxqxeryv.supabase.co/auth/v1/callback
```

### OAuth consent screen

If app is in **Testing**, add production test users or **Publish** the app for public sign-in.

---

## Part 6 — Verify deployment

1. Open `https://yourdomain.com`
2. Click **Open Dashboard** → `/login`
3. **Continue with Google** → should redirect to `/onboarding` or `/dashboard/overview`
4. Check Vercel **Deployments** tab if build fails

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Build fails on Vercel | Check build logs; run `npm run build` locally |
| Auth redirect loop | Supabase Site URL + Redirect URLs must match production domain |
| Google sign-in fails | Add `https://yourdomain.com` to Google JS origins |
| 500 after deploy | Confirm all 3 env vars are set in Vercel |
| Custom domain not loading | Wait for DNS; verify A/CNAME records |

---

## Optional — other hosts

This is a standard Next.js app. You can also deploy on:

- **Netlify** — connect GitHub, set same env vars, add domain
- **Railway / Render** — `npm run build` + `npm run start`
- **VPS** — Node 20+, PM2, nginx reverse proxy + SSL (Certbot)

Vercel is the simplest path for Next.js + custom domain + automatic HTTPS.
