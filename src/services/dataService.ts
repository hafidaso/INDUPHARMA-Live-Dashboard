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

type ProductionTechnicien = {
  id?: string;
  name?: string;
  role?: string;
  email?: string;
  phone?: string;
  status?: string;
  action_taken?: string;
  started_at?: string;
  completed_at?: string | null;
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
  techniciens?: ProductionTechnicien[];
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

function parseMaybeJson(value: any) {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  if (!trimmed) return value;
  if (!(trimmed.startsWith('{') || trimmed.startsWith('['))) return value;
  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

function normalizeProductionResponse(raw: any): ProductionResponse {
  const root = parseMaybeJson(raw);
  const candidate = root?.equipements ? root : root?.data?.equipements ? root.data : root?.result?.equipements ? root.result : root;
  const metaCandidate = parseMaybeJson(candidate?.meta);
  const equipementsCandidate = parseMaybeJson(candidate?.equipements);

  const equipementsRaw = Array.isArray(equipementsCandidate)
    ? equipementsCandidate
    : Array.isArray(candidate)
      ? candidate
      : [];

  const equipements: ProductionEquipement[] = equipementsRaw.map((e: any, index: number) => ({
    equipement_id: String(e?.equipement_id ?? e?.id ?? `EQ-${index}`),
    code_machine: e?.code_machine ?? null,
    nom: String(e?.nom ?? e?.name ?? `Equipement ${index + 1}`),
    zone_production: String(e?.zone_production ?? e?.location ?? 'N/A'),
    type_equipement: String(e?.type_equipement ?? e?.type ?? 'unknown'),
    criticite_gmp: e?.criticite_gmp ?? null,
    statut: String(e?.statut ?? e?.status ?? 'inactive'),
    nb_alertes_ouvertes: Number(e?.nb_alertes_ouvertes ?? e?.open_alerts ?? 0),
    etat_global: String(e?.etat_global ?? e?.state ?? 'ok'),
    mesures_recentes: Array.isArray(e?.mesures_recentes) ? e.mesures_recentes : [],
    techniciens: Array.isArray(e?.techniciens) ? e.techniciens : [],
  }));

  return {
    meta: {
      generated_at: String(metaCandidate?.generated_at ?? new Date().toISOString()),
      nb_equipements: Number(metaCandidate?.nb_equipements ?? equipements.length),
      equipements_ok: Number(
        metaCandidate?.equipements_ok ??
          equipements.filter((e) => String(e.etat_global).toLowerCase() === 'ok').length
      ),
      equipements_alerte: Number(
        metaCandidate?.equipements_alerte ??
          equipements.filter((e) => Number(e.nb_alertes_ouvertes) > 0).length
      ),
      nb_alertes_total: Number(
        metaCandidate?.nb_alertes_total ??
          equipements.reduce((sum, e) => sum + Number(e.nb_alertes_ouvertes || 0), 0)
      ),
    },
    equipements,
  };
}

function toMachineStatus(status: string | undefined): MachineStatus {
  if (!status) return 'inactive';
  const s = status.toLowerCase();
  if (s === 'active' || s === 'actif') return 'active';
  if (s === 'maintenance') return 'maintenance';
  if (s === 'en_panne' || s === 'down' || s === 'panne') return 'en_panne';
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
    const raw = await res.json();
    const normalized = normalizeProductionResponse(raw);
    if (!Array.isArray(normalized.equipements) || normalized.equipements.length === 0) {
      throw new Error('Production payload has no valid equipements array.');
    }
    return normalized;
  } finally {
    window.clearTimeout(timeout);
  }
}

// ---------------------------------------------------------------------------
// Sensor history generator
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

    const techniciansRaw: Technician[] = payload.equipements
      .flatMap((e) =>
        (e.techniciens ?? []).map((t) => ({
          ...t,
          machine_name: e.nom,
        }))
      )
      .map((t: any, index) => {
        const status = String(t?.status ?? '').toLowerCase();
        const normalizedStatus =
          status === 'in_progress' || status === 'done' || status === 'blocked' ? status : 'not_yet';
        const isAvailable = normalizedStatus !== 'in_progress' && normalizedStatus !== 'blocked';
        const email = String(t?.email ?? `tech${index + 1}@indupharma.local`);
        return {
          id: String(t?.id ?? email ?? `TECH-${index + 1}`),
          name: String(t?.name ?? `Technicien ${index + 1}`),
          role: String(t?.role ?? 'technicien'),
          email,
          phone: String(t?.phone ?? 'N/A'),
          is_available: isAvailable,
          work_status: normalizedStatus as Technician['work_status'],
          current_machine: String(t?.machine_name ?? ''),
          current_action: String(t?.action_taken ?? ''),
        };
      });

    const technicians: Technician[] = Array.from(
      techniciansRaw.reduce((map, tech) => {
        const key = tech.email || tech.name;
        const prev = map.get(key);
        if (!prev) {
          map.set(key, tech);
          return map;
        }
        const score = (s?: string) => (s === 'in_progress' ? 3 : s === 'blocked' ? 2 : s === 'not_yet' ? 1 : 0);
        if (score(tech.work_status) >= score(prev.work_status)) {
          map.set(key, tech);
        }
        return map;
      }, new Map<string, Technician>())
    ).map(([, tech]) => tech);

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
    console.error("Data fetch error (webhook only):", error);
    return {
      machines: [],
      technicians: [],
      thresholds: [],
      sensorReadings: [],
      incidents: [],
      maintenanceActions: [],
      kpiLogs: [],
      machineView: [],
      kpiSummary: [],
      histories: {},
      lastUpdate: new Date().toLocaleTimeString('fr-FR'),
      isConnected: false,
    };
  }
}
