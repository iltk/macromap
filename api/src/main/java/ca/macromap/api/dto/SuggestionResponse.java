package ca.macromap.api.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/** "What to eat next": single items and two-item combos that fit what's left today. */
public record SuggestionResponse(List<ItemSuggestion> items, List<ComboSuggestion> combos) {

    public record RestaurantRef(Long restaurantId, String slug, String name, String category,
                                String brandColor, String logoUrl) {}

    public record NearbyLocation(UUID locationId, String address, BigDecimal latitude, BigDecimal longitude,
                                 int distanceMeters, String openingHours) {}

    /** {@code locations}: nearest few (closest first) when a position was given, otherwise empty. */
    public record ItemSuggestion(MenuItemDto item, RestaurantRef restaurant, double score,
                                 List<NearbyLocation> locations) {}

    public record ComboSuggestion(List<MenuItemDto> items, RestaurantRef restaurant, int calories,
                                  BigDecimal protein, BigDecimal carbs, BigDecimal fat, double score,
                                  List<NearbyLocation> locations) {}
}
