// Media Kit - Hardcoded logos and brand assets

export const mediaKit = {
  logos: [
    {
      id: 'logo-dark-png',
      name: 'Logo Dark',
      url: '/media-kit/logo-dark.png',
      category: 'logo'
    },
    {
      id: 'logo-dark-svg',
      name: 'Logo Dark (SVG)',
      url: '/media-kit/logo-dark.svg',
      category: 'logo'
    },
    {
      id: 'logo-light-png',
      name: 'Logo Light',
      url: '/media-kit/logo-light.png',
      category: 'logo'
    },
    {
      id: 'logo-light-svg',
      name: 'Logo Light (SVG)',
      url: '/media-kit/logo-light.svg',
      category: 'logo'
    },
    {
      id: 'background-png',
      name: 'Background',
      url: '/media-kit/background.png',
      category: 'background'
    },
    {
      id: 'background-svg',
      name: 'Background (SVG)',
      url: '/media-kit/background.svg',
      category: 'background'
    },
    {
      id: 'frame-layout',
      name: 'Frame Layout',
      url: '/media-kit/frame-layout.png',
      category: 'background'
    },
    {
      id: 'newsletter-template-png',
      name: 'Newsletter Template',
      url: '/media-kit/newsletter-template.png',
      category: 'template'
    },
    {
      id: 'newsletter-template-svg',
      name: 'Newsletter Template (SVG)',
      url: '/media-kit/newsletter-template.svg',
      category: 'template'
    },
    {
      id: 'cover-1',
      name: 'Cover — Full Branding',
      url: '/media-kit/cover-1.png',
      category: 'cover'
    },
    {
      id: 'cover-2',
      name: 'Cover — Centered',
      url: '/media-kit/cover-2.png',
      category: 'cover'
    },
    {
      id: 'cover-3',
      name: 'Cover — With Logo Bar',
      url: '/media-kit/cover-3.png',
      category: 'cover'
    },
    {
      id: 'cover-4',
      name: 'Cover — No Branding',
      url: '/media-kit/cover-4.png',
      category: 'cover'
    },
    {
      id: 'cover-5',
      name: 'Cover — Checkpoint³',
      url: '/media-kit/cover-5.png',
      category: 'cover'
    },
    {
      id: 'cover-6',
      name: 'Cover — Wix Studio',
      url: '/media-kit/cover-6.png',
      category: 'cover'
    },
    {
      id: 'cover-nologo-1',
      name: 'Cover No Logo — 1',
      url: '/media-kit/cover-nologo-1.png',
      category: 'cover-nologo'
    },
    {
      id: 'cover-nologo-2',
      name: 'Cover No Logo — 2',
      url: '/media-kit/cover-nologo-2.png',
      category: 'cover-nologo'
    },
    {
      id: 'cover-nologo-3',
      name: 'Cover No Logo — 3',
      url: '/media-kit/cover-nologo-3.png',
      category: 'cover-nologo'
    },
    {
      id: 'slide-design-editor',
      name: 'CP3 — Design Editor',
      url: '/media-kit/slide-design-editor.png',
      category: 'cp3'
    },
    {
      id: 'slide-export-site',
      name: 'CP3 — Export Site Code',
      url: '/media-kit/slide-export-site.png',
      category: 'cp3'
    },
    {
      id: 'slide-cms-context',
      name: 'CP3 — CMS & Context',
      url: '/media-kit/slide-cms-context.png',
      category: 'cp3'
    },
    {
      id: 'slide-video-thumb',
      name: 'CP3 — Video Thumbnail',
      url: '/media-kit/slide-video-thumb.png',
      category: 'cp3'
    },
    {
      id: 'slide-code-editor',
      name: 'CP3 — Code Editor',
      url: '/media-kit/slide-code-editor.png',
      category: 'cp3'
    },
    {
      id: 'slide-timeline',
      name: 'CP3 — Timeline',
      url: '/media-kit/slide-timeline.png',
      category: 'cp3'
    },
  ],

  categories: [
    { id: 'all', name: 'All' },
    { id: 'logo', name: 'Logos' },
    { id: 'background', name: 'Backgrounds' },
    { id: 'cover', name: 'Covers' },
    { id: 'cover-nologo', name: 'Covers / No Logo' },
    { id: 'template', name: 'Templates' },
    { id: 'cp3', name: 'Checkpoint 3' }
  ]
};

export function getLogosByCategory(category) {
  if (category === 'all') {
    return mediaKit.logos;
  }
  return mediaKit.logos.filter(logo => logo.category === category);
}

export function getLogoById(id) {
  return mediaKit.logos.find(logo => logo.id === id);
}

export default mediaKit;
