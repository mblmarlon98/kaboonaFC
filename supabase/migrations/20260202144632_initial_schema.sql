-- ============================================
-- Kaboona FC Database Schema
-- ============================================

-- Profiles table (extends auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'fan' CHECK (role IN ('player', 'fan', 'admin', 'coach', 'manager', 'editor')),
  profile_image_url TEXT,
  subscription_status TEXT DEFAULT 'none' CHECK (subscription_status IN ('none', 'active', 'paused', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Site content table (CMS)
CREATE TABLE public.site_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  updated_by UUID REFERENCES public.profiles(id),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- League table
CREATE TABLE public.league_table (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Players table
CREATE TABLE public.players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  jersey_number INTEGER,
  position TEXT CHECK (position IN ('GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LM', 'RM', 'LW', 'RW', 'CF', 'ST')),
  height INTEGER,
  weight INTEGER,
  age INTEGER,
  preferred_foot TEXT DEFAULT 'right' CHECK (preferred_foot IN ('left', 'right', 'both')),
  weak_foot_rating INTEGER DEFAULT 3 CHECK (weak_foot_rating BETWEEN 1 AND 5),
  -- Outfield stats (1-99)
  pace INTEGER DEFAULT 50 CHECK (pace BETWEEN 1 AND 99),
  shooting INTEGER DEFAULT 50 CHECK (shooting BETWEEN 1 AND 99),
  passing INTEGER DEFAULT 50 CHECK (passing BETWEEN 1 AND 99),
  dribbling INTEGER DEFAULT 50 CHECK (dribbling BETWEEN 1 AND 99),
  defending INTEGER DEFAULT 50 CHECK (defending BETWEEN 1 AND 99),
  physical INTEGER DEFAULT 50 CHECK (physical BETWEEN 1 AND 99),
  -- Goalkeeper stats (1-99)
  diving INTEGER DEFAULT 50 CHECK (diving BETWEEN 1 AND 99),
  handling INTEGER DEFAULT 50 CHECK (handling BETWEEN 1 AND 99),
  kicking INTEGER DEFAULT 50 CHECK (kicking BETWEEN 1 AND 99),
  reflexes INTEGER DEFAULT 50 CHECK (reflexes BETWEEN 1 AND 99),
  gk_speed INTEGER DEFAULT 50 CHECK (gk_speed BETWEEN 1 AND 99),
  gk_positioning INTEGER DEFAULT 50 CHECK (gk_positioning BETWEEN 1 AND 99),
  -- Card customization
  card_background_image_url TEXT,
  is_retired BOOLEAN DEFAULT FALSE,
  retired_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Coaches table
CREATE TABLE public.coaches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staff table (owner, managers)
CREATE TABLE public.staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'assistant')),
  title TEXT NOT NULL,
  bio TEXT,
  profile_image_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matches table
CREATE TABLE public.matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opponent TEXT NOT NULL,
  match_date DATE NOT NULL,
  match_time TIME NOT NULL,
  location TEXT NOT NULL,
  location_lat DECIMAL(10, 8),
  location_lng DECIMAL(11, 8),
  is_home BOOLEAN DEFAULT TRUE,
  result TEXT,
  attendance_window_start TIMESTAMPTZ,
  attendance_window_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Training sessions table
CREATE TABLE public.training_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_date DATE NOT NULL,
  session_time TIME NOT NULL,
  location TEXT NOT NULL,
  location_lat DECIMAL(10, 8) DEFAULT 3.0673,
  location_lng DECIMAL(11, 8) DEFAULT 101.6038,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_rule TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance table
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  session_type TEXT NOT NULL CHECK (session_type IN ('match', 'training')),
  session_id UUID NOT NULL,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  distance_from_venue DECIMAL(10, 2),
  status TEXT DEFAULT 'pending' CHECK (status IN ('verified', 'pending', 'rejected', 'manual_approved')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('monthly', 'yearly')),
  amount DECIMAL(10, 2) NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'cancelled')),
  stripe_subscription_id TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payments table
CREATE TABLE public.payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  currency TEXT DEFAULT 'MYR',
  payment_type TEXT NOT NULL CHECK (payment_type IN ('subscription', 'merch', 'donation')),
  provider TEXT NOT NULL CHECK (provider IN ('stripe', 'paypal')),
  provider_transaction_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Donations table
CREATE TABLE public.donations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  message TEXT,
  sponsor_tier TEXT CHECK (sponsor_tier IN ('bronze', 'silver', 'gold', 'platinum')),
  campaign_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns table
CREATE TABLE public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  goal_amount DECIMAL(10, 2) NOT NULL,
  current_amount DECIMAL(10, 2) DEFAULT 0,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key for donations -> campaigns
ALTER TABLE public.donations ADD CONSTRAINT fk_donations_campaign
  FOREIGN KEY (campaign_id) REFERENCES public.campaigns(id) ON DELETE SET NULL;

-- Merchandise categories
CREATE TABLE public.merch_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Merchandise products
CREATE TABLE public.merch_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.merch_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  images TEXT[] DEFAULT '{}',
  sizes TEXT[] DEFAULT '{}',
  stock_quantity INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate categories
