import React from 'react';

/**
 * SectionWrapper - Professional email template pattern
 * 
 * Provides:
 * - Outer container with padding and background color (visual spacing)
 * - Inner container with stroke, radius, background color, and background image
 */
function SectionWrapper({
  children,
  // Outer container styles
  outerPadding = 0,
  outerPaddingTop,
  outerPaddingBottom,
  outerPaddingLeft,
  outerPaddingRight,
  outerBackgroundColor = 'transparent',
  
  // Inner container styles
  innerBorderWidth = 0,
  innerBorderColor = '#E5E5E5',
  innerBorderRadius = 0,
  innerBackgroundColor = 'transparent',
  
  // Background image (for inner container)
  backgroundImage = null,
  backgroundPosition = 'center',
  backgroundRepeat = 'no-repeat',
  
  // Extra styles
  className = '',
  style = {}
}) {
  // Calculate outer padding
  const outerPaddingStyle = {
    paddingTop: outerPaddingTop ?? outerPadding,
    paddingBottom: outerPaddingBottom ?? outerPadding,
    paddingLeft: outerPaddingLeft ?? outerPadding,
    paddingRight: outerPaddingRight ?? outerPadding,
  };

  // Outer container style
  const outerStyle = {
    backgroundColor: outerBackgroundColor,
    ...outerPaddingStyle,
  };

  // Inner container style
  const innerStyle = {
    backgroundColor: innerBackgroundColor,
    borderRadius: `${innerBorderRadius}px`,
    border: innerBorderWidth > 0 ? `${innerBorderWidth}px solid ${innerBorderColor}` : 'none',
    overflow: 'hidden',
    position: 'relative',
    // Background image - 100% width, auto height
    ...(backgroundImage && {
      backgroundImage: `url(${backgroundImage})`,
      backgroundSize: '100% auto', // Full width, auto height
      backgroundPosition: backgroundPosition,
      backgroundRepeat: backgroundRepeat,
    }),
    ...style,
  };

  return (
    <div style={outerStyle} className={className}>
      <div style={innerStyle}>
        {children}
      </div>
    </div>
  );
}

export default SectionWrapper;

