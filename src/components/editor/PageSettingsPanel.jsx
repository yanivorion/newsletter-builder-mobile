import React, { useEffect, useRef } from 'react';
import { Layers } from 'lucide-react';
import { Label } from '../ui/Label';
import { NumberInput } from '../ui/NumberInput';
import { cn } from '@/lib/utils';

function ImageColorPicker({ value, onChange, placeholder = 'Enter color', allowClear = false }) {
  const textRef = useRef(null);

  useEffect(() => {
    if (textRef.current && document.activeElement !== textRef.current) {
      textRef.current.value = value || '';
    }
  }, [value]);

  const handleColorChange = (e) => {
    const newValue = e.target.value;
    if (textRef.current) textRef.current.value = newValue;
    onChange?.(newValue);
  };

  const handleTextBlur = () => {
    if (textRef.current) onChange?.(textRef.current.value);
  };

  const handleClear = () => {
    if (textRef.current) textRef.current.value = '';
    onChange?.('');
  };

  const safeColorValue = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#04D1FC';

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={safeColorValue}
        onChange={handleColorChange}
        className="h-8 w-8 cursor-pointer rounded border border-zinc-200"
      />
      <input
        ref={textRef}
        type="text"
        defaultValue={value || ''}
        onBlur={handleTextBlur}
        placeholder={placeholder}
        className="h-8 min-w-0 flex-1 rounded border border-zinc-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#04D1FC]"
      />
      {allowClear && (
        <button
          type="button"
          onClick={handleClear}
          className="h-8 shrink-0 rounded border border-zinc-200 px-2 text-[10px] text-zinc-500 hover:text-zinc-700"
        >
          Clear
        </button>
      )}
    </div>
  );
}

const FieldGroup = ({ label, children, className }) => (
  <div className={cn('space-y-2', className)}>
    <Label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{label}</Label>
    {children}
  </div>
);

/**
 * Global canvas / page chrome settings (outer padding, inner card, gaps).
 */
export default function PageSettingsPanel({ newsletter, onPageSettingsUpdate }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-900">
          <Layers className="h-4 w-4 text-white" />
        </div>
        <div>
          <h2 className="text-sm font-semibold text-zinc-900">Page layout</h2>
          <p className="text-[10px] text-zinc-400">Outer frame and content container</p>
        </div>
      </div>

      <FieldGroup label="Page background">
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Outer background color</span>
            <ImageColorPicker
              value={newsletter?.pageSettings?.outerBackgroundColor || '#F5F5F5'}
              onChange={(val) => onPageSettingsUpdate?.({ outerBackgroundColor: val })}
              placeholder="#F5F5F5"
              allowClear
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Outer padding</span>
            <NumberInput
              value={newsletter?.pageSettings?.outerPadding ?? 20}
              onChange={(val) => onPageSettingsUpdate?.({ outerPadding: val })}
              step={4}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Section gap</span>
            <NumberInput
              value={newsletter?.pageSettings?.sectionGap ?? 16}
              onChange={(val) => onPageSettingsUpdate?.({ sectionGap: val })}
              step={4}
              suffix="px"
            />
          </div>
        </div>
        <div className="space-y-1 pt-2">
          <span className="text-[10px] text-zinc-400">Section padding top</span>
          <NumberInput
            value={newsletter?.pageSettings?.sectionPaddingTop ?? 20}
            onChange={(val) => onPageSettingsUpdate?.({ sectionPaddingTop: val })}
            step={4}
            suffix="px"
          />
        </div>
      </FieldGroup>

      <FieldGroup label="Content container">
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Background color</span>
            <ImageColorPicker
              value={newsletter?.pageSettings?.innerBackgroundColor || '#FFFFFF'}
              onChange={(val) => onPageSettingsUpdate?.({ innerBackgroundColor: val })}
              placeholder="#FFFFFF"
              allowClear
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400">Border width</span>
              <NumberInput
                value={newsletter?.pageSettings?.innerBorderWidth ?? 0}
                onChange={(val) => onPageSettingsUpdate?.({ innerBorderWidth: val })}
                step={1}
                suffix="px"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400">Border radius</span>
              <NumberInput
                value={newsletter?.pageSettings?.innerBorderRadius ?? 0}
                onChange={(val) => onPageSettingsUpdate?.({ innerBorderRadius: val })}
                step={2}
                suffix="px"
              />
            </div>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Border color</span>
            <ImageColorPicker
              value={newsletter?.pageSettings?.innerBorderColor || '#E5E5E5'}
              onChange={(val) => onPageSettingsUpdate?.({ innerBorderColor: val })}
              placeholder="#E5E5E5"
              allowClear
            />
          </div>
        </div>
      </FieldGroup>
    </div>
  );
}
