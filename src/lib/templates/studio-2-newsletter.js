import { createBlock, defaultBackground, defaultPadding } from '../section-schema';
import { createGridRow, createGridColumn } from '../grid-schema';

export function createStudio2Template() {
  const ts = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

  return {
    name: 'Studio 2.0 — Checkpoint³',
    pageSettings: {
      outerBackgroundColor: '#F0F0F0',
      outerPadding: 20,
      innerBackgroundColor: '#FFFFFF',
      innerBorderWidth: 0,
      innerBorderColor: '#E5E5E5',
      innerBorderRadius: 12,
    },
    sections: [
      // ─── Header: branded cover art (Checkpoint³) — full width, hugs image height ────
      {
        id: `section-${ts()}`,
        type: 'header',
        preset: null,
        borderRadius: 14,
        background: defaultBackground({
          type: 'image',
          image: '/media-kit/cover-5.png',
          imageSize: 'auto',
          imagePosition: 'center',
          fallbackColor: '#C4A0E8',
          color: '#C4A0E8',
        }),
        padding: defaultPadding({ top: 0, bottom: 0, left: 0, right: 0 }),
        height: 'auto',
        minHeight: null,
        name: 'Header',
        blocks: [],
        rows: [createGridRow([createGridColumn(12, [])])],
      },

      // ─── Intro text section ──────────────────────────────────────
      {
        id: `section-${ts()}`,
        type: 'section',
        preset: 'text',
        background: defaultBackground({ type: 'solid', color: '#FFFFFF' }),
        padding: defaultPadding({ top: 28, bottom: 8, left: 28, right: 28 }),
        height: 'auto',
        minHeight: null,
        name: 'Intro',
        blocks: [
          createBlock('title', {
            text: 'WIX STUDIO NEWSLETTER  ✳',
            fontSize: 12,
            fontWeight: 600,
            fontStyle: 'normal',
            letterSpacing: '0.08em',
            color: '#1C1917',
            textAlign: 'left',
            padding: 0,
            lineHeight: 1.4,
          }),
          createBlock('spacer', { height: 12 }),
          createBlock('text', {
            content: "Today the Studio 2.0 team demoed real, working product across all five domains. Here's what we showed and where we're headed.\n\nFor the first time, we're showing a real, working Studio 2.0 editor. Five live demos. Months of hard work made visible. Read on for what each team delivered.",
            fontSize: 14,
            color: '#374151',
            textAlign: 'left',
            fontFamily: 'Poppins',
            padding: 0,
            lineHeight: 1.7,
          }),
          createBlock('spacer', { height: 4 }),
          createBlock('button', {
            text: 'Watch now →',
            url: '#',
            backgroundColor: 'transparent',
            textColor: '#04D1FC',
            fontSize: 14,
            fontWeight: '500',
            paddingH: 0,
            paddingV: 4,
            align: 'left',
            borderRadius: 0,
            fullWidth: false,
          }),
        ],
      },

      // ─── Builder Layout A: 2-col images (5/7) + full-width text ──
      builderSection(ts, {
        name: 'Builder — Editor Shell',
        imageRow: [
          createGridColumn(5, [createBlock('image', { src: null, showPlaceholder: true, height: 180, borderRadius: 12, objectFit: 'cover' })]),
          createGridColumn(7, [createBlock('image', { src: null, showPlaceholder: true, height: 180, borderRadius: 12, objectFit: 'cover' })]),
        ],
        textLayout: 'full',
        title: 'THE LOOK & FEEL OF STUDIO 2.0',
        body: "The first real look at the Studio 2.0 editor shell. Top Bar, Side Bar, and Side Panels live and interactive. We showcased the design decisions, UX direction, and visual language that define how Studio 2.0 feels. The WDS design system migration is on full display, showing how our foundations are being rebuilt from the ground up.",
      }),

      // ─── Builder Layout B: 3-col images + full-width text ────────
      builderSection(ts, {
        name: 'Builder — Design System',
        imageRow: [
          createGridColumn(4, [createBlock('image', { src: null, showPlaceholder: true, height: 180, borderRadius: 12, objectFit: 'cover' })]),
          createGridColumn(4, [createBlock('image', { src: null, showPlaceholder: true, height: 180, borderRadius: 12, objectFit: 'cover' })]),
          createGridColumn(4, [createBlock('image', { src: null, showPlaceholder: true, height: 180, borderRadius: 12, objectFit: 'cover' })]),
        ],
        textLayout: 'full',
        title: 'THE LOOK & FEEL OF STUDIO 2.0',
        body: "The first real look at the Studio 2.0 editor shell. Top Bar, Side Bar, and Side Panels live and interactive. We showcased the design decisions, UX direction, and visual language that define how Studio 2.0 feels. The WDS design system migration is on full display, showing how our foundations are being rebuilt from the ground up.",
      }),

      // ─── Builder Layout C: 2x2 images + full-width text ──────────
      builderSection(ts, {
        name: 'Builder — Components',
        imageRows: [
          [
            createGridColumn(6, [createBlock('image', { src: null, showPlaceholder: true, height: 160, borderRadius: 12, objectFit: 'cover' })]),
            createGridColumn(6, [createBlock('image', { src: null, showPlaceholder: true, height: 160, borderRadius: 12, objectFit: 'cover' })]),
          ],
          [
            createGridColumn(6, [createBlock('image', { src: null, showPlaceholder: true, height: 160, borderRadius: 12, objectFit: 'cover' })]),
            createGridColumn(6, [createBlock('image', { src: null, showPlaceholder: true, height: 160, borderRadius: 12, objectFit: 'cover' })]),
          ],
        ],
        textLayout: 'full',
        title: 'THE LOOK & FEEL OF STUDIO 2.0',
        body: "The first real look at the Studio 2.0 editor shell. Top Bar, Side Bar, and Side Panels live and interactive. We showcased the design decisions, UX direction, and visual language that define how Studio 2.0 feels. The WDS design system migration is on full display, showing how our foundations are being rebuilt from the ground up.",
      }),

      // ─── Builder Layout D: 2-col images + 2-col text ─────────────
      builderSection(ts, {
        name: 'Builder — Interactions',
        imageRow: [
          createGridColumn(6, [createBlock('image', { src: null, showPlaceholder: true, height: 180, borderRadius: 12, objectFit: 'cover' })]),
          createGridColumn(6, [createBlock('image', { src: null, showPlaceholder: true, height: 180, borderRadius: 12, objectFit: 'cover' })]),
        ],
        textLayout: 'two-col',
        title: 'THE LOOK & FEEL',
        body: "The first real look at the Studio 2.0 editor shell. Top Bar, Side Bar, and Side Panels live and interactive. We showcased the design decisions, UX direction, and visual language that define how Studio 2.0 feels. The WDS design system migration is on full display, showing how our foundations are being rebuilt from the ground up.",
      }),

      // ─── Footer ──────────────────────────────────────────────────
      {
        id: `section-${ts()}`,
        type: 'footer',
        preset: null,
        background: defaultBackground({ type: 'solid', color: '#FAFAFA' }),
        padding: defaultPadding({ top: 32, bottom: 32, left: 28, right: 28 }),
        height: 'auto',
        minHeight: null,
        name: 'Footer',
        blocks: [
          createBlock('logo', {
            src: '/media-kit/logo-dark.png',
            width: 80,
            height: 'auto',
            alignment: 'center',
          }),
          createBlock('spacer', { height: 12 }),
          createBlock('socialLinks', {
            iconColor: '#9CA3AF',
            iconSize: 20,
            align: 'center',
            gap: 16,
          }),
          createBlock('divider', {
            color: '#E5E7EB',
            thickness: 1,
            marginTop: 16,
            marginBottom: 16,
          }),
          createBlock('companyInfo', {
            text: 'Wix.com • 40 Namal Tel Aviv St., Tel Aviv 6350671',
            color: '#9CA3AF',
            fontSize: 12,
            align: 'center',
          }),
          createBlock('footerLinks', {
            links: [
              { text: 'Unsubscribe', url: '#' },
              { text: 'View in Browser', url: '#' },
              { text: 'Privacy Policy', url: '#' },
            ],
            color: '#9CA3AF',
            fontSize: 12,
            align: 'center',
          }),
        ],
      },
    ],
  };
}

