/**
 * Newsletter Conversion Pipeline
 *
 * Converts dynamic/animated blocks (marquee, imageSequence) into
 * email-safe images so the newsletter renders correctly in Gmail.
 *
 * - Marquee → animated GIF (preserves scrolling animation)
 * - ImageSequence → static PNG screenshot
 *
 * Flow:
 *   1. Walk all blocks and identify dynamic types
 *   2. For marquee: generate animated GIF via canvas + server-side encoding
 *      For others: screenshot via html2canvas
 *   3. Upload to Supabase via /api/images/upload
 *   4. Clone the newsletter data, replacing dynamic blocks with image blocks
 *   5. Return the email-ready newsletter
 */

import {
  exportMarqueeAsGif,
  exportAnimatedTextAsGif,
  exportKineticMarqueeAsGif,
  exportSequenceAsGif,
} from './sequenceGifExport';

const DYNAMIC_BLOCK_TYPES = ['marquee', 'imageSequence', 'animatedText'];
const KINETIC_MARQUEE_PRESETS = new Set([
  'marquee-horizontal',
  'marquee-diagonal',
  'variable-scale',
  'kinetic-stack',
  'dual-word',
  'tag-marquee',
]);

// ---------------------------------------------------------------------------
// 1. Find all dynamic blocks across flat-blocks and grid modes
// ---------------------------------------------------------------------------

export function findDynamicBlocks(newsletter) {
  const seen = new Set();
  const results = [];

  for (const section of newsletter.sections || []) {
    const collect = (blocks) => {
      for (const block of blocks || []) {
        if (DYNAMIC_BLOCK_TYPES.includes(block.type) && !seen.has(block.id)) {
          seen.add(block.id);
          results.push({ blockId: block.id, block, sectionId: section.id });
        }
      }
    };

    if (Array.isArray(section.rows)) {
      for (const row of section.rows) {
        for (const col of row.columns || []) {
          collect(col.blocks);
        }
      }
    }

    collect(section.blocks);
  }

  return results;
}

// ---------------------------------------------------------------------------
// 2. Deep-clone newsletter and swap blocks by id
// ---------------------------------------------------------------------------

function replaceBlocks(newsletter, replacements) {
  const clone = JSON.parse(JSON.stringify(newsletter));
  const swap = (blocks) => (blocks || []).map((b) => replacements[b.id] || b);

  for (const section of clone.sections) {
    if (Array.isArray(section.rows)) {
      for (const row of section.rows) {
        for (const col of row.columns) {
          col.blocks = swap(col.blocks);
        }
      }
    }
    if (Array.isArray(section.blocks)) {
      section.blocks = swap(section.blocks);
    }
  }

  return clone;
}

// ---------------------------------------------------------------------------
// 3. Screenshot a block element from the live DOM
// ---------------------------------------------------------------------------

async function captureBlockAsImage(blockId) {
  const html2canvas = (await import('html2canvas')).default;

  const wrapper = document.querySelector(`[data-block-id="${blockId}"]`);
  if (!wrapper) return null;

  const contentEl = wrapper.firstElementChild || wrapper;

  // ── Temporarily clean up the element for a pristine capture ──

  const savedOutline = wrapper.style.outline;
  const savedOutlineOffset = wrapper.style.outlineOffset;
  wrapper.style.outline = 'none';
  wrapper.style.outlineOffset = '0';

  // Pause every CSS animation inside the block so html2canvas gets a
  // stable frame instead of a mid-transition snapshot.
  const paused = [];
  contentEl.querySelectorAll('*').forEach((el) => {
    const cs = window.getComputedStyle(el);
    if (cs.animationName && cs.animationName !== 'none') {
      paused.push({
        el,
        animation: el.style.animation,
        playState: el.style.animationPlayState,
      });
      el.style.animationPlayState = 'paused';
    }
  });

  // Let the browser settle after style changes
  await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));

  const rect = contentEl.getBoundingClientRect();

  const canvas = await html2canvas(contentEl, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    allowTaint: true,
    logging: false,
  });

  // ── Restore everything ──
  wrapper.style.outline = savedOutline;
  wrapper.style.outlineOffset = savedOutlineOffset;
  paused.forEach(({ el, animation, playState }) => {
    el.style.animation = animation;
    el.style.animationPlayState = playState;
  });

  return {
    dataUrl: canvas.toDataURL('image/png'),
    width: Math.round(rect.width),
    height: Math.round(rect.height),
  };
}

