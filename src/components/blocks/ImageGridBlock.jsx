import React, { useState } from 'react';
import { ImageIcon } from 'lucide-react';

const GRID_PRESETS = {
  'two-equal': { label: '2 Equal', cols: [6, 6] },
  'two-wide': { label: '2 Wide (5/7)', cols: [5, 7] },
  'three-equal': { label: '3 Equal', cols: [4, 4, 4] },
  'two-by-two': { label: '2×2 Grid', rows: [[6, 6], [6, 6]] },
};

function ImageCell({ src, height, borderRadius, onSetImage }) {
  const [hovered, setHovered] = useState(false);
  const canSet = !!onSetImage;

  if (src) {
    return (
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          position: 'relative',
          width: '100%',
          height,
          borderRadius,
          overflow: 'hidden',
          backgroundImage: `url(${src})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
      >
        {hovered && canSet && (
          <div
            onClick={(e) => { e.stopPropagation(); onSetImage(); }}
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              width: 28,
              height: 28,
              borderRadius: 6,
              background: 'rgba(0,0,0,0.5)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <ImageIcon size={14} style={{ color: '#fff' }} />
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={canSet ? (e) => { e.stopPropagation(); onSetImage(); } : undefined}
      style={{
        width: '100%',
        height,
        borderRadius,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        background: hovered && canSet ? 'rgba(4,209,252,0.04)' : '#f4f4f5',
        cursor: canSet ? 'pointer' : undefined,
        transition: 'background 150ms',
      }}
    >
      <ImageIcon
        size={20}
        style={{
          color: hovered && canSet ? '#04D1FC' : '#A1A1AA',
          opacity: hovered ? 0.8 : 0.4,
          transition: 'all 200ms',
        }}
      />
      <span style={{
        fontSize: 10,
        fontWeight: 500,
        color: hovered && canSet ? '#04D1FC' : '#A1A1AA',
        opacity: hovered ? 1 : 0.6,
        transition: 'all 200ms',
      }}>
        {hovered && canSet ? 'Set image' : 'Click to set'}
      </span>
    </div>
  );
}

export default function ImageGridBlock({
  gridPreset = 'two-equal',
  images = [],
  imageHeight = 180,
  imageBorderRadius = 12,
  imageGap = 8,
  onSetLayoutImage,
}) {
  const preset = GRID_PRESETS[gridPreset] || GRID_PRESETS['two-equal'];

  const renderRow = (cols, rowIdx = 0) => (
    <div
      key={rowIdx}
      style={{
        display: 'grid',
        gridTemplateColumns: cols.map(s => `${s}fr`).join(' '),
        gap: imageGap,
      }}
    >
      {cols.map((_, i) => {
        const imgIdx = rowIdx * cols.length + i;
        return (
          <ImageCell
            key={imgIdx}
            src={images[imgIdx]}
            height={imageHeight}
            borderRadius={imageBorderRadius}
            onSetImage={onSetLayoutImage ? () => onSetLayoutImage(imgIdx) : undefined}
          />
        );
      })}
    </div>
  );

  const rows = preset.rows || [preset.cols];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: imageGap }}>
      {rows.map((cols, i) => renderRow(cols, i))}
    </div>
  );
}

export { GRID_PRESETS };
