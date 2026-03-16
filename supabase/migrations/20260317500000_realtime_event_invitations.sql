-- Enable Realtime on event_invitations for live response tracking
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
    AND tablename = 'event_invitations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE event_invitations;
  END IF;
END $$;
