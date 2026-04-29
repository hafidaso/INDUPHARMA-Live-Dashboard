# 🛡️ INDUPHARMA Live Dashboard - Enterprise Edition

Operational dashboard for high-precision pharmaceutical equipment monitoring, real-time incident management, and GMP compliance auditing.

## 🚀 Overview

This is a professional-grade React + TypeScript dashboard specifically engineered for pharmaceutical production environments. It provides a "single pane of glass" view into factory floor operations, bridging the gap between raw IoT telemetry and actionable maintenance workflows.

---

## ✨ Key Advanced Features

### 📡 Real-Time GMP Monitoring
- **Live Webhook Integration**: Continuous data synchronization from industrial sensors via secure AppScript/JSON webhooks.
- **Visual Threshold Gauges**: High-precision monitors comparing live data against **USP (US Pharmacopeia) & ISO 17665** standards.
- **Safety Zones**: Real-time visualization of Safe, Warning, and Critical zones for every sensor.

### 🧠 Fusion AI (Predictive Maintenance)
- **Hybrid AI Engine**: Combines **Deterministic GMP Rules** with **Fusion AI (Gemini 1.5)** reasoning to predict critical failures.
- **On-Demand Strategic Reports**: Generates deep-dive industrial maintenance strategies based on real-time sensor trends.
- **Robust Fallback System**: Multi-model failover logic (Flash -> Pro) ensures 100% availability of AI insights.

### 🗺️ Factory Floor Live Map (Spatial Topology)
- **Bird's Eye View**: Real-time spatial visualization of the factory floor, mapping machines to their physical zones (Production, Packaging, Utilities).
- **Zone Focus Mode**: Interactive filtering that dims non-selected areas to provide high-focus monitoring.
- **Dynamic Status Blocks**: Machine blocks that pulsate during alerts and reflect real-time sensor measurements.

### 📈 Real-Time Escalation & SLA Monitoring
- **SLA Monitor**: Truly live tracking of technician response times (MTTA) and system latency based on actual interaction logs.
- **Escalation Matrix**: Automated multi-level escalation (T+10, T+20, T+30) for critical incidents using persistent timestamps.
- **Operational Performance**: Instant visualization of factory-wide efficiency (OEE) and SLA compliance.

### 🔍 Smart Inventory & Priority Sorting
- **Intelligent Sorting**: Automatically promotes "En Panne" (Down) machines to the top of the list.
- **Dynamic Search**: Instant filtering by machine name, code, or location.

### 💰 Financial Impact Estimation (ICH Q9)
- **Downtime Cost Estimator**: Real-time financial impact calculation based on **ICH Q9 Quality Risk Management**.
- **Criticality Multipliers**: Accounts for machine-specific risk factors, batch sensitivity, and regulatory costs.

### 📜 Persistent Maintenance & History
- **Technician Dashboard History**: Dedicated history tab for completed tasks with "Reopen" functionality.
- **Action History Persistence**: Integrated `LocalStorage` layer that preserves data across sessions and refreshes.
- **Dual Webhook Synchronization**: Parallel data broadcasting to multiple endpoints for CMMS/ERP consistency.

### 📄 Professional PDF Reporting
- **Branded Exports**: Generate comprehensive PDF reports with company branding and unique report IDs.
- **Performance Snapshots**: Summarizes status, incidents, and AI recommendations into an exportable format.

---

## 🏛️ Standards Compliance

The system is engineered to align with global pharmaceutical and quality standards:
- **Quality Risk Management**: Logic based on **ICH Q9** guidelines.
- **Data Integrity**: Audit trail persistence inspired by **FDA 21 CFR Part 11**.
- **Cold Chain Compliance**: Temperature monitoring ranges aligned with **USP <659>**.
- **Asset Maintenance**: Built following **ISPE GAMP 5** industrial frameworks.

---

## 📱 Industrial Responsive Design
- **Tablet Optimized**: Specially designed for industrial tablets used by floor technicians.
- **Mobile First**: Full functionality preserved on mobile devices for managers on the move.
- **Pharma-Light Design System**: A clean, high-contrast white-theme interface designed for maximum eye comfort and professional pharmaceutical aesthetics.
- **Micro-Animations**: Real-time scan lines and pulsing indicators for "active" and "faulty" equipment.

---

## 🛠️ Technical Architecture

- **Frontend**: React 19 (Hooks, Context, Memoization)
- **Build Tool**: Vite 6 (Lightning-fast HMR)
- **Styling**: Tailwind CSS v4 (Modern industrial aesthetics)
- **Animations**: Framer Motion (Smooth state transitions and gauges)
- **Charts**: Recharts (High-performance telemetry visualization)
- **PDF Engine**: jsPDF / html2canvas integration for high-fidelity report generation.
- **Data Pipeline**: Custom normalization engine in `src/services/dataService.ts` to ensure 100% data integrity.

---

## 📂 Project Structure

- `src/App.tsx`: The heart of the application. Contains the tab-based routing, real-time logic, and the new **Threshold Monitor Grid**.
- `src/services/dataService.ts`: Handles the complex mapping of webhook data, persistence logic, and industrial threshold injection.
- `src/types.ts`: Strictly typed interfaces ensuring full compliance with the pharmaceutical data schema.

---

## 🔐 Access Control (Demo)

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@indupharma.local` | `admin123` |
| **Technician** | `tech@indupharma.local` | `tech123` |

---

## 📥 Installation & Deployment

1. **Install Dependencies**: `npm install`
2. **Development**: `npm run dev` (Runs on `http://localhost:3000`)
3. **Production Build**: `npm run build`
4. **Deployment**: Optimized for Vercel with dedicated serverless function support for webhook proxies.

---

## ⚖️ License & Team

**License**: Apache-2.0
**Core Team**: M. Kassi · M. Ezzi · H. Belayd · M. Mabrouk
