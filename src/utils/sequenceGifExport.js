/**
 * GIF Export — client renders frames, server encodes the GIF.
 *
 * Frames are generated on canvas in the browser (fast, uses native fonts)
 * then sent to /api/gif/encode where sharp + gif-encoder-2 produce a
 * reliable animated GIF — no gifshot, no web workers, no CDN scripts.
 */

const SERVER_ENCODE_TIMEOUT = 60000;

function loadImage(src, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let timedOut = false;

    const timer = setTimeout(() => {
      timedOut = true;
      reject(new Error('Image load timeout'));
    }, timeout);

    img.onload = () => {
      if (!timedOut) {
        clearTimeout(timer);
        resolve(img);
      }
    };

    img.onerror = () => {
      if (!timedOut) {
        clearTimeout(timer);
        if (img.crossOrigin) {
          const img2 = new Image();
          img2.onload = () => resolve(img2);
          img2.onerror = () => reject(new Error('Failed to load image'));
          img2.src = src;
        } else {
          reject(new Error('Failed to load image'));
        }
      }
    };

    if (!src.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.src = src;
  });
}

function drawImageCover(ctx, img, width, height, backgroundColor) {
  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  const imgW = img.naturalWidth || img.width;
  const imgH = img.naturalHeight || img.height;

  if (imgW <= 0 || imgH <= 0) return;

  const imgRatio = imgW / imgH;
  const canvasRatio = width / height;
  let dw, dh, dx, dy;

  if (imgRatio > canvasRatio) {
    dh = height;
    dw = height * imgRatio;
    dx = (width - dw) / 2;
    dy = 0;
  } else {
    dw = width;
    dh = width / imgRatio;
    dx = 0;
    dy = (height - dh) / 2;
  }

  try {
    ctx.drawImage(img, dx, dy, dw, dh);
  } catch (e) {
    console.warn('Error drawing image:', e);
  }
}

async function encodeGifOnServer(frames, width, height, delay) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), SERVER_ENCODE_TIMEOUT);

  try {
    const res = await fetch('/api/gif/encode', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ frames, width, height, delay }),
      signal: controller.signal,
    });

    clearTimeout(timer);

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `Server GIF encode failed (${res.status})`);
    }

    return new Blob([await res.arrayBuffer()], { type: 'image/gif' });
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

/**
 * Export an array of image URLs/dataURLs as an animated GIF.
 */
export async function exportSequenceAsGif(images, options = {}) {
  const {
    width = 700,
    height = 400,
    delay = 500,
    backgroundColor = '#FFFFFF',
    onProgress = null
  } = options;

  console.log('Starting GIF export with', images?.length, 'images');

  if (!images || images.length < 2) {
    throw new Error('Need at least 2 images to create a GIF');
  }

  const validImages = images.filter(src => src && typeof src === 'string' && src.length > 0);
  if (validImages.length < 2) {
    throw new Error('Need at least 2 valid images');
  }

  if (onProgress) onProgress(5);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const processedFrames = [];

  for (let i = 0; i < validImages.length; i++) {
    try {
      const img = await loadImage(validImages[i]);
      drawImageCover(ctx, img, width, height, backgroundColor);
      processedFrames.push(canvas.toDataURL('image/jpeg', 0.85));
    } catch (e) {
      console.warn(`Failed to process image ${i + 1}:`, e.message);
    }

    if (onProgress) {
      onProgress(5 + Math.round((i / validImages.length) * 55));
    }
  }

  if (processedFrames.length < 2) {
    throw new Error(`Only ${processedFrames.length} images could be processed.`);
  }

  if (onProgress) onProgress(65);
  console.log(`Sending ${processedFrames.length} frames to server for GIF encoding...`);

  const blob = await encodeGifOnServer(processedFrames, width, height, delay);

  console.log('GIF blob size:', blob.size, 'bytes');
  if (onProgress) onProgress(100);
  return blob;
}

/**
 * Normalize items: backward compat for legacy comma-separated strings.
 */
function normalizeItems(raw) {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === 'string') {
    return raw.split(',').map(s => s.trim()).filter(Boolean).map(v => ({ type: 'text', value: v }));
  }
  return [{ type: 'text', value: 'New Announcement' }];
}

/**
 * Export a marquee block as an animated GIF.
 * Supports mixed text + image layers.
 * Renders scrolling frames on canvas, then encodes server-side.
 */
