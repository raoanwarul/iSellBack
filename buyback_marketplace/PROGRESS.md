# BuyBack Marketplace — Build Progress

## ✅ Completed (Foundation Layer)

### Documentation
- [x] `README.md` — Project overview
- [x] `docs/ARCHITECTURE.md` — System architecture + DB schema design
- [x] `docs/SETUP.md` — Setup guide for Supabase, Firebase, Flutter, Web

### Database (Supabase)
- [x] `supabase/SCHEMA.sql` — Complete multi-tenant schema (13 tables)
  - app_users, businesses, device_categories/models/variants
  - business_variant_prices, business_condition_deductions
  - sell_requests, quote_requests, business_agents
  - pickup_assignments, reviews, notifications, platform_settings
- [x] `supabase/RLS_POLICIES.sql` — Row Level Security for all roles
- [x] `supabase/SEED_APPLE_DEVICES.sql` — MacBook + iPad catalog seed

### Edge Functions (Backend Logic)
- [x] `functions/request-quotes/` — Core quote matching engine
- [x] `functions/send-notification/` — FCM + in-app notifications
- [x] `functions/sync-gmb-ratings/` — Daily Google Places rating sync

### Flutter Apps (Scaffolded)
- [x] `buyback_customer/` — Created with package `com.buybackmarket.customer`
- [x] `buyback_business/` — Created with package `com.buybackmarket.business`
- [x] Both: pubspec.yaml with Supabase + Firebase + Maps + state mgmt deps
- [x] Both: `.env.example`, folder structure (models/services/providers/screens/widgets/theme)
- [x] Customer: theme (`app_theme.dart`), Supabase service, app_user model
- [x] Customer: models (app_user, business, device, sell_request/quote)
- [x] Customer: AuthProvider (email sign-in/up + session restore)
- [x] Customer: GoRouter with auth redirects
- [x] Customer: `main.dart` wiring (Supabase init + MultiProvider + MaterialApp.router)
- [x] Customer: All screens (splash, login, register, home, profile, sell_device_wizard, requests)

---

## 🚧 Next Steps (Application Layer)

### Customer App (`buyback_customer/`)
- [x] Models: AppUser, Business, DeviceCategory, DeviceModel, DeviceVariant, SellRequest, Quote
- [x] AuthProvider (email sign-in/up + session restore)
- [x] Routes (go_router) with auth redirects
- [x] Screens: splash, login, register, home, sell_device_wizard, profile, requests
- [x] `main.dart` wiring
- [ ] FCM integration
- [ ] Google sign-in
- [ ] Quote comparison / detail screen
- [ ] Pickup scheduling screen

### Business App (`buyback_business/`)
- [ ] Role selector (Owner vs Agent)
- [ ] Owner flow: register_business, dashboard, pricing_setup, condition_deductions, orders, agents, analytics
- [ ] Agent flow: pickup_list, pickup_detail, verification, payment
- [ ] Shared: auth, theme (green/emerald accent), Supabase service

### Web Panels (`web_panels/`)
- [ ] `customer_web/` — React + Vite + Tailwind (buybackmarket.com)
- [ ] `business_web/` — Business owner dashboard
- [ ] `admin_web/` — Super admin (approve businesses, commissions)

---

## ⏭️ Phased Completion Strategy

Given project scope (~150+ files), building in focused phases:

### Phase A (This session): Foundation + Customer App MVP
- Models + Auth + Core screens (login/register/home)
- Device selection wizard
- Quote listing + selection

### Phase B (Next session): Business App
- Registration wizard
- Pricing setup
- Orders + agent management

### Phase C: Web Panels
- Super admin first (needed to approve businesses)
- Then business dashboard + customer site

### Phase D: Integration + Polish
- FCM wiring
- GMB integration test
- End-to-end quote flow test

---

## 🎯 Current Dev Priorities

1. **Apply SQL to fresh Supabase project** (unblocks everything)
2. **Customer app auth + home** (can test end-to-end with seed data)
3. **Business app registration** (first business can register)
4. **Super admin panel** (approve businesses)
5. **Complete customer flow** (sell device → quotes → pickup)

---

## 📝 Notes

- No existing BuyBack Elite code modified — this is a clean new project
- Reusing patterns from `customer_sell_ipad_macbook` but rewriting for multi-tenant
- Package IDs: `com.buybackmarket.customer`, `com.buybackmarket.business`
- Not using Firebase project from existing app — new Firebase project needed
