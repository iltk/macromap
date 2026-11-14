package ca.macromap.api.repository;

import ca.macromap.api.dto.RestaurantSummary;
import ca.macromap.api.dto.SearchResponse.RestaurantHit;
import ca.macromap.api.entity.Restaurant;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

    Optional<Restaurant> findBySlug(String slug);

    @Query("""
        SELECT new ca.macromap.api.dto.RestaurantSummary(
            r.id, r.slug, r.name, r.category, r.description, r.brandColor,
            (SELECT COUNT(rl) FROM RestaurantLocation rl WHERE rl.restaurant = r),
            (SELECT COUNT(m) FROM MenuItem m WHERE m.restaurant = r),
            (SELECT MIN(m.calories) FROM MenuItem m WHERE m.restaurant = r),
            (SELECT MAX(m.protein) FROM MenuItem m WHERE m.restaurant = r),
            (SELECT COUNT(m) FROM MenuItem m WHERE m.restaurant = r
                AND m.calories <= :maxCalories AND m.protein >= :minProtein AND m.carbs <= :maxCarbs))
        FROM Restaurant r
        ORDER BY LOWER(r.name)
        """)
    List<RestaurantSummary> findAllSummaries(int maxCalories, BigDecimal minProtein, BigDecimal maxCarbs);

    /** {@code pattern} is a lower-cased LIKE pattern, e.g. {@code %tim%}. */
    @Query("""
        SELECT new ca.macromap.api.dto.SearchResponse$RestaurantHit(
            r.id, r.slug, r.name, r.category, COUNT(rl))
        FROM RestaurantLocation rl JOIN rl.restaurant r
        WHERE LOWER(r.name) LIKE :pattern ESCAPE '\\'
           OR LOWER(r.category) LIKE :pattern ESCAPE '\\'
        GROUP BY r.id, r.slug, r.name, r.category
        ORDER BY r.name
        """)
    List<RestaurantHit> searchByName(String pattern, Limit limit);
}
