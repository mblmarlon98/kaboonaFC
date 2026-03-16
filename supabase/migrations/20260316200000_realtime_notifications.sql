-- ============================================================
-- Enable Supabase Realtime for the notifications table
-- This allows the client to receive INSERT events in real-time
-- via Supabase's postgres_changes channel.
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
