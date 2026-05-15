import React, { useEffect, useMemo, useRef, useState, forwardRef } from 'react';

/**
 * AnimatedTextBlock — single-line kinetic text widget.
 *
 * Variants:
 *   - variable-scale  : per-character size pulse
 *   - kinetic-stack   : translate / rotate / opacity wave
 *   - mirror-fold     : characters mirrored from a vertical axis
 *   - glitch-rgb      : RGB channel split + horizontal slice glitch
 *   - neon-pulse      : glowing pulse with color shift
 *   - wave-flow       : smooth vertical sine translation
 *   - typewriter      : cycle reveal one character at a time
 *   - shadow-stack    : multi-layer offset shadows (3D)
 */
export const ANIMATED_TEXT_VARIANTS = [
  { id: 'variable-scale', label: 'Variable Scale',  desc: 'Per-character size pulse' },
  { id: 'kinetic-stack',  label: 'Kinetic Stack',   desc: 'Rotation + weight wave' },
  { id: 'mirror-fold',    label: 'Mirror Fold',     desc: 'Mirrored across center' },
  { id: 'glitch-rgb',     label: 'Glitch RGB',      desc: 'RGB split + slice glitch' },
  { id: 'neon-pulse',     label: 'Neon Pulse',      desc: 'Glowing color pulse' },
  { id: 'wave-flow',      label: 'Wave Flow',       desc: 'Smooth vertical wave' },
  { id: 'typewriter',     label: 'Typewriter',      desc: 'Character reveal' },
  { id: 'shadow-stack',   label: 'Shadow Stack',    desc: '3D layered shadows' },
];

const INTENSITY_MAP = { subtle: 0.35, medium: 0.65, dramatic: 1.0 };

function applyTransform(txt, mode) {
  if (!txt) return '';
  if (mode === 'uppercase') return txt.toUpperCase();
  if (mode === 'lowercase') return txt.toLowerCase();
  if (mode === 'capitalize') return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  return txt;
}

