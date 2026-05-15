'use client';

import React, { useState } from 'react';
import { Palette, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const THEME_COLORS = {
  primary: [
    { name: 'Cyan', color: '#04D1FC' },
    { name: 'Teal', color: '#17A298' },
    { name: 'Dark', color: '#120F0F' },
    { name: 'White', color: '#FFFFFF' },
  ],
  accents: [
    { name: 'Coral', color: '#FF6B6B' },
    { name: 'Gold', color: '#FFD93D' },
    { name: 'Purple', color: '#6C5CE7' },
    { name: 'Green', color: '#00B894' },
  ],
  greys: [
    { name: 'Light', color: '#F5F5F5' },
    { name: 'Medium', color: '#9CA3AF' },
    { name: 'Dark Grey', color: '#4B5563' },
    { name: 'Charcoal', color: '#1F2937' },
  ],
};

const GRADIENTS = [
  { name: 'Ocean', start: '#04D1FC', end: '#17A298' },
  { name: 'Sunset', start: '#FF6B6B', end: '#FFD93D' },
  { name: 'Purple', start: '#6C5CE7', end: '#a29bfe' },
  { name: 'Dark', start: '#1F2937', end: '#4B5563' },
];

function ThemePanel({
  onSelectColor,
  onSelectGradient,
  selectedSection,
  swatchClass,
  className,
}) {
  return (
    <div className={cn('space-y-3', className)}>
      <div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Primary</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {THEME_COLORS.primary.map(({ name, color }) => (
            <button key={color} type="button" onClick={() => onSelectColor?.(color)} className="group relative" title={name}>
              <div className={swatchClass} style={{ backgroundColor: color }} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Accents</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {THEME_COLORS.accents.map(({ name, color }) => (
            <button key={color} type="button" onClick={() => onSelectColor?.(color)} className="group relative" title={name}>
              <div className={swatchClass} style={{ backgroundColor: color }} />
            </button>
          ))}
        </div>
      </div>
      <div>
        <span className="text-[10px] font-medium uppercase tracking-wider text-zinc-400">Gradients</span>
        <div className="mt-1.5 flex flex-wrap gap-2">
          {GRADIENTS.map(({ name, start, end }) => (
            <button key={name} type="button" onClick={() => onSelectGradient?.(start, end)} className="group relative" title={name}>
              <div className={swatchClass} style={{ background: `linear-gradient(135deg, ${start}, ${end})` }} />
            </button>
          ))}
        </div>
      </div>
      {selectedSection && (
        <p className="border-t border-zinc-100 pt-2 text-[10px] text-zinc-400">Applies to selected section</p>
      )}
    </div>
  );
}

function FloatingThemeBar({
  onSelectColor,
  onSelectGradient,
  selectedSection,
  variant = 'floating',
  panelOnly = false,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isDock = variant === 'dock';

  const swatchFloating = 'h-10 w-10 rounded-lg border-2 border-zinc-200 shadow-sm transition-all hover:scale-105 hover:border-zinc-400';
  const swatchCompact = 'h-8 w-8 rounded-md border-2 border-zinc-200 shadow-sm transition-all active:scale-95 hover:border-zinc-400';

  if (panelOnly) {
    return (
      <ThemePanel
        onSelectColor={onSelectColor}
        onSelectGradient={onSelectGradient}
        selectedSection={selectedSection}
        swatchClass={swatchCompact}
        className="w-[220px] rounded-2xl border border-zinc-200/80 bg-white/95 p-3 shadow-xl backdrop-blur-md"
      />
    );
  }

  const swatch = isDock ? swatchCompact : swatchFloating;

  return (
    <>
      {isOpen && (
        <div className="fixed inset-0 z-[55]" onClick={() => setIsOpen(false)} aria-hidden />
      )}
      <div className={cn('z-[56]', isDock ? 'relative' : 'absolute bottom-4 left-4')}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center border border-zinc-200 bg-white/95 text-zinc-600 backdrop-blur-sm transition-all',
            isDock
              ? 'min-h-[40px] min-w-[40px] justify-center gap-1 rounded-xl px-2 py-2 shadow-sm'
              : cn(
                  'gap-2 rounded-full px-3 py-2 shadow-lg hover:shadow-xl',
                  isOpen && 'rounded-b-none rounded-t-2xl border-b-0'
                )
          )}
          aria-expanded={isOpen}
          aria-label="Theme colors"
        >
          <Palette className="h-4 w-4 shrink-0 text-zinc-500" />
          {!isDock && <span className="text-xs font-medium">Theme</span>}
          <ChevronDown className={cn('h-3 w-3 shrink-0 text-zinc-400 transition-transform', isOpen && 'rotate-180', isDock && 'hidden')} />
        </button>

        {isOpen && (
          <div
            className={cn(
              'absolute border border-zinc-200 bg-white/95 p-3 shadow-xl backdrop-blur-md',
              isDock ? 'bottom-full right-0 z-[60] mb-1 w-[220px] rounded-2xl' : 'bottom-full left-0 z-[60] mb-0 w-[240px] rounded-t-2xl rounded-br-2xl border-b-0'
            )}
          >
            <ThemePanel
              onSelectColor={onSelectColor}
              onSelectGradient={onSelectGradient}
              selectedSection={selectedSection}
              swatchClass={swatch}
            />
          </div>
        )}
      </div>
    </>
  );
}

export default FloatingThemeBar;
