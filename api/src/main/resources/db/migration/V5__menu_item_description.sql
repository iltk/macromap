-- Short description shown on menu cards (e.g. "Cheeseburger topped with crispy bacon").
ALTER TABLE menu_items
    ADD COLUMN description TEXT;
