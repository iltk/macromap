package ca.macromap.api.suggest;

import ca.macromap.api.entity.MenuItem;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

class SuggestionScorerTest {

    static MenuItem item(String name, String category, int cal, double p, double c, double f) {
        MenuItem m = new MenuItem();
        m.setId(UUID.randomUUID());
        m.setName(name);
        m.setMenuCategory(category);
        m.setCalories(cal);
        m.setProtein(BigDecimal.valueOf(p));
        m.setCarbs(BigDecimal.valueOf(c));
        m.setFat(BigDecimal.valueOf(f));
        m.setSource("test");
        return m;
    }

    private static final Remaining LUNCH = new Remaining(700, 45.0, 90.0, 30.0);

    @Test
    void itemsMustFitRemainingCaloriesWithSmallTolerance() {
        assertThat(SuggestionScorer.fitsCalories(730, LUNCH)).isTrue();   // within 5%
        assertThat(SuggestionScorer.fitsCalories(800, LUNCH)).isFalse();
        assertThat(SuggestionScorer.fitsCalories(5000, new Remaining(null, null, null, null))).isTrue();
    }

    @Test
    void unknownAllergensAreNeverSafeWhenAvoidingSomething() {
        MenuItem m = item("Burger", "Burger", 500, 30, 40, 20);
        assertThat(SuggestionScorer.eligible(m, Set.of())).isTrue();
        assertThat(SuggestionScorer.eligible(m, Set.of("milk"))).isFalse();
        m.setAllergens("wheat;soy");
        assertThat(SuggestionScorer.eligible(m, Set.of("milk"))).isTrue();
        m.setAllergens("milk;wheat");
        assertThat(SuggestionScorer.eligible(m, Set.of("milk"))).isFalse();
        m.setAllergens("none");
        assertThat(SuggestionScorer.eligible(m, Set.of("milk"))).isTrue();
    }

    @Test
    void itemsWithUnreliableNumbersAreSkipped() {
        MenuItem m = item("Poutine", "Side", 1400, 40, 20, 80);
        m.setSource("A&W guide; needs check: macros don't add up");
        assertThat(SuggestionScorer.eligible(m, Set.of())).isFalse();
    }

    @Test
    void moreProteinForSimilarCaloriesScoresHigher() {
        MenuItem lean = item("Grilled chicken wrap", "Wraps", 550, 40, 45, 15);
        MenuItem fries = item("Large fries", "Side", 550, 6, 70, 26);
        assertThat(SuggestionScorer.score(List.of(lean), LUNCH)).isGreaterThan(SuggestionScorer.score(List.of(fries), LUNCH));
    }

    @Test
    void goingOverRemainingFatIsPenalised() {
        MenuItem fatty = item("Double bacon", "Burger", 650, 40, 30, 60);
        MenuItem lean = item("Chicken sandwich", "Burger", 650, 40, 60, 20);
        assertThat(SuggestionScorer.score(List.of(lean), LUNCH)).isGreaterThan(SuggestionScorer.score(List.of(fatty), LUNCH));
    }

    @Test
    void onceProteinIsCoveredScoringFocusesOnFittingTheBudget() {
        Remaining done = new Remaining(400, 0.0, null, null);
        MenuItem snack = item("Apple turnover", "Dessert", 280, 3, 38, 15);
        MenuItem huge = item("Burger", "Burger", 400, 30, 30, 20);
        assertThat(SuggestionScorer.score(List.of(snack), done)).isPositive();
        assertThat(SuggestionScorer.score(List.of(huge), done)).isPositive();
    }

