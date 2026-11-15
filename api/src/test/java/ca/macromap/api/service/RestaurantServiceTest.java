package ca.macromap.api.service;

import ca.macromap.api.dto.RestaurantSummary;
import ca.macromap.api.dto.SearchResponse;
import ca.macromap.api.entity.MenuItem;
import ca.macromap.api.entity.Restaurant;
import ca.macromap.api.repository.MenuItemRepository;
import ca.macromap.api.repository.RestaurantLocRepository;
import ca.macromap.api.repository.RestaurantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class RestaurantServiceTest {

    private final RestaurantLocRepository locations = mock(RestaurantLocRepository.class);
    private final RestaurantRepository restaurants = mock(RestaurantRepository.class);
    private final MenuItemRepository items = mock(MenuItemRepository.class);
    private final RestaurantService service = new RestaurantService(locations, restaurants, items);

    private static MenuItem item(Restaurant r, String name, String section, int cal, double protein, double carbs) {
        MenuItem m = new MenuItem();
        m.setId(UUID.randomUUID());
        m.setRestaurant(r);
        m.setName(name);
        m.setMenuCategory(section);
        m.setCalories(cal);
        m.setProtein(BigDecimal.valueOf(protein));
        m.setCarbs(BigDecimal.valueOf(carbs));
        return m;
    }

    @BeforeEach
    void data() {
        Restaurant aw = new Restaurant();
        aw.setId(1L);
        aw.setSlug("aw");
        aw.setName("A&W");
        aw.setCategory("restaurant");
        when(items.findAllWithRestaurant()).thenReturn(List.of(
                item(aw, "Teen Burger", "Burger", 500, 27, 36),
                item(aw, "Teen Burger (Lettuce-Wrapped)", "Burger", 340, 20, 9),
                item(aw, "Grandpa Burger", "Burger", 760, 53, 35),
                item(aw, "Chicken Nuggets (10 pc)", "Chicken", 450, 24, 27),
                item(aw, "Big Mac", "Burger", 550, 25, 45)));
        when(restaurants.findAllSummaries(anyInt(), any(), any())).thenReturn(List.of(
                new RestaurantSummary(1L, "aw", "A&W", "restaurant", null, null, null, 68L, 5L, 340, BigDecimal.TEN, 5L),
                new RestaurantSummary(2L, "tim-hortons", "Tim Hortons", "cafe", null, null, null, 451L, 0L, null, null, 0L)));
    }

    private List<String> names(String q) {
        return service.search(q).items().stream().map(SearchResponse.MenuItemHit::name).toList();
    }

    @Test
    void blankQueryReturnsEmptyWithoutHittingDb() {
        assertThat(service.search("   ").restaurants()).isEmpty();
        verifyNoInteractions(restaurants);
    }

    @Test
    void spacingAndPunctuationDontMatter() {
        assertThat(names("bigmac")).containsExactly("Big Mac");
        assertThat(names("big-mac")).containsExactly("Big Mac");
    }

    @Test
    void pluralsAndWordOrderAreForgiven() {
        assertThat(names("nugget")).containsExactly("Chicken Nuggets (10 pc)");
        assertThat(names("lettuce teen")).containsExactly("Teen Burger (Lettuce-Wrapped)");
    }

    @Test
    void namesStartingWithTheQueryRankFirst() {
        assertThat(names("teen")).startsWith("Teen Burger");
        assertThat(names("burger lettuce")).isNotEmpty();
    }

    @Test
    void macroPhrasesFilterResults() {
        assertThat(names("high protein")).containsExactly("Grandpa Burger"); // >= 30 g
        assertThat(names("burger under 400 cal")).containsExactly("Teen Burger (Lettuce-Wrapped)");
        assertThat(names("low carb")).containsExactly("Teen Burger (Lettuce-Wrapped)");
    }

    @Test
    void restaurantsMatchForgivingly() {
        assertThat(service.search("tim horton").restaurants()).extracting(SearchResponse.RestaurantHit::slug).containsExactly("tim-hortons");
        assertThat(service.search("a w").restaurants()).extracting(SearchResponse.RestaurantHit::slug).containsExactly("aw");
    }
}