// ── Builder Section Factory ────────────────────────────────────────
// Generates a complete "BUILDER" section with badge, image grid, and
// title+text in either full-width or two-column layout.
function builderSection(ts, opts) {
  const {
    name = 'Builder',
    imageRow,
    imageRows,
    textLayout = 'full',
    title = 'SECTION TITLE',
    body = '',
  } = opts;

  const rows = [];

  // Row 1: BUILDER badge (full-width)
  rows.push(
    createGridRow([
      createGridColumn(12, [
        createBlock('title', {
          text: 'BUILDER',
          fontSize: 14,
          fontWeight: 600,
          fontStyle: 'normal',
          letterSpacing: '0.06em',
          color: '#FFFFFF',
          textAlign: 'left',
          padding: 10,
          backgroundColor: '#04D1FC',
          borderRadius: 24,
          showChevron: true,
        }),
        createBlock('divider', {
          color: '#E5E7EB',
          thickness: 1,
          marginTop: 12,
          marginBottom: 4,
        }),
      ]),
    ])
  );

  // Image rows
  if (imageRows) {
    for (const cols of imageRows) {
      rows.push(createGridRow(cols));
    }
  } else if (imageRow) {
    rows.push(createGridRow(imageRow));
  }

  // Text row(s)
  if (textLayout === 'two-col') {
    rows.push(
      createGridRow([
        createGridColumn(5, [
          createBlock('title', {
            text: title,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.03em',
            color: '#1C1917',
            textAlign: 'left',
            padding: 0,
            lineHeight: 1.3,
          }),
        ]),
        createGridColumn(7, [
          createBlock('text', {
            content: body,
            fontSize: 13,
            color: '#6B7280',
            textAlign: 'left',
            fontFamily: 'Poppins',
            padding: 0,
            lineHeight: 1.65,
          }),
        ]),
      ])
    );
  } else {
    rows.push(
      createGridRow([
        createGridColumn(12, [
          createBlock('title', {
            text: title,
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.03em',
            color: '#1C1917',
            textAlign: 'left',
            padding: 0,
            lineHeight: 1.3,
          }),
          createBlock('spacer', { height: 6 }),
          createBlock('text', {
            content: body,
            fontSize: 13,
            color: '#6B7280',
            textAlign: 'left',
            fontFamily: 'Poppins',
            padding: 0,
            lineHeight: 1.65,
          }),
        ]),
      ])
    );
  }

  return {
    id: `section-${ts()}`,
    type: 'section',
    preset: null,
    background: defaultBackground({ type: 'solid', color: '#FFFFFF' }),
    padding: defaultPadding({ top: 16, bottom: 24, left: 28, right: 28 }),
    height: 'auto',
    minHeight: null,
    name,
    rows,
  };
}
