package ca.macromap.api.suggest;

import ca.macromap.api.dto.MenuItemDto;
import ca.macromap.api.dto.SuggestionResponse;
import ca.macromap.api.dto.SuggestionResponse.ComboSuggestion;
import ca.macromap.api.dto.SuggestionResponse.ItemSuggestion;
import ca.macromap.api.dto.SuggestionResponse.NearbyLocation;
import ca.macromap.api.dto.SuggestionResponse.RestaurantRef;
import ca.macromap.api.entity.MenuItem;
import ca.macromap.api.entity.Restaurant;
import ca.macromap.api.entity.RestaurantLocation;
import ca.macromap.api.repository.MenuItemRepository;
import ca.macromap.api.repository.RestaurantLocRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class SuggestionService {

    static final int LOCATIONS_PER_CHAIN = 3;
    static final int MAX_COMBOS_PER_CHAIN = 2;

    private final MenuItemRepository menuItems;
    private final RestaurantLocRepository locations;

    public SuggestionService(MenuItemRepository menuItems, RestaurantLocRepository locations) {
        this.menuItems = menuItems;
        this.locations = locations;
    }

    public SuggestionResponse suggest(SuggestionQuery q) {
        Remaining r = q.remaining();
        if (r.calories() != null && r.calories() < 50) {
            return new SuggestionResponse(List.of(), List.of()); // the day's calories are used up
        }

        Map<Long, List<NearbyLocation>> nearby = q.lat() != null && q.lng() != null ? nearbyByChain(q) : null;

        Map<Restaurant, List<MenuItem>> byChain = menuItems.findAllWithRestaurant().stream()
                .filter(m -> q.slug() == null || q.slug().equals(m.getRestaurant().getSlug()))
                .filter(m -> nearby == null || nearby.containsKey(m.getRestaurant().getId()))
                .filter(m -> SuggestionScorer.eligible(m, q.avoid()))
                .collect(Collectors.groupingBy(MenuItem::getRestaurant, LinkedHashMap::new, Collectors.toList()));

        List<ItemSuggestion> items = new ArrayList<>();
        List<ComboSuggestion> combos = new ArrayList<>();

        byChain.forEach((restaurant, menu) -> {
            RestaurantRef ref = ref(restaurant);
            List<NearbyLocation> locs = nearby == null ? List.of() : nearby.get(restaurant.getId());

            for (MenuItem m : menu) {
                if (SuggestionScorer.fitsCalories(m.getCalories(), r)) {
                    items.add(new ItemSuggestion(MenuItemDto.from(m), ref, round(SuggestionScorer.score(List.of(m), r)), locs));
                }
            }

            List<ComboSuggestion> chainCombos = new ArrayList<>();
            for (int i = 0; i < menu.size(); i++) {
                for (int j = i + 1; j < menu.size(); j++) {
                    MenuItem a = menu.get(i), b = menu.get(j);
                    if (!SuggestionScorer.goodPair(a, b)) continue;
                    List<MenuItem> pair = List.of(a, b);
                    double cal = SuggestionScorer.sum(pair, MenuItem::getCalories);
                    if (!SuggestionScorer.fitsCalories(cal, r)) continue;
                    chainCombos.add(new ComboSuggestion(
                            pair.stream().map(MenuItemDto::from).toList(), ref, (int) cal,
                            dec(SuggestionScorer.sumDecimal(pair, MenuItem::getProtein)),
                            dec(SuggestionScorer.sumDecimal(pair, MenuItem::getCarbs)),
                            dec(SuggestionScorer.sumDecimal(pair, MenuItem::getFat)),
                            round(SuggestionScorer.score(pair, r)), locs));
                }
            }
            chainCombos.sort(Comparator.comparingDouble(ComboSuggestion::score).reversed());
            combos.addAll(chainCombos.stream().limit(MAX_COMBOS_PER_CHAIN).toList());
        });

        Comparator<ItemSuggestion> itemOrder = Comparator.comparingDouble(ItemSuggestion::score).reversed()
                .thenComparing(s -> distance(s.locations()));
        Comparator<ComboSuggestion> comboOrder = Comparator.comparingDouble(ComboSuggestion::score).reversed()
                .thenComparing(s -> distance(s.locations()));

        return new SuggestionResponse(
                items.stream().sorted(itemOrder).limit(q.limit()).toList(),
                combos.stream().sorted(comboOrder).limit(Math.max(1, q.limit() / 2)).toList());
    }

    /** Nearest few locations of each chain within the radius, keyed by restaurant id. */
    private Map<Long, List<NearbyLocation>> nearbyByChain(SuggestionQuery q) {
        Map<Long, List<NearbyLocation>> out = new HashMap<>();
        for (RestaurantLocation l : locations.findAllWithRestaurant()) {
            int d = (int) Math.round(haversineMeters(q.lat(), q.lng(), l.getLatitude().doubleValue(), l.getLongitude().doubleValue()));
            if (d > q.radiusKm() * 1000) continue;
            out.computeIfAbsent(l.getRestaurant().getId(), k -> new ArrayList<>())
                    .add(new NearbyLocation(l.getId(), l.getAddress(), l.getLatitude(), l.getLongitude(), d, l.getOpeningHours()));
        }
        out.replaceAll((k, list) -> list.stream()
                .sorted(Comparator.comparingInt(NearbyLocation::distanceMeters))
                .limit(LOCATIONS_PER_CHAIN).toList());
        return out;
    }

    static double haversineMeters(double lat1, double lng1, double lat2, double lng2) {
        double R = 6_371_000;
        double dLat = Math.toRadians(lat2 - lat1);
        double dLng = Math.toRadians(lng2 - lng1);
        double h = Math.pow(Math.sin(dLat / 2), 2)
                + Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) * Math.pow(Math.sin(dLng / 2), 2);
        return 2 * R * Math.asin(Math.sqrt(h));
    }

    private static int distance(List<NearbyLocation> locs) {
        return locs.isEmpty() ? Integer.MAX_VALUE : locs.get(0).distanceMeters();
    }

    private static RestaurantRef ref(Restaurant r) {
        return new RestaurantRef(r.getId(), r.getSlug(), r.getName(), r.getCategory(), r.getBrandColor(), r.getLogoUrl());
    }

    private static double round(double v) {
        return Math.round(v * 1000) / 1000.0;
    }

    private static BigDecimal dec(double v) {
        return BigDecimal.valueOf(v).setScale(1, RoundingMode.HALF_UP);
    }
}
