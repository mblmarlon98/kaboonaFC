-- Performance Tracking System Migration
-- For Kaboona FC FIFA Card System
-- Created: 2024-02-03

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. Add skill_moves and weak_foot to players table
-- ============================================

ALTER TABLE players
ADD COLUMN IF NOT EXISTS skill_moves INTEGER DEFAULT 3 CHECK (skill_moves >= 1 AND skill_moves <= 5);

ALTER TABLE players
ADD COLUMN IF NOT EXISTS weak_foot INTEGER DEFAULT 3 CHECK (weak_foot >= 1 AND weak_foot <= 5);

-- Update existing players with default values
UPDATE players
SET skill_moves = 3, weak_foot = 3
WHERE skill_moves IS NULL OR weak_foot IS NULL;

-- ============================================
-- 2. Player Performances Table
-- Records individual match performances
-- ============================================

CREATE TABLE IF NOT EXISTS player_performances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  match_id UUID,
  match_date DATE NOT NULL,
  rating DECIMAL(3,1) CHECK (rating >= 0 AND rating <= 10),
  is_good_performance BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_player_performances_player_id ON player_performances(player_id);
CREATE INDEX IF NOT EXISTS idx_player_performances_match_date ON player_performances(match_date);

-- ============================================
-- 3. Player Streaks Table
-- Tracks consecutive good performances
-- ============================================

CREATE TABLE IF NOT EXISTS player_streaks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE UNIQUE,
  current_streak INTEGER DEFAULT 0,
  streak_threshold INTEGER DEFAULT 5,
  last_rating_increase DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for faster lookups
CREATE INDEX IF NOT EXISTS idx_player_streaks_player_id ON player_streaks(player_id);

-- ============================================
-- 4. Rating History Table
-- Records when player ratings increase
-- ============================================

CREATE TABLE IF NOT EXISTS rating_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  old_overall INTEGER,
  new_overall INTEGER,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for history queries
CREATE INDEX IF NOT EXISTS idx_rating_history_player_id ON rating_history(player_id);

-- ============================================
-- 5. Team Formations Table
-- Stores saved formations
-- ============================================

CREATE TABLE IF NOT EXISTS team_formations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  formation_type VARCHAR(20) NOT NULL, -- '4-4-2', '4-3-3', etc.
  positions JSONB NOT NULL, -- Array of {position: 'GK', player_id: 'uuid', x: 50, y: 90}
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- ============================================
-- 6. Match Evaluations Table
-- Stores match evaluation records
-- ============================================

CREATE TABLE IF NOT EXISTS match_evaluations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_date DATE NOT NULL,
  opponent VARCHAR(100),
  result VARCHAR(20), -- 'win', 'loss', 'draw'
  score_for INTEGER,
  score_against INTEGER,
  notes TEXT,
  formation_id UUID REFERENCES team_formations(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id)
);

-- Index for date queries
CREATE INDEX IF NOT EXISTS idx_match_evaluations_date ON match_evaluations(match_date);

-- ============================================
-- 7. Row Level Security (RLS) Policies
-- ============================================

-- Enable RLS on all new tables
ALTER TABLE player_performances ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE rating_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_formations ENABLE ROW LEVEL SECURITY;
ALTER TABLE match_evaluations ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Anyone can view performances"
  ON player_performances FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view streaks"
  ON player_streaks FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view rating history"
  ON rating_history FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view active formation"
  ON team_formations FOR SELECT
  USING (is_active = true);

-- Coach/Owner policies for managing data
-- Note: Adjust the role check based on your auth setup

CREATE POLICY "Coaches can insert performances"
  ON player_performances FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'owner')
    )
  );

CREATE POLICY "Coaches can update performances"
  ON player_performances FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'owner')
    )
  );

CREATE POLICY "Coaches can manage streaks"
  ON player_streaks FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'owner')
    )
  );

CREATE POLICY "Coaches can insert rating history"
  ON rating_history FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'owner')
    )
  );

CREATE POLICY "Coaches can view all formations"
  ON team_formations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'owner')
    )
  );

CREATE POLICY "Coaches can manage formations"
  ON team_formations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'owner')
    )
  );

CREATE POLICY "Coaches can manage evaluations"
  ON match_evaluations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND role IN ('coach', 'owner')
    )
  );

-- Players can update their own skill_moves and weak_foot
-- Note: This assumes players have a linked user_id in the players table
CREATE POLICY "Players can update own skills"
  ON players FOR UPDATE
  USING (
    user_id = auth.uid()
  )
  WITH CHECK (
    user_id = auth.uid()
  );

-- ============================================
-- 8. Helper Functions
-- ============================================

-- Function to get streak threshold based on overall rating
CREATE OR REPLACE FUNCTION get_streak_threshold(overall INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF overall >= 90 THEN RETURN 10;
  ELSIF overall >= 85 THEN RETURN 8;
  ELSIF overall >= 80 THEN RETURN 7;
  ELSIF overall >= 75 THEN RETURN 6;
  ELSE RETURN 5;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to update streaks after performance insert
CREATE OR REPLACE FUNCTION update_player_streak()
RETURNS TRIGGER AS $$
DECLARE
  current_streak_val INTEGER;
  threshold_val INTEGER;
  player_overall INTEGER;
BEGIN
  -- Get current streak
  SELECT current_streak, streak_threshold INTO current_streak_val, threshold_val
  FROM player_streaks
  WHERE player_id = NEW.player_id;

  IF NOT FOUND THEN
    -- Initialize streak record if it doesn't exist
    current_streak_val := 0;
    threshold_val := 5;
  END IF;

  IF NEW.is_good_performance THEN
    current_streak_val := current_streak_val + 1;

    -- Check if threshold reached
    IF current_streak_val >= threshold_val THEN
      -- Reset streak and mark rating increase
      INSERT INTO player_streaks (player_id, current_streak, streak_threshold, last_rating_increase)
      VALUES (NEW.player_id, 0, threshold_val, CURRENT_DATE)
      ON CONFLICT (player_id) DO UPDATE
      SET current_streak = 0, last_rating_increase = CURRENT_DATE, updated_at = NOW();
    ELSE
      -- Just update streak count
      INSERT INTO player_streaks (player_id, current_streak, streak_threshold)
      VALUES (NEW.player_id, current_streak_val, threshold_val)
      ON CONFLICT (player_id) DO UPDATE
      SET current_streak = current_streak_val, updated_at = NOW();
    END IF;
  ELSE
    -- Reset streak on poor/average performance
    INSERT INTO player_streaks (player_id, current_streak, streak_threshold)
    VALUES (NEW.player_id, 0, threshold_val)
    ON CONFLICT (player_id) DO UPDATE
    SET current_streak = 0, updated_at = NOW();
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-updating streaks
DROP TRIGGER IF EXISTS trigger_update_player_streak ON player_performances;
CREATE TRIGGER trigger_update_player_streak
AFTER INSERT ON player_performances
FOR EACH ROW
EXECUTE FUNCTION update_player_streak();

-- ============================================
-- Migration complete!
-- ============================================
