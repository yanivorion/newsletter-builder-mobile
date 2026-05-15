import React from 'react';
import { cn } from '../../lib/utils';

const badgeVariants = {
  default: "bg-slate-900 text-white hover:bg-slate-800",
  secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200",
  destructive: "bg-red-500 text-white hover:bg-red-600",
  outline: "text-slate-900 border border-slate-200",
};

export function Badge({ className, variant = "default", children, ...props }) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        badgeVariants[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export default Badge;

