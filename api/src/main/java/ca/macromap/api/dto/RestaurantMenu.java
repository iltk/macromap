package ca.macromap.api.dto;

import ca.macromap.api.entity.Restaurant;

import java.util.List;

/** A chain's full menu page. */
public record RestaurantMenu(
        Long restaurantId,
        String slug,
        String name,
        String category,
        String description,
        String brandColor,
        String website,
        long locationCount,
        List<MenuItemDto> menu
) {
    public static RestaurantMenu from(Restaurant r, long locationCount, List<MenuItemDto> menu) {
        return new RestaurantMenu(r.getId(), r.getSlug(), r.getName(), r.getCategory(), r.getDescription(),
                r.getBrandColor(), r.getWebsite(), locationCount, menu);
    }
}
