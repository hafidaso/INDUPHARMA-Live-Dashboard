/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { 
  Machine, 
  Technician, 
  Threshold, 
  SensorReading, 
  Incident, 
  MaintenanceAction, 
  KpiLog, 
  DashboardMachineView, 
  DashboardKpiSummary 
} from '../types';

export const SHEET_CONFIG = {
  endpointUrl: "", // PASTE_GOOGLE_APPS_SCRIPT_URL_HERE
  refreshIntervalMs: 10000
};

// MOCK DATA
const machinesMock: Machine[] = [
  { id: 'M01', name: 'Autoclave M02', type: 'Stérilisateur', location: 'Zone A', status: 'en_panne', created_at: '2024-01-10' },
  { id: 'M02', name: 'Compresseuse C01', type: 'Presse', location: 'Zone B', status: 'maintenance', created_at: '2024-01-12' },
  { id: 'M03', name: 'Mélangeur B03', type: 'Mélangeur', location: 'Zone C', status: 'active', created_at: '2024-01-15' },
  { id: 'M04', name: 'Remplisseuse R04', type: 'Conditionneuse', location: 'Zone D', status: 'active', created_at: '2024-02-01' },
  { id: 'M05', name: 'Chambre Froide S05', type: 'Stockage', location: 'Stockage', status: 'active', created_at: '2024-01-05' }
];

const techniciansMock: Technician[] = [
  { id: 'T01', name: 'Jean Dupont', role: 'Maintenance Sénior', email: 'j.dupont@pharma.com', phone: '0612345678', is_available: true },
  { id: 'T02', name: 'Marie Lefebvre', role: 'Technicienne GMP', email: 'm.lefebvre@pharma.com', phone: '0687654321', is_available: false },
  { id: 'T03', name: 'Ahmed Saidi', role: 'Expert Instrumentation', email: 'a.saidi@pharma.com', phone: '0655443322', is_available: true }
];

const thresholdsMock: Threshold[] = [
  { id: 'TH01', machine_id: 'M01', sensor_type: 'pression', min_value: 1.0, max_value: 2.5, critical_value: 3.0, unit: 'bar' },
  { id: 'TH02', machine_id: 'M01', sensor_type: 'temperature', min_value: 115, max_value: 125, critical_value: 130, unit: '°C' },
  { id: 'TH03', machine_id: 'M05', sensor_type: 'temperature', min_value: 2.0, max_value: 8.0, critical_value: 1.5, unit: '°C' }
];

const sensorReadingsMock: SensorReading[] = [
  { id: 'R01', machine_id: 'M01', device_id: 'ESP32-ST1', pressure: 2.6, status: 'warning', severity: 'medium', timestamp: new Date().toISOString() },
  { id: 'R02', machine_id: 'M03', device_id: 'ESP32-MX1', temperature: 38.5, status: 'normal', severity: 'low', timestamp: new Date().toISOString() },
  { id: 'R03', machine_id: 'M05', device_id: 'ESP32-CF1', temperature: 1.2, status: 'critical', severity: 'critical', timestamp: new Date().toISOString() },
  { id: 'R04', machine_id: 'M02', device_id: 'ESP32-CP1', vibration: 8.4, status: 'warning', severity: 'high', timestamp: new Date().toISOString() }
];

const incidentsMock: Incident[] = [
  { id: 'INC001', machine_id: 'M01', machine_name: 'Autoclave M02', detected_at: '2026-04-28 09:45', severity: 'critical', description: 'Surpression détectée valve secondaire', status: 'open', created_by: 'auto' },
  { id: 'INC002', machine_id: 'M02', machine_name: 'Compresseuse C01', detected_at: '2026-04-28 10:30', acknowledged_at: '2026-04-28 10:45', severity: 'medium', description: 'Vibration excessive roulement B4', status: 'in_progress', created_by: 'manual', root_cause: 'Usure naturelle' },
  { id: 'INC003', machine_id: 'M05', machine_name: 'Chambre Froide S05', detected_at: '2026-04-28 11:15', severity: 'critical', description: 'Température hors plage basse criteria GMP', status: 'escalated', created_by: 'auto' }
];

const maintenanceActionsMock: MaintenanceAction[] = [
  { id: 'ACT001', incident_id: 'INC002', technician_id: 'T01', technician_name: 'Jean Dupont', action_taken: 'Inspection et graissage', started_at: '2026-04-28 11:00', notes: 'Prévoir remplacement au prochain arrêt planifié' }
];

const kpiLogsMock: KpiLog[] = [
  { id: 'K01', machine_id: 'M01', machine_name: 'Autoclave M02', date: '2026-04-28', downtime_minutes: 120, mtbf_hours: 4.5, mttr_minutes: 45, incident_count: 3, escalation_count: 1, closure_rate: 66 },
  { id: 'K02', machine_id: 'M02', machine_name: 'Compresseuse C01', date: '2026-04-28', downtime_minutes: 45, mtbf_hours: 12, mttr_minutes: 15, incident_count: 1, escalation_count: 0, closure_rate: 100 }
];

