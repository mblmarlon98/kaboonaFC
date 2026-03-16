-- Fix: claim_role_invitation RPC was deployed with roles[1] bug
-- which always picked 'fan' as primary role instead of the highest-priority role.
-- This migration re-deploys the corrected function.

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

-- Also re-run the backfill for anyone who signed up with the bugged RPC
-- (they have 'player' in roles array but role is still 'fan')
UPDATE profiles
SET role = 'player', player_request_status = 'approved'
WHERE 'player' = ANY(roles) AND role = 'fan';

-- Ensure player records exist for these users
INSERT INTO players (user_id, position)
SELECT p.id, 'CM'
FROM profiles p
WHERE 'player' = ANY(p.roles)
AND NOT EXISTS (SELECT 1 FROM players pl WHERE pl.user_id = p.id);
