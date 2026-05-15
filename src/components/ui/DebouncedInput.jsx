import React, { useState, useEffect, useRef, forwardRef } from 'react';
import { cn } from '../../lib/utils';

// Input that only updates parent on blur or after debounce
export const DebouncedInput = forwardRef(({ 
  value: propValue, 
  onChange, 
  debounceMs = 500,
  className, 
  type = "text", 
  ...props 
}, ref) => {
  const [localValue, setLocalValue] = useState(propValue || '');
  const timeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Sync from props only when not focused
  useEffect(() => {
    if (document.activeElement !== inputRef.current) {
      setLocalValue(propValue || '');
    }
  }, [propValue]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Debounce the onChange
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  };

  const handleBlur = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onChange(localValue);
  };

  return (
    <input
      ref={(node) => {
        inputRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      type={type}
      value={localValue}
      onChange={handleChange}
      onBlur={handleBlur}
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

DebouncedInput.displayName = 'DebouncedInput';

// Textarea that only updates parent on blur or after debounce
export const DebouncedTextarea = forwardRef(({ 
  value: propValue, 
  onChange, 
  debounceMs = 500,
  className, 
  ...props 
}, ref) => {
  const [localValue, setLocalValue] = useState(propValue || '');
  const timeoutRef = useRef(null);
  const textareaRef = useRef(null);

  // Sync from props only when not focused
  useEffect(() => {
    if (document.activeElement !== textareaRef.current) {
      setLocalValue(propValue || '');
    }
  }, [propValue]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setLocalValue(newValue);
    
    // Debounce the onChange
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    
    timeoutRef.current = setTimeout(() => {
      onChange(newValue);
    }, debounceMs);
  };

  const handleBlur = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    onChange(localValue);
  };

  return (
    <textarea
      ref={(node) => {
        textareaRef.current = node;
        if (typeof ref === 'function') ref(node);
        else if (ref) ref.current = node;
      }}
      value={localValue}
      onChange={handleChange}
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

DebouncedTextarea.displayName = 'DebouncedTextarea';

export default DebouncedInput;

