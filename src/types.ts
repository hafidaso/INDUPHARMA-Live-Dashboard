/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MachineStatus = 'active' | 'en_panne' | 'maintenance' | 'inactive';
export type ReadingStatus = 'normal' | 'warning' | 'critical' | 'error';
export type Severity = 'low' | 'medium' | 'high' | 'critical';
export type IncidentStatus = 'open' | 'in_progress' | 'escalated' | 'closed';

export interface Machine {
  id: string;
  code_machine?: string;
  name: string;
  type: string;
  location: string;
  status: MachineStatus;
  created_at: string;
  techniciens_count?: number;
  techniciens_active?: number;
}

export interface Technician {
  id: string;
  name: string;
  role: string;
  email: string;
  phone: string;
  is_available: boolean;
  work_status?: 'in_progress' | 'done' | 'blocked' | 'not_yet';
  current_machine?: string;
  current_action?: string;
}

export interface Threshold {
  id: string;
  machine_id: string;
  sensor_type: string;
  min_value: number;
  max_value: number;
  critical_value: number;
  unit: string;
}

export interface SensorReading {
  id: string;
  machine_id: string;
  device_id: string;
  temperature?: number;
  pressure?: number;
  vibration?: number;
  infrared?: number;
  status: ReadingStatus;
  severity: Severity;
  timestamp: string;
}

export interface Incident {
  id: string;
  machine_id: string;
  detected_at: string;
  acknowledged_at?: string;
  resolved_at?: string;
  severity: Severity;
  root_cause?: string;
  description: string;
  status: IncidentStatus;
  created_by: 'auto' | 'manual';
  machine_name?: string; // Joined
}

export interface MaintenanceAction {
  id: string;
  incident_id: string;
  technician_id: string;
  action_taken: string;
  started_at: string;
  completed_at?: string;
  notes?: string;
  technician_name?: string; // Joined
}

export interface KpiLog {
  id: string;
  machine_id: string;
  date: string;
  downtime_minutes: number;
  mtbf_hours: number;
  mttr_minutes: number;
  incident_count: number;
  escalation_count: number;
  closure_rate: number;
  machine_name?: string; // Joined
}

export interface DashboardMachineView {
  machine_id: string;
  code_machine?: string;
  machine_name: string;
  type: string;
  location: string;
  machine_status: MachineStatus;
  latest_device: string;
  latest_status: ReadingStatus;
  latest_severity: Severity;
  latest_value_summary: string;
  active_incident?: string;
  incident_status?: IncidentStatus;
  techniciens_count?: number;
  techniciens_active?: number;
}

export interface DashboardKpiSummary {
  metric: string;
  value: string;
  unit: string;
  status: 'normal' | 'warning' | 'critical' | 'error';
  note: string;
}

