import React, { useRef, useImperativeHandle, forwardRef } from 'react';
import { cn } from '../../lib/utils';

// Pure HTML input - React doesn't touch the value at all
// Parent must call getValue() to get current value
export const EditableInput = forwardRef(function EditableInput({ 
  value = '',
  onChange,
  className, 
  type = "text",
  sectionKey,
  ...props 
}, ref) {
  const inputRef = useRef(null);

  // Expose methods to parent
  useImperativeHandle(ref, () => ({
    getValue: () => inputRef.current?.value || '',
    setValue: (val) => { if (inputRef.current) inputRef.current.value = val; },
    focus: () => inputRef.current?.focus()
  }));

  return (
    <input
      ref={inputRef}
      type={type}
      defaultValue={value}
      onBlur={(e) => {
        // Only call onChange if value actually changed
        if (e.target.value !== value) {
          onChange?.(e.target.value);
        }
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          if (e.target.value !== value) {
            onChange?.(e.target.value);
          }
        }
      }}
      className={cn(
        "flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm",
        "placeholder:text-zinc-400",
        "focus:outline-none focus:ring-2 focus:ring-[#04D1FC] focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    />
  );
});

// Pure HTML textarea
export const EditableTextarea = forwardRef(function EditableTextarea({ 
  value = '',
  onChange,
  className,
  sectionKey,
  ...props 
}, ref) {
  const textareaRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getValue: () => textareaRef.current?.value || '',
    setValue: (val) => { if (textareaRef.current) textareaRef.current.value = val; },
    focus: () => textareaRef.current?.focus()
  }));

  return (
    <textarea
      ref={textareaRef}
      defaultValue={value}
      onBlur={(e) => {
        if (e.target.value !== value) {
          onChange?.(e.target.value);
        }
      }}
      className={cn(
        "flex min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm",
        "placeholder:text-zinc-400",
        "focus:outline-none focus:ring-2 focus:ring-[#04D1FC] focus:border-transparent",
        "disabled:cursor-not-allowed disabled:opacity-50 resize-none",
        className
      )}
      {...props}
    />
  );
});

// Color input
export const EditableColorInput = forwardRef(function EditableColorInput({
  value = '#000000',
  onChange,
  className
}, ref) {
  const textRef = useRef(null);

  useImperativeHandle(ref, () => ({
    getValue: () => textRef.current?.value || '#000000',
    setValue: (val) => { if (textRef.current) textRef.current.value = val; }
  }));

  const safeColor = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#000000';

  return (
    <div className={cn("flex gap-2", className)}>
      <input
        type="color"
        defaultValue={safeColor}
        onChange={(e) => {
          if (textRef.current) {
            textRef.current.value = e.target.value;
          }
          onChange?.(e.target.value);
        }}
        className="w-10 h-10 rounded-lg border border-zinc-200 cursor-pointer bg-transparent"
      />
      <input
        ref={textRef}
        type="text"
        defaultValue={value}
        onBlur={(e) => {
          const val = e.target.value;
          if (/^#[0-9A-Fa-f]{6}$/.test(val) && val !== value) {
            onChange?.(val);
          }
        }}
        className="flex-1 h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#04D1FC] focus:border-transparent"
        placeholder="#000000"
      />
    </div>
  );
});

export default EditableInput;
