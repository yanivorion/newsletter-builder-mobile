// Email-compatible HTML export - Minified for smaller size
import { linksToHTML } from '../lib/textUtils';

// Google Fonts URL (shorter - only essential weights)
const GOOGLE_FONTS_URL = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&family=Noto+Sans+Hebrew:wght@400;600;700&display=swap';

// Minify HTML - removes whitespace, newlines, and compresses output
function minifyHTML(html) {
  return html
    .replace(/\s+/g, ' ')           // Collapse whitespace
    .replace(/>\s+</g, '><')        // Remove space between tags
    .replace(/\s*;\s*/g, ';')       // Remove space around semicolons
    .replace(/\s*:\s*/g, ':')       // Remove space around colons in styles
    .replace(/\s*,\s*/g, ',')       // Remove space around commas
    .replace(/;\s*"/g, '"')         // Remove trailing semicolon before quote
    .replace(/"\s+style/g, '" style') // Keep space before style attr
    .replace(/"\s+width/g, '" width') // Keep space before width attr
    .replace(/"\s+height/g, '" height')
    .replace(/"\s+align/g, '" align')
    .replace(/"\s+valign/g, '" valign')
    .replace(/"\s+cellspacing/g, '" cellspacing')
    .replace(/"\s+cellpadding/g, '" cellpadding')
    .replace(/"\s+border/g, '" border')
    .replace(/"\s+role/g, '" role')
    .replace(/"\s+alt/g, '" alt')
    .replace(/"\s+src/g, '" src')
    .replace(/"\s+href/g, '" href')
    .replace(/"\s+dir/g, '" dir')
    .replace(/"\s+colspan/g, '" colspan')
    .replace(/"\s+rowspan/g, '" rowspan')
    .replace(/"\s+bgcolor/g, '" bgcolor')
    .trim();
}

// Shorter font stacks for smaller output
const FONT_STACKS = {
  'Poppins': "Poppins,Arial,sans-serif",
  'Noto Sans Hebrew': "'Noto Sans Hebrew',Arial,sans-serif",
  'Inter': "Inter,Arial,sans-serif",
  'default': "Arial,sans-serif"
};

function getFontStack(fontFamily) {
  return FONT_STACKS[fontFamily] || FONT_STACKS['default'];
}

// Wrap content in container frame - compact output
function wrapWithContainer(content, container) {
  if (!container) return content;
  
  const pt = container.outerPaddingTop ?? container.outerPadding ?? 0;
  const pb = container.outerPaddingBottom ?? container.outerPadding ?? 0;
  const pl = container.outerPaddingLeft ?? container.outerPadding ?? 0;
  const pr = container.outerPaddingRight ?? container.outerPadding ?? 0;
  const bg = container.outerBackgroundColor || 'transparent';
  const bw = container.innerBorderWidth || 0;
  const bc = container.innerBorderColor || '#E5E5E5';
  const br = container.innerBorderRadius || 0;
  const ibg = container.innerBackgroundColor || 'transparent';
  const img = container.backgroundImage;
  
  // Skip if no styling needed
  if (pt === 0 && pb === 0 && pl === 0 && pr === 0 && bg === 'transparent' && bw === 0 && br === 0 && ibg === 'transparent' && !img) {
    return content;
  }
  
  let s = `background-color:${ibg};`;
  if (bw > 0) s += `border:${bw}px solid ${bc};`;
  if (br > 0) s += `border-radius:${br}px;`;
  const imgRow = img ? `<tr><td style="padding:0;font-size:0;line-height:0;"><img src="${img}" alt="" width="100%" style="display:block;width:100%;height:auto;" /></td></tr>` : '';
  
  return `<tr><td style="background-color:${bg};padding:${pt}px ${pr}px ${pb}px ${pl}px"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="${s}">${imgRow}${content}</table></td></tr>`;
}

// Shared helpers (used by both exportToHTML and exportForGmail)

function wrapLegacyRowAsBlock(html) {
  if (!html) return '';
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">${html}</table>`;
}

function blockToHtml(block) {
  switch (block.type) {
    case 'text': {
      const dirAttr = block.direction === 'rtl' ? ' dir="rtl"' : '';
      const content = linksToHTML((block.content || '')).replace(/\n/g, '<br>');
      const fontStack = getFontStack(block.fontFamily || 'Poppins');
      return `<div${dirAttr} style="font-family:${fontStack};font-size:${block.fontSize || 16}px;color:${block.color || '#333333'};text-align:${block.textAlign || 'center'};line-height:${block.lineHeight || 1.6};padding:${block.padding || 0}px 0;">${content}</div>`;
    }
    case 'title': {
      const titleText = block.text || '';
      const wrapLink = (inner) => block.link ? `<a href="${block.link}" style="color:inherit;text-decoration:none;">${inner}</a>` : inner;
      if (block.backgroundColor) {
        const chevron = block.showChevron ? `<span style="display:inline-flex;align-items:center;justify-content:center;width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.25);color:${block.color || '#FFFFFF'};font-size:16px;">&#8250;</span>` : '';
        return `<div style="padding:4px 0;text-align:${block.textAlign || 'left'};">${wrapLink(`<div style="display:inline-flex;align-items:center;justify-content:space-between;width:${block.maxWidth || '100%'};box-sizing:border-box;padding:${block.padding || 10}px ${(block.padding || 10) + 8}px;background:${block.backgroundColor};border-radius:${block.borderRadius || 24}px;"><span style="font-size:${block.fontSize || 14}px;font-weight:${block.fontWeight || 600};color:${block.color || '#FFFFFF'};letter-spacing:${block.letterSpacing || '0.06em'};font-style:${block.fontStyle || 'normal'};">${titleText}</span>${chevron}</div>`)}</div>`;
      }
      return `<div style="padding:${block.padding || 0}px 0;text-align:${block.textAlign || 'center'};"><h2 style="margin:0;font-size:${block.fontSize || 18}px;font-weight:${block.fontWeight || 700};color:${block.color || '#FFFFFF'};letter-spacing:${block.letterSpacing || '0.1em'};line-height:${block.lineHeight || 1.2};font-style:${block.fontStyle || 'normal'};">${wrapLink(titleText)}</h2></div>`;
    }
    case 'marquee': return wrapLegacyRowAsBlock(exportMarquee(block));
    case 'animatedText': {
      const fontStack = getFontStack(block.fontFamily || 'Impact');
      const tt = block.textTransform || 'uppercase';
      const txt = tt === 'uppercase'
        ? (block.text || '').toUpperCase()
        : tt === 'lowercase'
          ? (block.text || '').toLowerCase()
          : tt === 'capitalize' && block.text
            ? block.text.charAt(0).toUpperCase() + block.text.slice(1).toLowerCase()
            : (block.text || '');
      return `<div style="background:${block.backgroundColor || '#0A0A0A'};padding:${block.paddingY ?? 48}px ${block.paddingX ?? 24}px;text-align:${block.textAlign || 'center'};overflow:hidden;"><div style="font-family:${fontStack};font-size:${block.fontSize || 96}px;font-weight:${block.fontWeight || 900};letter-spacing:${block.letterSpacing || '-0.02em'};line-height:${block.lineHeightRatio || 0.95};color:${block.textColor || '#FF2D2D'};white-space:nowrap;display:inline-block;max-width:100%;">${txt}</div></div>`;
    }
    case 'promoCard': return wrapLegacyRowAsBlock(exportPromoCard(block));
    case 'multiLayout': return exportMultiLayout(block);
    case 'imageCollage': return wrapLegacyRowAsBlock(exportImageCollage(block));
    case 'profileCards': return wrapLegacyRowAsBlock(exportProfileCards(block));
    case 'recipe': return wrapLegacyRowAsBlock(exportRecipe(block));
    case 'logo': {
      if (block.rightText) {
        return `<table width="100%" cellpadding="0" cellspacing="0" style="padding:8px 0;"><tr><td style="text-align:left;">${block.src ? `<img src="${block.src}" alt="Logo" width="${block.width || 120}" style="display:inline-block;" />` : ''}</td><td style="text-align:right;font-size:${block.rightTextFontSize || 11}px;font-weight:${block.rightTextFontWeight || 500};color:${block.rightTextColor || '#FFFFFF'};letter-spacing:${block.rightTextLetterSpacing || '0.05em'};text-transform:uppercase;font-family:Poppins,Arial,sans-serif;">${block.rightText}</td></tr></table>`;
      }
      return block.src ? `<div style="text-align:${block.alignment || 'center'};padding:8px 0;"><img src="${block.src}" alt="Logo" width="${block.width || 120}" style="display:inline-block;" /></div>` : '';
    }
    case 'image': {
      if (!block.src) return '';
      const imgW = block.width && block.width !== '100%' ? `width:${typeof block.width === 'number' ? block.width + 'px' : block.width};` : 'width:100%;';
      const imgH = typeof block.height === 'number' ? `height:${block.height}px;` : '';
      const imgFit = imgH ? `object-fit:${block.objectFit || 'cover'};` : '';
      const imgBr = block.borderRadius ? `border-radius:${block.borderRadius}px;` : '';
      const imgAlign = block.width && block.width !== '100%' ? `text-align:${block.alignment || 'center'};` : '';
      const imgTag = `<img src="${block.src}" alt="${block.alt || ''}" style="display:block;${imgW}${imgH}${imgFit}${imgBr}" />`;
      return imgAlign ? `<div style="${imgAlign}">${imgTag}</div>` : imgTag;
    }
    case 'imageSequence': {
      const seqImages = block.images || [];
      if (seqImages.length === 0) return '';
      return `<img src="${seqImages[0]}" alt="Image sequence" style="display:block;width:100%;" />`;
    }
    case 'button': return `<div style="text-align:${block.align || 'center'};padding:8px 0;"><a href="${block.url || '#'}" style="display:inline-block;padding:${block.paddingV || 14}px ${block.paddingH || 32}px;background:${block.backgroundColor || '#04D1FC'};color:${block.textColor || '#FFFFFF'};border-radius:${block.borderRadius || 8}px;font-size:${block.fontSize || 16}px;font-weight:${block.fontWeight || '600'};text-decoration:none;">${block.text || 'Click Here'}</a></div>`;
    case 'divider': return `<hr style="border:none;border-top:${block.thickness || 1}px ${block.style || 'solid'} ${block.color || '#E5E7EB'};margin:${block.marginTop || 8}px 16px ${block.marginBottom || 8}px;" />`;
    case 'spacer': return `<div style="height:${block.height || 24}px;"></div>`;
    case 'socialLinks': {
      const links = block.links || {};
      const icons = Object.entries(links).filter(([, url]) => url && url !== '#').map(([p, url]) => {
        const labels = { facebook: 'f', x: '𝕏', twitter: '𝕏', linkedin: 'in', instagram: '📷', youtube: '▶', tiktok: '♪' };
        return `<a href="${url}" style="display:inline-block;width:${block.iconSize || 24}px;height:${block.iconSize || 24}px;line-height:${block.iconSize || 24}px;text-align:center;text-decoration:none;color:${block.color || '#4B5563'};font-size:${Math.floor((block.iconSize || 24) * 0.6)}px;font-weight:bold;margin:0 4px;border-radius:50%;background-color:#f0f0f0;">${labels[p] || p[0]}</a>`;
      }).join('');
      return icons ? `<div style="text-align:${block.align || 'center'};padding:8px 0;">${icons}</div>` : '';
    }
    case 'companyInfo': return block.text ? `<p style="text-align:${block.align || 'center'};color:${block.color || '#374151'};font-size:${block.fontSize || 14}px;padding:8px 0;margin:0;">${block.text}</p>` : '';
    case 'footerLinks': {
      const links = block.links || [];
      return links.length ? `<div style="text-align:${block.align || 'center'};padding:8px 0;">${links.map((l, i) => `<a href="${l.url || '#'}" style="color:${block.color || '#374151'};font-size:${block.fontSize || 14}px;text-decoration:none;">${l.text}</a>${i < links.length - 1 ? '<span style="margin:0 8px;opacity:0.5;">|</span>' : ''}`).join('')}</div>` : '';
    }
    default: return '';
  }
}

function sectionBgStyle(section) {
  const bg = section.background || {};
  if (bg.type === 'solid') return `background-color: ${bg.color || '#FFFFFF'};`;
  if (bg.type === 'gradient') {
    const start = bg.gradientStart || '#04D1FC';
    const end = bg.gradientEnd || '#17A298';
    const angle = bg.gradientAngle ?? 180;
    return `background-color: ${start};background: linear-gradient(${angle}deg, ${start}, ${end});`;
  }
  if (bg.type === 'image') return `background-color: ${bg.fallbackColor || bg.color || '#FFFFFF'};`;
  return '';
}

function sectionBgImageRow(section) {
  const bg = section.background || {};
  if (bg.type !== 'image' || !bg.image) return '';
  const fallback = bg.fallbackColor || bg.color || '#FFFFFF';
  return `<tr><td style="padding:0;font-size:0;line-height:0;background-color:${fallback};"><img src="${bg.image}" alt="" border="0" width="100%" style="display:block;width:100%;height:auto;border:0;border:none;outline:none;-ms-interpolation-mode:bicubic;background-color:${fallback};" /></td></tr>`;
}

function sectionHeightStyle(section) {
  const bg = section.background || {};
  if (bg.type === 'image' && bg.image) return '';
  return '';
}

function renderSectionHtml(section, { isFirst = false, sectionPaddingTop = 20 } = {}) {
  if (section.type === 'footer') return null;

  const bgStyle = sectionBgStyle(section);
  const hStyle = sectionHeightStyle(section);
  const bgImgRow = sectionBgImageRow(section);
  const pad = section.padding || {};
  const extraTop = !isFirst ? sectionPaddingTop : 0;
  const padStyle = `padding: ${(pad.top ?? 24) + extraTop}px ${pad.right ?? 24}px ${pad.bottom ?? 24}px ${pad.left ?? 24}px;`;
  const br = section.borderRadius ?? 0;

  if (Array.isArray(section.rows) && section.rows.length > 0) {
    const nonEmptyRows = section.rows.filter(row =>
      row.columns.some(col => col.blocks && col.blocks.length > 0)
    );
    const rowsHtml = nonEmptyRows.map(row => {
      const totalSpan = row.columns.reduce((sum, c) => sum + c.span, 0) || 12;
      const colsHtml = row.columns.map(col => {
        const widthPercent = Math.round((col.span / totalSpan) * 10000) / 100;
        const cellBlocks = (col.blocks || []).map(b => blockToHtml(b)).join('\n');
        return `<td width="${widthPercent}%" style="width:${widthPercent}%;vertical-align:top;padding:0 4px;" valign="top">${cellBlocks}</td>`;
      }).join('');
      return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;table-layout:fixed;"><tr>${colsHtml}</tr></table>`;
    }).join('\n');
    if (!rowsHtml && !bgImgRow) return wrapSectionRadius(`<tr><td style="${bgStyle}${padStyle}">&nbsp;</td></tr>`, br, bgStyle);
    const sectionContent = `${bgImgRow}${rowsHtml ? `<tr><td style="${bgStyle}${hStyle}${padStyle}">${rowsHtml}</td></tr>` : ''}`;
    return wrapSectionRadius(sectionContent, br, bgStyle);
  }

  if (Array.isArray(section.blocks)) {
    const blocksHtml = section.blocks.map(block => blockToHtml(block)).join('\n');
    const sectionContent = `${bgImgRow}<tr><td style="${bgStyle}${hStyle}${padStyle}">${blocksHtml}</td></tr>`;
    return wrapSectionRadius(sectionContent, br, bgStyle);
  }

  return null;
}

// Wrap an entire section's <tr> content in a border-radius clipping div.
// Uses a single-cell table inside a div with overflow:hidden.
function wrapSectionRadius(trContent, br, bgStyle) {
  if (br <= 0) return trContent;
  return `<tr><td style="padding:0;"><div style="border-radius:${br}px;overflow:hidden;${bgStyle}"><table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">${trContent}</table></div></td></tr>`;
}

/**
 * Resolve all relative image URLs in a newsletter by uploading
 * them to Supabase. Call this before exportToHTML/exportForGmail
 * to ensure the HTML works outside the app.
 *
 * Returns a deep clone with all /paths replaced by hosted URLs.
 */
export async function resolveNewsletterImages(newsletter, userId) {
  if (!newsletter?.sections) return newsletter;

  const clone = JSON.parse(JSON.stringify(newsletter));
  const uploadCache = {};

  async function resolve(url) {
    if (!url || typeof url !== 'string') return url;
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) return url;
    if (!url.startsWith('/')) return url;

    if (uploadCache[url]) return uploadCache[url];

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Fetch ${url} failed`);
      const blob = await res.blob();
      const ext = url.split('.').pop().split('?')[0] || 'png';
      const filename = `asset-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

      const formData = new FormData();
      formData.append('file', blob, filename);
      formData.append('userId', userId || 'public');
      formData.append('folder', 'newsletters/exported-assets');

      const uploadRes = await fetch('/api/images/upload', {
        method: 'POST',
        body: formData,
      });
      if (!uploadRes.ok) throw new Error('Upload failed');
      const data = await uploadRes.json();
      uploadCache[url] = data.url;
      return data.url;
    } catch (err) {
      console.warn(`Failed to resolve image ${url}:`, err.message);
      return url;
    }
  }

  async function processBlock(block) {
    if (!block) return;
    if (block.src) block.src = await resolve(block.src);
    if (block.image) block.image = await resolve(block.image);
    if (block.heroImage) block.heroImage = await resolve(block.heroImage);
    if (block.logo) block.logo = await resolve(block.logo);
    if (block.gifUrl) block.gifUrl = await resolve(block.gifUrl);
    if (Array.isArray(block.images)) {
      for (let i = 0; i < block.images.length; i++) {
        block.images[i] = await resolve(block.images[i]);
      }
    }
    if (Array.isArray(block.items)) {
      for (const item of block.items) {
        if (item.type === 'image' && item.src) {
          item.src = await resolve(item.src);
        }
      }
    }
    if (Array.isArray(block.profiles)) {
      for (const p of block.profiles) {
        if (p.image) p.image = await resolve(p.image);
      }
    }
  }

  for (const section of clone.sections) {
    if (section.logo) section.logo = await resolve(section.logo);
    if (section.heroImage) section.heroImage = await resolve(section.heroImage);
    if (section.image) section.image = await resolve(section.image);
    if (section.gifUrl) section.gifUrl = await resolve(section.gifUrl);

    if (section.container?.backgroundImage) {
      section.container.backgroundImage = await resolve(section.container.backgroundImage);
    }

    if (Array.isArray(section.rows)) {
      for (const row of section.rows) {
        for (const col of row.columns || []) {
          for (const block of col.blocks || []) {
            await processBlock(block);
          }
        }
      }
    }
    if (Array.isArray(section.blocks)) {
      for (const block of section.blocks) {
        await processBlock(block);
      }
    }

    await processBlock(section);
  }

  return clone;
}

export function exportToHTML(newsletter) {
  if (!newsletter || !newsletter.sections) {
    return '';
  }

  // Page settings with defaults
  const pageSettings = newsletter.pageSettings || {};
  const outerBg = pageSettings.outerBackgroundColor || '#F5F5F5';
  const outerPadding = pageSettings.outerPadding ?? 20;
  const innerBg = pageSettings.innerBackgroundColor || '#FFFFFF';
  const innerBorderWidth = pageSettings.innerBorderWidth ?? 0;
  const innerBorderColor = pageSettings.innerBorderColor || '#E5E5E5';
  const innerBorderRadius = pageSettings.innerBorderRadius ?? 0;
  const sectionGap = pageSettings.sectionGap ?? 16;
  const sectionPaddingTop = pageSettings.sectionPaddingTop ?? 20;

  const renderedSections = newsletter.sections.map((section, idx) => {
    const isFirst = idx === 0;
    const rendered = renderSectionHtml(section, { isFirst, sectionPaddingTop });
    if (rendered !== null) return rendered;

    const br = section.borderRadius ?? 0;
    const bgStyle = sectionBgStyle(section);

    let content;
    switch (section.type) {
      case 'header':
        content = exportHeader(section);
        break;
      case 'marquee':
        content = exportMarquee(section);
        break;
      case 'text':
        content = exportText(section);
        break;
      case 'sectionHeader':
        content = exportSectionHeader(section);
        break;
      case 'accentText':
        content = exportAccentText(section);
        break;
      case 'promoCard':
        content = exportPromoCard(section);
        break;
      case 'imageCollage':
        content = exportImageCollage(section);
        break;
      case 'profileCards':
        content = exportProfileCards(section);
        break;
      case 'recipe':
        content = exportRecipe(section);
        break;
      case 'footer':
        content = exportFooter(section);
        break;
      default:
        content = '';
    }
    let wrapped = section.container ? wrapWithContainer(content, section.container) : content;
    if (!isFirst && wrapped) {
      wrapped = `<tr><td style="height:${sectionPaddingTop}px;font-size:0;line-height:0;">&nbsp;</td></tr>${wrapped}`;
    }
    return wrapSectionRadius(wrapped, br, bgStyle);
  });

  const gapRow = sectionGap > 0
    ? `<tr><td style="height:${sectionGap}px;font-size:0;line-height:0;background-color:${innerBg};">&nbsp;</td></tr>`
    : '';
  const sections = renderedSections.filter(Boolean).join(`\n${gapRow}\n`);

  // Build inner container: use a wrapper div for reliable border-radius clipping
  const innerTableStyle = `background-color:${innerBg};${innerBorderWidth > 0 ? `border:${innerBorderWidth}px solid ${innerBorderColor};` : ''}`;
  const needsRadius = innerBorderRadius > 0;
  const innerWrapStart = needsRadius
    ? `<div style="border-radius:${innerBorderRadius}px;overflow:hidden;background-color:${innerBg};">`
    : '';
  const innerWrapEnd = needsRadius ? '</div>' : '';

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml" xmlns:o="urn:schemas-microsoft-com:office:office">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <meta name="x-apple-disable-message-reformatting">
  <title>Newsletter</title>
  
  <!--[if mso]>
  <noscript>
    <xml>
      <o:OfficeDocumentSettings>
        <o:PixelsPerInch>96</o:PixelsPerInch>
        <o:AllowPNG/>
      </o:OfficeDocumentSettings>
    </xml>
  </noscript>
  <![endif]-->
  
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="${GOOGLE_FONTS_URL}" rel="stylesheet">
  
  <style type="text/css">
    @import url('${GOOGLE_FONTS_URL}');
    
    * { box-sizing: border-box; }
    body { margin: 0; padding: 0; }
    body, table, td, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; }
    img { -ms-interpolation-mode: bicubic; border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    
    .email-container { width: 100% !important; max-width: 700px !important; }
    
    @media screen and (max-width: 700px) {
      .email-container { width: 100% !important; }
      .stack-column { display: block !important; width: 100% !important; }
    }
  </style>
  
  <!--[if mso]>
  <style type="text/css">
    body, table, td, p, a, span { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin: 0; padding: 0; background-color: ${outerBg}; font-family: ${FONT_STACKS['default']}; -webkit-font-smoothing: antialiased;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; background-color: ${outerBg};">
    <tr>
      <td align="center" style="padding: ${outerPadding}px 10px; background-color: ${outerBg};">
        <!--[if mso]>
        <table role="presentation" align="center" border="0" cellspacing="0" cellpadding="0" width="700">
        <tr>
        <td>
        <![endif]-->
        ${innerWrapStart}
        <table role="presentation" class="email-container" width="700" cellspacing="0" cellpadding="0" border="0" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; ${innerTableStyle} margin: 0 auto;">
          ${sections}
        </table>
        ${innerWrapEnd}
        <!--[if mso]>
        </td>
        </tr>
        </table>
        <![endif]-->
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Export for Gmail paste - cleaner version without full HTML structure
export function exportForGmail(newsletter) {
  if (!newsletter || !newsletter.sections) {
    return '';
  }

  // Page settings with defaults
  const pageSettings = newsletter.pageSettings || {};
  const outerBg = pageSettings.outerBackgroundColor || '#F5F5F5';
  const outerPadding = pageSettings.outerPadding ?? 20;
  const innerBg = pageSettings.innerBackgroundColor || '#FFFFFF';
  const innerBorderWidth = pageSettings.innerBorderWidth ?? 0;
  const innerBorderColor = pageSettings.innerBorderColor || '#E5E5E5';
  const innerBorderRadius = pageSettings.innerBorderRadius ?? 0;
  const sectionGap = pageSettings.sectionGap ?? 16;
  const sectionPaddingTop = pageSettings.sectionPaddingTop ?? 20;

  const renderedSections = newsletter.sections.map((section, idx) => {
    const isFirst = idx === 0;
    const rendered = renderSectionHtml(section, { isFirst, sectionPaddingTop });
    if (rendered !== null) {
      return section.container ? wrapWithContainer(rendered, section.container) : rendered;
    }

    const br = section.borderRadius ?? 0;
    const bgStyle = sectionBgStyle(section);

    let content;
    switch (section.type) {
      case 'header':
        content = exportHeader(section, true);
        break;
      case 'marquee':
        content = exportMarquee(section);
        break;
      case 'text':
        content = exportText(section);
        break;
      case 'sectionHeader':
        content = exportSectionHeader(section);
        break;
      case 'accentText':
        content = exportAccentText(section);
        break;
      case 'promoCard':
        content = exportPromoCard(section, true);
        break;
      case 'imageCollage':
        content = exportImageCollage(section, true);
        break;
      case 'profileCards':
        content = exportProfileCards(section);
        break;
      case 'recipe':
        content = exportRecipe(section, true);
        break;
      case 'footer':
        content = exportFooter(section);
        break;
      default:
        content = '';
    }
    let wrapped = section.container ? wrapWithContainer(content, section.container) : content;
    if (!isFirst && wrapped) {
      wrapped = `<tr><td style="height:${sectionPaddingTop}px;font-size:0;line-height:0;">&nbsp;</td></tr>${wrapped}`;
    }
    return wrapSectionRadius(wrapped, br, bgStyle);
  });

  const gapRow = sectionGap > 0
    ? `<tr><td style="height:${sectionGap}px;font-size:0;line-height:0;background-color:${innerBg};">&nbsp;</td></tr>`
    : '';
  const sections = renderedSections.filter(Boolean).join(`\n${gapRow}\n`);

  // Use a wrapper div with overflow:hidden for border-radius clipping.
  // The outer table provides the background color so clipped corners
  // reveal it instead of black.
  const innerTableStyle = `background-color:${innerBg};${innerBorderWidth > 0 ? `border:${innerBorderWidth}px solid ${innerBorderColor};` : ''}`;
  const needsRadius = innerBorderRadius > 0;

  const innerTable = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;width:700px;${innerTableStyle}table-layout:fixed;font-family:${FONT_STACKS['default']};">${sections}</table>`;

  let html;
  if (needsRadius) {
    html = `<table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:0 auto;width:700px;background-color:${outerBg};"><tr><td style="padding:${outerPadding}px;background-color:${outerBg};"><div style="border-radius:${innerBorderRadius}px;overflow:hidden;background-color:${innerBg};">${innerTable}</div></td></tr></table>`;
  } else {
    html = innerTable;
  }
  
  return minifyHTML(html);
}

function exportHeader(section, isGmail = false) {
  const bgStyle = section.gradientEnd 
    ? `background: linear-gradient(180deg, ${section.backgroundColor || '#4A90D9'} 0%, ${section.gradientEnd} 100%); background-color: ${section.backgroundColor || '#4A90D9'};`
    : `background-color: ${section.backgroundColor || '#4A90D9'};`;

  const logoWidth = section.logoWidth || 120;
  const logoHeight = section.logoHeight === 'auto' ? 'auto' : `${section.logoHeight}px`;
  const logoAlignment = section.logoAlignment || 'center';
  
  const titleFontSize = section.titleFontSize || 28;
  const titleFontWeight = section.titleFontWeight || '700';
  const titleFontStyle = section.titleFontStyle || 'normal';
  const titleLetterSpacing = section.titleLetterSpacing || '-0.02em';
  const titleLineHeight = section.titleLineHeight || 1.2;
  
  const subtitleFontSize = section.subtitleFontSize || 16;
  const subtitleFontWeight = section.subtitleFontWeight || '400';
  const textColor = section.textColor || '#ffffff';
  const fontStack = FONT_STACKS['Poppins'];

  // Date badge
  const badgeHtml = section.showDateBadge && section.dateBadgeText ? `
    <tr>
      <td align="right" style="padding: 0 20px 16px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
          <tr>
            <td style="background-color: ${section.dateBadgeBg || '#04D1FC'}; color: ${section.dateBadgeColor || '#ffffff'}; padding: 6px 14px; border-radius: 4px; font-size: 12px; font-weight: 600; font-family: ${fontStack}; letter-spacing: 0.05em;">
              ${section.dateBadgeText}
            </td>
          </tr>
        </table>
      </td>
    </tr>` : '';

  // Hero image - use 100% width for Gmail auto-fit
  const heroImageHeight = section.heroImageHeight || 200;
  const heroImageHtml = section.heroImage ? `
    <tr>
      <td align="center" style="padding: 0 20px 24px;">
        <img src="${section.heroImage}" alt="Hero" style="width: 100%; max-width: 560px; height: auto; display: block; border-radius: 8px;" />
      </td>
    </tr>` : '';

  // Logo - use percentage-based max-width for Gmail
  const logoStyle = isGmail 
    ? `max-width: ${logoWidth}px; height: auto; display: block; object-fit: contain;`
    : `width: ${logoWidth}px; height: ${logoHeight}; display: block; object-fit: contain;`;

  return `
    <tr>
      <td style="${bgStyle}">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed">
          ${section.logo ? `
          <tr>
            <td align="${logoAlignment}" style="padding: 40px 20px 20px;">
              <img src="${section.logo}" alt="Logo" style="${logoStyle}" />
            </td>
          </tr>` : ''}
          ${heroImageHtml}
          <tr>
            <td align="center" style="padding: 0 20px ${section.showDateBadge ? '20px' : '40px'};">
              <h1 style="margin: 0 0 10px; font-size: ${titleFontSize}px; font-weight: ${titleFontWeight}; font-style: ${titleFontStyle}; letter-spacing: ${titleLetterSpacing}; font-family: ${fontStack}; line-height: ${titleLineHeight}; color: ${textColor};">
                ${linksToHTML(section.title || '')}
              </h1>
              ${section.subtitle ? `<p style="margin: 0; font-size: ${subtitleFontSize}px; font-weight: ${subtitleFontWeight}; opacity: 0.95; font-family: ${fontStack}; line-height: 1.4; color: ${textColor};">${section.subtitle}</p>` : ''}
            </td>
          </tr>
          ${badgeHtml}
        </table>
      </td>
    </tr>`;
}

function exportMarquee(section) {
  const rawItems = section.items;
  const items = Array.isArray(rawItems)
    ? rawItems
    : (typeof rawItems === 'string'
      ? rawItems.split(',').map(s => s.trim()).filter(Boolean).map(v => ({ type: 'text', value: v }))
      : []);
  const separator = section.separator || '•';
  const fontSize = section.fontSize || 14;
  const fontWeight = section.fontWeight || '500';
  const paddingVertical = section.paddingVertical || 10;
  const imgSize = section.imageSize || 24;
  const fontStack = FONT_STACKS['Poppins'];

  const itemsHtml = items.map((item, i) => {
    const sep = i < items.length - 1
      ? `<span style="opacity: 0.5; margin: 0 12px;">${separator}</span>`
      : '';
    if (item.type === 'image' && item.src) {
      return `<img src="${item.src}" alt="" width="${imgSize}" height="${imgSize}" style="display:inline-block;vertical-align:middle;" />${sep}`;
    }
    return `<span style="white-space: nowrap;">${item.value || ''}</span>${sep}`;
  }).join('');

  const rows = Math.max(1, parseInt(section.rows) || 1);
  const rowGap = Math.max(0, parseInt(section.rowGap) || 0);
  const rowHtml = Array.from({ length: rows }, (_, i) => `
    <div style="white-space:nowrap;${i > 0 && rowGap > 0 ? `margin-top:${rowGap}px;` : ''}">${itemsHtml}</div>
  `).join('');

  return `
    <tr>
      <td style="background-color: ${section.backgroundColor || '#04D1FC'}; padding: ${paddingVertical}px 20px; text-align: center; color: ${section.textColor || '#ffffff'}; font-family: ${fontStack}; font-size: ${fontSize}px; font-weight: ${fontWeight}; letter-spacing: ${section.letterSpacing || '0.02em'};">
        ${rowHtml}
      </td>
    </tr>`;
}

function exportText(section) {
  const dirAttr = section.direction === 'rtl' ? 'dir="rtl"' : '';
  const content = linksToHTML((section.content || '')).replace(/\n/g, '<br>');
  const fontFamily = section.fontFamily || 'Poppins';
  const fontStack = getFontStack(fontFamily);
  
  return `
    <tr>
      <td ${dirAttr} style="background-color: ${section.backgroundColor || '#ffffff'}; padding: ${section.padding || 40}px 20px; font-family: ${fontStack}; font-size: ${section.fontSize || 16}px; color: ${section.color || '#333333'}; text-align: ${section.textAlign || 'center'}; line-height: 1.6;">
        ${content}
      </td>
    </tr>`;
}

function exportSectionHeader(section) {
  const fontStack = FONT_STACKS['Poppins'];
  const bgColor = section.backgroundColor || '#04D1FC';
  const gradientEnd = section.gradientEnd;
  const gradientDirection = section.gradientDirection || '90deg';
  
  const bgStyle = gradientEnd 
    ? `background: linear-gradient(${gradientDirection}, ${bgColor} 0%, ${gradientEnd} 100%); background-color: ${bgColor};`
    : `background-color: ${bgColor};`;
  
  const paddingTop = section.paddingTop ?? section.padding ?? 14;
  const paddingBottom = section.paddingBottom ?? section.padding ?? 14;
  const paddingLeft = section.paddingLeft ?? 24;
  const paddingRight = section.paddingRight ?? 24;
  const borderRadius = section.borderRadius || 0;
  
  // Use table for border-radius support
  return `
    <tr>
      <td style="padding: 0;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed">
          <tr>
            <td style="${bgStyle} color: ${section.color || '#ffffff'}; padding: ${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px; text-align: center; font-family: ${fontStack}; font-size: ${section.fontSize || 14}px; font-weight: ${section.fontWeight || 600}; letter-spacing: ${section.letterSpacing || '0.08em'}; text-transform: uppercase; border-radius: ${borderRadius}px;">
              ${section.text || ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function exportAccentText(section) {
  const fontFamily = section.fontFamily || 'Poppins';
  const fontStack = getFontStack(fontFamily);
  const direction = section.direction || 'ltr';
  const textAlign = section.contentAlign || 'left';
  const padding = section.padding || 40;
  const paddingTop = section.paddingTop ?? padding;
  const paddingBottom = section.paddingBottom ?? padding;
  const paddingLeft = section.paddingLeft ?? padding;
  const paddingRight = section.paddingRight ?? padding;
  const tagToContentGap = section.tagToContentGap ?? 40;
  
  const content = linksToHTML((section.content || '')).replace(/\n\n/g, '</p><p style="margin: 0 0 1em;">').replace(/\n/g, '<br>');
  
  // Tag badge - use nested table for proper centering
  const tagAlign = section.tagPosition === 'top-left' ? 'left' : 'right';
  const tagHtml = section.tagText ? `
    <tr>
      <td align="${tagAlign}" style="padding-bottom: ${tagToContentGap}px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
          <tr>
            <td align="center" valign="middle" style="background-color: ${section.tagBackgroundColor || '#04D1FC'}; color: ${section.tagTextColor || '#FFFFFF'}; padding: 10px 24px; border-radius: ${section.tagBorderRadius || 8}px; font-size: ${section.tagFontSize || 14}px; font-weight: 600; font-family: ${fontStack}; line-height: 1.2; mso-padding-alt: 12px 24px;">
              ${section.tagText}
            </td>
          </tr>
        </table>
      </td>
    </tr>` : '';
  
  return `
    <tr>
      <td dir="${direction}" style="background-color: ${section.backgroundColor || '#FFFFFF'}; padding: ${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="mso-table-lspace: 0pt; mso-table-rspace: 0pt; font-family: ${fontStack};">
          ${tagHtml}
          <tr>
            <td style="font-size: ${section.contentFontSize || 18}px; line-height: ${section.contentLineHeight || 1.8}; color: ${section.contentColor || '#333333'}; text-align: ${textAlign}; font-family: ${fontStack};">
              <p style="margin: 0;">${content}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function exportPromoCard(section, isGmail = false) {
  const fontFamily = section.fontFamily || 'Poppins';
  const fontStack = getFontStack(fontFamily);
  const direction = section.direction || 'ltr';
  const textAlign = section.contentAlign || 'left';
  const padding = section.padding || 32;
  const paddingTop = section.paddingTop ?? padding;
  const paddingBottom = section.paddingBottom ?? padding;
  const paddingLeft = section.paddingLeft ?? padding;
  const paddingRight = section.paddingRight ?? padding;
  const titleToBodyGap = section.titleToBodyGap ?? 16;
  const bodyToCtaGap = section.bodyToCtaGap ?? 20;
  const gap = section.gap || 24;
  
  const body = linksToHTML((section.body || '')).replace(/\n\n/g, '</p><p style="margin: 0.8em 0 0;">').replace(/\n/g, '<br>');
  
  // Image dimensions - fixed size with object-fit cover
  const imageWidth = section.imageWidth || 200;
  const imageHeight = section.imageHeight || 160;
  const imageBorderRadius = section.imageBorderRadius || 12;
  
  // Determine layout based on direction and image position
  const imagePosition = section.imagePosition || 'right';
  const isImageFirst = (direction === 'rtl' && imagePosition === 'right') || (direction === 'ltr' && imagePosition === 'left');
  
  // Fixed size container with image using object-fit: cover
  const imageCell = section.image ? `
    <td width="${imageWidth}" valign="${section.verticalAlign || 'middle'}" style="vertical-align: ${section.verticalAlign || 'middle'}; width: ${imageWidth}px;">
      <div style="width: ${imageWidth}px; height: ${imageHeight}px; border-radius: ${imageBorderRadius}px; overflow: hidden;">
        <img src="${section.image}" alt="Promo" style="width: ${imageWidth}px; height: ${imageHeight}px; display: block; object-fit: cover;" />
      </div>
    </td>` : '';
  
  const gapCell = section.image ? `<td width="${gap}" style="width: ${gap}px;"></td>` : '';
  
  const contentCell = `
    <td valign="${section.verticalAlign || 'middle'}" style="vertical-align: ${section.verticalAlign || 'middle'}; text-align: ${textAlign};">
      <h3 style="margin: 0 0 ${titleToBodyGap}px; font-family: ${fontStack}; font-size: ${section.titleFontSize || 28}px; font-weight: ${section.titleFontWeight || 700}; color: ${section.titleColor || '#1A1A1A'}; line-height: 1.3;">
        ${linksToHTML(section.title || 'Card Title')}
      </h3>
      <div style="font-family: ${fontStack}; font-size: ${section.bodyFontSize || 16}px; line-height: ${section.bodyLineHeight || 1.7}; color: ${section.bodyColor || '#555555'}; margin-bottom: ${section.showCta !== false ? bodyToCtaGap + 'px' : '0'};">
        <p style="margin: 0;">${body}</p>
      </div>
      ${section.showCta !== false && section.ctaText ? `
        <a href="${section.ctaLink || '#'}" style="color: ${section.ctaColor || '#04D1FC'}; font-family: ${fontStack}; font-size: ${section.ctaFontSize || 16}px; font-weight: ${section.ctaFontWeight || 500}; text-decoration: none;">
          ${section.ctaText}
        </a>` : ''}
    </td>`;
  
  const rowContent = isImageFirst 
    ? imageCell + gapCell + contentCell 
    : contentCell + gapCell + imageCell;
  
  return `
    <tr>
      <td style="background-color: ${section.backgroundColor || '#F8F9FA'}; padding: ${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px; border-radius: ${section.borderRadius || 16}px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" dir="${direction}" style="table-layout:fixed;">
          <tr>
            ${rowContent}
          </tr>
        </table>
      </td>
    </tr>`;
}

// Collage layout presets
const COLLAGE_PRESETS = {
  'single': [[1]],
  'single-wide': [[1, 1]],
  '2-horizontal': [[1, 2]],
  '2-vertical': [[1], [2]],
  '2-left-large': [[1, 1, 2], [1, 1, 2]],
  '2-right-large': [[1, 2, 2], [1, 2, 2]],
  '2-top-large': [[1, 1], [1, 1], [2, 2]],
  '2-bottom-large': [[1, 1], [2, 2], [2, 2]],
  '3-horizontal': [[1, 2, 3]],
  '3-vertical': [[1], [2], [3]],
  '3-left-featured': [[1, 1, 2], [1, 1, 3]],
  '3-right-featured': [[1, 2, 2], [3, 2, 2]],
  '3-top-featured': [[1, 1], [2, 3]],
  '3-bottom-featured': [[1, 2], [3, 3]],
  '3-center-featured': [[1, 2, 2, 3], [1, 2, 2, 3]],
  '3-l-shape': [[1, 1, 2], [3, 3, 3]],
  '3-reverse-l': [[1, 2, 2], [3, 3, 3]],
  '4-grid': [[1, 2], [3, 4]],
  '4-horizontal': [[1, 2, 3, 4]],
  '4-left-featured': [[1, 1, 2], [1, 1, 3], [1, 1, 4]],
  '4-right-featured': [[1, 2, 2], [3, 2, 2], [4, 2, 2]],
  '4-top-featured': [[1, 1, 1], [2, 3, 4]],
  '4-bottom-featured': [[1, 2, 3], [4, 4, 4]],
  '4-mosaic-1': [[1, 1, 2], [3, 4, 4]],
  '4-mosaic-2': [[1, 2, 2], [3, 3, 4]],
  '4-center-split': [[1, 1, 2, 2], [3, 3, 4, 4]],
  '4-corners': [[1, 1, 2, 2], [1, 1, 2, 2], [3, 3, 4, 4], [3, 3, 4, 4]],
  '5-top-row': [[1, 2, 3], [4, 4, 5]],
  '5-bottom-row': [[1, 1, 2], [3, 4, 5]],
  '5-featured-left': [[1, 1, 2, 3], [1, 1, 4, 5]],
  '5-featured-right': [[1, 2, 3, 3], [4, 5, 3, 3]],
  '5-cross': [[1, 2, 2, 3], [4, 2, 2, 5]],
  '5-gallery': [[1, 1, 2, 2], [3, 4, 4, 5]],
  '5-pinterest': [[1, 1, 2], [1, 1, 3], [4, 5, 3]],
  '6-grid': [[1, 2, 3], [4, 5, 6]],
  '6-horizontal': [[1, 2, 3, 4, 5, 6]],
  '6-featured-top': [[1, 1, 2, 2], [3, 4, 5, 6]],
  '6-featured-bottom': [[1, 2, 3, 4], [5, 5, 6, 6]],
  '6-magazine': [[1, 1, 2, 3], [1, 1, 4, 5], [1, 1, 6, 6]],
  '6-mosaic': [[1, 2, 2, 3], [4, 4, 5, 6]],
  '6-tall-left': [[1, 2, 3], [1, 4, 5], [1, 6, 6]],
  '6-tall-right': [[1, 2, 3], [4, 5, 3], [6, 6, 3]],
  '7-gallery': [[1, 1, 2, 2, 3], [4, 5, 5, 6, 7]],
  '8-grid': [[1, 2, 3, 4], [5, 6, 7, 8]],
  '8-featured': [[1, 1, 2, 3, 4], [1, 1, 5, 6, 7], [1, 1, 8, 8, 8]],
  '9-grid': [[1, 2, 3], [4, 5, 6], [7, 8, 9]],
  '10-mosaic': [[1, 1, 2, 3, 3], [1, 1, 4, 5, 5], [6, 7, 8, 9, 10]],
  'filmstrip': [[1, 2, 3, 4, 5]],
  'polaroid-3': [[1, 1, 2, 2, 3, 3]],
  't-shape': [[1, 1, 1], [2, 3, 4]],
  'inverted-t': [[1, 2, 3], [4, 4, 4]],
  'staircase': [[1, 2, 2], [1, 3, 3], [4, 4, 4]],
  'diagonal': [[1, 1, 2, 3], [4, 5, 5, 3], [4, 6, 6, 6]],
};

function exportImageCollage(section, isGmail = false) {
  const images = section.images || [];
  if (images.length === 0) return '';

  const gap = section.gap || 8;
  const imageHeight = section.imageHeight || 200;
  const focalPoints = section.focalPoints || [];
  const imageBackgrounds = section.imageBackgrounds || [];
  const layout = section.layout || '4-grid';

  const preset = COLLAGE_PRESETS[layout] || COLLAGE_PRESETS['4-grid'];
  const rows = preset.length;
  const cols = preset[0]?.length || 1;

  const rowHeightUnit = Math.floor(imageHeight / rows);

  const cellMap = new Map();
  const processedIds = new Set();

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cellId = preset[r][c];
      if (processedIds.has(cellId)) continue;
      let colSpan = 1;
      while (c + colSpan < cols && preset[r][c + colSpan] === cellId) colSpan++;
      let rowSpan = 1;
      while (r + rowSpan < rows && preset[r + rowSpan]?.[c] === cellId) rowSpan++;
      processedIds.add(cellId);
      cellMap.set(cellId, { row: r, col: c, colSpan, rowSpan, imageIndex: cellId - 1 });
    }
  }

  const totalGapH = gap * (cols - 1);

  let tableRowsHtml = '';

  for (let r = 0; r < rows; r++) {
    const isLastRow = (r === rows - 1);
    let rowHtml = '<tr>';
    const renderedInThisRow = new Set();

    for (let c = 0; c < cols; c++) {
      const cellId = preset[r][c];
      const cellInfo = cellMap.get(cellId);
      if (!cellInfo || cellInfo.row !== r || renderedInThisRow.has(cellId)) continue;
      if (cellInfo.row < r) continue;
      renderedInThisRow.add(cellId);

      const { colSpan, rowSpan, imageIndex } = cellInfo;
      const image = images[imageIndex];
      const focalPoint = focalPoints[imageIndex] || { x: 50, y: 50 };
      const bgColor = imageBackgrounds[imageIndex] || '';
      const cellHeightPx = (rowHeightUnit * rowSpan) + (gap * (rowSpan - 1));

      const isLastCol = (c + colSpan >= cols);
      const padRight = isLastCol ? 0 : gap;
      const padBottom = (isLastRow || r + rowSpan >= rows) ? 0 : gap;

      const widthPct = Math.round((colSpan / cols) * 100);

      if (image) {
        rowHtml += `
        <td${colSpan > 1 ? ` colspan="${colSpan}"` : ''}${rowSpan > 1 ? ` rowspan="${rowSpan}"` : ''} width="${widthPct}%" style="width:${widthPct}%;padding:0 ${padRight}px ${padBottom}px 0;" valign="top">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
            <td height="${cellHeightPx}" style="height:${cellHeightPx}px;background-image:url('${image}');background-size:${bgColor ? 'contain' : 'cover'};background-position:${focalPoint.x}% ${focalPoint.y}%;background-repeat:no-repeat;background-color:${bgColor || 'transparent'};border-radius:8px;font-size:0;line-height:0;" valign="top">
              <!--[if gte mso 9]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:100%;height:${cellHeightPx}px;"><v:fill type="frame" src="${image}" /><v:textbox inset="0,0,0,0"><![endif]-->
              <img src="${image}" alt="" width="100%" height="${cellHeightPx}" style="display:block;width:100%;height:${cellHeightPx}px;border-radius:8px;opacity:0;" />
              <!--[if gte mso 9]></v:textbox></v:rect><![endif]-->
            </td>
          </tr></table>
        </td>`;
      } else {
        rowHtml += `
        <td${colSpan > 1 ? ` colspan="${colSpan}"` : ''}${rowSpan > 1 ? ` rowspan="${rowSpan}"` : ''} width="${widthPct}%" style="width:${widthPct}%;padding:0 ${padRight}px ${padBottom}px 0;" valign="top">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0"><tr>
            <td height="${cellHeightPx}" style="height:${cellHeightPx}px;background-color:#f4f4f5;border-radius:8px;text-align:center;vertical-align:middle;color:#a1a1aa;font-size:14px;" valign="middle">
              ${cellId}
            </td>
          </tr></table>
        </td>`;
      }
    }

    rowHtml += '</tr>';
    tableRowsHtml += rowHtml;
  }

  if (!tableRowsHtml) return '';

  return `
    <tr>
      <td style="background-color: ${section.backgroundColor || '#ffffff'}; padding: 16px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed;">
          ${tableRowsHtml}
        </table>
      </td>
    </tr>`;
}

function exportProfileCards(section) {
  const profiles = section.profiles || [];
  if (profiles.length === 0) return '';

  const columns = section.columns || 4;
  const borderRadius = section.imageShape === 'circular' ? '50%' : '8px';
  const cellWidthPct = Math.floor(100 / columns);
  const fontStack = FONT_STACKS['Poppins'];

  let profileCells = '';
  profiles.forEach((profile, i) => {
    if (!profile) return;
    
    profileCells += `
      <td width="${cellWidthPct}%" valign="top" style="text-align: center; vertical-align: top; padding: 10px;">
        ${profile.image ? `<img src="${profile.image}" alt="${profile.name || ''}" width="80" height="80" style="width: 80px; height: 80px; display: block; margin: 0 auto 10px; border-radius: ${borderRadius}; object-fit: cover;" />` : 
        `<div style="width: 80px; height: 80px; margin: 0 auto 10px; border-radius: ${borderRadius}; background-color: #E0E0E0; display: table;">
          <div style="display: table-cell; vertical-align: middle; text-align: center; color: #999; font-size: 32px;">👤</div>
        </div>`}
        ${section.showName !== false && profile.name ? `<div style="font-family: ${fontStack}; font-size: 14px; font-weight: 600; color: #333333; margin: 8px 0 4px;">${profile.name}</div>` : ''}
        ${section.showTitle !== false && profile.title ? `<div style="font-family: ${fontStack}; font-size: 12px; color: #666666;">${profile.title}</div>` : ''}
      </td>`;
  });

  if (!profileCells) return '';

  return `
    <tr>
      <td style="background-color: ${section.backgroundColor || '#ffffff'}; padding: 30px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed">
          <tr>
            ${profileCells}
          </tr>
        </table>
      </td>
    </tr>`;
}

function exportRecipe(section, isGmail = false) {
  const ingredients = (section.ingredients || '').replace(/\n/g, '<br>');
  const instructions = (section.instructions || '').replace(/\n/g, '<br>');
  const fontStack = getFontStack(section.fontFamily || 'Poppins');

  return `
    <tr>
      <td style="background-color: ${section.backgroundColor || '#ffffff'}; padding: 30px 20px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed">
          <tr>
            <td align="center">
              <h2 dir="ltr" style="font-family: ${fontStack}; font-size: 24px; font-weight: 600; color: #333333; margin: 0 0 20px;">${section.title || ''}</h2>
            </td>
          </tr>
          ${section.image ? `
          <tr>
            <td style="padding-bottom: 20px;">
              <img src="${section.image}" alt="${section.title || ''}" style="width: 100%; height: auto; display: block; border-radius: 8px;" />
            </td>
          </tr>` : ''}
          <tr>
            <td dir="ltr" style="font-family: ${fontStack}; font-size: 14px; color: #333333; line-height: 1.8; text-align: left; padding-bottom: 15px;">
              ${ingredients}
            </td>
          </tr>
          <tr>
            <td dir="ltr" style="font-family: ${fontStack}; font-size: 14px; color: #333333; line-height: 1.8; text-align: left;">
              ${instructions}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function exportMultiLayout(block) {
  const fontStack = FONT_STACKS['default'];
  const badge = block.badgeText || 'BUILDER';
  const badgeClr = block.badgeColor || '#1a1a3e';
  const hideBadge = block.showBadge === false;
  const title = linksToHTML(block.title || '');
  const body = linksToHTML((block.body || '')).replace(/\n/g, '<br>');
  const images = block.images || [];
  const layout = block.layout || 'two-col-wide';
  const borderRadius = block.imageBorderRadius || 12;
  const imgHeight = block.imageHeight || 180;
  const imgGap = block.imageGap ?? 8;
  const bfs = block.badgeFontSize || 19;
  const tfs = block.titleFontSize || 17;
  const dfs = block.bodyFontSize || 15;

  if (layout === 'track-list') {
    const tracks = block.tracks || [
      { title: 'TITLE PROJECT 01', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
      { title: 'TITLE PROJECT 02', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
      { title: 'TITLE PROJECT 03', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
      { title: 'TITLE PROJECT 04', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
    ];
    const tracksHtml = tracks.map((t) => {
      const subjectsHtml = t.subjects.map(s =>
        `<tr><td style="padding:2px 0;font-size:${dfs}px;color:#6B7280;line-height:1.6;font-family:${fontStack};">↳&nbsp; ${s}</td></tr>`
      ).join('');
      return `<tr><td style="padding:16px 0 4px;font-size:${tfs}px;font-weight:700;letter-spacing:0.04em;color:#1C1917;text-transform:uppercase;font-family:${fontStack};">${t.title}</td></tr>${subjectsHtml}`;
    }).join('');
    const trackBadgeHtml = hideBadge ? '' : `<div style="font-size:${bfs}px;font-weight:600;color:${badgeClr};letter-spacing:0.06em;text-transform:uppercase;padding:0 0 4px;">${badge}</div>
        <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 8px;" />`;
    return `
      <div style="font-family:${fontStack};">
        ${trackBadgeHtml}
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">${tracksHtml}</table>
      </div>`;
  }

  const badgeHtml = hideBadge ? '' : `<div style="font-size:${bfs}px;font-weight:600;color:${badgeClr};letter-spacing:0.06em;text-transform:uppercase;padding:0 0 4px;">${badge}</div>
      <hr style="border:none;border-top:1px solid #E5E7EB;margin:0 0 12px;" />`;

  const PRESETS = {
    'text-only':         { rows: [], textOnly: true },
    'text-centered':     { rows: [], textOnly: true, centered: true },
    'text-list':         { rows: [], textOnly: true },
    'hero-text':         { rows: [[12]] },
    'hero-above':        { rows: [[6, 6]], splitText: true },
    'hero-repeat-1':     { rows: [[5]], repeatSide: true, repeatCount: 1 },
    'hero-repeat':       { rows: [[5]], repeatSide: true, repeatCount: 3 },
    'hero-repeat-2':     { rows: [[5]], repeatSide: true, repeatCount: 2 },
    'hero-side':         { rows: [[12]], splitText: true },
    'two-col-wide':      { rows: [[5, 7]] },
    'three-col':         { rows: [[4, 4, 4]] },
    'two-by-two':        { rows: [[6, 6], [6, 6]] },
    'two-col-equal':     { rows: [[6, 6]] },
    'two-col-text-side': { rows: [[6, 6]], pairsText: true },
  };
  const preset = PRESETS[layout] || PRESETS['two-col-wide'];

  if (preset.textOnly) {
    const align = preset.centered ? 'center' : 'left';
    return `<div style="font-family:${fontStack};">
      ${badgeHtml}
      <div style="padding:8px 0 0;text-align:${align};">
        <div style="font-size:${tfs}px;font-weight:700;color:#1C1917;letter-spacing:0.03em;line-height:1.3;margin-bottom:6px;">${title}</div>
        <div style="font-size:${dfs}px;color:#6B7280;line-height:1.65;">${body}</div>
      </div>
    </div>`;
  }

  if (preset.repeatSide) {
    const count = preset.repeatCount || 3;
    const images3 = Array.from({ length: count }, (_, i) => images[i] || null);
    const repeatHtml = images3.map((src, i) => {
      const imgCell = src
        ? `<td style="width:42%;vertical-align:top;padding:0 8px ${i < images3.length - 1 ? 16 : 0}px 0;"><img src="${src}" alt="" style="display:block;width:100%;height:${imgHeight}px;object-fit:cover;border-radius:${borderRadius}px;" /></td>`
        : `<td style="width:42%;vertical-align:top;padding:0 8px ${i < images3.length - 1 ? 16 : 0}px 0;"><div style="width:100%;height:${imgHeight}px;background:#f4f4f5;border-radius:${borderRadius}px;"></div></td>`;
      return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;${i < images3.length - 1 ? 'margin-bottom:16px;' : ''}"><tr>${imgCell}<td style="width:58%;vertical-align:middle;padding-left:12px;"><div style="font-size:${tfs}px;font-weight:700;color:#1C1917;letter-spacing:0.03em;line-height:1.3;margin-bottom:6px;">${title}</div><div style="font-size:${dfs}px;color:#6B7280;line-height:1.65;">${body}</div></td></tr></table>`;
    }).join('');
    return `<div style="font-family:${fontStack};">
      ${badgeHtml}
      ${repeatHtml}
    </div>`;
  }


  let imgIdx = 0;
  const imageRowsHtml = preset.rows.map((cols) => {
    const totalSpan = cols.reduce((a, b) => a + b, 0);
    const cellsHtml = cols.map((span) => {
      const widthPct = Math.round((span / totalSpan) * 100);
      const src = images[imgIdx];
      imgIdx++;
      if (src) {
        return `<td style="width:${widthPct}%;padding:0 4px ${imgGap}px 0;vertical-align:top;"><img src="${src}" alt="" style="display:block;width:100%;height:${imgHeight}px;object-fit:cover;border-radius:${borderRadius}px;" /></td>`;
      }
      return `<td style="width:${widthPct}%;padding:0 4px ${imgGap}px 0;vertical-align:top;"><div style="width:100%;height:${imgHeight}px;background:#f4f4f5;border-radius:${borderRadius}px;"></div></td>`;
    }).join('');
    return `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>${cellsHtml}</tr></table>`;
  }).join('');

  const textHtml = preset.pairsText
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr>${[0,1].map(() => `<td style="width:50%;vertical-align:top;padding:0 6px;"><div style="font-size:${tfs}px;font-weight:700;color:#1C1917;letter-spacing:0.03em;line-height:1.3;margin-bottom:6px;">${title}</div><div style="font-size:${dfs}px;color:#6B7280;line-height:1.65;font-family:${fontStack};">${body}</div></td>`).join('')}</tr></table>`
    : preset.splitText
    ? `<table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;"><tr><td style="width:42%;vertical-align:top;padding-right:12px;font-size:${tfs}px;font-weight:700;color:#1C1917;letter-spacing:0.03em;line-height:1.3;">${title}</td><td style="width:58%;vertical-align:top;font-size:${dfs}px;color:#6B7280;line-height:1.65;font-family:${fontStack};">${body}</td></tr></table>`
    : `<div style="font-size:${tfs}px;font-weight:700;color:#1C1917;letter-spacing:0.03em;line-height:1.3;margin-bottom:6px;">${title}</div><div style="font-size:${dfs}px;color:#6B7280;line-height:1.65;">${body}</div>`;

  return preset.imageAboveBadge
    ? `<div style="font-family:${fontStack};">
      ${imageRowsHtml}
      ${badgeHtml}
      <div style="padding:8px 0 0;">${textHtml}</div>
    </div>`
    : `<div style="font-family:${fontStack};">
      ${badgeHtml}
      ${imageRowsHtml}
      <div style="padding:8px 0 0;">${textHtml}</div>
    </div>`;
}

function exportFooter(section) {
  const fontStack = getFontStack(section.fontFamily || 'Poppins');
  const textAlign = section.textAlign || 'center';
  const bg = section.background || {};
  const bgColor = bg.color || section.backgroundColor || '#FFFFFF';
  const pad = section.padding && typeof section.padding === 'object' && section.padding.top !== undefined
    ? section.padding
    : { top: section.paddingTop ?? section.padding ?? 40, bottom: section.paddingBottom ?? section.padding ?? 40, left: section.paddingLeft ?? section.padding ?? 24, right: section.paddingRight ?? section.padding ?? 24 };
  const paddingTop = pad.top ?? 40;
  const paddingBottom = pad.bottom ?? 40;
  const paddingLeft = pad.left ?? 24;
  const paddingRight = pad.right ?? 24;
  
  let content = '';
  
  // Logo
  if (section.showLogo !== false && section.logo) {
    const logoWidth = section.logoWidth || 120;
    const logoHeight = section.logoHeight || 40;
    content += `
      <tr>
        <td align="${textAlign}" style="padding-bottom: 20px;">
          <img src="${section.logo}" alt="Logo" style="max-width: ${logoWidth}px; height: auto; display: inline-block; object-fit: contain;" />
        </td>
      </tr>`;
  }
  
  // Tagline
  if (section.showTagline !== false && section.tagline) {
    const tagText = section.taglineUrl
      ? `<a href="${section.taglineUrl}" style="color: ${section.taglineColor || '#6B7280'}; text-decoration: underline;">${section.tagline}</a>`
      : section.tagline;
    content += `
      <tr>
        <td align="${textAlign}" style="padding-bottom: 16px; color: ${section.taglineColor || '#6B7280'}; font-family: ${fontStack}; font-size: ${section.taglineFontSize || 13}px; line-height: 1.5;">
          ${tagText}
        </td>
      </tr>`;
  }
  
  // Social icons - use image-based icons for email compatibility
  if (section.showSocial !== false && section.socialLinks) {
    const socialLinks = section.socialLinks;
    const iconSize = section.socialIconSize || 24;
    
    let iconsHtml = '';
    const platforms = ['facebook', 'x', 'twitter', 'linkedin', 'instagram', 'youtube', 'tiktok'];
    
    platforms.forEach(platform => {
      const url = socialLinks[platform];
      if (url) {
        // Use simple text-based icons for email compatibility
        const iconMap = {
          facebook: 'f',
          x: '𝕏',
          twitter: '𝕏',
          linkedin: 'in',
          instagram: '📷',
          youtube: '▶',
          tiktok: '♪'
        };
        iconsHtml += `
          <a href="${url}" target="_blank" style="display: inline-block; width: ${iconSize}px; height: ${iconSize}px; line-height: ${iconSize}px; text-align: center; text-decoration: none; color: ${section.socialIconColor || '#4B5563'}; font-size: ${Math.floor(iconSize * 0.6)}px; font-weight: bold; margin: 0 ${section.socialGap || 8}px; border-radius: 50%; background-color: #f0f0f0;">${iconMap[platform]}</a>`;
      }
    });
    
    if (iconsHtml) {
      content += `
        <tr>
          <td align="${textAlign}" style="padding-bottom: 20px;">
            ${iconsHtml}
          </td>
        </tr>`;
    }
  }
  
  // Divider
  if (section.showDivider !== false && (section.logo || (section.showSocial !== false && section.socialLinks))) {
    content += `
      <tr>
        <td style="padding: 0 0 20px;">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed">
            <tr>
              <td style="border-top: ${section.dividerWidth || 1}px solid ${section.dividerColor || '#E5E7EB'};"></td>
            </tr>
          </table>
        </td>
      </tr>`;
  }
  
  // Company info
  if (section.showCompanyInfo !== false && section.companyInfo) {
    content += `
      <tr>
        <td align="${textAlign}" style="padding-bottom: 12px; color: ${section.companyInfoColor || '#374151'}; font-family: ${fontStack}; font-size: ${section.companyInfoFontSize || 14}px; line-height: 1.6;">
          ${section.companyInfo}
        </td>
      </tr>`;
  }
  
  // Footer links
  if (section.showFooterLinks !== false && section.footerLinks && section.footerLinks.length > 0) {
    const separator = section.linkSeparator || '|';
    const linksHtml = section.footerLinks.map((link, i) => {
      const sep = i < section.footerLinks.length - 1 ? `<span style="margin: 0 8px; opacity: 0.5;">${separator}</span>` : '';
      return `<a href="${link.url || '#'}" style="color: ${section.linkColor || '#374151'}; font-size: ${section.linkFontSize || 14}px; text-decoration: underline;">${link.text}</a>${sep}`;
    }).join('');
    
    content += `
      <tr>
        <td align="${textAlign}" style="font-family: ${fontStack};">
          ${linksHtml}
        </td>
      </tr>`;
  }
  
  // Fallback for old footer format
  if (!content && section.text) {
    const text = (section.text || '').replace(/\n/g, '<br>');
    content = `
      <tr>
        <td align="${textAlign}" style="color: ${section.color || '#ffffff'}; font-family: ${fontStack}; font-size: ${section.fontSize || 14}px; line-height: 1.8;">
          ${text}
        </td>
      </tr>`;
  }

  return `
    <tr>
      <td style="background-color: ${bgColor}; padding: ${paddingTop}px ${paddingRight}px ${paddingBottom}px ${paddingLeft}px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="table-layout:fixed">
          ${content}
        </table>
      </td>
    </tr>`;
}
