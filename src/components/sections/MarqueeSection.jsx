import React, { useState, useEffect, useMemo, useRef, forwardRef } from 'react';

/**
 * Normalize items to an array of { type: 'text'|'image', value/src }.
 * Supports legacy comma-separated string format.
 */
function normalizeItems(items) {
  if (Array.isArray(items)) return items;
  if (typeof items === 'string') {
    return items
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)
      .map(value => ({ type: 'text', value }));
  }
  return [{ type: 'text', value: 'New Announcement' }];
}

export const KINETIC_PRESETS = [
  'marquee-horizontal',
  'marquee-diagonal',
  'variable-scale',
  'kinetic-stack',
  'dual-word',
  'tag-marquee',
];

export const KINETIC_PRESET_LABELS = {
  'marquee-horizontal': 'Marquee Horizontal',
  'marquee-diagonal':   'Marquee Diagonal',
  'variable-scale':     'Variable Scale',
  'kinetic-stack':      'Kinetic Stack',
  'dual-word':          'Dual Word',
  'tag-marquee':        'Tag Marquee',
};

// ════════════════════════════════════════════
// Kinetic Marquee – 6 presets
// Ported from Component Playground TextMarqueeKinetic
// ════════════════════════════════════════════
const KineticMarquee = forwardRef(function KineticMarquee({
  text1 = 'TRANSFORM',
  text2 = 'EVOLVE',
  text3 = 'CREATE',
  extraWords = 'design, motion, kinetic, type, visual, creative, bold, modern, code, art, digital, studio',
  preset = 'variable-scale',
  scrollDirection = 'left',
  scrollSpeed = 12,
  waveSpeed = 3,
  waveIntensity = 'medium',
  pauseOnHover = true,
  rowCount = 8,
  rowGap = 0,
  diagonalAngle = -25,
  verticalAlign = 'fill',
  backgroundColor = '#0A0A0A',
  textColor1 = '#FF2D2D',
  textColor2 = '#FF2D2D',
  tagColors = ['#FF3366', '#7B61FF', '#00C2FF', '#FFB800', '#00E676'],
  tagStyle = 'mixed',
  fontFamily = 'Impact',
  fontSize = 80,
  fontWeight = '900',
  letterSpacing = '-0.02em',
  textTransform = 'uppercase',
  lineHeightRatio = 0.95,
  tagFontFamily = 'DM Sans',
  tagFontSize = 18,
  height = 400,
}, ref) {
  const [hovered, setHovered] = useState(false);
  const [tick, setTick] = useState(0);
  const [activeWord, setActiveWord] = useState(0);

  const uniqueId = useMemo(() => 'kmq_' + Math.random().toString(36).slice(2, 11), []);
  const intensityMap = { subtle: 0.35, medium: 0.65, dramatic: 1.0 };
  const intensity = intensityMap[waveIntensity] || 0.65;
  const isPaused = pauseOnHover && hovered;

  const applyTransform = (txt) => {
    if (textTransform === 'uppercase') return (txt || '').toUpperCase();
    if (textTransform === 'lowercase') return (txt || '').toLowerCase();
    if (textTransform === 'capitalize' && txt) return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
    return txt || '';
  };

  const t1 = applyTransform(text1);
  const t2 = applyTransform(text2);
  const t3 = applyTransform(text3);

  const seededRandom = (i, seed) => {
    const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
    return x - Math.floor(x);
  };

  const justifyMap = {
    fill: 'space-between',
    center: 'center',
    top: 'flex-start',
    bottom: 'flex-end',
  };

  useEffect(() => {
    const existing = document.getElementById(uniqueId + '_style');
    if (existing) existing.remove();
    const style = document.createElement('style');
    style.id = uniqueId + '_style';
    style.textContent = `
      @keyframes ${uniqueId}_scrollL {
        from { transform: translateX(0); }
        to { transform: translateX(-50%); }
      }
      @keyframes ${uniqueId}_scrollR {
        from { transform: translateX(-50%); }
        to { transform: translateX(0); }
      }
    `;
    document.head.appendChild(style);
    return () => {
      const s = document.getElementById(uniqueId + '_style');
      if (s) s.remove();
    };
  }, [uniqueId]);

  useEffect(() => {
    if (preset !== 'variable-scale' && preset !== 'kinetic-stack') return;
    let raf;
    const start = performance.now();
    const loop = (now) => {
      if (!isPaused) setTick(now - start);
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [preset, isPaused]);

  useEffect(() => {
    if (preset !== 'dual-word' || isPaused) return;
    const interval = setInterval(() => {
      setActiveWord(prev => (prev + 1) % 2);
    }, scrollSpeed * 500);
    return () => clearInterval(interval);
  }, [preset, isPaused, scrollSpeed]);

  useEffect(() => {
    const families = [fontFamily, tagFontFamily].filter(f =>
      !['Impact', 'Arial', 'Georgia', 'Courier New', 'Times New Roman'].includes(f)
    );
    families.forEach(fam => {
      const linkId = 'gf_' + fam.replace(/\s/g, '_');
      if (!document.getElementById(linkId)) {
        const link = document.createElement('link');
        link.id = linkId;
        link.rel = 'stylesheet';
        link.href = `https://fonts.googleapis.com/css2?family=${fam.replace(/\s/g, '+')}:wght@400;500;600;700;800;900&display=swap`;
        document.head.appendChild(link);
      }
    });
  }, [fontFamily, tagFontFamily]);

  const getScrollAnim = (rowIndex) => {
    let dir = scrollDirection;
    if (dir === 'alternate') dir = rowIndex % 2 === 0 ? 'left' : 'right';
    const speed = scrollSpeed + (rowIndex * 0.8);
    const animName = dir === 'left' ? `${uniqueId}_scrollL` : `${uniqueId}_scrollR`;
    return `${animName} ${speed}s linear infinite`;
  };

  const baseTextStyle = {
    fontFamily: `'${fontFamily}', Impact, sans-serif`,
    fontWeight,
    letterSpacing,
    lineHeight: lineHeightRatio,
  };

  const renderMarqueeHorizontal = () => {
    const sep = '\u00A0\u00A0\u2022\u00A0\u00A0';
    const chunk = (t1 + sep).repeat(20);
    return Array.from({ length: rowCount }, (_, i) => (
      <div key={i} style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          animation: getScrollAnim(i),
          animationPlayState: isPaused ? 'paused' : 'running',
          ...baseTextStyle,
          fontSize: fontSize + 'px',
          color: i % 2 === 0 ? textColor1 : textColor2,
          willChange: 'transform',
        }}>{chunk + chunk}</div>
      </div>
    ));
  };

  const renderMarqueeDiagonal = () => {
    const sep = '\u00A0\u00A0';
    const chunk = (t1 + sep).repeat(30);
    const extraRows = rowCount + 6;
    const opacityLevels = [1, 0.55, 0.25];
    const rows = Array.from({ length: extraRows }, (_, i) => (
      <div key={i} style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
        <div style={{
          display: 'inline-block',
          whiteSpace: 'nowrap',
          animation: getScrollAnim(i),
          animationPlayState: isPaused ? 'paused' : 'running',
          ...baseTextStyle,
          fontSize: fontSize + 'px',
          color: i % 2 === 0 ? textColor1 : textColor2,
          opacity: opacityLevels[i % 3],
          willChange: 'transform',
        }}>{chunk + chunk}</div>
      </div>
    ));
    return [(
      <div key="diagonal-wrap" style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        gap: rowGap + 'px',
        width: '250%',
        height: '250%',
        overflow: 'hidden',
        transform: `rotate(${diagonalAngle}deg)`,
        transformOrigin: 'center center',
        position: 'absolute',
        top: '-75%',
        left: '-75%',
      }}>{rows}</div>
    )];
  };

  const renderVariableScale = () => {
    const chars = t1.split('');
    const time = tick / 1000;
    return Array.from({ length: rowCount }, (_, rowIdx) => {
      const charEls = chars.map((char, ci) => {
        const phase = (ci / Math.max(chars.length, 1)) * Math.PI * 2;
        const rowPhase = (rowIdx / Math.max(rowCount, 1)) * Math.PI * 2;
        const wave = Math.sin(time * (2 * Math.PI / waveSpeed) + phase + rowPhase);
        const minS = 1 - intensity * 0.5;
        const maxS = 1 + intensity * 0.7;
        const scale = minS + (wave + 1) * 0.5 * (maxS - minS);
        return (
          <span key={ci} style={{
            display: 'inline-block',
            fontSize: (fontSize * scale) + 'px',
            ...baseTextStyle,
            color: rowIdx % 2 === 0 ? textColor1 : textColor2,
            lineHeight: 0.85,
            verticalAlign: 'baseline',
            willChange: 'font-size',
          }}>{char === ' ' ? '\u00A0' : char}</span>
        );
      });
      return (
        <div key={rowIdx} style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}>{charEls}</div>
      );
    });
  };

  const renderKineticStack = () => {
    const chars = t1.split('');
    const time = tick / 1000;
    return Array.from({ length: rowCount }, (_, rowIdx) => {
      const charEls = chars.map((char, ci) => {
        const phase = (ci / Math.max(chars.length, 1)) * Math.PI * 2;
        const rowPhase = (rowIdx / Math.max(rowCount, 1)) * Math.PI * 1.5;
        const tt = time * (2 * Math.PI / waveSpeed);
        const yOff = Math.sin(tt * 0.7 + phase * 1.3 + rowPhase) * intensity * 8;
        const rot = Math.sin(tt * 0.5 + phase * 0.8 + rowPhase * 1.2) * intensity * 4;
        const opWave = Math.sin(tt * 0.3 + phase + rowPhase * 0.5);
        const op = 0.55 + (opWave + 1) * 0.225;
        const weightWave = Math.sin(tt + phase + rowPhase);
        const scaleX = 0.85 + (weightWave + 1) * 0.5 * 0.3;
        return (
          <span key={ci} style={{
            display: 'inline-block',
            fontSize: fontSize + 'px',
            ...baseTextStyle,
            color: rowIdx % 2 === 0 ? textColor1 : textColor2,
            opacity: op,
            transform: `translateY(${yOff}px) rotate(${rot}deg) scaleX(${scaleX})`,
            lineHeight: 0.85,
            verticalAlign: 'baseline',
            willChange: 'transform, opacity',
          }}>{char === ' ' ? '\u00A0' : char}</span>
        );
      });
      return (
        <div key={rowIdx} style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'center',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
        }}>{charEls}</div>
      );
    });
  };

  const renderDualWord = () => {
    const words = [t1, t2];
    const colors = [textColor1, textColor2];
    return Array.from({ length: rowCount }, (_, rowIdx) => {
      const wordIdx = (rowIdx + activeWord) % 2;
      const word = words[wordIdx];
      const color = colors[wordIdx];
      const sizeScale = 1 + (seededRandom(rowIdx, 42) - 0.5) * intensity * 0.4;
      return (
        <div key={rowIdx} style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: rowIdx % 2 === 0 ? 'flex-start' : 'flex-end',
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
          padding: '0 8px',
        }}>
          <span style={{
            display: 'inline-block',
            fontSize: (fontSize * sizeScale) + 'px',
            ...baseTextStyle,
            color,
            transition: 'color 0.5s ease, font-size 0.4s ease',
          }}>{word}</span>
        </div>
      );
    });
  };

  const renderTagMarquee = () => {
    const parsedExtras = Array.isArray(extraWords)
      ? extraWords
      : String(extraWords || '')
          .split(/[,\n]/)
          .map((w) => w.trim())
          .filter(Boolean);
    const allWords = [t1, t2, t3, ...parsedExtras].filter(Boolean);
    const icons = ['\u2605', '\u2665', '\u25B6', '\u2192', '\u26A1', '#', '\u2756'];

    return Array.from({ length: rowCount }, (_, ri) => {
      const items = [];
      for (let i = 0; i < 16; i++) {
        const seed = ri * 100 + i;
        const isIcon = seededRandom(seed, 7) < 0.15;
        const cIdx = Math.floor(seededRandom(seed, 13) * tagColors.length);
        const color = tagColors[cIdx] || '#FF3366';
        const variant = tagStyle === 'mixed'
          ? (seededRandom(seed, 19) < 0.5 ? 'filled' : 'outlined')
          : tagStyle;

        if (isIcon) {
          items.push(
            <span key={`${ri}-${i}`} style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: (tagFontSize * 2.2) + 'px',
              height: (tagFontSize * 2.2) + 'px',
              borderRadius: '50%',
              backgroundColor: variant === 'filled' ? color : 'transparent',
              border: variant === 'outlined' ? `1.5px solid ${color}` : 'none',
              color: variant === 'filled' ? backgroundColor : color,
              fontSize: tagFontSize + 'px',
              flexShrink: 0,
            }}>{icons[Math.floor(seededRandom(seed, 31) * icons.length)]}</span>
          );
        } else {
          const word = allWords[Math.floor(seededRandom(seed, 23) * allWords.length)] || 'tag';
          items.push(
            <span key={`${ri}-${i}`} style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: `${tagFontSize * 0.4}px ${tagFontSize * 0.9}px`,
              borderRadius: (tagFontSize * 1.5) + 'px',
              backgroundColor: variant === 'filled' ? color : 'transparent',
              border: variant === 'outlined' ? `1.5px solid ${color}` : 'none',
              color: variant === 'filled' ? backgroundColor : color,
              fontFamily: `'${tagFontFamily}', sans-serif`,
              fontSize: tagFontSize + 'px',
              fontWeight: '600',
              whiteSpace: 'nowrap',
              flexShrink: 0,
            }}>{word}</span>
          );
        }
      }

      const dir = ri % 2 === 0 ? 'left' : 'right';
      const speed = scrollSpeed + (seededRandom(ri, 37) * 6);
      const animName = dir === 'left' ? `${uniqueId}_scrollL` : `${uniqueId}_scrollR`;

      const itemsA = items.map((node, idx) => React.cloneElement(node, { key: `a-${idx}` }));
      const itemsB = items.map((node, idx) => React.cloneElement(node, { key: `b-${idx}` }));

      return (
        <div key={ri} style={{ overflow: 'hidden', whiteSpace: 'nowrap' }}>
          <div style={{
            display: 'inline-flex',
            gap: '10px',
            animation: `${animName} ${speed}s linear infinite`,
            animationPlayState: isPaused ? 'paused' : 'running',
            willChange: 'transform',
            padding: '4px 0',
          }}>{[...itemsA, ...itemsB]}</div>
        </div>
      );
    });
  };

  const renderers = {
    'marquee-horizontal': renderMarqueeHorizontal,
    'marquee-diagonal':   renderMarqueeDiagonal,
    'variable-scale':     renderVariableScale,
    'kinetic-stack':      renderKineticStack,
    'dual-word':          renderDualWord,
    'tag-marquee':        renderTagMarquee,
  };

  const contentRows = (renderers[preset] || renderVariableScale)();
  const isDiagonal = preset === 'marquee-diagonal';

  return (
    <div
      ref={ref}
      className="text-marquee-kinetic"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        width: '100%',
        height: typeof height === 'number' ? `${height}px` : height,
        backgroundColor,
        overflow: 'hidden',
        cursor: 'default',
        userSelect: 'none',
      }}
    >
      {isDiagonal ? (
        contentRows
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: justifyMap[verticalAlign] || 'space-between',
          gap: rowGap + 'px',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          padding: preset === 'tag-marquee' ? '12px 0' : '0',
        }}>{contentRows}</div>
      )}
    </div>
  );
});

