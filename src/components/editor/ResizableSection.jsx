import React, { useState, useRef, useEffect } from 'react';
import { GripHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';

function ResizableSection({ 
  children, 
  height, 
  onHeightChange, 
  minHeight = 100, 
  maxHeight = 600,
  isSelected,
  isUnlocked 
}) {
  const [isResizing, setIsResizing] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(height);
  const containerRef = useRef(null);

  const handleMouseDown = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsResizing(true);
    setStartY(e.clientY);
    setStartHeight(height);
  };

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return;
      
      const deltaY = e.clientY - startY;
      const newHeight = Math.max(minHeight, Math.min(maxHeight, startHeight + deltaY));
      onHeightChange(Math.round(newHeight));
    };

    const handleMouseUp = () => {
      setIsResizing(false);
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, startY, startHeight, minHeight, maxHeight, onHeightChange]);

  return (
    <div 
      ref={containerRef} 
      className="relative group"
    >
      {children}
      
      {/* Resize handle - only show when selected and unlocked */}
      {isSelected && (
        <div
          className={cn(
            "absolute left-1/2 -translate-x-1/2 -bottom-3 z-20",
            "flex items-center justify-center",
            "transition-opacity duration-200",
            isUnlocked ? "opacity-100" : "opacity-0 group-hover:opacity-100"
          )}
        >
          <div
            onMouseDown={handleMouseDown}
            className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-full cursor-ns-resize",
              "bg-white border border-zinc-200 shadow-sm",
              "hover:bg-zinc-50 hover:border-zinc-300",
              "transition-all duration-200",
              isResizing && "bg-[#04D1FC] border-[#04D1FC] text-white"
            )}
          >
            <GripHorizontal className="w-4 h-4" />
            <span className="text-[10px] font-medium">{height}px</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default ResizableSection;

