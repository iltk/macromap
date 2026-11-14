-- 2 decimal places (~1.1 km) is too coarse for pins; 6 decimals is ~10 cm.
ALTER TABLE restaurant_locations
    ALTER COLUMN latitude  TYPE NUMERIC(9, 6),
    ALTER COLUMN longitude TYPE NUMERIC(9, 6);

ALTER TABLE restaurant_locations
    ADD COLUMN osm_id        BIGINT UNIQUE,
    ADD COLUMN phone         VARCHAR(64),
    ADD COLUMN opening_hours TEXT,
    ADD COLUMN city          VARCHAR(255);

ALTER TABLE restaurants
    ADD COLUMN website  VARCHAR(512),
    ADD COLUMN logo_url VARCHAR(512);

-- Case-insensitive search on names
CREATE INDEX idx_restaurants_name_lower ON restaurants (LOWER(name));
CREATE INDEX idx_menu_items_name_lower ON menu_items (LOWER(name));
