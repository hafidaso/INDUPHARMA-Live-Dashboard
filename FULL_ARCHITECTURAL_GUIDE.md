# 🏛️ Full Architectural & Engineering Blueprint
## INDUPHARMA Live Dashboard - Integrated Pharma 4.0 Platform

**Level:** Senior Engineering / Academic Thesis Grade  
**Subject:** Full-Stack Real-Time Industrial Systems  

---

## 1. Internal Logic & Data Processing (`dataService.ts`)

### 1.1 The Normalization Engine
One of the most complex parts of the platform is the **Data Normalizer**. Raw data from IoT webhooks is often inconsistent (missing fields, stringified numbers, varying keys). 
- **Solution**: We implemented a robust transformation layer that uses "Candidate Detection" to find data regardless of whether it's wrapped in `data`, `result`, or root objects.
- **Helper: `resolveMeasureSummary`**: This function performs a "Deep Scan" of all recent measurements for a machine to find the most critical reading (e.g., if temperature is normal but pressure is critical, the machine status is set to critical).

### 1.2 The Maintenance Sync Algorithm
To solve the issue of data volatility, we built a **Capture-and-Merge** algorithm:
1. The system fetches live data.
2. It identifies completed actions (`status: 'done'`).
3. It compares these actions against the `LocalStorage` cache.
4. If an action is new, it is "injected" into the persistent history.
5. **Logic**: This ensures that even if the Google Sheet row is deleted, the Manager still has proof of work in the dashboard.

---

## 2. Frontend Engineering (`App.tsx`)

### 2.1 State Management & Performance
To keep the UI fluid while polling data every 3000ms, we used **Advanced React Memoization**:
- **`useMemo` for Filtering**: The 100+ lines of filtering logic for the "Machines" tab only re-runs when the search query or the raw data changes.
- **`useCallback` for Event Handlers**: Prevents unnecessary re-renders of complex components like the "Threshold Gauges".

### 2.2 Role-Based State Machine
The application operates as a finite state machine with 4 main states:
1. **Unauthenticated**: Renders the Glassmorphism login portal.
2. **Admin Authenticated**: Full access to KPIs, Thresholds, and Reporting.
3. **Technician Authenticated**: Simplified "Task-Only" interface focusing on rapid incident response.
4. **Error/Offline**: A fallback state that triggers when the Webhook is unreachable, providing a retry mechanism.

---

## 3. UI/UX Design System

### 3.1 Industrial Aesthetics
- **Palette**: We avoided standard "Bootstrap" colors. Instead, we used a curated **Slate & Indigo** palette with high-contrast semantic colors (Emerald-600 for Safe, Amber-600 for Warning, Red-600 for Critical).
- **Typography**: Optimized for readability in low-light industrial environments using high-weight (900) fonts for headers.

### 3.2 Visual Gauges (The compliance engine)
The "Seuils" gauges are not static images. They are **Dynamic Vector Components**:
- Built with `framer-motion`, they calculate the pointer position relative to the critical range in real-time.
- This provides "Pre-incident Awareness"—managers can see a value slowly creeping toward the red zone before an alarm even sounds.

---

## 4. Reporting & Export Engine

### 4.1 HTML-to-PDF Mapping
The "Exporter Rapport" feature doesn't just print the screen. It builds a **Virtual Document**:
1. It uses `html2canvas` to capture specific UI nodes (Charts, Tables).
2. It uses `jsPDF` to generate a multi-page document.
3. **Internal Logic**: It maps the company logo and metadata into fixed coordinates to ensure the report looks like a formal pharmaceutical certificate.

---

## 5. Security & Data Integrity

- **Role Isolation**: Technicians are restricted from seeing sensitive site KPIs and cannot modify threshold configurations.
- **Audit Integrity**: Every maintenance record is timestamped and linked to the unique technician ID/Email provided by the API.
- **Zero-Mock Policy**: 100% of the data rendered (except for the demo user accounts) is derived from the real-time JSON stream.

---

## 6. Summary of Engineering Effort
The INDUPHARMA platform is a result of integrating multiple disciplines:
- **Embedded Systems**: Understanding IoT sensor behavior.
- **Data Science**: Normalizing and filtering live streams.
- **Software Engineering**: Building a scalable, responsive React application.
- **Quality Assurance**: Implementing GMP compliance rules.

---
**This document serves as the final proof of architectural integrity for academic submission.**
