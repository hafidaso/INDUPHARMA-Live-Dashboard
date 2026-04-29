# 📑 Comprehensive Technical & Operational Documentation
## INDUPHARMA Live Dashboard - Enterprise Edition

**Project Scope:** Pharma IoT Monitoring & Workflow Management  
**Version:** 2.1 (Stable Production)  
**Authors:** M. Kassi, M. Ezzi, H. Belayd, M. Mabrouk  

---

## 1. Executive Summary
The **INDUPHARMA Live Dashboard** is a mission-critical web application designed for the pharmaceutical industry. It transforms raw sensor telemetry from Google Sheets/IoT Webhooks into a high-fidelity, real-time command center. The system is built on **React 19** and optimized for **Industrial Tablets**, ensuring zero-latency monitoring and GMP (Good Manufacturing Practice) compliance.

---

## 2. System Architecture & Data Flow

### 2.1 High-Level Architecture
1. **IoT Edge / Google Sheets**: Sensors push data to a centralized sheet.
2. **AppScript Webhook**: Acts as the API gateway, serving a JSON payload.
3. **Data Normalization Engine (`src/services/dataService.ts`)**: Cleans, maps, and validates incoming data.
4. **React Frontend**: Renders a role-based UI with real-time state updates.

### 2.2 Data Integrity Layer
The dashboard implements a **Strict Mapping Strategy**:
- **Sanitization**: All strings and numbers from the API are sanitized to prevent crashes.
- **Fallbacks**: If a sensor fails, the system displays "N/A" rather than crashing, maintaining dashboard availability.
- **Persistence**: Incident history is synchronized with the browser's `localStorage`, ensuring data survives session reloads.

---

## 3. Detailed Functional Modules

### 3.1 Global View (Command Center)
- **KPI Summary**: Real-time cards showing overall site health (Active vs Alert machines).
- **Machine Map**: A grid view of all equipment. 
- **Smart Priority Sorting**: Machines with `alerte` or `en_panne` status are automatically hoisted to the top using a custom array sorting algorithm in the `useMemo` hook.

### 3.2 GMP Compliance Monitor (Seuils)
This module is the core of pharma quality control.
- **Visual Gauges**: Implemented using `framer-motion` to show the position of live values within a safety spectrum.
- **Industrial Standards**:
    - **Autoclaves**: Validated ranges for 121°C sterilization.
    - **Cold Storage**: Strict 2°C-8°C refrigerated storage limits (USP <659>).
    - **Mixers/Coaters**: Humidity and vibration limits to prevent product degradation.

### 3.3 Maintenance Audit Log (Persistence)
- **Problem**: Live APIs often clear finished tasks to save bandwidth.
- **Solution**: The dashboard "captures" completed tasks and moves them into a persistent history array stored in the user's browser. This creates a local audit trail for production managers.

### 3.4 Technician Workflow
- **Role-Based Access**: Technicians see a prioritized queue of assigned tasks.
- **Real-Time Acknowledgement**: Clicking "In Progress" or "Done" updates the global machine map instantly, silencing active alarms.
- **Historique**: A dedicated history view allows technicians to review past work and reopen tasks if necessary.

### 3.5 Fusion AI Engine (Predictive Maintenance)
- **Hybrid Intelligence**: Combines deterministic GMP rules with the **Fusion AI (Gemini 1.5)** engine.
- **Strategic Analysis**: Analyzes factory-wide telemetry to provide deep-dive maintenance recommendations on demand.
- **Resilience**: Features a multi-model fallback system (v1/v1beta) to ensure AI availability.

### 3.6 Real-Time Escalation Matrix
- **Critical Response Path**: Automatically escalates unacknowledged incidents through 4 organizational levels (Technician -> Supervisor -> Manager -> CEO).
- **Persistent Tracking**: Uses `localStorage` discovery timestamps to ensure escalation timers remain accurate across page refreshes.

### 3.7 Operational SLA Monitor
- **Service Level Metrics**: Tracks Mean Time To Acknowledge (MTTA) and system latency using actual millisecond-precision interaction logs.
- **Live Efficiency**: Visualizes factory throughput and maintenance speed in real-time.

### 3.8 Financial Impact Estimator
- **Downtime Costing**: Calculates the direct financial loss of equipment downtime based on **ICH Q9 Quality Risk Management**.
- **Contextual Pricing**: Adjusts impact based on machine criticality and production stage (Sterilization vs. Packaging).

---

## 4. User Manual (Step-by-Step)

### 🛰️ For the Production Manager (Admin)
1. **Overview**: Monitor the "Vue Globale" for red alert cards.
2. **Analysis**: Use the "Capteurs" tab to see historical trends (Line/Area charts) for any machine.
3. **Compliance**: Check the "Seuils" tab to ensure no sensor is approaching the "Critical Zone" (Red).
4. **Reporting**: Click "Exporter Rapport" to generate a PDF for shift handovers.
5. **Search**: Use the global search bar to isolate a specific equipment code (e.g., "E06").

