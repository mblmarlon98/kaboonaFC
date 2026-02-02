# Kaboona FC Website - Design Document

**Date:** 2026-02-02
**Status:** Approved

---

## Overview

A comprehensive football club website for Kaboona FC, home to Sunway University in Shah Alam, Malaysia. Features player management with FIFA-style cards, geolocation-based attendance, subscription payments, merchandise shop, and full admin dashboard.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 (Class Components) |
| State | Redux |
| Routing | React Router v6 (BrowserRouter) |
| Styling | Tailwind CSS |
| Animations | Framer Motion + GSAP |
| Charts | Recharts |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth (Email/Password, Google, Apple) |
| Storage | Cloudflare R2 |
| Payments | Stripe + PayPal + Apple Pay |
| Hosting | Vercel (GitHub auto-deploy) |
| Email | Cloudflare Email Routing + Gmail (@kaboonaFC.com - domain TBD) |

---

## Design Language

- **Style:** Netflix-inspired, elegant, heavily animated
- **Primary Colors:** Black (#000), White (#FFF)
- **Accent:** Gold (#D4AF37 or from logo)
- **Secondary:** Blue (subtle, from logo inner ring)
- **Mascot:** Tiger with crown
- **Modes:** Light and Dark mode toggle (top right)

---

## Site Architecture

### Public Pages
- `/` - Homepage
- `/our-team` - Team hierarchy + football field formation
- `/stats` - Animated stats dashboard
- `/shop` - Affiliate product catalog
- `/fan-portal` - Kaboona FC merchandise store
- `/investors` - Donations, sponsorship, crowdfunding
- `/terms`, `/privacy`, `/refund-policy`, `/cookie-policy`
- `/contact`

### Auth Pages
- `/login`, `/register`, `/forgot-password`
- `/training-signup` - Registration + subscription payment

### Protected Pages (Auth Required)
- `/profile` - Player's FIFA card, stats, attendance
- `/profile/edit` - Edit info, manage subscription

### Admin Pages (Role-Based)
- `/admin` - Main dashboard (traffic, payments, analytics)
- `/admin/players` - Player management
- `/admin/content` - CMS for all site text/images
- `/admin/training` - Schedule, attendance verification
- `/admin/payments` - Financial overview
- `/admin/investors` - Campaign management

---

## Database Schema

### Core Tables

```sql
-- Users & Auth (Supabase Auth + custom)
users
├── id (uuid, PK)
├── email
├── role (player/fan/admin/coach/manager/editor)
├── profile_image_url
├── subscription_status
├── created_at

-- Player profiles
players
├── id (uuid, PK)
├── user_id (FK → users)
├── jersey_number
├── position
├── height, weight, age
├── preferred_foot, weak_foot_rating (1-5)
├── pace, shooting, passing, dribbling, defending, physical (outfield)
├── diving, handling, kicking, reflexes, speed, positioning (goalkeeper)
├── card_background_image_url
├── is_retired, retired_at

-- Coaches
coaches
├── id, user_id (FK), title, bio, profile_image_url

-- Staff (owner, managers)
staff
├── id, user_id (FK), role, title, bio, profile_image_url

-- Editable site content
site_content
├── id, key, value, updated_by, updated_at

-- League standings
league_table
├── id, team_name, played, won, drawn, lost, gf, ga, gd, points, position

-- Matches
matches
├── id, opponent, date, time, location, location_coords
├── is_home, result
├── attendance_window_start, attendance_window_end

-- Training sessions
training_sessions
├── id, date, time, location, location_coords
├── is_recurring, recurrence_rule

-- Attendance records
attendance
├── id, user_id, session_type (match/training), session_id
├── checked_in_at, latitude, longitude, distance_from_venue
├── status (verified/pending/rejected/manual_approved)
```

### Payment Tables

```sql
-- Subscriptions
subscriptions
├── id, user_id, plan_type (monthly/yearly)
├── amount (100 or 960 MYR)
├── status (active/paused/cancelled)
├── stripe_subscription_id
├── current_period_start, current_period_end

-- All payments
payments
├── id, user_id, amount, currency (MYR)
├── type (subscription/merch/donation)
├── provider (stripe/paypal)
├── provider_transaction_id
├── status (pending/completed/failed/refunded)

-- Donations
donations
├── id, user_id (nullable), amount, message
├── sponsor_tier (bronze/silver/gold/platinum)
├── campaign_id (FK)

-- Crowdfunding campaigns
campaigns
├── id, title, description
├── goal_amount, current_amount
├── start_date, end_date, status
```

### Shop Tables

```sql
-- Kaboona FC merchandise
merch_categories
├── id, name, slug, display_order

merch_products
├── id, category_id, name, description, price
├── images[], sizes[], stock_quantity, is_active

-- Affiliate products
affiliate_categories
├── id, name, slug

affiliate_products
├── id, category_id, name, brand, image_url
├── affiliate_url, affiliate_provider (amazon/nike/adidas/puma)
```

### Stats Tables

```sql
-- Match stats per player
player_stats
├── id, player_id, match_id
├── goals, assists, clean_sheet
├── yellow_cards, red_cards, minutes_played

-- Coach ratings
player_ratings
├── id, player_id, match_id, coach_id
├── rating (1-10), notes

-- Site analytics
analytics_events
├── id, event_type, page_url
├── user_id (nullable), metadata, created_at
```

---

## Homepage Sections

1. **Navbar** - Logo, nav links, dark/light toggle, auth buttons
2. **Hero** - Full-width banner, club name, animated tiger logo
3. **About** - "Home to Sunway University, Shah Alam"
4. **Glory Section**
   - League table snapshot (position ± 3)
   - Top Scorers (player cards)
   - Clean Sheets (goalkeeper cards)
   - Most Attendance (player cards)
   - Yellow/Red Cards ("Wall of Shame" - fun)
5. **Training Ground** - Image, description, GPS coords
6. **Team Preview** - Coach cards, CTA to Our Team
7. **CTAs** - "Join Training" + "Become a Fan" cards
8. **Footer** - Links, social, legal

---

## Our Team Page

### Hierarchy (top to bottom)
1. **Team Owner** - Large card, gold border, crown icon
2. **Coaches** - Row of cards, connected with tree lines
3. **Players** - Football field in 4-4-2 formation

### Football Field Interaction
- Visual pitch background
- Position slots with stacked player thumbnails
- Hover on position → cards expand, spread apart, highlight
- Background darkens on hover
- Click card → player detail modal

### Player Card (FIFA Style)
- Action photo background
- Overall rating (calculated)
- Position badge
- 6 stats (or GK stats)
- Name, number, flag
- Gold/black theme

### Alumni Section
- "Legends of Kaboona"
- Retired players in carousel
- Greyscale/sepia tint

---

## Player Registration Flow

1. **Account Creation** - Email/password or Google/Apple
2. **Personal Info** - Name, age, DOB, gender, phone, emergency contact
3. **Player Info** - Position, jersey number, height, weight, preferred foot, weak foot
4. **Self-Rated Stats** - 6 sliders (1-99), live FIFA card preview
5. **Payment** - Monthly RM 100 or Yearly RM 960 (20% off)

---

## Attendance System

### Locations
- **Training:** Sunway University (3.0673° N, 101.6038° E)
- **Matches:** New Camp Field, Bandar Utama (Fridays 6-10pm MYT)

### Check-in Flow
1. Player opens site during session window
2. Prompt to check in
3. Browser requests geolocation
4. Compare coords (100m radius)
5. Within radius + time → Auto-verified
6. Outside radius → Pending for admin review

### Missed Check-in
- Request from profile page
- Admin verifies in dashboard

---

## Admin Dashboard

### Main View
- Traffic analytics (line/bar charts)
- Financial overview (revenue, MRR, subscriptions)
- Player stats (total, active, attendance rate)
- Quick actions (pending requests, new registrations)

### Role Permissions

| Role | Access |
|------|--------|
| Admin | Full access to everything |
| Coach | View attendance, rate players, view profiles |
| Team Manager | Manage schedule, view attendance |
| Content Editor | Edit site_content, upload images |

---

## Shop Structure

### Fan Portal (/fan-portal)
- Kaboona FC branded merchandise
- Categories: Jerseys, Training Kit, Accessories
- Cart + Stripe/PayPal checkout
- Order confirmation email

### Affiliate Shop (/shop)
- Football gear from partners
- Brands: Nike, Adidas, Puma + Amazon
- Search + filters
- External links with affiliate tracking
- Disclaimer about commissions

---

## Investor Page

### Donation Options
1. **One-Time** - RM 20/50/100/500/Custom
2. **Sponsorship Tiers**
   - Bronze: RM 500/yr
   - Silver: RM 1,500/yr
   - Gold: RM 5,000/yr
   - Platinum: RM 15,000/yr
3. **Crowdfunding Campaigns** - Goal-based with progress bars

### Features
- Wall of Supporters
- Sponsor perks reveal on hover
- Campaign management in admin

---

## Stats Page

- Full league table (Kaboona highlighted)
- Top Scorers bar chart
- Clean Sheets leaderboard
- Attendance heatmap
- Disciplinary charts (fun)
- Coach ratings radar chart

---

## Animations

### Framer Motion
- Page transitions (fade + slide)
- Staggered content reveal
- Card hover effects

### GSAP ScrollTrigger
- Parallax on heroes
- Elements animate on scroll
- Number count-ups

### General
- Skeleton loaders
- Dark/light mode transition (0.3s)
- Gold border glow on hover

---

## SEO & Legal

### SEO
- React Helmet for meta tags
- Open Graph for social sharing
- Sitemap.xml, robots.txt
- JSON-LD structured data

### Legal Pages
- Terms & Conditions
- Privacy Policy (PDPA Malaysia)
- Refund Policy
- Cookie Policy

### Cookie Consent
- Banner on first visit
- Accept/Decline analytics
- Essential always on

---

## Pricing

| Item | Price |
|------|-------|
| Monthly Training | RM 100 |
| Yearly Training | RM 960 (20% off) |
| Merchandise | Variable |
| Sponsorship | RM 500 - 15,000/yr |

---

## Third-Party Services

| Service | Purpose |
|---------|---------|
| Supabase | Database, Auth, Real-time |
| Cloudflare R2 | Image storage |
| Stripe | Primary payments |
| PayPal | Alternative payments |
| Vercel | Hosting |
| Google Cloud | OAuth credentials |
| Apple Developer | Sign in with Apple |

---

## Project Structure

```
/src
├── /components      # Reusable UI components
├── /pages           # Route components
├── /redux           # Store, slices, actions
├── /services        # Supabase, Stripe, API calls
├── /utils           # Helpers, geolocation
├── /assets          # Static images, logo
└── /styles          # Tailwind config, globals
```

---

## Initial Data (Seed)

- Basic structure (positions, categories, roles)
- Sample training schedule
- Empty player roster (real data added by admin)
- Placeholder site content

---

## Next Steps

1. Set up third-party services (Supabase, R2, Stripe)
2. Initialize React project with dependencies
3. Implement database schema
4. Build core pages and components
5. Integrate authentication
6. Add payment flows
7. Implement attendance system
8. Build admin dashboard
9. Add animations throughout
10. SEO and legal pages
11. Testing and deployment