const dashboardMachineViewMock: DashboardMachineView[] = [
  { machine_id: 'M01', machine_name: 'Autoclave M02', type: 'Stérilisateur', location: 'Zone A', machine_status: 'en_panne', latest_device: 'ESP32-ST1', latest_status: 'warning', latest_severity: 'medium', latest_value_summary: 'P: 2.6 bar', active_incident: 'INC001', incident_status: 'open' },
  { machine_id: 'M02', machine_name: 'Compresseuse C01', type: 'Presse', location: 'Zone B', machine_status: 'maintenance', latest_device: 'ESP32-CP1', latest_status: 'warning', latest_severity: 'high', latest_value_summary: 'Vib: 8.4 mm/s', active_incident: 'INC002', incident_status: 'in_progress' },
  { machine_id: 'M03', machine_name: 'Mélangeur B03', type: 'Mélangeur', location: 'Zone C', machine_status: 'active', latest_device: 'ESP32-MX1', latest_status: 'normal', latest_severity: 'low', latest_value_summary: 'T: 38.5 °C' },
  { machine_id: 'M04', machine_name: 'Remplisseuse R04', type: 'Conditionneuse', location: 'Zone D', machine_status: 'active', latest_device: 'ESP32-RM1', latest_status: 'normal', latest_severity: 'low', latest_value_summary: 'T: 22.1 °C' },
  { machine_id: 'M05', machine_name: 'Chambre Froide S05', type: 'Stockage', location: 'Stockage', machine_status: 'active', latest_device: 'ESP32-CF1', latest_status: 'critical', latest_severity: 'critical', latest_value_summary: 'T: 1.2 °C', active_incident: 'INC003', incident_status: 'escalated' }
];

const dashboardKpiSummaryMock: DashboardKpiSummary[] = [
  { metric: 'Machines actives', value: '3/5', unit: '', status: 'warning', note: 'Autoclave HS, Presse en maintenance' },
  { metric: 'Incidents ouverts', value: '2', unit: '', status: 'critical', note: 'Priorité Autoclave et Chambre Froide' },
  { metric: 'Downtime total', value: '165', unit: 'min', status: 'warning', note: '+15% vs hier' },
  { metric: 'MTTR moyen', value: '22', unit: 'min', status: 'normal', note: 'Objectif < 30min' },
  { metric: 'Alertes critiques', value: '2', unit: '', status: 'critical', note: 'Risque GMP élevé' }
];

// DATA FETCHERS
export async function fetchMachines() {
  // To connect: const res = await fetch(`${SHEET_CONFIG.endpointUrl}?action=machines`); return await res.json();
  return machinesMock;
}

export async function fetchTechnicians() {
  return techniciansMock;
}

export async function fetchThresholds() {
  return thresholdsMock;
}

export async function fetchSensorReadings() {
  return sensorReadingsMock;
}

export async function fetchIncidents() {
  return incidentsMock;
}

export async function fetchMaintenanceActions() {
  return maintenanceActionsMock;
}

export async function fetchKpiLogs() {
  return kpiLogsMock;
}

export async function fetchDashboardMachineView() {
  return dashboardMachineViewMock;
}

export async function fetchDashboardKpiSummary() {
  return dashboardKpiSummaryMock;
}

const generateHistory = (machineId: string, count: number, base: number, variance: number, unit: string) => {
  return Array.from({ length: count }, (_, i) => ({
    timestamp: new Date(Date.now() - (count - i) * 3600000).toISOString(),
    value: base + Math.random() * variance - variance / 2,
    machine_id: machineId,
    unit
  }));
};

const sensorHistoryMockMap: Record<string, any[]> = {
  'M01': generateHistory('M01', 12, 2.2, 0.8, 'bar'), // Pressure Autoclave
  'M02': generateHistory('M02', 12, 5.5, 4.0, 'mm/s'), // Vibration Compresseuse
  'M03': generateHistory('M03', 12, 45, 10, '°C'), // Infrared (simulated as temp for now)
  'M05': generateHistory('M05', 12, 4.0, 6.0, '°C'), // Temp Chambre Froide
  'M04': generateHistory('M04', 12, 22, 2, '°C'), // Temp Remplisseuse
};

export async function fetchSensorHistory(machineId: string) {
  return sensorHistoryMockMap[machineId] || [];
}

export async function fetchSheetData() {
  try {
    const [
      machines, technicians, thresholds, sensorReadings, 
      incidents, maintenanceActions, kpiLogs, 
      machineView, kpiSummary,
      m1History, m2History, m3History, m4History, m5History
    ] = await Promise.all([
      fetchMachines(), fetchTechnicians(), fetchThresholds(), fetchSensorReadings(),
      fetchIncidents(), fetchMaintenanceActions(), fetchKpiLogs(),
      fetchDashboardMachineView(), fetchDashboardKpiSummary(),
      fetchSensorHistory('M01'), fetchSensorHistory('M02'), fetchSensorHistory('M03'), fetchSensorHistory('M04'), fetchSensorHistory('M05')
    ]);

    return {
      machines, technicians, thresholds, sensorReadings,
      incidents, maintenanceActions, kpiLogs,
      machineView, kpiSummary,
      histories: {
        'M01': m1History,
        'M02': m2History,
        'M03': m3History,
        'M04': m4History,
        'M05': m5History
      },
      lastUpdate: new Date().toLocaleTimeString('fr-FR'),
      isConnected: !!SHEET_CONFIG.endpointUrl
    };
  } catch (error) {
    console.error("Connection Error:", error);
    throw error;
  }
}
