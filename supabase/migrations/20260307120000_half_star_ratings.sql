-- Support half-star ratings (0.5 increments: 0.5, 1.0, 1.5, ..., 5.0)
-- Previously integer, now numeric(2,1) to allow one decimal place
ALTER TABLE tasting_notes ALTER COLUMN rating TYPE numeric(2,1);