export async function exportMarqueeAsGif(section, options = {}) {
  const {
    width = 700,
    onProgress = null
  } = options;

  const items = normalizeItems(section.items);
  const bgColor = section.backgroundColor || '#04D1FC';
  const textColor = section.textColor || '#FFFFFF';
  const fontSize = section.fontSize || 16;
  const fontWeight = section.fontWeight || '500';
  const paddingVertical = section.paddingVertical || 12;
  const separator = section.separator || '\u2022';
  const imgSize = section.imageSize || 24;
  const speed = section.speed || 30;
  const direction = section.direction || 'left';

  const lineHeight = Math.round(fontSize * 1.4);
  const height = paddingVertical * 2 + lineHeight;
  const separatorGap = 24;

  const fps = 10;
  const totalDuration = Math.min(speed, 4);
  const totalFrames = Math.round(fps * totalDuration);
  const frameDelay = Math.round(1000 / fps);

  if (onProgress) onProgress(5);

  // Preload all image layers
  const imageCache = {};
  for (const item of items) {
    if (item.type === 'image' && item.src) {
      try {
        imageCache[item.src] = await loadImage(item.src);
      } catch (e) {
        console.warn('Failed to load marquee image:', e.message);
      }
    }
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const font = `${fontWeight} ${fontSize}px 'Poppins', 'Helvetica Neue', Arial, sans-serif`;
  ctx.font = font;

  // Measure total strip width
  let stripWidth = 0;
  for (const item of items) {
    if (item.type === 'image') {
      stripWidth += 12 + imgSize + 12;
    } else {
      stripWidth += 12 + ctx.measureText(item.value || '').width + 12;
    }
    stripWidth += ctx.measureText(` ${separator} `).width;
  }
  stripWidth = Math.max(stripWidth, 1);

  const processedFrames = [];

  for (let i = 0; i < totalFrames; i++) {
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);

    const progress = i / totalFrames;
    const offset = direction === 'left'
      ? -(progress * stripWidth)
      : -(1 - progress) * stripWidth;

    ctx.font = font;
    ctx.textBaseline = 'middle';
    const y = height / 2;

    const copies = Math.ceil((width + stripWidth) / stripWidth) + 1;

    for (let c = 0; c < copies; c++) {
      let x = offset + c * stripWidth;

      for (let j = 0; j < items.length; j++) {
        const item = items[j];
        x += 12;

        if (item.type === 'image' && item.src && imageCache[item.src]) {
          ctx.drawImage(imageCache[item.src], x, y - imgSize / 2, imgSize, imgSize);
          x += imgSize;
        } else {
          ctx.fillStyle = textColor;
          ctx.fillText(item.value || '', x, y);
          x += ctx.measureText(item.value || '').width;
        }

        x += 12;

        if (j < items.length - 1 || c < copies - 1) {
          ctx.fillStyle = textColor;
          ctx.globalAlpha = 0.5;
          ctx.fillText(separator, x, y);
          ctx.globalAlpha = 1.0;
          x += ctx.measureText(` ${separator} `).width;
        }
      }
    }

    processedFrames.push(canvas.toDataURL('image/jpeg', 0.8));

    if (onProgress) {
      onProgress(5 + Math.round((i / totalFrames) * 55));
    }
  }

  if (onProgress) onProgress(65);
  console.log(`Sending ${processedFrames.length} marquee frames to server for GIF encoding...`);

  const blob = await encodeGifOnServer(processedFrames, width, height, frameDelay);

  console.log('Marquee GIF blob size:', blob.size, 'bytes');
  if (onProgress) onProgress(100);
  return { blob, height };
}

/* ------------------------------------------------------------------ *
 * Shared font helpers
 * ------------------------------------------------------------------ */

const SYSTEM_FONTS = new Set(['Impact', 'Arial', 'Georgia', 'Courier New', 'Times New Roman', 'sans-serif', 'serif', 'monospace']);

async function ensureFontLoaded(family, weight = '900', size = 96) {
  if (typeof document === 'undefined') return;
  if (!SYSTEM_FONTS.has(family)) {
    const linkId = 'gf_' + family.replace(/\s/g, '_');
    if (!document.getElementById(linkId)) {
      const link = document.createElement('link');
      link.id = linkId;
      link.rel = 'stylesheet';
      link.href = `https://fonts.googleapis.com/css2?family=${family.replace(/\s/g, '+')}:wght@400;500;600;700;800;900&display=swap`;
      document.head.appendChild(link);
    }
  }
  if (document.fonts?.load) {
    try { await document.fonts.load(`${weight} ${size}px "${family}"`); } catch {}
    try { await document.fonts.ready; } catch {}
  }
}

