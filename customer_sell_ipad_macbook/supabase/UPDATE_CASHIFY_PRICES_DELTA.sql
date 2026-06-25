-- ============================================================
-- CASHIFY-ALIGNED BUY-BACK PRICE UPDATE (DELTA)
-- ============================================================
-- Run this once on Supabase SQL editor to bring an EXISTING
-- database in line with the new realistic Cashify-style buy-back
-- rates. Future fresh installs from UNIVERSAL_DATABASE_SETUP.sql
-- already include these values.
--
-- Pricing reflects "excellent condition + all accessories"
-- buy-back amounts (NOT retail / refurb resale prices).
-- ============================================================

BEGIN;

-- =====================================================
-- 1) price_engine  (model-level base prices)
-- =====================================================

-- MacBook
UPDATE public.price_engine SET base_price =  32000 WHERE model_name = 'MacBook Air M1 (2020)';
UPDATE public.price_engine SET base_price =  48000 WHERE model_name = 'MacBook Air M2 (2022)';
UPDATE public.price_engine SET base_price =  68000 WHERE model_name = 'MacBook Air M3 (2024)';
UPDATE public.price_engine SET base_price =  40000 WHERE model_name = 'MacBook Pro 13" M1 (2020)';
UPDATE public.price_engine SET base_price =  55000 WHERE model_name = 'MacBook Pro 13" M2 (2022)';
UPDATE public.price_engine SET base_price =  78000 WHERE model_name = 'MacBook Pro 14" M1 Pro (2021)';
UPDATE public.price_engine SET base_price =  95000 WHERE model_name = 'MacBook Pro 14" M2 Pro (2023)';
UPDATE public.price_engine SET base_price =  85000 WHERE model_name = 'MacBook Pro 14" M3 (2023)';
UPDATE public.price_engine SET base_price = 110000 WHERE model_name = 'MacBook Pro 14" M3 Pro (2023)';
UPDATE public.price_engine SET base_price = 140000 WHERE model_name = 'MacBook Pro 14" M3 Max (2023)';
UPDATE public.price_engine SET base_price =  92000 WHERE model_name = 'MacBook Pro 16" M1 Pro (2021)';
UPDATE public.price_engine SET base_price = 115000 WHERE model_name = 'MacBook Pro 16" M2 Pro (2023)';
UPDATE public.price_engine SET base_price = 125000 WHERE model_name = 'MacBook Pro 16" M3 Pro (2023)';
UPDATE public.price_engine SET base_price = 160000 WHERE model_name = 'MacBook Pro 16" M3 Max (2023)';

-- iPad
UPDATE public.price_engine SET base_price = 13500 WHERE model_name = 'iPad 9th Gen (2021)';
UPDATE public.price_engine SET base_price = 21000 WHERE model_name = 'iPad 10th Gen (2022)';
UPDATE public.price_engine SET base_price = 24000 WHERE model_name = 'iPad Air 4th Gen (2020)';
UPDATE public.price_engine SET base_price = 33000 WHERE model_name = 'iPad Air 5th Gen M1 (2022)';
UPDATE public.price_engine SET base_price = 42000 WHERE model_name = 'iPad Air 6th Gen M2 (2024)';
UPDATE public.price_engine SET base_price = 26000 WHERE model_name = 'iPad Mini 6th Gen (2021)';
UPDATE public.price_engine SET base_price = 40000 WHERE model_name = 'iPad Pro 11" M1 (2021)';
UPDATE public.price_engine SET base_price = 48000 WHERE model_name = 'iPad Pro 11" M2 (2022)';
UPDATE public.price_engine SET base_price = 62000 WHERE model_name = 'iPad Pro 11" M4 (2024)';
UPDATE public.price_engine SET base_price = 52000 WHERE model_name = 'iPad Pro 12.9" M1 (2021)';
UPDATE public.price_engine SET base_price = 65000 WHERE model_name = 'iPad Pro 12.9" M2 (2022)';
UPDATE public.price_engine SET base_price = 78000 WHERE model_name = 'iPad Pro 13" M4 (2024)';


-- =====================================================
-- 2) device_prices  (storage-variant base prices)
-- =====================================================

