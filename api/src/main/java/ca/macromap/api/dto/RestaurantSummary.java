package ca.macromap.api.dto;

import java.math.BigDecimal;

/**
 * One row in the restaurant directory.
 *
 * @param lightestCalories lowest-calorie item on the menu (null when there's no nutrition data)
 * @param topProtein       highest protein (g) of any single item
 * @param matchingItems    items that fit the requested macro goal (all items with full macros when no goal)
 */
public record RestaurantSummary(
        Long restaurantId,
        String slug,
        String name,
        String category,
        String description,
        String brandColor,
        Long locationCount,
        Long menuItemCount,
        Integer lightestCalories,
        BigDecimal topProtein,
        Long matchingItems
) {}