/* ------------------------------------------------------------------ *
 * Kinetic Marquee → GIF  (canvas-based, smooth)
 *
 * Mirrors the visual logic of <KineticMarquee /> for each preset.
 * Pure canvas rendering = pixel-perfect frame timing, no jitter.
 * ------------------------------------------------------------------ */

function seededRandom(i, seed) {
  const x = Math.sin(i * 127.1 + seed * 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function applyKineticTransform(txt, mode) {
  if (!txt) return '';
  if (mode === 'uppercase') return txt.toUpperCase();
  if (mode === 'lowercase') return txt.toLowerCase();
  if (mode === 'capitalize') return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  return txt;
}

export async function exportKineticMarqueeAsGif(block, options = {}) {
  const { width = 700, onProgress = null } = options;

  const preset = block.preset || 'marquee-horizontal';
  const text1 = applyKineticTransform(block.text1 || 'TRANSFORM', block.textTransform);
  const text2 = applyKineticTransform(block.text2 || 'EVOLVE', block.textTransform);
  const text3 = applyKineticTransform(block.text3 || 'CREATE', block.textTransform);
  const bgColor = block.backgroundColor || '#0A0A0A';
  const color1 = block.textColor1 || block.textColor || '#FF2D2D';
  const color2 = block.textColor2 || color1;
  const scrollSpeed = parseFloat(block.scrollSpeed ?? block.speed ?? 12);
  const scrollDir = block.scrollDirection || block.direction || 'left';
  const rowCount = parseInt(block.rowCount ?? 8);
  const rowGap = parseInt(block.rowGap ?? 0);
  const fontFamily = block.fontFamily || 'Impact';
  const fontSize = parseInt(block.fontSize ?? 80);
  const fontWeight = block.fontWeight || '900';
  const height = parseInt(block.height ?? 400);
  const tagFontFamily = block.tagFontFamily || 'DM Sans';
  const tagFontSize = parseInt(block.tagFontSize ?? 18);
  const tagColors = [
    block.tagColor1 ?? '#FF3366',
    block.tagColor2 ?? '#7B61FF',
    block.tagColor3 ?? '#00C2FF',
    block.tagColor4 ?? '#FFB800',
    block.tagColor5 ?? '#00E676',
  ];
  const tagStyle = block.tagStyle || 'mixed';
  const extraWords = Array.isArray(block.extraWords)
    ? block.extraWords
    : String(block.extraWords || '')
        .split(/[,\n]/)
        .map(w => w.trim())
        .filter(Boolean);

  await ensureFontLoaded(fontFamily, fontWeight, fontSize);
  if (preset === 'tag-marquee') await ensureFontLoaded(tagFontFamily, '600', tagFontSize);

  const fps = 12;
  const durationSec = Math.min(6, Math.max(2, scrollSpeed * 0.35));
  const totalFrames = Math.round(fps * durationSec);
  const frameDelay = Math.round(1000 / fps);

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  if (onProgress) onProgress(5);

  const processedFrames = [];

  const getRowDir = (ri) => {
    let d = scrollDir;
    if (d === 'alternate') d = ri % 2 === 0 ? 'left' : 'right';
    return d;
  };

  const getRowSpeed = (ri) => scrollSpeed + ri * 0.8;

  if (preset === 'tag-marquee') {
    const allWords = [text1, text2, text3, ...extraWords].filter(Boolean);
    const icons = ['\u2605', '\u2665', '\u25B6', '\u2192', '\u26A1', '#', '\u2756'];
    const itemGap = 10;
    const pillPadH = tagFontSize * 0.9;
    const pillPadV = tagFontSize * 0.4;
    const pillRadius = tagFontSize * 1.5;
    const iconDiam = tagFontSize * 2.2;

    const tagFont = `600 ${tagFontSize}px '${tagFontFamily}', sans-serif`;
    const iconFont = `${tagFontSize}px sans-serif`;

    const buildRowItems = (ri) => {
      const items = [];
      ctx.font = tagFont;
      for (let i = 0; i < 16; i++) {
        const seed = ri * 100 + i;
        const isIcon = seededRandom(seed, 7) < 0.15;
        const cIdx = Math.floor(seededRandom(seed, 13) * tagColors.length);
        const color = tagColors[cIdx] || '#FF3366';
        const variant = tagStyle === 'mixed'
          ? (seededRandom(seed, 19) < 0.5 ? 'filled' : 'outlined')
          : tagStyle;

        if (isIcon) {
          const ic = icons[Math.floor(seededRandom(seed, 31) * icons.length)];
          items.push({ type: 'icon', char: ic, color, variant, w: iconDiam });
        } else {
          const word = allWords[Math.floor(seededRandom(seed, 23) * allWords.length)] || 'tag';
          const tw = ctx.measureText(word).width;
          items.push({ type: 'pill', word, color, variant, w: tw + pillPadH * 2 });
        }
      }
      return items;
    };

    const rowItemsCache = Array.from({ length: rowCount }, (_, ri) => buildRowItems(ri));
    const rowStripWidths = rowItemsCache.map(items =>
      items.reduce((sum, it) => sum + it.w + itemGap, 0)
    );

    const rowH = height / rowCount;

    for (let f = 0; f < totalFrames; f++) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
      const progress = f / totalFrames;

      for (let ri = 0; ri < rowCount; ri++) {
        const items = rowItemsCache[ri];
        const stripW = rowStripWidths[ri];
        if (stripW < 1) continue;

        const dir = ri % 2 === 0 ? 'left' : 'right';
        const speed = scrollSpeed + seededRandom(ri, 37) * 6;
        const phaseFrac = (progress * durationSec) / speed;
        const shift = dir === 'left'
          ? -(phaseFrac % 1) * stripW
          : -((1 - phaseFrac % 1) % 1) * stripW;

        const copies = Math.ceil((width + stripW) / stripW) + 1;
        const yCenter = ri * rowH + rowH / 2;

        for (let c = 0; c < copies; c++) {
          let x = shift + c * stripW;

          for (const item of items) {
            if (x > width + 50) break;
            if (x + item.w < -50) { x += item.w + itemGap; continue; }

            if (item.type === 'icon') {
              const cx = x + iconDiam / 2;
              const cy = yCenter;
              ctx.beginPath();
              ctx.arc(cx, cy, iconDiam / 2, 0, Math.PI * 2);
              if (item.variant === 'filled') {
                ctx.fillStyle = item.color;
                ctx.fill();
                ctx.fillStyle = bgColor;
              } else {
                ctx.strokeStyle = item.color;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.fillStyle = item.color;
              }
              ctx.font = iconFont;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(item.char, cx, cy);
            } else {
              const ph = tagFontSize + pillPadV * 2;
              const rx = x;
              const ry = yCenter - ph / 2;

              ctx.beginPath();
              ctx.roundRect(rx, ry, item.w, ph, pillRadius);
              if (item.variant === 'filled') {
                ctx.fillStyle = item.color;
                ctx.fill();
                ctx.fillStyle = bgColor;
              } else {
                ctx.strokeStyle = item.color;
                ctx.lineWidth = 1.5;
                ctx.stroke();
                ctx.fillStyle = item.color;
              }
              ctx.font = tagFont;
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(item.word, rx + item.w / 2, yCenter);
            }
            x += item.w + itemGap;
          }
        }
      }

      processedFrames.push(canvas.toDataURL('image/png'));
      if (onProgress) onProgress(5 + Math.round((f / totalFrames) * 55));
    }
  } else if (preset === 'marquee-horizontal' || preset === 'marquee-diagonal') {
    const font = `${fontWeight} ${fontSize}px '${fontFamily}', Impact, sans-serif`;
    const sep = preset === 'marquee-diagonal' ? '  ' : '  \u2022  ';
    const chunk = text1 + sep;
    ctx.font = font;
    const chunkW = ctx.measureText(chunk).width;
    const stripW = chunkW * 20;
    const effRowCount = preset === 'marquee-diagonal' ? rowCount + 6 : rowCount;
    const opacityLevels = preset === 'marquee-diagonal' ? [1, 0.55, 0.25] : null;

    for (let f = 0; f < totalFrames; f++) {
      ctx.save();
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);
      const progress = f / totalFrames;

      if (preset === 'marquee-diagonal') {
        const diag = parseFloat(block.diagonalAngle ?? -25);
        ctx.translate(width / 2, height / 2);
        ctx.rotate((diag * Math.PI) / 180);
        ctx.translate(-width * 1.25, -height * 1.25);
      }

      const totalH = preset === 'marquee-diagonal' ? height * 2.5 : height;
      const rowH = (totalH - (effRowCount - 1) * rowGap) / effRowCount;

      for (let ri = 0; ri < effRowCount; ri++) {
        const speed = getRowSpeed(ri);
        const dir = getRowDir(ri);
        const phaseFrac = (progress * durationSec) / speed;
        const shift = dir === 'left'
          ? -(phaseFrac % 1) * chunkW
          : -((1 - phaseFrac % 1) % 1) * chunkW;

        const y = ri * (rowH + rowGap) + rowH / 2;
        const color = ri % 2 === 0 ? color1 : color2;
        ctx.font = font;
        ctx.fillStyle = color;
        ctx.textBaseline = 'middle';
        if (opacityLevels) ctx.globalAlpha = opacityLevels[ri % 3];

        const copies = Math.ceil(((preset === 'marquee-diagonal' ? width * 2.5 : width) + chunkW) / chunkW) + 1;
        for (let c = 0; c < copies; c++) {
          ctx.fillText(chunk, shift + c * chunkW, y);
        }
        ctx.globalAlpha = 1;
      }

      ctx.restore();
      processedFrames.push(canvas.toDataURL('image/png'));
      if (onProgress) onProgress(5 + Math.round((f / totalFrames) * 55));
    }
  } else if (preset === 'dual-word') {
    const font = `${fontWeight} ${fontSize}px '${fontFamily}', Impact, sans-serif`;
    const words = [text1, text2];
    const colors = [color1, color2];

    for (let f = 0; f < totalFrames; f++) {
      ctx.fillStyle = bgColor;
      ctx.fillRect(0, 0, width, height);

      const cycleFrac = f / totalFrames;
      const activeWord = cycleFrac < 0.5 ? 0 : 1;

      const rowH = height / rowCount;
      for (let ri = 0; ri < rowCount; ri++) {
        const wIdx = (ri + activeWord) % 2;
        const word = words[wIdx];
        const color = colors[wIdx];
        const intensityVal = 0.65;
        const sizeScale = 1 + (seededRandom(ri, 42) - 0.5) * intensityVal * 0.4;
        const y = ri * rowH + rowH / 2;
        const align = ri % 2 === 0 ? 'left' : 'right';
        const x = align === 'left' ? 8 : width - 8;

        ctx.font = `${fontWeight} ${Math.round(fontSize * sizeScale)}px '${fontFamily}', Impact, sans-serif`;
        ctx.fillStyle = color;
        ctx.textAlign = align === 'left' ? 'left' : 'right';
        ctx.textBaseline = 'middle';
        ctx.fillText(word, x, y);
      }

      processedFrames.push(canvas.toDataURL('image/png'));
      if (onProgress) onProgress(5 + Math.round((f / totalFrames) * 55));
    }
  } else {
    // variable-scale / kinetic-stack: fall back to static screenshot
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, width, height);
    ctx.font = `${fontWeight} ${fontSize}px '${fontFamily}', Impact, sans-serif`;
    ctx.fillStyle = color1;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    for (let ri = 0; ri < rowCount; ri++) {
      const y = (ri + 0.5) * (height / rowCount);
      ctx.fillText(text1, width / 2, y);
    }
    processedFrames.push(canvas.toDataURL('image/png'));
  }

  if (onProgress) onProgress(65);
  const blob = await encodeGifOnServer(processedFrames, width, height, frameDelay);
  if (onProgress) onProgress(100);
  return { blob, width, height };
}

