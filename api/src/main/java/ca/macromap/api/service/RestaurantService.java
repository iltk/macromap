package ca.macromap.api.service;

import ca.macromap.api.dto.LocationDetails;
import ca.macromap.api.dto.MacroGoal;
import ca.macromap.api.dto.MenuItemDto;
import ca.macromap.api.dto.RestaurantMenu;
import ca.macromap.api.dto.RestaurantPin;
import ca.macromap.api.dto.RestaurantSummary;
import ca.macromap.api.dto.SearchResponse;
import ca.macromap.api.entity.MenuItem;
import ca.macromap.api.entity.Restaurant;
import ca.macromap.api.search.SearchQuery;
import ca.macromap.api.entity.RestaurantLocation;
import ca.macromap.api.exception.NotFoundException;
import ca.macromap.api.repository.MenuItemRepository;
import ca.macromap.api.repository.RestaurantLocRepository;
import ca.macromap.api.repository.RestaurantRepository;
import org.springframework.data.domain.Limit;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@Transactional(readOnly = true)
public class RestaurantService {

    static final int MAX_QUERY_LENGTH = 100;
    private static final Limit RESTAURANT_HITS = Limit.of(5);
    private static final Limit ITEM_HITS = Limit.of(10);

    private final RestaurantLocRepository locationRepository;
    private final RestaurantRepository restaurantRepository;
    private final MenuItemRepository menuItemRepository;

    public RestaurantService(RestaurantLocRepository locationRepository,
                             RestaurantRepository restaurantRepository,
                             MenuItemRepository menuItemRepository) {
        this.locationRepository = locationRepository;
        this.restaurantRepository = restaurantRepository;
        this.menuItemRepository = menuItemRepository;
    }

    public List<RestaurantPin> getAllPins() {
        return locationRepository.findAllPins();
    }

    public List<RestaurantSummary> getAllRestaurants(MacroGoal goal) {
        return restaurantRepository.findAllSummaries(
                goal.caloriesCeiling(), goal.proteinFloor(), goal.carbsCeiling());
    }

    public RestaurantMenu getRestaurantMenu(String slug) {
        Restaurant r = restaurantRepository.findBySlug(slug)
                .orElseThrow(() -> new NotFoundException("Restaurant '" + slug + "' not found"));
        return RestaurantMenu.from(r, locationRepository.countByRestaurantId(r.getId()), menuFor(r.getId()));
    }

    public LocationDetails getLocationDetails(UUID locationId) {
        RestaurantLocation loc = locationRepository.findWithRestaurantById(locationId)
                .orElseThrow(() -> new NotFoundException("Location " + locationId + " not found"));
        return LocationDetails.from(loc, menuFor(loc.getRestaurant().getId()));
    }

    private List<MenuItemDto> menuFor(Long restaurantId) {
        return menuItemRepository.findByRestaurantIdOrderByMenuCategoryAscNameAsc(restaurantId)
                .stream().map(MenuItemDto::from).toList();
    }

    public SearchResponse search(String rawQuery) {
        if (rawQuery == null || rawQuery.isBlank()) {
            return SearchResponse.empty();
        }
        String raw = rawQuery.strip();
        if (raw.length() > MAX_QUERY_LENGTH) raw = raw.substring(0, MAX_QUERY_LENGTH);
        SearchQuery q = SearchQuery.parse(raw);

        // restaurants: by name/category (only when there's text to match)
        List<SearchResponse.RestaurantHit> restaurants = q.hasText()
                ? restaurantRepository.findAllSummaries(Integer.MAX_VALUE, java.math.BigDecimal.ZERO, new java.math.BigDecimal("1000000")).stream()
                    .filter(r -> r.locationCount() > 0)
                    .map(r -> java.util.Map.entry(r, q.matchScore(r.name() + " " + r.category())))
                    .filter(e -> e.getValue() > 0)
                    .sorted(java.util.Map.Entry.<RestaurantSummary, Integer>comparingByValue().reversed())
                    .limit(RESTAURANT_HITS.max())
                    .map(e -> new SearchResponse.RestaurantHit(e.getKey().restaurantId(), e.getKey().slug(), e.getKey().name(),
                            e.getKey().category(), e.getKey().locationCount()))
                    .toList()
                : List.of();

        // menu items: words across name, section and restaurant; macro phrases as filters
        java.util.Comparator<java.util.Map.Entry<MenuItem, Integer>> order = java.util.Map.Entry.<MenuItem, Integer>comparingByValue().reversed();
        if (q.hasMacroFilter()) {
            order = order.thenComparing(e -> e.getKey().getProtein() == null ? 0 : -e.getKey().getProtein().doubleValue());
        }
        List<SearchResponse.MenuItemHit> items = menuItemRepository.findAllWithRestaurant().stream()
                .filter(m -> fits(m, q))
                .map(m -> java.util.Map.entry(m, q.matchScore(m.getName() + " " + nz(m.getMenuCategory()) + " " + m.getRestaurant().getName())))
                .filter(e -> e.getValue() > 0)
                .sorted(order.thenComparing(e -> e.getKey().getName()))
                .limit(ITEM_HITS.max())
                .map(e -> {
                    MenuItem m = e.getKey();
                    return new SearchResponse.MenuItemHit(m.getId(), m.getRestaurant().getId(), m.getRestaurant().getSlug(),
                            m.getRestaurant().getName(), m.getName(), m.getCalories(), m.getProtein(), m.getImageUrl());
                })
                .toList();
        return new SearchResponse(restaurants, items);
    }

    private static boolean fits(MenuItem m, SearchQuery q) {
        // macro searches promise numbers; skip items whose source numbers don't add up
        if (q.hasMacroFilter() && m.getSource() != null && m.getSource().toLowerCase(java.util.Locale.ROOT).contains("needs check")) return false;
        if (q.maxCalories() != null && (m.getCalories() == null || m.getCalories() > q.maxCalories())) return false;
        if (q.minProtein() != null && (m.getProtein() == null || m.getProtein().doubleValue() < q.minProtein())) return false;
        if (q.maxCarbs() != null && (m.getCarbs() == null || m.getCarbs().doubleValue() > q.maxCarbs())) return false;
        return true;
    }

    private static String nz(String s) {
        return s == null ? "" : s;
    }

}
