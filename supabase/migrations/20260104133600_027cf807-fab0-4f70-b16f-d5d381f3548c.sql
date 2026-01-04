-- Insert sample community tasting notes for testing the Spotify Wrapped comparison feature
-- These use fake user_ids that won't conflict with real users

-- Sample notes for whisky: 467b4fb3-3437-425c-9187-9ab6d2c0d12c (the one you just reviewed)
INSERT INTO tasting_notes (user_id, whisky_id, rating, flavors, intensity_ratings, note) VALUES
  ('11111111-1111-1111-1111-111111111111', '467b4fb3-3437-425c-9187-9ab6d2c0d12c', 4, ARRAY['honey', 'vanilla', 'oak'], '{"smoke": 2, "fruit": 4, "floral": 3, "spice": 2, "oak": 4}', 'Lovely smooth finish'),
  ('22222222-2222-2222-2222-222222222222', '467b4fb3-3437-425c-9187-9ab6d2c0d12c', 5, ARRAY['peat', 'chocolate', 'honey'], '{"smoke": 3, "fruit": 3, "floral": 2, "spice": 3, "oak": 3}', 'Complex and delightful'),
  ('33333333-3333-3333-3333-333333333333', '467b4fb3-3437-425c-9187-9ab6d2c0d12c', 4, ARRAY['honey', 'malt', 'dried_fruit'], '{"smoke": 1, "fruit": 5, "floral": 4, "spice": 2, "oak": 2}', 'Fruity and fresh'),
  ('44444444-4444-4444-4444-444444444444', '467b4fb3-3437-425c-9187-9ab6d2c0d12c', 3, ARRAY['smoke', 'peat', 'pepper'], '{"smoke": 4, "fruit": 2, "floral": 1, "spice": 4, "oak": 3}', 'Too smoky for me'),
  ('55555555-5555-5555-5555-555555555555', '467b4fb3-3437-425c-9187-9ab6d2c0d12c', 5, ARRAY['chocolate', 'honey', 'vanilla'], '{"smoke": 2, "fruit": 4, "floral": 3, "spice": 2, "oak": 4}', 'Absolutely fantastic');

-- Sample notes for other whiskies in the user's tasting box
INSERT INTO tasting_notes (user_id, whisky_id, rating, flavors, intensity_ratings, note) VALUES
  -- Ardbeg 10
  ('11111111-1111-1111-1111-111111111111', '01e17c24-e1c1-4353-9984-68dd27a2d3e2', 5, ARRAY['peat', 'smoke', 'citrus'], '{"smoke": 5, "fruit": 2, "floral": 1, "spice": 3, "oak": 3}', 'Intense peat lover paradise'),
  ('22222222-2222-2222-2222-222222222222', '01e17c24-e1c1-4353-9984-68dd27a2d3e2', 4, ARRAY['smoke', 'vanilla', 'malt'], '{"smoke": 4, "fruit": 3, "floral": 2, "spice": 2, "oak": 4}', 'Great balance'),
  ('33333333-3333-3333-3333-333333333333', '01e17c24-e1c1-4353-9984-68dd27a2d3e2', 3, ARRAY['peat', 'brine'], '{"smoke": 5, "fruit": 1, "floral": 1, "spice": 2, "oak": 2}', 'Too peaty'),
  
  -- Macallan Sherry Oak 12
  ('11111111-1111-1111-1111-111111111111', '5e4589d5-2ee4-4dd6-b501-191ecb40e2f3', 5, ARRAY['dried_fruit', 'sherry', 'oak'], '{"smoke": 0, "fruit": 5, "floral": 2, "spice": 3, "oak": 5}', 'Classic sherry bomb'),
  ('22222222-2222-2222-2222-222222222222', '5e4589d5-2ee4-4dd6-b501-191ecb40e2f3', 4, ARRAY['vanilla', 'caramel', 'oak'], '{"smoke": 1, "fruit": 4, "floral": 3, "spice": 2, "oak": 4}', 'Rich and warming'),
  ('33333333-3333-3333-3333-333333333333', '5e4589d5-2ee4-4dd6-b501-191ecb40e2f3', 5, ARRAY['honey', 'sherry', 'chocolate'], '{"smoke": 0, "fruit": 5, "floral": 2, "spice": 3, "oak": 4}', 'Dessert in a glass'),
  
  -- Glenfiddich 12
  ('11111111-1111-1111-1111-111111111111', '0f17de7d-81ed-480f-826c-90d9d7394f26', 4, ARRAY['pear', 'apple', 'malt'], '{"smoke": 0, "fruit": 4, "floral": 4, "spice": 2, "oak": 2}', 'Light and approachable'),
  ('22222222-2222-2222-2222-222222222222', '0f17de7d-81ed-480f-826c-90d9d7394f26', 3, ARRAY['vanilla', 'honey'], '{"smoke": 0, "fruit": 3, "floral": 3, "spice": 1, "oak": 3}', 'Good starter whisky'),
  ('33333333-3333-3333-3333-333333333333', '0f17de7d-81ed-480f-826c-90d9d7394f26', 4, ARRAY['citrus', 'floral', 'malt'], '{"smoke": 0, "fruit": 4, "floral": 5, "spice": 2, "oak": 2}', 'Fresh and floral'),
  
  -- Laphroaig 10
  ('11111111-1111-1111-1111-111111111111', '9da4e888-b337-4e3c-bbac-f5438de22080', 5, ARRAY['peat', 'iodine', 'smoke'], '{"smoke": 5, "fruit": 1, "floral": 0, "spice": 3, "oak": 3}', 'Medicinal magic'),
  ('22222222-2222-2222-2222-222222222222', '9da4e888-b337-4e3c-bbac-f5438de22080', 4, ARRAY['smoke', 'brine', 'seaweed'], '{"smoke": 5, "fruit": 2, "floral": 1, "spice": 2, "oak": 3}', 'Coastal campfire'),
  ('33333333-3333-3333-3333-333333333333', '9da4e888-b337-4e3c-bbac-f5438de22080', 2, ARRAY['peat', 'medicinal'], '{"smoke": 5, "fruit": 1, "floral": 0, "spice": 2, "oak": 2}', 'Not for me');
