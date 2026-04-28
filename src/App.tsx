/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

// Indupharma Live Dashboard - Production Version
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Database, 
  Download, 
  FileText, 
  Filter, 
  LayoutDashboard, 
  Layers, 
  RefreshCcw, 
  Search, 
  Settings, 
  ShieldAlert, 
  ShieldCheck, 
  Thermometer, 
  TrendingUp, 
  Zap,
  ChevronRight,
  Info,
  User,
  Box,
  Cpu,
  ArrowRight,
  Bell,
  Calendar,
  X,
  Smartphone,
  Wrench,
  BarChart3,
  ListFilter,
  UserCheck,
  ClipboardList
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
  ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { jsPDF } from 'jspdf';

import { 
  fetchSheetData, 
  SHEET_CONFIG 
} from './services/dataService';
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
  Severity,
  IncidentStatus
} from './types';

type ActionProgressStatus = 'done' | 'in_progress' | 'blocked' | 'not_yet';

type DemoUser = {
  email: string;
  password: string;
  role: 'admin' | 'technician';
  name: string;
};

const DEMO_USERS: DemoUser[] = [
  { email: 'admin@indupharma.local', password: 'admin123', role: 'admin', name: 'Dashboard Admin' },
  { email: 'tech@indupharma.local', password: 'tech123', role: 'technician', name: 'Technician Account' },
];

const ACTION_STATUS_LABEL: Record<ActionProgressStatus, string> = {
  done: 'Done',
  in_progress: 'In Progress',
  blocked: 'Blocked',
  not_yet: 'Not Yet',
};

const ACTION_TO_INCIDENT: Partial<Record<ActionProgressStatus, IncidentStatus>> = {
  done: 'closed',
  in_progress: 'in_progress',
};

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Status Color Helpers ---
const getStatusColor = (status: string | undefined) => {
  const s = String(status).toLowerCase();
  if (['active', 'normal', 'low', 'closed', 'true'].includes(s)) return 'emerald';
  if (['maintenance', 'warning', 'medium', 'in_progress'].includes(s)) return 'amber';
  if (['en_panne', 'critical', 'high', 'open', 'escalated'].includes(s)) return 'red';
  if (['inactive', 'error', 'false'].includes(s)) return 'slate';
  return 'slate';
};

const getStatusBadgeClass = (status: string | undefined) => {
  const color = getStatusColor(status);
  return cn(
    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap",
    color === 'emerald' && "bg-emerald-50 text-emerald-600 border-emerald-200",
    color === 'amber' && "bg-amber-50 text-amber-600 border-amber-200",
    color === 'red' && "bg-red-50 text-red-600 border-red-200",
    color === 'slate' && "bg-slate-50 text-slate-500 border-slate-200"
  );
};

// --- Custom Components ---

const Badge = ({ children, status }: { children: React.ReactNode, status: string | undefined }) => (
  <span className={getStatusBadgeClass(status)}>
    {children}
  </span>
);

const Card: React.FC<{ children: React.ReactNode, className?: string, title?: string, icon?: any }> = ({ children, className, title, icon: Icon }) => (
  <div className={cn("bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all", className)}>
    {title && (
      <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/30">
        <h3 className="text-slate-800 font-bold text-sm flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-blue-600" />}
          {title}
        </h3>
      </div>
    )}
    <div className="p-5">
      {children}
    </div>
  </div>
);

