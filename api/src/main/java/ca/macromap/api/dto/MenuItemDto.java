package ca.macromap.api.dto;

import ca.macromap.api.entity.MenuItem;

import java.math.BigDecimal;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

public record MenuItemDto(
        UUID id,
        String name,
        String description,
        String menuCategory,
        String servingSize,
        Integer calories,
        BigDecimal protein,
        BigDecimal carbs,
        BigDecimal fat,
        String source,
        String imageUrl,
        /*
         * Allergen codes (e.g. "milk", "wheat"). null = unknown (no data),
         * empty = verified to contain none of the tracked allergens.
         */
        List<String> allergens
) {
    public static MenuItemDto from(MenuItem m) {
        return new MenuItemDto(m.getId(), m.getName(), m.getDescription(), m.getMenuCategory(), m.getServingSize(),
                m.getCalories(), m.getProtein(), m.getCarbs(), m.getFat(), m.getSource(), m.getImageUrl(),
                parseAllergens(m.getAllergens()));
    }

    /** DB format: null/blank = unknown, "none" = none, otherwise ";"-separated codes. */
    static List<String> parseAllergens(String raw) {
        if (raw == null || raw.isBlank()) return null;
        if (raw.strip().equalsIgnoreCase("none")) return List.of();
        return Arrays.stream(raw.split(";")).map(String::strip).filter(a -> !a.isEmpty())
                .map(String::toLowerCase).distinct().toList();
    }
}
