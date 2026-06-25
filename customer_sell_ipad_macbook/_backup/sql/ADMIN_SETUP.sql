-- Admin Panel Database Setup
-- Run this in your Supabase SQL Editor

-- =====================================================
-- STEP 1: Create sell_requests table (REQUIRED for app)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.sell_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  device_type TEXT NOT NULL, -- 'MacBook' or 'iPad'
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
  status TEXT DEFAULT 'pending', -- pending, reviewing, approved, rejected, pickup_scheduled, picked_up, completed, cancelled
  rejection_reason TEXT,
  admin_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on sell_requests
ALTER TABLE public.sell_requests ENABLE ROW LEVEL SECURITY;

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

-- =====================================================
-- STEP 2: Create device_prices table for price management
-- =====================================================
CREATE TABLE IF NOT EXISTS public.device_prices (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  device_type TEXT NOT NULL, -- 'MacBook' or 'iPad'
  model TEXT NOT NULL,
  storage TEXT,
  variant TEXT,
  base_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.device_prices ENABLE ROW LEVEL SECURITY;

-- Allow public read access for prices
CREATE POLICY "Public can read prices"
ON public.device_prices FOR SELECT
USING (true);

-- Allow authenticated users (admin) to manage prices
CREATE POLICY "Authenticated users can manage prices"
ON public.device_prices FOR ALL
USING (auth.role() = 'authenticated');

-- Insert default MacBook prices
INSERT INTO public.device_prices (device_type, model, storage, base_price) VALUES
('MacBook', 'MacBook Air M1', '256GB', 45000),
('MacBook', 'MacBook Air M1', '512GB', 50000),
('MacBook', 'MacBook Air M2', '256GB', 65000),
('MacBook', 'MacBook Air M2', '512GB', 72000),
('MacBook', 'MacBook Pro 13" M2', '256GB', 75000),
('MacBook', 'MacBook Pro 13" M2', '512GB', 85000),
('MacBook', 'MacBook Pro 14" M3', '512GB', 120000),
('MacBook', 'MacBook Pro 14" M3', '1TB', 140000),
('MacBook', 'MacBook Pro 16" M3', '512GB', 150000),
('MacBook', 'MacBook Pro 16" M3 Pro', '1TB', 180000);

-- Insert default iPad prices
INSERT INTO public.device_prices (device_type, model, storage, base_price) VALUES
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
('iPad', 'iPad Pro 12.9" M2', '256GB', 80000);

-- Make sure users table has all required columns for admin to see
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS profile_photo_url TEXT;

-- Grant access to sell_requests for admin viewing
CREATE POLICY "Admin can view all requests"
ON public.sell_requests FOR SELECT
USING (true);

CREATE POLICY "Admin can update all requests"
ON public.sell_requests FOR UPDATE
USING (true);

-- Create condition_deductions table for condition-based pricing
CREATE TABLE IF NOT EXISTS public.condition_deductions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL, -- 'Screen', 'Body', 'Battery', 'Keyboard', 'Accessories', etc.
  condition_name TEXT NOT NULL,
  deduction_percent INTEGER NOT NULL DEFAULT 0, -- Negative = bonus (adds to price)
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.condition_deductions ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public can read deductions"
ON public.condition_deductions FOR SELECT
USING (true);

-- Allow authenticated to manage
CREATE POLICY "Authenticated can manage deductions"
ON public.condition_deductions FOR ALL
USING (auth.role() = 'authenticated');

-- Insert default condition deductions
INSERT INTO public.condition_deductions (category, condition_name, deduction_percent) VALUES
-- Screen Condition
('Screen', 'Perfect (No scratches)', 0),
('Screen', 'Minor scratches', 5),
('Screen', 'Visible scratches', 10),
('Screen', 'Cracked/Broken', 30),

-- Body Condition
('Body', 'Like new', 0),
('Body', 'Minor dents/scratches', 5),
('Body', 'Visible dents', 10),
('Body', 'Major damage', 25),

-- Battery Health
('Battery', '90-100%', 0),
('Battery', '80-89%', 5),
('Battery', '70-79%', 10),
('Battery', 'Below 70%', 15),

-- Keyboard
('Keyboard', 'Working perfectly', 0),
('Keyboard', 'Some keys not working', 15),
('Keyboard', 'Not working', 25),

-- Trackpad
('Trackpad', 'Working perfectly', 0),
('Trackpad', 'Click issues', 10),
('Trackpad', 'Not working', 20),

-- Ports
('Ports', 'All working', 0),
('Ports', 'Some not working', 10),
('Ports', 'Most not working', 20),

-- Speakers
('Speakers', 'Working', 0),
('Speakers', 'Distorted sound', 8),
('Speakers', 'Not working', 15),

-- Camera
('Camera', 'Working', 0),
('Camera', 'Not working', 10),

-- WiFi/Bluetooth
('WiFi/Bluetooth', 'Working', 0),
('WiFi/Bluetooth', 'Not working', 15),

-- Accessories (negative = bonus)
('Accessories', 'Original charger included', 0),
('Accessories', 'No charger', 5),
('Accessories', 'Original box included', -2),
('Accessories', 'Apple Pencil included (iPad)', -5),
('Accessories', 'Magic Keyboard included', -8);
