
-- Add image_url (mandatory), description (optional), discount_percent (optional) to menu_items
ALTER TABLE public.menu_items 
  ADD COLUMN IF NOT EXISTS image_url text,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS discount_percent numeric DEFAULT 0;

-- Create storage bucket for menu item images
INSERT INTO storage.buckets (id, name, public) VALUES ('menu-images', 'menu-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to menu-images bucket
CREATE POLICY "Authenticated users can upload menu images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'menu-images');

-- Allow public read access
CREATE POLICY "Public can view menu images"
ON storage.objects FOR SELECT TO public
USING (bucket_id = 'menu-images');

-- Allow owners to update/delete their uploads
CREATE POLICY "Users can update own menu images"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'menu-images' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "Users can delete own menu images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'menu-images' AND (storage.foldername(name))[1] = auth.uid()::text);
