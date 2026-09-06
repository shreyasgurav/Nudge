# Supabase Setup Instructions

## Your Project Details
- **Project ID**: `sfydgbennrrvypzhwjju`
- **Dashboard**: https://supabase.com/dashboard/project/sfydgbennrrvypzhwjju

---

## Step 1: Get Database Connection Strings

### Option A: Via Dashboard (Recommended)

1. **Go to Database Settings**
   - URL: https://supabase.com/dashboard/project/sfydgbennrrvypzhwjju/settings/database
   - Or: Project Dashboard → Settings (gear icon) → Database

2. **Copy Connection Pooling URL (for `DATABASE_URL`)**
   - Scroll to "Connection Pooling" section
   - Mode: **Transaction** (important for Prisma)
   - Copy the connection string
   - It looks like: `postgresql://postgres.sfydgbennrrvypzhwjju:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true`

3. **Copy Direct Connection URL (for `DIRECT_URL`)**
   - Scroll to "Connection String" section
   - Mode: **URI**
   - Copy the connection string
   - It looks like: `postgresql://postgres.sfydgbennrrvypzhwjju:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres`

4. **Replace `[YOUR-PASSWORD]`**
   - Use the database password you set when creating the project
   - If you forgot it, you can reset it in the same settings page

### Option B: Via Supabase CLI (Alternative)

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref sfydgbennrrvypzhwjju

# Get connection strings
supabase db show-connection-string
```

---

## Step 2: Update Local `.env` File

Add these to your `.env` file:

```bash
# Supabase Database (replace [YOUR-PASSWORD] with actual password)
DATABASE_URL="postgresql://postgres.sfydgbennrrvypzhwjju:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres.sfydgbennrrvypzhwjju:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:5432/postgres"
```

---

## Step 3: Test Database Connection

Run this to test the connection and apply migrations:

```bash
# Generate Prisma client
npx prisma generate

# Run migrations (creates all tables)
npx prisma migrate deploy

# Optional: Open Prisma Studio to view database
npx prisma studio
```

If successful, you should see:
```
✓ Applying migration `20260517120000_b2b_saas_foundation`
✓ Applying migration `20260524100000_production_hardening`
... (all migrations)
✓ All migrations have been successfully applied.
```

---

## Step 4: Verify in Supabase Dashboard

1. **Go to Table Editor**
   - URL: https://supabase.com/dashboard/project/sfydgbennrrvypzhwjju/editor
   
2. **Check Tables Created**
   You should see these tables:
   - `User`
   - `Account`
   - `Session`
   - `Workspace`
   - `WorkspaceMember`
   - `InstagramAccount`
   - `Automation`
   - `DmLog`
   - `WebhookEvent`
   - `OperationalEvent`
   - And more...

---

## Troubleshooting

### Error: "Can't reach database server"
- Check if your IP is allowed in Supabase
- Go to: https://supabase.com/dashboard/project/sfydgbennrrvypzhwjju/settings/database
- Scroll to "Connection Pooling" → "Restrict access to trusted IPs"
- Add `0.0.0.0/0` to allow all IPs (or your specific IP)

### Error: "Password authentication failed"
- Reset your database password in Supabase settings
- Update the password in your connection strings

### Error: "SSL connection required"
- Make sure your connection string includes `?sslmode=require` or `?pgbouncer=true`

---

## Next Steps

After database is set up:
1. ✅ Test migrations locally
2. 🔄 Create Upstash Redis database
3. 🔄 Deploy to Vercel
4. 🔄 Deploy worker to Railway

---

## Important Notes

- **Never commit** connection strings to Git (already in `.gitignore`)
- **Use pooled connection** (`DATABASE_URL`) for Vercel (serverless)
- **Use direct connection** (`DIRECT_URL`) for migrations only
- **Free tier limits**: 500MB database, 2GB bandwidth/month
- **Upgrade path**: $25/mo for 8GB database when needed
