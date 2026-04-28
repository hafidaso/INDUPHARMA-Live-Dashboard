# 📑 Technical Documentation: INDUPHARMA Live Dashboard

**Course/Project:** Industrial IoT & Operational Dashboards  
**Authors:** M. Kassi, M. Ezzi, H. Belayd, M. Mabrouk  
**Date:** April 2026  

---

## 1. Abstract
The **INDUPHARMA Live Dashboard** is a high-performance web application designed for real-time monitoring of pharmaceutical manufacturing processes. By integrating IoT telemetry with automated compliance checking (GMP), the system provides maintenance teams and factory managers with immediate visibility into equipment health, incident workflows, and operational efficiency.

## 2. Problem Statement
In pharmaceutical manufacturing, maintaining a "Validated State" is critical. Traditional monitoring methods often suffer from:
- **Latency**: Delayed response to critical sensor failures.
- **Data Silos**: Difficulty in bridging the gap between machine logs and technician workflows.
- **Compliance Risks**: Manual tracking of GMP (Good Manufacturing Practice) thresholds.
- **Audit Gaps**: Loss of intervention history during session resets.

## 3. Proposed Solution
Our solution leverages modern web technologies (React 19, Vite, Tailwind v4) to create a **Real-Time Digital Twin** of the production floor. The dashboard automates compliance monitoring through visual gauges, ensures data persistence via LocalStorage sync, and facilitates rapid decision-making with AI-driven recommendations.

## 4. System Architecture
The system follows a **Decoupled Client-Proxy Architecture**:

### 4.1 Frontend Layer (React 19)
- **State Management**: Utilizes React Hooks (`useState`, `useMemo`, `useCallback`) for efficient re-renders.
- **Visual Engine**: Recharts for telemetry trends and Framer Motion for high-fidelity interactive gauges.
- **Responsive Core**: A mobile-first CSS grid (Tailwind v4) optimized for industrial-grade tablets.

### 4.2 Data Pipeline (The Normalization Engine)
Located in `src/services/dataService.ts`, this module is responsible for:
1. **Fetching**: Polling the secure JSON webhook.
2. **Normalization**: Mapping inconsistent payload shapes into a strict TypeScript domain model.
3. **Threshold Injection**: Dynamically assigning industrial safety limits (USP/ISO) based on equipment metadata.
4. **Persistence Sync**: Merging live data with `localStorage` to maintain a non-volatile audit log.

## 5. Key Functional Modules

### 5.1 GMP Compliance Monitor (Seuils)
This module implements real-time validation of sensor data.
- **Logic**: Each machine is assigned a threshold object containing `min`, `max`, and `critical` values.
- **Visualization**: Linear color-coded gauges indicate the equipment's current safety status.
- **Standards**: Built-in adherence to ISO 17665 (Autoclaves) and USP <659> (Cold Storage).

### 5.2 Intelligent Priority System
To optimize response times, the application implements a **Priority Sorting Algorithm**:
- Equipment with `etat_global: 'alerte'` or `status: 'en_panne'` is automatically hoisted to the top of the inventory list.
- This ensures that critical bottlenecks are addressed before routine operations.

### 5.3 Maintenance Workflow & Persistence
- **Intervention Tracking**: Technicians can update the status of an incident (Not Started -> In Progress -> Done).
- **Persistent History**: The history of all completed actions is cached locally, ensuring that an audit trail exists even if the live API resets its daily log.

### 5.4 Automated PDF Reporting
Generates a branded operational summary including:
- Production zone availability percentages.
- Tabular snapshots of critical equipment.
- AI-generated maintenance recommendations for active incidents.

## 6. Technical Stack
- **Framework**: React 19 + Vite 6
- **Styling**: Tailwind CSS v4 (Glassmorphism & Industrial Theme)
- **Persistence**: Browser LocalStorage API
- **Reporting**: jsPDF & html2canvas
- **Icons/UI**: Lucide-React & Framer Motion

## 7. Data Model Overview
The system operates on four primary entities:
1. **Machine**: Metadata and live status (Active, Maintenance, Failed).
2. **SensorReading**: Telemetry data (Temperature, Pressure, Vibration, Humidity).
3. **Threshold**: Validated safety limits for compliance.
4. **Technician**: Roster and real-time task assignment.

## 8. Conclusion & Future Roadmap
The INDUPHARMA Dashboard successfully digitizes the pharmaceutical production floor. Future enhancements could include:
- **Predictive Maintenance**: Integrating Machine Learning (ML) to predict failures before they occur.
- **Backend Migration**: Moving from LocalStorage to a PostgreSQL/Supabase backend for multi-device synchronization.
- **Biometric Login**: Enhancing security for technician acknowledgments.

---
**License**: Apache-2.0  
**Repository**: [INDUPHARMA Live Dashboard](https://github.com/hafidaso/INDUPHARMA-Live-Dashboard)
