import React, { useRef, useState, useCallback, useEffect } from 'react';

function SectionContainer({
  section,
  isSelected,
  children,
  onHeightChange,
  onPaddingChange,
  onEdgeState,
}) {
  const innerRef = useRef(null);
  const outerRef = useRef(null);
  const [draggingEdge, setDraggingEdge] = useState(null);
  const [hoveringEdge, setHoveringEdge] = useState(null);
  const [resizingHeight, setResizingHeight] = useState(false);

  const { background = {}, padding = {}, height = 'auto', minHeight } = section;
  const pt = padding.top ?? 0;
  const pb = padding.bottom ?? 0;
  const pl = padding.left ?? 0;
  const pr = padding.right ?? 0;

  const [bgImgMinHeight, setBgImgMinHeight] = useState(0);
  const hasBgImage = background.type === 'image' && background.image;
  // Default auto so new/dropped images hug aspect ratio (undefined used to mean cover → clipped).
  const rawImageSize = background.imageSize ?? 'auto';
  const useIntrinsicImage =
    hasBgImage &&
    typeof height !== 'number' &&
    (rawImageSize === 'auto' || rawImageSize === '100% auto');
  const useFillImage = hasBgImage && !useIntrinsicImage;

  useEffect(() => {
    if (!useFillImage) {
      setBgImgMinHeight(0);
      return;
    }
    const img = new Image();
    img.onload = () => {
      if (img.naturalWidth > 0) {
        const containerW = outerRef.current?.offsetWidth || 700;
        setBgImgMinHeight(Math.round((img.naturalHeight / img.naturalWidth) * containerW));
      }
    };
    img.src = background.image;
  }, [useFillImage, background.image]);

  const padRef = useRef({ top: pt, bottom: pb, left: pl, right: pr });
  useEffect(() => {
    padRef.current = { top: pt, bottom: pb, left: pl, right: pr };
  }, [pt, pb, pl, pr]);

  const onPaddingChangeRef = useRef(onPaddingChange);
  useEffect(() => { onPaddingChangeRef.current = onPaddingChange; }, [onPaddingChange]);

  const onHeightChangeRef = useRef(onHeightChange);
  useEffect(() => { onHeightChangeRef.current = onHeightChange; }, [onHeightChange]);

  const onEdgeStateRef = useRef(onEdgeState);
  useEffect(() => { onEdgeStateRef.current = onEdgeState; }, [onEdgeState]);

  // Notify parent of active edge (drag or hover)
  useEffect(() => {
    onEdgeStateRef.current?.(draggingEdge || hoveringEdge || null);
  }, [draggingEdge, hoveringEdge]);

  const startEdgeDrag = useCallback((edge, e) => {
    e.preventDefault();
    e.stopPropagation();
    setDraggingEdge(edge);

    const isVertical = edge === 'top' || edge === 'bottom';
    const isHorizontal = edge === 'left' || edge === 'right';
    const startPos = isVertical ? e.clientY : e.clientX;
    const startVal = padRef.current[edge];
    const sign = (edge === 'top' || edge === 'left') ? 1 : -1;

    let rafId = null;
    let lastVal = startVal;

    const onMove = (ev) => {
      const currentPos = isVertical ? ev.clientY : ev.clientX;
      const delta = (currentPos - startPos) * sign;
      const newVal = Math.max(0, Math.round(startVal + delta));

      if (newVal !== lastVal) {
        lastVal = newVal;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          let full;
          if (isHorizontal) {
            full = { ...padRef.current, left: newVal, right: newVal };
          } else {
            full = { ...padRef.current, [edge]: newVal };
          }
          padRef.current = full;
          onPaddingChangeRef.current?.(full);
        });
      }
    };

    const onUp = () => {
      setDraggingEdge(null);
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  const startHeightResize = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingHeight(true);

    const startY = e.clientY;
    const outerEl = outerRef.current;
    const startH = outerEl ? outerEl.offsetHeight : 200;
    let rafId = null;

    const onMove = (ev) => {
      const newH = Math.max(40, startH + (ev.clientY - startY));
      if (rafId) cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        onHeightChangeRef.current?.(newH);
      });
    };

    const onUp = () => {
      setResizingHeight(false);
      if (rafId) cancelAnimationFrame(rafId);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }, []);

  // Which edges are visually active (for tint + handle highlight)
  const activeEdge = draggingEdge || hoveringEdge;
  const isHActive = activeEdge === 'left' || activeEdge === 'right';
  const showTop = activeEdge === 'top';
  const showBottom = activeEdge === 'bottom';
  const showLeft = isHActive;
  const showRight = isHActive;

  const borderRadius = section.borderRadius ?? 0;

  const outerStyle = {
    paddingTop: pt,
    paddingBottom: pb,
    paddingLeft: pl,
    paddingRight: pr,
    position: 'relative',
    overflow: (borderRadius > 0 || useIntrinsicImage) ? 'hidden' : 'visible',
    borderRadius: borderRadius > 0 ? `${borderRadius}px` : undefined,
  };

  if (useFillImage && bgImgMinHeight > 0) {
    const effectiveH = typeof height === 'number' ? Math.max(height, bgImgMinHeight) : bgImgMinHeight;
    outerStyle.minHeight = effectiveH;
  } else if (typeof height === 'number') {
    outerStyle.height = height;
    outerStyle.overflow = 'hidden';
  }

  switch (background.type) {
    case 'solid':
      outerStyle.backgroundColor = background.color || '#FFFFFF';
      break;
    case 'gradient': {
      const angle = background.gradientAngle ?? 180;
      const start = background.gradientStart || '#04D1FC';
      const end = background.gradientEnd || '#17A298';
      outerStyle.background = `linear-gradient(${angle}deg, ${start}, ${end})`;
      break;
    }
    case 'image':
      outerStyle.backgroundColor = background.color || background.fallbackColor || '#FFFFFF';
      break;
    case 'none':
      outerStyle.backgroundColor = 'transparent';
      break;
    default:
      outerStyle.backgroundColor = background.color || '#FFFFFF';
  }

  const innerStyle = {
    position: 'relative',
    width: '100%',
    minHeight: minHeight ?? undefined,
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  };

  const intrinsicInnerStyle = {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    zIndex: 2,
    width: '100%',
    minHeight: minHeight ?? undefined,
    display: 'flex',
    flexDirection: 'column',
  };

  const fillObjectFit = rawImageSize === 'contain' ? 'contain' : 'cover';

  const STRIP = 10;

  const innerContent = (
    <div style={{ position: 'relative', zIndex: 2, display: 'flex', flexDirection: 'column', flex: '1 1 auto' }}>
      {children}
    </div>
  );

  return (
    <div ref={outerRef} style={outerStyle}>
      {/* Padding zone tints — only when hovering/dragging that edge */}
      {isSelected && (
        <>
          {showTop && pt > 0 && <PadZone edge="top" size={pt} active={!!draggingEdge} />}
          {showBottom && pb > 0 && <PadZone edge="bottom" size={pb} active={!!draggingEdge} />}
          {showLeft && pl > 0 && <PadZone edge="left" size={pl} active={!!draggingEdge} />}
          {showRight && pr > 0 && <PadZone edge="right" size={pr} active={!!draggingEdge} />}
        </>
      )}

      {/* Padding drag strips */}
      {isSelected && (
        <>
          <DragStrip edge="top" pt={pt} pb={pb} pl={pl} pr={pr} strip={STRIP}
            dragging={draggingEdge} hovering={hoveringEdge}
            onMouseDown={(e) => startEdgeDrag('top', e)}
            onHover={setHoveringEdge} />
          <DragStrip edge="bottom" pt={pt} pb={pb} pl={pl} pr={pr} strip={STRIP}
            dragging={draggingEdge} hovering={hoveringEdge}
            onMouseDown={(e) => startEdgeDrag('bottom', e)}
            onHover={setHoveringEdge} />
          <DragStrip edge="left" pt={pt} pb={pb} pl={pl} pr={pr} strip={STRIP}
            dragging={draggingEdge} hovering={hoveringEdge}
            onMouseDown={(e) => startEdgeDrag('left', e)}
            onHover={setHoveringEdge} />
          <DragStrip edge="right" pt={pt} pb={pb} pl={pl} pr={pr} strip={STRIP}
            dragging={draggingEdge} hovering={hoveringEdge}
            onMouseDown={(e) => startEdgeDrag('right', e)}
            onHover={setHoveringEdge} />
        </>
      )}

      {useIntrinsicImage && (
        <div style={{ position: 'relative', width: '100%', zIndex: 0 }}>
          <img
            src={background.image}
            alt=""
            style={{
              width: '100%',
              height: 'auto',
              display: 'block',
              pointerEvents: 'none',
            }}
          />
          {background.imageOverlayColor && (
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundColor: background.imageOverlayColor,
              opacity: background.imageOverlayOpacity ?? 0.3,
              pointerEvents: 'none',
              zIndex: 1,
            }} />
          )}
          <div ref={innerRef} style={intrinsicInnerStyle}>
            {innerContent}
          </div>
        </div>
      )}

      {useFillImage && (
        <img
          src={background.image}
          alt=""
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: fillObjectFit,
            objectPosition: background.imagePosition || 'center',
            pointerEvents: 'none',
            display: 'block',
            backgroundColor: 'inherit',
            zIndex: 0,
          }}
        />
      )}

      {useFillImage && background.imageOverlayColor && (
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundColor: background.imageOverlayColor,
          opacity: background.imageOverlayOpacity ?? 0.3,
          pointerEvents: 'none',
          zIndex: 1,
        }} />
      )}

      {!useIntrinsicImage && (
        <div ref={innerRef} style={innerStyle}>
          {innerContent}
        </div>
      )}

      {/* Bottom resize handle — hidden until hover */}
      {isSelected && (
        <HeightHandle resizing={resizingHeight} onMouseDown={startHeightResize} />
      )}
    </div>
  );
}

