'use client';

import React, { useState, useEffect, useRef } from 'react';
import { LAYOUT_PRESETS } from '../blocks/MultiLayoutBlock';

const presetEntries = Object.entries(LAYOUT_PRESETS);

export default function LayoutCarousel({ onSelect, onClose }) {
  const [isVisible, setIsVisible] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    requestAnimationFrame(() => setIsVisible(true));
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => onClose?.(), 300);
  };

  const handleSelect = (id) => {
    handleClose();
    setTimeout(() => onSelect?.(id), 50);
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 10060,
        pointerEvents: 'auto',
      }}
    >
      {/* Dark glass backdrop — tap upper area to dismiss */}
      <div
        onClick={handleClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(8, 10, 20, 0.72)',
          backdropFilter: 'blur(18px) saturate(160%)',
          WebkitBackdropFilter: 'blur(18px) saturate(160%)',
          opacity: isVisible ? 1 : 0,
          transition: 'opacity 300ms ease',
        }}
      />

      {/* Carousel tray — slides up from bottom */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 10,
          transform: isVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 420ms cubic-bezier(0.16, 1, 0.3, 1)',
          background: 'rgba(18, 20, 32, 0.88)',
          backdropFilter: 'blur(24px) saturate(180%)',
          WebkitBackdropFilter: 'blur(24px) saturate(180%)',
          borderTop: '1px solid rgba(255,255,255,0.10)',
          paddingBottom: 'calc(100px + env(safe-area-inset-bottom, 0px))',
          paddingTop: 16,
        }}
      >
        {/* Drag handle */}
        <div style={{
          width: 36, height: 4, borderRadius: 2,
          background: 'rgba(255,255,255,0.18)',
          margin: '0 auto 16px',
        }} />

        {/* Scrollable row */}
        <div
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: 12,
            overflowX: 'auto',
            overflowY: 'visible',
            paddingLeft: 16,
            paddingRight: 16,
            paddingBottom: 4,
            scrollbarWidth: 'none',
            WebkitOverflowScrolling: 'touch',
          }}
        >
          {presetEntries.map(([id, preset]) => (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id)}
              style={{
                flexShrink: 0,
                width: 120,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12,
                padding: 0,
                cursor: 'pointer',
                overflow: 'hidden',
                transition: 'transform 200ms ease, border-color 200ms ease',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.transform = 'scale(1.04)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.30)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.transform = 'scale(1)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
              }}
            >
              {/* Thumbnail */}
              <div style={{
                background: 'rgba(255,255,255,0.95)',
                width: '100%',
                aspectRatio: '3/4',
                overflow: 'hidden',
              }}>
                {preset.thumbnail ? (
                  <img
                    src={preset.thumbnail}
                    alt={preset.label}
                    draggable={false}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                  />
                ) : (
                  <LayoutPreviewSVG />
                )}
              </div>
              {/* Label */}
              <div style={{
                padding: '8px 6px',
                textAlign: 'center',
                fontSize: 11,
                fontWeight: 500,
                color: 'rgba(255,255,255,0.65)',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {preset.label}
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function LayoutPreviewSVG() {
  return (
    <svg width="100%" height="100%" viewBox="0 0 120 160" fill="none" xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}>
      <rect x="10" y="12" width="100" height="14" rx="3" fill="#E5E7EB" />
      <rect x="10" y="32" width="100" height="56" rx="4" fill="#F3F4F6" />
      <rect x="10" y="96" width="60" height="8" rx="2" fill="#E5E7EB" />
      <rect x="10" y="110" width="100" height="6" rx="2" fill="#F3F4F6" />
      <rect x="10" y="120" width="80" height="6" rx="2" fill="#F3F4F6" />
      <rect x="10" y="130" width="90" height="6" rx="2" fill="#F3F4F6" />
      <rect x="10" y="144" width="40" height="10" rx="5" fill="#E5E7EB" />
    </svg>
  );
}
