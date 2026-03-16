-- RPC to approve a player request (bypasses RLS via SECURITY DEFINER)
-- Called from Player Management and System User Management dashboards
CREATE OR REPLACE FUNCTION public.approve_player_request(target_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check caller is admin/owner/manager/coach
  IF NOT EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid()
    AND (role IN ('admin','super_admin','owner','manager','coach')
         OR roles && ARRAY['admin','super_admin','owner','manager','coach']::TEXT[])
  ) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Unauthorized');
  END IF;

  -- Update profile: add player to roles, set status approved
  UPDATE profiles
  SET role = COALESCE(
        (SELECT unnest FROM unnest(
          CASE WHEN NOT ('player' = ANY(COALESCE(roles, ARRAY['fan']::TEXT[])))
               THEN array_append(COALESCE(roles, ARRAY['fan']::TEXT[]), 'player')
               ELSE COALESCE(roles, ARRAY['fan']::TEXT[])
          END
        )
        WHERE unnest IN ('owner','manager','coach','admin','editor','marketing','player')
        ORDER BY array_position(ARRAY['owner','manager','coach','admin','editor','marketing','player'], unnest)
        LIMIT 1),
        'player'
      ),
      roles = CASE
        WHEN NOT ('player' = ANY(COALESCE(roles, ARRAY['fan']::TEXT[])))
        THEN array_append(COALESCE(roles, ARRAY['fan']::TEXT[]), 'player')
        ELSE COALESCE(roles, ARRAY['fan']::TEXT[])
      END,
      player_request_status = 'approved'
  WHERE id = target_user_id;

  -- Create player record (or no-op if already exists)
  INSERT INTO players (user_id, position)
  VALUES (target_user_id, 'CM')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$;
