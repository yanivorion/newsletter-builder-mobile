import React, { useState, useRef, useCallback, useEffect } from 'react';
import {
  Plus,
  GripVertical,
  LayoutTemplate,
  PanelBottom,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import SectionContainer from './SectionContainer';
import SectionActionToolbar from './SectionActionToolbar';
import SectionStyleToolbar from './SectionStyleToolbar';
import SectionPropertySheet from './SectionPropertySheet';
import BlockRenderer from '../blocks/BlockRenderer';
import GridRow from './GridRow';
import { isGridSection } from '../../lib/grid-schema';
import FooterSection from '../sections/FooterSection';

function NewsletterEditor({
  newsletter,
  selectedSection,
  selectedBlock,
  onSectionClick,
  onBlockClick,
  onAddSection,
  onInsertSection,
  onAddBlock,
  onAddBlockToColumn,
  onReorderSections,
  onSectionUpdate,
  onPageSettingsUpdate,
  onResizeColumn,
  onDropBlock,
  onDeleteSection,
  onMoveSection,
  onDuplicateSection,
  isUnlocked,
  onOpenCanvasMedia,
  onOpenCanvasProperty,
  onCloseCanvasSheet,
  canvasSheet,
  onSetBlockImage,
  onSetCollageImage,
  sheetBoundsRef,
  sheetBottomInsetPx = 96,
}) {
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [gridInteracting, setGridInteracting] = useState(null);
  const [blockDropTarget, setBlockDropTarget] = useState(null);
  const [activeEdges, setActiveEdges] = useState({});
  const [addBtnDragOver, setAddBtnDragOver] = useState(null);
  const dragCounter = useRef(0);
  const sectionDropCounters = useRef({});

  useEffect(() => {
    const onDragEnd = () => {
      setBlockDropTarget(null);
      setAddBtnDragOver(null);
      sectionDropCounters.current = {};
    };
    document.addEventListener('dragend', onDragEnd);
    return () => document.removeEventListener('dragend', onDragEnd);
  }, []);

  const handleSectionStyleAction = useCallback((route, sectionId) => {
    if (route === 'background') {
      onOpenCanvasMedia?.(sectionId);
      return;
    }
    onOpenCanvasProperty?.(sectionId, route);
  }, [onOpenCanvasMedia, onOpenCanvasProperty]);

  const handleSectionAction = useCallback((action, sectionId) => {
    switch (action) {
      case 'duplicate':
        onDuplicateSection?.(sectionId);
        break;
      case 'delete': {
        const sec = newsletter?.sections?.find((s) => s.id === sectionId);
        const label =
          sec?.type === 'header' ? 'header' : sec?.type === 'footer' ? 'footer' : 'section';
        if (window.confirm(`Delete this ${label}?`)) onDeleteSection?.(sectionId);
        break;
      }
      case 'settings':
        onOpenCanvasProperty?.(sectionId, 'name');
        break;
      case 'up':
        onMoveSection?.(sectionId, 'up');
        break;
      case 'down':
        onMoveSection?.(sectionId, 'down');
        break;
    }
  }, [newsletter?.sections, onDuplicateSection, onDeleteSection, onMoveSection, onOpenCanvasProperty]);

  const propertySheet =
    canvasSheet?.type === 'property' ? canvasSheet : null;

  const handleGridInteractionStart = useCallback((sectionId) => {
    setGridInteracting(sectionId);
  }, []);
  const handleGridInteractionEnd = useCallback(() => {
    setGridInteracting(null);
  }, []);

  if (!newsletter) return null;

  const hasSelectedSection = !!selectedSection;
  const selectedSectionObj = newsletter.sections.find(s => s.id === selectedSection);
  const selectedIsContentSection = selectedSectionObj?.type === 'section';

  // ── Section reorder drag-and-drop (unlock mode) ───────────────────
  const handleDragStart = (e, index) => {
    if (!isUnlocked) return;
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', index.toString());
    setTimeout(() => { e.target.style.opacity = '0.5'; }, 0);
  };

  const handleDragEnd = (e) => {
    e.target.style.opacity = '1';
    setDraggedIndex(null);
    setDragOverIndex(null);
    setBlockDropTarget(null);
    dragCounter.current = 0;
    sectionDropCounters.current = {};
  };

  const handleDragEnter = (e, index) => {
    if (!isUnlocked || draggedIndex === null) return;
    e.preventDefault();
    dragCounter.current++;
    if (index !== draggedIndex) setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    dragCounter.current--;
    if (dragCounter.current === 0) setDragOverIndex(null);
  };

  const handleDragOver = (e) => {
    if (!isUnlocked) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, toIndex) => {
    e.preventDefault();
    if (!isUnlocked || draggedIndex === null) return;
    if (draggedIndex !== toIndex) onReorderSections(draggedIndex, toIndex);
    setDraggedIndex(null);
    setDragOverIndex(null);
    dragCounter.current = 0;
  };

  // ── Toolbar block drag into sections ──────────────────────────────
  const isToolbarDrag = (e) => e.dataTransfer.types.includes('application/block-type');

  const handleSectionDragOver = (e, sectionId) => {
    if (isUnlocked) return;
    if (!isToolbarDrag(e)) return;
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'copy';
    setBlockDropTarget(sectionId);
  };

  const handleSectionDragEnter = (e, sectionId) => {
    if (isUnlocked || !isToolbarDrag(e)) return;
    e.preventDefault();
    sectionDropCounters.current[sectionId] = (sectionDropCounters.current[sectionId] || 0) + 1;
    setBlockDropTarget(sectionId);
  };

  const handleSectionDragLeave = (e, sectionId) => {
    if (isUnlocked || !isToolbarDrag(e)) return;
    sectionDropCounters.current[sectionId] = (sectionDropCounters.current[sectionId] || 0) - 1;
    if (sectionDropCounters.current[sectionId] <= 0) {
      sectionDropCounters.current[sectionId] = 0;
      if (blockDropTarget === sectionId) setBlockDropTarget(null);
    }
  };

  const handleSectionBlockDrop = (e, sectionId) => {
    if (isUnlocked) return;
    e.preventDefault();
    e.stopPropagation();
    setBlockDropTarget(null);
    sectionDropCounters.current[sectionId] = 0;
    const blockType = e.dataTransfer.getData('application/block-type');
    if (blockType) {
      onAddBlock?.(sectionId, blockType);
      onSectionClick?.(sectionId);
    }
  };

  // ── "+" add section button between sections (also a drop target) ──
  const renderAddButton = (index) => {
    const isOver = addBtnDragOver === index;
    return (
      <div
        key={`add-${index}`}
        onDragOver={(e) => {
          if (isUnlocked) return;
          if (!e.dataTransfer.types.includes('application/block-type')) return;
          e.preventDefault();
          e.stopPropagation();
          e.dataTransfer.dropEffect = 'copy';
          setAddBtnDragOver(index);
        }}
        onDragEnter={(e) => {
          if (isUnlocked) return;
          if (!e.dataTransfer.types.includes('application/block-type')) return;
          e.preventDefault();
          setAddBtnDragOver(index);
        }}
        onDragLeave={(e) => {
          if (addBtnDragOver === index) setAddBtnDragOver(null);
        }}
        onDrop={(e) => {
          if (isUnlocked) return;
          e.preventDefault();
          e.stopPropagation();
          setAddBtnDragOver(null);
          const blockType = e.dataTransfer.getData('application/block-type');
          if (blockType) {
            onInsertSection?.(index, blockType);
          }
        }}
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          padding: isOver ? '10px 0' : '4px 0',
          position: 'relative',
          zIndex: 10,
          minHeight: isOver ? 48 : 30,
          transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <button
          onClick={(e) => {
            e.stopPropagation();
            onInsertSection?.(index);
          }}
          className="btn-spring group/add"
          style={{
            width: isOver ? 38 : 28,
            height: isOver ? 38 : 28,
            borderRadius: '50%',
            background: isOver ? '#04D1FC' : 'white',
            border: isOver ? '2px solid #04D1FC' : '1px solid rgba(0,0,0,0.08)',
            color: isOver ? 'white' : '#A1A1AA',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: isOver ? '0 6px 20px rgba(4,209,252,0.35)' : '0 1px 3px rgba(0,0,0,0.06)',
            transition: 'all 200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
          }}
          title="Add section"
        >
          <Plus size={isOver ? 18 : 13} strokeWidth={2} className={isOver ? '' : 'group-hover/add:text-[#04D1FC] transition-colors'} />
        </button>
      </div>
    );
  };

  // ── Section display name ─────────────────────────────────────────
  const getSectionDisplayName = (section) => {
    const typeLabel =
      section.type === 'header' ? 'Header'
        : section.type === 'footer' ? 'Footer'
          : 'Section';
    return section.name || typeLabel;
  };

  const getSectionTypeLabel = (section) => {
    if (section.type === 'header') return 'Header';
    if (section.type === 'footer') return 'Footer';
    return 'Section';
  };

  // ── Render a section ─────────────────────────────────────────────
  const renderSection = (section, index) => {
    const isSelected = selectedSection === section.id;
    const isDragged = draggedIndex === index;
    const isDragOver = dragOverIndex === index;
    const hasSelectedBlock = isSelected && !!selectedBlock;

    const displayName = getSectionDisplayName(section);
    const typeLabel = getSectionTypeLabel(section);

    return (
      <div
        key={section.id}
        data-section-id={section.id}
        draggable={isUnlocked}
        onDragStart={(e) => handleDragStart(e, index)}
        onDragEnd={handleDragEnd}
        onDragEnter={(e) => {
          handleDragEnter(e, index);
          handleSectionDragEnter(e, section.id);
        }}
        onDragLeave={(e) => {
          handleDragLeave(e, index);
          handleSectionDragLeave(e, section.id);
        }}
        onDragOver={(e) => {
          handleDragOver(e);
          handleSectionDragOver(e, section.id);
        }}
        onDrop={(e) => {
          if (e.defaultPrevented) {
            setBlockDropTarget(null);
            sectionDropCounters.current[section.id] = 0;
            return;
          }
          if (isToolbarDrag(e)) {
            handleSectionBlockDrop(e, section.id);
          } else {
            handleDrop(e, index);
          }
        }}
        style={{
          position: 'relative',
          zIndex: isSelected ? 2 : 1,
          transition: 'box-shadow 300ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        className={cn(
          "cursor-pointer group/section rounded-sm transition-shadow duration-200",
          isSelected && !hasSelectedBlock && "ring-2 ring-zinc-950 ring-offset-2",
          isSelected && hasSelectedBlock && "ring-1 ring-zinc-300 ring-offset-1",
          isDragged && "opacity-50",
          isDragOver && "ring-2 ring-[#04D1FC] ring-offset-2",
          blockDropTarget === section.id && "ring-2 ring-[#04D1FC] ring-offset-2",
          isUnlocked && "cursor-grab active:cursor-grabbing"
        )}
        onClick={(e) => {
          if (isUnlocked) return;
          e.stopPropagation();
          onSectionClick(section.id);
        }}
      >
        {!isUnlocked && section.type !== 'footer' && (
          <SectionStyleToolbar
            sectionId={section.id}
            visible={isSelected && !hasSelectedBlock}
            onStyleAction={handleSectionStyleAction}
          />
        )}

        {/* Section action toolbar — overlaps canvas right edge; only when section focused (no block selected) */}
        {!isUnlocked && (
          <SectionActionToolbar
            sectionId={section.id}
            onAction={handleSectionAction}
            visible={isSelected && !hasSelectedBlock}
          />
        )}


        {/* Per-edge padding labels — only visible on hover/drag of that edge */}
        {!isUnlocked && isSelected && (() => {
          const ae = activeEdges[section.id];
          const pad = section.padding || {};
          const isH = ae === 'left' || ae === 'right';
          return (
            <>
              {ae === 'top' && <GutterPadLabel edge="top" value={pad.top ?? 0} />}
              {ae === 'bottom' && <GutterPadLabel edge="bottom" value={pad.bottom ?? 0} />}
              {isH && <GutterPadLabel edge="left" value={pad.left ?? 0} />}
              {isH && <GutterPadLabel edge="right" value={pad.right ?? 0} />}
            </>
          );
        })()}

        {/* Drag Handle */}
        {isUnlocked && (
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-zinc-100/80 to-transparent opacity-0 group-hover/section:opacity-100 transition-opacity flex items-center justify-center z-20">
            <GripVertical className="w-4 h-4 text-zinc-400" />
          </div>
        )}

        {/* Section container */}
        <SectionContainer
          section={section}
          isSelected={isSelected}
          onHeightChange={(h) => onSectionUpdate?.(section.id, { height: Math.round(h) })}
          onPaddingChange={(fullPadding) => {
            onSectionUpdate?.(section.id, { padding: fullPadding });
          }}
          onEdgeState={(edge) => {
            setActiveEdges(prev => ({ ...prev, [section.id]: edge }));
          }}
        >
          {/* Drop-here overlay when dragging a block from toolbar */}
          {blockDropTarget === section.id && (
            <div style={{
              position: 'absolute',
              inset: 0,
              background: 'rgba(4, 209, 252, 0.08)',
              border: '2px dashed rgba(4, 209, 252, 0.4)',
              borderRadius: 4,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 15,
              pointerEvents: 'none',
            }}>
              <span style={{
                background: 'rgba(4, 209, 252, 0.15)',
                color: '#04D1FC',
                fontSize: 12,
                fontWeight: 600,
                padding: '6px 16px',
                borderRadius: 20,
              }}>
                Drop here
              </span>
            </div>
          )}

          {/* Footer sections render the dedicated FooterSection component */}
          {section.type === 'footer' ? (
            <FooterSection {...section} />
          ) : isGridSection(section) ? (
            section.rows.length > 0 ? (
              section.rows.map((row) => (
                <GridRow
                  key={row.id}
                  row={row}
                  sectionId={section.id}
                  selectedBlockId={selectedBlock}
                  isSectionSelected={isSelected}
                  sectionBackground={section.background}
                  onBlockClick={onBlockClick}
                  onAddBlock={onAddBlockToColumn}
                  onDropBlock={onDropBlock}
                  onResizeColumn={onResizeColumn}
                  onInteractionStart={() => handleGridInteractionStart(section.id)}
                  onInteractionEnd={handleGridInteractionEnd}
                  showGrid={isSelected}
                  onSetBlockImage={onSetBlockImage}
                  onSetCollageImage={onSetCollageImage}
                />
              ))
            ) : (
              <EmptyPlaceholder />
            )
          ) : (
            /* Legacy flat blocks mode */
            section.blocks?.length > 0 ? (
              section.blocks.map((block) => (
                <BlockRenderer
                  key={block.id}
                  block={block}
                  isSelected={selectedBlock === block.id}
                  isSectionSelected={isSelected}
                  onClick={(blockId) => onBlockClick?.(section.id, blockId)}
                  sectionBackground={section.background}
                  onSetImage={block.type === 'image' ? () => onSetBlockImage?.(section.id, block.id) : undefined}
                  onSetCollageImage={block.type === 'imageCollage' ? (imgIdx) => onSetCollageImage?.(section.id, block.id, imgIdx) : undefined}
                  onSetLayoutImage={block.type === 'multiLayout' ? (imgIdx) => onSetCollageImage?.(section.id, block.id, imgIdx) : undefined}
                />
              ))
            ) : (
              <EmptyPlaceholder />
            )
          )}
        </SectionContainer>


        {/* Drop indicator */}
        {isDragOver && draggedIndex !== null && draggedIndex !== index && (
          <div className={cn(
            "absolute left-0 right-0 h-1 bg-[#04D1FC] rounded-full z-30",
            draggedIndex < index ? "bottom-0 translate-y-1/2" : "top-0 -translate-y-1/2"
          )} />
        )}
      </div>
    );
  };

  // ── Main render ──────────────────────────────────────────────────
  return (
    <>
    <div className="flex flex-col gap-0 relative">
      {/* Unlock Indicator */}
      {isUnlocked && (
        <div className="mx-auto mb-2 content-enter">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#04D1FC]/8 border border-[#04D1FC]/15 rounded-full text-xs font-medium text-[#04D1FC] backdrop-blur-sm shadow-[0_2px_8px_rgba(4,209,252,0.12)]">
            <GripVertical className="w-3.5 h-3.5" />
            Drag sections to reorder
          </div>
        </div>
      )}

      {/* Newsletter preview — fluid width up to 700px (parent caps); natural height, scroll in EditorPage */}
      <div className="relative mx-auto w-full shrink-0" style={{ position: 'relative' }}>
        {/* Page — compact white chip like mobile preview chrome */}
        <button
          type="button"
          onClick={() => onSectionClick(null)}
          className={`mb-1.5 flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[10px] font-semibold shadow-sm transition-all ${
            !selectedSection
              ? 'border-slate-800 bg-slate-900 text-white'
              : 'border-zinc-200/90 bg-white text-zinc-500 hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-700'
          }`}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M9 21V9"/></svg>
          Page
        </button>
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              onSectionClick(null);
            }
          }}
          onDragOver={(e) => {
            if (isUnlocked) return;
            if (!e.dataTransfer.types.includes('application/block-type')) return;
            e.preventDefault();
            e.dataTransfer.dropEffect = 'copy';
          }}
          onDrop={(e) => {
            if (isUnlocked) return;
            if (e.defaultPrevented) return;
            const blockType = e.dataTransfer.getData('application/block-type');
            if (!blockType) return;
            e.preventDefault();
            e.stopPropagation();
            setBlockDropTarget(null);
            onInsertSection?.(newsletter.sections.length, blockType);
          }}
          style={{
            backgroundColor: newsletter.pageSettings?.outerBackgroundColor || '#F5F5F5',
            padding: `${newsletter.pageSettings?.outerPadding || 20}px`,
            borderRadius: '12px',
            overflow: 'visible',
            width: '100%',
            margin: 'auto',
            marginTop: '30px',
            maxHeight: 'max-content',
            height: 'auto',
          }}
          className="shadow-[var(--shadow-rest)] border border-zinc-950"
        >
          <div
            style={{
              backgroundColor: newsletter.pageSettings?.innerBackgroundColor || '#FFFFFF',
              borderRadius: `${newsletter.pageSettings?.innerBorderRadius || 0}px`,
              border: newsletter.pageSettings?.innerBorderWidth
                ? `${newsletter.pageSettings.innerBorderWidth}px solid ${newsletter.pageSettings?.innerBorderColor || '#E5E5E5'}`
                : 'none',
              position: 'relative',
              overflow: 'visible',
            }}
          >
            {(() => {
              const hasHeader = newsletter.sections.some((s) => s.type === 'header');
              const hasFooter = newsletter.sections.some((s) => s.type === 'footer');
              return (
                <>
                  {!hasHeader && (
                    <SlotAddButton
                      label="Add Header"
                      icon={LayoutTemplate}
                      onClick={() => onAddSection?.('header')}
                    />
                  )}

                  {newsletter.sections.map((section, index) => (
                    <React.Fragment key={section.id}>
                      {index > 0 && (newsletter.pageSettings?.sectionGap ?? 16) > 0 && (
                        <div style={{ height: `${newsletter.pageSettings?.sectionGap ?? 16}px` }} />
                      )}
                      {renderSection(section, index)}
                      {renderAddButton(index + 1)}
                    </React.Fragment>
                  ))}

                  {newsletter.sections.length === 0 && renderAddButton(0)}

                  {!hasFooter && (
                    <SlotAddButton
                      label="Add Footer"
                      icon={PanelBottom}
                      onClick={() => onAddSection?.('footer')}
                    />
                  )}
                </>
              );
            })()}
          </div>
        </div>
      </div>
    </div>

    <SectionPropertySheet
      open={!!propertySheet}
      mode={propertySheet?.mode ?? 'name'}
      section={
        propertySheet?.sectionId
          ? newsletter.sections.find((s) => s.id === propertySheet.sectionId)
          : null
      }
      sectionId={propertySheet?.sectionId ?? null}
      selectedBlock={selectedBlock}
      onClose={onCloseCanvasSheet}
      onSectionUpdate={onSectionUpdate}
      onBlockClick={(sid, bid) => {
        onBlockClick?.(sid, bid);
        onCloseCanvasSheet?.();
      }}
      boundsRef={sheetBoundsRef}
      bottomInsetPx={sheetBottomInsetPx}
    />
    </>
  );
}

