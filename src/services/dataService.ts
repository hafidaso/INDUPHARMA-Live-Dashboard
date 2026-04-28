/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import Papa from 'papaparse';
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

// ---------------------------------------------------------------------------
// Sheet configuration
// Base URL = the published Google Sheets CSV base.
// For each extra sheet tab, add its GID from the sheet URL bar:
//   ?gid=XXXXXXXXX  (visible when you click the tab in the browser URL)
// Leave blank ("") to keep using mock data for that entity.
// ---------------------------------------------------------------------------
const SHEET_BASE =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRL-A-qoJjc6Rca7L5_tCsG3bh0-_X1OSSIIedmrXp5s7O67MSSJkX7xX6IVVQ1DjmxPaxumrobk1Yb/pub";

const SHEET_DOC_ID = "1qWn0p9lrOjz_zssADNY6N0HtJbkFMCHTmE-PKjMRk4k";
const buildSheetCsvUrl = (docId: string, gid: string) =>
  `https://docs.google.com/spreadsheets/d/${docId}/gviz/tq?tqx=out:csv&gid=${gid}`;

export const SHEET_CONFIG = {
  urls: {
    machines:           `${SHEET_BASE}?output=csv`,           // first sheet tab (live)
    technicians:        buildSheetCsvUrl(SHEET_DOC_ID, "1981152723"),
    thresholds:         buildSheetCsvUrl(SHEET_DOC_ID, "945982141"),
    sensorReadings:     buildSheetCsvUrl(SHEET_DOC_ID, "1876456620"),
    incidents:          buildSheetCsvUrl(SHEET_DOC_ID, "2117617908"),
    maintenanceActions: buildSheetCsvUrl(SHEET_DOC_ID, "597643256"),
    kpiLogs:            buildSheetCsvUrl(SHEET_DOC_ID, "1582554922"),
  },
  // Poll every 3 seconds for near-real-time dashboard updates.
  refreshIntervalMs: 3000,
};

// ---------------------------------------------------------------------------
// Generic CSV fetcher
// ---------------------------------------------------------------------------
async function fetchCSV<T>(url: string): Promise<T[] | null> {
  if (!url) return null;
  // Cache buster so each poll reads the latest published CSV.
  const separator = url.includes('?') ? '&' : '?';
  const freshUrl = `${url}${separator}_ts=${Date.now()}`;
  return new Promise((resolve, reject) => {
    Papa.parse<T>(freshUrl, {
      download: true,
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true,
      complete: (results) => resolve(results.data),
      error: (err) => reject(err),
    });
  });
}

// ---------------------------------------------------------------------------
// MOCK DATA  (used as fallback when a sheet URL is not yet configured)
// ---------------------------------------------------------------------------
const machinesMock: Machine[] = [
  { id: 'M01', name: 'Autoclave M02',    type: 'Stérilisateur', location: 'Zone A',   status: 'en_panne',   created_at: '2024-01-10' },
  { id: 'M02', name: 'Compresseuse C01', type: 'Presse',         location: 'Zone B',   status: 'maintenance',created_at: '2024-01-12' },
  { id: 'M03', name: 'Mélangeur B03',    type: 'Mélangeur',      location: 'Zone C',   status: 'active',     created_at: '2024-01-15' },
  { id: 'M04', name: 'Remplisseuse R04', type: 'Conditionneuse', location: 'Zone D',   status: 'active',     created_at: '2024-02-01' },
  { id: 'M05', name: 'Chambre Froide S05',type: 'Stockage',      location: 'Stockage', status: 'active',     created_at: '2024-01-05' },
];

const techniciansMock: Technician[] = [
  { id: 'T01', name: 'Jean Dupont',    role: 'Maintenance Sénior',   email: 'j.dupont@pharma.com',   phone: '0612345678', is_available: true },
  { id: 'T02', name: 'Marie Lefebvre', role: 'Technicienne GMP',      email: 'm.lefebvre@pharma.com', phone: '0687654321', is_available: false },
  { id: 'T03', name: 'Ahmed Saidi',    role: 'Expert Instrumentation',email: 'a.saidi@pharma.com',    phone: '0655443322', is_available: true },
];

const thresholdsMock: Threshold[] = [
  { id: 'TH01', machine_id: 'M01', sensor_type: 'pression',    min_value: 1.0, max_value: 2.5, critical_value: 3.0, unit: 'bar' },
  { id: 'TH02', machine_id: 'M01', sensor_type: 'temperature', min_value: 115, max_value: 125, critical_value: 130, unit: '°C'  },
  { id: 'TH03', machine_id: 'M05', sensor_type: 'temperature', min_value: 2.0, max_value: 8.0, critical_value: 1.5, unit: '°C'  },
];