/* ------------------------------------------------------------------ *
 * Animated Text → GIF
 *
 * Renders each variant onto a canvas frame-by-frame, then encodes
 * server-side. Mirrors the visual logic of <AnimatedTextBlock /> so
 * that GIFs in Gmail look the same as the live editor preview.
 * ------------------------------------------------------------------ */

function applyTextTransform(txt, mode) {
  if (!txt) return '';
  if (mode === 'uppercase') return txt.toUpperCase();
  if (mode === 'lowercase') return txt.toLowerCase();
  if (mode === 'capitalize') return txt.charAt(0).toUpperCase() + txt.slice(1).toLowerCase();
  return txt;
}

function letterSpacingPx(spacing, fontSize) {
  if (!spacing) return 0;
  const s = String(spacing).trim();
  if (s.endsWith('em')) return parseFloat(s) * fontSize;
  if (s.endsWith('px')) return parseFloat(s);
  return 0;
}

function measureChar(ctx, ch) {
  return ctx.measureText(ch === ' ' ? '\u00A0' : ch).width;
}

function totalTextWidth(ctx, chars, ls) {
  let w = 0;
  for (let i = 0; i < chars.length; i++) {
    w += measureChar(ctx, chars[i]);
    if (i < chars.length - 1) w += ls;
  }
  return w;
}

