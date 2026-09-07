# Nudge Deployment Guide

## ✅ Step 1: GitHub Repository (COMPLETED)
- Repository: https://github.com/shreyasgurav/Nudge
- Branch: main
- Status: ✅ Pushed successfully
- Project: Nudge - Instagram DM Automation Platform

---

## 🔄 Step 2: Supabase Database Setup (IN PROGRESS)

### Your Supabase Project
- Project ID: `sfydgbennrrvypzhwjju`
- Dashboard: https://supabase.com/dashboard/project/sfydgbennrrvypzhwjju

### Actions Required:

1. **Get Database Connection Strings**
   - Go to: https://supabase.com/dashboard/project/sfydgbennrrvypzhwjju/settings/database
   - Copy **Connection Pooling** URL (for `DATABASE_URL`)
   - Copy **Direct Connection** URL (for `DIRECT_URL`)
   - Format should be: `postgresql://postgres.[project-ref]:[password]@aws-0-us-east-1.pooler.supabase.com:6543/postgres`

2. **Update Environment Variables**
   Add to Vercel later:
   ```bash
   DATABASE_URL="postgresql://postgres.sfydgbennrrvypzhwjju:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
   DIRECT_URL="postgresql://postgres.sfydgbennrrvypzhwjju:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
   ```

3. **Run Database Migrations**
   After getting the URLs, run locally first to test:
   ```bash
   # Update .env with Supabase URLs
   npx prisma migrate deploy
   ```

---

## 🔄 Step 3: Upstash Redis Setup (PENDING)

### Actions Required:

1. **Create Redis Database**
   - Go to: https://console.upstash.com/redis
   - Click "Create Database"
   - Name: `nudge-production`
   - Region: Choose closest to your users (e.g., `us-east-1`)
   - Type: Regional (free tier)

2. **Get Redis URL**
   - After creation, go to database details
   - Copy **REST URL** or **Redis URL**
   - Format: `redis://default:[password]@[region].upstash.io:6379`

3. **Add to Environment Variables**
   ```bash
   REDIS_URL="redis://default:[password]@[region].upstash.io:6379"
   ```

---

## 🔄 Step 4: Vercel Deployment (PENDING)

### Actions Required:

1. **Import Project**
   - Go to: https://vercel.com/new
   - Click "Import Git Repository"
   - Select: `shreyasgurav/Nudge`
   - Framework Preset: Next.js (auto-detected)

2. **Configure Environment Variables**
   Add ALL variables from `.env.example`:

   **Database:**
   ```
   DATABASE_URL=<from Supabase - pooled>
   DIRECT_URL=<from Supabase - direct>
   ```

   **Redis:**
   ```
   REDIS_URL=<from Upstash>
   ```

   **Auth:**
   ```
   NEXTAUTH_URL=https://your-app.vercel.app
   NEXTAUTH_SECRET=<generate new: openssl rand -base64 32>
   ```

   **Admin:**
   ```
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD=<strong password>
   ```

   **Instagram:**
   ```
   INSTAGRAM_APP_ID=<your Meta app ID>
   INSTAGRAM_APP_SECRET=<your Meta app secret>
   INSTAGRAM_WEBHOOK_VERIFY_TOKEN=<random string>
   ```

   **Email (Resend):**
   ```
   EMAIL_FROM=noreply@yourdomain.com
   RESEND_API_KEY=<your Resend key>
   ```

3. **Deploy**
   - Click "Deploy"
   - Wait for build to complete
   - Get production URL: `https://your-app.vercel.app`

4. **Run Migrations**
   After first deploy, run migrations via Vercel CLI or locally:
   ```bash
   # If using Vercel CLI
   vercel env pull .env.production
   npx prisma migrate deploy
   ```

---

## 🔄 Step 5: Railway Worker Setup (PENDING)

### Actions Required:

1. **Create New Project**
   - Go to: https://railway.app/new
   - Click "Deploy from GitHub repo"
   - Select: `shreyasgurav/Nudge`

2. **Configure Service**
   - Service Name: `nudge-worker`
   - Root Directory: `/` (default)
   - Build Command: `npm install`
   - Start Command: `npm run worker`

3. **Add Environment Variables**
   Copy ALL the same variables from Vercel (they need to be identical)

4. **Deploy**
   - Click "Deploy"
   - Monitor logs to ensure worker starts successfully
   - Should see: "Worker started, processing jobs..."

---

## 🔄 Step 6: Instagram Meta App Configuration (PENDING)

### Actions Required:

1. **Update Webhook URL**
   - Go to: https://developers.facebook.com/apps/[your-app-id]/webhooks/
   - Edit Instagram webhook
   - Callback URL: `https://your-app.vercel.app/api/webhooks/instagram`
   - Verify Token: (same as `INSTAGRAM_WEBHOOK_VERIFY_TOKEN`)
   - Subscribe to: `messages`, `messaging_postbacks`, `message_echoes`

2. **Update OAuth Redirect URLs**
   - Go to: https://developers.facebook.com/apps/[your-app-id]/instagram-basic-display/basic-display/
   - Valid OAuth Redirect URIs: `https://your-app.vercel.app/api/instagram/callback`
   - Deauthorize Callback URL: `https://your-app.vercel.app/data-deletion`

3. **Test Instagram Connection**
   - Visit: `https://your-app.vercel.app`
   - Sign in with magic link
   - Connect Instagram account
   - Verify webhook receives test event

---

## 📋 Deployment Checklist

- [x] Push code to GitHub
- [ ] Set up Supabase database
- [ ] Get Supabase connection URLs
- [ ] Create Upstash Redis database
- [ ] Get Redis URL
- [ ] Deploy to Vercel
- [ ] Add all environment variables to Vercel
- [ ] Run database migrations
- [ ] Deploy worker to Railway
- [ ] Add environment variables to Railway
- [ ] Update Meta App webhook URL
- [ ] Update Meta App OAuth redirect URLs
- [ ] Test Instagram connection flow
- [ ] Test DM automation
- [ ] Test admin panel login
- [ ] Monitor worker logs
- [ ] Set up error tracking (optional: Sentry)

---

## 🚨 Important Notes

1. **Never commit `.env` file** - It's already in `.gitignore`
2. **Use strong passwords** for `ADMIN_PASSWORD` and `NEXTAUTH_SECRET`
3. **Test locally first** with Supabase URLs before deploying to Vercel
4. **Worker must be always-on** - Don't use serverless for the worker
5. **Monitor costs** - Upstash free tier is 10K commands/day, upgrade if needed

---

## 🔗 Quick Links

- **GitHub Repo**: https://github.com/shreyasgurav/Nudge
- **Supabase Dashboard**: https://supabase.com/dashboard/project/sfydgbennrrvypzhwjju
- **Upstash Console**: https://console.upstash.com/redis
- **Vercel Dashboard**: https://vercel.com/dashboard
- **Railway Dashboard**: https://railway.app/dashboard
- **Meta App Dashboard**: https://developers.facebook.com/apps/

---

## 📞 Next Steps

1. Get Supabase connection URLs
2. Create Upstash Redis database
3. Deploy to Vercel with all env vars
4. Deploy worker to Railway
5. Update Meta App settings
