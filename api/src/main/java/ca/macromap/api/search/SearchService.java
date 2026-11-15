package ca.macromap.api.search;

import ca.macromap.api.dto.MacroGoal;
import ca.macromap.api.dto.RestaurantSummary;
import ca.macromap.api.dto.SearchResponse;
import ca.macromap.api.dto.SearchResponse.MenuItemHit;
import ca.macromap.api.dto.SearchResponse.RestaurantHit;
import ca.macromap.api.entity.MenuItem;
import ca.macromap.api.repository.MenuItemRepository;
import ca.macromap.api.repository.RestaurantRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Objects;

@Service
@Transactional(readOnly = true)
public class SearchService {

    static final int MAX_QUERY_LENGTH = 100;
    private static final int RESTAURANT_HITS = 5;
    private static final int ITEM_HITS = 10;

    private record Scored<T>(T value, int score) {}

    private final RestaurantRepository restaurants;
    private final MenuItemRepository menuItems;

    public SearchService(RestaurantRepository restaurants, MenuItemRepository menuItems) {
        this.restaurants = restaurants;
        this.menuItems = menuItems;
    }

    public SearchResponse search(String rawQuery) {
        if (rawQuery == null || rawQuery.isBlank()) return SearchResponse.empty();
        String raw = rawQuery.strip();
        SearchQuery q = SearchQuery.parse(raw.length() > MAX_QUERY_LENGTH ? raw.substring(0, MAX_QUERY_LENGTH) : raw);
        return new SearchResponse(q.hasText() ? findRestaurants(q) : List.of(), findItems(q));
    }

    private List<RestaurantHit> findRestaurants(SearchQuery q) {
        return restaurants.findAllSummaries(MacroGoal.NONE.caloriesCeiling(), MacroGoal.NONE.proteinFloor(), MacroGoal.NONE.carbsCeiling())
                .stream()
                .filter(r -> r.locationCount() > 0)
                .map(r -> new Scored<>(r, q.matchScore(r.name() + " " + r.category())))
                .filter(s -> s.score() > 0)
                .sorted(Comparator.comparingInt((Scored<RestaurantSummary> s) -> s.score()).reversed())
                .limit(RESTAURANT_HITS)
                .map(s -> s.value())
                .map(r -> new RestaurantHit(r.restaurantId(), r.slug(), r.name(), r.category(), r.locationCount()))
                .toList();
    }

    private List<MenuItemHit> findItems(SearchQuery q) {
        Comparator<Scored<MenuItem>> order = Comparator.comparingInt((Scored<MenuItem> s) -> s.score()).reversed();
        if (q.hasMacroFilter()) order = order.thenComparing(s -> -proteinOf(s.value()));
        return menuItems.findAllWithRestaurant().stream()
                .filter(m -> passesMacroFilters(m, q))
                .map(m -> new Scored<>(m, q.matchScore(m.getName() + " " + Objects.toString(m.getMenuCategory(), "") + " " + m.getRestaurant().getName())))
                .filter(s -> s.score() > 0)
                .sorted(order.thenComparing(s -> s.value().getName()))
                .limit(ITEM_HITS)
                .map(s -> toHit(s.value()))
                .toList();
    }

    private static boolean passesMacroFilters(MenuItem m, SearchQuery q) {
        if (!q.hasMacroFilter()) return true;
        if (m.hasUnverifiedNumbers()) return false; // a macro search promises numbers we trust
        if (q.maxCalories() != null && (m.getCalories() == null || m.getCalories() > q.maxCalories())) return false;
        if (q.minProtein() != null && (m.getProtein() == null || m.getProtein().doubleValue() < q.minProtein())) return false;
        return q.maxCarbs() == null || (m.getCarbs() != null && m.getCarbs().doubleValue() <= q.maxCarbs());
    }

    private static double proteinOf(MenuItem m) {
        return m.getProtein() == null ? 0 : m.getProtein().doubleValue();
    }

    private static MenuItemHit toHit(MenuItem m) {
        return new MenuItemHit(m.getId(), m.getRestaurant().getId(), m.getRestaurant().getSlug(),
                m.getRestaurant().getName(), m.getName(), m.getCalories(), m.getProtein(), m.getImageUrl());
    }
}
