import React, { useCallback, useRef, useState } from 'react';
import { GRID_COLUMNS } from '../../lib/grid-schema';

/**
 * Draggable divider between two grid columns.
 * Converts pixel drag deltas into grid-column snaps and calls
 * onResize(delta) where delta is in grid columns (+right, -left).
 */
export default function ColumnResizer({ onResize, containerWidth, onInteractionStart, onInteractionEnd }) {
  const [isDragging, setIsDragging] = useState(false);
  const startXRef = useRef(0);
  const accumulatedRef = useRef(0);

  const colWidth = containerWidth / GRID_COLUMNS;

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    onInteractionStart?.();
    startXRef.current = e.clientX;
    accumulatedRef.current = 0;

    const onMove = (ev) => {
      const dx = ev.clientX - startXRef.current;
      const gridDelta = Math.round(dx / colWidth);

      if (gridDelta !== accumulatedRef.current) {
        const step = gridDelta - accumulatedRef.current;
        accumulatedRef.current = gridDelta;
        onResize?.(step);
      }
    };

    const onUp = () => {
      setIsDragging(false);
      onInteractionEnd?.();
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, [onResize, colWidth, onInteractionStart, onInteractionEnd]);

  return (
    <div
      onMouseDown={handleMouseDown}
      style={{
        position: 'absolute',
        top: 0,
        bottom: 0,
        width: 12,
        marginLeft: -6,
        cursor: 'col-resize',
        zIndex: 30,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Visual handle */}
      <div
        style={{
          width: isDragging ? 3 : 2,
          height: isDragging ? '100%' : 32,
          borderRadius: 2,
          backgroundColor: isDragging ? '#04D1FC' : 'rgba(0,0,0,0.15)',
          transition: isDragging ? 'none' : 'all 0.15s',
        }}
      />
    </div>
  );
}
