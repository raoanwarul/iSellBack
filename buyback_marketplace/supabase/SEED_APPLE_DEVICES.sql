-- =============================================================================
-- BuyBack Marketplace — Apple Device Catalog Seed
-- =============================================================================
-- Run after SCHEMA.sql + RLS_POLICIES.sql
-- Populates device_categories, device_models, device_variants for Apple devices
-- =============================================================================

-- =============================================================================
-- 1. CATEGORIES
-- =============================================================================

INSERT INTO public.device_categories (id, brand, category, display_order, is_active) VALUES
    ('11111111-1111-1111-1111-111111111111', 'Apple', 'MacBook', 1, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'Apple', 'iPad', 2, TRUE)
ON CONFLICT (brand, category) DO NOTHING;

-- =============================================================================
-- 2. MACBOOK MODELS
-- =============================================================================

INSERT INTO public.device_models (category_id, model_name, model_year, chip, screen_size, display_order, is_active) VALUES
    -- MacBook Air
    ('11111111-1111-1111-1111-111111111111', 'MacBook Air M3', 2024, 'M3', 13.6, 1, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Air M3 15"', 2024, 'M3', 15.3, 2, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Air M2', 2022, 'M2', 13.6, 3, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Air M2 15"', 2023, 'M2', 15.3, 4, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Air M1', 2020, 'M1', 13.3, 5, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Air Intel', 2020, 'Intel i3/i5/i7', 13.3, 6, TRUE),
    -- MacBook Pro
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro 14" M3', 2023, 'M3/M3 Pro/M3 Max', 14.2, 7, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro 16" M3', 2023, 'M3 Pro/M3 Max', 16.2, 8, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro 14" M2', 2023, 'M2 Pro/M2 Max', 14.2, 9, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro 16" M2', 2023, 'M2 Pro/M2 Max', 16.2, 10, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro 14" M1', 2021, 'M1 Pro/M1 Max', 14.2, 11, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro 16" M1', 2021, 'M1 Pro/M1 Max', 16.2, 12, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro 13" M2', 2022, 'M2', 13.3, 13, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro 13" M1', 2020, 'M1', 13.3, 14, TRUE),
    ('11111111-1111-1111-1111-111111111111', 'MacBook Pro Intel', 2019, 'Intel i5/i7/i9', 13.3, 15, TRUE)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 3. IPAD MODELS
-- =============================================================================

INSERT INTO public.device_models (category_id, model_name, model_year, chip, screen_size, display_order, is_active) VALUES
    -- iPad Pro
    ('22222222-2222-2222-2222-222222222222', 'iPad Pro 13" M4', 2024, 'M4', 13.0, 1, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Pro 11" M4', 2024, 'M4', 11.0, 2, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Pro 12.9" M2', 2022, 'M2', 12.9, 3, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Pro 11" M2', 2022, 'M2', 11.0, 4, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Pro 12.9" M1', 2021, 'M1', 12.9, 5, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Pro 11" M1', 2021, 'M1', 11.0, 6, TRUE),
    -- iPad Air
    ('22222222-2222-2222-2222-222222222222', 'iPad Air 13" M2', 2024, 'M2', 13.0, 7, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Air 11" M2', 2024, 'M2', 11.0, 8, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Air M1', 2022, 'M1', 10.9, 9, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Air 4', 2020, 'A14 Bionic', 10.9, 10, TRUE),
    -- iPad
    ('22222222-2222-2222-2222-222222222222', 'iPad 10th Gen', 2022, 'A14 Bionic', 10.9, 11, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad 9th Gen', 2021, 'A13 Bionic', 10.2, 12, TRUE),
    -- iPad Mini
    ('22222222-2222-2222-2222-222222222222', 'iPad Mini 7 (A17 Pro)', 2024, 'A17 Pro', 8.3, 13, TRUE),
    ('22222222-2222-2222-2222-222222222222', 'iPad Mini 6', 2021, 'A15 Bionic', 8.3, 14, TRUE)
ON CONFLICT DO NOTHING;

-- =============================================================================
-- 4. DEVICE VARIANTS
-- =============================================================================
-- Common storage/RAM combinations with platform-suggested base prices
-- These are GUIDES — each business can override in business_variant_prices

-- MacBook Air M3 variants
INSERT INTO public.device_variants (model_id, storage, ram, platform_base_price, is_active)
SELECT id, '256GB', '8GB', 85000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M3' AND model_year = 2024
UNION ALL
SELECT id, '512GB', '16GB', 110000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M3' AND model_year = 2024
UNION ALL
SELECT id, '1TB', '16GB', 130000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M3' AND model_year = 2024
ON CONFLICT DO NOTHING;

-- MacBook Air M2 variants
INSERT INTO public.device_variants (model_id, storage, ram, platform_base_price, is_active)
SELECT id, '256GB', '8GB', 65000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M2'
UNION ALL
SELECT id, '512GB', '16GB', 85000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M2'
UNION ALL
SELECT id, '1TB', '16GB', 100000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M2'
ON CONFLICT DO NOTHING;

-- MacBook Air M1 variants
INSERT INTO public.device_variants (model_id, storage, ram, platform_base_price, is_active)
SELECT id, '256GB', '8GB', 45000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M1'
UNION ALL
SELECT id, '512GB', '8GB', 55000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M1'
UNION ALL
SELECT id, '512GB', '16GB', 65000, TRUE FROM public.device_models WHERE model_name = 'MacBook Air M1'
ON CONFLICT DO NOTHING;

-- MacBook Pro 14" M3 variants
INSERT INTO public.device_variants (model_id, storage, ram, platform_base_price, is_active)
SELECT id, '512GB', '16GB', 150000, TRUE FROM public.device_models WHERE model_name = 'MacBook Pro 14" M3'
UNION ALL
SELECT id, '1TB', '18GB', 185000, TRUE FROM public.device_models WHERE model_name = 'MacBook Pro 14" M3'
UNION ALL
SELECT id, '1TB', '36GB', 225000, TRUE FROM public.device_models WHERE model_name = 'MacBook Pro 14" M3'
ON CONFLICT DO NOTHING;

-- iPad Pro 11" M4 variants
INSERT INTO public.device_variants (model_id, storage, ram, platform_base_price, is_active)
SELECT id, '256GB', '8GB', 85000, TRUE FROM public.device_models WHERE model_name = 'iPad Pro 11" M4'
UNION ALL
SELECT id, '512GB', '8GB', 100000, TRUE FROM public.device_models WHERE model_name = 'iPad Pro 11" M4'
UNION ALL
SELECT id, '1TB', '16GB', 130000, TRUE FROM public.device_models WHERE model_name = 'iPad Pro 11" M4'
UNION ALL
SELECT id, '2TB', '16GB', 160000, TRUE FROM public.device_models WHERE model_name = 'iPad Pro 11" M4'
ON CONFLICT DO NOTHING;

-- iPad Air 11" M2 variants
INSERT INTO public.device_variants (model_id, storage, ram, platform_base_price, is_active)
SELECT id, '128GB', '8GB', 52000, TRUE FROM public.device_models WHERE model_name = 'iPad Air 11" M2'
UNION ALL
SELECT id, '256GB', '8GB', 60000, TRUE FROM public.device_models WHERE model_name = 'iPad Air 11" M2'
UNION ALL
SELECT id, '512GB', '8GB', 75000, TRUE FROM public.device_models WHERE model_name = 'iPad Air 11" M2'
UNION ALL
SELECT id, '1TB', '8GB', 90000, TRUE FROM public.device_models WHERE model_name = 'iPad Air 11" M2'
ON CONFLICT DO NOTHING;

-- iPad Mini 7 variants
INSERT INTO public.device_variants (model_id, storage, ram, platform_base_price, is_active)
SELECT id, '128GB', '8GB', 40000, TRUE FROM public.device_models WHERE model_name = 'iPad Mini 7 (A17 Pro)'
UNION ALL
SELECT id, '256GB', '8GB', 48000, TRUE FROM public.device_models WHERE model_name = 'iPad Mini 7 (A17 Pro)'
UNION ALL
SELECT id, '512GB', '8GB', 60000, TRUE FROM public.device_models WHERE model_name = 'iPad Mini 7 (A17 Pro)'
ON CONFLICT DO NOTHING;

-- NOTE: Add remaining model variants as needed. This is a starter seed.
-- Full variant list can be extended per business or via admin panel later.

-- =============================================================================
-- END OF SEED
-- =============================================================================
