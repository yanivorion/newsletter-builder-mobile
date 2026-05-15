import React, { useEffect, useLayoutEffect, useState } from 'react';
import { cn } from '@/lib/utils';

/** Sync sheet horizontal bounds to a column ref (fixed is viewport-relative otherwise). */
export function useSheetAnchorRect(boundsRef, enabled) {
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    if (!enabled || !boundsRef?.current) {
      setRect(null);
      return;
    }
    const el = boundsRef.current;
    const read = () => {
      const r = el.getBoundingClientRect();
      setRect({ left: r.left, width: r.width });
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    window.addEventListener('resize', read);
    window.addEventListener('scroll', read, true);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', read);
      window.removeEventListener('scroll', read, true);
    };
  }, [boundsRef, enabled]);

  return rect;
}

const GLASS_PANEL = cn(
  'pointer-events-auto w-full border border-white/50',
  'bg-white/55 shadow-[0_-8px_32px_rgba(15,23,42,0.08)]',
  'backdrop-blur-2xl supports-[backdrop-filter]:bg-white/45',
  'ring-1 ring-white/40'
);

/**
 * Bottom-anchored glass sheet — no dim overlay so the canvas stays visible.
 */
export default function EditorBottomSheet({
  open,
  title,
  onClose,
  children,
  boundsRef,
  maxHeight = 'min(42vh, 360px)',
  bottomInsetPx = 78,
  ariaLabel,
  className,
  contentClassName,
}) {
  const anchorEnabled = !!(open && boundsRef);
  const anchorRect = useSheetAnchorRect(boundsRef, anchorEnabled);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;
  if (boundsRef && !anchorRect) return null;

  const anchored = !!(boundsRef && anchorRect);
  const bottom = `calc(${bottomInsetPx}px + env(safe-area-inset-bottom, 0px))`;

  return (
    <div
      className={cn('pointer-events-none z-[140] flex justify-center', !anchored && 'fixed inset-x-0')}
      style={
        anchored
          ? {
              position: 'fixed',
              left: anchorRect.left,
              width: anchorRect.width,
              bottom,
            }
          : {
              position: 'fixed',
              left: 0,
              right: 0,
              bottom,
              paddingLeft: 'env(safe-area-inset-left)',
              paddingRight: 'env(safe-area-inset-right)',
            }
      }
    >
      <div
        role="dialog"
        aria-label={ariaLabel || title}
        className={cn(GLASS_PANEL, className)}
        style={{
          borderTopLeftRadius: 18,
          borderTopRightRadius: 18,
          borderBottomLeftRadius: 14,
          borderBottomRightRadius: 14,
          maxHeight,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mx-auto flex max-h-[inherit] min-h-0 w-full min-w-0 flex-col">
          <div className="flex shrink-0 items-center justify-between gap-2 border-b border-white/40 px-3 py-2.5">
            <h2 className="truncate text-[11px] font-semibold uppercase tracking-wide text-zinc-500">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-lg px-2 py-1 text-xs font-semibold text-[#04D1FC] active:opacity-80"
            >
              Done
            </button>
          </div>
          <div
            className={cn(
              'min-h-0 flex-1 overflow-y-auto overscroll-contain px-3 py-2.5',
              contentClassName
            )}
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}