const AnimatedTextBlock = forwardRef(function AnimatedTextBlock({
  text = 'TRANSFORM',
  variant = 'variable-scale',
  waveSpeed = 3,
  waveIntensity = 'medium',
  pauseOnHover = true,
  backgroundColor = '#0A0A0A',
  textColor = '#FF2D2D',
  textColor2 = '#FFFFFF',
  fontFamily = 'Impact',
  fontSize = 96,
  fontWeight = '900',
  letterSpacing = '-0.02em',
  textTransform = 'uppercase',
  lineHeightRatio = 0.95,
  textAlign = 'center',
  paddingY = 48,
  paddingX = 24,
}, ref) {
  const [tick, setTick] = useState(0);
  const [hovered, setHovered] = useState(false);
  const intensity = INTENSITY_MAP[waveIntensity] || 0.65;
  const isPaused = pauseOnHover && hovered;
  const rafRef = useRef(null);
  const uniqueId = useMemo(() => 'atb_' + Math.random().toString(36).slice(2, 10), []);

  useEffect(() => {
    if (!fontFamily) return;
    const SYSTEM = ['Impact', 'Arial', 'Georgia', 'Courier New', 'Times New Roman'];
    if (SYSTEM.includes(fontFamily)) return;
    const linkId = 'gf_' + fontFamily.replace(/\s/g, '_');
    if (document.getElementById(linkId)) return;
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = `https://fonts.googleapis.com/css2?family=${fontFamily.replace(/\s/g, '+')}:wght@400;500;600;700;800;900&display=swap`;
    document.head.appendChild(link);
  }, [fontFamily]);

  useEffect(() => {
    const start = performance.now();
    const loop = (now) => {
      if (!isPaused) setTick(now - start);
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  }, [isPaused]);

  const displayText = applyTransform(text, textTransform);
  const chars = displayText.split('');
  const time = tick / 1000;
  const safeWave = Math.max(0.1, parseFloat(waveSpeed) || 3);
  const omega = (2 * Math.PI) / safeWave;

  const baseCharStyle = {
    fontFamily: `'${fontFamily}', Impact, sans-serif`,
    fontWeight,
    letterSpacing,
    lineHeight: lineHeightRatio,
    color: textColor,
    display: 'inline-block',
    verticalAlign: 'baseline',
  };

  const renderVariableScale = () => chars.map((char, ci) => {
    const phase = (ci / Math.max(chars.length, 1)) * Math.PI * 2;
    const wave = Math.sin(time * omega + phase);
    const minS = 1 - intensity * 0.5;
    const maxS = 1 + intensity * 0.7;
    const scale = minS + (wave + 1) * 0.5 * (maxS - minS);
    return (
      <span key={ci} style={{ ...baseCharStyle, fontSize: (fontSize * scale) + 'px', willChange: 'font-size' }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    );
  });

  const renderKineticStack = () => chars.map((char, ci) => {
    const phase = (ci / Math.max(chars.length, 1)) * Math.PI * 2;
    const tt = time * omega;
    const yOff = Math.sin(tt * 0.7 + phase * 1.3) * intensity * 8;
    const rot = Math.sin(tt * 0.5 + phase * 0.8) * intensity * 4;
    const opWave = Math.sin(tt * 0.3 + phase);
    const op = 0.55 + (opWave + 1) * 0.225;
    const weightWave = Math.sin(tt + phase);
    const scaleX = 0.85 + (weightWave + 1) * 0.5 * 0.3;
    return (
      <span key={ci} style={{
        ...baseCharStyle,
        fontSize: fontSize + 'px',
        opacity: op,
        transform: `translateY(${yOff}px) rotate(${rot}deg) scaleX(${scaleX})`,
        willChange: 'transform, opacity',
      }}>
        {char === ' ' ? '\u00A0' : char}
      </span>
    );
  });

  const renderMirrorFold = () => {
    // Reflect text across a vertical axis: left half is original, right half mirrored.
    const half = Math.ceil(chars.length / 2);
    const leftChars = chars.slice(0, half);
    const t = (Math.sin(time * omega) + 1) * 0.5; // 0..1
    const overlap = -intensity * fontSize * 0.15 * t;
    return (
      <span style={{ display: 'inline-flex', alignItems: 'baseline' }}>
        <span style={{ display: 'inline-flex', letterSpacing }}>
          {leftChars.map((c, i) => (
            <span key={'l' + i} style={{ ...baseCharStyle, fontSize: fontSize + 'px' }}>
              {c === ' ' ? '\u00A0' : c}
            </span>
          ))}
        </span>
        <span style={{
          display: 'inline-flex',
          letterSpacing,
          transform: `scaleX(-1) translateX(${overlap}px)`,
          color: textColor2,
        }}>
          {leftChars.map((c, i) => (
            <span key={'r' + i} style={{ ...baseCharStyle, color: textColor2, fontSize: fontSize + 'px' }}>
              {c === ' ' ? '\u00A0' : c}
            </span>
          ))}
        </span>
      </span>
    );
  };

  const renderGlitchRGB = () => {
    const offR = Math.sin(time * omega * 1.7) * intensity * 6;
    const offB = Math.cos(time * omega * 1.3) * intensity * 6;
    const sliceTrigger = Math.sin(time * omega * 5) > 0.85;
    const sliceY = sliceTrigger ? Math.sin(time * 30) * intensity * 4 : 0;
    return (
      <span style={{ position: 'relative', display: 'inline-block' }}>
        <span style={{
          ...baseCharStyle,
          fontSize: fontSize + 'px',
          color: '#FF2D55',
          position: 'absolute',
          left: `${offR}px`,
          top: `${sliceY}px`,
          mixBlendMode: 'screen',
          opacity: 0.85,
        }}>{displayText}</span>
        <span style={{
          ...baseCharStyle,
          fontSize: fontSize + 'px',
          color: '#00E0FF',
          position: 'absolute',
          left: `${offB}px`,
          top: `${-sliceY}px`,
          mixBlendMode: 'screen',
          opacity: 0.85,
        }}>{displayText}</span>
        <span style={{
          ...baseCharStyle,
          fontSize: fontSize + 'px',
          color: textColor,
          position: 'relative',
          zIndex: 1,
        }}>{displayText}</span>
      </span>
    );
  };

  const renderNeonPulse = () => {
    const pulse = (Math.sin(time * omega) + 1) * 0.5;
    const blur = 6 + pulse * 24 * intensity;
    const spread = 2 + pulse * 6;
    return (
      <span style={{
        ...baseCharStyle,
        fontSize: fontSize + 'px',
        color: textColor,
        textShadow: `
          0 0 ${blur * 0.4}px ${textColor},
          0 0 ${blur}px ${textColor},
          0 0 ${blur * 1.6}px ${textColor2 || textColor},
          0 0 ${blur * 2.4}px ${textColor2 || textColor}
        `,
        filter: `brightness(${1 + pulse * 0.3 * intensity})`,
        transform: `scale(${1 + pulse * 0.04 * intensity})`,
        transition: 'transform 80ms linear',
      }}>{displayText}</span>
    );
  };

  const renderWaveFlow = () => chars.map((char, ci) => {
    const phase = (ci / Math.max(chars.length, 1)) * Math.PI * 2;
    const yOff = Math.sin(time * omega + phase) * intensity * fontSize * 0.18;
    return (
      <span key={ci} style={{
        ...baseCharStyle,
        fontSize: fontSize + 'px',
        transform: `translateY(${yOff}px)`,
        willChange: 'transform',
      }}>{char === ' ' ? '\u00A0' : char}</span>
    );
  });

  const renderTypewriter = () => {
    const cycleLen = chars.length + 6;
    const idx = Math.floor((time / safeWave) * cycleLen) % cycleLen;
    return chars.map((char, ci) => {
      const visible = ci < idx;
      return (
        <span key={ci} style={{
          ...baseCharStyle,
          fontSize: fontSize + 'px',
          opacity: visible ? 1 : 0.08,
          transform: visible ? 'translateY(0)' : 'translateY(6px)',
          transition: 'opacity 120ms ease, transform 120ms ease',
        }}>{char === ' ' ? '\u00A0' : char}</span>
      );
    });
  };

  const renderShadowStack = () => {
    const layers = 6;
    const angle = Math.sin(time * omega * 0.6) * intensity * 30 + 30;
    const rad = (angle * Math.PI) / 180;
    const dx = Math.cos(rad) * 4;
    const dy = Math.sin(rad) * 4;
    const shadow = Array.from({ length: layers }, (_, i) => {
      const k = i + 1;
      const fade = 1 - i / layers;
      return `${dx * k}px ${dy * k}px 0 ${textColor2 || textColor}${Math.round(fade * 200).toString(16).padStart(2, '0')}`;
    }).join(',');
    return (
      <span style={{
        ...baseCharStyle,
        fontSize: fontSize + 'px',
        color: textColor,
        textShadow: shadow,
      }}>{displayText}</span>
    );
  };

  const renderByVariant = () => {
    switch (variant) {
      case 'kinetic-stack':  return renderKineticStack();
      case 'mirror-fold':    return renderMirrorFold();
      case 'glitch-rgb':     return renderGlitchRGB();
      case 'neon-pulse':     return renderNeonPulse();
      case 'wave-flow':      return renderWaveFlow();
      case 'typewriter':     return renderTypewriter();
      case 'shadow-stack':   return renderShadowStack();
      case 'variable-scale':
      default:               return renderVariableScale();
    }
  };

  const justify = textAlign === 'left' ? 'flex-start'
    : textAlign === 'right' ? 'flex-end' : 'center';

  return (
    <div
      ref={ref}
      data-animated-text-id={uniqueId}
      onMouseEnter={() => pauseOnHover && setHovered(true)}
      onMouseLeave={() => pauseOnHover && setHovered(false)}
      style={{
        backgroundColor,
        padding: `${paddingY}px ${paddingX}px`,
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: justify,
        width: '100%',
        position: 'relative',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: justify,
          whiteSpace: 'nowrap',
          maxWidth: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {renderByVariant()}
      </div>
    </div>
  );
});

export default AnimatedTextBlock;