// ---------------------------------------------------------------------------
// 4. Upload a data-URL image via the existing API
// ---------------------------------------------------------------------------

async function uploadCapturedImage(dataUrl, userId) {
  const res = await fetch('/api/images/upload', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      base64: dataUrl,
      userId: userId || 'public',
      folder: 'newsletters/converted',
      format: 'png',
    }),
  });

  if (!res.ok) {
    const errBody = await res.json().catch(() => ({}));
    throw new Error(errBody.error || `Upload failed (${res.status})`);
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// 5. Main entry point
// ---------------------------------------------------------------------------

/**
 * Convert a newsletter for email delivery.
 *
 * - Scans for dynamic blocks (marquee, imageSequence)
 * - Screenshots each from the DOM
 * - Uploads as hosted PNG
 * - Returns a new newsletter object with those blocks replaced by images
 *
 * The original newsletter is NOT mutated.
 *
 * @param {object}   newsletter        The current newsletter state
 * @param {object}   options
 * @param {string}   options.userId     Supabase user id for storage paths
 * @param {function} options.onProgress Called with { step, current, total, label }
 * @returns {{ newsletter, converted: boolean, count: number }}
 */
export async function convertNewsletterForEmail(newsletter, options = {}) {
  const { userId, onProgress } = options;

  const dynamicBlocks = findDynamicBlocks(newsletter);

  if (dynamicBlocks.length === 0) {
    return { newsletter, converted: false, count: 0 };
  }

  const replacements = {};
  const total = dynamicBlocks.length;

  for (let i = 0; i < total; i++) {
    const { blockId, block } = dynamicBlocks[i];
    const label = block.type === 'marquee'
      ? 'Marquee'
      : block.type === 'animatedText'
        ? 'Animated Text'
        : 'Image Sequence';

    onProgress?.({ step: 'capture', current: i + 1, total, label });

    try {
      let uploaded;

      if (block.type === 'animatedText') {
        let gifResult = null;
        try {
          gifResult = await exportAnimatedTextAsGif(block, { width: 700 });
        } catch (gifErr) {
          console.error(`[convert] animatedText GIF generation failed (${blockId}):`, gifErr);
        }

        onProgress?.({ step: 'upload', current: i + 1, total, label });

        if (gifResult?.blob) {
          const formData = new FormData();
          formData.append('file', gifResult.blob, `animated-text-${Date.now()}.gif`);
          const res = await fetch('/api/images/upload', {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) throw new Error(`Upload failed (${res.status})`);
          uploaded = await res.json();

          replacements[blockId] = {
            type: 'image',
            id: blockId,
            src: uploaded.url,
            alt: block.text || 'Animated text',
            borderRadius: 0,
            _convertedFrom: 'animatedText',
            _originalHeight: gifResult.height,
          };
        } else {
          const capture = await captureBlockAsImage(blockId);
          if (!capture) continue;
          uploaded = await uploadCapturedImage(capture.dataUrl, userId);
          replacements[blockId] = {
            type: 'image',
            id: blockId,
            src: uploaded.url,
            alt: block.text || 'Animated text',
            borderRadius: 0,
            _convertedFrom: 'animatedText',
            _originalHeight: capture.height,
          };
        }
      } else if (block.type === 'marquee') {
        let gifResult = null;
        try {
          if (KINETIC_MARQUEE_PRESETS.has(block.preset)) {
            gifResult = await exportKineticMarqueeAsGif(block, { width: 700 });
          } else {
            gifResult = await exportMarqueeAsGif(block, { width: 700 });
          }
        } catch (gifErr) {
          console.warn(`GIF generation failed for marquee (${blockId}), falling back to screenshot:`, gifErr.message);
        }

        onProgress?.({ step: 'upload', current: i + 1, total, label });

        if (gifResult?.blob) {
          const formData = new FormData();
          formData.append('file', gifResult.blob, `marquee-${Date.now()}.gif`);
          const res = await fetch('/api/images/upload', {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) throw new Error(`Upload failed (${res.status})`);
          uploaded = await res.json();

          replacements[blockId] = {
            type: 'image',
            id: blockId,
            src: uploaded.url,
            alt: 'Marquee animation',
            borderRadius: 0,
            _convertedFrom: 'marquee',
            _originalHeight: gifResult.height,
          };
        } else {
          const capture = await captureBlockAsImage(blockId);
          if (!capture) continue;
          uploaded = await uploadCapturedImage(capture.dataUrl, userId);

          replacements[blockId] = {
            type: 'image',
            id: blockId,
            src: uploaded.url,
            alt: 'Marquee content',
            borderRadius: 0,
            _convertedFrom: 'marquee',
            _originalHeight: capture.height,
          };
        }
      } else if (block.type === 'imageSequence') {
        const validImages = (block.images || []).filter(Boolean);
        let gifBlob = null;

        if (validImages.length >= 2) {
          try {
            gifBlob = await exportSequenceAsGif(validImages, {
              width: 700,
              height: block.previewHeight || 400,
              delay: block.frameDuration || 500,
            });
          } catch (gifErr) {
            console.warn(`GIF generation failed for imageSequence (${blockId}), falling back to screenshot:`, gifErr.message);
          }
        }

        onProgress?.({ step: 'upload', current: i + 1, total, label });

        if (gifBlob) {
          const formData = new FormData();
          formData.append('file', gifBlob, `sequence-${Date.now()}.gif`);
          const res = await fetch('/api/images/upload', {
            method: 'POST',
            body: formData,
          });
          if (!res.ok) throw new Error(`Upload failed (${res.status})`);
          uploaded = await res.json();

          replacements[blockId] = {
            type: 'image',
            id: blockId,
            src: uploaded.url,
            alt: 'Image sequence animation',
            borderRadius: 0,
            _convertedFrom: 'imageSequence',
          };
        } else {
          const capture = await captureBlockAsImage(blockId);
          if (!capture) continue;
          uploaded = await uploadCapturedImage(capture.dataUrl, userId);

          replacements[blockId] = {
            type: 'image',
            id: blockId,
            src: uploaded.url,
            alt: 'Image sequence',
            borderRadius: 0,
            _convertedFrom: 'imageSequence',
            _originalHeight: capture.height,
          };
        }
      } else {
        const capture = await captureBlockAsImage(blockId);
        if (!capture) continue;
        onProgress?.({ step: 'upload', current: i + 1, total, label });
        uploaded = await uploadCapturedImage(capture.dataUrl, userId);

        replacements[blockId] = {
          type: 'image',
          id: blockId,
          src: uploaded.url,
          alt: `${label} content`,
          borderRadius: 0,
          _convertedFrom: block.type,
          _originalHeight: capture.height,
        };
      }
    } catch (err) {
      console.warn(`Conversion skipped for ${label} (${blockId}):`, err.message);
      onProgress?.({
        step: 'error',
        current: i + 1,
        total,
        label,
        error: err.message,
      });
    }
  }

  const converted = replaceBlocks(newsletter, replacements);
  const count = Object.keys(replacements).length;

  onProgress?.({ step: 'done', count, total });

  return { newsletter: converted, converted: true, count };
}
