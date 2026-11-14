package ca.macromap.api.suggest;

import java.util.Set;

/**
 * @param remaining what's left of today's targets
 * @param avoid     allergen codes to avoid
 * @param lat       viewer position (optional); with it, only chains with a location within {@code radiusKm}
 * @param slug      restrict to one restaurant (optional)
 */
public record SuggestionQuery(Remaining remaining, Set<String> avoid, Double lat, Double lng,
                              double radiusKm, String slug, int limit) {}
