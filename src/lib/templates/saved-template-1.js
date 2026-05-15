import { defaultBackground, defaultPadding, createBlock } from '../section-schema';
import { createGridRow, createGridColumn } from '../grid-schema';

export function createSavedTemplate1() {
  const ts = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  return {
    name: 'Studio 2.0 — Builder',
    pageSettings: {
      outerBackgroundColor: '#F5F5F5',
      outerPadding: 20,
      innerBackgroundColor: '#FFFFFF',
      innerBorderWidth: 0,
      innerBorderColor: '#E5E5E5',
      innerBorderRadius: 0,
    },
    sections: [
      // ─── Header: Cover image ────
      {
        id: `section-${ts()}`,
        type: 'header',
        preset: null,
        background: defaultBackground({
          type: 'image',
          image: '/media-kit/cover-5.png',
          imageSize: 'cover',
          imagePosition: 'center',
          fallbackColor: '#E8E8EC',
          color: '#E8E8EC',
        }),
        padding: defaultPadding({ top: 0, bottom: 0, left: 0, right: 0 }),
        height: 350,
        minHeight: null,
        blocks: [],
        rows: [createGridRow([createGridColumn(12, [])])],
      },

      // ─── Section 1: Two-column wide layout ────
      {
        id: `section-${ts()}`,
        type: 'section',
        preset: null,
        background: defaultBackground({ type: 'solid', color: '#FFFFFF' }),
        padding: defaultPadding({ top: 0, bottom: 0, left: 0, right: 0 }),
        height: 'auto',
        minHeight: null,
        blocks: [],
        rows: [
          createGridRow([
            createGridColumn(12, [
              createBlock('multiLayout', {
                layout: 'two-col-wide',
                badgeText: 'BUILDER',
                badgeColor: '#1a1a3e',
                badgeFontSize: 19,
                titleFontSize: 17,
                bodyFontSize: 15,
                title: 'THE LOOK & FEEL OF STUDIO 2.0',
                body: 'The first real look at the Studio 2.0 editor shell. Top Bar, Side Bar, and Side Panels live and interactive. We showcased the design decisions, UX direction, and visual language that define how Studio 2.0 feels.',
                images: [],
                imageHeight: 180,
                imageBorderRadius: 12,
              }),
            ]),
          ]),
        ],
      },

      // ─── Section 2: Full-width image ────
      {
        id: `section-${ts()}`,
        type: 'section',
        preset: null,
        background: defaultBackground({ type: 'solid', color: '#FFFFFF' }),
        padding: defaultPadding({ top: 0, bottom: 0, left: 0, right: 0 }),
        height: 'auto',
        minHeight: null,
        blocks: [],
        rows: [
          createGridRow([
            createGridColumn(12, [
              createBlock('image', {
                src: '/media-kit/newsletter-template.png',
                width: '100%',
                height: 'auto',
                objectFit: 'cover',
              }),
            ]),
          ]),
        ],
      },

      // ─── Sections 3–6: Hero-text layouts ────
      ...[1, 2, 3, 4].map(() => ({
        id: `section-${ts()}`,
        type: 'section',
        preset: null,
        background: defaultBackground({ type: 'solid', color: '#FFFFFF' }),
        padding: defaultPadding({ top: 60, bottom: 0, left: 0, right: 0 }),
        height: 'auto',
        minHeight: null,
        blocks: [],
        rows: [
          createGridRow([
            createGridColumn(12, [
              createBlock('multiLayout', {
                layout: 'hero-text',
                badgeText: 'BUILDER',
                badgeColor: '#1a1a3e',
                badgeFontSize: 19,
                titleFontSize: 17,
                bodyFontSize: 15,
                title: 'THE LOOK & FEEL OF STUDIO 2.0',
                body: 'The first real look at the Studio 2.0 editor shell. Top Bar, Side Bar, and Side Panels live and interactive. We showcased the design decisions, UX direction, and visual language that define how Studio 2.0 feels.',
                images: [],
                imageHeight: 180,
                imageBorderRadius: 12,
              }),
            ]),
          ]),
        ],
      })),

      // ─── Section 7: Full-width image (Wix Studio) ────
      {
        id: `section-${ts()}`,
        type: 'section',
        preset: null,
        background: defaultBackground({ type: 'solid', color: '#FFFFFF' }),
        padding: defaultPadding({ top: 0, bottom: 0, left: 0, right: 0 }),
        height: 'auto',
        minHeight: null,
        blocks: [],
        rows: [
          createGridRow([
            createGridColumn(12, [
              createBlock('image', {
                src: '/media-kit/cover-6.png',
                width: '100%',
                height: 'auto',
                objectFit: 'cover',
              }),
            ]),
          ]),
        ],
      },

      // ─── Footer ────
      {
        id: `footer-${ts()}`,
        type: 'footer',
        background: defaultBackground({ color: '#FFFFFF' }),
        padding: defaultPadding({ top: 40, bottom: 40, left: 24, right: 24 }),
        height: 'auto',
        textAlign: 'center',
        logo: null,
        showLogo: true,
        tagline: '',
        taglineUrl: '',
        showTagline: true,
        showSocial: true,
        socialLinks: {},
        socialIconSize: 24,
        socialIconColor: '#4B5563',
        showCompanyInfo: true,
        companyInfo: 'Wix.com • 40 Namal Tel Aviv St.,Tel Aviv 6350671',
        companyInfoColor: '#374151',
        companyInfoFontSize: 14,
        showDivider: true,
        dividerColor: '#E5E7EB',
        showFooterLinks: true,
        footerLinks: [
          { text: 'Unsubscribe', url: '#' },
          { text: 'View in Browser', url: '#' },
          { text: 'Privacy Policy', url: '#' },
        ],
        linkColor: '#374151',
        linkFontSize: 14,
        fontFamily: 'Poppins',
        blocks: [],
        rows: [],
      },
    ],
  };
}
