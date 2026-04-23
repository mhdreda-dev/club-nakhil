# Club Nakhil

Private kickboxing training platform for coaches and members.

Club Nakhil is focused on training operations only:
- session planning
- attendance tracking with QR
- coach feedback
- member progress
- points, badges, and leaderboard
- announcements

No payments, subscriptions, or finance features are included.

## Tech Stack

- Next.js 16 (App Router + Route Handlers)
- PostgreSQL
- Prisma ORM
- NextAuth (credentials + JWT sessions)
- Tailwind CSS
- Supabase Storage (avatars)
- QR generation: `qrcode`
- QR scanning: `html5-qrcode`

## Implemented Roles

### Admin
- Access admin dashboard
- Review all registered members
- Filter members by status (pending/active/blocked)
- Approve pending members
- Block or reactivate members
- Reject (delete) pending registration requests
- Manually create member accounts

### Coach
- View and edit own profile
- Create, edit, and delete sessions
- View attendance by session
- View member ratings + average score
- Add member progress notes
- Publish announcements
- Track member points and badges

### Member
- Secure login
- View and edit own profile
- View schedule and own attendance status
- Scan QR to check in (duplicate-safe)
- View progress notes, points, badges
- Rate coach after attended sessions
- View announcements and leaderboard

## Main Pages

### Public
- `/` home
- `/login` login
- `/signup` member self-registration
- `/pending-approval` waiting page after registration

### Coach
- `/coach/dashboard`
- `/coach/profile`
- `/coach/sessions`
- `/coach/attendance`
- `/coach/ratings`
- `/coach/members`
- `/coach/announcements`

### Member
- `/member/dashboard`
- `/member/profile`
- `/member/sessions`
- `/member/attendance`
- `/member/progress`
- `/member/rate-coach`
- `/member/announcements`
- `/member/leaderboard`

### Admin
- `/admin/dashboard`
- `/admin/members`

## API Routes

- `POST/GET /api/auth/[...nextauth]`
- `POST /api/auth/register`
- `GET/POST /api/sessions`
- `PATCH/DELETE /api/sessions/[id]`
- `GET /api/attendance`
- `POST /api/attendance/scan`
- `GET/POST /api/ratings`
- `GET/POST /api/announcements`
- `GET/POST /api/progress-notes`
- `GET /api/members`
- `GET/POST /api/admin/members`
- `PATCH/DELETE /api/admin/members/[memberId]`
- `GET /api/leaderboard`
- `GET/PATCH /api/profile`
- `POST /api/profile/avatar`

## Project Structure

```txt
club-nakhil/
├─ prisma/
│  ├─ migrations/
│  ├─ schema.prisma
│  └─ seed.ts
├─ src/
│  ├─ app/
│  │  ├─ api/
│  │  ├─ coach/
│  │  ├─ member/
│  │  ├─ dashboard/
│  │  ├─ login/
│  │  ├─ globals.css
│  │  ├─ layout.tsx
│  │  └─ page.tsx
│  ├─ components/
│  ├─ lib/
│  ├─ proxy.ts
│  └─ types/
├─ .env.example
├─ next.config.ts
└─ package.json
```

## Environment Variables

Copy `.env.example` to `.env`.

Required:

```env
DATABASE_URL="postgresql://USER:PASSWORD@HOST:5432/club_nakhil?schema=public"
DIRECT_URL="postgresql://USER:PASSWORD@HOST:5432/club_nakhil?schema=public"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="replace-with-a-long-random-secret"
NEXT_PUBLIC_SUPABASE_URL="https://YOUR_PROJECT_REF.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="YOUR_SUPABASE_ANON_KEY"
SUPABASE_SERVICE_ROLE_KEY="YOUR_SUPABASE_SERVICE_ROLE_KEY"
NOTIFICATION_WEBHOOK_URL=""
ADMIN_NOTIFICATION_EMAILS="admin@clubnakhil.ma"
```