// ── Slot button to add back a missing Header or Footer ──
function SlotAddButton({ label, icon: Icon, onClick }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: '10px 0' }}>
      <button
        type="button"
        onClick={onClick}
        className="btn-spring"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 8,
          height: 32,
          padding: '0 12px',
          borderRadius: 999,
          background: 'rgba(4,209,252,0.08)',
          border: '1px dashed rgba(4,209,252,0.45)',
          color: '#0284A8',
          fontSize: 12,
          fontWeight: 500,
          cursor: 'pointer',
          transition: 'all 180ms cubic-bezier(0.22, 1, 0.36, 1)',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = 'rgba(4,209,252,0.14)';
          e.currentTarget.style.borderColor = 'rgba(4,209,252,0.7)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'rgba(4,209,252,0.08)';
          e.currentTarget.style.borderColor = 'rgba(4,209,252,0.45)';
        }}
      >
        <Plus size={14} strokeWidth={2.2} />
        <Icon size={14} strokeWidth={2} />
        <span>{label}</span>
      </button>
    </div>
  );
}

// ── Empty section placeholder (transparent, no text) ──
function EmptyPlaceholder() {
  return (
    <div style={{
      minHeight: 48,
      position: 'relative',
    }} />
  );
}

// ── Individual padding label positioned contextually in the gutter ──
function GutterPadLabel({ edge, value }) {
  const shared = {
    position: 'absolute',
    zIndex: 30,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const badge = {
    fontSize: 9,
    fontWeight: 600,
    fontFamily: 'system-ui, sans-serif',
    letterSpacing: '0.06em',
    color: '#04D1FC',
    background: 'rgba(255,255,255,0.85)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(4,209,252,0.15)',
    borderRadius: 5,
    padding: '2px 7px',
    lineHeight: 1,
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
    transition: 'opacity 250ms cubic-bezier(0.22, 1, 0.36, 1)',
  };

  switch (edge) {
    case 'top':
      return (
        <div style={{ ...shared, right: 'calc(100% + 12px)', top: 0 }}>
          <span style={badge}>{value}</span>
        </div>
      );
    case 'bottom':
      return (
        <div style={{ ...shared, right: 'calc(100% + 12px)', bottom: 0 }}>
          <span style={badge}>{value}</span>
        </div>
      );
    case 'left':
      return (
        <div style={{ ...shared, right: 'calc(100% + 12px)', top: '50%', transform: 'translateY(-50%)' }}>
          <span style={badge}>{value}</span>
        </div>
      );
    case 'right':
      return (
        <div style={{ ...shared, left: 'calc(100% + 12px)', top: '50%', transform: 'translateY(-50%)' }}>
          <span style={badge}>{value}</span>
        </div>
      );
    default:
      return null;
  }
}

export default NewsletterEditor;
