import React, { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

/**
 * Bottom-sheet style modal with a range slider for numeric section properties (radius, padding, etc.).
 */
export default function SectionSliderModal({
  title,
  value,
  min = 0,
  max = 100,
  step = 1,
  suffix = '',
  onChange,
  onClose,
}) {
  const [local, setLocal] = useState(Number(value) || 0);

  useEffect(() => {
    setLocal(Number(value) || 0);
  }, [value]);

  const commit = (next) => {
    const n = Math.min(max, Math.max(min, Number(next) || 0));
    setLocal(n);
    onChange(n);
  };

  return (
    <div
      className="fixed inset-0 z-[120] flex items-end justify-center bg-black/45 p-0 sm:items-center sm:p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="section-slider-title"
      onClick={onClose}
    >
      <div
        className={cn(
          'w-full max-w-md rounded-t-2xl border border-zinc-200/80 bg-white p-4 shadow-2xl',
          'sm:rounded-2xl sm:max-w-sm'
        )}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-2">
          <h2 id="section-slider-title" className="text-sm font-semibold text-zinc-900">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-zinc-500 hover:bg-zinc-100"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mb-2 flex items-baseline justify-between">
          <span className="text-2xl font-semibold tabular-nums text-zinc-900">
            {local}
            {suffix ? <span className="text-sm font-medium text-zinc-500">{suffix}</span> : null}
          </span>
        </div>

        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={local}
          onChange={(e) => commit(e.target.value)}
          className="mb-6 h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-[#04D1FC]"
        />

        <button
          type="button"
          onClick={onClose}
          className="btn-spring w-full rounded-xl bg-zinc-900 py-3 text-sm font-medium text-white hover:bg-zinc-800"
        >
          Done
        </button>
      </div>
    </div>
  );
}
