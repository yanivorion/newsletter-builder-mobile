import React from 'react';

export default function CompanyInfoBlock({
  text = '',
  color = '#374151',
  fontSize = 14,
  align = 'center',
}) {
  if (!text) return null;

  return (
    <p
      style={{
        margin: 0,
        padding: '8px 0',
        textAlign: align,
        color,
        fontSize,
        fontFamily: "'Poppins', sans-serif",
        lineHeight: 1.5,
      }}
    >
      {text}
    </p>
  );
}
