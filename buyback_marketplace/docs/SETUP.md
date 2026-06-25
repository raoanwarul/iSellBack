# BuyBack Marketplace — Setup Guide

## Prerequisites

- Flutter SDK 3.10+
- Node.js 18+ and npm
- Supabase CLI (`npm install -g supabase`)
- Firebase CLI (`npm install -g firebase-tools`)
- Google Cloud Platform project (for Places API key)
- Firebase project (for FCM push notifications)

---

## 1. Supabase Project Setup

### Create new Supabase project
1. Go to <https://supabase.com/dashboard>
2. Create new project → name: `buyback-marketplace`
3. Save your project URL + anon key + service_role key

### Apply schema
```bash
# From SQL editor in Supabase Dashboard, run in order:
# 1. supabase/SCHEMA.sql
# 2. supabase/RLS_POLICIES.sql
# 3. supabase/SEED_APPLE_DEVICES.sql
```

### Deploy Edge Functions
```bash
cd supabase
supabase link --project-ref <your-project-ref>
supabase functions deploy request-quotes
supabase functions deploy send-notification
supabase functions deploy sync-gmb-ratings
```

### Set Edge Function secrets
```bash
supabase secrets set GOOGLE_PLACES_API_KEY=<your-key>
supabase secrets set FCM_SERVER_KEY=<firebase-server-key>
```

### Schedule GMB sync (daily cron)
```sql
-- Run once in SQL Editor
SELECT cron.schedule(
  'sync-gmb-ratings-daily',
  '0 2 * * *',  -- 2 AM UTC daily
  $$
    SELECT net.http_post(
      url := 'https://<project-ref>.supabase.co/functions/v1/sync-gmb-ratings',
      headers := jsonb_build_object('Authorization', 'Bearer <service-role-key>')
    );
  $$
);
```

---

## 2. Google Cloud — Places API

1. Go to <https://console.cloud.google.com>
2. Enable **Places API** and **Maps SDK for Android** (for Flutter maps)
3. Create API Key → restrict to: Android apps + HTTP referrer
4. Save key → paste in Supabase secret `GOOGLE_PLACES_API_KEY`

---

## 3. Firebase — FCM Push

1. Go to <https://console.firebase.google.com>
2. Create project: `buyback-marketplace`
3. Add 2 Android apps:
   - `com.buybackmarket.customer`
   - `com.buybackmarket.business`
4. Download `google-services.json` for each → place in respective Flutter app's `android/app/`
5. Get **Server key** (Project Settings → Cloud Messaging) → paste in Supabase secret `FCM_SERVER_KEY`
6. Get **VAPID key** (Project Settings → Cloud Messaging → Web configuration) → for web panels

---

## 4. Flutter Apps

### Install dependencies
```bash
cd buyback_customer && flutter pub get
cd ../buyback_business && flutter pub get
```

### Environment config
Create `.env` in each app root:
```env
SUPABASE_URL=https://<your-ref>.supabase.co
SUPABASE_ANON_KEY=<your-anon-key>
```

### Run
```bash
flutter run            # debug
flutter build apk      # release APK
flutter build appbundle # Play Store AAB
```

---

## 5. Web Panels

### Customer Web (buybackmarket.com)
```bash
cd web_panels/customer_web
npm install
npm run dev    # http://localhost:5173
npm run build  # production
```

### Business Web (business.buybackmarket.com)
```bash
cd web_panels/business_web
npm install
npm run dev
```

### Admin Web (admin.buybackmarket.com)
```bash
cd web_panels/admin_web
npm install
npm run dev
```

### Environment — `.env` for each panel
```env
VITE_SUPABASE_URL=https://<your-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
```

---

## 6. Deployment

### Vercel (all 3 web panels)
- Push each panel to its own GitHub repo
- Link to Vercel → set env vars → auto-deploy on push

### Play Store (Flutter apps)
- Generate AABs: `flutter build appbundle --release`
- Sign with keystore
- Upload to Play Console

---

## 7. First-Time Super Admin Setup

After schema is applied, manually create super admin user:

```sql
-- 1. Sign up via Supabase Auth (email/password) using Supabase Dashboard
-- 2. Copy the user's UUID from auth.users
-- 3. Insert into app_users with super_admin role
INSERT INTO public.app_users (id, email, full_name, role)
VALUES (
  '<auth-user-uuid>',
  'admin@buybackmarket.com',
  'Super Admin',
  'super_admin'
);
```

---

## Project Structure Quick Reference

```
buyback_marketplace/
├── buyback_customer/       # Flutter customer app
├── buyback_business/       # Flutter business + agent app
├── web_panels/
│   ├── customer_web/
│   ├── business_web/
│   └── admin_web/
├── supabase/
│   ├── SCHEMA.sql
│   ├── RLS_POLICIES.sql
│   ├── SEED_APPLE_DEVICES.sql
│   └── functions/
│       ├── request-quotes/
│       ├── send-notification/
│       └── sync-gmb-ratings/
└── docs/
```
