-- Admin Panel Database Setup (CLEAN VERSION)
-- Run this in your Supabase SQL Editor
-- This version handles existing tables gracefully

-- =====================================================
-- STEP 1: Create sell_requests table (REQUIRED for app)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sell_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL,
  device_model TEXT,
  storage TEXT,
  ram TEXT,
  processor TEXT,
  overall_condition TEXT,
  condition_answers JSONB,
  photo_urls TEXT[],
  id_proof_url TEXT,
  user_location DECIMAL(10,6),
  user_address TEXT,
  estimated_price DECIMAL(10,2),
  final_price DECIMAL(10,2),
  admin_offer_price DECIMAL(10,2),
  status TEXT DEFAULT 'pending',
  rejection_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on sell_requests
ALTER TABLE public.sell_requests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist, then recreate
DROP POLICY IF EXISTS "Users can view own requests" ON public.sell_requests;
DROP POLICY IF EXISTS "Users can insert own requests" ON public.sell_requests;
DROP POLICY IF EXISTS "Users can update own pending requests" ON public.sell_requests;
DROP POLICY IF EXISTS "Admin can view all requests" ON public.sell_requests;
DROP POLICY IF EXISTS "Admin can update all requests" ON public.sell_requests;

-- Users can view their own requests
CREATE POLICY "Users can view own requests"
ON public.sell_requests FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own requests
CREATE POLICY "Users can insert own requests"
ON public.sell_requests FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending requests
CREATE POLICY "Users can update own pending requests"
ON public.sell_requests FOR UPDATE
USING (auth.uid() = user_id AND status = 'pending');

-- Admin/Public can view all requests (for admin panel)
CREATE POLICY "Admin can view all requests"
ON public.sell_requests FOR SELECT
USING (true);

-- Admin can update all requests
CREATE POLICY "Admin can update all requests"
ON public.sell_requests FOR UPDATE
USING (true);

-- =====================================================
-- STEP 2: Create device_prices table
-- =====================================================
CREATE TABLE IF NOT EXISTS public.device_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_type TEXT NOT NULL,
  model TEXT NOT NULL,
  storage TEXT,
  variant TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.device_prices ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read prices" ON public.device_prices;
DROP POLICY IF EXISTS "Authenticated users can manage prices" ON public.device_prices;

CREATE POLICY "Public can read prices"
ON public.device_prices FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage prices"
ON public.device_prices FOR ALL
USING (auth.role() = 'authenticated');

-- =====================================================
-- STEP 3: Add profile_photo_url to users if missing
-- =====================================================
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- =====================================================
-- STEP 4: Insert default prices (only if table is empty)
-- =====================================================
INSERT INTO public.device_prices (device_type, model, storage, base_price)
SELECT * FROM (VALUES
  ('MacBook', 'MacBook Air M1', '256GB', 45000),
  ('MacBook', 'MacBook Air M1', '512GB', 50000),
  ('MacBook', 'MacBook Air M2', '256GB', 65000),
  ('MacBook', 'MacBook Air M2', '512GB', 72000),
  ('MacBook', 'MacBook Pro 13" M2', '256GB', 75000),
  ('MacBook', 'MacBook Pro 13" M2', '512GB', 85000),
  ('MacBook', 'MacBook Pro 14" M3', '512GB', 120000),
  ('MacBook', 'MacBook Pro 14" M3', '1TB', 140000),
  ('MacBook', 'MacBook Pro 16" M3', '512GB', 150000),
  ('MacBook', 'MacBook Pro 16" M3 Pro', '1TB', 180000),
  ('iPad', 'iPad 9th Gen', '64GB', 18000),
  ('iPad', 'iPad 9th Gen', '256GB', 22000),
  ('iPad', 'iPad 10th Gen', '64GB', 25000),
  ('iPad', 'iPad 10th Gen', '256GB', 30000),
  ('iPad', 'iPad Air M1', '64GB', 35000),
  ('iPad', 'iPad Air M1', '256GB', 42000),
  ('iPad', 'iPad Air M2', '128GB', 45000),
  ('iPad', 'iPad Air M2', '256GB', 52000),
  ('iPad', 'iPad Pro 11" M2', '128GB', 55000),
  ('iPad', 'iPad Pro 11" M2', '256GB', 62000),
  ('iPad', 'iPad Pro 12.9" M2', '128GB', 70000),
  ('iPad', 'iPad Pro 12.9" M2', '256GB', 80000)
) AS v(device_type, model, storage, base_price)
WHERE NOT EXISTS (SELECT 1 FROM public.device_prices LIMIT 1);

-- =====================================================
-- DONE! Your database is now ready for the admin panel
-- =====================================================
