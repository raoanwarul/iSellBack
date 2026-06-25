# BuyBack Marketplace — Architecture

## 🎯 Core Concept

Multi-tenant marketplace: One platform, many buyer businesses. Customer posts device → businesses compete with quotes → customer picks winner.

---

## 👥 User Roles

### 1. Customer (Seller)
- Register via email/Google
- List device with condition answers + photos
- Receive ranked quotes from all registered businesses
- Pick a business → schedule pickup
- Receive payment after device verification

### 2. Business Owner
- Register business → submit GST/GMB for verification
- Await super admin approval
- Set base prices for device variants
- Set condition deductions (using admin-like panel)
- Manage agents (invite, assign pickups)
- View analytics (orders, revenue, ratings)

### 3. Agent (Business Employee)
- Invited by business owner
- Login to BuyBack Business app in "Agent mode"
- See assigned pickups only
- Verify device on-site, finalize price
- Record payment

### 4. Super Admin (Platform)
- Approve/reject business registrations
- Verify GMB place IDs
- Manage commission rates
- Handle disputes
- Global analytics

---

## 🗄️ Database Schema (High-Level)

### Core Tables (with `business_id` where applicable)

```
users                       # All users (customer/owner/agent/admin via 'role' + 'business_id')
  ├─ id, email, phone, role, business_id (nullable), created_at

businesses                  # Registered buyback businesses
  ├─ id, owner_id, business_name, gst_number
  ├─ gmb_place_id, gmb_rating, gmb_review_count, gmb_last_synced
  ├─ address, city, pincodes_served[], operating_radius_km
  ├─ is_verified, is_active, commission_rate
  ├─ logo_url, created_at

device_categories           # Apple, (future: Dell, HP)
device_models               # MacBook Pro M3, iPad Pro 13" etc.
device_variants             # Storage/RAM combinations + base_price (platform default)

business_variant_prices     # Per-business override of base_price
  ├─ business_id, variant_id, base_price
  ├─ PRIMARY KEY (business_id, variant_id)

business_condition_deductions  # Per-business condition pricing (same structure as current condition_deductions but scoped)
  ├─ business_id, category, condition_name, value, deduction_type, impact_level

sell_requests               # Customer's sell listings
  ├─ id, customer_id, variant_id, condition_answers (JSONB), photos[]
  ├─ status (draft/quoted/accepted/pickup_scheduled/completed/cancelled)
  ├─ selected_business_id (after customer picks)
  ├─ final_price, pickup_date, pickup_slot, pickup_address
  ├─ platform_commission, business_payout

quote_requests              # Quotes from each business for a sell_request
  ├─ sell_request_id, business_id, quoted_price, deductions (JSONB)
  ├─ status (active/accepted/rejected/expired)
  ├─ created_at, expires_at

business_agents             # Agents assigned to a business
  ├─ business_id, agent_user_id, invite_status, invited_at

reviews                     # Customer reviews of business after transaction
  ├─ sell_request_id, customer_id, business_id, rating (1-5), comment

platform_settings           # Global config (commission %, quote TTL, etc.)
  ├─ key, value, updated_by
```

### RLS Policies
- **Customers:** see own sell_requests, all active businesses, received quotes
- **Business owners:** see own business data + their sell_requests
- **Agents:** see assigned pickups only
- **Super admin:** full access

---

## 🔄 Quote Matching Flow (Backend Logic)

```
Customer submits sell_request with condition answers
         ↓
Edge Function: request-quotes
  1. Find all active businesses serving customer's pincode
  2. For each business:
     - Look up business_variant_prices[variant_id] (or default)
     - Look up business_condition_deductions
     - Calculate quoted_price = base - sum(deductions)
     - Insert row into quote_requests
  3. Notify customer (FCM): "You have N quotes"
         ↓
Customer sees ranked quotes in app:
  - Sort by: price DESC → rating DESC → distance ASC
  - Display business name, rating, quoted price, estimated pickup date
         ↓
Customer selects a quote
  - sell_request.selected_business_id = <business>
  - sell_request.status = 'accepted'
  - All other quote_requests marked 'rejected'
  - Business owner notified (FCM) → assigns agent
```

---

## 🌟 Google My Business Integration

### On Business Registration
1. Business owner pastes their Google Maps business URL
2. Super admin verifies → extracts `place_id`
3. Saved in `businesses.gmb_place_id`

### Background Sync (Edge Function + Cron)
- Daily job fetches rating + review count from Google Places API
- Updates `businesses.gmb_rating`, `gmb_review_count`, `gmb_last_synced`
- Cached locally — no API call on every customer request

### API: Google Places Details
```
GET https://maps.googleapis.com/maps/api/place/details/json
  ?place_id={place_id}
  &fields=rating,user_ratings_total,url
  &key={GOOGLE_PLACES_API_KEY}
```

---

## 💰 Commission Model

- Platform takes **X%** (default 5%) from each completed transaction
- Stored in `platform_settings.commission_rate`
- On request completion:
  - `sell_request.platform_commission` = `final_price * commission_rate`
  - `sell_request.business_payout` = `final_price - platform_commission`
- Razorpay Route used for automatic split payout (future phase)

---

## 🔐 Authentication

- **Supabase Auth** (email + Google OAuth)
- Role determined at signup:
  - Customer app → `role = 'customer'`
  - Business app → `role = 'business_owner'` initially
  - Agents invited via magic link → `role = 'agent'`, linked to business
- Super admin created manually in DB

---

## 📦 Phase-wise Rollout

| Phase | Deliverable |
|---|---|
| 1 | Supabase schema + migrations + seed data |
| 2 | BuyBack Business app (owner flow — register, pricing setup) |
| 3 | Super Admin web panel (approve businesses) |
| 4 | BuyBack Customer app (list device, get quotes, pick business) |
| 5 | Business agent flow (pickup verification) |
| 6 | Customer web panel (buybackmarket.com) |
| 7 | Business web panel (business.buybackmarket.com) |
| 8 | GMB integration + review sync |
| 9 | Razorpay commission split |
| 10 | Play Store launch (AABs) |
