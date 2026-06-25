# BuyBack Marketplace

Multi-business Apple device buyback platform — customers list their MacBook/iPad, registered businesses compete with quotes, best offer wins.

## 📂 Project Structure

```
buyback_marketplace/
├── buyback_customer/       # Flutter — Customer app (sellers)
├── buyback_business/       # Flutter — Business app (owner + agent, role-based)
├── web_panels/
│   ├── customer_web/       # React — buybackmarket.com
│   ├── business_web/       # React — business.buybackmarket.com
│   └── admin_web/          # React — admin.buybackmarket.com (super admin)
├── supabase/
│   ├── migrations/         # SQL migrations (versioned)
│   ├── functions/          # Edge Functions
│   └── SCHEMA.sql          # Universal schema reference
└── docs/                   # Architecture, ERD, API docs
```

## 🏗️ Architecture

### Apps
| App | Users | Package ID |
|---|---|---|
| BuyBack Customer | Device sellers | `com.buybackmarket.customer` |
| BuyBack Business | Business owners + agents (role-based) | `com.buybackmarket.business` |

### Web Panels
| URL | Panel |
|---|---|
| `buybackmarket.com` | Customer marketing + web app |
| `business.buybackmarket.com` | Business owner dashboard |
| `admin.buybackmarket.com` | Super admin (platform control) |

## 🔄 User Flow (Cashify-Style Quote Matching)

1. Customer adds device → answers condition questions
2. Platform fans out quote request to all active businesses in their pincode
3. Each business's pricing engine computes quote automatically
4. Customer sees ranked list (rating + price + distance)
5. Customer picks business → pickup scheduled with that business's agent
6. Agent verifies device → payment released → platform takes commission

## 🎯 Phase 1 Scope

- **Devices:** MacBook (Air/Pro — M1/M2/M3/Intel) + iPad (Pro/Air/Mini/Standard)
- **Region:** India
- **Languages:** English + Hindi

## 🛠️ Tech Stack

- **Mobile:** Flutter 3.10+
- **Web:** React 18 + Vite + TailwindCSS
- **Backend:** Supabase (Postgres + Auth + Storage + Edge Functions + Realtime)
- **Maps:** Flutter Map + OpenStreetMap
- **Notifications:** Firebase Cloud Messaging
- **Payments:** Razorpay (commission splits)
- **Business Verification:** Google Places API (GMB rating/reviews)

## 📋 Setup

See `docs/SETUP.md` for local development instructions.

## 📝 License

Proprietary — © 2026 BuyBack Marketplace
