package ca.macromap.api.controller;

import ca.macromap.api.dto.LocationDetails;
import ca.macromap.api.dto.MacroGoal;
import ca.macromap.api.dto.MenuItemDto;
import ca.macromap.api.dto.RestaurantMenu;
import ca.macromap.api.dto.RestaurantPin;
import ca.macromap.api.dto.RestaurantSummary;
import ca.macromap.api.dto.SearchResponse;
import ca.macromap.api.exception.NotFoundException;
import ca.macromap.api.service.RestaurantService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(RestaurantController.class)
class RestaurantControllerTest {

    @Autowired
    MockMvc mvc;

    @MockitoBean
    RestaurantService service;

    private static final UUID LOC_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Test
    void pinsReturnsAllFields() throws Exception {
        when(service.getAllPins()).thenReturn(List.of(new RestaurantPin(
                LOC_ID, 1L, "aw", "A&W", "restaurant", "#e36b0a", new BigDecimal("43.648832"), new BigDecimal("-79.372345"), "24/7")));

        mvc.perform(get("/api/restaurants/pins"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].locationId").value(LOC_ID.toString()))
                .andExpect(jsonPath("$[0].slug").value("aw"))
                .andExpect(jsonPath("$[0].category").value("restaurant"))
                .andExpect(jsonPath("$[0].latitude").value(43.648832))
                .andExpect(jsonPath("$[0].brandColor").value("#e36b0a"))
                .andExpect(jsonPath("$[0].openingHours").value("24/7"));
    }

    @Test
    void locationDetailsIncludesMenu() throws Exception {
        MenuItemDto item = new MenuItemDto(UUID.randomUUID(), "Teen Burger", "Beef burger with bacon", "Burger", "250 g", 500,
                new BigDecimal("27"), new BigDecimal("36"), new BigDecimal("30"), "test", "/images/menu/aw/teen.jpg", List.of("milk", "wheat"));
        when(service.getLocationDetails(LOC_ID)).thenReturn(new LocationDetails(
                LOC_ID, 1L, "aw", "A&W", "restaurant", "#e36b0a", null, "https://web.aw.ca/", "85 Front Street East, Toronto, ON",
                "Toronto", null, "24/7", new BigDecimal("43.648832"), new BigDecimal("-79.372345"), List.of(item)));

        mvc.perform(get("/api/locations/{id}", LOC_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("A&W"))
                .andExpect(jsonPath("$.openingHours").value("24/7"))
                .andExpect(jsonPath("$.menu[0].name").value("Teen Burger"))
                .andExpect(jsonPath("$.menu[0].calories").value(500))
                .andExpect(jsonPath("$.menu[0].allergens[1]").value("wheat"))
                .andExpect(jsonPath("$.menu[0].imageUrl").value("/images/menu/aw/teen.jpg"));
    }

    @Test
    void restaurantDirectoryListsSummaries() throws Exception {
        when(service.getAllRestaurants(new MacroGoal(null, null, null))).thenReturn(List.of(
                new RestaurantSummary(1L, "aw", "A&W", "restaurant", "Burgers", "#e36b0a", "/logos/aw.svg", 68L, 53L,
                        35, new BigDecimal("56"), 53L)));

        mvc.perform(get("/api/restaurants"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").value("aw"))
                .andExpect(jsonPath("$[0].locationCount").value(68))
                .andExpect(jsonPath("$[0].lightestCalories").value(35))
                .andExpect(jsonPath("$[0].logoUrl").value("/logos/aw.svg"))
                .andExpect(jsonPath("$[0].matchingItems").value(53));
    }

    @Test
    void restaurantDirectoryPassesMacroGoal() throws Exception {
        MacroGoal goal = new MacroGoal(500, new BigDecimal("30"), null);
        when(service.getAllRestaurants(goal)).thenReturn(List.of(
                new RestaurantSummary(1L, "aw", "A&W", "restaurant", null, null, null, 68L, 53L,
                        35, new BigDecimal("56"), 4L)));

        mvc.perform(get("/api/restaurants").param("maxCalories", "500").param("minProtein", "30"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].matchingItems").value(4));
    }

    @Test
    void restaurantMenuBySlug() throws Exception {
        when(service.getRestaurantMenu("aw")).thenReturn(new RestaurantMenu(
                1L, "aw", "A&W", "restaurant", "Burgers", "#e36b0a", null, "https://web.aw.ca/", 68, List.of()));

        mvc.perform(get("/api/restaurants/aw"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("A&W"))
                .andExpect(jsonPath("$.locationCount").value(68));
    }

    @Test
    void pinsPathIsNotTreatedAsSlug() throws Exception {
        when(service.getAllPins()).thenReturn(List.of());
        mvc.perform(get("/api/restaurants/pins")).andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void unknownRestaurantIs404() throws Exception {
        when(service.getRestaurantMenu("nope")).thenThrow(new NotFoundException("nope"));
        mvc.perform(get("/api/restaurants/nope")).andExpect(status().isNotFound());
    }

    @Test
    void unknownLocationIs404() throws Exception {
        when(service.getLocationDetails(any())).thenThrow(new NotFoundException("nope"));

        mvc.perform(get("/api/locations/{id}", LOC_ID)).andExpect(status().isNotFound());
    }

    @Test
    void malformedLocationIdIs400() throws Exception {
        mvc.perform(get("/api/locations/not-a-uuid")).andExpect(status().isBadRequest());
    }

    @Test
    void searchPassesQueryThrough() throws Exception {
        when(service.search("teen")).thenReturn(new SearchResponse(
                List.of(),
                List.of(new SearchResponse.MenuItemHit(UUID.randomUUID(), 1L, "aw", "A&W", "Teen Burger", 500, new BigDecimal("27"), null))));

        mvc.perform(get("/api/search").param("q", "teen"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].restaurantSlug").value("aw"))
                .andExpect(jsonPath("$.restaurants").isEmpty());
    }
}