    @Test
    void combosAreOneMainPlusOneSide() {
        MenuItem burger = item("Teen Burger", "Burger", 500, 27, 36, 30);
        MenuItem wrapped = item("Teen Burger (Lettuce-Wrapped)", "Burger", 340, 20, 9, 22);
        MenuItem papa = item("Papa Burger", "Burger", 580, 40, 35, 40);
        MenuItem eggs = item("Classic Bacon & Eggs", "Breakfast", 550, 30, 43, 27);
        MenuItem fries = item("Russet Thick-Cut Fries", "Side", 340, 5, 54, 18);
        MenuItem rings = item("Onion Rings", "Side", 520, 7, 50, 32);
        MenuItem hashBrown = item("Hash Brown", "Breakfast", 180, 2, 18, 11);
        MenuItem mayo = item("Chipotle Mayonnaise", "Side", 320, 1, 4, 40);

        assertThat(SuggestionScorer.goodPair(burger, fries)).isTrue();
        assertThat(SuggestionScorer.goodPair(eggs, hashBrown)).isTrue();   // side found by name
        assertThat(SuggestionScorer.goodPair(burger, wrapped)).isFalse(); // same dish
        assertThat(SuggestionScorer.goodPair(burger, papa)).isFalse();    // two mains
        assertThat(SuggestionScorer.goodPair(eggs, burger)).isFalse();    // two mains
        assertThat(SuggestionScorer.goodPair(fries, rings)).isFalse();    // two sides
        assertThat(SuggestionScorer.goodPair(burger, mayo)).isFalse();    // condiment
        assertThat(SuggestionScorer.goodPair(burger, burger)).isFalse();
    }

    @Test
    void baseNameIgnoresVariantInParentheses() {
        assertThat(SuggestionScorer.baseName("Grandpa Burger (With Cheese, Lettuce-Wrapped)")).isEqualTo("grandpa burger");
    }

    @Test
    void breakfastItemsWinInTheMorningAndLoseAtDinner() {
        MenuItem eggs = item("Bacon & Egger", "Breakfast", 400, 18, 30, 30);
        MenuItem burger = item("Papa Burger", "Burger", 580, 40, 35, 40);
        Remaining morning = new Remaining(700, 45.0, null, null, MealTime.BREAKFAST);
        Remaining evening = new Remaining(700, 45.0, null, null, MealTime.DINNER);
        assertThat(SuggestionScorer.score(List.of(eggs), morning)).isGreaterThan(SuggestionScorer.score(List.of(burger), morning));
        assertThat(SuggestionScorer.score(List.of(burger), evening)).isGreaterThan(SuggestionScorer.score(List.of(eggs), evening));
    }

    @Test
    void snacksPreferSmallerPortions() {
        Remaining snack = new Remaining(700, 10.0, null, null, MealTime.SNACK);
        MenuItem small = item("Apple turnover", "Dessert", 280, 3, 38, 15);
        MenuItem big = item("Royale meal", "Burger", 690, 10, 60, 40);
        assertThat(SuggestionScorer.score(List.of(small), snack)).isGreaterThan(SuggestionScorer.score(List.of(big), snack));
    }

    @Test
    void mealTimeParsesLeniently() {
        assertThat(MealTime.parse("Breakfast")).isEqualTo(MealTime.BREAKFAST);
        assertThat(MealTime.parse("brunch")).isNull();
        assertThat(MealTime.parse(null)).isNull();
    }

    @Test
    void topUpPrefersTheLightestItemThatCoversTheGap() {
        MenuItem light = item("Chicken strips", "Chicken", 300, 22, 15, 12);
        MenuItem heavy = item("Grandpa Burger", "Burger", 760, 53, 35, 58);
        MenuItem partial = item("Hash brown", "Side", 180, 2, 18, 11);
        double gap = 20;
        assertThat(SuggestionScorer.topUpScore(light, gap)).isGreaterThan(SuggestionScorer.topUpScore(heavy, gap));
        assertThat(SuggestionScorer.topUpScore(heavy, gap)).isGreaterThan(SuggestionScorer.topUpScore(partial, gap));
    }

    @Test
    void topUpRanksPartialItemsByProteinPerCalorie() {
        MenuItem lean = item("Egg whites", "Breakfast", 100, 12, 1, 1);
        MenuItem fatty = item("Cheese bites", "Side", 300, 12, 10, 25);
        assertThat(SuggestionScorer.topUpScore(lean, 60)).isGreaterThan(SuggestionScorer.topUpScore(fatty, 60));
    }
}
