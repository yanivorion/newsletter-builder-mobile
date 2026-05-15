import React from 'react';
import { ChevronRight } from 'lucide-react';

export default function TitleBlock({
  text = 'SECTION TITLE',
  fontSize = 18,
  fontWeight = 700,
  fontStyle = 'normal',
  letterSpacing = '0.1em',
  color = '#FFFFFF',
  textAlign = 'center',
  padding = 12,
  fontFamily,
  lineHeight = 1.2,
  backgroundColor,
  borderRadius = 0,
  showChevron = false,
  maxWidth,
}) {
  const isBadge = !!backgroundColor;

  if (isBadge) {
    return (
      <div style={{ padding: '4px 0', textAlign }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
            padding: `${typeof padding === 'number' ? padding : 12}px ${typeof padding === 'number' ? padding + 8 : 20}px`,
            backgroundColor,
            borderRadius,
            fontFamily: fontFamily || "'Poppins', 'Helvetica Neue', Arial, sans-serif",
            width: maxWidth || '100%',
            boxSizing: 'border-box',
          }}
        >
          <span
            style={{
              margin: 0,
              fontSize,
              fontWeight,
              fontStyle,
              letterSpacing,
              color,
              lineHeight,
            }}
          >
            {text}
          </span>
          {showChevron && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 28,
                height: 28,
                borderRadius: '50%',
                backgroundColor: 'rgba(255,255,255,0.25)',
                color,
                flexShrink: 0,
              }}
            >
              <ChevronRight size={16} strokeWidth={2.5} />
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding,
        textAlign,
        fontFamily: fontFamily || "'Poppins', 'Helvetica Neue', Arial, sans-serif",
      }}
    >
      <h2
        style={{
          margin: 0,
          fontSize,
          fontWeight,
          fontStyle,
          letterSpacing,
          color,
          lineHeight,
          fontFamily: 'inherit',
        }}
      >
        {text}
      </h2>
    </div>
  );
}