function hexWithAlpha(hex, alpha) {
  const a = Math.max(0, Math.min(1, alpha));
  const aHex = Math.round(a * 255).toString(16).padStart(2, '0');
  return `${hex}${aHex}`;
}

/**
 * Render a single AnimatedText frame at time t (seconds) on the given ctx.
 */
function drawAnimatedTextFrame(ctx, t, opts) {
  const {
    text, variant, fontFamily, fontWeight, fontSize,
    letterSpacing, textTransform, textAlign,
    backgroundColor, textColor, textColor2,
    waveSpeed, waveIntensity, paddingX, paddingY,
    width, height,
  } = opts;

  const intensityMap = { subtle: 0.35, medium: 0.65, dramatic: 1.0 };
  const intensity = intensityMap[waveIntensity] || 0.65;
  const omega = (2 * Math.PI) / Math.max(0.1, parseFloat(waveSpeed) || 3);

  ctx.fillStyle = backgroundColor;
  ctx.fillRect(0, 0, width, height);

  const display = applyTextTransform(text, textTransform);
  const chars = display.split('');
  const ls = letterSpacingPx(letterSpacing, fontSize);

  ctx.textBaseline = 'middle';
  ctx.font = `${fontWeight} ${fontSize}px "${fontFamily}", Impact, sans-serif`;

  const baseY = height / 2;
  const stripWidth = totalTextWidth(ctx, chars, ls);

  const xStart = textAlign === 'left'
    ? paddingX
    : textAlign === 'right'
      ? width - paddingX - stripWidth
      : (width - stripWidth) / 2;

  const drawCharsWithFn = (color, transformFn) => {
    let x = xStart;
    for (let i = 0; i < chars.length; i++) {
      const ch = chars[i] === ' ' ? '\u00A0' : chars[i];
      const charW = ctx.measureText(ch).width;
      const ctxState = transformFn ? transformFn(i, x, charW) : null;
      ctx.save();
      if (ctxState?.fillStyle) ctx.fillStyle = ctxState.fillStyle; else ctx.fillStyle = color;
      if (ctxState?.font) ctx.font = ctxState.font;
      if (ctxState?.translateX || ctxState?.translateY || ctxState?.rotate || ctxState?.scaleX || ctxState?.scaleY) {
        const cx = x + charW / 2;
        const cy = baseY;
        ctx.translate(cx + (ctxState.translateX || 0), cy + (ctxState.translateY || 0));
        if (ctxState.rotate) ctx.rotate(ctxState.rotate);
        if (ctxState.scaleX || ctxState.scaleY) ctx.scale(ctxState.scaleX || 1, ctxState.scaleY || 1);
        if (ctxState.alpha != null) ctx.globalAlpha = ctxState.alpha;
        ctx.fillText(ch, -charW / 2, 0);
      } else {
        if (ctxState?.alpha != null) ctx.globalAlpha = ctxState.alpha;
        ctx.fillText(ch, x, baseY);
      }
      ctx.restore();
      x += charW + ls;
    }
  };

  switch (variant) {
    case 'kinetic-stack': {
      drawCharsWithFn(textColor, (i) => {
        const phase = (i / Math.max(chars.length, 1)) * Math.PI * 2;
        const tt = t * omega;
        const yOff = Math.sin(tt * 0.7 + phase * 1.3) * intensity * 8;
        const rot = (Math.sin(tt * 0.5 + phase * 0.8) * intensity * 4) * Math.PI / 180;
        const opWave = Math.sin(tt * 0.3 + phase);
        const op = 0.55 + (opWave + 1) * 0.225;
        const scaleX = 0.85 + (Math.sin(tt + phase) + 1) * 0.5 * 0.3;
        return { translateY: yOff, rotate: rot, scaleX, scaleY: 1, alpha: op };
      });
      break;
    }
    case 'mirror-fold': {
      const half = Math.ceil(chars.length / 2);
      const leftChars = chars.slice(0, half);
      const overlap = -intensity * fontSize * 0.15 * (Math.sin(t * omega) + 1) * 0.5;
      const leftW = totalTextWidth(ctx, leftChars, ls);
      const totalW = leftW * 2 + overlap;
      const startX = (width - totalW) / 2;
      // left half (original)
      let x = startX;
      ctx.fillStyle = textColor;
      for (let i = 0; i < leftChars.length; i++) {
        const ch = leftChars[i] === ' ' ? '\u00A0' : leftChars[i];
        const cw = ctx.measureText(ch).width;
        ctx.fillText(ch, x, baseY);
        x += cw + ls;
      }
      // right half (mirrored, secondary color)
      ctx.save();
      const mirrorStartX = startX + leftW + overlap + leftW;
      ctx.translate(mirrorStartX, 0);
      ctx.scale(-1, 1);
      ctx.fillStyle = textColor2 || textColor;
      let mx = 0;
      for (let i = 0; i < leftChars.length; i++) {
        const ch = leftChars[i] === ' ' ? '\u00A0' : leftChars[i];
        const cw = ctx.measureText(ch).width;
        ctx.fillText(ch, mx, baseY);
        mx += cw + ls;
      }
      ctx.restore();
      break;
    }
    case 'glitch-rgb': {
      const offR = Math.sin(t * omega * 1.7) * intensity * 6;
      const offB = Math.cos(t * omega * 1.3) * intensity * 6;
      const sliceTrigger = Math.sin(t * omega * 5) > 0.85;
      const sliceY = sliceTrigger ? Math.sin(t * 30) * intensity * 4 : 0;
      ctx.save();
      ctx.globalCompositeOperation = 'screen';
      ctx.fillStyle = '#FF2D55';
      ctx.globalAlpha = 0.85;
      ctx.fillText(display, xStart + offR, baseY + sliceY);
      ctx.fillStyle = '#00E0FF';
      ctx.fillText(display, xStart + offB, baseY - sliceY);
      ctx.restore();
      ctx.fillStyle = textColor;
      ctx.fillText(display, xStart, baseY);
      break;
    }
    case 'neon-pulse': {
      const pulse = (Math.sin(t * omega) + 1) * 0.5;
      const blur = 6 + pulse * 24 * intensity;
      const accent = textColor2 || textColor;
      ctx.save();
      // Outer glow layers
      const layers = [
        { blur: blur * 2.4, color: accent, alpha: 0.35 },
        { blur: blur * 1.6, color: accent, alpha: 0.55 },
        { blur: blur,        color: textColor, alpha: 0.8 },
        { blur: blur * 0.4, color: textColor, alpha: 1.0 },
      ];
      for (const L of layers) {
        ctx.shadowColor = L.color;
        ctx.shadowBlur = L.blur;
        ctx.fillStyle = textColor;
        ctx.globalAlpha = L.alpha;
        ctx.fillText(display, xStart, baseY);
      }
      ctx.restore();
      break;
    }
    case 'wave-flow': {
      drawCharsWithFn(textColor, (i) => {
        const phase = (i / Math.max(chars.length, 1)) * Math.PI * 2;
        const yOff = Math.sin(t * omega + phase) * intensity * fontSize * 0.18;
        return { translateY: yOff };
      });
      break;
    }
    case 'typewriter': {
      const safeWave = Math.max(0.1, parseFloat(waveSpeed) || 3);
      const cycleLen = chars.length + 6;
      const idx = Math.floor((t / safeWave) * cycleLen) % cycleLen;
      let x = xStart;
      for (let i = 0; i < chars.length; i++) {
        const ch = chars[i] === ' ' ? '\u00A0' : chars[i];
        const cw = ctx.measureText(ch).width;
        ctx.save();
        ctx.globalAlpha = i < idx ? 1 : 0.08;
        ctx.fillStyle = textColor;
        ctx.fillText(ch, x, i < idx ? baseY : baseY + 6);
        ctx.restore();
        x += cw + ls;
      }
      break;
    }
    case 'shadow-stack': {
      const layers = 6;
      const angle = Math.sin(t * omega * 0.6) * intensity * 30 + 30;
      const rad = (angle * Math.PI) / 180;
      const dx = Math.cos(rad) * 4;
      const dy = Math.sin(rad) * 4;
      const accent = textColor2 || textColor;
      for (let k = layers; k >= 1; k--) {
        const fade = 1 - (k - 1) / layers;
        ctx.fillStyle = hexWithAlpha(accent, fade * 0.78);
        ctx.fillText(display, xStart + dx * k, baseY + dy * k);
      }
      ctx.fillStyle = textColor;
      ctx.fillText(display, xStart, baseY);
      break;
    }
    case 'variable-scale':
    default: {
      let x = xStart;
      for (let i = 0; i < chars.length; i++) {
        const phase = (i / Math.max(chars.length, 1)) * Math.PI * 2;
        const wave = Math.sin(t * omega + phase);
        const minS = 1 - intensity * 0.5;
        const maxS = 1 + intensity * 0.7;
        const scale = minS + (wave + 1) * 0.5 * (maxS - minS);
        const fs = fontSize * scale;
        ctx.font = `${fontWeight} ${fs}px "${fontFamily}", Impact, sans-serif`;
        const ch = chars[i] === ' ' ? '\u00A0' : chars[i];
        const cw = ctx.measureText(ch).width;
        ctx.fillStyle = textColor;
        ctx.fillText(ch, x, baseY);
        x += cw + ls;
      }
      break;
    }
  }
}

