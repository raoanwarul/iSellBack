-- COMPREHENSIVE CONDITION DEDUCTIONS UPDATE (ALL FLAT RUPEE AMOUNTS)
-- Table: condition_deductions (id, category, condition_name, value, deduction_type, impact_level)
-- All values in ₹ (rupees), deduction_type = 'FLAT'
-- impact_level: 'MINOR', 'CRITICAL', or 'BONUS'
-- Run in Supabase SQL Editor

-- ===== SCREEN =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Screen' AND condition_name = 'Perfect (No scratches)';
UPDATE condition_deductions SET value = 1500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Screen' AND condition_name = 'Minor scratches';
UPDATE condition_deductions SET value = 4000, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Screen' AND condition_name = 'Visible scratches';
UPDATE condition_deductions SET value = 12000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'Screen' AND condition_name = 'Cracked/Broken';
UPDATE condition_deductions SET value = 18000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'Screen' AND condition_name = 'Display not working';

-- ===== SCREEN LINES =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'ScreenLines' AND condition_name = 'No Lines';
UPDATE condition_deductions SET value = 5000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'ScreenLines' AND condition_name = 'Visible lines on Screen';
UPDATE condition_deductions SET value = 6000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'ScreenLines' AND condition_name = 'Display Flickering';
UPDATE condition_deductions SET value = 4000, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'ScreenLines' AND condition_name = 'Black Dots on Screen';

-- ===== SCREEN SPOTS =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'ScreenSpots' AND condition_name = 'No spots on screen';
UPDATE condition_deductions SET value = 2500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'ScreenSpots' AND condition_name = '1-2 minor spots on screen';
UPDATE condition_deductions SET value = 6000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'ScreenSpots' AND condition_name = 'Large/heavy visible spots on screen';

-- ===== SCREEN DISCOLOURATION =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'ScreenDiscolouration' AND condition_name = 'No Discolouration';
UPDATE condition_deductions SET value = 2500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'ScreenDiscolouration' AND condition_name = 'Minor Discolouration';
UPDATE condition_deductions SET value = 6000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'ScreenDiscolouration' AND condition_name = 'Major Discolouration';

-- ===== BODY =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Body' AND condition_name = 'Like new';
UPDATE condition_deductions SET value = 2000, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Body' AND condition_name = 'Minor dents/scratches';
UPDATE condition_deductions SET value = 4000, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Body' AND condition_name = 'Visible dents';
UPDATE condition_deductions SET value = 7500, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'Body' AND condition_name = 'Major damage';

-- ===== DENT TOP PANEL =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'DentTopPanel' AND condition_name = 'No Dents on top panel';
UPDATE condition_deductions SET value = 1500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'DentTopPanel' AND condition_name = 'Upto 2 Minor Dents';
UPDATE condition_deductions SET value = 3000, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'DentTopPanel' AND condition_name = 'More than 2 Minor Dents';
UPDATE condition_deductions SET value = 6000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'DentTopPanel' AND condition_name = '1 or more Major Dents';

-- ===== DENT BASE PANEL =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'DentBasePanel' AND condition_name = 'No Dents on base panel';
UPDATE condition_deductions SET value = 1500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'DentBasePanel' AND condition_name = 'Upto 2 Minor Dents';
UPDATE condition_deductions SET value = 3000, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'DentBasePanel' AND condition_name = 'More than 2 Minor Dents';
UPDATE condition_deductions SET value = 6000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'DentBasePanel' AND condition_name = '1 or more Major Dents';

-- ===== CRACKED/LOOSE PANEL =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'CrackedLoosePanel' AND condition_name = 'No Cracked or Loose Panel';
UPDATE condition_deductions SET value = 2500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'CrackedLoosePanel' AND condition_name = 'Loose Panel';
UPDATE condition_deductions SET value = 7500, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'CrackedLoosePanel' AND condition_name = 'Crack/Damage Panel';

-- ===== BATTERY =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Battery' AND condition_name = '90-100%';
UPDATE condition_deductions SET value = 2500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Battery' AND condition_name = '80-89%';
UPDATE condition_deductions SET value = 5000, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Battery' AND condition_name = '70-79%';
UPDATE condition_deductions SET value = 8000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'Battery' AND condition_name = 'Below 70%';
UPDATE condition_deductions SET value = 12000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'Battery' AND condition_name = 'Not holding charge';