// ════════════════════════════════════════════
// Classic marquee (legacy, items-based ticker)
// ════════════════════════════════════════════
const ClassicMarquee = forwardRef(function ClassicMarquee({
  items = [],
  speed = 30,
  direction = 'left',
  backgroundColor = '#04D1FC',
  textColor = '#FFFFFF',
  fontSize = 16,
  fontWeight = '500',
  letterSpacing = '0.02em',
  paddingVertical = 12,
  separator = '\u2022',
  imageSize = 24,
  pauseOnHover = true,
  rows = 1,
  rowGap = 0,
  alternateDirections = false,
}, ref) {
  const [isPaused, setIsPaused] = useState(false);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    const handler = (e) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const itemsArray = normalizeItems(items);
  const duplicatedItems = [...itemsArray, ...itemsArray];

  const keyframes = `
    @keyframes marqueeScrollLeft {
      from { transform: translateX(0); }
      to { transform: translateX(-50%); }
    }
    @keyframes marqueeScrollRight {
      from { transform: translateX(-50%); }
      to { transform: translateX(0); }
    }
  `;

  const rowsCount = Math.max(1, parseInt(rows) || 1);
  const rowGapPx = Math.max(0, parseInt(rowGap) || 0);

  const containerStyle = {
    backgroundColor,
    padding: `${paddingVertical}px 0`,
    overflow: 'hidden',
    position: 'relative',
    display: rowsCount > 1 ? 'flex' : undefined,
    flexDirection: rowsCount > 1 ? 'column' : undefined,
    rowGap: rowsCount > 1 ? `${rowGapPx}px` : undefined,
  };

  const makeTrackStyle = (rowIndex) => {
    const dir =
      alternateDirections && rowIndex % 2 === 1
        ? direction === 'left' ? 'right' : 'left'
        : direction;
    return {
      display: 'flex',
      alignItems: 'center',
      whiteSpace: 'nowrap',
      animation: prefersReducedMotion
        ? 'none'
        : `marqueeScroll${dir === 'left' ? 'Left' : 'Right'} ${speed}s linear infinite`,
      animationPlayState: (pauseOnHover && isPaused) ? 'paused' : 'running',
      willChange: 'transform',
    };
  };

  const textItemStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '8px',
    padding: '0 12px',
    fontSize: `${fontSize}px`,
    fontWeight,
    letterSpacing,
    color: textColor,
    fontFamily: "'Poppins', 'Helvetica Neue', Arial, sans-serif",
  };

  const imgItemStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0 12px',
    flexShrink: 0,
  };

  const separatorStyle = {
    opacity: 0.5,
    fontSize: `${fontSize}px`,
    color: textColor,
    display: 'inline-flex',
    alignItems: 'center',
    padding: '0 4px',
  };

  const renderItem = (item) => {
    if (item.type === 'image' && item.src) {
      return (
        <span style={imgItemStyle}>
          <img
            src={item.src}
            alt=""
            style={{
              width: `${imageSize}px`,
              height: `${imageSize}px`,
              objectFit: 'contain',
              flexShrink: 0,
            }}
            draggable={false}
          />
        </span>
      );
    }
    return <span style={textItemStyle}>{item.value || ''}</span>;
  };

  const renderRow = (rowIndex) => (
    <div key={rowIndex} style={makeTrackStyle(rowIndex)}>
      {duplicatedItems.map((item, index) => (
        <React.Fragment key={`${item.type}-${rowIndex}-${index}`}>
          {renderItem(item)}
          {index < duplicatedItems.length - 1 && (
            <span style={separatorStyle}>{separator}</span>
          )}
        </React.Fragment>
      ))}
    </div>
  );

  return (
    <div
      ref={ref}
      style={containerStyle}
      onMouseEnter={() => pauseOnHover && setIsPaused(true)}
      onMouseLeave={() => pauseOnHover && setIsPaused(false)}
      className="marquee-section"
    >
      <style>{keyframes}</style>
      {Array.from({ length: rowsCount }, (_, i) => renderRow(i))}
    </div>
  );
});

