# 🚀 Quick Deploy to Vercel (5 Minutes)

## Why Vercel?
- ✅ **FREE** for personal projects
- ✅ Built by Next.js creators - perfect compatibility
- ✅ Automatic HTTPS & global CDN
- ✅ No server management needed
- ✅ Auto-deploy on git push

## Step-by-Step Deployment

### 1. Create GitHub Repository (2 minutes)

```bash
# Initialize git (if not already done)
git init
git add .
git commit -m "Initial commit"

# Create repo on GitHub and push
git remote add origin https://github.com/YOUR_USERNAME/guide-validator.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel (3 minutes)

**Option A: Using Vercel Website (Easier)**

1. Go to [vercel.com](https://vercel.com/signup)
2. Sign up with GitHub (free)
3. Click "Add New" → "Project"
4. Import your `guide-validator` repository
5. Vercel auto-detects Next.js settings
6. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
   - `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
7. Click "Deploy"
8. Done! Your site is live at `https://your-project.vercel.app`

**Option B: Using Vercel CLI (Faster)**

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Setup and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - Project name? guide-validator
# - Directory? ./
# - Override settings? No

# Add environment variables
vercel env add NEXT_PUBLIC_SUPABASE_URL
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY
vercel env add SUPABASE_SERVICE_ROLE_KEY

# Deploy to production
vercel --prod
```

### 3. Configure Custom Domain (Optional)

1. In Vercel dashboard, go to your project
2. Settings → Domains
3. Add your domain from Namecheap
4. Follow DNS instructions to point domain to Vercel
5. Vercel automatically sets up SSL

## Alternative: Netlify

If you prefer Netlify:

```bash
# Install Netlify CLI
npm i -g netlify-cli

# Login
netlify login

# Initialize and deploy
netlify init

# Follow prompts and add environment variables
```

## Environment Variables You Need

Get these from your Supabase dashboard:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
```

## After Deployment

Your site will be live at:
- Vercel: `https://guide-validator.vercel.app`
- Custom domain: `https://yourdomain.com` (if configured)

Every time you push to GitHub, Vercel automatically rebuilds and deploys!

## Troubleshooting

**Build fails?**
- Check environment variables are set correctly
- Verify all Supabase keys are valid
- Check build logs in Vercel dashboard

**404 errors?**
- Ensure `next.config.mjs` doesn't have `output: 'export'`
- Clear cache and redeploy

**Need help?**
- Vercel docs: [vercel.com/docs](https://vercel.com/docs)
- Check deployment logs in dashboard

## Cost

- **Vercel Free Plan:**
  - Unlimited deployments
  - 100GB bandwidth/month
  - Custom domains with SSL
  - Perfect for this project!

- **Vercel Pro ($20/month) only if you need:**
  - More bandwidth
  - Team collaboration
  - Advanced analytics

**You don't need Pro for this project!**
