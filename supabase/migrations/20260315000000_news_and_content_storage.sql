-- News articles table for Fan Portal
CREATE TABLE news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  image_url TEXT,
  author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_news_articles_published ON news_articles(is_published, published_at DESC);

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

-- Everyone can read published articles
CREATE POLICY "news_articles_public_read" ON news_articles
  FOR SELECT USING (is_published = true);

-- Admins/editors can manage all articles
CREATE POLICY "news_articles_admin_all" ON news_articles
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('admin', 'super_admin', 'editor')
        OR profiles.roles && ARRAY['admin', 'super_admin', 'editor']
      )
    )
  );

-- Updated_at trigger
CREATE TRIGGER update_news_articles_updated_at
  BEFORE UPDATE ON news_articles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Storage bucket for CMS content images (hero, about, training, news)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'site-content',
  'site-content',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Public read
CREATE POLICY "site_content_storage_select" ON storage.objects
  FOR SELECT USING (bucket_id = 'site-content');

-- Admins/editors can upload
CREATE POLICY "site_content_storage_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'site-content' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('admin', 'super_admin', 'editor')
        OR profiles.roles && ARRAY['admin', 'super_admin', 'editor']
      )
    )
  );

-- Admins/editors can delete
CREATE POLICY "site_content_storage_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'site-content' AND
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND (
        profiles.role IN ('admin', 'super_admin', 'editor')
        OR profiles.roles && ARRAY['admin', 'super_admin', 'editor']
      )
    )
  );
