-- ============================================================
-- Save nationality on signup
-- 1. Add nationality column to profiles (for all users)
-- 2. Update handle_new_user trigger to save nationality
-- 3. Update claim_role_invitation to set player country from metadata
-- ============================================================

-- 1. Add nationality column to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS nationality TEXT;

-- 2. Update handle_new_user to also save nationality from signup metadata
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, nationality)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'nationality'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Update claim_role_invitation to read nationality from auth metadata
--    and set it on the player record
CREATE OR REPLACE FUNCTION public.claim_role_invitation(
  invite_token TEXT,
  user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  inv RECORD;
  user_nationality TEXT;
BEGIN
  -- Find and validate the invitation
  SELECT * INTO inv
  FROM role_invitations
  WHERE token = invite_token
    AND is_active = TRUE
    AND expires_at > NOW()
  FOR UPDATE;

  IF inv IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid or expired invitation');
  END IF;

  -- Check max uses
  IF inv.max_uses IS NOT NULL AND inv.use_count >= inv.max_uses THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invitation has reached maximum uses');
  END IF;

  -- Update the user's profile with the invited roles (use role priority, not first element)
  UPDATE profiles
  SET role = COALESCE(
        (SELECT unnest FROM unnest(inv.roles)
         WHERE unnest IN ('owner','manager','coach','admin','editor','marketing','player')
         ORDER BY array_position(ARRAY['owner','manager','coach','admin','editor','marketing','player'], unnest)
         LIMIT 1),
        inv.roles[1]
      ),
      roles = inv.roles,
      player_request_status = CASE WHEN 'player' = ANY(inv.roles) THEN 'approved' ELSE player_request_status END
  WHERE id = user_id;

  -- Increment invitation use count
  UPDATE role_invitations
  SET use_count = use_count + 1
  WHERE id = inv.id;

  -- If player role, create player record with nationality from auth metadata
  IF 'player' = ANY(inv.roles) THEN
    -- Read nationality from auth.users metadata
    SELECT raw_user_meta_data->>'nationality'
    INTO user_nationality
    FROM auth.users
    WHERE id = user_id;

    INSERT INTO players (user_id, position, country)
    VALUES (user_id, 'CM', COALESCE(user_nationality, 'gb'))
    ON CONFLICT (user_id) DO UPDATE SET country = COALESCE(EXCLUDED.country, players.country);
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'roles', to_jsonb(inv.roles),
    'redirect', CASE
      WHEN 'player' = ANY(inv.roles) THEN '/profile/edit?setup=true'
      WHEN inv.roles && ARRAY['admin','super_admin','owner','manager'] THEN '/dashboard'
      WHEN 'coach' = ANY(inv.roles) THEN '/dashboard/training'
      WHEN inv.roles && ARRAY['editor','marketing'] THEN '/dashboard/content'
      ELSE '/profile'
    END
  );
END;
$$;
