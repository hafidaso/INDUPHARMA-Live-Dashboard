import React from 'react';
import { Card } from './Card';
import { Badge } from './Badge';
import { cn, getStatusColor } from '../../utils/statusColors';
import type { DashboardKpiSummary } from '../../types';

export interface KPICardProps extends DashboardKpiSummary {
  icon: any;
  key?: React.Key;
}

export const KPICard = ({ metric, value, unit, status, note, icon: Icon }: KPICardProps) => {
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
