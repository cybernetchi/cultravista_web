-- Create storage bucket for captures
INSERT INTO storage.buckets (id, name, public) VALUES ('captures', 'captures', true)
ON CONFLICT (id) DO NOTHING;

-- Create RLS policies for captures bucket
CREATE POLICY "Public read access for captures" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'captures');

CREATE POLICY "Anyone can upload captures" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'captures');

CREATE POLICY "Anyone can update captures" 
ON storage.objects FOR UPDATE 
USING (bucket_id = 'captures');

CREATE POLICY "Anyone can delete captures" 
ON storage.objects FOR DELETE 
USING (bucket_id = 'captures');