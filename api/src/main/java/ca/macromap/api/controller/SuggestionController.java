package ca.macromap.api.controller;

import ca.macromap.api.dto.SuggestionResponse;
import ca.macromap.api.suggest.Remaining;
import ca.macromap.api.suggest.SuggestionQuery;
import ca.macromap.api.suggest.SuggestionService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api")
public class SuggestionController {

    private final SuggestionService service;

    public SuggestionController(SuggestionService service) {
        this.service = service;
    }

    /**
     * Suggestions for what's left of today, e.g.
     * {@code /api/suggestions?calories=700&protein=45&carbs=120&fat=30&avoid=milk,egg&lat=43.65&lng=-79.38}.
     */
    @GetMapping("/suggestions")
    public SuggestionResponse suggestions(
            @RequestParam(required = false) Integer calories,
            @RequestParam(required = false) Double protein,
            @RequestParam(required = false) Double carbs,
            @RequestParam(required = false) Double fat,
            @RequestParam(required = false, defaultValue = "") String avoid,
            @RequestParam(required = false) Double lat,
            @RequestParam(required = false) Double lng,
            @RequestParam(required = false, defaultValue = "5") double radiusKm,
            @RequestParam(required = false) String restaurant,
            @RequestParam(required = false, defaultValue = "8") int limit) {
        Set<String> avoidSet = Arrays.stream(avoid.split(","))
                .map(a -> a.strip().toLowerCase(Locale.ROOT)).filter(a -> !a.isEmpty()).collect(Collectors.toSet());
        return service.suggest(new SuggestionQuery(
                new Remaining(calories, protein, carbs, fat), avoidSet, lat, lng,
                Math.max(0.2, Math.min(radiusKm, 50)), restaurant == null || restaurant.isBlank() ? null : restaurant,
                Math.max(1, Math.min(limit, 30))));
    }
}
