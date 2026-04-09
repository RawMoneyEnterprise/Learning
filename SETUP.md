# Local Development Setup

## Prerequisites

- Node.js 20+
- npm 10+
- A [Neon](https://neon.tech) account (PostgreSQL database)
- A [Vercel](https://vercel.com) account (deployment)

---

## 1. Clone & Install

```bash
git clone <repo-url>
cd paperclip-alt
npm install
```

---

## 2. Environment Variables

Copy the example file and fill in values:

```bash
cp .env.example .env.local
```

| Variable | Description |
|---|---|
| `DATABASE_URL` | Neon connection string (pooled URL) |
| `AUTH_SECRET` | Random secret — generate with `openssl rand -base64 32` |
| `AUTH_URL` | Full URL of the app, e.g. `http://localhost:3000` |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | Google OAuth credentials (optional) |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | GitHub OAuth credentials (optional) |
| `ANTHROPIC_API_KEY` | Anthropic API key for agent execution |
| `NEXT_PUBLIC_APP_URL` | Public-facing URL of the app |

---

## 3. Neon Database Setup

1. Go to [neon.tech](https://neon.tech) and create a new project (e.g. `paperclip-alt`).
2. Neon automatically creates a `main` branch — use this as **production**.
3. Create a `dev` branch for local development:
   - In the Neon console → **Branches** → **New Branch** → name it `dev`.
4. Copy the **connection string** for the `dev` branch (pooled) into `DATABASE_URL` in `.env.local`.

Run migrations:

```bash
npm run db:migrate
```

Optionally seed initial data:

```bash
npm run db:seed
```

---

## 4. Run the App Locally

```bash
npm run dev
```

The app is available at [http://localhost:3000](http://localhost:3000).

---

## 5. GitHub Actions CI

The CI pipeline (`.github/workflows/ci.yml`) runs on every PR and push to `main`:

- **Prisma generate + validate** — checks schema integrity
- **Lint** — ESLint
- **Typecheck** — `tsc --noEmit`
- **Unit tests** — Vitest
- **Build** — Next.js production build

No secrets are needed for CI — a dummy `DATABASE_URL` is used for schema-only operations.

---

## 6. Vercel Deployment

### Initial Setup

The Vercel project is already provisioned:

- **Project name:** `learning-vy8a`
- **Production URL:** `https://learning-vy8a.vercel.app`

To link locally and deploy:

1. Install the Vercel CLI: `npm i -g vercel`
2. Run `vercel --name learning-vy8a` in the project root to link to the existing project.
3. In the Vercel dashboard → **Settings → Environment Variables**, add:
   - `DATABASE_URL` — Neon production pooled connection string
   - `VITE_NEON_AUTH_URL` — Neon Auth endpoint
   - `AUTH_SECRET` — generate with `openssl rand -base64 32`
   - `AUTH_URL` — `https://learning-vy8a.vercel.app`
   - `NEXT_PUBLIC_APP_URL` — `https://learning-vy8a.vercel.app`
   - `ANTHROPIC_API_KEY`
   - Any OAuth credentials (`AUTH_GOOGLE_ID`, etc.)

### Auto-Deploy

- **Push to `main`** → deploys to production automatically.
- **Open a PR** → Vercel creates a preview deployment linked in the PR.

### Database Migrations on Deploy

Add a build command override in `vercel.json` (already committed) that runs `prisma migrate deploy` before the Next.js build.

---

## 7. Useful Commands

```bash
npm run dev          # Start local dev server
npm run build        # Production build
npm run typecheck    # TypeScript check
npm run lint         # ESLint
npm run test         # Vitest unit tests
npm run db:generate  # Regenerate Prisma client
npm run db:migrate   # Run pending migrations (dev)
npm run db:deploy    # Apply migrations (production-safe)
npm run db:studio    # Open Prisma Studio
npm run db:seed      # Seed the database
```
