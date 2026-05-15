import React from 'react';

export default function FooterLinksBlock({
  links = [],
  color = '#374151',
  fontSize = 14,
  align = 'center',
}) {
  if (!links.length) return null;

  return (
    <div style={{ textAlign: align, padding: '8px 0' }}>
      {links.map((link, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <span style={{ color, opacity: 0.4, margin: '0 8px', fontSize }}>|</span>
          )}
          <a
            href={link.url || '#'}
            style={{
              color,
              fontSize,
              textDecoration: 'none',
              fontFamily: "'Poppins', sans-serif",
            }}
          >
            {link.text}
          </a>
        </React.Fragment>
      ))}
    </div>
  );
}