function DragStrip({ edge, pt, pb, pl, pr, strip, dragging, hovering, onMouseDown, onHover }) {
  const isV = edge === 'top' || edge === 'bottom';
  const isH = edge === 'left' || edge === 'right';
  const isActive = dragging === edge || (isH && (dragging === 'left' || dragging === 'right'));
  const isHovered = hovering === edge || (isH && (hovering === 'left' || hovering === 'right'));
  const visible = isActive || isHovered;

  const style = { position: 'absolute', zIndex: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' };

  if (edge === 'top') Object.assign(style, { top: Math.max(0, pt - strip/2), left: pl, right: pr, height: strip, cursor: 'ns-resize' });
  if (edge === 'bottom') Object.assign(style, { bottom: Math.max(0, pb - strip/2), left: pl, right: pr, height: strip, cursor: 'ns-resize' });
  if (edge === 'left') Object.assign(style, { left: Math.max(0, pl - strip/2), top: pt, bottom: pb, width: strip, cursor: 'ew-resize' });
  if (edge === 'right') Object.assign(style, { right: Math.max(0, pr - strip/2), top: pt, bottom: pb, width: strip, cursor: 'ew-resize' });

  return (
    <div
      style={style}
      onMouseDown={onMouseDown}
      onMouseEnter={() => onHover(edge)}
      onMouseLeave={() => { if (!dragging) onHover(null); }}
    >
      <div className="pad-handle" style={{
        width: isV ? 36 : 3,
        height: isV ? 3 : 36,
        borderRadius: 2,
        background: isActive ? 'rgba(4,209,252,0.65)' : 'rgba(4,209,252,0.3)',
        opacity: visible ? 1 : 0,
        pointerEvents: 'none',
      }} />
    </div>
  );
}

function PadZone({ edge, size, active }) {
  const posMap = {
    top:    { top: 0, left: 0, right: 0, height: size },
    bottom: { bottom: 0, left: 0, right: 0, height: size },
    left:   { top: 0, bottom: 0, left: 0, width: size },
    right:  { top: 0, bottom: 0, right: 0, width: size },
  };
  return (
    <div style={{
      position: 'absolute',
      ...posMap[edge],
      background: 'rgba(4, 209, 252, 0.12)',
      opacity: active ? 1 : 0,
      transition: active ? 'none' : 'opacity 250ms cubic-bezier(0.22, 1, 0.36, 1)',
      pointerEvents: 'none',
      zIndex: 3,
    }} />
  );
}

function HeightHandle({ resizing, onMouseDown }) {
  const [hovered, setHovered] = React.useState(false);
  const visible = resizing || hovered;
  return (
    <div
      onMouseDown={onMouseDown}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'absolute',
        bottom: -4, left: 0, right: 0,
        height: 8,
        cursor: 'ns-resize',
        zIndex: 25,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}
    >
      <div className="pad-handle" style={{
        width: 48, height: 4, borderRadius: 2,
        background: resizing ? '#04D1FC' : 'rgba(0,0,0,0.15)',
        opacity: visible ? 1 : 0,
      }} />
    </div>
  );
}

export default SectionContainer;
