
-- Fix inconsistent set_codes: normalize JPN-6 to japan-6 and JPN-12 to japan-12, SM-12 to scotch-12
UPDATE whisky_sets 
SET set_code = 'japan-6' 
WHERE set_code = 'JPN-6';

UPDATE whisky_sets 
SET set_code = 'japan-12' 
WHERE set_code = 'JPN-12';

UPDATE whisky_sets 
SET set_code = 'scotch-12' 
WHERE set_code = 'SM-12';
