-- UPDATE PRICE ENGINE TO MATCH CASHIFY BASE PRICES (May 2026)
-- These are "Get Upto" prices from Cashify (maximum value for best condition)
-- Our base_price = Cashify's "Get Upto" price (deductions are applied separately)

-- ============ MacBook Models ============

-- MacBook Air Models
UPDATE price_engine SET base_price = 35650 WHERE model_name ILIKE '%MacBook Air%M1%' OR model_name ILIKE '%MacBook Air%2020%';
UPDATE price_engine SET base_price = 48520 WHERE model_name ILIKE '%MacBook Air%M2%2022%' OR model_name ILIKE '%MacBook Air M2%' AND model_name NOT ILIKE '%2023%';
UPDATE price_engine SET base_price = 54350 WHERE model_name ILIKE '%MacBook Air%2023%' OR model_name ILIKE '%MacBook Air%15%';
UPDATE price_engine SET base_price = 70000 WHERE model_name ILIKE '%MacBook Air%2025%' OR model_name ILIKE '%MacBook Air%M4%';

-- MacBook Pro Models
UPDATE price_engine SET base_price = 60000 WHERE model_name ILIKE '%MacBook Pro%2021%' OR model_name ILIKE '%MacBook Pro%M1 Pro%';
UPDATE price_engine SET base_price = 62000 WHERE model_name ILIKE '%MacBook Pro%2022%' OR model_name ILIKE '%MacBook Pro%M2%' AND model_name NOT ILIKE '%2023%';
UPDATE price_engine SET base_price = 70000 WHERE model_name ILIKE '%MacBook Pro%2023%' OR model_name ILIKE '%MacBook Pro%M2 Pro%' OR model_name ILIKE '%MacBook Pro%M2 Max%';
UPDATE price_engine SET base_price = 65000 WHERE model_name ILIKE '%MacBook Pro%2024%' OR model_name ILIKE '%MacBook Pro%M3%';

-- Older MacBook Models (estimated from Cashify patterns)
UPDATE price_engine SET base_price = 25000 WHERE model_name ILIKE '%MacBook Air%2017%' OR model_name ILIKE '%MacBook Air%Mid 2017%';
UPDATE price_engine SET base_price = 20000 WHERE model_name ILIKE '%MacBook Air%2015%';
UPDATE price_engine SET base_price = 30000 WHERE model_name ILIKE '%MacBook Pro%2019%';
UPDATE price_engine SET base_price = 35000 WHERE model_name ILIKE '%MacBook Pro%2020%';

-- ============ iPad Models ============

-- iPad Standard Models
UPDATE price_engine SET base_price = 10000 WHERE model_name ILIKE '%iPad%9.7%2018%' OR model_name ILIKE '%iPad 6%';
UPDATE price_engine SET base_price = 11600 WHERE model_name ILIKE '%iPad%10.2%2019%' OR model_name ILIKE '%iPad 7%' AND model_name ILIKE '%32%';
UPDATE price_engine SET base_price = 12500 WHERE model_name ILIKE '%iPad%10.2%2020%' OR model_name ILIKE '%iPad 8%';
UPDATE price_engine SET base_price = 15400 WHERE model_name ILIKE '%iPad%10.2%2021%' OR model_name ILIKE '%iPad 9%' AND model_name NOT ILIKE '%Pro%';
UPDATE price_engine SET base_price = 16400 WHERE model_name ILIKE '%iPad%10.9%2022%' OR model_name ILIKE '%iPad 10%' AND model_name NOT ILIKE '%Pro%' AND model_name NOT ILIKE '%Air%';
UPDATE price_engine SET base_price = 22550 WHERE model_name ILIKE '%iPad%11%2025%' OR model_name ILIKE '%iPad 11%128%';

-- iPad Air Models
UPDATE price_engine SET base_price = 22000 WHERE model_name ILIKE '%iPad Air%5th%' OR model_name ILIKE '%iPad Air%2022%' OR model_name ILIKE '%iPad Air%M1%';
UPDATE price_engine SET base_price = 30000 WHERE model_name ILIKE '%iPad Air%6th%' OR model_name ILIKE '%iPad Air%2024%' OR model_name ILIKE '%iPad Air%M2%';
UPDATE price_engine SET base_price = 15000 WHERE model_name ILIKE '%iPad Air%4th%' OR model_name ILIKE '%iPad Air%2020%';
UPDATE price_engine SET base_price = 10000 WHERE model_name ILIKE '%iPad Air%3rd%' OR model_name ILIKE '%iPad Air%2019%';

-- iPad Pro Models
UPDATE price_engine SET base_price = 52000 WHERE model_name ILIKE '%iPad Pro%12.9%2022%' OR model_name ILIKE '%iPad Pro%12.9%6th%';
UPDATE price_engine SET base_price = 42000 WHERE model_name ILIKE '%iPad Pro%11%2022%' OR model_name ILIKE '%iPad Pro%11%4th%';
UPDATE price_engine SET base_price = 45000 WHERE model_name ILIKE '%iPad Pro%12.9%2021%' OR model_name ILIKE '%iPad Pro%12.9%5th%';
UPDATE price_engine SET base_price = 38000 WHERE model_name ILIKE '%iPad Pro%11%2021%' OR model_name ILIKE '%iPad Pro%11%3rd%';
UPDATE price_engine SET base_price = 35000 WHERE model_name ILIKE '%iPad Pro%11%2020%' OR model_name ILIKE '%iPad Pro%11%2nd%';
UPDATE price_engine SET base_price = 30000 WHERE model_name ILIKE '%iPad Pro%11%2018%' OR model_name ILIKE '%iPad Pro%11%1st%';
UPDATE price_engine SET base_price = 55000 WHERE model_name ILIKE '%iPad Pro%2024%' OR model_name ILIKE '%iPad Pro%M4%';

-- iPad Mini Models
UPDATE price_engine SET base_price = 25000 WHERE model_name ILIKE '%iPad Mini%6%' OR model_name ILIKE '%iPad Mini%2021%';
UPDATE price_engine SET base_price = 12000 WHERE model_name ILIKE '%iPad Mini%5%' OR model_name ILIKE '%iPad Mini%2019%';
UPDATE price_engine SET base_price = 8000 WHERE model_name ILIKE '%iPad Mini%4%';

-- Verify updated prices
SELECT model_name, device_type, base_price FROM price_engine WHERE is_active = true ORDER BY device_type, base_price DESC;
