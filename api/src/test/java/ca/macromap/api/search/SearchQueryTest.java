package ca.macromap.api.search;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class SearchQueryTest {

    @Test
    void parsesMacroPhrasesAndLeavesTheRestAsWords() {
        SearchQuery q = SearchQuery.parse("Chicken under 500 cal 30g protein");
        assertThat(q.maxCalories()).isEqualTo(500);
        assertThat(q.minProtein()).isEqualTo(30.0);
        assertThat(q.words()).containsExactly("chicken");
    }

    @Test
    void shorthandForms() {
        assertThat(SearchQuery.parse("<400").maxCalories()).isEqualTo(400);
        assertThat(SearchQuery.parse("high protein wrap").minProtein()).isEqualTo(30.0);
        assertThat(SearchQuery.parse("low carb").maxCarbs()).isEqualTo(20.0);
        assertThat(SearchQuery.parse("low cal").maxCalories()).isEqualTo(400);
    }

    @Test
    void singularisesCommonMenuPlurals() {
        assertThat(SearchQuery.parse("fries patties nuggets").words()).containsExactly("fry", "patty", "nugget");
    }

    @Test
    void normalisesPunctuationAndAmpersands() {
        assertThat(SearchQuery.normalise("Bacon & Egger")).isEqualTo("bacon and egger");
        assertThat(SearchQuery.parse("Big-Mac").collapsed()).isEqualTo("bigmac");
    }
}
