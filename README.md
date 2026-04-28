# INDUPHARMA Live Dashboard

Operational dashboard for live pharmaceutical equipment monitoring, incident visibility, and exportable production reports.

## Overview

This project is a React + TypeScript single-page dashboard designed for pharmaceutical production monitoring. It integrates real-time telemetry from industrial equipment with a technician workflow management system.

### Key Features

- **Live Monitoring**: Fetches equipment status from a secure webhook every 3 seconds.
- **Critical Alert System**: Real-time audio and visual alarms for `GMP_critique` failures.
- **Smart Workflow Sync**: Local synchronization between technician actions and the visual machine map.
- **100% Real Data**: Zero manual/mock data; all charts and KPIs are derived strictly from the JSON payload.
- **AI Recommendation Engine**: Rule-based maintenance suggestions for detected faults.
- **Professional PDF Reporting**: Branded reports with zone-based productivity analysis.

## Project Structure

- `src/App.tsx`: Main application logic, including the state machine, role-based UI, and PDF generation.
- `src/services/dataService.ts`: Core data pipeline. Handles fetching, normalization, and strict data integrity checks.
- `src/types.ts`: TypeScript interfaces defining the domain models (Machine, Incident, Technician, etc.).
- `api/production-status.js`: Vercel serverless function used as a proxy to handle CORS and pre-process stringified JSON from webhooks.

## Data Architecture

The dashboard is strictly driven by a single JSON production webhook. It uses no internal database, relying on the payload and local state for persistence.

- **Upstream Webhook**: `https://fusion-ai-api.medifus.dev/webhooks/...`
- **Proxy Layer**: `api/production-status.js` handles shape validation and payload parsing.

### Data Integrity Policy
As of the latest update, the application has **zero simulated data**:
- **Charts**: Only display actual historical points provided in the `mesures_recentes` field.
- **KPIs**: Derived strictly from current equipment states (Active/Alert).

## Alert & Notification System

The dashboard features a high-priority alert system for critical incidents:
- **Visual Alert**: A red modal with a bounce animation covers the screen for critical faults.
- **Audio Alarm**: A sharp alarm sound triggers to notify staff who are not monitoring the screen.
- **Acknowledge Logic**: Notifications respect the technician workflow; once a task is marked as "Done" or "In Progress", the alarm silences for that incident.

## PDF Export

The **Exporter Rapport** function generates a comprehensive operational snapshot:
- **Branded Header**: Uses the company logo and unique Report ID.
- **Performance par Zone**: A dedicated table showing machine availability and productivity percentage for each production area.
- **Snapshot Table**: Detailed status of critical equipment at the time of export.
- **AI Recommendations**: Summarized maintenance advice for active incidents.

## Access Control (Demo)

The dashboard includes a demo authentication system:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@indupharma.local` | `admin123` |
| **Technician** | `tech@indupharma.local` | `tech123` |

## Tech Stack

- **Framework**: React 19 + Vite 6
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4
- **Visuals**: Recharts (Charts), Lucide (Icons), Framer Motion (Animations)
- **PDF**: jsPDF
- **Deployment**: Vercel (Serverless Functions)

## Getting Started

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```
2. **Start the development server**:
   ```bash
   npm run dev
   ```
3. **Open the app**: `http://localhost:3000`

### Build

```bash
npm run build
```

## Deployment

Deploy on Vercel to ensure the serverless proxy in `/api` functions correctly. Ensure that the `logo.png` is present in the root or public folder for PDF generation.

## License

Apache-2.0

## Team

M. Kassi · M. Ezzi · H. Belayd · M. Mabrouk
