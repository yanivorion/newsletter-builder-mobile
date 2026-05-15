import React, { useState, useEffect, useCallback } from 'react';
import { cn } from '../../lib/utils';

function GradientPicker({ startColor, endColor, onStartColorChange, onEndColorChange, sectionKey }) {
  const [localStart, setLocalStart] = useState(startColor || '#04D1FC');
  const [localEnd, setLocalEnd] = useState(endColor || '#17A298');
  const [focusedField, setFocusedField] = useState(null);

  // Sync from props when not focused
  useEffect(() => {
    if (focusedField !== 'start') {
      setLocalStart(startColor || '#04D1FC');
    }
    if (focusedField !== 'end') {
      setLocalEnd(endColor || '#17A298');
    }
  }, [startColor, endColor, sectionKey, focusedField]);

  const handleStartColorPicker = useCallback((e) => {
    const val = e.target.value;
    setLocalStart(val);
    onStartColorChange(val);
  }, [onStartColorChange]);

  const handleEndColorPicker = useCallback((e) => {
    const val = e.target.value;
    setLocalEnd(val);
    onEndColorChange(val);
  }, [onEndColorChange]);

  const handleStartTextBlur = useCallback(() => {
    setFocusedField(null);
    if (/^#[0-9A-Fa-f]{6}$/.test(localStart)) {
      onStartColorChange(localStart);
    } else {
      setLocalStart(startColor || '#04D1FC');
    }
  }, [localStart, startColor, onStartColorChange]);

  const handleEndTextBlur = useCallback(() => {
    setFocusedField(null);
    if (/^#[0-9A-Fa-f]{6}$/.test(localEnd)) {
      onEndColorChange(localEnd);
    } else {
      setLocalEnd(endColor || '#17A298');
    }
  }, [localEnd, endColor, onEndColorChange]);

  return (
    <div className="space-y-3">
      {/* Gradient Preview */}
      <div 
        className="h-14 rounded-xl border border-zinc-200 shadow-inner"
        style={{
          background: `linear-gradient(135deg, ${localStart} 0%, ${localEnd} 100%)`
        }} 
      />
      
      {/* Color Inputs */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Start</span>
          <div className="flex gap-2">
            <input
              type="color"
              value={localStart}
              onChange={handleStartColorPicker}
              className="w-10 h-10 rounded-lg border border-zinc-200 cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={localStart}
              onChange={(e) => setLocalStart(e.target.value)}
              onFocus={() => setFocusedField('start')}
              onBlur={handleStartTextBlur}
              className="flex-1 h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#04D1FC] focus:border-transparent"
            />
          </div>
        </div>
        
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">End</span>
          <div className="flex gap-2">
            <input
              type="color"
              value={localEnd}
              onChange={handleEndColorPicker}
              className="w-10 h-10 rounded-lg border border-zinc-200 cursor-pointer bg-transparent"
            />
            <input
              type="text"
              value={localEnd}
              onChange={(e) => setLocalEnd(e.target.value)}
              onFocus={() => setFocusedField('end')}
              onBlur={handleEndTextBlur}
              className="flex-1 h-10 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-[#04D1FC] focus:border-transparent"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

export default GradientPicker;
