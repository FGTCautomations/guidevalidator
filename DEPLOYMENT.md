# Deploying Guide Validator to Namecheap cPanel

## Important Note
**Next.js requires Node.js to run, and most shared cPanel hosting doesn't support Node.js applications properly.** Namecheap shared hosting typically doesn't support Next.js.

## Recommended Deployment Options

### Option 1: Vercel (Recommended - Free)
Next.js is built by Vercel, so deployment is seamless:

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Import Project"
4. Connect your GitHub repository
5. Vercel auto-detects Next.js and deploys
6. Add your environment variables in Vercel dashboard
7. Done! Your site is live with automatic HTTPS and CDN

**Environment Variables to add in Vercel:**
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Option 2: Netlify (Free)
Similar to Vercel:

1. Push code to GitHub
2. Go to [netlify.com](https://netlify.com)
3. Import your repository
4. Set build command: `npm run build`
5. Set publish directory: `.next`
6. Add environment variables
7. Deploy

### Option 3: Namecheap VPS (If you must use Namecheap)
You need a VPS (not shared hosting) from Namecheap:

1. **Purchase Namecheap VPS** (starts at ~$6.88/month)
2. **Install Node.js 18+** on the VPS
3. **Install PM2** for process management:
   ```bash
   npm install -g pm2
   ```
4. **Upload your files via FTP/SSH**
5. **Install dependencies:**
   ```bash
   npm install
   ```
6. **Build the project:**
   ```bash
   npm run build
   ```
7. **Start with PM2:**
   ```bash
   pm2 start npm --name "guide-validator" -- start
   pm2 save
   pm2 startup
   ```
8. **Set up Nginx as reverse proxy** to port 3000

### Option 4: Static Export (Limited Functionality)
If you only need static pages (no server-side features):

1. Add to `next.config.mjs`:
   ```javascript
   output: 'export',
   ```
2. Build: `npm run build`
3. Upload the `out` folder to cPanel public_html
4. **Note:** This disables:
   - API routes
   - Server-side rendering
   - Dynamic routes with `getServerSideProps`
   - Authentication features

## Why cPanel Shared Hosting Won't Work

- **No Node.js runtime**: Shared hosting runs PHP/static files only
- **No process management**: Can't keep Node.js server running
- **No custom ports**: Next.js needs port 3000 or custom port
- **Memory limits**: Next.js apps need more RAM than shared hosting provides

## Best Solution for Your Project

Given that your project uses:
- Supabase authentication
- API routes
- Server-side rendering
- Dynamic content

**Use Vercel (100% free for personal projects)**

### Quick Vercel Setup (5 minutes)

1. Create account at [vercel.com](https://vercel.com) (free)
2. Install Vercel CLI:
   ```bash
   npm i -g vercel
   ```
3. Deploy from your project folder:
   ```bash
   vercel
   ```
4. Follow prompts
5. Add environment variables when asked
6. Your site is live!

Vercel gives you:
- ✅ Free hosting
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Automatic deployments on git push
- ✅ Preview URLs for branches
- ✅ Built for Next.js

## Alternative: Export Static Site (Loses Features)

If you really need cPanel and accept losing dynamic features:

1. Run:
   ```bash
   npm run build
   ```
2. The build creates a `.next` folder
3. Upload entire project to cPanel via FTP
4. Create `.htaccess` in public_html:
   ```apache
   RewriteEngine On
   RewriteBase /
   RewriteRule ^$ / [L]
   RewriteCond %{REQUEST_FILENAME} !-f
   RewriteCond %{REQUEST_FILENAME} !-d
   RewriteRule . / [L]
   ```

**This won't work properly** because Next.js needs Node.js to serve the pages.

## Summary

- ❌ Namecheap shared cPanel: Won't work
- ✅ Vercel: Best option (free, optimized for Next.js)
- ✅ Netlify: Good alternative (free)
- ⚠️ Namecheap VPS: Works but costs money and requires server management
- ⚠️ Static export: Works but loses most features

**Recommendation: Deploy to Vercel in under 5 minutes for free!**
