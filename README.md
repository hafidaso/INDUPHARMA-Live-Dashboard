# INDUPHARMA Live Dashboard

Operational dashboard for live pharmaceutical equipment monitoring, incident visibility, and exportable production reports.

## Overview

This project is a React + TypeScript single-page dashboard that:

- fetches live equipment status from a webhook endpoint
- normalizes inconsistent payload formats
- derives dashboard KPIs and views from the normalized response
- refreshes automatically every 3 seconds
- exports a branded PDF report with logo and snapshot tables

## Data Architecture (Webhook-Only)

The app uses only the production webhook (no Google Sheets fallback, no mock fallback in the live path):

- Upstream endpoint:  
  `https://fusion-ai-api.medifus.dev/webhooks/webhook-vug2y2v8zf6cu492khq7g3o0/api/production/status`
- Production client fetch target:  
  `GET /api/production-status` (Vercel serverless proxy)
- Local development fetch target:  
  direct fetch to the upstream endpoint

### Why the proxy exists

`api/production-status.js` provides:

- server-side fetch to avoid frontend CORS issues in production
- parsing of nested stringified JSON (`meta`, `equipements`) when webhook tools serialize objects as strings
- shape validation with explicit `502` diagnostics when payload is invalid

## Expected Payload

```json
{
  "meta": {
    "generated_at": "2026-04-28T15:31:38.414Z",
    "nb_equipements": 2,
    "equipements_ok": 2,
    "equipements_alerte": 0,
    "nb_alertes_total": 0
  },
  "equipements": [
    {
      "equipement_id": "a0eebc99-...",
      "code_machine": "M02",
      "nom": "Autoclave M02",
      "zone_production": "Zone A - Ligne 1",
      "type_equipement": "stérilisation",
      "criticite_gmp": "critique",
      "statut": "active",
      "nb_alertes_ouvertes": 0,
      "etat_global": "ok",
      "mesures_recentes": []
    }
  ]
}
```

Accepted by normalization logic as well:

- wrapped payloads like `{ data: { ... } }` or `{ result: { ... } }`
- `meta` and/or `equipements` passed as JSON strings
- equipment aliases (`id`, `name`, `type`, `location`, `status`, `open_alerts`, `state`)

## UI Sections

The dashboard includes these tabs:

- `Vue Globale`
- `Machines`
- `Capteurs`
- `Incidents`
- `Maintenance`
- `KPIs`
- `Seuils`
- `Techniciens`

Notes on current webhook mapping:

- `machines`, `incidents`, `kpiLogs`, `machineView`, and KPI summary are derived from `equipements`.
- `technicians`, `maintenanceActions`, and `thresholds` are currently empty unless your webhook is extended to provide corresponding entities.
- sensor history charts are generated dynamically from latest readings to provide trend context.

## PDF Export

The **Exporter Rapport** action generates a client-side PDF via `jsPDF`:

- report ID + timestamp
- last refresh info
- KPI cards (active machines, open incidents, available technicians)
- equipment snapshot table (paginated if needed)
- embedded `/logo.png` when available (fallback to no-logo export if loading fails)

## Project Structure

- `src/App.tsx` - main UI, tabs, chart rendering guards, refresh loop, PDF export
- `src/services/dataService.ts` - fetch, normalization, mapping to dashboard data model
- `src/types.ts` - TypeScript domain models
- `api/production-status.js` - production proxy + payload guardrails
- `vite.config.ts` - build and dev server configuration

## Tech Stack

- React 19
- TypeScript
- Vite 6
- Tailwind CSS v4
- Recharts
- Motion
- jsPDF
- Vercel serverless functions

## Run Locally

Prerequisite: Node.js 18+

```bash
npm install
npm run dev
```

App URL: `http://localhost:3000`

## Build and Scripts

- `npm run dev` - start dev server on port 3000
- `npm run build` - build production bundle
- `npm run preview` - preview built app
- `npm run lint` - TypeScript type-check (`tsc --noEmit`)
- `npm run clean` - remove `dist`

## Deployment Notes

- Deploy on Vercel so `/api/production-status` is available.
- The frontend uses `/api/production-status` in production and direct webhook calls on localhost.
- `vite.config.ts` sets `chunkSizeWarningLimit` to reduce noisy bundle warnings during builds.

## Troubleshooting

- **No data visible**: open `/api/production-status` on deployed domain and verify it returns valid JSON.
- **`Production payload has no valid equipements array`**: webhook returned incompatible structure after normalization.
- **`runtime.lastError: Could not establish connection`**: usually from browser extensions, not dashboard runtime code.
- **Recharts width/height warning**: guarded by `SafeChartContainer`; if it appears, verify parent containers are visible and have non-zero height.
- **Old JS asset 404 after deploy**: clear browser cache / hard refresh to load new Vite hashed assets.

## License

Apache-2.0

## Team

M. Kassi · M. Ezzi · H. Belayd · M. Mabrouk
