-- Photo for each menu item (URL or app-relative path); restaurants already have logo_url.
ALTER TABLE menu_items
    ADD COLUMN image_url VARCHAR(1024);
