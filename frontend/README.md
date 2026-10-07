# TerraMetric frontend

An optional visualization layer for the Geospatial File Measurement API. The backend remains the source of truth for upload status, CRS selection, geometries, attributes, and measurements.

## Stack

React and TypeScript build the UI, Vite runs the development server, Tailwind CSS supplies utilities, React Router handles page navigation, Leaflet/react-leaflet draws GeoJSON, and Lucide React supplies icons. `fetch` is the typed HTTP client. No backend data is mocked or hardcoded.

## Development

Start the FastAPI backend from the repository root:

```bash
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In another terminal:

```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`. Vite uses port 5173; the backend allows `http://localhost:5173` and `http://127.0.0.1:5173` through CORS. Use a recent Node.js release supported by Vite (Node 20+).

To override the API address, copy `.env.example` to `.env` and set `VITE_API_BASE_URL`. The default is `http://127.0.0.1:8000`. Do not put secrets in Vite environment variables; they are bundled into browser code.

## Pages and architecture

- `/` dashboard: real file and feature counts, geometry totals derived from completed file measurements, recent datasets, and last upload.
- `/upload`: drag-and-drop or picker for `.kml` and `.zip`, client-side file feedback, server processing state, and a result panel.
- `/files`: search and format filtering across all records fetched through backend `limit`/`offset` pagination, with a paginated table.
- `/files/:id`: Leaflet map, selectable GeoJSON features, metadata, CRS explanation, property table, and measurement details.

`src/services/api.ts` owns HTTP calls and structured error messages. `src/types/api.ts` describes backend responses. `src/components` contains the shell, map, and reusable UI. `src/utils/format.ts` holds display formatting and geometry grouping.

The map requests OpenStreetMap basemap tiles at runtime with OpenStreetMap attribution and applies a dark visual treatment. If internet access to the tile provider is unavailable, feature vectors still render over a dark grid background. The frontend sends original GeoJSON coordinates to Leaflet; it displays metric measurements already calculated by the backend.

## Build and checks

```bash
npm run typecheck
npm run build
```

The build performs TypeScript checking before Vite bundles production assets into ignored `dist/`. The frontend has no lint script or separate UI test framework; the verified quality gates are typechecking, production build, backend regression tests, and a live browser walkthrough.
