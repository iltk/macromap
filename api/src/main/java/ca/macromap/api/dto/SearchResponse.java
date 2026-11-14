package ca.macromap.api.dto;

import java.util.List;
import java.util.UUID;

public record SearchResponse(List<RestaurantHit> restaurants, List<MenuItemHit> items) {

    public record RestaurantHit(Long restaurantId, String slug, String name, String category, Long locationCount) {}

    public record MenuItemHit(UUID id, Long restaurantId, String restaurantSlug, String restaurantName,
                              String name, Integer calories, java.math.BigDecimal protein, String imageUrl) {}

    public static SearchResponse empty() {
        return new SearchResponse(List.of(), List.of());
    }
}
