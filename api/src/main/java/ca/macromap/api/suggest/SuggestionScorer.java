package ca.macromap.api.suggest;

import ca.macromap.api.entity.MenuItem;

import java.math.BigDecimal;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Pure scoring rules for suggestions (no Spring, no database) so they're easy to test.
 *
 * <p>An item or combo is eligible when it has calories, its numbers are trustworthy, it avoids the
 * viewer's allergens (missing allergen data never counts as safe) and it fits the remaining calories.
 * Eligible options are scored 0..1 from:
 * <ul>
 *   <li>how much of the remaining protein it covers (most weight),</li>
 *   <li>how close it is to a sensible meal size for the remaining budget,</li>
 *   <li>protein per calorie,</li>
 * </ul>
 * minus a penalty for going over the remaining carbs or fat.
 */
public final class SuggestionScorer {

    private SuggestionScorer() {}

    /** Slack on the calorie limit so a 610-cal item still shows with 600 left. */
    static final double CALORIE_TOLERANCE = 1.05;

    public static boolean eligible(MenuItem m, Set<String> avoid) {
        if (m.getCalories() == null || m.getCalories() <= 0) return false;
        if (m.getSource() != null && m.getSource().toLowerCase(Locale.ROOT).contains("needs check")) return false;
        return allergenSafe(m, avoid);
    }

    static boolean allergenSafe(MenuItem m, Set<String> avoid) {
        if (avoid.isEmpty()) return true;
        String raw = m.getAllergens();
        if (raw == null || raw.isBlank()) return false; // unknown is never "safe"
        if (raw.strip().equalsIgnoreCase("none")) return true;
        for (String a : raw.toLowerCase(Locale.ROOT).split(";")) {
            if (avoid.contains(a.strip())) return false;
        }
        return true;
    }

    public static boolean fitsCalories(double calories, Remaining r) {
        return r.calories() == null || calories <= r.calories() * CALORIE_TOLERANCE;
    }

    /** Score for one item or a group of items eaten together. */
    public static double score(List<MenuItem> items, Remaining r) {
        double cal = sum(items, MenuItem::getCalories);
        double protein = sumDecimal(items, MenuItem::getProtein);
        double carbs = sumDecimal(items, MenuItem::getCarbs);
        double fat = sumDecimal(items, MenuItem::getFat);
        boolean combo = items.size() > 1;

        boolean proteinOpen = r.protein() == null || r.protein() > 0;
        boolean snack = r.meal() == MealTime.SNACK;
        double proteinNeed = r.protein() == null ? 40 : Math.max(1, r.protein());
        if (snack) proteinNeed = Math.min(proteinNeed, 15); // a snack isn't meant to cover the day's protein
        double proteinCover = Math.min(protein, proteinNeed) / proteinNeed;

        double ideal = r.idealCalories(combo);
        double sizeFit = Math.max(0, 1 - Math.abs(cal - ideal) / ideal);

        double density = Math.min(1, (protein / cal * 100) / 10); // 10 g per 100 cal = top marks

        double score = proteinOpen
                ? (snack ? 0.35 * proteinCover + 0.45 * sizeFit : 0.55 * proteinCover + 0.25 * sizeFit) + 0.20 * density
                : 0.70 * sizeFit + 0.30 * density; // protein already covered: just fit the budget well

        score -= overPenalty(carbs, r.carbs());
        score -= overPenalty(fat, r.fat());
        if (r.meal() != null) {
            // a combo is judged by its main (the first non-side item)
            MenuItem main = items.stream().filter(m -> !sideLike(m)).findFirst().orElse(items.get(0));
            score *= r.meal().fit(main);
        }
        return Math.max(0, Math.min(1, score));
    }

    private static double overPenalty(double value, Double remaining) {
        if (remaining == null) return 0;
        double over = value - Math.max(0, remaining);
        if (over <= 0) return 0;
        return Math.min(0.4, 0.3 * over / Math.max(10, Math.abs(remaining)));
    }

    /**
     * "Fill my protein" score: items that cover the remaining protein rank first, fewest calories
     * first; the rest rank by protein per calorie. Higher is better.
     */
    public static double topUpScore(MenuItem m, double proteinLeft) {
        double protein = m.getProtein() == null ? 0 : m.getProtein().doubleValue();
        double cal = Math.max(1, m.getCalories());
        if (protein <= 0) return 0;
        if (protein >= proteinLeft * 0.9) return 2 - cal / 2000.0; // covers it: cheaper is better (1..2)
        return Math.min(0.99, protein / cal * 10);                  // partial: protein per calorie (0..1)
    }

    /** "Teen Burger (Lettuce-Wrapped)" and "Teen Burger" are the same dish for combo purposes. */
    public static String baseName(String name) {
        return name.replaceAll("\\s*\\(.*\\)\\s*$", "").strip().toLowerCase(Locale.ROOT);
    }

    private static final java.util.regex.Pattern SIDE_SECTION =
            java.util.regex.Pattern.compile("side|drink|beverage|dessert|snack|bakery|baked", java.util.regex.Pattern.CASE_INSENSITIVE);
    private static final java.util.regex.Pattern SIDE_NAME = java.util.regex.Pattern.compile(
            "fries|hash ?brown|onion rings|poutine|salad|soup|coffee|tea|juice|milk|smoothie|shake|float|turnover|cookie|muffin|donut|timbits|hash bites",
            java.util.regex.Pattern.CASE_INSENSITIVE);
    private static final java.util.regex.Pattern CONDIMENT = java.util.regex.Pattern.compile(
            "sauce|mayo|mayonnaise|gravy|spread|dip\\b|dressing|ketchup|lollipop|syrup cup",
            java.util.regex.Pattern.CASE_INSENSITIVE);

    /** Sauces and condiments aren't food you'd order as half of a meal. */
    static boolean condiment(MenuItem m) {
        return CONDIMENT.matcher(m.getName()).find();
    }

    /** Sides, drinks and desserts (by menu section or by name, e.g. a hash brown listed under Breakfast). */
    static boolean sideLike(MenuItem m) {
        String section = m.getMenuCategory() == null ? "" : m.getMenuCategory();
        return SIDE_SECTION.matcher(section).find() || SIDE_NAME.matcher(m.getName()).find();
    }

    /** A combo is one main plus one side/drink/dessert: never two mains, two sides or two versions of one dish. */
    public static boolean goodPair(MenuItem a, MenuItem b) {
        if (a.getId().equals(b.getId())) return false;
        if (condiment(a) || condiment(b)) return false;
        if (baseName(a.getName()).equals(baseName(b.getName()))) return false;
        return sideLike(a) != sideLike(b);
    }

    static double sum(List<MenuItem> items, java.util.function.Function<MenuItem, Integer> f) {
        return items.stream().map(f).mapToDouble(v -> v == null ? 0 : v).sum();
    }

    static double sumDecimal(List<MenuItem> items, java.util.function.Function<MenuItem, BigDecimal> f) {
        return items.stream().map(f).mapToDouble(v -> v == null ? 0 : v.doubleValue()).sum();
    }
}
