-- Role invitation links for staff and player onboarding
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS role_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token TEXT UNIQUE NOT NULL DEFAULT encode(extensions.gen_random_bytes(24), 'hex'),
  roles TEXT[] NOT NULL DEFAULT ARRAY['fan'],
  label TEXT,
  created_by UUID REFERENCES auth.users(id),
  expires_at TIMESTAMPTZ,
  max_uses INTEGER,
  use_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE role_invitations ENABLE ROW LEVEL SECURITY;

-- Admins can manage invitations
CREATE POLICY role_invitations_admin_all ON role_invitations
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (profiles.role IN ('admin', 'super_admin') OR profiles.roles && ARRAY['admin', 'super_admin'])
    )
  );

-- Anyone can read active invitations (for registration flow)
CREATE POLICY role_invitations_public_read ON role_invitations
  FOR SELECT USING (is_active = true);
