-- Remove player records for users who no longer have the 'player' role
DELETE FROM players
WHERE user_id IN (
  SELECT pl.user_id FROM players pl
  JOIN profiles pr ON pl.user_id = pr.id
  WHERE NOT ('player' = ANY(pr.roles))
    AND pr.role != 'player'
);
