# Vercel Deployment Setup Guide

## ✅ What's Already Done

1. ✅ Database uploaded to GitHub Releases: https://github.com/ed0ceja/Manhood/releases/tag/v1.0.0
2. ✅ Code updated to automatically download database in production
3. ✅ Your Vercel URL: https://manhood-faqgwpt58-ed0cejas-projects.vercel.app

## 📋 Step-by-Step: Configure Vercel

### Step 1: Go to Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Find your project (should be "Manhood" or similar)
3. Click on it to open project settings

### Step 2: Add Environment Variables

Go to **Settings** → **Environment Variables** and add these:

#### Required Variables:

1. **OPENAI_API_KEY**
   - Value: Your OpenAI API key (starts with `sk-`)
   - Environment: Production, Preview, Development (all)

2. **APP_ID**
   - Value: Your World ID App ID (format: `app_xxxxx`)
   - Environment: Production, Preview, Development (all)

3. **DEV_PORTAL_API_KEY**
   - Value: Your World ID Developer Portal API key
   - Environment: Production, Preview, Development (all)

4. **VECTOR_DB_URL** (Optional - already set in code)
   - Value: `https://github.com/ed0ceja/Manhood/releases/download/v1.0.0/vectors.db`
   - Environment: Production, Preview, Development (all)
   - Note: This is already the default in code, but you can override it here if needed

5. **NEXT_PUBLIC_WORLD_ACTION_ID** (Optional - defaults to 'chat')
   - Value: Your World ID action ID (usually `chat`)
   - Environment: Production, Preview, Development (all)
   - Note: This is public (starts with NEXT_PUBLIC_), so it's visible in the browser

### Step 3: Redeploy

After adding all environment variables:

1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Wait for deployment to complete (~2-3 minutes)

### Step 4: Test the Deployment

1. Visit: https://manhood-faqgwpt58-ed0cejas-projects.vercel.app
2. You should see the landing page
3. Try the verification flow (if in World App)

### Step 5: Update World App Configuration

1. Go to https://developer.worldcoin.org
2. Navigate to your app
3. Go to **Settings** → **Mini App**
4. Set the **Mini App URL** to: `https://manhood-faqgwpt58-ed0cejas-projects.vercel.app`
5. Save changes

## 🔍 Troubleshooting

### Database Download Issues

**Problem**: First request is slow or fails
- **Solution**: First request downloads the 589MB database (~30-60 seconds). This is normal. Subsequent requests are fast.

**Problem**: Database download fails
- **Check**: Vercel function logs (Deployments → Click deployment → Functions tab)
- **Check**: `VECTOR_DB_URL` is correct
- **Check**: GitHub release is public

### Environment Variables Not Working

**Problem**: Variables not taking effect
- **Solution**: Make sure to redeploy after adding variables
- **Check**: Variables are set for "Production" environment

### World ID Verification Fails

**Problem**: Verification doesn't work
- **Check**: `APP_ID` is correct in Vercel
- **Check**: `DEV_PORTAL_API_KEY` is correct
- **Check**: Mini App URL is set in World ID Developer Portal

## 📝 Quick Reference

**Your Environment Variables:**
```
OPENAI_API_KEY=sk-...
APP_ID=app_...
DEV_PORTAL_API_KEY=api_...
VECTOR_DB_URL=https://github.com/ed0ceja/Manhood/releases/download/v1.0.0/vectors.db
NEXT_PUBLIC_WORLD_ACTION_ID=chat
```

**Your URLs:**
- Vercel App: https://manhood-faqgwpt58-ed0cejas-projects.vercel.app
- GitHub Release: https://github.com/ed0ceja/Manhood/releases/tag/v1.0.0

## 🚀 Next Steps After Deployment

1. Test the full flow in World App
2. Monitor Vercel logs for any errors
3. Check that database downloads successfully on first request
4. Test payment flow
5. Test chat functionality

