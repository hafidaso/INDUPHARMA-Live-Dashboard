# INDUPHARMA Live Dashboard

A real-time industrial monitoring dashboard built for pharmaceutical manufacturing environments. Provides GMP-compliant machine surveillance, incident management, maintenance tracking, and KPI analytics — all powered by live data from Google Sheets.

---

## Features

| Tab | Description |
|---|---|
| **Vue Globale** | KPI summary cards, machine status map, AI maintenance recommendations, on-call technician panel, live incident table |
| **Machines** | Equipment catalog with status indicators and a slide-in detail panel per machine |
| **Capteurs** | Real-time sensor charts — pressure (bar), vibration (mm/s), infrared, and temperature (°C) |
| **Incidents** | Workflow timeline per incident: detection → acknowledgment → intervention → resolution |
| **Maintenance** | Full maintenance action journal with technician assignment and timestamps |
| **KPIs** | Downtime trends, MTTR by equipment, per-machine breakdown (MTBF, incident count, closure rate) |
| **Seuils** | GMP critical threshold configuration (min / max / critical) per sensor type |
| **Techniciens** | On-call technician directory with real-time availability status |

**Auto-refresh:** data is polled every 10 seconds.

---

## Tech Stack

- **React 19** + **TypeScript**
- **Vite 6** (dev server on port 3000)
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **Recharts** — area, bar, and line charts
- **Motion (Framer Motion)** — animated tab transitions and slide-in panels
- **Lucide React** — icons
- **PapaParse** — CSV parsing utility (available for data imports)
- **@google/genai** — Gemini AI SDK (wired for future AI assistant features)

---

## Data Model

```
Machine          → id, name, type, location, status
Technician       → id, name, role, email, phone, is_available
SensorReading    → machine_id, device_id, temperature, pressure, vibration, infrared, status, severity
Threshold        → machine_id, sensor_type, min_value, max_value, critical_value, unit
Incident         → machine_id, severity, description, status, root_cause, created_by (auto | manual)
MaintenanceAction→ incident_id, technician_id, action_taken, started_at, completed_at, notes
KpiLog           → machine_id, date, downtime_minutes, mtbf_hours, mttr_minutes, incident_count, closure_rate
```

---

## Getting Started

**Prerequisites:** Node.js 18+

1. Install dependencies:
   ```bash
   npm install
   ```

2. Copy the environment file and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```

3. Run the development server:
   ```bash
   npm run dev
   ```
   The app will be available at [http://localhost:3000](http://localhost:3000).

---

## Connecting to Google Sheets (Live Data)

The dashboard ships with realistic **mock data** and works out of the box. To switch to live data:

1. Create a Google Sheets workbook with the following sheets:
   `machines`, `technicians`, `thresholds`, `sensor_readings`, `incidents`, `maintenance_actions`, `kpi_logs`

2. Deploy a **Google Apps Script** web app that exposes each sheet as a JSON endpoint (e.g. `?action=machines`).

3. Paste the deployed Apps Script URL into `src/services/dataService.ts`:
   ```ts
   export const SHEET_CONFIG = {
     endpointUrl: "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",
     refreshIntervalMs: 10000
   };
   ```

When `endpointUrl` is set, the header badge switches from **"Google Sheet Ready"** to **"Connected to Google Sheet"**.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server on port 3000 |
| `npm run build` | Production build to `dist/` |
| `npm run preview` | Preview the production build |
| `npm run lint` | TypeScript type-check (no emit) |
| `npm run clean` | Remove `dist/` folder |

---

## Status Semantics

| Status | Color | Applies to |
|---|---|---|
| `active` / `normal` / `closed` | Emerald | Machine, sensor, incident |
| `maintenance` / `warning` / `in_progress` | Amber | Machine, sensor, incident |
| `en_panne` / `critical` / `open` / `escalated` | Red | Machine, sensor, incident |
| `inactive` / `error` | Slate | Machine, sensor |

---

## License

Apache-2.0
