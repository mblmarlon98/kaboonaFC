# Kaboona FC Website Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a comprehensive football club website with player management, FIFA-style cards, geolocation attendance, subscription payments, merchandise shop, and admin dashboard.

**Architecture:** React class components with Redux for state management, Supabase for database/auth, Cloudflare R2 for image storage, Stripe/PayPal for payments. Netflix-inspired black/white design with gold accents.

**Tech Stack:** React 18 (Class Components), Redux, React Router v6, Tailwind CSS, Framer Motion, GSAP, Recharts, Supabase, Stripe, PayPal

---

## Phase 0: Third-Party Service Setup

> **Note:** This phase requires browser automation to create accounts and configure services.

### Task 0.1: Create Supabase Project

**Steps:**
1. Go to supabase.com and create account/sign in
2. Create new project "kaboona-fc"
3. Note down: Project URL, Anon Key, Service Role Key
4. Save credentials to `.env.local` (not committed)

### Task 0.2: Create Cloudflare R2 Bucket

**Steps:**
1. Go to cloudflare.com and create account/sign in
2. Navigate to R2 Object Storage
3. Create bucket "kaboona-fc-assets"
4. Create API token with R2 read/write permissions
5. Note down: Account ID, Access Key ID, Secret Access Key, Bucket Name
6. Save credentials to `.env.local`

### Task 0.3: Create Stripe Account

**Steps:**
1. Go to stripe.com and create account
2. Complete business verification (can use test mode initially)
3. Create Products:
   - "Monthly Training Subscription" - RM 100/month recurring
   - "Yearly Training Subscription" - RM 960/year recurring
4. Note down: Publishable Key, Secret Key, Webhook Secret
5. Save credentials to `.env.local`

### Task 0.4: Create PayPal Developer Account

**Steps:**
1. Go to developer.paypal.com and create account
2. Create sandbox app "kaboona-fc"
3. Note down: Client ID, Client Secret
4. Save credentials to `.env.local`

---

## Phase 1: Project Initialization

### Task 1.1: Initialize React Project

**Files:**
- Create: `package.json`
- Create: `vite.config.js`
- Create: `tailwind.config.js`
- Create: `postcss.config.js`
- Create: `.env.local`
- Create: `.env.example`
- Create: `.gitignore`

**Step 1: Create Vite React project**

```bash
npm create vite@latest . -- --template react
```

**Step 2: Install core dependencies**

```bash
npm install react-router-dom@6 redux react-redux @reduxjs/toolkit tailwindcss postcss autoprefixer framer-motion gsap @gsap/react recharts @supabase/supabase-js @stripe/stripe-js @stripe/react-stripe-js
```

**Step 3: Install dev dependencies**

```bash
npm install -D @types/node eslint prettier
```

**Step 4: Initialize Tailwind**

```bash
npx tailwindcss init -p
```

**Step 5: Create .gitignore**

```gitignore
node_modules
dist
.env.local
.env*.local
*.log
.DS_Store
```

**Step 6: Create .env.example**

```env
# Supabase
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=

# Stripe
VITE_STRIPE_PUBLISHABLE_KEY=

# PayPal
VITE_PAYPAL_CLIENT_ID=

# Cloudflare R2
VITE_R2_PUBLIC_URL=
```

**Step 7: Commit**

```bash
git init
git add .
git commit -m "chore: initialize React project with Vite"
```

### Task 1.2: Configure Tailwind with Custom Theme

**Files:**
- Modify: `tailwind.config.js`
- Create: `src/index.css`

**Step 1: Update tailwind.config.js**

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        primary: {
          black: '#000000',
          white: '#FFFFFF',
        },
        accent: {
          gold: '#D4AF37',
          'gold-light': '#E5C158',
          'gold-dark': '#B8972E',
        },
        secondary: {
          blue: '#4A90A4',
          'blue-light': '#6BA3B5',
        },
        surface: {
          dark: '#0A0A0A',
          'dark-elevated': '#141414',
          'dark-hover': '#1F1F1F',
          light: '#FAFAFA',
          'light-elevated': '#FFFFFF',
          'light-hover': '#F0F0F0',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Oswald', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.5s ease-out',
        'scale-in': 'scaleIn 0.3s ease-out',
        'glow': 'glow 2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        glow: {
          '0%, 100%': { boxShadow: '0 0 20px rgba(212, 175, 55, 0.3)' },
          '50%': { boxShadow: '0 0 40px rgba(212, 175, 55, 0.6)' },
        },
      },
    },
  },
  plugins: [],
}
```

**Step 2: Update src/index.css**

```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Oswald:wght@400;500;600;700&display=swap');

@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  html {
    scroll-behavior: smooth;
  }

  body {
    @apply bg-surface-light dark:bg-surface-dark text-primary-black dark:text-primary-white transition-colors duration-300;
  }
}

