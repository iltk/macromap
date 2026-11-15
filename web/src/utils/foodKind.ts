export type FoodKind =
  | "burger" | "breakfast" | "fries" | "chicken" | "wrap" | "salad" | "pizza" | "taco"
  | "sushi" | "coffee" | "drink" | "dessert" | "soup" | "plate";

// First match wins: name rules before section rules, specific before general.
const RULES: [FoodKind, RegExp][] = [
  ["fries", /fries|onion rings|poutine|hash ?brown|tots|wedges/i],
  ["coffee", /coffee|latte|espresso|cappuccino|americano|mocha|\btea\b|double-double/i],
  ["drink", /drink|soda|pop\b|juice|lemonade|shake|smoothie|float|root beer|beverage|cola|water|iced capp/i],
  ["dessert", /dessert|donut|doughnut|timbits|cookie|muffin|turnover|pie\b|sundae|cone|brownie|cake|lollipop|bakery|baked|pancake|waffle/i],
  ["breakfast", /breakfast|egg|bacon &|sausage &|omelet|bagel|croissant|oat|porridge/i],
  ["sushi", /sushi|nigiri|maki|roll\b|sashimi/i],
  ["taco", /taco|burrito|quesadilla|nacho|guacamole|chips/i],
  ["pizza", /pizza|slice/i],
  ["chicken", /chicken|nugget|tender|wing|strips/i],
  ["wrap", /\bwraps?\b|sandwich|\bsub\b|panini|melt|club/i],
  ["salad", /salad|bowl/i],
  ["soup", /soup|chili|stew/i],
  ["burger", /burger|cheeseburger|whopper|big mac|patty|mozza|teen|papa|mama|baby|buddy|grandpa/i],
];

/** Best-guess kind of food from an item's name and menu section (for placeholder drawings). */
export function foodKind(name: string, section?: string | null): FoodKind {
  for (const [kind, re] of RULES) if (re.test(name)) return kind;
  if (section) for (const [kind, re] of RULES) if (re.test(section)) return kind;
  return "plate";
}
