import React, { useState, useCallback, memo } from 'react';
import { cn } from '../../lib/utils';

// Completely stable input - only updates parent on blur
export const StableInput = memo(function StableInput({ 
  initialValue = '',
  onCommit,
  className, 
  type = "text", 
  ...props 
}) {
  const [value, setValue] = useState(initialValue);

  const handleBlur = useCallback(() => {
    if (onCommit && value !== initialValue) {
      onCommit(value);
    }
  }, [value, initialValue, onCommit]);

  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Enter' && type !== 'textarea') {
      e.target.blur();
    }
  }, [type]);

  return (
    <input
      type={type}
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
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

// Completely stable textarea - only updates parent on blur
export const StableTextarea = memo(function StableTextarea({ 
  initialValue = '',
  onCommit,
  className, 
  ...props 
}) {
  const [value, setValue] = useState(initialValue);

  const handleBlur = useCallback(() => {
    if (onCommit) {
      onCommit(value);
    }
  }, [value, onCommit]);

  return (
    <textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={handleBlur}
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

export default StableInput;

