package ca.macromap.api.search;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * A parsed search: free-text words plus optional macro filters taken from phrases like
 * "high protein", "low carb", "under 400 cal", "<400", "30g protein".
 *
 * @param words      normalised, singularised words that must all appear
 * @param collapsed  the text part with spaces/punctuation removed ("big mac" -> "bigmac")
 */
public record SearchQuery(List<String> words, String collapsed, Integer maxCalories, Double minProtein, Double maxCarbs) {

    private static final Pattern UNDER_CAL = Pattern.compile("(?:under|below|less than|max|<=?)\\s*(\\d{2,4})\\s*(?:k?cal(?:ories)?)?");
    private static final Pattern MIN_PROTEIN = Pattern.compile("(\\d{1,3})\\s*g?\\s*\\+?\\s*(?:of\\s+)?protein");

    public static SearchQuery parse(String raw) {
        String q = raw == null ? "" : raw.toLowerCase(Locale.ROOT).strip();
        Integer maxCal = null;
        Double minProtein = null;
        Double maxCarbs = null;

        Matcher m = UNDER_CAL.matcher(q);
        if (m.find()) {
            maxCal = Integer.parseInt(m.group(1));
            q = m.replaceFirst(" ");
        }
        m = MIN_PROTEIN.matcher(q);
        if (m.find()) {
            minProtein = Double.parseDouble(m.group(1));
            q = m.replaceFirst(" ");
        }
        if (q.contains("high protein")) {
            minProtein = minProtein == null ? 30.0 : minProtein;
            q = q.replace("high protein", " ");
        }
        if (q.contains("low carb")) {
            maxCarbs = 20.0;
            q = q.replace("low carb", " ");
        }
        if (q.contains("low cal")) {
            maxCal = maxCal == null ? 400 : maxCal;
            q = q.replaceAll("low cal(orie)?s?", " ");
        }

        List<String> words = new ArrayList<>();
        for (String w : normalise(q).split(" ")) {
            if (!w.isBlank()) words.add(singular(w));
        }
        return new SearchQuery(words, normalise(q).replace(" ", ""), maxCal, minProtein, maxCarbs);
    }

    public boolean hasText() {
        return !words.isEmpty();
    }

    public boolean hasMacroFilter() {
        return maxCalories != null || minProtein != null || maxCarbs != null;
    }

    /** Lower-case, letters/digits only, single spaces ("Teen Burger (Lettuce-Wrapped)" -> "teen burger lettuce wrapped"). */
    public static String normalise(String s) {
        return s.toLowerCase(Locale.ROOT).replace("&", " and ").replaceAll("[^a-z0-9]+", " ").strip();
    }

    /** Very small English singulariser, good enough for menu words ("nuggets", "fries", "patties"). */
    static String singular(String w) {
        if (w.length() <= 3) return w;
        if (w.endsWith("ies")) return w.substring(0, w.length() - 3) + "y";
        if (w.endsWith("ses") || w.endsWith("xes") || w.endsWith("ches") || w.endsWith("shes")) return w.substring(0, w.length() - 2);
        if (w.endsWith("s") && !w.endsWith("ss")) return w.substring(0, w.length() - 1);
        return w;
    }

    /**
     * 0 = no match; higher = better. All words must appear (each matched as a singularised token prefix),
     * or the spaceless query must appear in the spaceless text ("bigmac").
     */
    public int matchScore(String text) {
        if (!hasText()) return 1;
        String norm = normalise(text);
        List<String> tokens = new ArrayList<>();
        for (String t : norm.split(" ")) tokens.add(singular(t));
        boolean all = words.stream().allMatch(w -> tokens.stream().anyMatch(t -> t.startsWith(w)));
        boolean collapsedHit = !collapsed.isEmpty() && norm.replace(" ", "").contains(collapsed);
        if (!all && !collapsedHit) return 0;
        int score = 10;
        if (norm.startsWith(String.join(" ", words)) || norm.replace(" ", "").startsWith(collapsed)) score += 10;
        if (all) score += 5;
        if (!words.isEmpty() && norm.startsWith(words.get(0))) score += 3; // "teen lettuce": Teen Burger before Double Teen
        return score;
    }
}
