-- Add new columns to profiles table for extended registration
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS phone text;

-- Update existing RLS policies are already in place