package ca.macromap.api.dto;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class MenuItemDtoTest {

    @Test
    void blankAllergensMeanUnknown() {
        assertThat(MenuItemDto.parseAllergens(null)).isNull();
        assertThat(MenuItemDto.parseAllergens("  ")).isNull();
    }

    @Test
    void noneMeansVerifiedEmpty() {
        assertThat(MenuItemDto.parseAllergens("None")).isEmpty();
    }

    @Test
    void codesAreSplitTrimmedLowercasedAndDeduped() {
        assertThat(MenuItemDto.parseAllergens(" Milk; wheat ;milk;;soy"))
                .isEqualTo(List.of("milk", "wheat", "soy"));
    }
}
