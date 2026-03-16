-- Force-create player records for ALL profiles with 'player' in roles
-- Previous backfills may have failed silently

DO $$
DECLARE
  rec RECORD;
  cnt INTEGER := 0;
BEGIN
  FOR rec IN
    SELECT p.id, p.full_name
    FROM profiles p
    WHERE 'player' = ANY(p.roles)
    AND NOT EXISTS (SELECT 1 FROM players pl WHERE pl.user_id = p.id)
  LOOP
    INSERT INTO players (user_id, position)
    VALUES (rec.id, 'CM');
    cnt := cnt + 1;
    RAISE NOTICE 'Created player record for % (%)', rec.full_name, rec.id;
  END LOOP;
  RAISE NOTICE 'Total player records created: %', cnt;
END $$;
