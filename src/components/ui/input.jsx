import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      ref={ref}
      type={type}
      className={cn(
        "flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm",
        "placeholder:text-zinc-400",
        "focus:outline-none focus:ring-2 focus:ring-[#04D1FC] focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-shadow duration-200",
        className
      )}
      {...props}
    />
  );
});

Input.displayName = 'Input';

export const Textarea = forwardRef(({ className, ...props }, ref) => {
  return (
    <textarea
      ref={ref}
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm",
        "placeholder:text-zinc-400",
        "focus:outline-none focus:ring-2 focus:ring-[#04D1FC] focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-shadow duration-200",
        className
      )}
      {...props}
    />
  );
});

Textarea.displayName = 'Textarea';

export const Select = forwardRef(({ className, children, ...props }, ref) => {
  return (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-[#04D1FC] focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-shadow duration-200 cursor-pointer",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
});

Select.displayName = 'Select';

export default Input;
