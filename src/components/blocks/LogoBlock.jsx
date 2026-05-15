import React from 'react';
import { ImageIcon } from 'lucide-react';

export default function LogoBlock({
  src,
  width = 120,
  height = 'auto',
  alignment = 'center',
  rightText,
  rightTextColor = '#FFFFFF',
  rightTextFontSize = 11,
  rightTextFontWeight = 500,
  rightTextLetterSpacing = '0.05em',
}) {
  const alignMap = { left: 'flex-start', center: 'center', right: 'flex-end' };
  const hasRightText = !!rightText;
  const justify = hasRightText ? 'space-between' : (alignMap[alignment] || 'center');

  const logoEl = src ? (
    <img
      src={src}
      alt="Logo"
      style={{
        display: 'block',
        width,
        height: height === 'auto' ? 'auto' : height,
        objectFit: 'contain',
      }}
    />
  ) : (
    <div
      style={{
        width,
        height: typeof height === 'number' ? height : 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(255,255,255,0.15)',
        borderRadius: 6,
        border: '1px dashed rgba(255,255,255,0.3)',
      }}
    >
      <ImageIcon size={18} style={{ opacity: 0.4, color: 'currentColor' }} />
    </div>
  );

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: justify,
        padding: '8px 0',
      }}
    >
      {logoEl}
      {hasRightText && (
        <span
          style={{
            fontSize: rightTextFontSize,
            fontWeight: rightTextFontWeight,
            color: rightTextColor,
            letterSpacing: rightTextLetterSpacing,
            fontFamily: "'Poppins', 'Helvetica Neue', Arial, sans-serif",
            textTransform: 'uppercase',
          }}
        >
          {rightText}
        </span>
      )}
    </div>
  );
}
