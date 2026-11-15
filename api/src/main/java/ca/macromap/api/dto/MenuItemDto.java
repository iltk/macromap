package ca.macromap.api.dto;

import ca.macromap.api.entity.MenuItem;

import ca.macromap.api.nutrition.Allergens;

import java.math.BigDecimal;
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
        /* allergen codes; null = unknown, empty = none of the tracked allergens */
        List<String> allergens
) {
    public static MenuItemDto from(MenuItem m) {
        return new MenuItemDto(m.getId(), m.getName(), m.getDescription(), m.getMenuCategory(), m.getServingSize(),
                m.getCalories(), m.getProtein(), m.getCarbs(), m.getFat(), m.getSource(), m.getImageUrl(),
                Allergens.parse(m.getAllergens()));
    }

}