const SafeChartContainer: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const element = hostRef.current;
    if (!element) return;

    let rafId = 0;
    if (typeof ResizeObserver === 'undefined') {
      const waitForLayout = () => {
        const rect = element.getBoundingClientRect();
        if (rect.width > 10 && rect.height > 10) {
          setReady(true);
          return;
        }
        rafId = window.requestAnimationFrame(waitForLayout);
      };
      waitForLayout();
      return () => window.cancelAnimationFrame(rafId);
    }

    const checkSize = () => {
      const rect = element.getBoundingClientRect();
      setReady(rect.width > 10 && rect.height > 10);
    };

    // Delay first measurement one frame to avoid transient -1 values during animated mount.
    rafId = window.requestAnimationFrame(checkSize);
    const observer = new ResizeObserver(checkSize);
    observer.observe(element);
    return () => {
      observer.disconnect();
      window.cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <div ref={hostRef} className={className}>
      {ready ? (
        <ResponsiveContainer width="100%" height="100%" minWidth={10} minHeight={10}>
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
};

interface KPICardProps extends DashboardKpiSummary {
  icon: any;
  key?: number | string;
}

const KPICard = ({ metric, value, unit, status, note, icon: Icon }: KPICardProps) => {
  const color = getStatusColor(status);
  return (
    <Card className="flex flex-col h-full bg-white border-l-4" style={{ borderLeftColor: `var(--color-${color}-500)` }}>
      <div className="flex justify-between items-start mb-4">
        <div className={cn("p-2 rounded-lg", 
          color === 'emerald' && "bg-emerald-100 text-emerald-600",
          color === 'amber' && "bg-amber-100 text-amber-600",
          color === 'red' && "bg-red-100 text-red-600",
          color === 'slate' && "bg-slate-100 text-slate-600"
        )}>
          <Icon className="w-5 h-5" />
        </div>
        <Badge status={status}>{status}</Badge>
      </div>
      <div>
        <h4 className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{metric}</h4>
        <div className="flex items-baseline gap-1 mt-1">
          <span className="text-2xl font-black text-slate-900">{value}</span>
          <span className="text-slate-500 text-xs font-bold">{unit}</span>
        </div>
        <p className="text-[10px] text-slate-400 mt-2 italic font-medium">{note}</p>
      </div>
    </Card>
  );
};

// --- Main App ---

export default function App() {
  const INCIDENT_PROGRESS_STORAGE_KEY = 'indupharma_incident_progress';
  const MAINTENANCE_HISTORY_STORAGE_KEY = 'indupharma_maintenance_history';
  const [authUser, setAuthUser] = useState<DemoUser | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMachineId, setSelectedMachineId] = useState<string | null>(null);
  const [showWebhookAlert, setShowWebhookAlert] = useState(false);
  const [incidentProgress, setIncidentProgress] = useState<Record<string, {
    status: ActionProgressStatus;
    technician: string;
    updated_at: string;
  }>>({});
  const [activeCriticalAlert, setActiveCriticalAlert] = useState<Incident | null>(null);
  const [notifiedIncidentIds, setNotifiedIncidentIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'en_panne' | 'maintenance'>('all');
  const [zoneFilter, setZoneFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<TabType>('Vue Globale');
  const [maintenanceHistory, setMaintenanceHistory] = useState<MaintenanceAction[]>([]);
  const [kpiHistory, setKpiHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('indupharma_kpi_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => {
    localStorage.setItem('indupharma_kpi_history', JSON.stringify(kpiHistory.slice(-100)));
  }, [kpiHistory]);

  const selectedMachine = useMemo(() => {
    if (!data || !selectedMachineId) return null;
    return data.machines.find((m: any) => m.id === selectedMachineId);
  }, [data, selectedMachineId]);

  const updateIncidentProgress = (incidentId: string, status: ActionProgressStatus, technician: string) => {
    setIncidentProgress((prev) => ({
      ...prev,
      [incidentId]: {
        status,
        technician,
        updated_at: new Date().toLocaleString('fr-FR'),
      },
    }));
  };

  const incidentsWithWorkflow: Incident[] = useMemo(() => {
    if (!data?.incidents) return [];
    return data.incidents.map((incident: Incident) => {
      const progress = incidentProgress[incident.id];
      const mappedStatus = progress ? ACTION_TO_INCIDENT[progress.status] : undefined;
      return { ...incident, status: mappedStatus ?? incident.status };
    });
  }, [data, incidentProgress]);

  const technicianAlerts = useMemo(() => {
    return incidentsWithWorkflow.map((incident: Incident) => {
      const progress = incidentProgress[incident.id];
      return {
        ...incident,
        actionStatus: progress?.status ?? ('not_yet' as ActionProgressStatus),
        assignedTechnician: progress?.technician ?? 'Unassigned',
        updatedAt: progress?.updated_at ?? '-',
      };
    }).filter((incident: any) =>
      incident.status === 'open' || incident.status === 'in_progress' || incident.status === 'escalated'
    );
  }, [incidentsWithWorkflow, incidentProgress]);

  const dashboardKpiSummary: DashboardKpiSummary[] = useMemo(() => {
    if (!data) return [];
    const machines = data.machines ?? [];
    const activeMachines = machines.filter((m: Machine) => m.status === 'active').length;
    const totalMachines = machines.length;
    const openIncidents = incidentsWithWorkflow.filter(
      (i) => i.status === 'open' || i.status === 'in_progress' || i.status === 'escalated'
    );
    const criticalAlerts = openIncidents.filter((i) => i.severity === 'critical' || i.severity === 'high').length;
    const availableTechs = (data.technicians ?? []).filter((t: Technician) => !!t.is_available).length;
    const availabilityRate = totalMachines > 0 ? Math.round((activeMachines / totalMachines) * 100) : 0;
    const mttr =
      Math.round(((data.kpiLogs ?? []).reduce((a: number, b: KpiLog) => a + b.mttr_minutes, 0)) / ((data.kpiLogs ?? []).length || 1));
    const downtime = (data.kpiLogs ?? []).reduce((a: number, b: KpiLog) => a + b.downtime_minutes, 0);

    return [
      {
        metric: 'Machines actives',
        value: String(activeMachines),
        unit: '/',
        status: availabilityRate >= 80 ? 'normal' : 'warning',
        note: `${totalMachines} machines total`,
      },
      {
        metric: 'Incidents ouverts',
        value: String(openIncidents.length),
        unit: '',
        status: openIncidents.length > 0 ? 'critical' : 'normal',
        note: 'Live incidents after technician workflow',
      },
      {
        metric: 'Alertes critiques',
        value: String(criticalAlerts),
        unit: '',
        status: criticalAlerts > 0 ? 'critical' : 'normal',
        note: 'Critical/high incidents currently open',
      },
      {
        metric: 'MTTR moyen',
        value: String(mttr),
        unit: 'min',
        status: 'normal',
        note: 'Calculated from API-derived KPI logs',
      },
      {
        metric: 'Downtime total',
        value: String(downtime),
        unit: 'min',
        status: 'warning',
        note: 'Derived from etat_global',
      },
      {
        metric: 'Techniciens dispo.',
        value: String(availableTechs),
        unit: '',
        status: availableTechs > 0 ? 'normal' : 'critical',
        note: 'Live technician roster availability',
      },
    ];
  }, [data, incidentsWithWorkflow]);

  const siteRecommendations = useMemo(() => {
    const criticalIncidents = incidentsWithWorkflow.filter((i: any) => i.severity === 'critical' || i.severity === 'high');
    return criticalIncidents.map((inc: any) => {
      let rec = "Inspection immédiate requise.";
      let owner = "Maintenance";

      if (inc.machine_name?.includes('Autoclave') && inc.description.includes('Surpression')) {
        rec = "Surpression détectée. Vérifier la valve de sécurité, isoler l’équipement et valider QA avant reprise.";
        owner = "Qualité / Maintenance";
      } else if (inc.machine_name?.includes('Chambre Froide')) {
        rec = "Température hors plage basse. Contrôler le thermostat, vérifier les lots sensibles et maintenir la quarantaine jusqu’à validation QA.";
        owner = "Qualité";
      } else if (inc.description.includes('Vibration')) {
        rec = "Vibration anormale. Planifier inspection roulements et surveillance renforcée.";
        owner = "Maintenance";
      }

      return {
        machine: inc.machine_name,
        severity: inc.severity,
        recommendation: rec,
        owner
      };
    });
  }, [incidentsWithWorkflow]);

  const technicianGroups = useMemo(() => {
    const allTechs: Technician[] = data?.technicians ?? [];
    return {
      activeNow: allTechs.filter((t) => t.work_status === 'in_progress' || t.work_status === 'blocked'),
      done: allTechs.filter((t) => t.work_status === 'done'),
      notWorking: allTechs.filter((t) => !t.work_status || t.work_status === 'not_yet'),
    };
  }, [data]);

  const sensorCards = useMemo(() => {
    if (!data?.machines || !data?.histories) return [];
    return data.machines
      .map((m: Machine, index: number) => {
        const history = data.histories[m.id] ?? [];
        const latest = history.length > 0 ? history[history.length - 1] : null;
        const reading = (data.sensorReadings ?? []).find((r: SensorReading) => r.machine_id === m.id);
        let unit = latest?.unit ?? '';
        if (!unit) {
          if (reading?.pressure != null) unit = 'bar';
          else if (reading?.temperature != null) unit = '°C';
          else if (reading?.vibration != null) unit = 'g';
          else if (reading?.infrared != null) unit = '°C';
        }
        return {
          id: m.id,
          name: m.name,
          history,
          latestValue: latest?.value != null ? Number(latest.value).toFixed(2) : 'N/A',
          latestTime: latest?.timestamp ? new Date(latest.timestamp).toLocaleTimeString() : '--:--:--',
          unit,
          chartType: index % 2 === 0 ? 'line' : 'area',
          color: ['#2563eb', '#f59e0b', '#ef4444', '#10b981'][index % 4],
        };
      })
      .filter((c: any) => Array.isArray(c.history) && c.history.length > 0);
  }, [data]);

  const machineViewWithWorkflow = useMemo(() => {
    if (!data?.machineView) return [];
    return data.machineView.map((mv: DashboardMachineView) => {
      const incident = incidentsWithWorkflow.find(i => i.machine_id === mv.machine_id);
      const isClosed = incident && (incident.status === 'closed' || incident.status === 'resolved');
      return {
        ...mv,
        active_incident: isClosed ? undefined : mv.active_incident,
        incident_status: incident ? incident.status : mv.incident_status
      };
    });
  }, [data?.machineView, incidentsWithWorkflow]);

  const allZones = useMemo(() => {
    if (!data?.machines) return [];
    const zones = new Set<string>();
    data.machines.forEach(m => {
      if (m.location) zones.add(m.location);
    });
    return Array.from(zones).sort();
  }, [data]);

  const filteredMachineView = useMemo(() => {
    let result = [...machineViewWithWorkflow];
    
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.machine_name.toLowerCase().includes(q) || 
        m.type.toLowerCase().includes(q) || 
        m.location.toLowerCase().includes(q) ||
        m.code_machine?.toLowerCase().includes(q)
      );
    }
    
    if (statusFilter !== 'all') {
      result = result.filter(m => m.machine_status === statusFilter);
    }

    if (zoneFilter !== 'all') {
      result = result.filter(m => m.location === zoneFilter);
    }
    
    result.sort((a, b) => {
      const score = (s: string) => s === 'en_panne' ? 3 : s === 'maintenance' ? 2 : s === 'active' ? 1 : 0;
      return score(b.machine_status) - score(a.machine_status);
    });
    
    return result;
  }, [machineViewWithWorkflow, searchQuery, statusFilter, zoneFilter]);

  const filteredMachines = useMemo(() => {
    if (!data?.machines) return [];
    let result = [...data.machines];
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(m => 
        m.name.toLowerCase().includes(q) || 
        m.type.toLowerCase().includes(q) || 
        m.code_machine?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') {
      result = result.filter(m => m.status === statusFilter);
    }

    if (zoneFilter !== 'all') {
      result = result.filter(m => m.location === zoneFilter);
    }
    
    result.sort((a, b) => {
      const score = (s: string) => s === 'en_panne' ? 3 : s === 'maintenance' ? 2 : s === 'active' ? 1 : 0;
      return score(b.status) - score(a.status);
    });
    
    return result;
  }, [data, searchQuery, statusFilter, zoneFilter]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const user = DEMO_USERS.find((u) => u.email === email.trim() && u.password === password);
    if (!user) {
      setLoginError('Identifiants invalides.');
      return;
    }
    setAuthUser(user);
    setLoginError(null);
  };

  const handleLogout = () => {
    setAuthUser(null);
    setEmail('');
    setPassword('');
    setLoginError(null);
  };

  const handleRefresh = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const result = await fetchSheetData();
      setData(result);
      
      // Accumulate history point
      if (result.machines && result.machines.length > 0) {
        const activeCount = result.machines.filter(m => m.status === 'active').length;
        const totalCount = result.machines.length;
        const alertsCount = result.machines.filter(m => m.status === 'en_panne').length;
        
        const newPoint = {
          id: Date.now(),
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          nb_alertes: alertsCount,
          disponibilite: Math.round((activeCount / totalCount) * 100),
          performance: 95 - (alertsCount * 5), // dynamic proxy
        };
        
        setKpiHistory(prev => {
          // Only add if timestamp is different or value changed to avoid duplicate spam
          const lastPoint = prev[prev.length - 1];
          if (lastPoint && lastPoint.timestamp === newPoint.timestamp && lastPoint.nb_alertes === newPoint.nb_alertes) {
            return prev;
          }
          return [...prev, newPoint].slice(-100);
        });
      }

      setError(null);
    } catch (err) {
      setError("Connection Error");
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = () => {
    if (!data) return;

    const now = new Date();
    const reportId = `RPT-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${now.getTime().toString().slice(-6)}`;
    const incidentsLinked: Incident[] = (data.incidents ?? []).map((incident: Incident) => {
      const progress = incidentProgress[incident.id];
      const mappedStatus = progress ? ACTION_TO_INCIDENT[progress.status] : undefined;
      return { ...incident, status: mappedStatus ?? incident.status };
    });
    const openIncidents = incidentsLinked.filter((i: any) => i.status === 'open' || i.status === 'in_progress' || i.status === 'escalated').length;
    const activeMachines = (data.machines ?? []).filter((m: any) => m.status === 'active').length;
    const totalMachines = (data.machines ?? []).length;
    const availableTechs = (data.technicians ?? []).filter((t: any) => !!t.is_available).length;
    const availabilityRate = totalMachines > 0 ? Math.round((activeMachines / totalMachines) * 100) : 0;
    const productionStatus =
      openIncidents === 0 ? 'Stable' : openIncidents <= 2 ? 'Sous surveillance' : 'Alerte';
    const productionStatusColor =
      productionStatus === 'Stable' ? [34, 197, 94] : productionStatus === 'Sous surveillance' ? [245, 158, 11] : [239, 68, 68];
    const machineRows = (data.machineView ?? [])
      .map((mv: any) => {
        const incident = incidentsLinked.find((inc: any) => inc.machine_id === mv.machine_id);
        return {
          name: mv.machine_name ?? 'N/A',
          zone: mv.location ?? 'N/A',
          status: mv.machine_status ?? 'inactive',
          criticite: incident?.severity ?? 'none',
          updatedAt: data.lastUpdate ?? '--:--:--',
        };
      })
      .slice(0, 7);

    const attentionPoints: string[] = [];
    if (openIncidents > 0) attentionPoints.push(`${openIncidents} incident(s) ouvert(s) en cours de traitement.`);
    if (availableTechs === 0) attentionPoints.push('Aucun technicien disponible actuellement.');
    if (availabilityRate < 80) attentionPoints.push(`Disponibilite machines faible (${availabilityRate}%).`);
    if (attentionPoints.length === 0) attentionPoints.push('Aucun point d attention critique detecte au snapshot.');

    const dynamicRecommendation =
      (siteRecommendations?.[0]?.recommendation as string | undefined) ??
      (openIncidents > 0
        ? 'Prioriser la resolution des incidents ouverts et renforcer le suivi des equipements en alerte.'
        : 'Maintenir la surveillance active et verifier la disponibilite maintenance avant les pics de production.');

    const zonesMap = new Map<string, { total: number; active: number }>();
    (data.machines ?? []).forEach((m: any) => {
      const zone = m.location || 'N/A';
      const stats = zonesMap.get(zone) || { total: 0, active: 0 };
      stats.total += 1;
      if (m.status === 'active') stats.active += 1;
      zonesMap.set(zone, stats);
    });
    const zoneStats = Array.from(zonesMap.entries()).map(([name, stats]) => ({
      name,
      total: stats.total,
      active: stats.active,
      percent: Math.round((stats.active / stats.total) * 100)
    })).slice(0, 4);

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 12;
    const contentWidth = pageWidth - margin * 2;
    const colors = {
      bg: [247, 244, 238] as [number, number, number],
      card: [255, 255, 255] as [number, number, number],
      border: [226, 232, 240] as [number, number, number],
      title: [15, 23, 42] as [number, number, number],
      subtitle: [71, 85, 105] as [number, number, number],
      ok: [34, 197, 94] as [number, number, number],
      alert: [239, 68, 68] as [number, number, number],
      neutral: [148, 163, 184] as [number, number, number],
    };

    const drawCard = (x: number, y: number, w: number, h: number, title: string, value: string, accent?: [number, number, number]) => {
      doc.setFillColor(...colors.card);
      doc.setDrawColor(...colors.border);
      doc.roundedRect(x, y, w, h, 2.5, 2.5, 'FD');
      if (accent) {
        doc.setFillColor(...accent);
        doc.rect(x, y, 1.6, h, 'F');
      }
      doc.setTextColor(...colors.subtitle);
      doc.setFontSize(9);
      doc.text(title, x + 4, y + 5.3);
      doc.setTextColor(...colors.title);
      doc.setFontSize(12.5);
      doc.text(value, x + 4, y + 11.3);
    };

    const drawFooter = () => {
      const pages = doc.getNumberOfPages();
      for (let p = 1; p <= pages; p += 1) {
        doc.setPage(p);
        doc.setDrawColor(...colors.border);
        doc.setLineWidth(0.2);
        doc.line(margin, pageHeight - 12, pageWidth - margin, pageHeight - 12);
        doc.setTextColor(...colors.subtitle);
        doc.setFontSize(8);
        doc.text('Generated by INDUPHARMA Dashboard', margin, pageHeight - 8.3);
        doc.text('Document interne', pageWidth / 2, pageHeight - 8.3, { align: 'center' });
        doc.text('Version: v1.0', pageWidth - margin - 28, pageHeight - 8.3);
        doc.text(`Page ${p}/${pages}`, pageWidth - margin, pageHeight - 8.3, { align: 'right' });
      }
    };

    const finalize = () => doc.save(`${reportId}.pdf`);

    const drawReport = (logoDataUrl?: string) => {
      doc.setFillColor(...colors.bg);
      doc.rect(0, 0, pageWidth, pageHeight, 'F');

      let y = 12;

      // Header
      doc.setFillColor(...colors.card);
      doc.setDrawColor(...colors.border);
      doc.roundedRect(margin, y, contentWidth, 28, 3, 3, 'FD');

      if (logoDataUrl) {
        doc.addImage(logoDataUrl, 'PNG', margin + 3, y + 4.5, 32, 11);
      } else {
        doc.setTextColor(...colors.title);
        doc.setFontSize(12);
        doc.text('INDUPHARMA', margin + 4, y + 10);
      }

      doc.setTextColor(...colors.title);
      doc.setFontSize(17);
      doc.text('Rapport de Production', margin + 40, y + 8.8);
      doc.setTextColor(...colors.subtitle);
      doc.setFontSize(9.2);
      doc.text('Snapshot operationnel des equipements critiques', margin + 40, y + 14.4);
      doc.text(`Rapport ID: ${reportId}`, margin + 40, y + 19.2);
      doc.text(`Genere le: ${now.toLocaleString('fr-FR')}`, margin + 40, y + 23.8);

      y += 33;

      // Executive summary
      doc.setFillColor(...colors.card);
      doc.setDrawColor(...colors.border);
      doc.roundedRect(margin, y, contentWidth, 14, 2.5, 2.5, 'FD');
      const summary = `Snapshot live: ${totalMachines} machine(s), ${activeMachines} active(s), ${openIncidents} incident(s) ouvert(s), ${availableTechs} technicien(s) disponible(s).`;
      doc.setTextColor(...colors.title);
      doc.setFontSize(9.1);
      const summaryLines = doc.splitTextToSize(summary, contentWidth - 8);
      doc.text(summaryLines, margin + 4, y + 5.4);
      y += 17;

      // KPI cards (5)
      const cardGap = 2.6;
      const cardW = (contentWidth - cardGap * 4) / 5;
      const cardH = 15;
      drawCard(margin, y, cardW, cardH, 'Machines actives', `${activeMachines}/${totalMachines}`, colors.ok);
      drawCard(margin + (cardW + cardGap) * 1, y, cardW, cardH, 'Incidents ouverts', String(openIncidents), openIncidents > 0 ? colors.alert : colors.ok);
      drawCard(margin + (cardW + cardGap) * 2, y, cardW, cardH, 'Techniciens dispo.', String(availableTechs), availableTechs > 0 ? colors.ok : colors.alert);
      drawCard(margin + (cardW + cardGap) * 3, y, cardW, cardH, 'Disponibilite', `${availabilityRate}%`, availabilityRate >= 80 ? colors.ok : colors.alert);
      drawCard(margin + (cardW + cardGap) * 4, y, cardW, cardH, 'Statut global', productionStatus, productionStatusColor as [number, number, number]);
      y += cardH + 5.5;

      // Equipments section
      doc.setTextColor(...colors.title);
      doc.setFontSize(11.5);
      doc.text('Equipements (snapshot)', margin, y);
      y += 3.2;

      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(...colors.border);
      doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'FD');
      doc.setTextColor(...colors.subtitle);
      doc.setFontSize(8.3);
      doc.text('Nom', margin + 2, y + 4.5);
      doc.text('Zone', margin + 56, y + 4.5);
      doc.text('Statut', margin + 107, y + 4.5);
      doc.text('Criticite', margin + 132, y + 4.5);
      doc.text('Maj', margin + 162, y + 4.5);
      y += 8;

      machineRows.forEach((m: any, idx: number) => {
        const rowH = 6.8;
        if (idx % 2 === 0) {
          doc.setFillColor(250, 250, 249);
          doc.rect(margin, y - 4.6, contentWidth, rowH, 'F');
        }
        const severity = String(m.criticite ?? 'none').toUpperCase();
        const statusColor = m.status === 'active' ? colors.ok : colors.alert;

        doc.setTextColor(...colors.title);
        doc.setFontSize(8.2);
        doc.text(String(m.name ?? 'N/A').slice(0, 26), margin + 2, y);
        doc.setTextColor(...colors.subtitle);
        doc.text(String(m.zone ?? 'N/A').slice(0, 22), margin + 56, y);

        doc.setFillColor(...statusColor);
        doc.roundedRect(margin + 105, y - 3.8, 18, 5.2, 1.8, 1.8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(7.5);
        doc.text(m.status === 'active' ? 'OK' : 'ALERTE', margin + 114, y - 0.2, { align: 'center' });

        doc.setTextColor(...colors.title);
        doc.setFontSize(8.1);
        doc.text(severity, margin + 132, y);
        doc.setTextColor(...colors.subtitle);
        doc.text(String(m.updatedAt ?? '--:--:--'), margin + 162, y);

        y += 6.3;
      });

      y += 5.5;

      // Productivity by Zone section
      doc.setTextColor(...colors.title);
      doc.setFontSize(11.5);
      doc.text('Performance par Zone', margin, y);
      y += 3.2;

      doc.setFillColor(241, 245, 249);
      doc.setDrawColor(...colors.border);
      doc.roundedRect(margin, y, contentWidth, 7, 1.5, 1.5, 'FD');
      doc.setTextColor(...colors.subtitle);
      doc.setFontSize(8.3);
      doc.text('Nom de la Zone', margin + 2, y + 4.5);
      doc.text('Total Equip.', margin + 70, y + 4.5);
      doc.text('En Service', margin + 110, y + 4.5);
      doc.text('Productivite (%)', margin + 150, y + 4.5);
      y += 8;

      zoneStats.forEach((z: any, idx: number) => {
        if (idx % 2 === 0) {
          doc.setFillColor(250, 250, 249);
          doc.rect(margin, y - 4.6, contentWidth, 6.8, 'F');
        }
        doc.setTextColor(...colors.title);
        doc.setFontSize(8.2);
        doc.text(z.name, margin + 2, y);
        doc.text(String(z.total), margin + 70, y);
        doc.text(String(z.active), margin + 110, y);
        
        const zColor = z.percent >= 80 ? colors.ok : (z.percent >= 50 ? [245, 158, 11] as [number, number, number] : colors.alert);
        doc.setTextColor(...zColor);
        doc.setFontSize(8.5);
        doc.text(`${z.percent}%`, margin + 150, y);
        y += 6.3;
      });

      y += 2.5;

      // Points d'attention
      const attentionText = attentionPoints.join(' ');
      doc.setFillColor(255, 250, 245);
      doc.setDrawColor(...colors.border);
      doc.roundedRect(margin, y, contentWidth, 13, 2.3, 2.3, 'FD');
      doc.setTextColor(...colors.title);
      doc.setFontSize(9.5);
      doc.text('Points d attention', margin + 3, y + 4.5);
      doc.setTextColor(...colors.subtitle);
      doc.setFontSize(8.3);
      doc.text(doc.splitTextToSize(attentionText, contentWidth - 8), margin + 3, y + 8.8);
      y += 15.5;

      // Recommendation IA
      doc.setFillColor(243, 248, 255);
      doc.setDrawColor(...colors.border);
      doc.roundedRect(margin, y, contentWidth, 10.5, 2.3, 2.3, 'FD');
      doc.setTextColor(...colors.title);
      doc.setFontSize(9.3);
      doc.text('Recommandation IA', margin + 3, y + 4.2);
      doc.setTextColor(...colors.subtitle);
      doc.setFontSize(8.2);
      doc.text(
        doc.splitTextToSize(
          dynamicRecommendation,
          contentWidth - 8
        ),
        margin + 3,
        y + 8.1
      );

      drawFooter();
      finalize();
    };

    fetch('/logo.png')
      .then((res) => res.blob())
      .then((blob) => {
        const reader = new FileReader();
        reader.onload = () => drawReport(String(reader.result || ''));
        reader.onerror = () => drawReport();
        reader.readAsDataURL(blob);
      })
      .catch(() => drawReport());
  };

  useEffect(() => {
    handleRefresh();
    const interval = setInterval(() => handleRefresh(true), SHEET_CONFIG.refreshIntervalMs);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(MAINTENANCE_HISTORY_STORAGE_KEY);
      if (raw) setMaintenanceHistory(JSON.parse(raw));
    } catch (e) { console.error('Failed to load history', e); }
  }, []);

  useEffect(() => {
    if (!data?.maintenanceActions) return;
    setMaintenanceHistory(prev => {
      const merged = [...prev];
      data.maintenanceActions.forEach((newAct: MaintenanceAction) => {
        const idx = merged.findIndex(a => a.id === newAct.id);
        if (idx === -1) {
          merged.push(newAct);
        } else {
          merged[idx] = { ...merged[idx], ...newAct };
        }
      });
      // Sort by started_at desc
      merged.sort((a, b) => new Date(b.started_at).getTime() - new Date(a.started_at).getTime());
      
      const limited = merged.slice(0, 100); // Keep last 100 actions
      window.localStorage.setItem(MAINTENANCE_HISTORY_STORAGE_KEY, JSON.stringify(limited));
      return limited;
    });
  }, [data?.maintenanceActions]);

  useEffect(() => {
    if (!loading && data && data.isConnected === false) {
      setShowWebhookAlert(true);
    }
    if (data?.isConnected) {
      setShowWebhookAlert(false);
    }
  }, [data, loading]);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(INCIDENT_PROGRESS_STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        setIncidentProgress(parsed);
      }
    } catch {
      // ignore storage parse errors
    }
  }, [INCIDENT_PROGRESS_STORAGE_KEY]);

  useEffect(() => {
    if (!incidentsWithWorkflow) return;
    
    // Find a new critical incident that hasn't been notified yet
    const newCritical = incidentsWithWorkflow.find((inc: Incident) => 
      inc.severity === 'critical' && 
      !notifiedIncidentIds.has(inc.id) &&
      inc.status === 'open'
    );

    if (newCritical) {
      setActiveCriticalAlert(newCritical);
      setNotifiedIncidentIds(prev => new Set(prev).add(newCritical.id));
      
      // Play a sharp alarm sound
      try {
        const audio = new Audio('https://cdn.pixabay.com/audio/2022/03/10/audio_c8c8a7351b.mp3');
        audio.play().catch(() => console.log('Audio playback blocked - waiting for user interaction'));
      } catch (e) {
        console.error('Audio alert failed', e);
      }
    }
  }, [incidentsWithWorkflow, notifiedIncidentIds]);

  useEffect(() => {
    try {
      window.localStorage.setItem(INCIDENT_PROGRESS_STORAGE_KEY, JSON.stringify(incidentProgress));
    } catch {
      // ignore storage write errors
    }
  }, [incidentProgress, INCIDENT_PROGRESS_STORAGE_KEY]);


  const webhookAlertPopup = showWebhookAlert ? (
    <div className="fixed inset-0 z-[120] bg-slate-900/45 backdrop-blur-sm flex items-center justify-center px-4">
      <div className="w-full max-w-lg bg-white border border-red-200 rounded-2xl shadow-2xl p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-black text-slate-900">Webhook indisponible</h3>
            <p className="text-sm text-slate-600 mt-1">
              Les donnees live ne sont pas recues. Merci de verifier rapidement le webhook et la connectivite API.
            </p>
            <p className="text-xs text-slate-500 mt-2 font-bold">
              Action recommandee: controler le endpoint production-status et relancer le flux.
            </p>
          </div>
        </div>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            onClick={() => setShowWebhookAlert(false)}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-bold"
          >
            Fermer
          </button>
          <button
            onClick={() => {
              setShowWebhookAlert(false);
              handleRefresh();
            }}
            className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-bold"
          >
            Reessayer maintenant
          </button>
        </div>
      </div>
    </div>
  ) : null;

  const criticalAlertPopup = activeCriticalAlert ? (
    <div className="fixed inset-0 z-[150] bg-red-950/80 backdrop-blur-md flex items-center justify-center px-4">
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="w-full max-w-lg bg-white border-4 border-red-600 rounded-3xl shadow-[0_0_50px_rgba(220,38,38,0.5)] p-8 text-center"
      >
        <div className="w-20 h-20 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-bounce">
          <ShieldAlert className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-2">ALERTE CRITIQUE</h2>
        <div className="bg-red-50 text-red-700 py-2 px-4 rounded-full inline-block text-xs font-black mb-6 border border-red-100">
          MAINTENANCE IMMÉDIATE REQUISE
        </div>
        
        <div className="space-y-4 mb-8">
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Équipement</p>
            <p className="text-xl font-black text-slate-800">{activeCriticalAlert.machine_name}</p>
          </div>
          <div>
            <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest">Description</p>
            <p className="text-sm text-slate-600 font-medium">{activeCriticalAlert.description}</p>
          </div>
        </div>

        <button
          onClick={() => setActiveCriticalAlert(null)}
          className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black text-lg shadow-xl shadow-red-200 transition-all active:scale-95"
        >
          ACQUITTER ET SILENCIEUX
        </button>
      </motion.div>
    </div>
  ) : null;

  if (!authUser) return (
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center px-6">
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-2xl shadow-sm p-6">
        <div className="text-center mb-6">
          <img src="/logo.png" alt="INDUPHARMA" className="h-14 w-auto mx-auto mb-3" />
          <h1 className="text-slate-900 text-xl font-black">INDUPHARMA Access</h1>
          <p className="text-slate-500 text-sm mt-1">Login as Admin or Technician</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="admin@indupharma.local"
            />
          </div>
          <div>
            <label className="block text-xs font-black text-slate-500 uppercase mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-200"
              placeholder="••••••••"
            />
          </div>
          {loginError && <p className="text-xs text-red-600 font-bold">{loginError}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-lg py-2.5 text-sm font-black"
          >
            Login
          </button>
        </form>
        <div className="mt-5 text-xs text-slate-500 bg-slate-50 border border-slate-200 rounded-lg p-3">
          <p className="font-black text-slate-700 mb-1">Demo accounts:</p>
          <p>Admin: admin@indupharma.local / admin123</p>
          <p>Technician: tech@indupharma.local / tech123</p>
        </div>
      </div>
    </div>
  );

  if (loading && !data) return (
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center">
      <RefreshCcw className="w-8 h-8 text-blue-600 animate-spin" />
    </div>
  );

  if (!data) return (
    <div className="min-h-screen bg-[#F7F4EE] flex items-center justify-center px-6">
      <div className="bg-white border border-red-200 rounded-xl p-6 text-center max-w-md">
        <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <h2 className="text-slate-900 font-black text-lg">Data unavailable</h2>
        <p className="text-slate-500 text-sm mt-2">
          The dashboard could not load sheet data right now. Please retry in a few seconds.
        </p>
        <button
          onClick={() => handleRefresh()}
          className="mt-4 inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-bold"
        >
          <RefreshCcw className="w-4 h-4" />
          Retry
        </button>
      </div>
    </div>
  );

  if (authUser.role === 'technician') {
    const openAlertCount = technicianAlerts.filter((a: any) => a.actionStatus !== 'done').length;
    return (
      <div className="min-h-screen bg-[#F7F4EE] text-slate-800">
        {webhookAlertPopup}
        {criticalAlertPopup}
        <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <img src="/logo.png" alt="INDUPHARMA" className="h-10 sm:h-12 w-auto" />
              <div>
                <h1 className="text-base sm:text-lg font-black">Technician Dashboard</h1>
                <p className="text-[10px] sm:text-xs text-slate-500">Connected as {authUser.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleRefresh()}
                className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-black"
              >
                Refresh
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 sm:flex-none px-3 py-2 rounded-lg bg-red-50 text-red-600 border border-red-200 text-xs font-black"
              >
                Logout
              </button>
            </div>
          </div>
        </header>
        <main className="max-w-6xl mx-auto p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <p className="text-[10px] uppercase font-black text-slate-400">Total Alerts</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{technicianAlerts.length}</p>
            </Card>
            <Card>
              <p className="text-[10px] uppercase font-black text-slate-400">Open / Processing</p>
              <p className="text-2xl font-black text-amber-600 mt-1">{openAlertCount}</p>
            </Card>
            <Card>
              <p className="text-[10px] uppercase font-black text-slate-400">Last Update</p>
              <p className="text-sm font-black text-slate-900 mt-1">{data.lastUpdate}</p>
            </Card>
          </div>

          <Card title="Technician Alerts Queue" icon={AlertTriangle}>
            <div className="space-y-4">
              {technicianAlerts.map((alert: any) => (
                <div key={alert.id} className="border border-slate-200 rounded-xl p-4 bg-white">
                  <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                    <div>
                      <p className="text-sm font-black text-slate-900">{alert.machine_name}</p>
                      <p className="text-xs text-slate-500">{alert.description}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge status={alert.severity}>{alert.severity}</Badge>
                      <Badge status={alert.actionStatus}>{ACTION_STATUS_LABEL[alert.actionStatus]}</Badge>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {(['done', 'in_progress', 'blocked', 'not_yet'] as ActionProgressStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => updateIncidentProgress(alert.id, s, authUser.name)}
                        className={cn(
                          'px-3 py-1.5 rounded-lg border text-xs font-black uppercase',
                          alert.actionStatus === s
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                        )}
                      >
                        {ACTION_STATUS_LABEL[s]}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400 mt-3">
                    Technician: {alert.assignedTechnician} | Updated: {alert.updatedAt}
                  </p>
                </div>
              ))}
            </div>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F4EE] text-slate-800 font-sans selection:bg-blue-600/10">
      {webhookAlertPopup}
      {criticalAlertPopup}
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50 px-4 sm:px-6 py-3 sm:py-4">
        <div className="max-w-[1600px] mx-auto flex flex-col lg:flex-row items-center justify-between gap-4 lg:gap-6">
          <div className="flex items-center gap-3 sm:gap-4 w-full lg:w-auto">
            <img src="/logo.png" alt="INDUPHARMA" className="h-14 sm:h-20 w-auto" />
            <div className="flex-1">
              <div className="flex items-center gap-2 sm:gap-3">
                {error ? (
                  <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] sm:text-[10px] uppercase tracking-widest rounded border border-red-200 font-black flex items-center gap-1">
                    <AlertTriangle className="w-2.5 h-2.5" /> Connection Error
                  </span>
                ) : data?.isConnected ? (
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[9px] sm:text-[10px] uppercase tracking-widest rounded border border-emerald-200 font-black flex items-center gap-1">
                    <Database className="w-2.5 h-2.5" /> Webhook Live
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 text-[9px] sm:text-[10px] uppercase tracking-widest rounded border border-blue-100 font-black flex items-center gap-1">
                    <Database className="w-2.5 h-2.5" /> Webhook Ready
                  </span>
                )}
              </div>
              <p className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider mt-1 leading-tight">
                Live Monitoring & GMP Maintenance Intelligence
              </p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 w-full lg:w-auto">
            <div className="hidden sm:flex items-center gap-6">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Last Refresh</span>
                <span className="text-sm text-slate-700 font-bold font-mono">{data?.lastUpdate || '--:--:--'}</span>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-400 uppercase font-black tracking-widest">Global Status</span>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                  <span className="text-xs font-black text-emerald-600 uppercase">Operational</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-2 w-full sm:w-auto">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleLogout}
                  className="px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-xs font-black"
                >
                  Logout
                </button>
                <button 
                  onClick={() => handleRefresh()}
                  className="p-2.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition-all active:scale-95"
                >
                  <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
                </button>
              </div>
              <button
                onClick={handleExportReport}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-5 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all shadow-lg shadow-blue-200 active:scale-95 whitespace-nowrap"
              >
                <Download className="w-4 h-4 text-blue-200" />
                Exporter Rapport
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto p-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white rounded-xl border border-slate-200 overflow-x-auto no-scrollbar shadow-sm">
          {[
            { id: 'Vue Globale', icon: LayoutDashboard },
            { id: 'Machines', icon: Box },
            { id: 'Capteurs', icon: Smartphone },
            { id: 'Incidents', icon: AlertTriangle },
            { id: 'Maintenance', icon: Wrench },
            { id: 'KPIs', icon: BarChart3 },
            { id: 'Seuils', icon: ListFilter },
            { id: 'Techniciens', icon: UserCheck }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-xs font-black uppercase tracking-widest transition-all whitespace-nowrap",
                activeTab === tab.id 
                  ? "bg-slate-900 text-white shadow-lg" 
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.id}
            </button>
          ))}
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'Vue Globale' && (
            <motion.div 
              key="global-view"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              {/* Zone Status Summary Bar */}
              <div className="flex flex-wrap gap-3 mb-2">
                {allZones.map(zone => {
                  const machinesInZone = (data?.machineView ?? []).filter((mv: any) => mv.location === zone);
                  const alertsInZone = machinesInZone.filter((mv: any) => mv.active_incident).length;
                  return (
                    <div key={zone} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-slate-200 rounded-full shadow-sm text-[10px] font-black uppercase tracking-tight">
                      <span className="text-slate-500">{zone}</span>
                      <div className="flex items-center gap-1">
                        <div className={cn("w-2 h-2 rounded-full", alertsInZone > 0 ? "bg-red-500 animate-pulse" : "bg-emerald-500")} />
                        <span className={alertsInZone > 0 ? "text-red-600" : "text-emerald-600"}>
                          {machinesInZone.length - alertsInZone}/{machinesInZone.length} OK
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* KPI Summary Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                {dashboardKpiSummary.map((kpi: DashboardKpiSummary, idx: number) => (
                      <KPICard 
                        key={idx} 
                        metric={kpi.metric}
                        value={kpi.value}
                        unit={kpi.unit}
                        status={kpi.status}
                        note={kpi.note}
                        icon={[Box, AlertTriangle, ShieldAlert, Clock, Activity, UserCheck][idx % 6]} 
                      />
                ))}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Machine Status Grid */}
                <div className="lg:col-span-2 space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <h2 className="text-xl font-black text-slate-900 uppercase tracking-tight flex items-center gap-2">
                       <Box className="w-5 h-5 text-blue-600" />
                       Machine Status Map
                    </h2>
                    <div className="flex flex-wrap items-center gap-2">
                       <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                          <Search className="w-4 h-4 text-slate-400" />
                          <input 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="text-xs outline-none w-28 md:w-40 bg-transparent" 
                            placeholder="Rechercher..." 
                          />
                       </div>
                       <select 
                         value={zoneFilter}
                         onChange={(e) => setZoneFilter(e.target.value)}
                         className="bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase px-2 py-1.5 outline-none shadow-sm cursor-pointer"
                       >
                          <option value="all">Toutes Zones</option>
                          {allZones.map(z => <option key={z} value={z}>{z}</option>)}
                       </select>
                       <select 
                         value={statusFilter}
                         onChange={(e) => setStatusFilter(e.target.value as any)}
                         className="bg-white border border-slate-200 rounded-lg text-[10px] font-black uppercase px-2 py-1.5 outline-none shadow-sm cursor-pointer"
                       >
                          <option value="all">Tous Status</option>
                          <option value="active">Actifs</option>
                          <option value="en_panne">🚨 En Panne</option>
                          <option value="maintenance">🔧 Maintenance</option>
                       </select>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredMachineView.map((mv: DashboardMachineView) => (
                      <Card 
                        key={mv.machine_id} 
                        className="cursor-pointer hover:border-blue-300 group"
                        onClick={() => setSelectedMachineId(mv.machine_id)}
                      >
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-slate-900 font-black text-sm uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                                {mv.machine_name}
                              </h3>
                              {mv.code_machine && (
                                <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded border border-slate-200 uppercase">
                                  {mv.code_machine}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-slate-500 font-bold uppercase">{mv.type}</span>
                              <span className="text-slate-300 text-[10px]">•</span>
                              <span className="text-[10px] text-slate-500 font-bold uppercase">{mv.location}</span>
                            </div>
                          </div>
                          <Badge status={mv.machine_status}>{mv.machine_status}</Badge>
                        </div>

                        {mv.techniciens_active && mv.techniciens_active > 0 ? (
                           <div className="mb-4 flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-lg">
                              <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
                              <span className="text-[10px] font-black text-indigo-700 uppercase">
                                {mv.techniciens_active} Technicien(s) Actif(s)
                              </span>
                           </div>
                        ) : null}

                        <div className="p-3 bg-slate-50 rounded-lg space-y-3 border border-slate-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                              <span className="text-[10px] font-black text-slate-500 uppercase">{mv.latest_device}</span>
                            </div>
                            <Badge status={mv.latest_status}>{mv.latest_status}</Badge>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700">{mv.latest_value_summary}</span>
                            <Badge status={mv.latest_severity}>{mv.latest_severity}</Badge>
                          </div>
                        </div>

                        {mv.active_incident && (
                          <div className="mt-3 flex items-center justify-between px-3 py-2 bg-red-50 border border-red-100 rounded-lg animate-pulse">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
                              <span className="text-[10px] font-black text-red-600 uppercase tracking-tighter">Incident: {mv.active_incident}</span>
                            </div>
                            <Badge status={mv.incident_status}>{mv.incident_status}</Badge>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Sidebar Cards */}
                <div className="space-y-6">
                  {/* AI Recommendations */}
                  <Card title="Maintenance Assistant IA" icon={Cpu} className="border-blue-200">
                    <div className="space-y-4">
                      {siteRecommendations.map((rec: any, idx: number) => (
                        <div key={idx} className="p-3 bg-blue-50 border border-blue-100 rounded-xl space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-black text-blue-700 uppercase">{rec.machine}</span>
                            <Badge status={rec.severity}>{rec.severity}</Badge>
                          </div>
                          <p className="text-xs text-blue-900 font-medium leading-relaxed italic">
                            "{rec.recommendation}"
                          </p>
                          <div className="flex items-center gap-2 pt-1 border-t border-blue-100">
                            <UserCheck className="w-3 h-3 text-blue-400" />
                            <span className="text-[10px] font-black text-blue-500 uppercase">Recommended: {rec.owner}</span>
                          </div>
                        </div>
                      ))}
                      {siteRecommendations.length === 0 && (
                        <div className="text-center py-6 text-slate-400">
                          <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-20" />
                          <p className="text-xs font-bold uppercase tracking-widest">Aucun risque critique détecté</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  {/* Technician Status */}
                  <Card title="Techniciens de Garde" icon={UserCheck}>
                    <div className="space-y-4">
                      <div>
                        <p className="text-[10px] font-black text-emerald-600 uppercase mb-2">Actifs maintenant</p>
                        <div className="space-y-2">
                          {technicianGroups.activeNow.map((tech: Technician) => (
                            <div key={`active-${tech.id}`} className="p-3 border border-emerald-100 rounded-xl bg-emerald-50/50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <h4 className="text-xs font-black text-slate-800">{tech.name}</h4>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">{tech.role}</p>
                                </div>
                                <Badge status="in_progress">{tech.work_status ?? 'in_progress'}</Badge>
                              </div>
                              <p className="text-[10px] text-slate-600 mt-1">
                                {tech.current_machine ? `Machine: ${tech.current_machine}` : 'Machine: N/A'}
                              </p>
                            </div>
                          ))}
                          {technicianGroups.activeNow.length === 0 && (
                            <p className="text-[11px] text-slate-400 italic">Aucun technicien actif maintenant.</p>
                          )}
                        </div>
                      </div>

                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase mb-2">Non actifs / terminés</p>
                        <div className="space-y-2">
                          {[...technicianGroups.notWorking, ...technicianGroups.done].map((tech: Technician) => (
                            <div key={`idle-${tech.id}`} className="flex items-center justify-between p-3 border border-slate-100 rounded-xl hover:bg-slate-50 transition-colors">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-slate-200 rounded-full flex items-center justify-center text-slate-500">
                                  <User className="w-4 h-4" />
                                </div>
                                <div>
                                  <h4 className="text-xs font-black text-slate-800">{tech.name}</h4>
                                  <p className="text-[10px] text-slate-500 font-bold uppercase">{tech.role}</p>
                                </div>
                              </div>
                              <Badge status={tech.work_status === 'done' ? 'closed' : 'inactive'}>
                                {tech.work_status === 'done' ? 'done' : 'not_yet'}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                </div>
              </div>

              {/* Incidents Section */}
              <Card title="Rapport d’Incidents Pharma (Live)" icon={AlertTriangle}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                      <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                        <th className="px-6 py-4">ID</th>
                        <th className="px-6 py-4">Machine</th>
                        <th className="px-6 py-4">Détection</th>
                        <th className="px-6 py-4">Sévérité</th>
                        <th className="px-6 py-4">Description</th>
                        <th className="px-6 py-4">Status</th>
                        <th className="px-6 py-4">Origine</th>
                        <th className="px-6 py-4">Technicien</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {incidentsWithWorkflow.map((incident: Incident) => {
                        const action = data.maintenanceActions.find((a: any) => a.incident_id === incident.id);
                        const progress = incidentProgress[incident.id];
                        return (
                          <tr key={incident.id} className="hover:bg-slate-50 transition-colors group">
                            <td className="px-6 py-4 text-[10px] font-black text-slate-400 font-mono">{incident.id}</td>
                            <td className="px-6 py-4">
                              <span className="text-xs font-black text-slate-800 uppercase tracking-tight">{incident.machine_name}</span>
                            </td>
                            <td className="px-6 py-4 text-[10px] text-slate-500 font-bold">{incident.detected_at}</td>
                            <td className="px-6 py-4"><Badge status={incident.severity}>{incident.severity}</Badge></td>
                            <td className="px-6 py-4">
                              <p className="text-xs text-slate-600 line-clamp-1 max-w-xs">{incident.description}</p>
                            </td>
                            <td className="px-6 py-4"><Badge status={incident.status}>{incident.status}</Badge></td>
                            <td className="px-6 py-4">
                              <span className={cn("text-[9px] font-black uppercase px-2 py-0.5 rounded", 
                                incident.created_by === 'auto' ? "bg-purple-100 text-purple-600 border border-purple-200" : "bg-slate-100 text-slate-600 border border-slate-200"
                              )}>
                                {incident.created_by}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              {action ? (
                                <div className="flex items-center gap-2">
                                  <User className="w-3 h-3 text-slate-400" />
                                  <span className="text-xs font-bold text-slate-700">{action.technician_name}</span>
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-400 italic">
                                  {progress ? `${ACTION_STATUS_LABEL[progress.status]} by ${progress.technician}` : 'Non assigné'}
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </motion.div>
          )}

          {activeTab === 'KPIs' && (
            <motion.div 
              key="kpi-view"
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card title="Factory Health Trend (Real-Time History)" icon={Activity}>
                  <SafeChartContainer className="h-[350px] w-full min-w-0 min-h-[350px]">
                      <AreaChart data={kpiHistory.length > 0 ? kpiHistory : [{timestamp: '--:--', disponibilite: 0, performance: 0}]}>
                        <defs>
                          <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="timestamp" fontSize={10} fontVariant="bold" />
                        <YAxis fontSize={10} domain={[0, 100]} unit="%" />
                        <Tooltip />
                        <Area name="Disponibilité" type="monotone" dataKey="disponibilite" stroke="#10b981" fillOpacity={1} fill="url(#colorHealth)" strokeWidth={3} />
                        <Area name="Performance Index" type="monotone" dataKey="performance" stroke="#3b82f6" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                      </AreaChart>
                  </SafeChartContainer>
                </Card>

                <Card title="Alertes par Zone de Production" icon={Box}>
                  <SafeChartContainer className="h-[350px] w-full min-w-0 min-h-[350px]">
                      <BarChart data={allZones.map(zone => ({
                        name: zone,
                        count: (data?.machineView ?? []).filter((mv: any) => mv.location === zone && mv.active_incident).length
                      }))}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                        <XAxis dataKey="name" fontSize={10} />
                        <YAxis fontSize={10} allowDecimals={false} />
                        <Tooltip />
                        <Bar name="Machines en Panne" dataKey="count" fill="#EF4444" radius={[4, 4, 0, 0]} barSize={40} />
                      </BarChart>
                  </SafeChartContainer>
                </Card>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.kpiLogs.map((log: KpiLog) => (
                  <Card key={log.id} title={log.machine_name} icon={ClipboardList}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-black uppercase">Downtime</p>
                        <p className="text-xl font-black text-slate-900">{log.downtime_minutes}<span className="text-xs text-slate-400 ml-1">min</span></p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-black uppercase">Incidents</p>
                        <p className="text-xl font-black text-slate-900">{log.incident_count}</p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-black uppercase">MTBF</p>
                        <p className="text-lg font-black text-slate-900">{log.mtbf_hours}<span className="text-xs text-slate-400 ml-1">Hrs</span></p>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 font-black uppercase">Closure Rate</p>
                        <p className={cn("text-lg font-black", log.closure_rate >= 90 ? "text-emerald-600" : "text-amber-600")}>{log.closure_rate}%</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'Seuils' && (
            <motion.div key="thresholds" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex items-center justify-between">
                 <div>
                   <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Configuration des Seuils Critiques GMP</h2>
                   <p className="text-xs text-slate-400 font-medium">Référentiel industriel validé (Standards USP/ISO)</p>
                 </div>
                 <Badge status="normal">Conformité Validée</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {data.thresholds.map((th: Threshold) => {
                  const machine = data.machines.find((m: any) => m.id === th.machine_id);
                  const reading = data.sensorReadings.find((r: any) => r.machine_id === th.machine_id);
                  
                  // Extract the specific value for this sensor type
                  let currentValue: number | null = null;
                  if (reading) {
                    if (th.sensor_type === 'temperature') currentValue = reading.temperature ?? null;
                    if (th.sensor_type === 'pression') currentValue = reading.pressure ?? null;
                    if (th.sensor_type === 'vibration') currentValue = reading.vibration ?? null;
                    if (th.sensor_type === 'humidite') currentValue = (reading as any).humidite ?? (reading as any).humidity ?? null;
                    if (th.sensor_type === 'infrared') currentValue = reading.infrared ?? null;
                  }

                  // Calculate percentage for gauge (simplified visualization)
                  // Use a fixed range logic for the gauge visual
                  const minVal = th.min_value * 0.8; 
                  const critVal = th.critical_value * 1.1;
                  const range = critVal - minVal;
                  const percent = currentValue ? Math.min(100, Math.max(0, ((currentValue - minVal) / range) * 100)) : 0;
                  
                  return (
                    <Card key={th.id} title={machine?.name || 'Machine'} icon={ShieldAlert}>
                      <div className="space-y-6">
                        <div className="flex justify-between items-end">
                           <div>
                              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1">
                                <Activity className="w-3 h-3 text-blue-500" />
                                {th.sensor_type}
                              </p>
                              <p className="text-3xl font-black text-slate-900">
                                {currentValue != null ? currentValue : '--'}
                                <span className="text-sm text-slate-300 ml-1 font-bold">{th.unit}</span>
                              </p>
                           </div>
                           <Badge status={reading?.status || 'normal'}>
                             {reading?.status ? (reading.status === 'normal' ? 'En Plage' : reading.status) : 'Connecté'}
                           </Badge>
                        </div>

                        {/* Visual Gauge */}
                        <div className="space-y-2">
                           <div className="relative h-5 w-full bg-slate-100 rounded-lg overflow-hidden border border-slate-200 shadow-inner">
                              {/* Zones background */}
                              <div className="absolute inset-0 flex">
                                 <div className="h-full bg-emerald-500/20 border-r border-emerald-500/10" style={{ width: '60%' }} />
                                 <div className="h-full bg-amber-500/20 border-r border-amber-500/10" style={{ width: '25%' }} />
                                 <div className="h-full bg-red-500/20" style={{ width: '15%' }} />
                              </div>
                              
                              {/* Current Position Marker */}
                              {currentValue != null && (
                                <motion.div 
                                  initial={{ left: 0 }}
                                  animate={{ left: `${percent}%` }}
                                  className="absolute top-0 bottom-0 w-1.5 bg-slate-900 shadow-[0_0_10px_rgba(0,0,0,0.3)] z-10"
                                >
                                  <div className="absolute -top-1 -left-1 w-3 h-3 bg-slate-900 rotate-45" />
                                </motion.div>
                              )}
                           </div>
                           <div className="flex justify-between text-[8px] font-black text-slate-400 uppercase tracking-tighter">
                              <span>Safe Zone</span>
                              <span>Warning</span>
                              <span>Critical</span>
                           </div>
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                           <div className="p-2 bg-slate-50 rounded-xl border border-slate-100 text-center">
                              <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Min GMP</p>
                              <p className="text-xs font-bold text-slate-700">{th.min_value}{th.unit}</p>
                           </div>
                           <div className="p-2 bg-blue-50/50 rounded-xl border border-blue-100 text-center">
                              <p className="text-[9px] font-black text-blue-400 uppercase mb-0.5">Target Max</p>
                              <p className="text-xs font-bold text-blue-700">{th.max_value}{th.unit}</p>
                           </div>
                           <div className="p-2 bg-red-50 rounded-xl border border-red-100 text-center">
                              <p className="text-[9px] font-black text-red-500 uppercase mb-0.5">Critique</p>
                              <p className="text-xs font-black text-red-600">{th.critical_value}{th.unit}</p>
                           </div>
                        </div>

                        <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-400 font-medium bg-slate-50/50 p-2 rounded-lg">
                           <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                           Compliance: Validation IQ/OQ/PQ Active
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </motion.div>
          )}

          {activeTab === 'Techniciens' && (
            <motion.div key="techs" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {data.technicians.map((tech: Technician) => (
                  <Card key={tech.id} className="hover:border-blue-200">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center text-slate-400 border border-slate-200">
                        <User className="w-8 h-8" />
                      </div>
                      <div>
                        <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">{tech.name}</h3>
                        <p className="text-xs text-blue-600 font-black uppercase tracking-widest">{tech.role}</p>
                      </div>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <Smartphone className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-bold text-slate-700">{tech.phone}</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-100">
                        <Bell className="w-4 h-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">{tech.email}</span>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Disponibilité</span>
                      <Badge status={tech.is_available ? 'active' : 'inactive'}>
                        {tech.is_available ? 'Disponible Immédiatement' : 'En Intervention'}
                      </Badge>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut tâche</span>
                      <Badge status={tech.work_status === 'in_progress' ? 'in_progress' : tech.work_status === 'done' ? 'closed' : 'inactive'}>
                        {tech.work_status ?? 'not_yet'}
                      </Badge>
                    </div>
                    {(tech.current_machine || tech.current_action) && (
                      <div className="mt-3 p-3 bg-slate-50 border border-slate-100 rounded-lg">
                        {tech.current_machine && (
                          <p className="text-[10px] text-slate-600 font-bold">Machine: {tech.current_machine}</p>
                        )}
                        {tech.current_action && (
                          <p className="text-[10px] text-slate-500 mt-1">{tech.current_action}</p>
                        )}
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            </motion.div>
          )}

          {activeTab === 'Capteurs' && (
            <motion.div key="sensors" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {sensorCards.length === 0 ? (
                  <Card title="Capteurs" icon={Thermometer} className="lg:col-span-2">
                    <div className="text-center py-10 text-slate-400">
                      <Thermometer className="w-8 h-8 mx-auto mb-2 opacity-30" />
                      <p className="text-sm font-bold">Aucune valeur capteur disponible</p>
                      <p className="text-xs mt-1">Verifier le webhook et les mesures_recentes envoyees.</p>
                    </div>
                  </Card>
                ) : (
                  sensorCards.map((card: any) => (
                    <Card key={card.id} title={`${card.name} — Valeur actuelle: ${card.latestValue} ${card.unit}`.trim()} icon={card.chartType === 'area' ? Zap : Activity}>
                      <div className="mb-3 text-[11px] text-slate-500 font-bold">
                        Derniere mesure: <span className="text-slate-700">{card.latestTime}</span>
                      </div>
                      <SafeChartContainer className="h-[300px] w-full min-w-0 min-h-[300px]">
                        {card.chartType === 'area' ? (
                          <AreaChart data={card.history}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="timestamp" fontSize={8} tickFormatter={(val) => new Date(val).toLocaleTimeString()} />
                            <YAxis fontSize={10} unit={card.unit ? ` ${card.unit}` : ''} />
                            <Tooltip
                              labelFormatter={(val) => new Date(val as any).toLocaleString()}
                              formatter={(value: any) => [`${Number(value).toFixed(2)} ${card.unit}`.trim(), 'Valeur']}
                            />
                            <Area type="monotone" dataKey="value" stroke={card.color} fill={card.color} fillOpacity={0.16} strokeWidth={3} />
                          </AreaChart>
                        ) : (
                          <LineChart data={card.history}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="timestamp" fontSize={8} tickFormatter={(val) => new Date(val).toLocaleTimeString()} />
                            <YAxis fontSize={10} unit={card.unit ? ` ${card.unit}` : ''} />
                            <Tooltip
                              labelFormatter={(val) => new Date(val as any).toLocaleString()}
                              formatter={(value: any) => [`${Number(value).toFixed(2)} ${card.unit}`.trim(), 'Valeur']}
                            />
                            <Line type="monotone" dataKey="value" stroke={card.color} strokeWidth={3} dot={{ r: 3, fill: card.color }} />
                          </LineChart>
                        )}
                      </SafeChartContainer>
                    </Card>
                  ))
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'Machines' && (
            <motion.div key="machines" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Inventaire des Équipements</h2>
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5">
                      <Search className="w-4 h-4 text-slate-400" />
                      <input 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="text-xs outline-none w-28 md:w-40 bg-transparent" 
                        placeholder="Rechercher machine..." 
                      />
                    </div>
                    <select 
                       value={zoneFilter}
                       onChange={(e) => setZoneFilter(e.target.value)}
                       className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase px-2 py-1.5 outline-none cursor-pointer"
                    >
                       <option value="all">Toutes Zones</option>
                       {allZones.map(z => <option key={z} value={z}>{z}</option>)}
                    </select>
                    <select 
                       value={statusFilter}
                       onChange={(e) => setStatusFilter(e.target.value as any)}
                       className="bg-slate-50 border border-slate-200 rounded-lg text-[10px] font-black uppercase px-2 py-1.5 outline-none cursor-pointer"
                     >
                        <option value="all">Tous Status</option>
                        <option value="active">Actifs</option>
                        <option value="en_panne">En Panne</option>
                        <option value="maintenance">Maintenance</option>
                     </select>
                  </div>
               </div>

               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMachines.map((m: Machine) => (
                 <Card key={m.id} title={m.name} icon={Box}>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Localisation</span>
                        <span className="text-xs font-bold text-slate-700">{m.location}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</span>
                        <span className="text-xs font-bold text-slate-700">{m.type}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</span>
                        <Badge status={m.status}>{m.status}</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Techs Affectés</span>
                        <span className="text-xs font-bold text-slate-700">{m.techniciens_count || 0}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Techs Actifs</span>
                        <span className={cn("text-xs font-black", (m.techniciens_active ?? 0) > 0 ? "text-indigo-600" : "text-slate-700")}>
                           {m.techniciens_active || 0}
                        </span>
                      </div>
                      <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                         <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Code Machine / ID</span>
                         <div className="flex items-center gap-2">
                           {m.code_machine && (
                              <span className="text-[10px] font-mono font-black text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 uppercase">
                                {m.code_machine}
                              </span>
                           )}
                           <span className="text-[10px] font-mono font-bold text-slate-500 uppercase">{m.id}</span>
                         </div>
                      </div>
                      <button 
                        onClick={() => setSelectedMachineId(m.id)}
                        className="w-full mt-2 py-2 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 text-slate-500 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all border border-slate-100"
                      >
                        Détails Complets
                      </button>
                    </div>
                 </Card>
               ))}
               </div>
            </motion.div>
          )}

          {activeTab === 'Maintenance' && (
            <motion.div key="maintenance" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
               <Card title="Journal des Actions de Maintenance" icon={Wrench}>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead className="bg-slate-50 border-b border-slate-100">
                        <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          <th className="px-6 py-4">ID Action</th>
                          <th className="px-6 py-4">Incident</th>
                          <th className="px-6 py-4">Technicien</th>
                          <th className="px-6 py-4">Action Réalisée</th>
                          <th className="px-6 py-4">Début</th>
                          <th className="px-6 py-4">Fin</th>
                          <th className="px-6 py-4">Notes</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {maintenanceHistory.map((action: MaintenanceAction) => (
                          <tr key={action.id} className="hover:bg-slate-50 transition-colors">
                            <td className="px-6 py-4 text-[10px] font-mono font-black text-slate-400">{action.id}</td>
                            <td className="px-6 py-4 text-[10px] font-black text-blue-600 uppercase font-mono">{action.incident_id}</td>
                            <td className="px-6 py-4">
                               <div className="flex items-center gap-2">
                                  <User className="w-3.5 h-3.5 text-slate-400" />
                                  <span className="text-xs font-bold text-slate-800">{action.technician_name}</span>
                               </div>
                            </td>
                            <td className="px-6 py-4 text-xs font-bold text-slate-700">{action.action_taken}</td>
                            <td className="px-6 py-4 text-[10px] text-slate-500 font-bold">{action.started_at}</td>
                            <td className="px-6 py-4 text-[10px] text-slate-500 font-bold">{action.completed_at || 'En cours'}</td>
                            <td className="px-6 py-4 text-xs text-slate-500 italic max-w-xs truncate">{action.notes || '-'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
               </Card>
            </motion.div>
          )}

          {activeTab === 'Incidents' && (
            <motion.div key="incidents-tab" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                <Card title="Incidents & Workflow Performance" icon={AlertTriangle}>
                    <div className="space-y-8">
                       {incidentsWithWorkflow.map((incident: Incident) => (
                         <div key={incident.id} className="p-6 border border-slate-100 rounded-2xl bg-slate-50/30">
                            <div className="flex items-center justify-between mb-6">
                               <div className="flex items-center gap-4">
                                  <div className={cn("p-2 rounded-lg", getStatusColor(incident.severity) === 'red' ? "bg-red-100 text-red-600" : "bg-amber-100 text-amber-600")}>
                                     <ShieldAlert className="w-5 h-5" />
                                  </div>
                                  <div>
                                     <h3 className="text-sm font-black text-slate-900 uppercase tracking-tight">{incident.machine_name} - {incident.id}</h3>
                                     <Badge status={incident.status}>{incident.status}</Badge>
                                  </div>
                               </div>
                               <div className="text-right">
                                  <p className="text-[10px] text-slate-400 font-black uppercase mb-1">Detecté le</p>
                                  <p className="text-xs font-bold text-slate-700">{incident.detected_at}</p>
                               </div>
                            </div>
                            
                            {/* Workflow Timeline */}
                            <div className="relative mt-8 mb-16 md:mb-12">
                               <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 -translate-y-1/2" />
                               <div className="flex flex-col md:flex-row justify-between items-start md:items-center relative gap-8 md:gap-0">
                                  {[
                                    { label: 'Détecté', time: incident.detected_at, icon: Bell },
                                    { label: 'Pris en charge', time: incident.acknowledged_at, icon: UserCheck },
                                    { label: 'Intervention', time: data.maintenanceActions.find((a: any) => a.incident_id === incident.id)?.started_at, icon: Wrench },
                                    { label: 'Résolu', time: incident.resolved_at, icon: CheckCircle2 }
                                  ].map((step, idx) => (
                                    <div key={idx} className="flex flex-row md:flex-col items-center gap-4 md:gap-2 relative w-full md:w-auto">
                                       <div className={cn(
                                         "w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all shadow-sm z-10 shrink-0",
                                         step.time ? "bg-blue-600 border-blue-600 text-white" : "bg-white border-slate-200 text-slate-300"
                                       )}>
                                         <step.icon className="w-4 h-4" />
                                       </div>
                                       {/* Vertical line for mobile */}
                                       {idx < 3 && <div className="md:hidden absolute top-8 left-4 w-0.5 h-8 bg-slate-200" />}
                                       <div className="text-left md:text-center md:absolute md:top-10">
                                          <p className="text-[10px] md:text-[9px] font-black uppercase tracking-tight text-slate-500">{step.label}</p>
                                          <p className="text-xs md:text-[9px] font-bold text-blue-600">{step.time || 'En attente...'}</p>
                                       </div>
                                    </div>
                                  ))}
                               </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-12">
                               <div className="space-y-1">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Description</p>
                                  <p className="text-xs text-slate-700 font-medium">{incident.description}</p>
                               </div>
                               <div className="space-y-1">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cause Racine</p>
                                  <p className="text-xs text-slate-700 font-medium">{incident.root_cause || 'Investigation en cours'}</p>
                               </div>
                               <div className="space-y-1">
                                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Origine</p>
                                  <Badge status={incident.created_by}>{incident.created_by}</Badge>
                               </div>
                            </div>
                         </div>
                       ))}
                    </div>
                </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detail Modal / Panel for selected machine */}
        <AnimatePresence>
          {selectedMachine && (
            <div className="fixed inset-0 z-[60] flex items-center justify-end">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setSelectedMachineId(null)}
                className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
                className="relative w-full max-w-xl h-full bg-white shadow-2xl p-8 overflow-y-auto"
              >
                <div className="flex items-center justify-between mb-8">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-blue-100">
                      <Box className="w-7 h-7" />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{selectedMachine.name}</h2>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{selectedMachine.id} • {selectedMachine.location}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedMachineId(null)}
                    className="p-2 hover:bg-slate-100 rounded-full text-slate-400"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="space-y-8">
                   <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Statut Machine</span>
                        <div className="mt-2"><Badge status={selectedMachine.status}>{selectedMachine.status}</Badge></div>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Type</span>
                        <p className="mt-2 text-sm font-black text-slate-800 uppercase tracking-tighter">{selectedMachine.type}</p>
                      </div>
                   </div>

                   <Card title="Dépassements & Seuils Actifs" icon={ListFilter}>
                      <div className="space-y-4">
                        {data.thresholds.filter((t: any) => t.machine_id === selectedMachine.id).map((th: Threshold) => (
                          <div key={th.id} className="p-4 bg-red-50/50 border border-red-100 rounded-xl">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xs font-black text-red-600 uppercase tracking-widest">{th.sensor_type}</span>
                              <span className="text-xs font-black text-red-700">{th.critical_value} {th.unit}</span>
                            </div>
                            <div className="h-1.5 bg-red-100 rounded-full">
                              <div className="w-3/4 h-full bg-red-500 rounded-full shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                            </div>
                          </div>
                        ))}
                      </div>
                   </Card>

                   <Card title="Incidents Récents sur Équipement" icon={AlertTriangle}>
                      <div className="space-y-4">
                        {incidentsWithWorkflow.filter((i: any) => i.machine_id === selectedMachine.id).map((inc: Incident) => (
                           <div key={inc.id} className="p-4 border border-slate-100 rounded-xl space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 font-mono">{inc.id}</span>
                                <Badge status={inc.status}>{inc.status}</Badge>
                              </div>
                              <p className="text-sm font-bold text-slate-800">{inc.description}</p>
                              <div className="flex items-center gap-2 pt-2 text-[10px] text-slate-400 font-bold uppercase">
                                <Clock className="w-3 h-3" /> Detecté à {inc.detected_at}
                              </div>
                           </div>
                        ))}
                      </div>
                   </Card>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="max-w-[1600px] mx-auto p-8 flex flex-col md:flex-row items-center justify-between border-t border-slate-200 mt-12 text-slate-400">
        <div className="flex items-center gap-3">
          <img src="/logo.png" alt="INDUPHARMA" className="h-12 w-auto" />
          <span className="text-xs font-black uppercase tracking-widest">© 2026 INDUPHARMA Industrial System</span>
        </div>
        <div className="flex items-center gap-8 text-[10px] font-black uppercase tracking-widest mt-6 md:mt-0">
          <a href="#" className="hover:text-blue-600 transition-colors">Safety Protocols</a>
          <a href="#" className="hover:text-blue-600 transition-colors">GMP Compliance</a>
          <a href="#" className="hover:text-blue-600 transition-colors">System Support</a>
        </div>
      </footer>
    </div>
  );
}
