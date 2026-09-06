# Upstash Redis Setup Instructions

## What is Upstash Redis Used For?

In Nudge, Redis stores:
1. **BullMQ Job Queues** - Background tasks for DM polling, webhook processing
2. **Job Status** - Track which jobs are running, completed, or failed
3. **Rate Limiting** - Prevent hitting Instagram API limits
4. **Worker Health** - Monitor worker status and alerts

---

## Step 1: Create Redis Database

1. **Go to Upstash Console**
   - URL: https://console.upstash.com/redis
   - Sign in with your account

2. **Create New Database**
   - Click **"Create Database"** button
   
3. **Configure Database**
   - **Name**: `nudge-production` (or any name you prefer)
   - **Type**: **Regional** (free tier available)
   - **Region**: Choose closest to your users:
     - `us-east-1` (N. Virginia) - Good for US East Coast
     - `us-west-1` (N. California) - Good for US West Coast
     - `eu-west-1` (Ireland) - Good for Europe
     - `ap-southeast-1` (Singapore) - Good for Asia
   - **TLS**: ✅ Enabled (recommended)
   - **Eviction**: ✅ Disabled (important - we don't want to lose queue data)

4. **Click "Create"**

---

## Step 2: Get Redis Connection URL

After creation, you'll see the database details page.

### Copy the Connection String

You'll see multiple connection options:

1. **Redis URL** (Recommended for Node.js)
   ```
   redis://default:[password]@[region].upstash.io:6379
   ```
   Example:
   ```
   redis://default:AYNxASQgYjU5ZTQ0YzQtMGE3Yy00YjE3LWI5YzAtMjE3ZjE3ZjI3YzI3@us1-merry-firefly-12345.upstash.io:6379
   ```

2. **Alternative: REST API** (for serverless edge functions)
   ```
   https://[region].upstash.io
   ```
   (We'll use the Redis URL for now)

### Important Settings

- **Connection Pooling**: Not needed (Upstash handles this)
- **TLS/SSL**: Enabled by default
- **Max Connections**: Unlimited on free tier
- **Data Persistence**: Enabled (data survives restarts)

---

## Step 3: Update Environment Variables

Add to your `.env` file:

```bash
# Upstash Redis
REDIS_URL="redis://default:[your-password]@[region].upstash.io:6379"
```

Example:
```bash
REDIS_URL="redis://default:AYNxASQgYjU5ZTQ0YzQtMGE3Yy00YjE3LWI5YzAtMjE3ZjE3ZjI3YzI3@us1-merry-firefly-12345.upstash.io:6379"
```

---

## Step 4: Test Redis Connection

Run this to test the connection:

```bash
# Start the dev server (it will connect to Redis)
npm run dev

# Or test the worker directly
npm run worker
```

You should see in the logs:
```
✓ Redis connected successfully
✓ Worker started, processing jobs...
```

---

## Step 5: Verify in Upstash Dashboard

1. **Go to Database Details**
   - You should see your database in the list
   - Click on it to view details

2. **Check Metrics**
   - **Commands**: Should show activity when worker is running
   - **Memory**: Should show data being stored
   - **Connections**: Should show active connections

3. **Use Data Browser** (Optional)
   - Click "Data Browser" tab
   - You can see keys created by BullMQ:
     - `bull:instagram-dm-poll:*`
     - `bull:webhook-process:*`
     - `bull:alert:*`

---

## Free Tier Limits

- **Commands**: 10,000 per day
- **Max Data Size**: 256 MB
- **Max Request Size**: 1 MB
- **Bandwidth**: 200 MB per day
- **Max Concurrent Connections**: 100

### When to Upgrade?

Monitor your usage in the dashboard. Upgrade if:
- You exceed 10K commands/day (happens around 20-50 active users)
- You need more than 256MB storage
- You need higher throughput

**Paid tier**: Starts at $0.2 per 100K commands (pay-as-you-go)

---

## Troubleshooting

### Error: "Connection refused"
- Check if `REDIS_URL` is correct in `.env`
- Verify TLS is enabled (should use `rediss://` for TLS or `redis://` for non-TLS)
- Check if your IP is blocked (Upstash allows all IPs by default)

### Error: "Authentication failed"
- Verify the password in the connection string
- Copy the URL again from Upstash dashboard

### Error: "Too many connections"
- Free tier allows 100 concurrent connections
- Make sure you're not creating multiple Redis clients
- Our code uses a singleton pattern, so this shouldn't happen

### Jobs not processing
- Check if worker is running: `npm run worker`
- Check Upstash dashboard for command activity
- Verify `REDIS_URL` is the same in both web app and worker

---

## Architecture Overview

```
┌─────────────────────────────────────────┐
│  Vercel (Web App)                       │
│  • API routes add jobs to Redis queues │
│  • Example: New Instagram comment       │
│    → Add job to "instagram-dm-poll"     │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Upstash Redis (Job Queue)              │
│  • Stores pending jobs                  │
│  • Tracks job status                    │
│  • Handles retries                      │
└─────────────────────────────────────────┘
                  ↓
┌─────────────────────────────────────────┐
│  Railway (Worker)                       │
│  • Polls Redis for new jobs             │
│  • Processes jobs (send DMs, etc.)      │
│  • Updates job status                   │
└─────────────────────────────────────────┘
```

---

## Next Steps

After Redis is set up:
1. ✅ Test connection locally
2. 🔄 Deploy to Vercel (add `REDIS_URL` to env vars)
3. 🔄 Deploy worker to Railway (add `REDIS_URL` to env vars)
4. 🔄 Monitor queue activity in Upstash dashboard

---

## Important Notes

- **Never commit** `REDIS_URL` to Git (already in `.gitignore`)
- **Use the same URL** for both Vercel and Railway
- **Monitor usage** to avoid hitting free tier limits
- **Enable persistence** to prevent data loss
- **Use TLS** for secure connections in production
