# MacroMap

Find fast food near you and see the calories and macros for everything on the menu.
Plan an order before you buy it and keep a simple log of what you eat.

- `api/` Spring Boot 4 (Java 21), Postgres, Flyway
- `web/` React 19, TypeScript, Vite, Tailwind, MapLibre
- `scripts/` seed data: OpenStreetMap locations and menu nutrition (see `scripts/README.md`)

## Running locally

You need Docker, Java 21+ and Node.

```bash
cp .env.example .env              # database settings
docker compose up -d              # Postgres + PostGIS

cd api
set -a; source ../.env; set +a
./mvnw spring-boot:run            # http://localhost:8080, migrations and seed data run on start

cd ../web
echo "VITE_MAPTILER_KEY=your-key" > .env.local   # free key at cloud.maptiler.com
npm install
npm run dev                       # http://localhost:5173
```

## Tests

```bash
cd api && ./mvnw test             # needs the database running
cd web && npm run lint && npm run build
```

## Data

Restaurant locations © OpenStreetMap contributors (ODbL). Nutrition values come from the
chains' published information and are approximate.