@layer components {
  .btn-primary {
    @apply bg-accent-gold text-primary-black font-semibold px-6 py-3 rounded-lg hover:bg-accent-gold-light transition-all duration-200 hover:shadow-lg hover:shadow-accent-gold/20;
  }

  .btn-secondary {
    @apply border-2 border-accent-gold text-accent-gold font-semibold px-6 py-3 rounded-lg hover:bg-accent-gold hover:text-primary-black transition-all duration-200;
  }

  .card {
    @apply bg-surface-light-elevated dark:bg-surface-dark-elevated rounded-xl shadow-lg transition-all duration-300;
  }

  .card-hover {
    @apply hover:shadow-xl hover:shadow-accent-gold/10 hover:-translate-y-1;
  }

  .gold-border {
    @apply border-2 border-accent-gold;
  }

  .gold-glow {
    @apply shadow-lg shadow-accent-gold/30;
  }
}

@layer utilities {
  .text-gradient-gold {
    @apply bg-gradient-to-r from-accent-gold to-accent-gold-light bg-clip-text text-transparent;
  }
}
```

**Step 3: Commit**

```bash
git add .
git commit -m "feat: configure Tailwind with Kaboona FC theme"
```

### Task 1.3: Set Up Project Structure

**Files:**
- Create: `src/components/.gitkeep`
- Create: `src/pages/.gitkeep`
- Create: `src/redux/store.js`
- Create: `src/redux/slices/.gitkeep`
- Create: `src/services/supabase.js`
- Create: `src/services/stripe.js`
- Create: `src/utils/helpers.js`
- Create: `src/assets/.gitkeep`

**Step 1: Create directory structure**

```bash
mkdir -p src/{components,pages,redux/slices,services,utils,assets}
touch src/components/.gitkeep src/pages/.gitkeep src/redux/slices/.gitkeep src/assets/.gitkeep
```

**Step 2: Create Redux store**

```javascript
// src/redux/store.js
import { configureStore } from '@reduxjs/toolkit';

const store = configureStore({
  reducer: {
    // Slices will be added here
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export default store;
```

**Step 3: Create Supabase client**

```javascript
// src/services/supabase.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase credentials not configured');
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);

export default supabase;
```

**Step 4: Create Stripe client**

```javascript
// src/services/stripe.js
import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

let stripePromise = null;

export const getStripe = () => {
  if (!stripePromise && stripePublishableKey) {
    stripePromise = loadStripe(stripePublishableKey);
  }
  return stripePromise;
};

export default getStripe;
```

**Step 5: Create helpers**

```javascript
// src/utils/helpers.js
export const formatCurrency = (amount, currency = 'MYR') => {
  return new Intl.NumberFormat('en-MY', {
    style: 'currency',
    currency,
  }).format(amount);
};

export const formatDate = (date) => {
  return new Intl.DateTimeFormat('en-MY', {
    dateStyle: 'medium',
  }).format(new Date(date));
};

export const calculateOverallRating = (stats) => {
  const { pace, shooting, passing, dribbling, defending, physical } = stats;
  return Math.round((pace + shooting + passing + dribbling + defending + physical) / 6);
};

export const calculateGKRating = (stats) => {
  const { diving, handling, kicking, reflexes, speed, positioning } = stats;
  return Math.round((diving + handling + kicking + reflexes + speed + positioning) / 6);
};

export const getDistanceFromCoords = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c; // Distance in meters
};
```

**Step 6: Commit**

```bash
git add .
git commit -m "feat: set up project structure with Redux, Supabase, Stripe"
```

### Task 1.4: Create App Entry Point with Router

**Files:**
- Modify: `src/main.jsx`
- Modify: `src/App.jsx`
- Create: `src/App.css` (delete default, keep minimal)

**Step 1: Update main.jsx**

```jsx
// src/main.jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import store from './redux/store';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </Provider>
  </React.StrictMode>
);
```

**Step 2: Update App.jsx with routes**

```jsx
// src/App.jsx
import React, { Component } from 'react';
import { Routes, Route } from 'react-router-dom';

