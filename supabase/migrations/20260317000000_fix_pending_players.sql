-- Fix players stuck in pending state:
-- 1. Anyone with 'player' in roles array should be approved with a player record
-- 2. Anyone with a player record but role != 'player' gets their profile fixed

-- Fix profiles: if they have 'player' in roles, ensure role and status are correct
UPDATE profiles
SET role = COALESCE(
      (SELECT unnest FROM unnest(roles)
       WHERE unnest IN ('owner','manager','coach','admin','editor','marketing','player')
       ORDER BY array_position(ARRAY['owner','manager','coach','admin','editor','marketing','player'], unnest)
       LIMIT 1),
      role
    ),
    player_request_status = 'approved'
WHERE 'player' = ANY(roles)
  AND (player_request_status IS NULL OR player_request_status != 'approved');

-- Ensure player records exist for all approved players
INSERT INTO players (user_id, position)
SELECT p.id, 'CM'
FROM profiles p
WHERE 'player' = ANY(p.roles)
  AND NOT EXISTS (SELECT 1 FROM players pl WHERE pl.user_id = p.id);
