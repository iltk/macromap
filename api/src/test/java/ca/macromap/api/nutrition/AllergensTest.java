package ca.macromap.api.nutrition;

import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class AllergensTest {

    @Test
    void blankAllergensMeanUnknown() {
        assertThat(Allergens.parse(null)).isNull();
        assertThat(Allergens.parse("  ")).isNull();
    }

    @Test
    void noneMeansVerifiedEmpty() {
        assertThat(Allergens.parse("None")).isEmpty();
    }

    @Test
    void codesAreSplitTrimmedLowercasedAndDeduped() {
        assertThat(Allergens.parse(" Milk; wheat ;milk;;soy"))
                .isEqualTo(List.of("milk", "wheat", "soy"));
    }

    @Test
    void unknownIsNeverSafeWhenAvoidingSomething() {
        assertThat(Allergens.safeFor(null, java.util.Set.of())).isTrue();
        assertThat(Allergens.safeFor(null, java.util.Set.of("milk"))).isFalse();
        assertThat(Allergens.safeFor("wheat;soy", java.util.Set.of("milk"))).isTrue();
        assertThat(Allergens.safeFor("Milk; wheat", java.util.Set.of("milk"))).isFalse();
        assertThat(Allergens.safeFor("none", java.util.Set.of("milk"))).isTrue();
    }
}
