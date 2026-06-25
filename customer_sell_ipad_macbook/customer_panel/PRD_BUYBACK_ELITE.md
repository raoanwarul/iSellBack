# Product Requirements Document (PRD)
## BuyBack Elite - Customer Panel

**Version:** 1.0  
**Date:** April 2026  
**Product:** BuyBack Elite Customer Web Application  
**URL:** https://buybackelite.com  
**Platform:** Web (React + Vite)

---

## 1. Product Overview

### 1.1 Purpose
BuyBack Elite is a device buyback platform that allows users to sell their used Apple devices (MacBooks and iPads) quickly and conveniently. The customer panel is a web application where users can get instant price quotes, upload device photos, schedule doorstep pickups, and track their sell requests.

### 1.2 Target Audience
- Adults (18+) in India who own Apple devices
- Users looking to sell MacBooks (Air, Pro) and iPads (Pro, Air, Mini, Standard)
- Tech-savvy individuals who prefer digital transactions over physical store visits

### 1.3 Business Goals
- Provide instant, transparent pricing for used Apple devices
- Simplify the selling process with doorstep pickup
- Build trust through secure transactions and same-day payments

---

## 2. User Flows & Features

### 2.1 Authentication

#### 2.1.1 User Registration
- **Path:** `/register`
- **Features:**
  - Email/Password registration
  - Google Sign-In (OAuth)
  - Form validation (email format, password strength)
  - Success message and redirect to dashboard

#### 2.1.2 User Login
- **Path:** `/login`
- **Features:**
  - Email/Password login
  - Google Sign-In
  - "Forgot Password" functionality
  - Password reset via email link
  - Remember session

#### 2.1.3 Logout
- Clear session and redirect to landing page

---

### 2.2 Landing Page

- **Path:** `/`
- **Sections:**
  1. **Hero Section** - Main CTA to start selling
  2. **Features Section** - Key benefits (instant quotes, free pickup, same-day payment)
  3. **How It Works** - 3-step process explanation
  4. **Pricing Section** - Sample device prices
  5. **App Showcase** - Screenshot slider with navigation arrows
  6. **FAQ Section** - Common questions with accordion
  7. **Store Location** - Physical store address with map
  8. **Footer** - Links, contact info, social media

- **Interactive Elements:**
  - Navigation menu (desktop & mobile hamburger)
  - Scroll-based animations
  - CTA buttons leading to sell flow
  - Screenshot slider with left/right arrows

---

### 2.3 Dashboard

- **Path:** `/dashboard`
- **Access:** Authenticated users only
- **Features:**
  - Welcome banner with user name
  - Quick stats (total requests, pending, completed)
  - Recent sell requests list
  - Quick action buttons (Sell Device, View History)

---

### 2.4 Sell Device Flow

