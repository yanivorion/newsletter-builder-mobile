import React, { useState, useEffect, useRef } from 'react';
import { Minus, Plus } from 'lucide-react';
import { cn } from '../../lib/utils';

export function NumberInput({ 
  value, 
  onChange, 
  min = 0, 
  max = 1000, 
  step = 1,
  suffix = '',
  className,
  ...props 
}) {
  // Always show a value, even if it's 0
  const [localValue, setLocalValue] = useState(value !== undefined && value !== null ? value.toString() : '0');
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef(null);
  const timeoutRef = useRef(null);

  // Sync local value when prop changes (but not during editing)
  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value !== undefined && value !== null ? value.toString() : '0');
    }
  }, [value, isFocused]);

  const commitValue = (newValue) => {
    const parsed = parseInt(newValue, 10);
    if (!isNaN(parsed)) {
      const clamped = Math.min(max, Math.max(min, parsed));
      onChange(clamped);
      setLocalValue(clamped.toString());
    } else {
      setLocalValue(value?.toString() || '');
    }
  };

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Debounce the actual update
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      commitValue(newValue);
    }, 300);
  };

  const handleBlur = () => {
    setIsFocused(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    commitValue(localValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    inputRef.current?.select();
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      commitValue(localValue);
      inputRef.current?.blur();
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      const newVal = Math.min(max, (parseInt(localValue, 10) || 0) + step);
      setLocalValue(newVal.toString());
      onChange(newVal);
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      const newVal = Math.max(min, (parseInt(localValue, 10) || 0) - step);
      setLocalValue(newVal.toString());
      onChange(newVal);
    }
  };

  const increment = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const newVal = Math.min(max, (parseInt(localValue, 10) || 0) + step);
    setLocalValue(newVal.toString());
    onChange(newVal);
  };

  const decrement = (e) => {
    e.stopPropagation();
    e.preventDefault();
    const newVal = Math.max(min, (parseInt(localValue, 10) || 0) - step);
    setLocalValue(newVal.toString());
    onChange(newVal);
  };

  return (
    <div className={cn(
      "flex items-center h-10 rounded-lg border border-zinc-200 bg-white overflow-hidden",
      "focus-within:ring-2 focus-within:ring-[#04D1FC] focus-within:border-transparent",
      "transition-all duration-200",
      className
    )}>
      <button
        type="button"
        onClick={decrement}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex-shrink-0 w-8 h-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200 transition-colors cursor-pointer"
        tabIndex={-1}
      >
        <Minus className="w-3 h-3 pointer-events-none" />
      </button>
      
      <div className="flex-1 flex items-center justify-center">
        <input
          ref={inputRef}
          type="text"
          inputMode="numeric"
          value={localValue}
          onChange={handleChange}
          onBlur={handleBlur}
          onFocus={handleFocus}
          onKeyDown={handleKeyDown}
          className="w-full text-center text-sm bg-transparent outline-none"
          {...props}
        />
        {suffix && (
          <span className="text-xs text-zinc-400 ml-0.5">{suffix}</span>
        )}
      </div>
      
      <button
        type="button"
        onClick={increment}
        onMouseDown={(e) => e.stopPropagation()}
        className="flex-shrink-0 w-8 h-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 active:bg-zinc-200 transition-colors cursor-pointer"
        tabIndex={-1}
      >
        <Plus className="w-3 h-3 pointer-events-none" />
      </button>
    </div>
  );
}

export default NumberInput;

