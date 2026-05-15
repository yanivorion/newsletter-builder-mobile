import React from 'react';

export default function DividerBlock({
  color = '#E5E7EB',
  thickness = 1,
  style = 'solid',
  width = '100%',
  marginTop = 8,
  marginBottom = 8,
}) {
  return (
    <div style={{ padding: '0 16px' }}>
      <hr
        style={{
          border: 'none',
          borderTop: `${thickness}px ${style} ${color}`,
          width,
          margin: `${marginTop}px auto ${marginBottom}px`,
        }}
      />
    </div>
  );
}
