import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getStatusColor = (status: string | undefined) => {
  const s = String(status).toLowerCase();
  if (['active', 'normal', 'low', 'closed', 'true'].includes(s)) return 'emerald';
  if (['maintenance', 'warning', 'medium', 'in_progress'].includes(s)) return 'amber';
  if (['en_panne', 'critical', 'high', 'open', 'escalated'].includes(s)) return 'red';
  if (['inactive', 'error', 'false'].includes(s)) return 'slate';
  return 'slate';
};

export const getStatusBadgeClass = (status: string | undefined) => {
  const color = getStatusColor(status);
  return cn(
    "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap",
    color === 'emerald' && "bg-emerald-50 text-emerald-600 border-emerald-200",
    color === 'amber' && "bg-amber-50 text-amber-600 border-amber-200",
    color === 'red' && "bg-red-50 text-red-600 border-red-200",
    color === 'slate' && "bg-slate-50 text-slate-500 border-slate-200"
  );
};
