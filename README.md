# VanDrishti — FRA Decision Support & Cadastral WebGIS

AI-powered geospatial decision support platform for administering the Forest Rights Act (FRA 2006). VanDrishti combines an interactive WebGIS claims map, an analytics dashboard, statutory anomaly detection, and an AI copilot to help review and process forest land claims.

## Features

- **Interactive WebGIS map** of district boundaries and claims (Leaflet + marker clustering)
- **Claims dashboard** with filtering by state, district, claim type, and status
- **Anomaly detection queue** for flagging statutory issues in claims
- **AI copilot** for claim review assistance (powered by Google Gemini)
- **Export service** for generating reports from claims data

## Tech Stack

This is a **client-side-only, framework-free** application — no React/Vue, no backend server, and no database. All data lives in static JS/JSON/CSV files bundled at build time, and the "backend" logic (anomaly detection, analytics, exports) runs entirely in the browser.

- **[Vite](https://vitejs.dev/)** — dev server and bundler. `vite.config.js` injects the Gemini API key from the environment into the client bundle at build time via `import.meta.env.VITE_GEMINI_API_KEY`.
- **Vanilla JavaScript (ES modules)** — no UI framework. The app is structured as a single `FRAVisionApp` orchestrator class (`src/main.js`) that wires together a set of controller classes, each owning one screen/widget and talking directly to the DOM.
- **[Leaflet](https://leafletjs.com/)** + **Leaflet.markercluster** — renders the WebGIS map: district boundary polygons (GeoJSON) and clustered claim markers, with click-through into claim details.
- **[Chart.js](https://www.chartjs.org/)** — powers the dashboard's charts/graphs (claim status breakdowns, district analytics, etc.).
- **Google Gemini API** (`gemini-3.6-flash`) — called directly from the browser (`src/services/aiService.js`) via `fetch` to `generativelanguage.googleapis.com` for the AI copilot. If no API key is configured (or the request fails), the service falls back to a local deterministic rules/knowledge-base engine (`src/data/knowledgeBase.js`) so the copilot still functions offline.
- **Plain CSS** (`src/style.css`) — no CSS framework/preprocessor.

### Architecture at a glance

- `main.js` — application state (filters, pagination, selected claims) and orchestration; instantiates and coordinates all services/controllers.
- `services/` — pure logic, no DOM: `aiService.js` (Gemini + fallback), `anomalyEngine.js` (statutory anomaly rules + district analytics), `exportService.js` (report/CSV generation).
- `components/` — DOM controllers, one per UI area: map, dashboard, anomaly queue, claim modal, AI copilot panel, home portal landing page.
- `data/` (in `src/`) — in-memory datasets and static reference data (claims generator, district boundaries, legal knowledge base) consumed by the services/components.
- `data/` (at repo root) — raw source data files (`thane_district.geojson`, `thane_fra_claims.csv`) that back the generated datasets above.

## Getting Started

### Prerequisites

- Node.js and npm

### Installation

```bash
npm install
```

### Environment Variables

Copy `.env.example` to `.env` and add your Gemini API key:

```bash
cp .env.example .env
```

```
GEMINI_API_KEY=your_api_key_here
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
  components/   UI controllers (map, dashboard, anomaly queue, claim modal, AI copilot, home portal)
  data/         Static/generated datasets (claims, district boundaries, knowledge base)
  services/     Business logic (AI service, anomaly engine, export service)
  main.js       Application orchestrator
data/           Source GeoJSON and CSV datasets
public/         Static assets (fonts, logo)
```
