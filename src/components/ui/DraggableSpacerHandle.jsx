import React, { useState, useRef, useCallback } from 'react';
import { GripHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

function DraggableSpacerHandle({ 
  value, 
  onChange, 
  min = 0, 
  max = 100,
  label,
  className 
}) {
  const [isDragging, setIsDragging] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(0);

  const handleMouseDown = useCallback((e) => {
    e.preventDefault();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;

    const handleMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startYRef.current;
      const newValue = Math.min(max, Math.max(min, startValueRef.current + deltaY));
      onChange(Math.round(newValue));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [value, onChange, min, max]);

  const showHandle = isDragging || isHovered;

  return (
    <div 
      className={cn(
        "relative flex items-center justify-center cursor-ns-resize select-none transition-all",
        className
      )}
      style={{ height: `${value}px`, minHeight: '8px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
    >
      {/* Visual spacer line */}
      <div 
        className={cn(
          "absolute inset-x-4 top-1/2 -translate-y-1/2 h-[2px] rounded-full transition-all",
          showHandle 
            ? "bg-[#04D1FC]/60" 
            : "bg-transparent"
        )}
      />
      
      {/* Handle pill */}
      <div 
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2",
          "flex items-center gap-1 px-2 py-0.5 rounded-full",
          "text-[10px] font-medium whitespace-nowrap",
          "transition-all duration-150",
          showHandle 
            ? "opacity-100 bg-[#04D1FC] text-white shadow-lg scale-100" 
            : "opacity-0 scale-90 pointer-events-none"
        )}
      >
        <GripHorizontal className="w-3 h-3" />
        <span>{value}px</span>
        {label && <span className="opacity-70">• {label}</span>}
      </div>

      {/* Drag indicator lines */}
      {isDragging && (
        <>
          <div className="absolute inset-x-0 top-0 h-[1px] bg-[#04D1FC]/40" />
          <div className="absolute inset-x-0 bottom-0 h-[1px] bg-[#04D1FC]/40" />
        </>
      )}
    </div>
  );
}

export default DraggableSpacerHandle;

