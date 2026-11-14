package ca.macromap.api.service;

import ca.macromap.api.repository.MenuItemRepository;
import ca.macromap.api.repository.RestaurantLocRepository;
import ca.macromap.api.repository.RestaurantRepository;
import org.junit.jupiter.api.Test;
import org.springframework.data.domain.Limit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;

class RestaurantServiceTest {

    private final RestaurantLocRepository locations = mock(RestaurantLocRepository.class);
    private final RestaurantRepository restaurants = mock(RestaurantRepository.class);
    private final MenuItemRepository items = mock(MenuItemRepository.class);
    private final RestaurantService service = new RestaurantService(locations, restaurants, items);

    @Test
    void blankQueryReturnsEmptyWithoutHittingDb() {
        assertThat(service.search("   ").restaurants()).isEmpty();
        verifyNoInteractions(restaurants, items);
    }

    @Test
    void queryIsLowercasedTrimmedAndWrapped() {
        service.search("  Teen ");
        verify(items).searchByName(eq("%teen%"), any(Limit.class));
        verify(restaurants).searchByName(eq("%teen%"), any(Limit.class));
    }

    @Test
    void likeWildcardsAreEscaped() {
        assertThat(RestaurantService.escapeLike("50%_off\\")).isEqualTo("50\\%\\_off\\\\");
    }
}