export async function exportAnimatedTextAsGif(block, options = {}) {
  const {
    width = 700,
    onProgress = null,
  } = options;

  const text = block.text || 'TRANSFORM';
  const variant = block.variant || 'variable-scale';
  const fontFamily = block.fontFamily || 'Impact';
  const fontWeight = block.fontWeight || '900';
  const fontSize = parseInt(block.fontSize) || 96;
  const letterSpacing = block.letterSpacing || '-0.02em';
  const textTransform = block.textTransform || 'uppercase';
  const textAlign = block.textAlign || 'center';
  const backgroundColor = block.backgroundColor || '#0A0A0A';
  const textColor = block.textColor || '#FF2D2D';
  const textColor2 = block.textColor2 || '#FFFFFF';
  const waveSpeed = parseFloat(block.waveSpeed) || 3;
  const waveIntensity = block.waveIntensity || 'medium';
  const paddingX = parseInt(block.paddingX) ?? 24;
  const paddingY = parseInt(block.paddingY) ?? 48;
  const lineHeightRatio = parseFloat(block.lineHeightRatio) || 0.95;

  if (onProgress) onProgress(2);

  await ensureFontLoaded(fontFamily, fontWeight, fontSize);

  // Single-line block height: text height + vertical padding.
  // Add a little headroom for variants that translate vertically.
  const textBox = Math.ceil(fontSize * Math.max(1, lineHeightRatio + 0.2));
  const height = paddingY * 2 + textBox;

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true });

  const fps = 12;
  const totalDuration = Math.max(1.2, Math.min(waveSpeed, 4));
  const totalFrames = Math.round(fps * totalDuration);
  const frameDelay = Math.round(1000 / fps);

  const baseOpts = {
    text, variant, fontFamily, fontWeight, fontSize,
    letterSpacing, textTransform, textAlign,
    backgroundColor, textColor, textColor2,
    waveSpeed, waveIntensity, paddingX, paddingY,
    width, height,
  };

  const processedFrames = [];

  for (let i = 0; i < totalFrames; i++) {
    const t = (i / totalFrames) * totalDuration;
    drawAnimatedTextFrame(ctx, t, baseOpts);
    // PNG (lossless) preserves crisp text edges; the GIF encoder
    // quantizes colors anyway, so per-frame JPEG noise just hurts.
    processedFrames.push(canvas.toDataURL('image/png'));
    if (onProgress) onProgress(2 + Math.round((i / totalFrames) * 60));
  }

  if (onProgress) onProgress(65);
  console.log(`[animatedText→GIF] sending ${processedFrames.length} frames (${width}x${height}) to encoder…`);
  const blob = await encodeGifOnServer(processedFrames, width, height, frameDelay);
  console.log('[animatedText→GIF] blob size:', blob.size, 'bytes');
  if (onProgress) onProgress(100);
  return { blob, width, height };
}

