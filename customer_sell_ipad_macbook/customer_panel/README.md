# BuyBack Elite - Customer Website

Official website for BuyBack Elite - Sell your MacBook and iPad at the best prices in India.

## Live Website

🌐 **https://buybackelite.com**

## Features

- 🏠 Modern landing page with device pricing
- 📱 Sell MacBook & iPad with instant quotes
- 🔐 Secure authentication with Google OAuth
- 📊 Customer dashboard to track requests
- 📄 Privacy Policy, Terms of Service, About Us pages
- 🎨 Beautiful UI with TailwindCSS

## Tech Stack

- **Frontend:** React 18 + Vite
- **Routing:** React Router v6
- **State Management:** Zustand
- **Styling:** TailwindCSS
- **Backend:** Supabase (Auth + Database)
- **Icons:** Lucide React
- **Deployment:** Vercel

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_APP_URL=https://buybackelite.com
VITE_ADMIN_PANEL_URL=https://admin.buybackelite.com
VITE_AGENT_PANEL_URL=https://agent.buybackelite.com
```

## Installation

```bash
npm install
```

## Development

```bash
npm run dev
```

Open http://localhost:3001

## Build for Production

```bash
npm run build
```

## Deploy to Vercel

1. Connect GitHub repo to Vercel
2. Set environment variables in Vercel Dashboard
3. Deploy!

**Build Settings:**
- Framework: Vite
- Build Command: `npm run build`
- Output Directory: `dist`

## Hidden Routes (Admin & Agent Access)

- `/infra-control` - Admin Panel Access
- `/field-tech` - Agent Panel Access

These routes redirect to respective panel URLs configured in environment variables.

## Pages

- `/` - Landing Page
- `/login` - Customer Login
- `/register` - Customer Registration
- `/dashboard` - Customer Dashboard
- `/privacy-policy` - Privacy Policy
- `/terms-of-service` - Terms of Service
- `/about-us` - About Us

## License

© 2026 BuyBack Elite. All rights reserved.