-- ===== CYCLE COUNT =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'CycleCount' AND condition_name = '0-299 cycles';
UPDATE condition_deductions SET value = 1500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'CycleCount' AND condition_name = '300-499 cycles';
UPDATE condition_deductions SET value = 3500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'CycleCount' AND condition_name = '500-799 cycles';
UPDATE condition_deductions SET value = 6000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'CycleCount' AND condition_name = '800-999 cycles';
UPDATE condition_deductions SET value = 9000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'CycleCount' AND condition_name = '1000+ cycles';

-- ===== KEYBOARD =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Keyboard' AND condition_name = 'Working perfectly';
UPDATE condition_deductions SET value = 1500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Keyboard' AND condition_name = 'Some keys sticky';
UPDATE condition_deductions SET value = 4000, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Keyboard' AND condition_name = 'Some keys not working';
UPDATE condition_deductions SET value = 7500, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'Keyboard' AND condition_name = 'Not working';

-- ===== TRACKPAD =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Trackpad' AND condition_name = 'Working perfectly';
UPDATE condition_deductions SET value = 2500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Trackpad' AND condition_name = 'Click issues';
UPDATE condition_deductions SET value = 6000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'Trackpad' AND condition_name = 'Not working';

-- ===== LOOSE HINGES =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'LooseHinges' AND condition_name = 'No Loose Hinges';
UPDATE condition_deductions SET value = 4000, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'LooseHinges' AND condition_name = 'Yes - Loose Hinges';

-- ===== SPEAKERS =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Speakers' AND condition_name = 'Working';
UPDATE condition_deductions SET value = 2500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Speakers' AND condition_name = 'Distorted sound';
UPDATE condition_deductions SET value = 5000, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Speakers' AND condition_name = 'Not working';

-- ===== CAMERA =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Camera' AND condition_name = 'Working';
UPDATE condition_deductions SET value = 2500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Camera' AND condition_name = 'Blurry/Damaged';
UPDATE condition_deductions SET value = 4000, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Camera' AND condition_name = 'Not working';

-- ===== PORTS =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Ports' AND condition_name = 'All working';
UPDATE condition_deductions SET value = 2500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Ports' AND condition_name = 'Some not working';
UPDATE condition_deductions SET value = 6000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'Ports' AND condition_name = 'Most not working';

-- ===== CHARGING PORT =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'ChargingPort' AND condition_name = 'Working';
UPDATE condition_deductions SET value = 7500, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'ChargingPort' AND condition_name = 'Not working';

-- ===== BLUETOOTH =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Bluetooth' AND condition_name = 'Working';
UPDATE condition_deductions SET value = 3500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Bluetooth' AND condition_name = 'Not working';

-- ===== MICROPHONE =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Microphone' AND condition_name = 'Working';
UPDATE condition_deductions SET value = 2500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Microphone' AND condition_name = 'Not working';

-- ===== HARD DRIVE =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'HardDrive' AND condition_name = 'Working';
UPDATE condition_deductions SET value = 15000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'HardDrive' AND condition_name = 'Missing/Defective';

-- ===== MOTHERBOARD =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Motherboard' AND condition_name = 'Working fine';
UPDATE condition_deductions SET value = 25000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'Motherboard' AND condition_name ILIKE '%auto restart%';

-- ===== DEVICE STATUS =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'DeviceStatus' AND condition_name = 'Device turns on';
UPDATE condition_deductions SET value = 30000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'DeviceStatus' AND condition_name = 'Device not turning on';

-- ===== TOUCH ID =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'TouchID' AND condition_name = 'Working';
UPDATE condition_deductions SET value = 2500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'TouchID' AND condition_name = 'Not working';

-- ===== FACE ID =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'FaceID' AND condition_name = 'Working';
UPDATE condition_deductions SET value = 3500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'FaceID' AND condition_name = 'Not working';

-- ===== CELLULAR =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Cellular' AND condition_name = 'WiFi Only';
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Cellular' AND condition_name = 'WiFi + Cellular (Working)';
UPDATE condition_deductions SET value = 4000, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Cellular' AND condition_name = 'WiFi + Cellular (Not Working)';

-- ===== APPLE PENCIL =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'ApplePencil';

-- ===== ACCESSORIES (negative = bonus/add to price) =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Accessories' AND condition_name = 'Original Charger included';
UPDATE condition_deductions SET value = 1500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Accessories' AND condition_name = 'No charger';
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Accessories' AND condition_name = 'Original Box included';
UPDATE condition_deductions SET value = -2000, deduction_type = 'FLAT', impact_level = 'BONUS' WHERE category = 'Accessories' AND condition_name = 'Apple Pencil 1st Gen included';
UPDATE condition_deductions SET value = -4000, deduction_type = 'FLAT', impact_level = 'BONUS' WHERE category = 'Accessories' AND condition_name = 'Apple Pencil 2nd Gen included';
UPDATE condition_deductions SET value = -5000, deduction_type = 'FLAT', impact_level = 'BONUS' WHERE category = 'Accessories' AND condition_name = 'Apple Pencil Pro included';
UPDATE condition_deductions SET value = -6000, deduction_type = 'FLAT', impact_level = 'BONUS' WHERE category = 'Accessories' AND condition_name = 'Magic Keyboard included';
UPDATE condition_deductions SET value = -4000, deduction_type = 'FLAT', impact_level = 'BONUS' WHERE category = 'Accessories' AND condition_name = 'Smart Keyboard Folio included';

