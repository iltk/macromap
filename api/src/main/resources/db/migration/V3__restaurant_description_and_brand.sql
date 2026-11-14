-- Short tagline for the restaurant directory and a brand colour for logo tiles.
ALTER TABLE restaurants
    ADD COLUMN description VARCHAR(512),
    ADD COLUMN brand_color VARCHAR(16);
