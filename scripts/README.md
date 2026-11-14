# Data scripts

Seed data is generated into Flyway **repeatable** migrations (`R__*.sql`), so editing the inputs and
re-running the build re-seeds the database on the next API start (Flyway re-runs an `R__` file whenever
its checksum changes).

| Step | Command | Output |
|---|---|---|
| Refresh Toronto locations from OpenStreetMap | `python3 scripts/fetch_osm_locations.py` | `scripts/data/toronto_locations.json` |
| Build seed SQL | `python3 scripts/build_seed.py` | `api/src/main/resources/db/migration/R__1_…`, `R__2_…` |

## Menus

* `api/aw_nutrition.xlsx` → regenerated into `data/menus/aw.csv` on every build.
* `data/menus/mcdonalds.csv`, `data/menus/tim-hortons.csv`: **fill these in** from the official
  Canadian nutrition pages. Columns:

  `menu_category,name,serving_g,calories,fat_g,protein_g,carbs_g,source,last_verified,allergens,image_url,description`

  e.g. `Burger,Big Mac,,,,,,https://www.mcdonalds.com/ca/en-ca/product/big-mac.html,2026-11-14,milk;egg;wheat;soy;sesame;mustard`

* `allergens` (also in `aw.csv`, kept across spreadsheet re-imports): copy **only** from the chain's official
  allergen guide. Leave blank when unknown (the app then never shows the item as safe), write `none` when the guide
  lists no allergens, otherwise `;`-separated codes from: `milk egg wheat soy sesame mustard peanut treenut fish
  shellfish sulphites`.

To add a chain: add it to `RESTAURANTS` in `build_seed.py` and `CHAINS` in `fetch_osm_locations.py`
(using its `brand:wikidata` id), then run both scripts.

Location data © OpenStreetMap contributors, ODbL.

## Images

* `image_url` (menu CSVs, kept across xlsx re-imports): a full URL or an app path such as
  `/images/menu/aw/teen-burger.jpg` (files in `web/public/images/...`). Use images you have the rights to.
  Items without one show a neutral placeholder.
* Restaurant logos: the last field of each `RESTAURANTS` entry in `build_seed.py` (`None` = coloured monogram).
