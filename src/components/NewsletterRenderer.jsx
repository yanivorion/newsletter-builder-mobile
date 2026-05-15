import React from 'react';
import BlockRenderer from './blocks/BlockRenderer';
import FooterSection from './sections/FooterSection';
import { migrateNewsletter } from '../lib/migrate-sections';
import { spanToPercent, GRID_COLUMNS } from '../lib/grid-schema';

// Read-only newsletter renderer. Mirrors the editor's section/grid layout
// so imported (legacy) newsletters render with their real saved content
// instead of falling back to placeholder text.
//
// Handles three section shapes:
//   1. Grid sections        — section.rows[].columns[].blocks
//   2. Flat-blocks sections — section.blocks (legacy/simple)
//   3. Footer sections      — render via the dedicated FooterSection component
//      (uses inline fields like `logo`, `socialLinks`, `companyInfo`, etc.)

function backgroundStyle(bg = {}) {
  if (bg.type === 'gradient') {
    return `linear-gradient(${bg.gradientAngle ?? 180}deg, ${bg.gradientStart ?? '#04D1FC'}, ${bg.gradientEnd ?? '#17A298'})`;
  }
  if (bg.type === 'image' && bg.image) {
    const size = (bg.imageSize === 'cover' || bg.imageSize === 'contain')
      ? (bg.imageSize ?? 'cover')
      : '100% auto';
    return `url(${bg.image}) ${bg.imagePosition ?? 'center'} / ${size} ${bg.imageRepeat ?? 'no-repeat'}`;
  }
  return bg.color ?? '#FFFFFF';
}

function SectionShell({ section, children }) {
  const padding = section.padding ?? {};
  return (
    <div
      data-section-id={section.id}
      data-section-type={section.type}
      style={{
        background: backgroundStyle(section.background),
        paddingTop: padding.top ?? 0,
        paddingBottom: padding.bottom ?? 0,
        paddingLeft: padding.left ?? 0,
        paddingRight: padding.right ?? 0,
        minHeight: section.minHeight ?? undefined,
        height: typeof section.height === 'number' ? `${section.height}px` : undefined,
      }}
    >
      {children}
    </div>
  );
}

function renderBlocks(blocks, section) {
  return (blocks || []).map((block) => (
    <BlockRenderer
      key={block.id}
      block={block}
      isSelected={false}
      isSectionSelected={false}
      sectionBackground={section.background}
    />
  ));
}

function renderSectionBody(section) {
  const hasGrid = Array.isArray(section.rows) && section.rows.some(
    (row) => (row.columns || []).some((col) => (col.blocks || []).length > 0)
  );
  const hasFlat = Array.isArray(section.blocks) && section.blocks.length > 0;

  if (hasGrid) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {section.rows.map((row) => (
          <div
            key={row.id}
            data-row-id={row.id}
            style={{ display: 'flex', width: '100%', minHeight: 0 }}
          >
            {(row.columns || []).map((col) => {
              const span = col.span ?? GRID_COLUMNS;
              const widthPct = typeof spanToPercent === 'function'
                ? spanToPercent(span)
                : `${(span / GRID_COLUMNS) * 100}%`;
              return (
                <div
                  key={col.id}
                  data-column-id={col.id}
                  style={{
                    width: widthPct,
                    flex: `0 0 ${widthPct}`,
                    display: 'flex',
                    flexDirection: 'column',
                    minWidth: 0,
                  }}
                >
                  {renderBlocks(col.blocks, section)}
                </div>
              );
            })}
          </div>
        ))}
      </div>
    );
  }

  if (hasFlat) return renderBlocks(section.blocks, section);

  return null;
}

function renderSection(section) {
  if (section.type === 'footer') {
    // Footer uses its dedicated component which knows about logo, socials,
    // company info, footer links, etc. Wrap in SectionShell for bg/padding.
    return (
      <SectionShell key={section.id} section={section}>
        <FooterSection {...section} isEditing={false} />
      </SectionShell>
    );
  }

  return (
    <SectionShell key={section.id} section={section}>
      {renderSectionBody(section)}
    </SectionShell>
  );
}

export default function NewsletterRenderer({ newsletter }) {
  if (!newsletter || !newsletter.sections) {
    return (
      <div style={{ padding: 32, color: '#64748B', fontFamily: 'sans-serif' }}>
        Empty newsletter (no sections)
      </div>
    );
  }

  // Migrate legacy formats so old newsletters (saved via the previous schema)
  // get their content into a shape this renderer can walk.
  const normalized = React.useMemo(() => {
    try { return migrateNewsletter(newsletter); }
    catch { return newsletter; }
  }, [newsletter]);

  const ps = normalized.pageSettings ?? {};

  return (
    <div
      style={{
        background: ps.outerBackgroundColor ?? '#F5F5F5',
        padding: ps.outerPadding ?? 0,
      }}
    >
      <div
        style={{
          background: ps.innerBackgroundColor ?? '#FFFFFF',
          maxWidth: 700,
          margin: '0 auto',
          borderRadius: ps.innerBorderRadius ?? 0,
          border: ps.innerBorderWidth
            ? `${ps.innerBorderWidth}px solid ${ps.innerBorderColor ?? '#E5E5E5'}`
            : 'none',
          overflow: 'hidden',
        }}
      >
        {(normalized.sections || []).map(renderSection)}
      </div>
    </div>
  );
}
