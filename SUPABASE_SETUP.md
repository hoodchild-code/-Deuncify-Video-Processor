# Supabase Auth Setup

Deuncify uses [Supabase Auth](https://supabase.com/docs/guides/auth) for user accounts. Follow these steps to configure it.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) and sign in
2. Create a new project (free tier is fine)
3. Wait for the project to finish provisioning

## 2. Get your API keys

1. In the Supabase dashboard, go to **Project Settings** → **API**
2. Copy:
   - **Project URL** → `VITE_SUPABASE_URL`
   - **anon public** key → `VITE_SUPABASE_ANON_KEY`
   - **JWT Secret** (under "JWT Settings") → `SUPABASE_JWT_SECRET`

## 3. Configure environment variables

**Local development** – create `.env` in the project root:

```env
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
SUPABASE_JWT_SECRET=your-jwt-secret-from-supabase
```

**Production (EC2)** – add the same variables to `.env` on the server.

> **Note:** `VITE_` prefixed vars are embedded in the frontend at build time. Rebuild after changing them.

## 4. Enable email auth

Supabase enables email/password auth by default. In **Authentication** → **Providers** → **Email**:

- Confirm **Enable Email provider** is on
- Optionally enable **Confirm email** if you want users to verify before logging in (they’ll get a confirmation email)

## 5. Optional: Add OAuth providers (Google, GitHub)

1. Go to **Authentication** → **Providers**
2. Enable **Google** or **GitHub**
3. Follow the wizard to configure OAuth credentials
4. Add redirect URL: `https://deuncifyer.com` (and `http://localhost:5000` for dev)

To use OAuth in the app, you’d add sign-in buttons that call `supabase.auth.signInWithOAuth({ provider: 'google' })` in the frontend.

## 6. Database migration

The app no longer uses a local `users` table. Run the migration:

```bash
npm run db:push
```

This will:
- Drop the old `users` table
- Update the `videos` table to use Supabase user IDs

**Important:** Existing video history linked to old local user IDs will no longer be accessible. For a fresh deployment this is fine. For migration, you’d need a custom script to map old users to new Supabase IDs.

## 7. Test

1. Run `npm run dev`
2. Visit http://localhost:5000
3. Click **Sign up** and create an account
4. Log in and process a video – it should save to history
