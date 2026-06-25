# BuyBack Elite — Clean Backup
## Last Updated: April 20, 2026

Ye backup folder hai project ki saari zaroori files ka — SQLs, configs, edge functions, docs, env templates.
Isme se kuch bhi modify ya add kar sakte ho baad me.

---

## Folder Structure

```
_backup/
├── sql/
│   ├── UNIVERSAL_DATABASE_SETUP.sql    ← Full fresh Supabase setup (MASTER SQL)
│   ├── ADMIN_SETUP.sql                 ← Admin panel specific DB setup
│   └── ADMIN_SETUP_CLEAN.sql           ← Admin setup (graceful/idempotent version)
│
├── edge-functions/
│   └── send-push-notification/
│       └── index.ts                    ← FCM + WhatsApp + In-App notification edge function
│
├── configs/
│   ├── vercel/
│   │   ├── root-vercel.json            ← Root project (agent panel) vercel config
│   │   ├── customer-panel-vercel.json  ← Customer panel vercel config
│   │   └── admin-panel-vercel.json     ← Admin panel vercel config
│   │
│   ├── firebase/
│   │   ├── customer-panel-firebase.js  ← Customer web FCM config + token management
│   │   ├── admin-panel-firebase.js     ← Admin web FCM config + token management
│   │   ├── customer-sw.js             ← Customer service worker for background FCM
│   │   └── admin-sw.js                ← Admin service worker for background FCM
│   │
│   └── supabase/
│       ├── customer-panel-supabase.js  ← Customer Supabase client config
│       └── admin-panel-supabase.js     ← Admin Supabase client config
│
├── env/
│   ├── .env.example                    ← Generic env template
│   ├── CUSTOMER_PANEL.env              ← Customer panel env vars
│   ├── ADMIN_PANEL.env                 ← Admin panel env vars
│   ├── AGENT_PANEL.env                 ← Agent panel env vars
│   └── SUPABASE_SECRETS.env            ← Supabase Edge Function secrets (NEVER commit real values)
│
├── docs/
│   ├── DEPLOYMENT.md                   ← Vercel + Hostinger deployment guide
│   ├── VERCEL_ENV_VARIABLES.md         ← All 3 Vercel project env vars reference
│   ├── PLAY_STORE_PRODUCTION_LISTING.md     ← Play Store listing content
│   └── PLAY_STORE_PRODUCTION_QUESTIONNAIRE.md ← Play Store production QA answers
│
└── README.md                           ← Ye file (you are here)
```

---

## Quick Reference

| Item | Value |
|---|---|
| **Supabase Project** | `zdyzqbufilsfesdusfci` |
| **Supabase URL** | `https://zdyzqbufilsfesdusfci.supabase.co` |
| **Firebase Project** | `buybackelite-ea07f` |
| **Firebase Sender ID** | `573873222401` |
| **Customer Domain** | `buybackelite.com` |
| **Admin Domain** | `control.buybackelite.com` |
| **Agent Domain** | `field.buybackelite.com` |
| **Store** | Macintosh Enterprise, Shop No. 157, 1st Floor, The Great India Place, Noida |
| **Phone** | +91 8595611340 |
| **Email** | contact@buybackelite.com |

---

## Kaise Use Karna Hai

### Fresh Supabase Setup
1. Naya Supabase project banao
2. SQL Editor me jao
3. `sql/UNIVERSAL_DATABASE_SETUP.sql` ka pura content paste karo aur run karo
4. Done! Sab tables, triggers, RLS, storage, seed data ready

### Edge Function Deploy
```bash
supabase functions deploy send-push-notification --project-ref YOUR_PROJECT_REF
```

### Vercel Deploy
- Customer Panel → `customer_panel/` root, use `configs/vercel/customer-panel-vercel.json`
- Admin Panel → `admin_panel/` root, use `configs/vercel/admin-panel-vercel.json`
- Agent Panel → root project, use `configs/vercel/root-vercel.json`

### Env Vars
- Vercel me set karo → `env/` folder me templates dekho
- Supabase Edge Function secrets → `env/SUPABASE_SECRETS.env` me list hai

---

## Notes
- **UNIVERSAL_DATABASE_SETUP.sql** = MASTER SQL — ye sabse important file hai, isme sab kuch hai
- Jab bhi SQL me koi change ho, **yahan bhi update karna** (universal sql me add karte jana)
- Configs me firebase app IDs alag hain customer/admin/agent ke liye
- `.env` files me real keys hain — **Git me push mat karna**
