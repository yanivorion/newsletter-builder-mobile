import React from 'react';
import { cn } from '../../lib/utils';

const buttonVariants = {
  variant: {
    default: "bg-zinc-900 text-white hover:bg-zinc-800",
    destructive: "bg-red-500 text-white hover:bg-red-600",
    outline: "border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700",
    secondary: "bg-zinc-100 text-zinc-900 hover:bg-zinc-200",
    ghost: "hover:bg-zinc-100 text-zinc-700",
    link: "text-zinc-900 underline-offset-4 hover:underline",
  },
  size: {
    default: "h-10 px-4 py-2",
    sm: "h-8 rounded-lg px-3 text-xs",
    lg: "h-12 rounded-xl px-6",
    icon: "h-10 w-10",
  },
};

export function Button({ 
  className, 
  variant = "default", 
  size = "default", 
  children,
  ...props 
}) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-medium",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#04D1FC] focus-visible:ring-offset-2",
        "disabled:pointer-events-none disabled:opacity-50",
        "active:scale-[0.97]",
        buttonVariants.variant[variant],
        buttonVariants.size[size],
        className
      )}
      style={{
        transition: 'background-color 150ms cubic-bezier(0.22, 1, 0.36, 1), color 150ms cubic-bezier(0.22, 1, 0.36, 1), transform 250ms cubic-bezier(0.34, 1.56, 0.64, 1), box-shadow 250ms cubic-bezier(0.22, 1, 0.36, 1)',
      }}
      {...props}
    >
      {children}
    </button>
  );
}

export default Button;
