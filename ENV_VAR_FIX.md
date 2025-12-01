# Fix: NEXT_PUBLIC_WORLD_ACTION_ID Not Working

## ✅ Good News
- Setting it to `"chat"` is **correct** ✅
- The code defaults to `'chat'` if not set, so it should work anyway

## 🔧 The Issue
`NEXT_PUBLIC_*` variables in Next.js are embedded at **build time**, not runtime. So if you add them after deployment, you need to **redeploy**.

## 📋 Step-by-Step Fix

### Step 1: Verify in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Click your **Manhood** project
3. Go to **Settings** → **Environment Variables**
4. Check that `NEXT_PUBLIC_WORLD_ACTION_ID` exists
5. **Important**: Make sure it's set for **Production** environment (not just Preview/Development)
6. Value should be: `chat` (no quotes, just the word)

### Step 2: Redeploy (CRITICAL)

After adding/changing `NEXT_PUBLIC_*` variables, you **MUST** redeploy:

1. Go to **Deployments** tab
2. Click the **"..."** menu (three dots) on the latest deployment
3. Click **"Redeploy"**
4. Wait for it to complete (~2-3 minutes)

### Step 3: Verify It's Working

After redeploy, the variable should be available. You can check by:
- Opening browser console on your site
- Type: `process.env.NEXT_PUBLIC_WORLD_ACTION_ID`
- Should show: `"chat"`

## 🎯 Quick Checklist

- [ ] Variable name is exactly: `NEXT_PUBLIC_WORLD_ACTION_ID` (no typos)
- [ ] Value is: `chat` (no quotes in Vercel)
- [ ] Set for **Production** environment (check all three: Production, Preview, Development)
- [ ] **Redeployed** after adding the variable
- [ ] Waited for deployment to complete

## 💡 Why This Happens

Next.js embeds `NEXT_PUBLIC_*` variables into the JavaScript bundle at **build time**. So:
- Adding the variable → Need to rebuild → Need to redeploy
- Changing the variable → Need to rebuild → Need to redeploy

Unlike server-side variables (like `OPENAI_API_KEY`), public variables are baked into the client-side code.

## ✅ After Fixing

Once you've:
1. Verified the variable is set correctly
2. Redeployed

The error should disappear. The app will use `"chat"` as the action ID (either from the env var or the default).

