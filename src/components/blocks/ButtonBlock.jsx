import React from 'react';

export default function ButtonBlock({
  text = 'Click Here',
  url = '#',
  fontSize = 16,
  fontWeight = '600',
  textColor = '#FFFFFF',
  backgroundColor = '#04D1FC',
  borderRadius = 8,
  paddingH = 32,
  paddingV = 14,
  align = 'center',
  fullWidth = false,
}) {
  const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end' };

  return (
    <div style={{ display: 'flex', justifyContent: alignMap[align] || 'center', padding: '8px 0' }}>
      <a
        href={url}
        style={{
          display: 'inline-block',
          padding: `${paddingV}px ${paddingH}px`,
          fontSize,
          fontWeight,
          color: textColor,
          backgroundColor,
          borderRadius,
          textDecoration: 'none',
          textAlign: 'center',
          width: fullWidth ? '100%' : undefined,
          fontFamily: "'Poppins', sans-serif",
          cursor: 'pointer',
        }}
      >
        {text}
      </a>
    </div>
  );
}
