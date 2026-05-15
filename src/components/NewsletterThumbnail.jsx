import React from 'react';
import NewsletterRenderer from './NewsletterRenderer';

// Renders a scaled-down preview of a newsletter inside a fixed-size card.
// We render at the real width (700px = the email canvas width) and use a
// CSS transform to fit it into the card. This is the simplest approach
// that works for ANY newsletter, with no thumbnail-image generation step.

export default function NewsletterThumbnail({
  newsletter,
  width = 280,
  height = 180,
}) {
  const sourceWidth = 700;
  const scale = width / sourceWidth;
  const scaledFullHeight = height / scale;

  if (!newsletter || !newsletter.sections || newsletter.sections.length === 0) {
    return (
      <div
        style={{
          width,
          height,
          background: 'linear-gradient(145deg, #f1f5f9, #e2e8f0)',
          borderRadius: 8,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#94a3b8',
          fontSize: 11,
          fontWeight: 500,
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
        }}
      >
        Empty
      </div>
    );
  }

  return (
    <div
      aria-hidden
      style={{
        width,
        height,
        overflow: 'hidden',
        borderRadius: 8,
        position: 'relative',
        background: '#fff',
        boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.06)',
        flexShrink: 0,
      }}
    >
      <div
        style={{
          width: sourceWidth,
          height: scaledFullHeight,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          pointerEvents: 'none',
        }}
      >
        <NewsletterRenderer newsletter={newsletter} />
      </div>
    </div>
  );
}