Production on Vercel:
- `NEXTAUTH_URL` must be your production domain, for example `https://club-nakhil.vercel.app`
- use a strong random `NEXTAUTH_SECRET`
- keep `SUPABASE_SERVICE_ROLE_KEY` server-side only (never expose it in browser code)
- `NOTIFICATION_WEBHOOK_URL` is optional and enables admin/member status notifications

## Supabase Storage Setup (Avatars)

1. Create or open your Supabase project.
2. Go to Storage and create a bucket named `avatars`.
3. Set the bucket to **Public** (avatars are rendered via public URL in UI).
4. Copy the project URL and keys:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
5. Add these variables in local `.env` and in Vercel Project Settings.

Notes:
- Avatar uploads are performed server-side via `/api/profile/avatar` using the service role key.
- Users can upload only their own avatar because the API uses authenticated session identity.
- Avatar files are stored under `avatars/{userId}/avatar-{timestamp}-{nonce}.{ext}`.

## PostgreSQL + Prisma Setup

1. Create a PostgreSQL database (Neon/Supabase/Railway/Postgres).
2. Put the pooled connection string in `DATABASE_URL`.
3. Put the direct connection string in `DIRECT_URL`.
   If your provider does not give you a separate direct URL, you can reuse `DATABASE_URL`.
4. Replace the `USER`, `PASSWORD`, and `HOST` placeholders in `.env`.
5. Run migrations.
6. Seed demo data.

Commands:

```bash
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run db:seed
npm run dev
```

## Demo Accounts (Seed)

- Admin: `admin@clubnakhil.ma` / `Admin123!`
- Coach: `coach@clubnakhil.ma` / `Coach123!`
- Member: `ayoub@clubnakhil.ma` / `Member123!`

## Build and Run Scripts

- `npm run dev` - local dev server
- `npm run lint` - lint checks
- `npm run build` - production build
- `npm start` - run built app
- `npm run prisma:generate` - generate Prisma client
- `npm run prisma:migrate` - run dev migration
- `npm run prisma:deploy` - run production migrations
- `npm run db:seed` - seed demo data

## Vercel Deployment Guide

1. Push this repo to GitHub.
2. Import repo in Vercel.
3. Add env vars in Vercel Project Settings:
   - `DATABASE_URL`
   - `NEXTAUTH_URL`
   - `NEXTAUTH_SECRET`
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`
4. Set build command: `npm run build`
5. Set install command: `npm install`
6. Deploy.
7. Run production migrations once:
   - locally with production `DATABASE_URL`: `npm run prisma:deploy`
   - or in Vercel shell during first rollout.
8. Optional demo seed in production:
   - `npm run db:seed`

## Vercel + Prisma Notes

- Prisma client is generated automatically via `postinstall`.
- Route handlers are serverless-friendly (no long-running process assumptions).
- Auth uses JWT strategy and works in serverless environments.
- `outputFileTracingRoot` is configured in `next.config.ts` for stable monorepo/parent lockfile setups.

## Troubleshooting

### 1) `PrismaClientInitializationError`
- Verify `DATABASE_URL` is correct and reachable.
- Confirm SSL requirements from your DB provider.

### 2) `NEXTAUTH_URL` or callback issues
- Ensure `NEXTAUTH_URL` matches the exact deployed URL.
- Re-deploy after changing auth env vars.

### 3) Login works locally but not in production
- Check `NEXTAUTH_SECRET` exists in Vercel env vars.
- Confirm users are seeded in production database.

### 4) Migrations not applied on production
- Run `npm run prisma:deploy` against production `DATABASE_URL`.

### 5) QR scanner camera permission denied
- Use HTTPS (required for camera on most browsers).
- Allow camera permission in browser settings.

### 6) Avatar upload fails
- Verify `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY`.
- Confirm the `avatars` bucket exists in Supabase Storage.
- Check bucket visibility is public if avatars do not render.

## MVP Scope Confirmation

This implementation intentionally excludes:
- payments
- subscriptions
- revenue tracking
- financial management

It is private and focused on coach/member training workflows only.
