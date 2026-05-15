import html2canvas from 'html2canvas';

const SERVER_ENCODE_TIMEOUT = 60000;

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

    const arrayBuf = await res.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(arrayBuf).reduce((s, b) => s + String.fromCharCode(b), '')
    );
    return `data:image/gif;base64,${base64}`;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

export async function exportToGif(element, options = {}) {
  const {
    duration = 3000,
    frameRate = 10,
    quality = 0.8,
    width = null,
    height = null,
    onProgress = null
  } = options;

  const frames = Math.ceil(duration / 1000 * frameRate);
  const frameDelay = Math.round(1000 / frameRate);
  const capturedFrames = [];

  try {
    const captureWidth = width || element.offsetWidth;
    const captureHeight = height || element.offsetHeight;

    for (let i = 0; i < frames; i++) {
      if (onProgress) {
        onProgress(Math.round((i / frames) * 50));
      }

      const canvas = await html2canvas(element, {
        useCORS: true,
        allowTaint: true,
        backgroundColor: null,
        scale: 1,
        width: captureWidth,
        height: captureHeight,
        logging: false
      });

      capturedFrames.push(canvas.toDataURL('image/jpeg', quality));
      await new Promise(resolve => setTimeout(resolve, frameDelay));
    }

    if (onProgress) onProgress(50);

    const gifDataUrl = await encodeGifOnServer(
      capturedFrames,
      captureWidth,
      captureHeight,
      frameDelay
    );

    if (onProgress) onProgress(100);
    return gifDataUrl;
  } catch (error) {
    console.error('GIF export error:', error);
    throw error;
  }
}

export async function captureElement(element) {
  try {
    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: null,
      scale: 2,
      logging: false
    });
    return canvas.toDataURL('image/png');
  } catch (error) {
    console.error('Capture error:', error);
    throw error;
  }
}

export function downloadDataUrl(dataUrl, filename = 'export.gif') {
  const link = document.createElement('a');
  link.href = dataUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export default { exportToGif, captureElement, downloadDataUrl };
