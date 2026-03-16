-- ROOT CAUSE FIX: players.user_id had no UNIQUE constraint
-- This caused ALL ON CONFLICT (user_id) operations to fail with:
--   "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- Affected: claim_role_invitation RPC, approve_player_request RPC, all upserts

-- Add the missing unique constraint
ALTER TABLE public.players
ADD CONSTRAINT players_user_id_unique UNIQUE (user_id);

-- Now re-run the backfill (all previous attempts failed due to missing constraint)
INSERT INTO players (user_id, position)
SELECT p.id, 'CM'
FROM profiles p
WHERE 'player' = ANY(p.roles)
AND NOT EXISTS (SELECT 1 FROM players pl WHERE pl.user_id = p.id);
