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
  DashboardKpiSummary,
  MachineStatus,
  ReadingStatus,
  Severity
} from '../types';

const PRODUCTION_STATUS_URL =
  "https://fusion-ai-api.medifus.dev/webhooks/webhook-vug2y2v8zf6cu492khq7g3o0/api/production/status";

export const SHEET_CONFIG = {
  endpointUrl: PRODUCTION_STATUS_URL,
  refreshIntervalMs: 3000,
};

type ProductionMeasure = {
  type_mesure?: string;
  valeur?: number;
  unite?: string;
  alerte_flag?: boolean;
  timestamp?: string;
};

type ProductionEquipement = {
  equipement_id: string;
  code_machine?: string | null;
  nom: string;
  zone_production: string;
  type_equipement: string;
  criticite_gmp?: string | null;
  statut: string;
  nb_alertes_ouvertes: number;
  etat_global: string;
  mesures_recentes?: ProductionMeasure[];
};

type ProductionResponse = {
  meta: {
    generated_at: string;
    nb_equipements: number;
    equipements_ok: number;
    equipements_alerte: number;
    nb_alertes_total: number;
  };
  equipements: ProductionEquipement[];
};

function toMachineStatus(status: string | undefined): MachineStatus {
  if (!status) return 'inactive';
  const s = status.toLowerCase();
  if (s === 'active') return 'active';
  if (s === 'maintenance') return 'maintenance';
  if (s === 'en_panne' || s === 'down') return 'en_panne';
  return 'inactive';
}

function toIncidentSeverity(value: string | undefined): Severity {
  const v = String(value ?? '').toLowerCase();
  if (v.includes('critical') || v.includes('critique')) return 'critical';
  if (v.includes('high') || v.includes('haute')) return 'high';
  if (v.includes('medium') || v.includes('moy')) return 'medium';
  return 'low';
}

function resolveMeasureSummary(measures: ProductionMeasure[] | undefined) {
  if (!measures || measures.length === 0) {
    return {
      latestDevice: 'N/A',
      latestStatus: 'normal' as ReadingStatus,
      latestSeverity: 'low' as Severity,
      latestValueSummary: 'No measure',
      reading: null as SensorReading | null,
    };
  }

  const latest = measures[0];
  const type = latest.type_mesure ?? 'measure';
  const value = latest.valeur ?? 0;
  const unit = latest.unite ?? '';
  const flagged = !!latest.alerte_flag;

  const reading: SensorReading = {
    id: `R-${latest.timestamp ?? Date.now()}`,
    machine_id: '',
    device_id: 'API',
    status: flagged ? 'warning' : 'normal',
    severity: flagged ? 'medium' : 'low',
    timestamp: latest.timestamp ?? new Date().toISOString(),
  };

  if (type.includes('temp')) reading.temperature = value;
  else if (type.includes('press')) reading.pressure = value;
  else if (type.includes('vib')) reading.vibration = value;
  else if (type.includes('infra')) reading.infrared = value;

  return {
    latestDevice: 'API',
    latestStatus: flagged ? ('warning' as ReadingStatus) : ('normal' as ReadingStatus),
    latestSeverity: flagged ? ('medium' as Severity) : ('low' as Severity),
    latestValueSummary: `${type}: ${value} ${unit}`.trim(),
    reading,
  };
}

