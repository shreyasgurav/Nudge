# Fix iOS App Magic Link - Vercel Environment Variables

## 🔴 Problem
iOS app is getting "Server error 500" when requesting magic link because `NEXTAUTH_URL` in Vercel is set to an ngrok URL that's not running.

## ✅ Solution
Update Vercel environment variables to use the production URL.

---

## Steps to Fix:

### 1. Go to Vercel Dashboard
https://vercel.com/shreyasgurav/nudge

### 2. Navigate to Settings
- Click on your project: **Nudge**
- Click **Settings** tab
- Click **Environment Variables** in left sidebar

### 3. Update NEXTAUTH_URL
Find `NEXTAUTH_URL` and update it to:
```
https://nudge-ten-zeta.vercel.app
```

**Important**: Make sure there's **NO trailing slash**!

### 4. Also Update (if needed):
- `EMAIL_FROM`: Change from `OpenReply` to `Nudge`
  ```
  Nudge <onboarding@resend.dev>
  ```

### 5. Redeploy
After updating environment variables:
- Go to **Deployments** tab
- Click the **...** menu on the latest deployment
- Click **Redeploy**
- Wait for deployment to complete (~2 minutes)

---

## Test After Deployment:

### Test in Browser First:
1. Open: https://nudge-ten-zeta.vercel.app/login
2. Enter your email
3. Click "Send magic link"
4. Should see success message (not 500 error)
5. Check your email for the link

### Then Test iOS App:
1. Open iOS app (simulator or iPhone)
2. Enter email
3. Tap "Send Magic Link"
4. Should see green success message
5. Check email
6. Click magic link
7. App should authenticate

---

## Alternative: Quick Test URL

Test the magic link endpoint directly:
```bash
curl -X POST https://nudge-ten-zeta.vercel.app/api/auth/signin/email \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "email=your@email.com&json=true"
```

Should return 200 OK, not 500.

---

## Why This Happened:

The `.env` file had:
```
NEXTAUTH_URL=https://coaster-faceplate-wildcat.ngrok-free.dev
```

This ngrok URL was from local development and is no longer active. NextAuth uses this URL to:
- Generate magic link URLs
- Validate callbacks
- Set cookie domains

When it's wrong, the magic link system fails with 500 errors.

---

## After Fix:

✅ Web app login will work
✅ iOS app magic link will work  
✅ Email links will point to correct domain
✅ Authentication flow will complete

---

**Do this now and the iOS app will work!** 🚀
