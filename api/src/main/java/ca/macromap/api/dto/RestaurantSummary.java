package ca.macromap.api.dto;

/** One card in the restaurant directory. */
public record RestaurantSummary(
        Long restaurantId,
        String slug,
        String name,
        String category,
        String description,
        String brandColor,
        Long locationCount,
        Long menuItemCount
) {}