// Placeholder pages - will be implemented later
const Home = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Kaboona FC - Coming Soon</h1></div>;
const OurTeam = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Our Team</h1></div>;
const Stats = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Stats</h1></div>;
const Shop = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Shop</h1></div>;
const FanPortal = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Fan Portal</h1></div>;
const Investors = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Investors</h1></div>;
const Login = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Login</h1></div>;
const Register = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Register</h1></div>;
const TrainingSignup = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Training Signup</h1></div>;
const Profile = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Profile</h1></div>;
const Admin = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">Admin Dashboard</h1></div>;
const NotFound = () => <div className="min-h-screen flex items-center justify-center"><h1 className="text-4xl font-display">404 - Not Found</h1></div>;

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      darkMode: true, // Default to dark mode (Netflix style)
    };
  }

  componentDidMount() {
    // Check for saved preference
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      this.setState({ darkMode: savedMode === 'true' });
    }
    // Apply dark mode class
    this.applyDarkMode(savedMode === 'true' || savedMode === null);
  }

  applyDarkMode = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  toggleDarkMode = () => {
    this.setState(
      (prevState) => ({ darkMode: !prevState.darkMode }),
      () => {
        localStorage.setItem('darkMode', this.state.darkMode);
        this.applyDarkMode(this.state.darkMode);
      }
    );
  };

  render() {
    return (
      <div className="min-h-screen">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Home />} />
          <Route path="/our-team" element={<OurTeam />} />
          <Route path="/stats" element={<Stats />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/fan-portal" element={<FanPortal />} />
          <Route path="/investors" element={<Investors />} />

          {/* Auth Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/training-signup" element={<TrainingSignup />} />

          {/* Protected Routes */}
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<Profile />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/*" element={<Admin />} />

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
    );
  }
}

export default App;
```

**Step 3: Delete default App.css content**

```css
/* src/App.css - Keep empty, styles in index.css */
```

**Step 4: Run dev server to verify**

```bash
npm run dev
```

Expected: App runs at localhost:5173, shows "Kaboona FC - Coming Soon"

**Step 5: Commit**

```bash
git add .
git commit -m "feat: set up React Router with all route placeholders"
```

---

## Phase 2: Database Schema Setup

### Task 2.1: Create Supabase Tables - Core

**Location:** Supabase Dashboard → SQL Editor

**Step 1: Run SQL to create core tables**

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'fan' CHECK (role IN ('fan', 'player', 'coach', 'manager', 'editor', 'admin')),
  profile_image_url TEXT,
  subscription_status TEXT DEFAULT 'none' CHECK (subscription_status IN ('none', 'active', 'paused', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  jersey_number INTEGER,
  position TEXT NOT NULL,
  height_cm INTEGER,
  weight_kg INTEGER,
  date_of_birth DATE,
  preferred_foot TEXT DEFAULT 'right' CHECK (preferred_foot IN ('left', 'right', 'both')),
  weak_foot_rating INTEGER DEFAULT 3 CHECK (weak_foot_rating >= 1 AND weak_foot_rating <= 5),
  -- Outfield stats (1-99)
  pace INTEGER DEFAULT 50 CHECK (pace >= 1 AND pace <= 99),
  shooting INTEGER DEFAULT 50 CHECK (shooting >= 1 AND shooting <= 99),
  passing INTEGER DEFAULT 50 CHECK (passing >= 1 AND passing <= 99),
  dribbling INTEGER DEFAULT 50 CHECK (dribbling >= 1 AND dribbling <= 99),
  defending INTEGER DEFAULT 50 CHECK (defending >= 1 AND defending <= 99),
  physical INTEGER DEFAULT 50 CHECK (physical >= 1 AND physical <= 99),
  -- Goalkeeper stats (1-99)
  diving INTEGER DEFAULT 50 CHECK (diving >= 1 AND diving <= 99),
  handling INTEGER DEFAULT 50 CHECK (handling >= 1 AND handling <= 99),
  kicking INTEGER DEFAULT 50 CHECK (kicking >= 1 AND kicking <= 99),
  reflexes INTEGER DEFAULT 50 CHECK (reflexes >= 1 AND reflexes <= 99),
  gk_speed INTEGER DEFAULT 50 CHECK (gk_speed >= 1 AND gk_speed <= 99),
  gk_positioning INTEGER DEFAULT 50 CHECK (gk_positioning >= 1 AND gk_positioning <= 99),
  -- Card appearance
  card_background_url TEXT,
  nationality TEXT,
  -- Status
  is_retired BOOLEAN DEFAULT FALSE,
  retired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coaches table
CREATE TABLE public.coaches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  title TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff table (owner, managers)
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff')),
  title TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site content (CMS)
CREATE TABLE public.site_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value TEXT,
  content_type TEXT DEFAULT 'text' CHECK (content_type IN ('text', 'html', 'image', 'json')),
  updated_by UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- League table
CREATE TABLE public.league_table (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  team_name TEXT NOT NULL,
  played INTEGER DEFAULT 0,
  won INTEGER DEFAULT 0,
  drawn INTEGER DEFAULT 0,
  lost INTEGER DEFAULT 0,
  goals_for INTEGER DEFAULT 0,
  goals_against INTEGER DEFAULT 0,
  goal_difference INTEGER GENERATED ALWAYS AS (goals_for - goals_against) STORED,
  points INTEGER GENERATED ALWAYS AS (won * 3 + drawn) STORED,
  position INTEGER,
  is_kaboona BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_players_user_id ON public.players(user_id);
CREATE INDEX idx_players_position ON public.players(position);
CREATE INDEX idx_players_is_retired ON public.players(is_retired);
CREATE INDEX idx_league_table_position ON public.league_table(position);
```

**Step 2: Verify tables created in Supabase Dashboard**

### Task 2.2: Create Supabase Tables - Sessions & Attendance

**Step 1: Run SQL**

```sql
-- Matches
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  opponent TEXT NOT NULL,
  match_date DATE NOT NULL,
  match_time TIME NOT NULL,
  location TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  is_home BOOLEAN DEFAULT TRUE,
  result TEXT, -- e.g., "2-1", null if not played
  our_score INTEGER,
  opponent_score INTEGER,
  attendance_window_start TIMESTAMPTZ,
  attendance_window_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training sessions
CREATE TABLE public.training_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  location TEXT NOT NULL,
  location_lat DECIMAL(10, 8) DEFAULT 3.0673,
  location_lng DECIMAL(11, 8) DEFAULT 101.6038,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT, -- e.g., "WEEKLY:TUE,THU"
  notes TEXT,
  is_cancelled BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('match', 'training')),
  session_id UUID NOT NULL,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  distance_from_venue DECIMAL(10, 2), -- in meters
  status TEXT DEFAULT 'pending' CHECK (status IN ('verified', 'pending', 'rejected', 'manual_approved')),
  verified_by UUID REFERENCES public.profiles(id),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_matches_date ON public.matches(match_date);
CREATE INDEX idx_training_sessions_date ON public.training_sessions(session_date);
CREATE INDEX idx_attendance_user ON public.attendance(user_id);
CREATE INDEX idx_attendance_session ON public.attendance(session_type, session_id);
CREATE INDEX idx_attendance_status ON public.attendance(status);
```

### Task 2.3: Create Supabase Tables - Payments & Subscriptions

**Step 1: Run SQL**

```sql
-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'MYR',
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled', 'expired')),
  stripe_subscription_id TEXT,
  stripe_customer_id TEXT,
  paypal_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'MYR',
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'merch', 'donation', 'sponsorship')),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal', 'apple_pay')),
  provider_transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donations
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(id),
  amount DECIMAL(10, 2) NOT NULL,
  message TEXT,
  display_name TEXT,
  is_anonymous BOOLEAN DEFAULT FALSE,
  sponsor_tier TEXT CHECK (sponsor_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  campaign_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Crowdfunding campaigns
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  goal_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for donations.campaign_id
ALTER TABLE public.donations
ADD CONSTRAINT fk_donations_campaign
FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_subscriptions_user ON public.subscriptions(user_id);
CREATE INDEX idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX idx_payments_user ON public.payments(user_id);
CREATE INDEX idx_payments_status ON public.payments(status);
CREATE INDEX idx_donations_campaign ON public.donations(campaign_id);
CREATE INDEX idx_campaigns_status ON public.campaigns(status);
```

### Task 2.4: Create Supabase Tables - Shop & Products

**Step 1: Run SQL**

```sql
-- Merchandise categories
CREATE TABLE public.merch_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Merchandise products
CREATE TABLE public.merch_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.merch_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  images TEXT[], -- Array of image URLs
  sizes TEXT[], -- Array of available sizes
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate categories
CREATE TABLE public.affiliate_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate products
CREATE TABLE public.affiliate_products (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES public.affiliate_categories(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  brand TEXT,
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  affiliate_provider TEXT CHECK (affiliate_provider IN ('amazon', 'nike', 'adidas', 'puma', 'other')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Orders (for merchandise)
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payment_id UUID REFERENCES public.payments(id),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')),
  shipping_address JSONB,
  total_amount DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.merch_products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT,
  unit_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_merch_products_category ON public.merch_products(category_id);
CREATE INDEX idx_merch_products_active ON public.merch_products(is_active);
CREATE INDEX idx_affiliate_products_category ON public.affiliate_products(category_id);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_order_items_order ON public.order_items(order_id);
```

### Task 2.5: Create Supabase Tables - Stats & Analytics

**Step 1: Run SQL**

```sql
-- Player match stats
CREATE TABLE public.player_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  clean_sheet BOOLEAN DEFAULT FALSE,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  minutes_played INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, match_id)
);

-- Player ratings (coach gives after match)
CREATE TABLE public.player_ratings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  rating DECIMAL(3, 1) NOT NULL CHECK (rating >= 1 AND rating <= 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(player_id, match_id, coach_id)
);

-- Analytics events
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  event_type TEXT NOT NULL,
  page_url TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  session_id TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_player_stats_player ON public.player_stats(player_id);
CREATE INDEX idx_player_stats_match ON public.player_stats(match_id);
CREATE INDEX idx_player_ratings_player ON public.player_ratings(player_id);
CREATE INDEX idx_analytics_events_type ON public.analytics_events(event_type);
CREATE INDEX idx_analytics_events_created ON public.analytics_events(created_at);
```

### Task 2.6: Set Up Row Level Security (RLS)

**Step 1: Run SQL to enable RLS and create policies**

```sql
-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merch_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.merch_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- Helper function to check user role
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT AS $$
  SELECT role FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Helper function to check if user is admin/manager/editor
CREATE OR REPLACE FUNCTION public.is_staff(user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT role IN ('admin', 'manager', 'editor', 'coach') FROM public.profiles WHERE id = user_id;
$$ LANGUAGE SQL SECURITY DEFINER;

-- Profiles: Users can read all, update own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Players: Public read, own update, admin full access
CREATE POLICY "Players are viewable by everyone" ON public.players FOR SELECT USING (true);
CREATE POLICY "Players can update own" ON public.players FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Players can insert own" ON public.players FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admin can manage players" ON public.players FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Coaches, Staff: Public read, admin manage
CREATE POLICY "Coaches are viewable by everyone" ON public.coaches FOR SELECT USING (true);
CREATE POLICY "Admin can manage coaches" ON public.coaches FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Staff are viewable by everyone" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Admin can manage staff" ON public.staff FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Site content: Public read, editor/admin manage
CREATE POLICY "Site content is viewable by everyone" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Editors can manage content" ON public.site_content FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'editor'));

-- League table, matches, training: Public read, admin manage
CREATE POLICY "League table is viewable by everyone" ON public.league_table FOR SELECT USING (true);
CREATE POLICY "Admin can manage league table" ON public.league_table FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Admin can manage matches" ON public.matches FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));
CREATE POLICY "Training sessions are viewable by everyone" ON public.training_sessions FOR SELECT USING (true);
CREATE POLICY "Admin can manage training" ON public.training_sessions FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'manager'));

-- Attendance: Own read, staff manage
CREATE POLICY "Users can view own attendance" ON public.attendance FOR SELECT USING (auth.uid() = user_id OR public.is_staff(auth.uid()));
CREATE POLICY "Users can insert own attendance" ON public.attendance FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Staff can manage attendance" ON public.attendance FOR ALL USING (public.is_staff(auth.uid()));

-- Subscriptions & payments: Own read, admin manage
CREATE POLICY "Users can view own subscriptions" ON public.subscriptions FOR SELECT USING (auth.uid() = user_id OR public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT USING (auth.uid() = user_id OR public.get_user_role(auth.uid()) = 'admin');

-- Donations & campaigns: Public read, admin manage
CREATE POLICY "Donations are viewable by everyone" ON public.donations FOR SELECT USING (true);
CREATE POLICY "Campaigns are viewable by everyone" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Admin can manage campaigns" ON public.campaigns FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Shop: Public read, admin manage
CREATE POLICY "Merch categories viewable by everyone" ON public.merch_categories FOR SELECT USING (true);
CREATE POLICY "Merch products viewable by everyone" ON public.merch_products FOR SELECT USING (true);
CREATE POLICY "Affiliate categories viewable by everyone" ON public.affiliate_categories FOR SELECT USING (true);
CREATE POLICY "Affiliate products viewable by everyone" ON public.affiliate_products FOR SELECT USING (true);
CREATE POLICY "Admin can manage merch" ON public.merch_categories FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Admin can manage merch products" ON public.merch_products FOR ALL USING (public.get_user_role(auth.uid()) = 'admin');

-- Orders: Own read, admin manage
CREATE POLICY "Users can view own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id OR public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Users can create orders" ON public.orders FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Stats: Public read, coach/admin manage
CREATE POLICY "Player stats viewable by everyone" ON public.player_stats FOR SELECT USING (true);
CREATE POLICY "Coach can manage stats" ON public.player_stats FOR ALL USING (public.get_user_role(auth.uid()) IN ('admin', 'coach'));
CREATE POLICY "Player ratings viewable by everyone" ON public.player_ratings FOR SELECT USING (true);
CREATE POLICY "Coach can add ratings" ON public.player_ratings FOR INSERT WITH CHECK (public.get_user_role(auth.uid()) IN ('admin', 'coach'));

-- Analytics: Admin only
CREATE POLICY "Admin can view analytics" ON public.analytics_events FOR SELECT USING (public.get_user_role(auth.uid()) = 'admin');
CREATE POLICY "Anyone can insert analytics" ON public.analytics_events FOR INSERT WITH CHECK (true);
```

### Task 2.7: Seed Initial Data

**Step 1: Run SQL to seed basic data**

```sql
-- Insert default site content
INSERT INTO public.site_content (key, value, content_type) VALUES
('hero_title', 'KABOONA FC', 'text'),
('hero_tagline', 'Pride of Sunway University', 'text'),
('about_title', 'About Kaboona FC', 'text'),
('about_description', 'We are a football team home to Sunway University in Shah Alam, Malaysia. Founded with passion and driven by excellence, we compete in local university leagues while building a community of dedicated players and fans.', 'text'),
('training_ground_title', 'Our Training Ground', 'text'),
('training_ground_description', 'Located at the heart of Sunway University, our training facility provides the perfect environment for players to develop their skills and push their limits.', 'text'),
('training_ground_image', '', 'image'),
('footer_text', '© 2026 Kaboona Football Club. All rights reserved.', 'text');

-- Insert default merch categories
INSERT INTO public.merch_categories (name, slug, display_order) VALUES
('Jerseys', 'jerseys', 1),
('Training Kit', 'training-kit', 2),
('Shorts', 'shorts', 3),
('Accessories', 'accessories', 4);

-- Insert default affiliate categories
INSERT INTO public.affiliate_categories (name, slug, display_order) VALUES
('Football Boots', 'boots', 1),
('Training Gear', 'training-gear', 2),
('Footballs', 'footballs', 3),
('Goalkeeper Gear', 'goalkeeper-gear', 4),
('Accessories', 'accessories', 5);

-- Insert sample league table
INSERT INTO public.league_table (team_name, played, won, drawn, lost, goals_for, goals_against, position, is_kaboona) VALUES
('Taylor''s FC', 10, 8, 1, 1, 24, 8, 1, false),
('UCSI United', 10, 7, 2, 1, 20, 10, 2, false),
('APU Warriors', 10, 6, 2, 2, 18, 12, 3, false),
('Kaboona FC', 10, 6, 1, 3, 19, 14, 4, true),
('Monash Eagles', 10, 5, 2, 3, 15, 12, 5, false),
('INTI Lions', 10, 4, 3, 3, 14, 14, 6, false),
('MMU Thunder', 10, 3, 2, 5, 12, 16, 7, false);

-- Insert default training schedule (Tuesdays and Thursdays 7-9pm)
INSERT INTO public.training_sessions (session_date, start_time, end_time, location, location_lat, location_lng, is_recurring, recurrence_rule) VALUES
('2026-02-04', '19:00', '21:00', 'Sunway University Field', 3.0673, 101.6038, true, 'WEEKLY:TUE'),
('2026-02-06', '19:00', '21:00', 'Sunway University Field', 3.0673, 101.6038, true, 'WEEKLY:THU');
```

**Step 2: Commit database setup notes**

Create a file documenting the schema:

```bash
# Create schema documentation
cat > docs/database-schema.md << 'EOF'
# Kaboona FC Database Schema

Database hosted on Supabase (PostgreSQL).

## Tables Overview

### Core
- `profiles` - User accounts (extends Supabase auth)
- `players` - Player profiles with FIFA-style stats
- `coaches` - Coach profiles
- `staff` - Owner, managers
- `site_content` - CMS content
- `league_table` - League standings

### Sessions & Attendance
- `matches` - Match schedule and results
- `training_sessions` - Training schedule
- `attendance` - Check-in records with geolocation

### Payments
- `subscriptions` - Training subscriptions
- `payments` - All payment records
- `donations` - One-time and campaign donations
- `campaigns` - Crowdfunding campaigns

### Shop
- `merch_categories` - Kaboona FC merchandise categories
- `merch_products` - Merchandise items
- `affiliate_categories` - Affiliate shop categories
- `affiliate_products` - Affiliate links
- `orders` - Merchandise orders
- `order_items` - Order line items

### Stats & Analytics
- `player_stats` - Match performance stats
- `player_ratings` - Coach ratings
- `analytics_events` - Site analytics

## Row Level Security

All tables have RLS enabled with role-based policies:
- `admin` - Full access to everything
- `coach` - Can rate players, view attendance
- `manager` - Can manage schedules
- `editor` - Can edit site content
- `player` - Can manage own profile
- `fan` - Read-only public content
EOF

git add docs/database-schema.md
git commit -m "docs: add database schema documentation"
```

---

## Phase 3: Core Components

### Task 3.1: Create Layout Components

**Files:**
- Create: `src/components/Layout/Navbar.jsx`
- Create: `src/components/Layout/Footer.jsx`
- Create: `src/components/Layout/Layout.jsx`
- Create: `src/components/Layout/index.js`

**Step 1: Create Navbar component**

```jsx
// src/components/Layout/Navbar.jsx
import React, { Component } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

class Navbar extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isMenuOpen: false,
      isScrolled: false,
    };
  }

  componentDidMount() {
    window.addEventListener('scroll', this.handleScroll);
  }

  componentWillUnmount() {
    window.removeEventListener('scroll', this.handleScroll);
  }

  handleScroll = () => {
    this.setState({ isScrolled: window.scrollY > 50 });
  };

  toggleMenu = () => {
    this.setState((prev) => ({ isMenuOpen: !prev.isMenuOpen }));
  };

  render() {
    const { darkMode, toggleDarkMode, user } = this.props;
    const { isMenuOpen, isScrolled } = this.state;

    const navLinks = [
      { to: '/', label: 'Home' },
      { to: '/our-team', label: 'Our Team' },
      { to: '/stats', label: 'Stats' },
      { to: '/shop', label: 'Shop' },
      { to: '/fan-portal', label: 'Fan Portal' },
      { to: '/investors', label: 'Investors' },
    ];

    return (
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          isScrolled
            ? 'bg-surface-dark/95 backdrop-blur-md shadow-lg'
            : 'bg-transparent'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-2">
              <img
                src="/logo.png"
                alt="Kaboona FC"
                className="h-10 w-10 md:h-12 md:w-12"
              />
              <span className="font-display text-xl md:text-2xl font-bold text-primary-white">
                KABOONA
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <NavLink
                  key={link.to}
                  to={link.to}
                  className={({ isActive }) =>
                    `px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      isActive
                        ? 'text-accent-gold bg-accent-gold/10'
                        : 'text-primary-white/80 hover:text-primary-white hover:bg-white/5'
                    }`
                  }
                >
                  {link.label}
                </NavLink>
              ))}
            </div>

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2 rounded-lg text-primary-white/80 hover:text-primary-white hover:bg-white/5 transition-colors"
                aria-label="Toggle dark mode"
              >
                <motion.div
                  initial={false}
                  animate={{ rotate: darkMode ? 0 : 180 }}
                  transition={{ duration: 0.3 }}
                >
                  {darkMode ? (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  ) : (
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z" />
                    </svg>
                  )}
                </motion.div>
              </button>

              {/* Auth buttons */}
              {user ? (
                <Link
                  to="/profile"
                  className="flex items-center space-x-2 p-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <img
                    src={user.profile_image_url || '/default-avatar.png'}
                    alt={user.full_name}
                    className="w-8 h-8 rounded-full border-2 border-accent-gold"
                  />
                </Link>
              ) : (
                <div className="hidden md:flex items-center space-x-2">
                  <Link
                    to="/login"
                    className="px-4 py-2 text-sm font-medium text-primary-white/80 hover:text-primary-white transition-colors"
                  >
                    Login
                  </Link>
                  <Link to="/register" className="btn-primary text-sm">
                    Join Us
                  </Link>
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={this.toggleMenu}
                className="md:hidden p-2 rounded-lg text-primary-white/80 hover:text-primary-white hover:bg-white/5 transition-colors"
                aria-label="Toggle menu"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {isMenuOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-surface-dark/95 backdrop-blur-md border-t border-white/10"
            >
              <div className="px-4 py-4 space-y-2">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => this.setState({ isMenuOpen: false })}
                    className={({ isActive }) =>
                      `block px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                        isActive
                          ? 'text-accent-gold bg-accent-gold/10'
                          : 'text-primary-white/80 hover:text-primary-white hover:bg-white/5'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                {!user && (
                  <div className="pt-4 border-t border-white/10 space-y-2">
                    <Link
                      to="/login"
                      onClick={() => this.setState({ isMenuOpen: false })}
                      className="block px-4 py-3 text-center text-base font-medium text-primary-white/80 hover:text-primary-white transition-colors"
                    >
                      Login
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => this.setState({ isMenuOpen: false })}
                      className="block btn-primary text-center"
                    >
                      Join Us
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    );
  }
}