async function fetchProductionStatus(): Promise<ProductionResponse> {
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');
  const url =
    typeof window !== 'undefined' && !isLocalhost
      ? '/api/production-status'
      : SHEET_CONFIG.endpointUrl;

  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), 9000);
  try {
    const res = await fetch(url, {
      method: 'GET',
      cache: 'no-store',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) {
      throw new Error(`Production endpoint failed: ${res.status}`);
    }
    return (await res.json()) as ProductionResponse;
  } finally {
    window.clearTimeout(timeout);
  }
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
  { id: 'c2ffbc99-9c0b-4ef8-bb6d-6bb9bd380a33', name: 'Technicien Maintenance A', role: 'technicien_maintenance', email: 'tech.a@indupharma.local', phone: '+212600000001', is_available: true },
  { id: 'f5ffbc99-9c0b-4ef8-bb6d-6bb9bd380a66', name: 'Responsable Qualité', role: 'responsable_qualite', email: 'qa@indupharma.local', phone: '+212600000002', is_available: true },
  { id: 'f6ffbc99-9c0b-4ef8-bb6d-6bb9bd380a77', name: 'Technicien Maintenance B', role: 'technicien_maintenance', email: 'tech.b@indupharma.local', phone: '+212600000003', is_available: true },
  { id: 'f7ffbc99-9c0b-4ef8-bb6d-6bb9bd380a88', name: 'Responsable Production', role: 'responsable_production', email: 'prod@indupharma.local', phone: '+212600000004', is_available: true },
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
// Main aggregated fetch
// ---------------------------------------------------------------------------
export async function fetchSheetData() {
  try {
    const payload = await fetchProductionStatus();
    const machines: Machine[] = payload.equipements.map((e) => ({
      id: e.equipement_id,
      name: e.nom,
      type: e.type_equipement,
      location: e.zone_production,
      status: toMachineStatus(e.statut),
      created_at: payload.meta.generated_at,
    }));

    const technicians: Technician[] = techniciansMock;

    const sensorReadings: SensorReading[] = payload.equipements
      .map((e) => {
        const summary = resolveMeasureSummary(e.mesures_recentes);
        if (!summary.reading) return null;
        return { ...summary.reading, machine_id: e.equipement_id };
      })
      .filter(Boolean) as SensorReading[];

    const incidents: Incident[] = payload.equipements
      .filter((e) => e.nb_alertes_ouvertes > 0)
      .map((e) => ({
        id: `INC-${e.equipement_id}`,
        machine_id: e.equipement_id,
        machine_name: e.nom,
        detected_at: payload.meta.generated_at,
        severity: toIncidentSeverity(e.criticite_gmp),
        description: `${e.nb_alertes_ouvertes} open alert(s) on ${e.nom}`,
        status: 'open',
        created_by: 'auto',
      }));

    const maintenanceActions: MaintenanceAction[] = [];
    const thresholds: Threshold[] = [];

    const kpiLogs: KpiLog[] = payload.equipements.map((e) => ({
      id: `KPI-${e.equipement_id}`,
      machine_id: e.equipement_id,
      machine_name: e.nom,
      date: payload.meta.generated_at.slice(0, 10),
      downtime_minutes: e.etat_global === 'ok' ? 0 : 30,
      mtbf_hours: e.etat_global === 'ok' ? 24 : 8,
      mttr_minutes: e.nb_alertes_ouvertes > 0 ? 30 : 0,
      incident_count: e.nb_alertes_ouvertes,
      escalation_count: e.nb_alertes_ouvertes > 1 ? 1 : 0,
      closure_rate: e.nb_alertes_ouvertes > 0 ? 50 : 100,
    }));

    const machineView: DashboardMachineView[] = payload.equipements.map((e) => {
      const summary = resolveMeasureSummary(e.mesures_recentes);
      return {
        machine_id: e.equipement_id,
        machine_name: e.nom,
        type: e.type_equipement,
        location: e.zone_production,
        machine_status: toMachineStatus(e.statut),
        latest_device: summary.latestDevice,
        latest_status: summary.latestStatus,
        latest_severity: summary.latestSeverity,
        latest_value_summary: summary.latestValueSummary,
        active_incident: e.nb_alertes_ouvertes > 0 ? `${e.nb_alertes_ouvertes} alert(s)` : undefined,
        incident_status: e.nb_alertes_ouvertes > 0 ? 'open' : undefined,
      };
    });

    const kpiSummary: DashboardKpiSummary[] = [
      {
        metric: 'Machines actives',
        value: String(payload.meta.equipements_ok),
        unit: '/',
        status: payload.meta.equipements_alerte > 0 ? 'warning' : 'normal',
        note: `${payload.meta.nb_equipements} machines total`,
      },
      {
        metric: 'Incidents ouverts',
        value: String(payload.meta.nb_alertes_total),
        unit: '',
        status: payload.meta.nb_alertes_total > 0 ? 'critical' : 'normal',
        note: 'Open alerts from production API',
      },
      {
        metric: 'Alertes critiques',
        value: String(payload.meta.equipements_alerte),
        unit: '',
        status: payload.meta.equipements_alerte > 0 ? 'critical' : 'normal',
        note: 'Equipements en alerte',
      },
      {
        metric: 'MTTR moyen',
        value: String(Math.round(kpiLogs.reduce((a, b) => a + b.mttr_minutes, 0) / (kpiLogs.length || 1))),
        unit: 'min',
        status: 'normal',
        note: 'Calculated from API-derived KPI logs',
      },
      {
        metric: 'Downtime total',
        value: String(kpiLogs.reduce((a, b) => a + b.downtime_minutes, 0)),
        unit: 'min',
        status: 'warning',
        note: 'Derived from etat_global',
      },
    ];

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

    return {
      machines,
      technicians,
      thresholds,
      sensorReadings,
      incidents,
      maintenanceActions,
      kpiLogs,
      machineView,
      kpiSummary,
      histories,
      lastUpdate:  new Date().toLocaleTimeString('fr-FR'),
      isConnected: true,
    };
  } catch (error) {
    console.error("Data fetch error (using fallback):", error);

    // Hard fallback to keep dashboard alive even on unexpected runtime issues.
    const machines = machinesMock;
    const technicians = techniciansMock;
    const thresholds = thresholdsMock;
    const sensorReadings = sensorReadingsMock;
    const incidents = incidentsMock;
    const maintenanceActions = maintenanceActionsMock;
    const kpiLogs = kpiLogsMock;

    const machineView = buildMachineView(machines, sensorReadings, incidents);
    const kpiSummary = buildKpiSummary(machines, incidents, kpiLogs);

    const histories: Record<string, any[]> = {};
    machines.forEach((m) => {
      const r = sensorReadings.find((s) => s.machine_id === m.id);
      const base = r?.pressure ?? r?.temperature ?? r?.vibration ?? 22;
      const variance = r?.pressure != null ? 0.8 : r?.vibration != null ? 4.0 : 5.0;
      histories[m.id] = generateHistory(m.id, 12, base, variance, '');
    });

    return {
      machines,
      technicians,
      thresholds,
      sensorReadings,
      incidents,
      maintenanceActions,
      kpiLogs,
      machineView,
      kpiSummary,
      histories,
      lastUpdate: new Date().toLocaleTimeString('fr-FR'),
      isConnected: false,
    };
  }
}
