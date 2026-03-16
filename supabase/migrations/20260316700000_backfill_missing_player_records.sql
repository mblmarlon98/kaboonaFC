-- Backfill: create player records for profiles that have 'player' role
-- but are missing from the players table (due to prior RLS bug)
INSERT INTO players (user_id, position)
SELECT p.id, 'CM'
FROM profiles p
WHERE 'player' = ANY(p.roles)
AND NOT EXISTS (SELECT 1 FROM players pl WHERE pl.user_id = p.id);

-- Also ensure these profiles have role = 'player' and approved status
UPDATE profiles
SET role = 'player', player_request_status = 'approved'
WHERE 'player' = ANY(roles) AND role = 'fan';
