import React, { useState } from 'react';
import { getPresetById } from '../../lib/collagePresets';

function ImageCollageSection({ 
  layout, 
  images = [], 
  gap, 
  imageHeight, 
  backgroundColor, 
  focalPoints = [],
  imageBackgrounds = [],
  imageOverlays = [],
  onSetCollageImage,
}) {
  const preset = getPresetById(layout) || getPresetById('featured-left');
  const containerStyle = {
    backgroundColor: backgroundColor || '#FFFFFF',
    padding: '16px'
  };

  if (!preset) {
    return (
      <div style={containerStyle}>
        <p>Invalid layout</p>
      </div>
    );
  }

  const { preview } = preset;
  const rows = preview.length;
  const cols = preview[0].length;
  const gapPx = gap || 8;

  // Process cells to get unique cell definitions with their spans
  const processedCells = [];
  const rendered = new Set();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellId = preview[r][c];
      
      if (rendered.has(cellId)) continue;
      
      let colSpan = 1;
      let rowSpan = 1;
      
      while (c + colSpan < cols && preview[r][c + colSpan] === cellId) {
        colSpan++;
      }
      
      while (r + rowSpan < rows && preview[r + rowSpan]?.[c] === cellId) {
        rowSpan++;
      }
      
      rendered.add(cellId);
      
      processedCells.push({
        id: cellId,
        col: c + 1,
        row: r + 1,
        colSpan,
        rowSpan,
        imageIndex: cellId - 1
      });
    }
  }

  return (
    <div style={containerStyle}>
      <div 
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${cols}, 1fr)`,
          gridTemplateRows: `repeat(${rows}, ${imageHeight / rows}px)`,
          gap: `${gapPx}px`
        }}
      >
        {processedCells.map((cell) => {
          const image = images?.[cell.imageIndex];
          const focalPoint = focalPoints?.[cell.imageIndex] || { x: 50, y: 50 };
          const imageBg = imageBackgrounds?.[cell.imageIndex] || null;
          const overlay = imageOverlays?.[cell.imageIndex] || null;
          
          return (
            <div
              key={cell.id}
              style={{
                gridColumn: `${cell.col} / span ${cell.colSpan}`,
                gridRow: `${cell.row} / span ${cell.rowSpan}`,
                borderRadius: '8px',
                overflow: 'hidden',
                backgroundColor: imageBg || '#f4f4f5',
                minHeight: '20px',
                position: 'relative'
              }}
            >
              {image ? (
                <CollageFilledCell
                  image={image}
                  cellId={cell.id}
                  imageIndex={cell.imageIndex}
                  objectFit={imageBg ? 'contain' : 'cover'}
                  focalPoint={focalPoint}
                  overlay={overlay}
                  onSetImage={onSetCollageImage}
                />
              ) : (
                <CollageEmptyCell
                  cellId={cell.id}
                  imageIndex={cell.imageIndex}
                  onSetImage={onSetCollageImage}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function CollageFilledCell({ image, cellId, imageIndex, objectFit, focalPoint, overlay, onSetImage }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{ width: '100%', height: '100%', position: 'relative' }}
    >
      <img
        src={image}
        alt={`Image ${cellId}`}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          objectPosition: `${focalPoint.x}% ${focalPoint.y}%`,
          display: 'block',
        }}
      />
      {overlay && overlay.color && overlay.opacity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundColor: overlay.color,
            opacity: overlay.opacity / 100,
            pointerEvents: 'none',
          }}
        />
      )}
      {hovered && onSetImage && (
        <div
          onClick={(e) => { e.stopPropagation(); onSetImage(imageIndex); }}
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
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21,15 16,10 5,21"/>
          </svg>
        </div>
      )}
    </div>
  );
}

function CollageEmptyCell({ cellId, imageIndex, onSetImage }) {
  const [hovered, setHovered] = useState(false);
  const canSet = !!onSetImage;
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={canSet ? (e) => { e.stopPropagation(); onSetImage(imageIndex); } : undefined}
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: hovered && canSet ? '#04D1FC' : '#a1a1aa',
        fontSize: '11px',
        gap: 6,
        cursor: canSet ? 'pointer' : undefined,
        transition: 'all 150ms',
        background: hovered && canSet ? 'rgba(4,209,252,0.04)' : undefined,
      }}
    >
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
        <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
        <circle cx="8.5" cy="8.5" r="1.5"/>
        <polyline points="21,15 16,10 5,21"/>
      </svg>
      <span style={{ fontWeight: 500, opacity: hovered ? 1 : 0.6 }}>
        {hovered && canSet ? 'Set image' : 'Click to set'}
      </span>
    </div>
  );
}

export default ImageCollageSection;
