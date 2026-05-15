import React from 'react';
import { getDividerById } from '../../lib/shapeDividers';
import { cn } from '../../lib/utils';

function ShapeDivider({ 
  dividerId, 
  position = 'bottom', // 'top' or 'bottom'
  flip = false,
  flipV = false, // Vertical flip
  color = '#FFFFFF',
  height = 50,
  className
}) {
  const divider = getDividerById(dividerId);
  
  if (!divider || !divider.path) return null;

  const transforms = [];
  
  // Flip vertically if at top (rotate 180) or if flipV is true
  if (position === 'top') {
    transforms.push('scaleY(-1)');
  }
  
  // Apply user's vertical flip (inverts the automatic position-based flip)
  if (flipV) {
    transforms.push('scaleY(-1)');
  }
  
  // Flip horizontally if flip is true
  if (flip) {
    transforms.push('scaleX(-1)');
  }

  return (
    <div 
      className={cn(
        "absolute left-0 right-0 w-full overflow-hidden pointer-events-none",
        position === 'top' ? 'top-0' : 'bottom-0',
        className
      )}
      style={{ 
        height: `${height}px`,
        transform: position === 'top' ? 'translateY(0)' : 'translateY(1px)' // Prevent gaps
      }}
    >
      <svg
        viewBox={divider.viewBox}
        preserveAspectRatio="none"
        className="absolute w-full h-full"
        style={{
          transform: transforms.join(' ') || 'none'
        }}
      >
        <path
          d={divider.path}
          fill={color}
        />
      </svg>
    </div>
  );
}

export default ShapeDivider;