-- ===== REPAIR ISSUES =====
UPDATE condition_deductions SET value = 12000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'RepairIssues' AND condition_name = 'Screen replacement needed';
UPDATE condition_deductions SET value = 7500, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'RepairIssues' AND condition_name = 'Keyboard repair needed';
UPDATE condition_deductions SET value = 6000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'RepairIssues' AND condition_name = 'Battery replacement needed';
UPDATE condition_deductions SET value = 5000, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'RepairIssues' AND condition_name = 'Trackpad repair needed';
UPDATE condition_deductions SET value = 4000, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'RepairIssues' AND condition_name = 'Hinge replacement needed';
UPDATE condition_deductions SET value = 3500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'RepairIssues' AND condition_name = 'Speaker repair needed';
UPDATE condition_deductions SET value = 4000, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'RepairIssues' AND condition_name = 'Camera repair needed';
UPDATE condition_deductions SET value = 7500, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'RepairIssues' AND condition_name = 'Charging port repair needed';
UPDATE condition_deductions SET value = 2500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'RepairIssues' AND condition_name = 'Microphone repair needed';
UPDATE condition_deductions SET value = 5000, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'RepairIssues' AND condition_name = 'Ports (USB-C) repair needed';
UPDATE condition_deductions SET value = 3500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'RepairIssues' AND condition_name = 'WiFi/Bluetooth repair needed';
UPDATE condition_deductions SET value = 2500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'RepairIssues' AND condition_name = 'Touch ID / Face ID not working';
UPDATE condition_deductions SET value = 17000, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'RepairIssues' AND condition_name = 'Liquid damage signs';
UPDATE condition_deductions SET value = 5000, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'RepairIssues' AND condition_name = 'Body dent repair';
UPDATE condition_deductions SET value = 7500, deduction_type = 'FLAT', impact_level = 'CRITICAL' WHERE category = 'RepairIssues' AND condition_name = 'Back panel replacement';
UPDATE condition_deductions SET value = 2500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'RepairIssues' AND condition_name = 'Power button repair';
UPDATE condition_deductions SET value = 2500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'RepairIssues' AND condition_name = 'Volume button repair';

-- ===== WiFi/Bluetooth standalone =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'WiFi/Bluetooth' AND condition_name = 'Working';
UPDATE condition_deductions SET value = 3500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'WiFi/Bluetooth' AND condition_name = 'Not working';

-- ===== WiFi standalone =====
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'WiFi' AND condition_name = 'Working';
UPDATE condition_deductions SET value = 3500, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'WiFi' AND condition_name = 'Not working';

-- ===== WARRANTY (BONUS for longer warranty) =====
UPDATE condition_deductions SET value = -3000, deduction_type = 'FLAT', impact_level = 'BONUS' WHERE category = 'Warranty' AND condition_name = 'Apple Care+ (12+ Months)';
UPDATE condition_deductions SET value = -2000, deduction_type = 'FLAT', impact_level = 'BONUS' WHERE category = 'Warranty' AND condition_name = '6-11 Months Remaining';
UPDATE condition_deductions SET value = -1000, deduction_type = 'FLAT', impact_level = 'BONUS' WHERE category = 'Warranty' AND condition_name = '3-6 Months Remaining';
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Warranty' AND condition_name = '0-3 Months Remaining';
UPDATE condition_deductions SET value = 0, deduction_type = 'FLAT', impact_level = 'MINOR' WHERE category = 'Warranty' AND condition_name = 'Out of Warranty / No Bill';

-- ===== UPDATE price_engine deduction columns (proportional to base_price) =====
UPDATE price_engine SET 
  deduction_screen_issue = ROUND(base_price * 0.20),
  deduction_body_issue = ROUND(base_price * 0.10),
  deduction_battery_issue = ROUND(base_price * 0.12),
  deduction_keyboard_issue = ROUND(base_price * 0.10),
  deduction_no_charger = ROUND(base_price * 0.03),
  deduction_no_box = ROUND(base_price * 0.02)
WHERE is_active = true;
