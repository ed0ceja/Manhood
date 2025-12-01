# Fix: NEXT_PUBLIC_WLD_APP_ID Missing

## 🔴 The Error
"World ID not configured. Please set NEXT_PUBLIC_WLD_APP_ID in your environment variables."

## ✅ The Solution

MiniKitProvider requires `NEXT_PUBLIC_WLD_APP_ID` which should be your **World ID App ID** (the same value as your `APP_ID`).

## 📋 Step-by-Step Fix

### Step 1: Get Your APP_ID Value

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Find `APP_ID` (it should be something like `app_xxxxx`)
3. **Copy that value** (you'll need it in the next step)

### Step 2: Add NEXT_PUBLIC_WLD_APP_ID

1. In the same Environment Variables page
2. Click **"Add New"**
3. **Name**: `NEXT_PUBLIC_WLD_APP_ID`
4. **Value**: Paste your `APP_ID` value (e.g., `app_xxxxx`)
5. **Environment**: Select all three (Production, Preview, Development)
6. Click **"Save"**

### Step 3: Redeploy (CRITICAL!)

After adding `NEXT_PUBLIC_*` variables, you **MUST** redeploy:

1. Go to **Deployments** tab
2. Click **"..."** on the latest deployment
3. Click **"Redeploy"**
4. Wait for it to complete (~2-3 minutes)

## 🎯 Complete Environment Variables Checklist

Make sure you have ALL of these in Vercel:

- ✅ `OPENAI_API_KEY` = `sk-...`
- ✅ `APP_ID` = `app_xxxxx` (server-side)
- ✅ `NEXT_PUBLIC_WLD_APP_ID` = `app_xxxxx` (same value, but public/client-side) ← **NEW!**
- ✅ `DEV_PORTAL_API_KEY` = `api_...`
- ✅ `NEXT_PUBLIC_WORLD_ACTION_ID` = `chat` (optional, defaults to 'chat')
- ✅ `VECTOR_DB_URL` = `https://github.com/ed0ceja/Manhood/releases/download/v1.0.0/vectors.db` (optional)

## 💡 Why Two Variables?

- `APP_ID` = Used server-side (in API routes like `/api/verify`)
- `NEXT_PUBLIC_WLD_APP_ID` = Used client-side (by MiniKitProvider in the browser)

They have the **same value** but serve different purposes:
- Server-side variables are secure (not exposed to browser)
- Public variables (NEXT_PUBLIC_*) are embedded in the JavaScript bundle

## ✅ After Fixing

Once you've:
1. Added `NEXT_PUBLIC_WLD_APP_ID` with your `APP_ID` value
2. Redeployed

The error should disappear and the app should work! 🎉

