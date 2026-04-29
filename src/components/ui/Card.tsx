import React from 'react';
import { cn } from '../../utils/statusColors';

export const Card: React.FC<{ children: React.ReactNode, className?: string, title?: string, icon?: any }> = ({ children, className, title, icon: Icon }) => (
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
