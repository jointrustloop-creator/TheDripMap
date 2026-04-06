import React from 'react';
import { cn } from '../lib/utils';

interface ServicePillProps {
  service: string;
  className?: string;
}

export const ServicePill = ({ service, className }: ServicePillProps) => {
  return (
    <span className={cn(
      "px-2.5 py-1 bg-slate-50 text-slate-600 rounded-full text-[10px] font-bold uppercase tracking-wider border border-slate-100",
      className
    )}>
      {service}
    </span>
  );
};