### 🔧 For the Maintenance Technician
1. **Login**: Use technician credentials.
2. **Task Queue**: View the prioritized list of alerts.
3. **Execution**: Mark tasks as "In Progress" to notify the manager.
4. **Completion**: Mark as "Done" to archive the incident and clear the alarm.

---

## 5. Technical Specifications

### 5.1 API Payload Structure (JSON)
The system expects a webhook response with the following schema:
```json
{
  "meta": { "generated_at": "ISO-Timestamp", "nb_equipements": 10 },
  "equipements": [
    {
      "equipement_id": "UUID",
      "nom": "Machine Name",
      "etat_global": "ok | alerte",
      "mesures_recentes": [
        { "type_mesure": "temperature", "valeur": 25, "unite": "°C" }
      ]
    }
  ]
}
```

### 5.2 Technology Stack
- **Framework**: React 19 (Main UI)
- **Build System**: Vite 6 (Fast Refresh)
- **Styling**: Tailwind CSS v4 (Industrial Dark/Light theme)
- **Persistence**: Web Storage API (LocalStorage)
- **Animations**: Framer Motion (Real-time Gauge Movement)
### 5.3 AI Reasoning Layer (Fusion AI)
- **Engine**: Google Gemini 1.5 (Pro & Flash)
- **Logic**: Recursive fallback loop across endpoints:
  1. `v1beta/gemini-1.5-flash-latest`
  2. `v1beta/gemini-1.5-flash`
  3. `v1/gemini-1.5-flash`
  4. `v1/gemini-pro`
- **Prompt Engineering**: Role-defined as "Fusion AI Expert" with a focus on GMP/FDA regulatory compliance.

---

## 6. Maintenance & Troubleshooting
- **Build Errors**: Ensure all JSX tags are properly closed; common during complex UI edits.
- **Data Not Updating**: Check the browser console for CORS or Webhook URL errors.
- **Resetting History**: Clear browser `localStorage` to reset the persistent maintenance history.

---

---

## 8. Regulatory References & Standards Compliance

The logic implemented in the INDUPHARMA Dashboard is aligned with the following global pharmaceutical and industrial standards:

### 8.1 Quality Risk Management (Cost Impact Logic)
- **[ICH Q9 Quality Risk Management](https://www.ema.europa.eu/en/documents/scientific-guideline/ich-q9-quality-risk-management-step-5_en.pdf)**: Foundation for the weighted risk multipliers used in the Cost Impact Estimator.
- **[ISPE Guide: Maintenance](https://ispe.org/publications/guidance-documents/maintenance)**: Best practices for industrial asset management in GMP environments.
- **[WHO TRS No. 961, Annex 9](https://apps.who.int/iris/handle/10665/44543)**: Guide to good storage practices for pharmaceuticals.

### 8.2 Data Integrity (Persistence & Audit Logs)
- **[FDA 21 CFR Part 11](https://www.fda.gov/regulatory-information/search-fda-guidance-documents/part-11-electronic-records-electronic-signatures-scope-and-application)**: Guidelines for electronic records and audit trails, ensuring data reliability.
- **[EMA Annex 11 (Computerised Systems)](https://www.ema.europa.eu/en/documents/scientific-guideline/annex-11-computerised-systems_en.pdf)**: European regulations for data integrity in manufacturing.
- **[ALCOA+ Principles](https://www.who.int/publications/m/item/annex-5-guidance-on-good-data-and-record-management-practices)**: Ensuring data is Attributable, Legible, Contemporaneous, Original, and Accurate.

### 8.3 Equipment Specific Standards (Threshold Gauges)
- **[ISO 17665 (Moist Heat Sterilization)](https://www.iso.org/standard/36732.html)**: Reference for Autoclave temperature/pressure validation (Standard hold: 121-124°C).
- **[EN 285:2015](https://www.en-standard.eu/din-en-285-sterilization-steam-sterilizers-large-sterilizers/)**: Performance requirements and test methods for large steam sterilizers.
- **[USP <659> Packaging and Storage](https://www.usp.org/sites/default/files/usp/document/our-work/customized-outreach/packaging-storage-requirements.pdf)**: Strict reference for Cold Room (2-8°C) and Controlled Room Temperature (CRT) monitoring.

---

## 9. Conclusion
The **INDUPHARMA Live Dashboard** represents a significant step towards Industry 4.0 for pharmaceutical manufacturing. By combining real-time telemetry with academic-grade documentation and industrial compliance standards, the project fulfills all operational and educational requirements.

---
**License**: Apache-2.0  
**Repository**: [INDUPHARMA Live Dashboard](https://github.com/hafidaso/INDUPHARMA-Live-Dashboard)
