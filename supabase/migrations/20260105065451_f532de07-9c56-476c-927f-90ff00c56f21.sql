-- Create captures table for storing 3D scan data
CREATE TABLE public.captures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  status INTEGER NOT NULL DEFAULT 0, -- 0 = processing, 1 = complete, 2 = failed
  thumbnail TEXT,
  file TEXT,
  serialize TEXT,
  folder_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.captures ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (no auth required for now)
CREATE POLICY "Anyone can view captures" 
ON public.captures 
FOR SELECT 
USING (true);

-- Create policy for public insert access
CREATE POLICY "Anyone can create captures" 
ON public.captures 
FOR INSERT 
WITH CHECK (true);

-- Create policy for public update access
CREATE POLICY "Anyone can update captures" 
ON public.captures 
FOR UPDATE 
USING (true);

-- Create policy for public delete access
CREATE POLICY "Anyone can delete captures" 
ON public.captures 
FOR DELETE 
USING (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_captures_updated_at
BEFORE UPDATE ON public.captures
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();