const sensorReadingsMock: SensorReading[] = [
  { id: 'R01', machine_id: 'M01', device_id: 'ESP32-ST1', pressure:    2.6, status: 'warning',  severity: 'medium',   timestamp: new Date().toISOString() },
  { id: 'R02', machine_id: 'M03', device_id: 'ESP32-MX1', temperature: 38.5,status: 'normal',   severity: 'low',      timestamp: new Date().toISOString() },
  { id: 'R03', machine_id: 'M05', device_id: 'ESP32-CF1', temperature: 1.2, status: 'critical', severity: 'critical', timestamp: new Date().toISOString() },
  { id: 'R04', machine_id: 'M02', device_id: 'ESP32-CP1', vibration:   8.4, status: 'warning',  severity: 'high',     timestamp: new Date().toISOString() },
];

const incidentsMock: Incident[] = [
  { id: 'INC001', machine_id: 'M01', machine_name: 'Autoclave M02',     detected_at: '2026-04-28 09:45', severity: 'critical', description: 'Surpression détectée valve secondaire',               status: 'open',        created_by: 'auto' },
  { id: 'INC002', machine_id: 'M02', machine_name: 'Compresseuse C01',  detected_at: '2026-04-28 10:30', acknowledged_at: '2026-04-28 10:45', severity: 'medium', description: 'Vibration excessive roulement B4', status: 'in_progress', created_by: 'manual', root_cause: 'Usure naturelle' },
  { id: 'INC003', machine_id: 'M05', machine_name: 'Chambre Froide S05',detected_at: '2026-04-28 11:15', severity: 'critical', description: 'Température hors plage basse criteria GMP',            status: 'escalated',   created_by: 'auto' },
];

const maintenanceActionsMock: MaintenanceAction[] = [
  { id: 'ACT001', incident_id: 'INC002', technician_id: 'T01', technician_name: 'Jean Dupont', action_taken: 'Inspection et graissage', started_at: '2026-04-28 11:00', notes: 'Prévoir remplacement au prochain arrêt planifié' },
];

const kpiLogsMock: KpiLog[] = [
  { id: 'K01', machine_id: 'M01', machine_name: 'Autoclave M02',    date: '2026-04-28', downtime_minutes: 120, mtbf_hours: 4.5, mttr_minutes: 45, incident_count: 3, escalation_count: 1, closure_rate: 66  },
  { id: 'K02', machine_id: 'M02', machine_name: 'Compresseuse C01', date: '2026-04-28', downtime_minutes: 45,  mtbf_hours: 12,  mttr_minutes: 15, incident_count: 1, escalation_count: 0, closure_rate: 100 },
];

// ---------------------------------------------------------------------------
// Machine view + KPI summary — derived from live / mock data
// ---------------------------------------------------------------------------
function buildMachineView(
  machines: Machine[],
  sensorReadings: SensorReading[],
  incidents: Incident[]
): DashboardMachineView[] {
  return machines.map((m) => {
    const reading = sensorReadings.find((r) => r.machine_id === m.id);
    const incident = incidents.find(
      (i) => i.machine_id === m.id && (i.status === 'open' || i.status === 'in_progress' || i.status === 'escalated')
    );

    const valueSummary = reading
      ? reading.pressure    != null ? `P: ${reading.pressure} bar`
      : reading.temperature != null ? `T: ${reading.temperature} °C`
      : reading.vibration   != null ? `Vib: ${reading.vibration} mm/s`
      : 'N/A'
      : 'N/A';

    return {
      machine_id:          m.id,
      machine_name:        m.name,
      type:                m.type,
      location:            m.location,
      machine_status:      m.status,
      latest_device:       reading?.device_id ?? '—',
      latest_status:       reading?.status    ?? 'normal',
      latest_severity:     reading?.severity  ?? 'low',
      latest_value_summary: valueSummary,
      active_incident:     incident?.id,
      incident_status:     incident?.status,
    } as DashboardMachineView;
  });
}

function buildKpiSummary(
  machines: Machine[],
  incidents: Incident[],
  kpiLogs: KpiLog[]
): DashboardKpiSummary[] {
  const active   = machines.filter((m) => m.status === 'active').length;
  const total    = machines.length;
  const openInc  = incidents.filter((i) => i.status === 'open' || i.status === 'escalated').length;
  const totalDT  = kpiLogs.reduce((s, k) => s + k.downtime_minutes, 0);
  const avgMTTR  = kpiLogs.length ? Math.round(kpiLogs.reduce((s, k) => s + k.mttr_minutes, 0) / kpiLogs.length) : 0;
  const critical = incidents.filter((i) => i.severity === 'critical' && i.status !== 'closed').length;

  return [
    { metric: 'Machines actives', value: `${active}/${total}`, unit: '',    status: active < total ? 'warning' : 'normal',   note: active < total ? `${total - active} équipement(s) hors ligne` : 'Tous opérationnels' },
    { metric: 'Incidents ouverts', value: String(openInc),     unit: '',    status: openInc > 0 ? 'critical' : 'normal',     note: openInc > 0 ? 'Intervention requise' : 'Aucun incident actif' },
    { metric: 'Downtime total',    value: String(totalDT),     unit: 'min', status: totalDT > 100 ? 'warning' : 'normal',    note: 'Cumul du jour' },
    { metric: 'MTTR moyen',        value: String(avgMTTR),     unit: 'min', status: avgMTTR <= 30 ? 'normal' : 'warning',    note: 'Objectif < 30 min' },
    { metric: 'Alertes critiques', value: String(critical),    unit: '',    status: critical > 0 ? 'critical' : 'normal',    note: critical > 0 ? 'Risque GMP élevé' : 'Aucune alerte critique' },
  ];
}

