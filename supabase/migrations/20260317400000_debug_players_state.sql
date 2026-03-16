-- Debug: check actual state of players table and profiles
DO $$
DECLARE
  player_count INTEGER;
  profile_with_player_role INTEGER;
  missing_count INTEGER;
BEGIN
  SELECT count(*) INTO player_count FROM players;
  RAISE NOTICE 'Total player records: %', player_count;

  SELECT count(*) INTO profile_with_player_role
  FROM profiles WHERE 'player' = ANY(roles);
  RAISE NOTICE 'Profiles with player role: %', profile_with_player_role;

  SELECT count(*) INTO missing_count
  FROM profiles p
  WHERE 'player' = ANY(p.roles)
  AND NOT EXISTS (SELECT 1 FROM players pl WHERE pl.user_id = p.id);
  RAISE NOTICE 'Profiles missing player record: %', missing_count;
END $$;
