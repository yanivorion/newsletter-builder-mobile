import React, { useMemo, useRef, useState, useEffect } from 'react';
import { GRID_COLUMNS } from '../../lib/grid-schema';

const DOT_RADIUS = 2;
const MIN_GAP = 12;

/**
 * Dot-grid overlay for snap-to-grid visual feedback.
 * Dots appear at every column boundary, spaced so that
 * vertical gap = horizontal column width (equal gutters).
 * Hidden at rest — fades in during drag or resize.
 */
export default function GridOverlay({ visible = false, active = false }) {
  const containerRef = useRef(null);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    if (!visible || !containerRef.current) return;
    const el = containerRef.current.parentElement;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [visible]);

  const columnEdges = useMemo(() => {
    const edges = [];
    for (let col = 1; col < GRID_COLUMNS; col++) {
      edges.push((col / GRID_COLUMNS) * 100);
    }
    return edges;
  }, []);

  // Vertical dot gap matches horizontal column width
  const dotGap = Math.max(MIN_GAP, Math.round(containerWidth / GRID_COLUMNS));

  if (!visible) return null;

  return (
    <div
      ref={containerRef}
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 2,
        opacity: active ? 1 : 0,
        transition: 'opacity 0.15s ease-out',
      }}
    >
      {columnEdges.map((leftPct, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `calc(${leftPct}% - ${DOT_RADIUS}px)`,
            top: 0,
            bottom: 0,
            width: DOT_RADIUS * 2,
            backgroundImage: `radial-gradient(circle, rgba(4,209,252,0.5) ${DOT_RADIUS}px, transparent ${DOT_RADIUS}px)`,
            backgroundSize: `${DOT_RADIUS * 2}px ${dotGap}px`,
            backgroundRepeat: 'repeat-y',
            backgroundPosition: `center ${Math.floor(dotGap / 2)}px`,
          }}
        />
      ))}
    </div>
  );
}
