# Admin Panel Deployment Guide

## Subdomain: control.buybackelite.com

### Prerequisites
- Vercel account
- Hostinger domain access
- Supabase credentials

### Step 1: Push to GitHub

```bash
cd admin_panel
git init
git add .
git commit -m "Initial admin panel deployment"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/admin-panel.git
git push -u origin main
```

### Step 2: Deploy to Vercel

1. Go to https://vercel.com/new
2. Import your admin-panel repository
3. Configure:
   - **Framework Preset**: Vite
   - **Root Directory**: ./
   - **Build Command**: npm run build
   - **Output Directory**: dist

4. Add Environment Variables:
   - `VITE_SUPABASE_URL`: https://zdyzqbufilsfesdusfci.supabase.co
   - `VITE_SUPABASE_ANON_KEY`: your_supabase_anon_key

5. Click **Deploy**

### Step 3: Add Custom Domain in Vercel

1. After deployment, go to **Settings** → **Domains**
2. Add domain: `control.buybackelite.com`
3. Vercel will show DNS records to add

### Step 4: Configure DNS in Hostinger

1. Login to Hostinger
2. Go to **Domains** → `buybackelite.com`
3. Click **DNS / Name Servers**
4. Add new CNAME record:
   ```
   Type: CNAME
   Name: control
   Points to: cname.vercel-dns.com
   TTL: 14400
   ```
5. Save changes

### Step 5: Verify in Vercel

Wait 5-10 minutes for DNS propagation, then Vercel will automatically verify the domain.

### Access

- **Admin Panel**: https://control.buybackelite.com
- **Login**: https://control.buybackelite.com/login

---

## Local Development

```bash
# Install dependencies
npm install

# Create .env file
cp .env.example .env
# Add your Supabase credentials

# Start dev server
npm run dev
# Opens at http://localhost:3000
```
