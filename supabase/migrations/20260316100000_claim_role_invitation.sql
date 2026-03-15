-- ============================================================
-- claim_role_invitation RPC function
-- Runs as SECURITY DEFINER to bypass RLS, ensuring role
-- assignment works even before the user's session is fully established.
-- ============================================================

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
  result JSONB;
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

  -- Update the user's profile with the invited roles
  UPDATE profiles
  SET role = inv.roles[1],
      roles = inv.roles
  WHERE id = user_id;

  -- Increment invitation use count
  UPDATE role_invitations
  SET use_count = use_count + 1
  WHERE id = inv.id;

  -- If player role, create player record
  IF 'player' = ANY(inv.roles) THEN
    INSERT INTO players (user_id, position)
    VALUES (user_id, 'CM')
    ON CONFLICT (user_id) DO NOTHING;
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
