import React from 'react';

function SectionHeaderSection({ 
  text, 
  backgroundColor, 
  gradientEnd,
  gradientDirection = '90deg',
  color, 
  fontSize, 
  fontWeight, 
  letterSpacing, 
  padding,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight
}) {
  // Calculate background style with optional gradient
  const bgStyle = gradientEnd 
    ? `linear-gradient(${gradientDirection}, ${backgroundColor || '#04D1FC'} 0%, ${gradientEnd} 100%)`
    : backgroundColor || '#04D1FC';

  const headerStyle = {
    background: bgStyle,
    backgroundColor: backgroundColor || '#04D1FC', // Fallback
    color: color || '#FFFFFF',
    paddingTop: `${paddingTop ?? padding ?? 14}px`,
    paddingBottom: `${paddingBottom ?? padding ?? 14}px`,
    paddingLeft: `${paddingLeft ?? 24}px`,
    paddingRight: `${paddingRight ?? 24}px`,
    textAlign: 'center',
    fontFamily: 'Inter, -apple-system, sans-serif',
    fontSize: `${fontSize || 14}px`,
    fontWeight: fontWeight || 600,
    letterSpacing: letterSpacing || '0.08em',
    textTransform: 'uppercase'
  };

  return (
    <div style={headerStyle}>
      {text || 'SECTION TITLE'}
    </div>
  );
}

export default SectionHeaderSection;
