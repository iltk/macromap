package ca.macromap.api.nutrition;

import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Allergen data as stored in menu_items.allergens: blank means unknown, "none" means
 * none of the tracked allergens, otherwise ";"-separated codes such as "milk;wheat".
 */
public final class Allergens {

    private Allergens() {}

    /** Codes in the item, an empty list for "none", or null when unknown. */
    public static List<String> parse(String raw) {
        if (raw == null || raw.isBlank()) return null;
        if (raw.strip().equalsIgnoreCase("none")) return List.of();
        return Arrays.stream(raw.split(";"))
                .map(a -> a.strip().toLowerCase(Locale.ROOT))
                .filter(a -> !a.isEmpty())
                .distinct()
                .toList();
    }

    /** Safe only when the data is known and contains none of {@code avoid}; unknown is never safe. */
    public static boolean safeFor(String raw, Set<String> avoid) {
        if (avoid.isEmpty()) return true;
        List<String> codes = parse(raw);
        return codes != null && codes.stream().noneMatch(avoid::contains);
    }
}
