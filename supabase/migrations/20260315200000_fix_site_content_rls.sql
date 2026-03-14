-- Fix site_content RLS: allow super_admin, owner, marketing (not just admin/editor)
DROP POLICY IF EXISTS "Admins can manage site content" ON public.site_content;
CREATE POLICY "Staff can manage site content" ON public.site_content FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role IN ('admin', 'super_admin', 'owner', 'editor', 'marketing')
        OR roles && ARRAY['admin', 'super_admin', 'owner', 'editor', 'marketing']
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role IN ('admin', 'super_admin', 'owner', 'editor', 'marketing')
        OR roles && ARRAY['admin', 'super_admin', 'owner', 'editor', 'marketing']
      )
    )
  );

-- Also fix storage bucket policies to include owner/marketing
DROP POLICY IF EXISTS "site_content_storage_insert" ON storage.objects;
CREATE POLICY "site_content_storage_insert" ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'site-content'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role IN ('admin', 'super_admin', 'owner', 'editor', 'marketing')
        OR roles && ARRAY['admin', 'super_admin', 'owner', 'editor', 'marketing']
      )
    )
  );

DROP POLICY IF EXISTS "site_content_storage_delete" ON storage.objects;
CREATE POLICY "site_content_storage_delete" ON storage.objects FOR DELETE
  USING (
    bucket_id = 'site-content'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid()
      AND (
        role IN ('admin', 'super_admin', 'owner', 'editor', 'marketing')
        OR roles && ARRAY['admin', 'super_admin', 'owner', 'editor', 'marketing']
      )
    )
  );
