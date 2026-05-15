/**
 * Image Processing Pipeline
 * 
 * Solves the base64 email problem:
 * 1. User uploads image (file or base64)
 * 2. We optimize it (resize, compress, convert)
 * 3. Upload to Supabase Storage
 * 4. Return public CDN URL
 * 5. Email uses URL instead of base64
 * 
 * This runs server-side (API route) for sharp processing.
 */

import { getSupabaseAdmin } from './supabase-client';

// Lazy-load sharp so routes that import this module but don't actually
// process images (e.g. GET /api/media listing) don't trip the native
// binding at module-evaluation time.
let _sharp;
async function getSharp() {
  if (!_sharp) {
    _sharp = (await import('sharp')).default;
  }
  return _sharp;
}

const BUCKET_NAME = 'newsletter-images';
const MAX_WIDTH = 1200;
const MAX_SIZE_MB = parseInt(process.env.MAX_IMAGE_SIZE_MB || '5');
const QUALITY = parseInt(process.env.IMAGE_QUALITY || '80');

/**
 * Process and upload an image buffer
 * Returns a public URL suitable for email embedding
 */
export async function processAndUploadImage(buffer, options = {}) {
  const {
    userId = 'public',
    folder = 'uploads',
    filename,
    maxWidth = MAX_WIDTH,
    quality = QUALITY,
    format = 'jpeg',
  } = options;

  const sharp = await getSharp();
  const image = sharp(buffer);
  const metadata = await image.metadata();

  let pipeline = image;
  if (metadata.width > maxWidth) {
    pipeline = pipeline.resize(maxWidth, null, { withoutEnlargement: true });
  }

  switch (format) {
    case 'webp':
      pipeline = pipeline.webp({ quality });
      break;
    case 'png':
      pipeline = pipeline.png({ quality: Math.min(quality, 100) });
      break;
    default:
      pipeline = pipeline.jpeg({ quality, progressive: true });
  }

  const optimizedBuffer = await pipeline.toBuffer();
  const optimizedMeta = await (await getSharp())(optimizedBuffer).metadata();

  const ext = format === 'jpeg' ? 'jpg' : format;
  const finalFilename = filename || `${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;
  const filePath = `${userId}/${folder}/${finalFilename}`;

  const supabase = getSupabaseAdmin();
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, optimizedBuffer, {
      contentType: `image/${format}`,
      cacheControl: '31536000',
      upsert: true,
    });

  if (uploadError) {
    throw new Error(`Upload failed: ${uploadError.message}`);
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);

  return {
    url: urlData.publicUrl,
    path: filePath,
    width: optimizedMeta.width,
    height: optimizedMeta.height,
    size: optimizedBuffer.length,
    format,
    originalSize: buffer.length,
    compressionRatio: Math.round((1 - optimizedBuffer.length / buffer.length) * 100),
  };
}

/**
 * Convert base64 image to hosted URL
 * This is the key function for the email pipeline
 */
export async function base64ToHostedUrl(base64Data, options = {}) {
  let base64Content = base64Data;
  let detectedFormat = 'jpeg';

  if (base64Data.includes(',')) {
    const [header, content] = base64Data.split(',');
    base64Content = content;
    const mimeMatch = header.match(/data:image\/([^;]+);/);
    if (mimeMatch) {
      detectedFormat = mimeMatch[1] === 'jpg' ? 'jpeg' : mimeMatch[1];
    }
  }

  const buffer = Buffer.from(base64Content, 'base64');

  if (buffer.length > MAX_SIZE_MB * 1024 * 1024) {
    throw new Error(`Image exceeds ${MAX_SIZE_MB}MB limit`);
  }

  return processAndUploadImage(buffer, {
    ...options,
    format: options.format || detectedFormat,
  });
}

/**
 * Process all images in a newsletter, replacing base64 with hosted URLs
 * Call this before sending the email
 */
export async function processNewsletterImages(newsletter, userId) {
  const processed = JSON.parse(JSON.stringify(newsletter));
  const imageFields = ['logo', 'heroImage', 'image'];
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  const isLocalhost = !process.env.NEXT_PUBLIC_APP_URL || appUrl.includes('localhost') || appUrl.includes('127.0.0.1');

  const uploadCache = new Map();

  async function uploadLocalFile(relativePath) {
    if (uploadCache.has(relativePath)) return uploadCache.get(relativePath);

    try {
      const { readFile } = await import('fs/promises');
      const { join } = await import('path');
      const cleanPath = relativePath.startsWith('/') ? relativePath.slice(1) : relativePath;
      const filePath = join(process.cwd(), 'public', cleanPath);
      const buffer = await readFile(filePath);
      const ext = cleanPath.split('.').pop().toLowerCase();

      if (ext === 'svg') {
        const supabase = getSupabaseAdmin();
        const svgPath = `${userId || 'public'}/newsletters/local-assets/${Date.now()}-${Math.random().toString(36).slice(2, 7)}.svg`;
        const { error } = await supabase.storage
          .from(BUCKET_NAME)
          .upload(svgPath, buffer, { contentType: 'image/svg+xml', cacheControl: '31536000', upsert: true });
        if (error) throw new Error(error.message);
        const { data } = supabase.storage.from(BUCKET_NAME).getPublicUrl(svgPath);
        uploadCache.set(relativePath, data.publicUrl);
        return data.publicUrl;
      }

      const format = ext === 'jpg' ? 'jpeg' : (ext === 'png' ? 'png' : 'jpeg');
      const result = await processAndUploadImage(buffer, {
        userId: userId || 'public',
        folder: 'newsletters/local-assets',
        format,
      });
      uploadCache.set(relativePath, result.url);
      return result.url;
    } catch (err) {
      console.error(`Failed to upload local file ${relativePath}:`, err.message);
      return `${appUrl}${relativePath}`;
    }
  }

  async function processUrl(url, folder) {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('data:')) {
      try {
        const result = await base64ToHostedUrl(url, { userId, folder });
        console.log(`[IMG] base64 → ${result.url.substring(0, 80)}...`);
        return result.url;
      } catch (err) {
        console.error(`[IMG] Failed base64 upload:`, err.message);
        return url;
      }
    }

    // Detect localhost URLs and convert to relative path for upload
    if (isLocalhost && (url.startsWith('http://localhost') || url.startsWith('http://127.0.0.1'))) {
      try {
        const u = new URL(url);
        const relativePath = u.pathname;
        console.log(`[IMG] Localhost URL detected, uploading: ${relativePath}`);
        const result = await uploadLocalFile(relativePath);
        console.log(`[IMG] → ${result.substring(0, 80)}...`);
        return result;
      } catch (err) {
        console.error(`[IMG] Failed to upload localhost URL ${url}:`, err.message);
        return url;
      }
    }

    if (url.startsWith('http://') || url.startsWith('https://')) return url;
    if (url.startsWith('/') && isLocalhost) {
      console.log(`[IMG] Uploading local file: ${url}`);
      const result = await uploadLocalFile(url);
      console.log(`[IMG] → ${result.substring(0, 80)}...`);
      return result;
    }
    if (url.startsWith('/')) return `${appUrl}${url}`;
    return url;
  }

  async function processBlock(block) {
    if (!block) return;
    if (block.src) block.src = await processUrl(block.src, 'newsletters/blocks');
    if (block.image) block.image = await processUrl(block.image, 'newsletters/blocks');
    if (block.images && Array.isArray(block.images)) {
      for (let i = 0; i < block.images.length; i++) {
        block.images[i] = await processUrl(block.images[i], 'newsletters/blocks');
      }
    }
  }

  for (const section of processed.sections) {
    // Legacy section-level image fields
    for (const field of imageFields) {
      if (section[field]) {
        section[field] = await processUrl(section[field], `newsletters/${section.type}`);
      }
    }

    // New-format: section background image
    if (section.background?.image) {
      console.log(`[IMG] Section "${section.type}" bg image before: ${section.background.image.substring(0, 80)}`);
      section.background.image = await processUrl(section.background.image, 'newsletters/backgrounds');
      console.log(`[IMG] Section "${section.type}" bg image after:  ${section.background.image.substring(0, 80)}`);
    }

    // New-format: blocks within section
    if (Array.isArray(section.blocks)) {
      for (const block of section.blocks) {
        await processBlock(block);
      }
    }

    // Grid rows → columns → blocks
    if (Array.isArray(section.rows)) {
      for (const row of section.rows) {
        if (Array.isArray(row.columns)) {
          for (const col of row.columns) {
            if (Array.isArray(col.blocks)) {
              for (const block of col.blocks) {
                await processBlock(block);
              }
            }
          }
        }
      }
    }

    // Legacy collage images
    if (section.images && Array.isArray(section.images)) {
      for (let i = 0; i < section.images.length; i++) {
        section.images[i] = await processUrl(section.images[i], 'newsletters/collage');
      }
    }

    // Legacy profile images
    if (section.profiles && Array.isArray(section.profiles)) {
      for (const profile of section.profiles) {
        if (profile?.image) {
          profile.image = await processUrl(profile.image, 'newsletters/profiles');
        }
      }
    }
  }

  return processed;
}