#### 2.4.1 Device Selection
- **Path:** `/dashboard/sell`
- **Steps:**
  1. Select device type (MacBook or iPad)
  2. Select device model (e.g., MacBook Air M1, iPad Pro 12.9")
  3. Select storage capacity
  4. Answer condition questions:
     - Screen condition (Perfect, Minor Scratches, Cracked, Damaged)
     - Body condition (Like New, Light Wear, Damaged)
     - Functional issues (Yes/No checkboxes)
  5. View instant price quote

#### 2.4.2 Photo Upload
- **Features:**
  - Upload 4-6 device photos (front, back, screen, accessories)
  - Camera capture or gallery selection
  - Image preview with delete option
  - Progress indicator during upload
  - Minimum 4 photos required

#### 2.4.3 Pickup Scheduling
- **Features:**
  - Enter pickup address (with saved addresses option)
  - Select preferred date (calendar picker)
  - Select preferred time slot
  - Add special instructions (optional)
  - Review order summary
  - Confirm and submit request

---

### 2.5 My Requests / Order History

- **Path:** `/dashboard/requests`
- **Features:**
  - List of all sell requests
  - Filter by status (All, Pending, Reviewing, Scheduled, Completed)
  - Request card showing:
    - Device name and model
    - Quoted price
    - Current status with badge
    - Submission date
  - Click to view request details

#### 2.5.1 Request Detail View
- **Features:**
  - Full device information
  - Uploaded photos gallery
  - Price breakdown
  - Status timeline/progress
  - Assigned agent info (when scheduled)
  - Agent live tracking (when on the way)
  - Payment status and method

---

### 2.6 Profile & Settings

- **Path:** `/dashboard/profile`
- **Features:**
  - View/Edit profile information (name, email, phone)
  - Manage saved addresses
  - Change password
  - Notification preferences
  - Delete account option

---

### 2.7 Static Pages

#### 2.7.1 About Us
- **Path:** `/about`
- Company information, mission, physical store details

#### 2.7.2 Privacy Policy
- **Path:** `/privacy-policy`
- Data collection, usage, and protection policies

#### 2.7.3 Terms of Service
- **Path:** `/terms-of-service`
- User agreement and service terms

#### 2.7.4 Delete Account
- **Path:** `/delete-account`
- Account deletion request form

---

## 3. Technical Specifications

### 3.1 Tech Stack
- **Frontend:** React 18 + Vite
- **Styling:** TailwindCSS
- **State Management:** Zustand
- **Backend:** Supabase (PostgreSQL + Auth + Storage + Edge Functions)
- **Notifications:** Firebase Cloud Messaging (FCM)
- **Hosting:** Vercel / Netlify

### 3.2 Authentication
- Supabase Auth with email/password and Google OAuth
- JWT-based session management
- Protected routes for authenticated pages

### 3.3 API Endpoints (Supabase)
- `profiles` - User profile data
- `devices` - Device catalog (models, prices)
- `sell_requests` - User sell requests
- `request_photos` - Uploaded device photos
- `agents` - Pickup agents
- `pricing_rules` - Dynamic pricing configuration

### 3.4 Responsive Design
- Mobile-first approach
- Breakpoints: sm (640px), md (768px), lg (1024px), xl (1280px)
- Touch-friendly UI elements
- Mobile navigation with hamburger menu

---

## 4. User Stories

### 4.1 Registration & Login
- **US-01:** As a new user, I want to register with my email so I can create an account
- **US-02:** As a user, I want to sign in with Google for quick access
- **US-03:** As a user, I want to reset my password if I forget it

### 4.2 Selling Flow
- **US-04:** As a user, I want to select my device type and model to get a price quote
- **US-05:** As a user, I want to answer condition questions to get an accurate price
- **US-06:** As a user, I want to see an instant price quote before proceeding
- **US-07:** As a user, I want to upload photos of my device for verification
- **US-08:** As a user, I want to schedule a pickup at my preferred date and time
- **US-09:** As a user, I want to enter my pickup address

### 4.3 Order Management
- **US-10:** As a user, I want to view all my sell requests in one place
- **US-11:** As a user, I want to filter requests by status
- **US-12:** As a user, I want to see detailed information about each request
- **US-13:** As a user, I want to track my assigned pickup agent

### 4.4 Profile
- **US-14:** As a user, I want to update my profile information
- **US-15:** As a user, I want to manage my saved addresses
- **US-16:** As a user, I want to delete my account if needed

---

## 5. Acceptance Criteria

### 5.1 Landing Page
- [ ] Hero section displays with CTA button
- [ ] Navigation works on desktop and mobile
- [ ] All sections load with scroll animations
- [ ] Screenshot slider has working left/right arrows
- [ ] FAQ accordion expands/collapses correctly
- [ ] Footer links navigate to correct pages

### 5.2 Authentication
- [ ] Registration form validates all fields
- [ ] Login works with email/password
- [ ] Google Sign-In redirects and authenticates
- [ ] Forgot password sends reset email
- [ ] Logout clears session and redirects

### 5.3 Sell Flow
- [ ] Device selection shows all available models
- [ ] Condition questions update price dynamically
- [ ] Price quote displays after all questions answered
- [ ] Photo upload accepts images and shows preview
- [ ] Minimum 4 photos required to proceed
- [ ] Date picker shows available dates
- [ ] Time slot selection works
- [ ] Address form validates required fields
- [ ] Submit creates a new sell request

### 5.4 Dashboard
- [ ] Shows user's name in welcome message
- [ ] Displays correct stats (total, pending, completed)
- [ ] Recent requests list is clickable
- [ ] Quick action buttons navigate correctly

### 5.5 Requests
- [ ] All requests load in list view
- [ ] Status filter works correctly
- [ ] Request detail shows all information
- [ ] Status timeline updates correctly

---

## 6. Non-Functional Requirements

### 6.1 Performance
- Page load time < 3 seconds
- API response time < 500ms
- Smooth animations (60fps)

### 6.2 Security
- HTTPS only
- Secure authentication tokens
- Input sanitization
- Protected API endpoints

### 6.3 Accessibility
- Keyboard navigation support
- Screen reader compatible
- Sufficient color contrast
- Focus indicators

### 6.4 Browser Support
- Chrome (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Edge (latest 2 versions)
- Mobile browsers (Chrome, Safari)

---

## 7. Test Scenarios

### 7.1 Critical Paths
1. **New User Registration → Login → Sell Device → Submit Request**
2. **Returning User Login → View Requests → Check Status**
3. **Google Sign-In → Complete Sell Flow**
4. **Forgot Password → Reset → Login**

### 7.2 Edge Cases
- Invalid email format during registration
- Weak password rejection
- Upload of non-image files
- Network failure during photo upload
- Empty form submissions
- Session timeout handling

### 7.3 UI/UX Tests
- Mobile responsiveness on various screen sizes
- Touch interactions on mobile
- Scroll behavior and animations
- Form validation messages
- Loading states and spinners
- Error message displays

---

## 8. Contact Information

**Developer:** Macintosh Enterprise  
**Website:** https://buybackelite.com  
**Email:** contact@buybackelite.com  
**Phone:** +91 8595611340  
**Store:** Shop No. 157, 1st Floor, The Great India Place, Noida – 201301

---

*This document serves as the product specification for TestSprite automated testing.*