export default Navbar;
```

**Step 2: Create Footer component**

```jsx
// src/components/Layout/Footer.jsx
import React, { Component } from 'react';
import { Link } from 'react-router-dom';

class Footer extends Component {
  render() {
    const currentYear = new Date().getFullYear();

    const footerLinks = {
      club: [
        { to: '/our-team', label: 'Our Team' },
        { to: '/stats', label: 'Stats' },
        { to: '/investors', label: 'Investors' },
      ],
      shop: [
        { to: '/fan-portal', label: 'Fan Portal' },
        { to: '/shop', label: 'Shop' },
      ],
      join: [
        { to: '/training-signup', label: 'Join Training' },
        { to: '/register', label: 'Create Account' },
      ],
      legal: [
        { to: '/terms', label: 'Terms & Conditions' },
        { to: '/privacy', label: 'Privacy Policy' },
        { to: '/refund-policy', label: 'Refund Policy' },
        { to: '/cookie-policy', label: 'Cookie Policy' },
      ],
    };

    return (
      <footer className="bg-surface-dark-elevated border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
            {/* Logo and description */}
            <div className="col-span-2 md:col-span-1">
              <Link to="/" className="flex items-center space-x-2">
                <img src="/logo.png" alt="Kaboona FC" className="h-10 w-10" />
                <span className="font-display text-xl font-bold text-primary-white">
                  KABOONA
                </span>
              </Link>
              <p className="mt-4 text-sm text-primary-white/60">
                Pride of Sunway University
              </p>
            </div>

            {/* Club links */}
            <div>
              <h3 className="text-sm font-semibold text-accent-gold uppercase tracking-wider">
                Club
              </h3>
              <ul className="mt-4 space-y-2">
                {footerLinks.club.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-primary-white/60 hover:text-primary-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Shop links */}
            <div>
              <h3 className="text-sm font-semibold text-accent-gold uppercase tracking-wider">
                Shop
              </h3>
              <ul className="mt-4 space-y-2">
                {footerLinks.shop.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-primary-white/60 hover:text-primary-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Join links */}
            <div>
              <h3 className="text-sm font-semibold text-accent-gold uppercase tracking-wider">
                Join
              </h3>
              <ul className="mt-4 space-y-2">
                {footerLinks.join.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-primary-white/60 hover:text-primary-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Legal links */}
            <div>
              <h3 className="text-sm font-semibold text-accent-gold uppercase tracking-wider">
                Legal
              </h3>
              <ul className="mt-4 space-y-2">
                {footerLinks.legal.map((link) => (
                  <li key={link.to}>
                    <Link
                      to={link.to}
                      className="text-sm text-primary-white/60 hover:text-primary-white transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="mt-12 pt-8 border-t border-white/10">
            <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
              <p className="text-sm text-primary-white/40">
                © {currentYear} Kaboona Football Club. All rights reserved.
              </p>
              <div className="flex space-x-6">
                <a
                  href="https://instagram.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-white/40 hover:text-accent-gold transition-colors"
                >
                  <span className="sr-only">Instagram</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" />
                  </svg>
                </a>
                <a
                  href="https://twitter.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-white/40 hover:text-accent-gold transition-colors"
                >
                  <span className="sr-only">Twitter</span>
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                  </svg>
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    );
  }
}

export default Footer;
```

**Step 3: Create Layout wrapper**

```jsx
// src/components/Layout/Layout.jsx
import React, { Component } from 'react';
import Navbar from './Navbar';
import Footer from './Footer';

class Layout extends Component {
  render() {
    const { children, darkMode, toggleDarkMode, user } = this.props;

    return (
      <div className="min-h-screen flex flex-col">
        <Navbar darkMode={darkMode} toggleDarkMode={toggleDarkMode} user={user} />
        <main className="flex-1 pt-16 md:pt-20">{children}</main>
        <Footer />
      </div>
    );
  }
}

export default Layout;
```

**Step 4: Create index export**

```javascript
// src/components/Layout/index.js
export { default as Layout } from './Layout';
export { default as Navbar } from './Navbar';
export { default as Footer } from './Footer';
```

**Step 5: Commit**

```bash
git add .
git commit -m "feat: add Layout, Navbar, and Footer components"
```

---

*[Plan continues with Tasks 3.2-3.x for more components, then Phases 4-10 for pages, auth, payments, etc.]*

---

## Remaining Phases Overview

Due to the size of this project, here's a summary of remaining phases:

### Phase 4: Redux State Management
- Auth slice (user, session)
- Content slice (site content from DB)
- Players slice
- Cart slice (for shop)

### Phase 5: Authentication
- Supabase Auth integration
- Login/Register pages
- Protected route wrapper
- OAuth (Google, Apple) setup

### Phase 6: Homepage
- Hero section with animations
- About section
- Glory section (league table, top scorers, etc.)
- Training ground section
- Team preview
- CTA cards

### Phase 7: Our Team Page
- Team hierarchy (owner, coaches)
- Football field formation
- Player cards (FIFA style)
- Alumni section

### Phase 8: Player System
- Registration flow
- Profile page with FIFA card
- Stats graphs
- Subscription management

### Phase 9: Attendance System
- Geolocation check-in
- Request attendance
- Admin verification

### Phase 10: Payments
- Stripe integration
- PayPal integration
- Subscription management
- One-time payments

### Phase 11: Shop & Fan Portal
- Merchandise store
- Cart & checkout
- Affiliate shop

### Phase 12: Investors Page
- Donations
- Sponsorship tiers
- Crowdfunding campaigns

### Phase 13: Stats Page
- Animated charts
- Leaderboards
- Fun stats section

### Phase 14: Admin Dashboard
- Traffic analytics
- Player management
- Content management
- Attendance management
- Payment overview

### Phase 15: Polish & Deploy
- SEO setup
- Legal pages
- Testing
- Vercel deployment

---

**Note:** Each phase will be expanded with full bite-sized tasks following the TDD approach when executed.
