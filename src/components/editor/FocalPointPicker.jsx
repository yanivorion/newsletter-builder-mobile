import React, { useState, useRef, useEffect } from 'react';
import { Target, RotateCcw } from 'lucide-react';
import { Button } from '../ui/Button';
import { cn } from '../../lib/utils';

function FocalPointPicker({ image, focalPoint = { x: 50, y: 50 }, onChange }) {
  const containerRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
    updateFocalPoint(e);
  };

  const handleMouseMove = (e) => {
    if (!isDragging) return;
    updateFocalPoint(e);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const updateFocalPoint = (e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    
    onChange({ x: Math.round(x), y: Math.round(y) });
  };

  const resetFocalPoint = () => {
    onChange({ x: 50, y: 50 });
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging]);

  if (!image) {
    return (
      <div className="h-24 rounded-xl bg-zinc-100 border border-zinc-200 flex items-center justify-center">
        <span className="text-xs text-zinc-400">No image selected</span>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Preview with focal point */}
      <div 
        ref={containerRef}
        className={cn(
          "relative h-28 rounded-xl overflow-hidden border border-zinc-200 cursor-crosshair",
          isDragging && "ring-2 ring-[#04D1FC]"
        )}
        onMouseDown={handleMouseDown}
      >
        <img 
          src={image} 
          alt="Focal point preview"
          className="w-full h-full object-cover"
          style={{
            objectPosition: `${focalPoint.x}% ${focalPoint.y}%`
          }}
          draggable={false}
        />
        
        {/* Focal point indicator */}
        <div 
          className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            left: `${focalPoint.x}%`,
            top: `${focalPoint.y}%`
          }}
        >
          {/* Outer ring */}
          <div className="absolute inset-0 rounded-full border-2 border-white shadow-lg" />
          {/* Inner dot */}
          <div className="absolute inset-[6px] rounded-full bg-[#04D1FC] shadow-md" />
          {/* Crosshair lines */}
          <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/70 -translate-x-1/2" />
          <div className="absolute top-1/2 left-0 right-0 h-px bg-white/70 -translate-y-1/2" />
        </div>

        {/* Grid overlay */}
        <div className="absolute inset-0 pointer-events-none opacity-30">
          <div className="absolute left-1/3 top-0 bottom-0 w-px bg-white" />
          <div className="absolute left-2/3 top-0 bottom-0 w-px bg-white" />
          <div className="absolute top-1/3 left-0 right-0 h-px bg-white" />
          <div className="absolute top-2/3 left-0 right-0 h-px bg-white" />
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-[10px] text-zinc-500">
          <span className="flex items-center gap-1">
            <Target className="w-3 h-3" />
            X: {focalPoint.x}%
          </span>
          <span>Y: {focalPoint.y}%</span>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={resetFocalPoint}
          className="h-6 px-2 text-[10px]"
        >
          <RotateCcw className="w-3 h-3" />
          Center
        </Button>
      </div>
    </div>
  );
}

export default FocalPointPicker;