// ---------------------------------------------------------------------------
// Sensor history generator (mock until live sensor history sheet is wired)
// ---------------------------------------------------------------------------
const generateHistory = (machineId: string, count: number, base: number, variance: number, unit: string) =>
  Array.from({ length: count }, (_, i) => ({
    timestamp:  new Date(Date.now() - (count - i) * 3_600_000).toISOString(),
    value:      base + Math.random() * variance - variance / 2,
    machine_id: machineId,
    unit,
  }));

// ---------------------------------------------------------------------------
// Public fetchers
// ---------------------------------------------------------------------------
export async function fetchMachines(): Promise<Machine[]> {
  const rows = await fetchCSV<any>(SHEET_CONFIG.urls.machines);
  if (rows && rows.length > 0) return rows as Machine[];
  return machinesMock;
}

export async function fetchTechnicians(): Promise<Technician[]> {
  const rows = await fetchCSV<any>(SHEET_CONFIG.urls.technicians);
  if (rows && rows.length > 0) {
    return rows.map((r: any) => ({
      ...r,
      is_available: r.is_available === true || r.is_available === 'true' || r.is_available === 1,
    })) as Technician[];
  }
  return techniciansMock;
}

export async function fetchThresholds(): Promise<Threshold[]> {
  const rows = await fetchCSV<any>(SHEET_CONFIG.urls.thresholds);
  if (rows && rows.length > 0) return rows as Threshold[];
  return thresholdsMock;
}

export async function fetchSensorReadings(): Promise<SensorReading[]> {
  const rows = await fetchCSV<any>(SHEET_CONFIG.urls.sensorReadings);
  if (rows && rows.length > 0) return rows as SensorReading[];
  return sensorReadingsMock;
}

export async function fetchIncidents(): Promise<Incident[]> {
  const rows = await fetchCSV<any>(SHEET_CONFIG.urls.incidents);
  if (rows && rows.length > 0) return rows as Incident[];
  return incidentsMock;
}

export async function fetchMaintenanceActions(): Promise<MaintenanceAction[]> {
  const rows = await fetchCSV<any>(SHEET_CONFIG.urls.maintenanceActions);
  if (rows && rows.length > 0) return rows as MaintenanceAction[];
  return maintenanceActionsMock;
}

export async function fetchKpiLogs(): Promise<KpiLog[]> {
  const rows = await fetchCSV<any>(SHEET_CONFIG.urls.kpiLogs);
  if (rows && rows.length > 0) return rows as KpiLog[];
  return kpiLogsMock;
}

// ---------------------------------------------------------------------------
// Main aggregated fetch
// ---------------------------------------------------------------------------
export async function fetchSheetData() {
  try {
    const [machines, technicians, thresholds, sensorReadings, incidents, maintenanceActions, kpiLogs] =
      await Promise.all([
        fetchMachines(),
        fetchTechnicians(),
        fetchThresholds(),
        fetchSensorReadings(),
        fetchIncidents(),
        fetchMaintenanceActions(),
        fetchKpiLogs(),
      ]);

    // Join machine_name onto incidents and kpiLogs
    const incidentsWithNames = incidents.map((inc) => ({
      ...inc,
      machine_name: inc.machine_name ?? machines.find((m) => m.id === inc.machine_id)?.name ?? inc.machine_id,
    }));

    const kpiLogsWithNames = kpiLogs.map((k) => ({
      ...k,
      machine_name: k.machine_name ?? machines.find((m) => m.id === k.machine_id)?.name ?? k.machine_id,
    }));

    const machineView  = buildMachineView(machines, sensorReadings, incidentsWithNames);
    const kpiSummary   = buildKpiSummary(machines, incidentsWithNames, kpiLogsWithNames);

    // Build sensor histories keyed by machine ID
    const histories: Record<string, any[]> = {};
    machines.forEach((m) => {
      const r = sensorReadings.find((s) => s.machine_id === m.id);
      const base     = r?.pressure    ?? r?.temperature ?? r?.vibration ?? 22;
      const variance = r?.pressure    != null ? 0.8
                     : r?.vibration   != null ? 4.0
                     : 5.0;
      histories[m.id] = generateHistory(m.id, 12, base, variance, '');
    });

    const isConnected = !!SHEET_CONFIG.urls.machines;

    return {
      machines,
      technicians,
      thresholds,
      sensorReadings,
      incidents: incidentsWithNames,
      maintenanceActions,
      kpiLogs: kpiLogsWithNames,
      machineView,
      kpiSummary,
      histories,
      lastUpdate:  new Date().toLocaleTimeString('fr-FR'),
      isConnected,
    };
  } catch (error) {
    console.error("Data fetch error:", error);
    throw error;
  }
}