-- MacBook
UPDATE public.device_prices SET base_price =  35000 WHERE device_type = 'MacBook' AND model = 'MacBook Air M1'         AND storage = '256GB';
UPDATE public.device_prices SET base_price =  42000 WHERE device_type = 'MacBook' AND model = 'MacBook Air M1'         AND storage = '512GB';
UPDATE public.device_prices SET base_price =  48000 WHERE device_type = 'MacBook' AND model = 'MacBook Air M2'         AND storage = '256GB';
UPDATE public.device_prices SET base_price =  55000 WHERE device_type = 'MacBook' AND model = 'MacBook Air M2'         AND storage = '512GB';
UPDATE public.device_prices SET base_price =  65000 WHERE device_type = 'MacBook' AND model = 'MacBook Air M3'         AND storage = '256GB';
UPDATE public.device_prices SET base_price =  72000 WHERE device_type = 'MacBook' AND model = 'MacBook Air M3'         AND storage = '512GB';
UPDATE public.device_prices SET base_price =  82000 WHERE device_type = 'MacBook' AND model = 'MacBook Air M3'         AND storage = '1TB';
UPDATE public.device_prices SET base_price =  42000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 13" M1'     AND storage = '256GB';
UPDATE public.device_prices SET base_price =  50000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 13" M1'     AND storage = '512GB';
UPDATE public.device_prices SET base_price =  55000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 13" M2'     AND storage = '256GB';
UPDATE public.device_prices SET base_price =  62000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 13" M2'     AND storage = '512GB';
UPDATE public.device_prices SET base_price =  78000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 14" M1 Pro' AND storage = '512GB';
UPDATE public.device_prices SET base_price =  88000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 14" M1 Pro' AND storage = '1TB';
UPDATE public.device_prices SET base_price =  95000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 14" M2 Pro' AND storage = '512GB';
UPDATE public.device_prices SET base_price = 108000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 14" M2 Pro' AND storage = '1TB';
UPDATE public.device_prices SET base_price =  88000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 14" M3'     AND storage = '512GB';
UPDATE public.device_prices SET base_price = 100000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 14" M3'     AND storage = '1TB';
UPDATE public.device_prices SET base_price = 110000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 14" M3 Pro' AND storage = '512GB';
UPDATE public.device_prices SET base_price = 122000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 14" M3 Pro' AND storage = '1TB';
UPDATE public.device_prices SET base_price = 150000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 14" M3 Max' AND storage = '1TB';
UPDATE public.device_prices SET base_price = 170000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 14" M3 Max' AND storage = '2TB';
UPDATE public.device_prices SET base_price =  95000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 16" M1 Pro' AND storage = '512GB';
UPDATE public.device_prices SET base_price = 108000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 16" M1 Pro' AND storage = '1TB';
UPDATE public.device_prices SET base_price = 125000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 16" M2 Pro' AND storage = '512GB';
UPDATE public.device_prices SET base_price = 138000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 16" M2 Pro' AND storage = '1TB';
UPDATE public.device_prices SET base_price = 140000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 16" M3 Pro' AND storage = '512GB';
UPDATE public.device_prices SET base_price = 152000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 16" M3 Pro' AND storage = '1TB';
UPDATE public.device_prices SET base_price = 170000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 16" M3 Max' AND storage = '1TB';
UPDATE public.device_prices SET base_price = 195000 WHERE device_type = 'MacBook' AND model = 'MacBook Pro 16" M3 Max' AND storage = '2TB';

