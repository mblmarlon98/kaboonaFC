-- Migration: Match Reminder Notifications
-- Adds automated 3-hour-before-kickoff reminders for accepted players

-- 1. Add 'reminded' column to matches table to prevent duplicate reminders
ALTER TABLE public.matches ADD COLUMN IF NOT EXISTS reminded BOOLEAN DEFAULT FALSE;

-- 2. Create the reminder function
CREATE OR REPLACE FUNCTION public.send_match_reminders()
RETURNS void AS $$
DECLARE
  match_record RECORD;
BEGIN
  -- Find matches happening in ~3 hours (using MYT timezone)
  FOR match_record IN
    SELECT m.id, m.opponent, m.match_time
    FROM public.matches m
    WHERE m.status = 'scheduled'
      AND m.reminded = FALSE
      AND m.match_date = (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur')::date
      AND m.match_time - INTERVAL '3 hours' <= (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur')::time
      AND m.match_time - INTERVAL '2 hours 30 minutes' > (NOW() AT TIME ZONE 'Asia/Kuala_Lumpur')::time
  LOOP
    -- Create notification for each accepted player
    INSERT INTO public.notifications (user_id, title, body, type, reference_type, reference_id)
    SELECT
      ei.player_id,
      'Match Reminder',
      'Match vs ' || match_record.opponent || ' starts in about 3 hours!',
      'match_reminder',
      'match',
      match_record.id
    FROM public.event_invitations ei
    WHERE ei.event_type = 'match'
      AND ei.event_id = match_record.id
      AND ei.status = 'accepted';

    -- Mark match as reminded
    UPDATE public.matches SET reminded = TRUE WHERE id = match_record.id;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Schedule reminder check every 30 minutes via pg_cron
-- Note: pg_cron must be enabled in Supabase dashboard under Database > Extensions
DO $$
BEGIN
  -- Try to create the cron job (will fail silently if pg_cron not enabled)
  PERFORM cron.schedule(
    'match-reminders',
    '*/30 * * * *',
    'SELECT public.send_match_reminders()'
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'pg_cron not available - match reminders will need to be triggered manually or via Edge Function';
END $$;

-- To run manually: SELECT public.send_match_reminders();
-- To set up via Edge Function if pg_cron unavailable:
-- Create a scheduled Edge Function that calls this SQL function