CREATE TABLE public.affiliate_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Affiliate products
CREATE TABLE public.affiliate_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES public.affiliate_categories(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  brand TEXT,
  image_url TEXT,
  affiliate_url TEXT NOT NULL,
  affiliate_provider TEXT CHECK (affiliate_provider IN ('amazon', 'nike', 'adidas', 'puma')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player stats per match
CREATE TABLE public.player_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  goals INTEGER DEFAULT 0,
  assists INTEGER DEFAULT 0,
  clean_sheet BOOLEAN DEFAULT FALSE,
  yellow_cards INTEGER DEFAULT 0,
  red_cards INTEGER DEFAULT 0,
  minutes_played INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player ratings from coaches
CREATE TABLE public.player_ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES public.players(id) ON DELETE CASCADE,
  match_id UUID NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  coach_id UUID NOT NULL REFERENCES public.coaches(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating BETWEEN 1 AND 10),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Analytics events
CREATE TABLE public.analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  page_url TEXT,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- Enable Row Level Security
-- ============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.league_table ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coaches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
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
ALTER TABLE public.player_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.player_ratings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- ============================================
-- RLS Policies
-- ============================================

-- Profiles: Public read, users can update their own
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Site content: Public read, admins/editors can manage
CREATE POLICY "Site content is viewable by everyone" ON public.site_content FOR SELECT USING (true);
CREATE POLICY "Admins can manage site content" ON public.site_content FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'editor')));

-- League table: Public read, admins can manage
CREATE POLICY "League table is viewable by everyone" ON public.league_table FOR SELECT USING (true);
CREATE POLICY "Admins can manage league table" ON public.league_table FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Players: Public read, user can update their own, admins can manage all
CREATE POLICY "Players are viewable by everyone" ON public.players FOR SELECT USING (true);
CREATE POLICY "Users can update own player profile" ON public.players FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "Users can insert own player profile" ON public.players FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage players" ON public.players FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Coaches: Public read, admins can manage
CREATE POLICY "Coaches are viewable by everyone" ON public.coaches FOR SELECT USING (true);
CREATE POLICY "Admins can manage coaches" ON public.coaches FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Staff: Public read, admins can manage
CREATE POLICY "Staff are viewable by everyone" ON public.staff FOR SELECT USING (true);
CREATE POLICY "Admins can manage staff" ON public.staff FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Matches: Public read, admins can manage
CREATE POLICY "Matches are viewable by everyone" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Admins can manage matches" ON public.matches FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Training sessions: Public read, admins/managers can manage
CREATE POLICY "Training sessions are viewable by everyone" ON public.training_sessions FOR SELECT USING (true);
CREATE POLICY "Admins can manage training sessions" ON public.training_sessions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'manager')));

-- Attendance: Users can see their own, admins/coaches can see all
CREATE POLICY "Users can view own attendance" ON public.attendance FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coach', 'manager')));
CREATE POLICY "Users can insert own attendance" ON public.attendance FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage attendance" ON public.attendance FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coach', 'manager')));

-- Subscriptions: Users can see their own, admins can see all
CREATE POLICY "Users can view own subscription" ON public.subscriptions FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Users can insert own subscription" ON public.subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Payments: Users can see their own, admins can see all
CREATE POLICY "Users can view own payments" ON public.payments FOR SELECT
  USING (user_id = auth.uid() OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Admins can manage payments" ON public.payments FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Donations: Public can insert (anonymous allowed), admins can see all
CREATE POLICY "Anyone can donate" ON public.donations FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view donations" ON public.donations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Campaigns: Public read, admins can manage
CREATE POLICY "Campaigns are viewable by everyone" ON public.campaigns FOR SELECT USING (true);
CREATE POLICY "Admins can manage campaigns" ON public.campaigns FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Merch categories: Public read, admins can manage
CREATE POLICY "Merch categories are viewable by everyone" ON public.merch_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage merch categories" ON public.merch_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Merch products: Public read, admins can manage
CREATE POLICY "Merch products are viewable by everyone" ON public.merch_products FOR SELECT USING (true);
CREATE POLICY "Admins can manage merch products" ON public.merch_products FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Affiliate categories: Public read, admins can manage
CREATE POLICY "Affiliate categories are viewable by everyone" ON public.affiliate_categories FOR SELECT USING (true);
CREATE POLICY "Admins can manage affiliate categories" ON public.affiliate_categories FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Affiliate products: Public read, admins can manage
CREATE POLICY "Affiliate products are viewable by everyone" ON public.affiliate_products FOR SELECT USING (true);
CREATE POLICY "Admins can manage affiliate products" ON public.affiliate_products FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Player stats: Public read, admins/coaches can manage
CREATE POLICY "Player stats are viewable by everyone" ON public.player_stats FOR SELECT USING (true);
CREATE POLICY "Admins can manage player stats" ON public.player_stats FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coach')));

-- Player ratings: Coaches can rate, admins can see all
CREATE POLICY "Player ratings viewable by admins and coaches" ON public.player_ratings FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'coach')));
CREATE POLICY "Coaches can insert ratings" ON public.player_ratings FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.coaches WHERE user_id = auth.uid()));
CREATE POLICY "Admins can manage ratings" ON public.player_ratings FOR ALL
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- Analytics: Insert for authenticated, read for admins
CREATE POLICY "Anyone can insert analytics" ON public.analytics_events FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins can view analytics" ON public.analytics_events FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- ============================================
-- Triggers for updated_at
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_site_content_updated_at BEFORE UPDATE ON public.site_content
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_league_table_updated_at BEFORE UPDATE ON public.league_table
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON public.players
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coaches_updated_at BEFORE UPDATE ON public.coaches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_matches_updated_at BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_training_sessions_updated_at BEFORE UPDATE ON public.training_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON public.campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_merch_products_updated_at BEFORE UPDATE ON public.merch_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_affiliate_products_updated_at BEFORE UPDATE ON public.affiliate_products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- Function to handle new user signup
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to auto-create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
