package ca.macromap.api.suggest;

import ca.macromap.api.entity.MenuItem;

import java.util.Locale;
import java.util.regex.Pattern;

/** Which meal the suggestions are for, so a burger isn't the top pick at 8 am. */
public enum MealTime {
    BREAKFAST, LUNCH, DINNER, SNACK;

    private static final Pattern BREAKFAST_SECTION = Pattern.compile("breakfast|morning|bakery|baked|coffee|beverage|drink", Pattern.CASE_INSENSITIVE);
    private static final Pattern BREAKFAST_NAME = Pattern.compile(
            "egg|bacon &|sausage &|hash ?brown|pancake|waffle|muffin|bagel|croissant|oat|porridge|breakfast|coffee|latte|timbits|donut",
            Pattern.CASE_INSENSITIVE);

    public static MealTime parse(String s) {
        if (s == null || s.isBlank()) return null;
        try {
            return valueOf(s.strip().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return null;
        }
    }

    static boolean breakfasty(MenuItem m) {
        String section = m.getMenuCategory() == null ? "" : m.getMenuCategory();
        return BREAKFAST_SECTION.matcher(section).find() || BREAKFAST_NAME.matcher(m.getName()).find();
    }

    /** Multiplier for an item's score at this time of day (1 = neutral). */
    double fit(MenuItem m) {
        boolean b = breakfasty(m);
        return switch (this) {
            case BREAKFAST -> b ? 1.15 : 0.6;
            case LUNCH, DINNER -> b ? 0.55 : 1.0;
            case SNACK -> 1.0;
        };
    }
}