-- iPad
UPDATE public.device_prices SET base_price =  12000 WHERE device_type = 'iPad' AND model = 'iPad 9th Gen'        AND storage = '64GB';
UPDATE public.device_prices SET base_price =  15000 WHERE device_type = 'iPad' AND model = 'iPad 9th Gen'        AND storage = '256GB';
UPDATE public.device_prices SET base_price =  18000 WHERE device_type = 'iPad' AND model = 'iPad 10th Gen'       AND storage = '64GB';
UPDATE public.device_prices SET base_price =  22000 WHERE device_type = 'iPad' AND model = 'iPad 10th Gen'       AND storage = '256GB';
UPDATE public.device_prices SET base_price =  30000 WHERE device_type = 'iPad' AND model = 'iPad Air M1'         AND storage = '64GB';
UPDATE public.device_prices SET base_price =  35000 WHERE device_type = 'iPad' AND model = 'iPad Air M1'         AND storage = '256GB';
UPDATE public.device_prices SET base_price =  40000 WHERE device_type = 'iPad' AND model = 'iPad Air M2'         AND storage = '128GB';
UPDATE public.device_prices SET base_price =  46000 WHERE device_type = 'iPad' AND model = 'iPad Air M2'         AND storage = '256GB';
UPDATE public.device_prices SET base_price =  54000 WHERE device_type = 'iPad' AND model = 'iPad Air M2'         AND storage = '512GB';
UPDATE public.device_prices SET base_price =  62000 WHERE device_type = 'iPad' AND model = 'iPad Air M2'         AND storage = '1TB';
UPDATE public.device_prices SET base_price =  26000 WHERE device_type = 'iPad' AND model = 'iPad Mini 6'         AND storage = '64GB';
UPDATE public.device_prices SET base_price =  31000 WHERE device_type = 'iPad' AND model = 'iPad Mini 6'         AND storage = '256GB';
UPDATE public.device_prices SET base_price =  38000 WHERE device_type = 'iPad' AND model = 'iPad Pro 11" M1'     AND storage = '128GB';
UPDATE public.device_prices SET base_price =  44000 WHERE device_type = 'iPad' AND model = 'iPad Pro 11" M1'     AND storage = '256GB';
UPDATE public.device_prices SET base_price =  52000 WHERE device_type = 'iPad' AND model = 'iPad Pro 11" M1'     AND storage = '512GB';
UPDATE public.device_prices SET base_price =  45000 WHERE device_type = 'iPad' AND model = 'iPad Pro 11" M2'     AND storage = '128GB';
UPDATE public.device_prices SET base_price =  52000 WHERE device_type = 'iPad' AND model = 'iPad Pro 11" M2'     AND storage = '256GB';
UPDATE public.device_prices SET base_price =  62000 WHERE device_type = 'iPad' AND model = 'iPad Pro 11" M2'     AND storage = '512GB';
UPDATE public.device_prices SET base_price =  58000 WHERE device_type = 'iPad' AND model = 'iPad Pro 11" M4'     AND storage = '256GB';
UPDATE public.device_prices SET base_price =  68000 WHERE device_type = 'iPad' AND model = 'iPad Pro 11" M4'     AND storage = '512GB';
UPDATE public.device_prices SET base_price =  80000 WHERE device_type = 'iPad' AND model = 'iPad Pro 11" M4'     AND storage = '1TB';
UPDATE public.device_prices SET base_price =  48000 WHERE device_type = 'iPad' AND model = 'iPad Pro 12.9" M1'   AND storage = '128GB';
UPDATE public.device_prices SET base_price =  55000 WHERE device_type = 'iPad' AND model = 'iPad Pro 12.9" M1'   AND storage = '256GB';
UPDATE public.device_prices SET base_price =  65000 WHERE device_type = 'iPad' AND model = 'iPad Pro 12.9" M1'   AND storage = '512GB';
UPDATE public.device_prices SET base_price =  58000 WHERE device_type = 'iPad' AND model = 'iPad Pro 12.9" M2'   AND storage = '128GB';
UPDATE public.device_prices SET base_price =  66000 WHERE device_type = 'iPad' AND model = 'iPad Pro 12.9" M2'   AND storage = '256GB';
UPDATE public.device_prices SET base_price =  78000 WHERE device_type = 'iPad' AND model = 'iPad Pro 12.9" M2'   AND storage = '512GB';
UPDATE public.device_prices SET base_price =  92000 WHERE device_type = 'iPad' AND model = 'iPad Pro 12.9" M2'   AND storage = '1TB';
UPDATE public.device_prices SET base_price =  75000 WHERE device_type = 'iPad' AND model = 'iPad Pro 13" M4'     AND storage = '256GB';
UPDATE public.device_prices SET base_price =  88000 WHERE device_type = 'iPad' AND model = 'iPad Pro 13" M4'     AND storage = '512GB';
UPDATE public.device_prices SET base_price = 102000 WHERE device_type = 'iPad' AND model = 'iPad Pro 13" M4'     AND storage = '1TB';
UPDATE public.device_prices SET base_price = 120000 WHERE device_type = 'iPad' AND model = 'iPad Pro 13" M4'     AND storage = '2TB';

COMMIT;

-- Quick sanity check after running:
--   SELECT model_name, base_price FROM public.price_engine ORDER BY device_type, base_price;
--   SELECT device_type, model, storage, base_price FROM public.device_prices ORDER BY device_type, base_price;
