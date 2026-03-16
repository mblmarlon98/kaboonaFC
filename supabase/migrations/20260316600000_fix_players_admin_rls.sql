-- Fix: Admins can manage players policy was missing WITH CHECK clause
-- This caused INSERT to fail when admin approves a player request
-- Also expand to include owner/manager/coach roles

DROP POLICY IF EXISTS "Admins can manage players" ON players;
CREATE POLICY "Admins can manage players" ON players FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin','super_admin','owner','manager','coach')
           OR profiles.roles && ARRAY['admin','super_admin','owner','manager','coach']::TEXT[])
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin','super_admin','owner','manager','coach')
           OR profiles.roles && ARRAY['admin','super_admin','owner','manager','coach']::TEXT[])
    )
  );
