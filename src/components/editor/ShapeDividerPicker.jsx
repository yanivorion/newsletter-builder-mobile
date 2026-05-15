import React from 'react';
import { shapeDividers } from '../../lib/shapeDividers';
import { cn } from '../../lib/utils';

function ShapeDividerPicker({ 
  currentDivider, 
  onSelectDivider,
  position = 'bottom',
  flip = false 
}) {
  return (
    <div className="grid grid-cols-4 gap-1.5">
      {shapeDividers.map((divider) => {
        const isSelected = currentDivider === divider.id;
        
        return (
          <button
            key={divider.id}
            onClick={() => onSelectDivider(divider.id)}
            className={cn(
              "relative aspect-[2/1] rounded-lg border-2 transition-all duration-150 overflow-hidden",
              "hover:border-zinc-300 group",
              isSelected 
                ? "border-[#04D1FC] ring-1 ring-[#04D1FC]/20" 
                : "border-zinc-200 bg-zinc-50"
            )}
            title={divider.name}
          >
            {divider.path ? (
              <svg
                viewBox={divider.viewBox}
                preserveAspectRatio="none"
                className="absolute inset-0 w-full h-full"
                style={{
                  transform: `${position === 'top' ? 'scaleY(-1)' : ''} ${flip ? 'scaleX(-1)' : ''}`
                }}
              >
                <rect width="100%" height="100%" fill={isSelected ? '#E0F7FA' : '#f4f4f5'} />
                <path
                  d={divider.path}
                  fill={isSelected ? '#04D1FC' : '#a1a1aa'}
                />
              </svg>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-[8px] text-zinc-400 font-medium">None</span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default ShapeDividerPicker;

