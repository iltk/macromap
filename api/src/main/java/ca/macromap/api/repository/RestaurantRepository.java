package ca.macromap.api.repository;

import ca.macromap.api.dto.SearchResponse.RestaurantHit;
import ca.macromap.api.entity.Restaurant;
import org.springframework.data.domain.Limit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {

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