/**
 * Generic DOM-based GIF capture for any animated block.
 * Uses html2canvas to snapshot frames over time, then encodes server-side.
 * Slower and larger than the purpose-built canvas renderers above, but works
 * for any complex DOM/CSS animation (kinetic marquees, custom widgets, etc).
 */
export async function exportBlockAsGifFromDOM(blockId, options = {}) {
  const {
    duration = 3000,
    fps = 10,
    scale = 2,
    onProgress = null,
  } = options;

  const html2canvas = (await import('html2canvas')).default;
  const wrapper = typeof blockId === 'string'
    ? document.querySelector(`[data-block-id="${blockId}"]`)
    : blockId;
  if (!wrapper) throw new Error('Block not found in DOM');
  const contentEl = wrapper.firstElementChild || wrapper;
  const rect = contentEl.getBoundingClientRect();
  const width = Math.max(1, Math.round(rect.width * scale));
  const height = Math.max(1, Math.round(rect.height * scale));

  const totalFrames = Math.max(4, Math.floor((duration / 1000) * fps));
  const frameDelay = Math.round(1000 / fps);
  const frames = [];

  if (onProgress) onProgress(2);

  // Let CSS animations settle before first capture.
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
  const start = performance.now();

  for (let i = 0; i < totalFrames; i++) {
    // Capture on a stable timeline to reduce jitter between frames.
    const targetTs = start + (i * frameDelay);
    while (performance.now() < targetTs) {
      await new Promise((r) => requestAnimationFrame(r));
    }

    const canvas = await html2canvas(contentEl, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      scale,
      logging: false,
    });
    frames.push(canvas.toDataURL('image/png'));
    if (onProgress) onProgress(2 + Math.round((i / totalFrames) * 60));
  }

  if (onProgress) onProgress(65);
  const blob = await encodeGifOnServer(frames, width, height, frameDelay);
  if (onProgress) onProgress(100);
  return { blob, width, height };
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
