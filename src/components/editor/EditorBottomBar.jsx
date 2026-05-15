import React, { useCallback, useEffect, useState } from 'react';
import { useStagger } from '@/hooks/useStagger';
import {
  Type,
  Heading,
  Image,
  Grid2x2,
  LayoutGrid,
  Film,
  MoveHorizontal,
  MousePointerClick,
  Minus,
  ArrowUpDown,
  Columns,
  Sparkles,
  Clipboard,
  Check,
  Plus,
  X,
  Palette,
  House,
  MessageCircle,
  FileText,
  Calendar,
  Share2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import FloatingThemeBar from '@/components/editor/FloatingThemeBar';

const BLOCK_ITEMS = [
  { type: 'text', label: 'Text', icon: Type },
  { type: 'title', label: 'Title', icon: Heading },
  { type: 'image', label: 'Image', icon: Image },
  { type: 'imageGrid', label: 'Grid', icon: Grid2x2 },
  { type: 'imageCollage', label: 'Collage', icon: LayoutGrid },
  { type: 'imageSequence', label: 'GIF', icon: Film },
  { type: 'marquee', label: 'Scroll', icon: MoveHorizontal },
  { type: 'animatedText', label: 'Motion', icon: Sparkles },
  { type: 'multiLayout', label: 'Layout', icon: Columns },
  { type: 'button', label: 'Button', icon: MousePointerClick },
  { type: 'divider', label: 'Line', icon: Minus },
  { type: 'spacer', label: 'Space', icon: ArrowUpDown },
];

const CHAT_ACTION_COUNT = 3;

const dockIconBtn =
  'flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-zinc-600 transition-colors hover:bg-white/35 active:scale-95';

/** Matches section action chips (EditorBottomBar chat + block stacks use useStagger) */
const stackBtnDockFlyout =
  'btn-spring flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-zinc-200/80 bg-white text-zinc-600 shadow-sm transition-all active:scale-95 hover:border-zinc-300/90 hover:bg-zinc-50 hover:text-zinc-900';

/**
 * Glass pill dock flush to editor bottom; “+” toggles a horizontal glass add-rail (stagger, overflow-x) above the dock.
 */
export default function EditorBottomBar({
  newsletter,
  selectedSection,
  onSectionClick,
  onAddBlock,
  onExport,
  onCopyGmail,
  copiedDesign,
  shareLinkCopied = false,
  onThemeColor,
  onThemeGradient,
  onNavigateHome,
  onCopyShareLink,
  onOpenSend,
  /** Distance from viewport bottom to the block stack (matches sidebar padding reserve + dock). */
  dockStackBottomPx = 86,
  /** When layout picker is open, dock stays above its overlay. */
  layoutPickerOpen = false,
}) {
  const [blocksOpen, setBlocksOpen] = useState(false);
  const [blockStaggerEpoch, setBlockStaggerEpoch] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const [chatStaggerEpoch, setChatStaggerEpoch] = useState(0);
  const [themeOpen, setThemeOpen] = useState(false);

  const blockStagger = useStagger(BLOCK_ITEMS.length, {
    delay: 36,
    baseDelay: 60,
    duration: 340,
    distance: 0,
    axis: 'x',
    key: blocksOpen ? `dock-blocks-${blockStaggerEpoch}` : null,
  });

  const chatStagger = useStagger(CHAT_ACTION_COUNT, {
    delay: 40,
    baseDelay: 80,
    duration: 350,
    distance: 8,
    axis: 'y',
    key: chatOpen ? `dock-chat-${chatStaggerEpoch}` : null,
  });

  const closeAll = useCallback(() => {
    setBlocksOpen(false);
    setChatOpen(false);
    setThemeOpen(false);
  }, []);

  useEffect(() => {
    if (!layoutPickerOpen) return;
    setBlocksOpen(false);
    setChatOpen(false);
    setThemeOpen(false);
  }, [layoutPickerOpen]);

  useEffect(() => {
    if (!blocksOpen && !chatOpen && !themeOpen) return;
    const onDown = (e) => {
      const t = e.target;
      if (
        t.closest?.('[data-editor-dock="true"]')
        || t.closest?.('[data-editor-style-dock="true"]')
        || t.closest?.('[data-add-element-rail="true"]')
      ) return;
      closeAll();
    };
    document.addEventListener('pointerdown', onDown, true);
    return () => document.removeEventListener('pointerdown', onDown, true);
  }, [blocksOpen, chatOpen, themeOpen, closeAll]);

  const resolveTargetSectionId = useCallback(() => {
    if (!newsletter?.sections?.length) return null;
    if (selectedSection) {
      const sel = newsletter.sections.find((s) => s.id === selectedSection);
      if (sel?.type === 'section') return selectedSection;
    }
    for (let i = newsletter.sections.length - 1; i >= 0; i--) {
      if (newsletter.sections[i].type === 'section') return newsletter.sections[i].id;
    }
    return null;
  }, [newsletter, selectedSection]);

  const handleBlockTap = useCallback(
    (type) => {
      const sectionId = resolveTargetSectionId();
      if (!sectionId) {
        window.alert('Select a content section (or add one), then tap a block again.');
        return;
      }
      onAddBlock?.(sectionId, type);
      onSectionClick?.(sectionId);
      setBlocksOpen(false);
    },
    [resolveTargetSectionId, onAddBlock, onSectionClick]
  );

  const stackBottom = `calc(${dockStackBottomPx}px + env(safe-area-inset-bottom, 0px))`;
  /** Glass add-toolbar sits just above the pill nav (taller with 60px block chips). */
  const addRailBottom = `calc(${dockStackBottomPx}px + 70px + env(safe-area-inset-bottom, 0px))`;
  const dockPadBottom = `max(10px, env(safe-area-inset-bottom, 0px))`;

  const glassNav = cn(
    'relative grid w-full grid-cols-5 items-center gap-0 rounded-full border border-white/40 px-1.5 py-1.5',
    'bg-white/55 shadow-[0_12px_40px_rgba(15,23,42,0.18)] backdrop-blur-2xl supports-[backdrop-filter]:bg-white/45',
    (blocksOpen || chatOpen) && 'ring-1 ring-white/50'
  );

  return (
    <div
      className={cn(
        'pointer-events-none absolute inset-x-0 bottom-0',
        layoutPickerOpen ? 'z-[10060]' : 'z-[80]',
      )}
      style={{ paddingBottom: dockPadBottom }}
    >
      <div data-editor-dock="true" className="pointer-events-none relative mx-auto w-full max-w-[min(100%,420px)] px-3">
        {/* Block types — horizontal glass rail above dock (+ becomes X while open) */}
        {blocksOpen && (
          <div
            data-add-element-rail="true"
            className="pointer-events-auto absolute inset-x-0 z-[4]"
            style={{ bottom: addRailBottom }}
          >
            <div
              className={cn(
                'flex w-full items-center gap-3 overflow-x-auto overflow-y-visible border-t border-white/30',
                'py-3 pl-4 pr-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden',
              )}
              style={{
                WebkitOverflowScrolling: 'touch',
                background: 'rgba(255,255,255,0.18)',
                backdropFilter: 'blur(40px) saturate(200%)',
                WebkitBackdropFilter: 'blur(40px) saturate(200%)',
                boxShadow: '0 -1px 0 rgba(255,255,255,0.25), 0 8px 32px rgba(15,23,42,0.12)',
              }}
            >
              {BLOCK_ITEMS.map(({ type, label, icon: Icon }, i) => (
                <button
                  key={type}
                  type="button"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData('application/block-type', type);
                    e.dataTransfer.effectAllowed = 'copy';
                  }}
                  style={blockStagger(i)}
                  className={cn(
                    'flex size-[60px] shrink-0 items-center justify-center rounded-full',
                    'border-[1.5px] border-solid border-[rgb(239_239_246/0.8)] bg-transparent',
                    'text-[#52525B] shadow-none ring-0 outline-none',
                    'transition-[border-color,opacity] duration-200 ease-out',
                    'hover:border-[rgb(252_252_255/0.95)] hover:bg-transparent',
                    'active:opacity-80',
                    'focus-visible:ring-2 focus-visible:ring-[rgb(239_239_246/0.35)] focus-visible:ring-offset-0',
                  )}
                  title={label}
                  aria-label={label}
                  onClick={() => handleBlockTap(type)}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={2} />
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="pointer-events-auto flex justify-center">
          <nav className={cn(glassNav, 'w-full max-w-[min(100%,400px)]')} aria-label="Editor actions">
            {/* Col 1 — Home */}
            <div className="relative flex h-[52px] w-full items-center justify-center">
              <button
                type="button"
                className={cn(dockIconBtn, 'text-violet-600 hover:bg-violet-500/15')}
                aria-label="Home"
                onClick={() => {
                  closeAll();
                  onNavigateHome?.();
                }}
              >
                <House className="h-[18px] w-[18px]" strokeWidth={2.25} />
              </button>
            </div>

            {/* Col 2 — Chat + stagger + theme */}
            <div className="relative z-[3] flex h-[52px] w-full items-center justify-center">
              {chatOpen && (
                <div className="pointer-events-auto absolute bottom-full left-1/2 z-[2] mb-2 flex -translate-x-1/2 flex-col-reverse items-center gap-1.5 overflow-visible px-0.5 pb-0.5">
                  <button
                    type="button"
                    style={{
                      ...chatStagger(0),
                      boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
                    }}
                    className={cn(stackBtnDockFlyout, copiedDesign && 'border-emerald-200 bg-emerald-50 text-emerald-700')}
                    title="Copy for Gmail"
                    onClick={() => {
                      onCopyGmail?.();
                      setChatOpen(false);
                      setThemeOpen(false);
                    }}
                  >
                    {copiedDesign ? <Check className="h-4 w-4" strokeWidth={2} /> : <Clipboard className="h-4 w-4" strokeWidth={2} />}
                  </button>
                  <button
                    type="button"
                    style={{
                      ...chatStagger(1),
                      boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
                    }}
                    className={cn(stackBtnDockFlyout, shareLinkCopied && 'border-emerald-200 bg-emerald-50 text-emerald-700')}
                    title="Copy share link"
                    onClick={() => {
                      onCopyShareLink?.();
                      setChatOpen(false);
                      setThemeOpen(false);
                    }}
                  >
                    {shareLinkCopied ? <Check className="h-4 w-4" strokeWidth={2} /> : <Share2 className="h-4 w-4" strokeWidth={2} />}
                  </button>
                  <button
                    type="button"
                    style={{
                      ...chatStagger(2),
                      boxShadow: '0 2px 8px rgba(15,23,42,0.08)',
                    }}
                    className={cn(stackBtnDockFlyout, themeOpen && 'border-sky-200 bg-sky-50 text-sky-700')}
                    title="Theme"
                    onClick={() => setThemeOpen((t) => !t)}
                  >
                    <Palette className="h-4 w-4" strokeWidth={2} />
                  </button>
                  {themeOpen && (
                    <div
                      data-theme-sheet="true"
                      className="pointer-events-auto max-h-[30vh] w-[min(260px,72vw)] overflow-y-auto rounded-2xl border border-white/50 bg-white/90 shadow-xl backdrop-blur-md"
                    >
                      <FloatingThemeBar
                        panelOnly
                        variant="dock"
                        onSelectColor={onThemeColor}
                        onSelectGradient={onThemeGradient}
                        selectedSection={selectedSection}
                      />
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                className={cn(dockIconBtn, chatOpen && 'bg-white/40 text-zinc-900')}
                aria-expanded={chatOpen}
                aria-label="Messages and sharing"
                onClick={() => {
                  setBlocksOpen(false);
                  setChatOpen((was) => {
                    if (was) setThemeOpen(false);
                    const next = !was;
                    if (next) setChatStaggerEpoch((e) => e + 1);
                    return next;
                  });
                }}
              >
                <MessageCircle className="h-[18px] w-[18px]" strokeWidth={1.85} />
              </button>
            </div>

            {/* Col 3 — Add (larger than section +, light circular control) */}
            <div className="relative z-[2] flex h-[52px] w-full items-center justify-center">
              <button
                type="button"
                className={cn(
                  'flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-sky-200/90 bg-gradient-to-b from-sky-50 to-sky-200/90 text-indigo-600 shadow-md transition active:scale-95',
                  blocksOpen && 'ring-2 ring-sky-300/80 ring-offset-2 ring-offset-transparent'
                )}
                aria-expanded={blocksOpen}
                aria-label={blocksOpen ? 'Close add block menu' : 'Add block'}
                onClick={() => {
                  setChatOpen(false);
                  setThemeOpen(false);
                  setBlocksOpen((was) => {
                    const next = !was;
                    if (next) setBlockStaggerEpoch((e) => e + 1);
                    return next;
                  });
                }}
              >
                {blocksOpen ? (
                  <X className="h-5 w-5" strokeWidth={2.35} />
                ) : (
                  <Plus className="h-5 w-5" strokeWidth={2.5} />
                )}
              </button>
            </div>

            {/* Col 4 — Export */}
            <div className="relative flex h-[52px] w-full items-center justify-center">
              <button
                type="button"
                className={cn(dockIconBtn)}
                aria-label="Export HTML"
                onClick={() => {
                  closeAll();
                  onExport?.();
                }}
              >
                <FileText className="h-[18px] w-[18px]" strokeWidth={1.85} />
              </button>
            </div>

            {/* Col 5 — Send */}
            <div className="relative flex h-[52px] w-full items-center justify-center">
              <button
                type="button"
                className={cn(dockIconBtn)}
                aria-label="Send campaign"
                onClick={() => {
                  closeAll();
                  onOpenSend?.();
                }}
              >
                <Calendar className="h-[18px] w-[18px]" strokeWidth={1.85} />
              </button>
            </div>
          </nav>
        </div>
      </div>
    </div>
  );
}
