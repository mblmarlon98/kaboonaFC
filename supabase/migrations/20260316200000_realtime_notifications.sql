-- ============================================================
-- Enable Supabase Realtime for the notifications table
-- This allows the client to receive INSERT events in real-time
-- via Supabase's postgres_changes channel.
-- ============================================================

ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