// ════════════════════════════════════════════
// Public MarqueeSection – dispatches based on `preset`
// ════════════════════════════════════════════
const MarqueeSection = forwardRef(function MarqueeSection(props, ref) {
  const { preset = 'classic', ...rest } = props;

  if (KINETIC_PRESETS.includes(preset)) {
    const tagColors = [
      rest.tagColor1 ?? '#FF3366',
      rest.tagColor2 ?? '#7B61FF',
      rest.tagColor3 ?? '#00C2FF',
      rest.tagColor4 ?? '#FFB800',
      rest.tagColor5 ?? '#00E676',
    ];
    return (
      <KineticMarquee
        ref={ref}
        preset={preset}
        text1={rest.text1}
        text2={rest.text2}
        text3={rest.text3}
        extraWords={rest.extraWords}
        scrollDirection={rest.scrollDirection || rest.direction || 'left'}
        scrollSpeed={parseFloat(rest.scrollSpeed ?? rest.speed ?? 12)}
        waveSpeed={parseFloat(rest.waveSpeed ?? 3)}
        waveIntensity={rest.waveIntensity}
        pauseOnHover={rest.pauseOnHover}
        rowCount={parseInt(rest.rowCount ?? 8)}
        rowGap={parseInt(rest.rowGap ?? 0)}
        diagonalAngle={parseFloat(rest.diagonalAngle ?? -25)}
        verticalAlign={rest.verticalAlign}
        backgroundColor={rest.backgroundColor}
        textColor1={rest.textColor1 || rest.textColor}
        textColor2={rest.textColor2 || rest.textColor1 || rest.textColor}
        tagColors={tagColors}
        tagStyle={rest.tagStyle}
        fontFamily={rest.fontFamily}
        fontSize={parseInt(rest.fontSize ?? 80)}
        fontWeight={rest.fontWeight}
        letterSpacing={rest.letterSpacing}
        textTransform={rest.textTransform}
        lineHeightRatio={parseFloat(rest.lineHeightRatio ?? 0.95)}
        tagFontFamily={rest.tagFontFamily}
        tagFontSize={parseInt(rest.tagFontSize ?? 18)}
        height={rest.height ?? 400}
      />
    );
  }

  return <ClassicMarquee ref={ref} {...rest} />;
});

export { normalizeItems };
export default MarqueeSection;
