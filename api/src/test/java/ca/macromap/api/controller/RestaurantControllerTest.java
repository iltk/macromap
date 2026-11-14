package ca.macromap.api.controller;

import ca.macromap.api.dto.LocationDetails;
import ca.macromap.api.dto.MenuItemDto;
import ca.macromap.api.dto.RestaurantPin;
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
                LOC_ID, 1L, "aw", "A&W", "restaurant", new BigDecimal("43.648832"), new BigDecimal("-79.372345"))));

        mvc.perform(get("/api/restaurants/pins"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].locationId").value(LOC_ID.toString()))
                .andExpect(jsonPath("$[0].slug").value("aw"))
                .andExpect(jsonPath("$[0].category").value("restaurant"))
                .andExpect(jsonPath("$[0].latitude").value(43.648832));
    }

    @Test
    void locationDetailsIncludesMenu() throws Exception {
        MenuItemDto item = new MenuItemDto(UUID.randomUUID(), "Teen Burger", "Burger", "250 g", 500,
                new BigDecimal("27"), new BigDecimal("36"), new BigDecimal("30"), "test");
        when(service.getLocationDetails(LOC_ID)).thenReturn(new LocationDetails(
                LOC_ID, 1L, "aw", "A&W", "restaurant", "https://web.aw.ca/", "85 Front Street East, Toronto, ON",
                "Toronto", null, "24/7", new BigDecimal("43.648832"), new BigDecimal("-79.372345"), List.of(item)));

        mvc.perform(get("/api/locations/{id}", LOC_ID))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("A&W"))
                .andExpect(jsonPath("$.openingHours").value("24/7"))
                .andExpect(jsonPath("$.menu[0].name").value("Teen Burger"))
                .andExpect(jsonPath("$.menu[0].calories").value(500));
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
                List.of(new SearchResponse.MenuItemHit(UUID.randomUUID(), 1L, "aw", "A&W", "Teen Burger", 500, new BigDecimal("27")))));

        mvc.perform(get("/api/search").param("q", "teen"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items[0].restaurantSlug").value("aw"))
                .andExpect(jsonPath("$.restaurants").isEmpty());
    }
}
