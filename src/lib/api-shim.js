// Bridge for legacy `fetch('/api/...')` calls.
//
// The original Next.js app shipped its server logic at `/api/*`. Inside this
// Base44 SPA there are no Next API routes. We install a small fetch
// interceptor that maps the still-existing `/api/*` calls to:
//   - base44 backend functions (gif/encode, email/render, email/send)
//   - base44 entities (newsletters)
//   - base44 integrations (UploadFile for /api/images/upload, /api/media)
//
// This lets the editor code stay almost untouched while running entirely on
// Base44 infrastructure.

import { base44 } from '@/api/base44Client';

const originalFetch = typeof window !== 'undefined' ? window.fetch.bind(window) : null;

let installed = false;

function jsonResponse(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

async function readBody(input) {
  if (!input) return null;
  if (typeof input === 'string') {
    try { return JSON.parse(input); } catch { return input; }
  }
  return input;
}

async function readJson(init) {
  if (!init?.body) return {};
  if (typeof init.body === 'string') {
    try { return JSON.parse(init.body); } catch { return {}; }
  }
  return {};
}

// /api/images/upload, /api/media
//
// The original Next.js route accepts two body shapes:
//   1. multipart/form-data with a `file` field
//   2. application/json with `{ base64: dataURL, format, folder, userId }`
//
// Both paths funnel into base44.integrations.Core.UploadFile and return the
// hosted URL.
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

const MEDIA_STORE_KEY = 'newsletter_my_files';

function getStoredFiles(userId) {
  try {
    const all = JSON.parse(localStorage.getItem(MEDIA_STORE_KEY) || '{}');
    return all[userId || 'public'] || [];
  } catch { return []; }
}

function setStoredFiles(userId, files) {
  try {
    const all = JSON.parse(localStorage.getItem(MEDIA_STORE_KEY) || '{}');
    all[userId || 'public'] = files;
    localStorage.setItem(MEDIA_STORE_KEY, JSON.stringify(all));
  } catch { /* quota exceeded or private mode */ }
}

async function handleImageUpload(init) {
  try {
    const body = init?.body;
    let file;
    let fileName = `upload-${Date.now()}`;
    let existingDataUrl = null;

    if (body instanceof FormData) {
      file = body.get('file');
      if (!file) return jsonResponse({ error: 'No file in FormData' }, 400);
      fileName = file.name || fileName;
    } else if (typeof body === 'string') {
      let parsed;
      try { parsed = JSON.parse(body); } catch {
        return jsonResponse({ error: 'Body must be FormData or JSON' }, 400);
      }
      const { base64, format = 'png' } = parsed || {};
      if (!base64) return jsonResponse({ error: 'Missing base64 field' }, 400);
      existingDataUrl = base64.startsWith('data:') ? base64 : null;
      const m = /^data:([^;]+);base64,(.*)$/.exec(base64);
      const mime = m ? m[1] : `image/${format}`;
      const data = m ? m[2] : base64;
      const ext = format || (mime.split('/')[1] ?? 'png');
      const bin = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
      fileName = `${parsed.folder ? parsed.folder.replace(/[^a-z0-9_-]/gi, '_') + '-' : ''}upload-${Date.now()}.${ext}`;
      file = new File([bin], fileName, { type: mime });
    } else {
      return jsonResponse({ error: 'Unsupported request body' }, 400);
    }

    try {
      const result = await base44.integrations.Core.UploadFile({ file });
      const url = result?.file_url || result?.url || result?.fileUrl;
      if (url) {
        return jsonResponse({ url, fileName, size: file.size });
      }
    } catch (_uploadErr) {
      // UploadFile failed (e.g. no auth) — fall back to data URL
    }

    const dataUrl = existingDataUrl || await fileToDataUrl(file);
    return jsonResponse({ url: dataUrl, fileName, size: file.size });
  } catch (err) {
    return jsonResponse({ error: err?.message ?? String(err) }, 500);
  }
}

async function handleMedia(method, init, rawUrl) {
  let params;
  try { params = new URL(rawUrl, window.location.origin).searchParams; }
  catch { params = new URLSearchParams(); }
  const userId = params.get('userId')
    || (init?.body instanceof FormData ? init.body.get('userId') : null)
    || 'public';

  if (method === 'GET') {
    const files = getStoredFiles(userId);
    return jsonResponse({ files });
  }

  if (method === 'DELETE') {
    const path = params.get('path');
    if (path) {
      const files = getStoredFiles(userId).filter((f) => f.path !== path);
      setStoredFiles(userId, files);
    }
    return jsonResponse({ success: true });
  }

  // POST — upload then persist the record
  const uploadResponse = await handleImageUpload(init);
  const uploadData = await uploadResponse.clone().json();
  if (uploadResponse.status !== 200 || uploadData.error) {
    return uploadResponse;
  }

  const fileRecord = {
    id: `file_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: uploadData.fileName,
    url: uploadData.url,
    path: uploadData.url,
    size: uploadData.size,
    created_at: new Date().toISOString(),
  };
  const existing = getStoredFiles(userId);
  setStoredFiles(userId, [fileRecord, ...existing]);

  return jsonResponse({ url: uploadData.url, fileName: uploadData.fileName, size: uploadData.size });
}

// Helper: load a frame dataURL into an HTMLImageElement.
function loadDataUrlImage(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to decode frame dataURL'));
    img.src = dataUrl;
  });
}

// /api/gif/encode — runs entirely in the browser via gifenc.
// Same contract as the original Next.js route: JSON in, image/gif binary out.
async function handleGifEncode(init) {
  try {
    const { frames, width, height, delay } = await readJson(init);
    if (!Array.isArray(frames) || frames.length === 0) {
      return jsonResponse({ error: 'No frames provided' }, 400);
    }
    const w = parseInt(width) || 700;
    const h = parseInt(height) || 200;
    const frameDelay = Math.max(20, parseInt(delay) || 100);

    const { GIFEncoder, quantize, applyPalette } = await import('gifenc');
    const enc = GIFEncoder();

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    for (const frame of frames) {
      if (typeof frame !== 'string') continue;
      const img = await loadDataUrlImage(frame);
      ctx.clearRect(0, 0, w, h);
      // Cover-fit: scale + center to fill exact wxh.
      const sR = img.width / img.height;
      const dR = w / h;
      let dw, dh, dx, dy;
      if (sR > dR) {
        dh = h;
        dw = h * sR;
        dx = (w - dw) / 2;
        dy = 0;
      } else {
        dw = w;
        dh = w / sR;
        dx = 0;
        dy = (h - dh) / 2;
      }
      ctx.drawImage(img, dx, dy, dw, dh);
      const { data } = ctx.getImageData(0, 0, w, h);

      const palette = quantize(data, 256, { format: 'rgba4444' });
      const indexed = applyPalette(data, palette, 'rgba4444');
      enc.writeFrame(indexed, w, h, { palette, delay: frameDelay });
    }

    enc.finish();
    const bytes = enc.bytes();
    return new Response(bytes, {
      status: 200,
      headers: {
        'Content-Type': 'image/gif',
        'Content-Length': String(bytes.byteLength),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    return jsonResponse({ error: err?.message ?? String(err) }, 500);
  }
}

// /api/email/render — MJML render via Base44 backend function.
async function handleEmailRender(init) {
  try {
    const body = await readJson(init);
    const fn = base44.functions?.emailRender;
    if (!fn) {
      return jsonResponse({
        error: 'Email render is not yet wired in this build. Use Copy Design instead.',
      }, 501);
    }
    const result = await fn({ body });
    return jsonResponse(result?.data ?? result);
  } catch (err) {
    return jsonResponse({ error: err?.message ?? String(err) }, 500);
  }
}

// /api/email/send — send via Base44 backend function.
async function handleEmailSend(init) {
  try {
    const body = await readJson(init);
    const fn = base44.functions?.emailSend;
    if (!fn) {
      return jsonResponse({
        error: 'Email send is not wired in this build yet (planned).',
      }, 501);
    }
    const result = await fn({ body });
    return jsonResponse(result?.data ?? result);
  } catch (err) {
    return jsonResponse({ error: err?.message ?? String(err) }, 500);
  }
}

// /api/subscribers — not in scope yet, return empty list
async function handleSubscribers(method, init, urlObj) {
  if (method === 'GET') {
    return jsonResponse({ subscribers: [] });
  }
  return jsonResponse({ error: 'Subscribers API not implemented in Base44 build' }, 501);
}

// /api/newsletters — handled via the storage hook (entity calls); shouldn't be hit,
// but if it is, return empty.
async function handleNewslettersFallback(method, init) {
  if (method === 'GET') return jsonResponse({ newsletters: [] });
  return jsonResponse({ error: 'Use base44 entities directly' }, 501);
}

const ROUTES = [
  { match: (p) => p === '/api/images/upload', handler: (m, i) => handleImageUpload(i) },
  { match: (p) => p.startsWith('/api/media'), handler: handleMedia },
  { match: (p) => p === '/api/gif/encode',    handler: (m, i) => handleGifEncode(i) },
  { match: (p) => p === '/api/email/render',  handler: (m, i) => handleEmailRender(i) },
  { match: (p) => p === '/api/email/send',    handler: (m, i) => handleEmailSend(i) },
  { match: (p) => p.startsWith('/api/subscribers'),  handler: handleSubscribers },
  { match: (p) => p.startsWith('/api/newsletters'),  handler: handleNewslettersFallback },
];

export function installApiShim() {
  if (installed || typeof window === 'undefined' || !originalFetch) return;
  installed = true;

  window.fetch = async function shimmedFetch(input, init) {
    const rawUrl = typeof input === 'string' ? input : input?.url ?? '';
    if (!rawUrl || !rawUrl.startsWith('/api/')) {
      return originalFetch(input, init);
    }

    let pathname = rawUrl;
    try {
      const u = new URL(rawUrl, window.location.origin);
      pathname = u.pathname;
    } catch { /* relative URL parsing fallback */ }

    const method = (init?.method || 'GET').toUpperCase();
    for (const route of ROUTES) {
      if (route.match(pathname)) {
        try {
          return await route.handler(method, init || {}, rawUrl);
        } catch (err) {
          return jsonResponse({ error: err?.message ?? String(err) }, 500);
        }
      }
    }
    return originalFetch(input, init);
  };
}
