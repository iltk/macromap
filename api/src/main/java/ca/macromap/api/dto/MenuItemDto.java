package ca.macromap.api.dto;

import ca.macromap.api.entity.MenuItem;

import java.math.BigDecimal;
import java.util.UUID;

public record MenuItemDto(
        UUID id,
        String name,
        String menuCategory,
        String servingSize,
        Integer calories,
        BigDecimal protein,
        BigDecimal carbs,
        BigDecimal fat,
        String source
) {
    public static MenuItemDto from(MenuItem m) {
        return new MenuItemDto(m.getId(), m.getName(), m.getMenuCategory(), m.getServingSize(),
                m.getCalories(), m.getProtein(), m.getCarbs(), m.getFat(), m.getSource());
    }
}
