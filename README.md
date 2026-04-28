# 🛡️ INDUPHARMA Live Dashboard - Enterprise Edition

Operational dashboard for high-precision pharmaceutical equipment monitoring, real-time incident management, and GMP compliance auditing.

## 🚀 Overview

This is a professional-grade React + TypeScript dashboard specifically engineered for pharmaceutical production environments. It provides a "single pane of glass" view into factory floor operations, bridging the gap between raw IoT telemetry and actionable maintenance workflows.

---

## ✨ Key Advanced Features

### 📡 Real-Time GMP Monitoring
- **Live Webhook Integration**: Continuous data synchronization from industrial sensors via secure AppScript/JSON webhooks.
- **Visual Threshold Gauges**: High-precision monitors comparing live data against **USP (US Pharmacopeia) & ISO 17665** standards for Autoclaves, Cold Storage, and Coating machines.
- **Safety Zones**: Real-time visualization of Safe, Warning, and Critical zones for every sensor.

### 🔍 Smart Inventory & Filtering
- **Dynamic Search**: Instant filtering by machine name, code, or location.
- **Priority Sorting**: Intelligent algorithm that automatically promotes "En Panne" (Down) machines to the top of the view for immediate management visibility.
- **Status Filtering**: One-click isolation of machines in Maintenance, Active, or Failed states.

### 📜 Persistent Maintenance Audit Log
- **Action History Persistence**: Integrated `LocalStorage` layer that preserves the history of technician interventions even after API data is cleared or the browser is refreshed.
- **Non-Volatile Logs**: Retains up to 100 historical records for audit compliance and performance reviews.

### 🚨 Critical Alert System
- **Dual-Layer Alarms**: Instant full-screen red modals combined with audible alarms for `GMP_critique` violations.
- **Smart Silence**: Alarms intelligently silence once a technician acknowledges the incident and starts the workflow.

### 📊 Performance Analytics (KPIs)
- **Automated MTTR/Downtime**: Real-time calculation of Mean Time To Repair and cumulative downtime per production zone.
- **AI Assistant**: Rule-based maintenance assistant providing specific troubleshooting advice based on equipment type and failure signature.

---

## 🛠️ Technical Architecture

- **Frontend**: React 19 (Hooks, Context, Memoization)
- **Build Tool**: Vite 6 (Lightning-fast HMR)
- **Styling**: Tailwind CSS v4 (Modern industrial aesthetics)
- **Animations**: Framer Motion (Smooth state transitions and gauges)
- **Charts**: Recharts (High-performance telemetry visualization)
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
