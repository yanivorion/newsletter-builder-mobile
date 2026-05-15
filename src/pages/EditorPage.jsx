import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowLeft, Download, Copy, X, Mail, Undo2, Redo2,
  Clipboard, Check, Save, Upload, FileJson, Eye, Send,
  Code, Loader2, AlertTriangle, Users, Share2, Link as LinkIcon,
  MoreHorizontal, Lock, Unlock, Palette, LayoutTemplate,
} from 'lucide-react';
import NewsletterEditor from '@/components/editor/NewsletterEditor';
import SidebarEditor from '@/components/editor/SidebarEditor';
import ThemePanel from '@/components/editor/ThemePanel';
import PageSettingsPanel from '@/components/editor/PageSettingsPanel';
import FloatingMediaModal from '@/components/editor/FloatingMediaModal';
import LayoutCarousel from '@/components/editor/LayoutCarousel';
import TemplateSelector from '@/components/editor/TemplateSelector';
import EditorBottomBar from '@/components/editor/EditorBottomBar';
import { Button } from '@/components/ui/Button';
import { exportToHTML, exportForGmail, resolveNewsletterImages } from '@/utils/emailExport';
import { convertNewsletterForEmail, findDynamicBlocks } from '@/utils/convertNewsletter';
import { exportMarqueeAsGif } from '@/utils/sequenceGifExport';
import { cn } from '@/lib/utils';
import { useHistory } from '@/hooks/useHistory';
import { useAutosave } from '@/hooks/useAutosave';
import { useNewsletterStorage } from '@/hooks/useNewsletterStorage';
import { useProjects } from '@/hooks/useProjects';
import { useAuth } from '@/context/AuthContext';
import { getDefaultSectionData, blankTemplate } from '@/lib/default-sections';
import { createSection, createBlock } from '@/lib/section-schema';
import { migrateNewsletter, isNewFormat } from '@/lib/migrate-sections';
import {
  isGridSection,
  createGridRow,
  createGridColumn,
  resizeColumnsAtDivider,
  moveBlockBetweenColumns,
  addBlockToColumn,
  GRID_COLUMNS,
} from '@/lib/grid-schema';

/** Space reserved above the glass bottom dock (nav + padding + gap). */
const EDITOR_DOCK_CLEARANCE_PX = 96;

export default function EditorPage({ id: idProp }) {
  // The Vite app router passes the route id directly as a string prop.
  const params = { id: idProp ?? 'new' };
  const router = useRouter();
  const isNew = params.id === 'new';

  // Defer localStorage-dependent values until after mount to avoid SSR/client hydration mismatch.
  const [hasMounted, setHasMounted] = useState(false);
  useEffect(() => { setHasMounted(true); }, []);

  const [selectedSection, setSelectedSection] = useState(null);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [exportedHTML, setExportedHTML] = useState('');
  const [previewHTML, setPreviewHTML] = useState('');
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [copiedDesign, setCopiedDesign] = useState(false);
  const [copiedShareLink, setCopiedShareLink] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [savedToProject, setSavedToProject] = useState(false);
  /** One canvas bottom sheet at a time: media library or section property panel. */
  const [canvasSheet, setCanvasSheet] = useState(null);
  const [mediaTargetSection, setMediaTargetSection] = useState(null);
  const [mediaTargetBlock, setMediaTargetBlock] = useState(null);
  const [layoutCarousel, setLayoutCarousel] = useState(null);

  // Send modal state
  const [sendSubject, setSendSubject] = useState('');
  const [sendStatus, setSendStatus] = useState(null); // null | 'loading' | 'ready' | 'sending' | 'sent' | 'error'
  const [sendResults, setSendResults] = useState(null);
  const [subscriberCount, setSubscriberCount] = useState(null);

  useEffect(() => {
    if (!showSendModal) return;
    let cancelled = false;
    (async () => {
      try {
        const subRes = await fetch('/api/subscribers?status=active&limit=10000');
        const subData = await subRes.json();
        if (cancelled) return;
        setSubscriberCount(subData.subscribers?.length ?? 0);
        setSendStatus('ready');
      } catch {
        if (cancelled) return;
        setSubscriberCount(0);
        setSendStatus('ready');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [showSendModal]);

  // Convert-for-email state
  const [showConvertModal, setShowConvertModal] = useState(false);
  const [showThemeSwatchesModal, setShowThemeSwatchesModal] = useState(false);
  const [showPageSettingsModal, setShowPageSettingsModal] = useState(false);
  const [convertProgress, setConvertProgress] = useState(null);
  const [convertedNewsletter, setConvertedNewsletter] = useState(null);
  const [convertError, setConvertError] = useState(null);
  const [copiedConverted, setCopiedConverted] = useState(false);

  const fileInputRef = useRef(null);
  const headerRef = useRef(null);
  const canvasOuterRef = useRef(null);
  const newsletterColumnRef = useRef(null);
  const [headerMenuOpen, setHeaderMenuOpen] = useState(false);

  useEffect(() => {
    if (!headerMenuOpen) return;
    const onPointerDown = (e) => {
      if (headerRef.current && !headerRef.current.contains(e.target)) {
        setHeaderMenuOpen(false);
      }
    };
    document.addEventListener('pointerdown', onPointerDown, true);
    return () => document.removeEventListener('pointerdown', onPointerDown, true);
  }, [headerMenuOpen]);

  const {
    state: newsletter,
    setState: setNewsletter,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useHistory(null);

  const {
    loadSavedNewsletter,
    clearSavedNewsletter,
    hasSavedNewsletter,
    getLastSaveTime,
  } = useAutosave(newsletter, setNewsletter);

  const { user } = useAuth();
  const {
    newsletters,
    saveNewsletter,
    loadNewsletter,
    deleteNewsletter,
    exportAsJSON,
    importFromJSON,
  } = useNewsletterStorage(user?.id);
  const { saveProject } = useProjects();

  const projects = newsletters;

  const [showEditor, setShowEditor] = useState(false);

  // Load newsletter on mount (with migration for old format)
  useEffect(() => {
    if (isNew) return;
    let cancelled = false;
    loadNewsletter(params?.id).then((projectData) => {
      if (cancelled) return;
      let data = projectData;
      if (!data && hasSavedNewsletter()) data = loadSavedNewsletter();
      if (!data) data = JSON.parse(JSON.stringify(blankTemplate));
      setNewsletter(migrateNewsletter(data));
    });
    return () => { cancelled = true; };
  }, [params?.id, isNew, loadNewsletter, hasSavedNewsletter, loadSavedNewsletter]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'z') {
        e.preventDefault();
        e.shiftKey ? redo() : undo();
      }
      if ((e.metaKey || e.ctrlKey) && e.key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [undo, redo]);

  const handleSectionClick = (sectionId) => {
    setSelectedSection(sectionId);
    setSelectedBlock(null);
  };

  const handleBlockClick = useCallback((sectionId, blockId) => {
    setSelectedSection(sectionId);
    setSelectedBlock(blockId);
  }, []);

  const handleSectionUpdate = useCallback(
    (sectionId, updates) => {
      setNewsletter((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === sectionId ? { ...s, ...updates } : s
        ),
      }));
    },
    [setNewsletter]
  );

  const handlePageSettingsUpdate = useCallback(
    (updates) => {
      setNewsletter((prev) => ({
        ...prev,
        pageSettings: { ...prev.pageSettings, ...updates },
      }));
    },
    [setNewsletter]
  );

  const handleToggleUnlock = useCallback(() => setIsUnlocked((p) => !p), []);

  const handleAddSection = (sectionType, preset) => {
    // Header / Footer are singletons with fixed positions.
    // If one already exists, just select it instead of duplicating.
    if (sectionType === 'header' || sectionType === 'footer') {
      const existing = newsletter?.sections?.find((s) => s.type === sectionType);
      if (existing) {
        setSelectedSection(existing.id);
        setSelectedBlock(null);
        return;
      }
      const newSection = createSection(sectionType, { preset });
      setNewsletter((prev) => {
        const sections = [...prev.sections];
        if (sectionType === 'header') {
          sections.unshift(newSection);
        } else {
          sections.push(newSection);
        }
        return { ...prev, sections };
      });
      setSelectedSection(newSection.id);
      setSelectedBlock(null);
      return;
    }

    // Non-header/footer dock items are actually section presets.
    // Create them as 'section' with the chosen preset so blocks populate correctly.
    const SECTION_PRESET_KEYS = new Set([
      'text', 'promo', 'accent', 'gallery', 'sequence',
      'marquee', 'profiles', 'recipe',
    ]);
    const isPresetKey = SECTION_PRESET_KEYS.has(sectionType);
    const actualType = sectionType === 'section' || isPresetKey ? 'section' : sectionType;
    const actualPreset = isPresetKey ? sectionType : preset;
    const newSection = createSection(actualType, { preset: actualPreset });

    setNewsletter((prev) => {
      const sections = [...prev.sections];
      // Insert before the footer if one exists, otherwise append.
      const footerIdx = sections.findIndex((s) => s.type === 'footer');
      if (footerIdx === -1) {
        sections.push(newSection);
      } else {
        sections.splice(footerIdx, 0, newSection);
      }
      return { ...prev, sections };
    });
    setSelectedSection(newSection.id);
    setSelectedBlock(null);
  };

  const handleInsertSection = useCallback((atIndex, blockType) => {
    if (blockType === 'multiLayout') {
      setLayoutCarousel({ atIndex });
      return;
    }
    const blocks = blockType ? [createBlock(blockType)] : [];
    const newSection = createSection('section', { blocks: blocks.length ? blocks : undefined });
    setNewsletter((prev) => {
      const sections = [...prev.sections];
      sections.splice(atIndex, 0, newSection);
      return { ...prev, sections };
    });
    setSelectedSection(newSection.id);
    if (blocks.length) {
      setSelectedBlock(blocks[0].id);
      if (blockType === 'image') {
        setMediaTargetBlock({ sectionId: newSection.id, blockId: blocks[0].id });
        setMediaTargetSection(null);
        setCanvasSheet({ type: 'media', sectionId: newSection.id });
      }
    } else {
      setSelectedBlock(null);
    }
  }, [setNewsletter]);

  const handleLayoutCarouselSelect = useCallback((layoutId) => {
    if (!layoutCarousel) return;
    const block = createBlock('multiLayout');
    block.layout = layoutId;

    if (typeof layoutCarousel.atIndex === 'number') {
      const { atIndex } = layoutCarousel;
      const newSection = createSection('section', { blocks: [block] });
      setNewsletter((prev) => {
        const sections = [...prev.sections];
        sections.splice(atIndex, 0, newSection);
        return { ...prev, sections };
      });
      setSelectedSection(newSection.id);
      setSelectedBlock(block.id);
    } else if (layoutCarousel.sectionId) {
      const { sectionId } = layoutCarousel;
      setNewsletter((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id !== sectionId) return s;
          if (isGridSection(s)) {
            const newRow = createGridRow([createGridColumn(GRID_COLUMNS, [block])]);
            return { ...s, rows: [...s.rows, newRow] };
          }
          return { ...s, blocks: [...(s.blocks || []), block] };
        }),
      }));
      setSelectedSection(sectionId);
      setSelectedBlock(block.id);
    }
    setLayoutCarousel(null);
  }, [layoutCarousel, setNewsletter]);

  const handleAddBlock = useCallback((sectionId, blockType) => {
    if (blockType === 'multiLayout') {
      setLayoutCarousel({ sectionId });
      return;
    }
    const newBlock = createBlock(blockType);
    setNewsletter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        if (isGridSection(s)) {
          const newRow = createGridRow([createGridColumn(GRID_COLUMNS, [newBlock])]);
          return { ...s, rows: [...s.rows, newRow] };
        }
        return { ...s, blocks: [...(s.blocks || []), newBlock] };
      }),
    }));
    setSelectedBlock(newBlock.id);
    if (blockType === 'image') {
      setMediaTargetBlock({ sectionId, blockId: newBlock.id });
      setMediaTargetSection(null);
      setCanvasSheet({ type: 'media', sectionId });
    }
  }, [setNewsletter]);

  // Add block to a specific column in a grid row
  const handleAddBlockToColumn = useCallback((sectionId, rowId, colId, blockType = 'text') => {
    const newBlock = createBlock(blockType);
    setNewsletter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId || !isGridSection(s)) return s;
        return {
          ...s,
          rows: addBlockToColumn(s.rows, rowId, colId, newBlock),
        };
      }),
    }));
    setSelectedSection(sectionId);
    setSelectedBlock(newBlock.id);
    if (blockType === 'image') {
      setMediaTargetBlock({ sectionId, blockId: newBlock.id });
      setMediaTargetSection(null);
      setCanvasSheet({ type: 'media', sectionId });
    }
  }, [setNewsletter]);

  const handleBlockUpdate = useCallback((sectionId, blockId, updates) => {
    setNewsletter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        // Grid mode: find and update block inside rows
        if (isGridSection(s)) {
          return {
            ...s,
            rows: s.rows.map((r) => ({
              ...r,
              columns: r.columns.map((c) => ({
                ...c,
                blocks: c.blocks.map((b) =>
                  b.id === blockId ? { ...b, ...updates } : b
                ),
              })),
            })),
          };
        }
        // Legacy flat mode
        return {
          ...s,
          blocks: s.blocks.map((b) =>
            b.id === blockId ? { ...b, ...updates } : b
          ),
        };
      }),
    }));
  }, [setNewsletter]);

  const resolveSelectedBlock = useCallback(() => {
    if (!newsletter || !selectedSection || !selectedBlock) return { parentSection: null, block: null };
    const parentSection = newsletter.sections.find((s) => s.id === selectedSection);
    if (!parentSection) return { parentSection: null, block: null };
    let block = null;
    if (isGridSection(parentSection)) {
      for (const row of parentSection.rows || []) {
        for (const col of row.columns || []) {
          const b = col.blocks?.find((x) => x.id === selectedBlock);
          if (b) {
            block = b;
            break;
          }
        }
        if (block) break;
      }
    }
    if (!block) block = parentSection.blocks?.find((b) => b.id === selectedBlock) || null;
    return { parentSection, block };
  }, [newsletter, selectedSection, selectedBlock]);

  const handleSwatchColorPick = useCallback(
    (color) => {
      if (!newsletter) return;
      const { parentSection, block } = resolveSelectedBlock();
      if (block && (block.type === 'text' || block.type === 'title')) {
        handleBlockUpdate(selectedSection, selectedBlock, { color });
        return;
      }
      if (parentSection) {
        handleSectionUpdate(selectedSection, {
          background: { ...(parentSection.background || {}), type: 'solid', color },
        });
      }
    },
    [newsletter, selectedSection, selectedBlock, resolveSelectedBlock, handleBlockUpdate, handleSectionUpdate]
  );

  const handleSwatchGradientPick = useCallback(
    (start, end) => {
      if (!newsletter || !selectedSection) return;
      const parentSection = newsletter.sections.find((s) => s.id === selectedSection);
      if (!parentSection) return;
      handleSectionUpdate(selectedSection, {
        background: {
          ...(parentSection.background || {}),
          type: 'gradient',
          gradientStart: start,
          gradientEnd: end,
          gradientAngle: 135,
        },
      });
    },
    [newsletter, selectedSection, handleSectionUpdate]
  );

  const handleDeleteBlock = useCallback((sectionId, blockId) => {
    setNewsletter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        // Grid mode: remove block from its column
        if (isGridSection(s)) {
          return {
            ...s,
            rows: s.rows.map((r) => ({
              ...r,
              columns: r.columns.map((c) => ({
                ...c,
                blocks: c.blocks.filter((b) => b.id !== blockId),
              })),
            })),
          };
        }
        // Legacy flat mode
        return { ...s, blocks: s.blocks.filter((b) => b.id !== blockId) };
      }),
    }));
    setSelectedBlock(null);
  }, [setNewsletter]);

  const handleReorderBlocks = useCallback((sectionId, fromIndex, toIndex) => {
    setNewsletter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId) return s;
        // Grid mode doesn't use this (uses drag-and-drop between columns)
        if (isGridSection(s)) return s;
        const blocks = [...s.blocks];
        const [removed] = blocks.splice(fromIndex, 1);
        blocks.splice(toIndex, 0, removed);
        return { ...s, blocks };
      }),
    }));
  }, [setNewsletter]);

  const hideBottomSidebar = useMemo(() => {
    if (!newsletter) return true;
    if (!selectedSection) return true;
    const sec = newsletter.sections?.find((s) => s.id === selectedSection);
    if (!sec || selectedBlock) return false;
    return sec.type === 'header' || sec.type === 'section';
  }, [newsletter, selectedSection, selectedBlock]);

  const closeCanvasSheet = useCallback(() => setCanvasSheet(null), []);

  const openCanvasMedia = useCallback((sectionId) => {
    setMediaTargetSection(sectionId);
    setMediaTargetBlock(null);
    setCanvasSheet({ type: 'media', sectionId });
  }, []);

  const openCanvasProperty = useCallback((sectionId, mode) => {
    setCanvasSheet({ type: 'property', sectionId, mode });
  }, []);

  useEffect(() => {
    if (!canvasSheet) return;
    if (selectedSection !== canvasSheet.sectionId) {
      setCanvasSheet(null);
    }
  }, [selectedSection, canvasSheet]);

  useEffect(() => {
    if (selectedBlock && canvasSheet?.type === 'property') {
      setCanvasSheet(null);
    }
  }, [selectedBlock, canvasSheet]);

  // ── Grid-specific handlers ──────────────────────────────────────

  const handleResizeColumn = useCallback((sectionId, rowId, colIndex, delta) => {
    setNewsletter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId || !isGridSection(s)) return s;
        return {
          ...s,
          rows: s.rows.map((r) => {
            if (r.id !== rowId) return r;
            return { ...r, columns: resizeColumnsAtDivider(r, colIndex, delta) };
          }),
        };
      }),
    }));
  }, [setNewsletter]);

  const handleDropBlock = useCallback((dragData, toRowId, toColId) => {
    const { blockId, fromRowId, fromColId, sectionId } = dragData;
    setNewsletter((prev) => ({
      ...prev,
      sections: prev.sections.map((s) => {
        if (s.id !== sectionId || !isGridSection(s)) return s;
        return {
          ...s,
          rows: moveBlockBetweenColumns(s.rows, fromRowId, fromColId, blockId, toRowId, toColId),
        };
      }),
    }));
  }, [setNewsletter]);

  const handleDeleteSection = useCallback(
    (sectionId) => {
      setNewsletter((prev) => ({
        ...prev,
        sections: prev.sections.filter((s) => s.id !== sectionId),
      }));
      setSelectedSection(null);
    },
    [setNewsletter]
  );

  const handleMoveSection = useCallback(
    (sectionId, direction) => {
      setNewsletter((prev) => {
        const sections = [...prev.sections];
        const index = sections.findIndex((s) => s.id === sectionId);
        if (direction === 'up' && index > 0) {
          [sections[index], sections[index - 1]] = [sections[index - 1], sections[index]];
        } else if (direction === 'down' && index < sections.length - 1) {
          [sections[index], sections[index + 1]] = [sections[index + 1], sections[index]];
        }
        return { ...prev, sections };
      });
    },
    [setNewsletter]
  );

  const handleDuplicateSection = useCallback(
    (sectionId) => {
      setNewsletter((prev) => {
        const sections = [...prev.sections];
        const index = sections.findIndex((s) => s.id === sectionId);
        if (index === -1) return prev;
        const original = sections[index];
        const clone = JSON.parse(JSON.stringify(original));
        clone.id = `section-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
        if (clone.blocks) {
          clone.blocks = clone.blocks.map(b => ({
            ...b,
            id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          }));
        }
        if (clone.rows) {
          clone.rows = clone.rows.map(r => ({
            ...r,
            id: `row-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
            columns: r.columns?.map(c => ({
              ...c,
              id: `col-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              blocks: c.blocks?.map(b => ({
                ...b,
                id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
              })) || [],
            })) || [],
          }));
        }
        sections.splice(index + 1, 0, clone);
        return { ...prev, sections };
      });
    },
    [setNewsletter]
  );

  const handleOpenMedia = openCanvasMedia;

  const handleSetBlockImage = useCallback((sectionId, blockId) => {
    setMediaTargetBlock({ sectionId, blockId });
    setMediaTargetSection(null);
    setCanvasSheet({ type: 'media', sectionId });
  }, []);

  const handleSetCollageImage = useCallback((sectionId, blockId, imageIndex) => {
    setMediaTargetBlock({ sectionId, blockId, imageIndex, isCollage: true });
    setMediaTargetSection(null);
    setCanvasSheet({ type: 'media', sectionId });
  }, []);

  const uploadFilesToSupabase = useCallback(async (files) => {
    return Promise.all(
      Array.from(files).map(async (file) => {
        try {
          const formData = new FormData();
          formData.append('file', file);
          formData.append('folder', 'newsletters/uploads');
          formData.append('userId', user?.id || 'public');
          const res = await fetch('/api/images/upload', { method: 'POST', body: formData });
          if (!res.ok) throw new Error('Upload failed');
          const data = await res.json();
          return data.url;
        } catch {
          return null;
        }
      })
    );
  }, [user]);

  const handleBulkUpload = useCallback(async (files) => {
    const uploadedUrls = await uploadFilesToSupabase(files);
    const validUrls = uploadedUrls.filter(Boolean);
    if (validUrls.length === 0) return;

    if (mediaTargetBlock) {
      const { sectionId, blockId, imageIndex, isCollage } = mediaTargetBlock;
      const url = validUrls[0];
      const updateBlock = (b) => {
        if (b.id !== blockId) return b;
        if (isCollage) {
          const imgs = [...(b.images || [])];
          imgs[imageIndex] = url;
          return { ...b, images: imgs };
        }
        if (b.type === 'promoCard' || b.type === 'recipe') {
          return { ...b, image: url };
        }
        return { ...b, src: url };
      };
      setNewsletter((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id !== sectionId) return s;
          if (isGridSection(s)) {
            return {
              ...s,
              rows: s.rows.map((r) => ({
                ...r,
                columns: r.columns.map((c) => ({
                  ...c,
                  blocks: c.blocks.map(updateBlock),
                })),
              })),
            };
          }
          return { ...s, blocks: (s.blocks || []).map(updateBlock) };
        }),
      }));
      setMediaTargetBlock(null);
      closeCanvasSheet();
      return;
    }

    setNewsletter((prev) => {
      const emptySlots = [];

      const scanBlock = (b, sectionId) => {
        if (b.type === 'image' && !b.src) {
          emptySlots.push({ sectionId, blockId: b.id, field: 'src' });
        }
        if (b.type === 'promoCard' && !b.image) {
          emptySlots.push({ sectionId, blockId: b.id, field: 'image' });
        }
        if (b.type === 'recipe' && !b.image) {
          emptySlots.push({ sectionId, blockId: b.id, field: 'image' });
        }
        if (b.type === 'imageCollage' || b.type === 'multiLayout') {
          const totalSlots = b.type === 'multiLayout' ? 6 : (b.images?.length || 4);
          for (let i = 0; i < Math.max(totalSlots, 4); i++) {
            if (!b.images?.[i]) {
              emptySlots.push({ sectionId, blockId: b.id, field: 'images', imageIndex: i });
            }
          }
        }
        if (b.type === 'imageSequence') {
          const slotCount = b.images?.length || 4;
          for (let i = 0; i < slotCount; i++) {
            if (!b.images?.[i]) {
              emptySlots.push({ sectionId, blockId: b.id, field: 'images', imageIndex: i });
            }
          }
        }
      };

      for (const s of prev.sections) {
        if (isGridSection(s)) {
          for (const r of s.rows) {
            for (const c of r.columns) {
              for (const b of c.blocks) scanBlock(b, s.id);
            }
          }
        } else if (s.blocks) {
          for (const b of s.blocks) scanBlock(b, s.id);
        }
      }

      const assignments = validUrls.slice(0, emptySlots.length);
      if (assignments.length === 0) return prev;

      const blockUpdates = {};
      assignments.forEach((url, i) => {
        const slot = emptySlots[i];
        if (!blockUpdates[slot.blockId]) blockUpdates[slot.blockId] = {};
        if (slot.field === 'src') {
          blockUpdates[slot.blockId].src = url;
        } else if (slot.field === 'image') {
          blockUpdates[slot.blockId].image = url;
        } else if (slot.field === 'images') {
          if (!blockUpdates[slot.blockId].images) blockUpdates[slot.blockId].images = {};
          blockUpdates[slot.blockId].images[slot.imageIndex] = url;
        }
      });

      const applyUpdate = (b) => {
        const upd = blockUpdates[b.id];
        if (!upd) return b;
        const updated = { ...b };
        if (upd.src) updated.src = upd.src;
        if (upd.image) updated.image = upd.image;
        if (upd.images) {
          const imgs = [...(b.images || [])];
          for (const [idx, url] of Object.entries(upd.images)) {
            imgs[parseInt(idx)] = url;
          }
          updated.images = imgs;
        }
        return updated;
      };

      return {
        ...prev,
        sections: prev.sections.map((s) => {
          if (isGridSection(s)) {
            return {
              ...s,
              rows: s.rows.map((r) => ({
                ...r,
                columns: r.columns.map((c) => ({
                  ...c,
                  blocks: c.blocks.map(applyUpdate),
                })),
              })),
            };
          }
          return {
            ...s,
            blocks: (s.blocks || []).map(applyUpdate),
          };
        }),
      };
    });
    closeCanvasSheet();
  }, [setNewsletter, user, mediaTargetBlock, uploadFilesToSupabase]);

  const handleMediaSelect = useCallback((url, logoData) => {
    if (mediaTargetBlock) {
      const { sectionId, blockId, imageIndex, isCollage } = mediaTargetBlock;

      const updateBlock = (b) => {
        if (b.id !== blockId) return b;
        if (isCollage) {
          const imgs = [...(b.images || [])];
          imgs[imageIndex] = url;
          return { ...b, images: imgs };
        }
        return { ...b, src: url };
      };

      setNewsletter((prev) => ({
        ...prev,
        sections: prev.sections.map((s) => {
          if (s.id !== sectionId) return s;
          if (isGridSection(s)) {
            return {
              ...s,
              rows: s.rows.map((r) => ({
                ...r,
                columns: r.columns.map((c) => ({
                  ...c,
                  blocks: c.blocks.map(updateBlock),
                })),
              })),
            };
          }
          return {
            ...s,
            blocks: (s.blocks || []).map(updateBlock),
          };
        }),
      }));
      setMediaTargetBlock(null);
    } else if (mediaTargetSection) {
      setNewsletter((prev) => ({
        ...prev,
        sections: prev.sections.map((s) =>
          s.id === mediaTargetSection
            ? {
              ...s,
              height: 'auto',
              background: {
                ...s.background,
                type: 'image',
                image: url,
                imageSize: 'auto',
              },
            }
            : s
        ),
      }));
    }
    closeCanvasSheet();
  }, [mediaTargetBlock, mediaTargetSection, setNewsletter]);

  const handleThemeColor = useCallback((color) => {
    if (selectedSection) {
      handleSectionUpdate(selectedSection, {
        background: { type: 'solid', color },
      });
    } else {
      handlePageSettingsUpdate({ backgroundColor: color });
    }
  }, [selectedSection, handleSectionUpdate, handlePageSettingsUpdate]);

  const handleThemeGradient = useCallback((start, end) => {
    if (selectedSection) {
      handleSectionUpdate(selectedSection, {
        background: {
          type: 'gradient',
          gradientStart: start,
          gradientEnd: end,
          gradientAngle: 135,
        },
      });
    }
  }, [selectedSection, handleSectionUpdate]);

  const handleReorderSections = useCallback(
    (fromIndex, toIndex) => {
      setNewsletter((prev) => {
        const sections = [...prev.sections];
        const [removed] = sections.splice(fromIndex, 1);
        sections.splice(toIndex, 0, removed);
        return { ...prev, sections };
      });
    },
    [setNewsletter]
  );

  // When id is 'new', show TemplateSelector first; after selection, show editor
  if (isNew && !showEditor) {
    return (
      <TemplateSelector
        onSelectTemplate={(template) => {
          setNewsletter(migrateNewsletter(JSON.parse(JSON.stringify(template))));
          setShowEditor(true);
        }}
        hasSavedNewsletter={hasMounted && hasSavedNewsletter()}
        lastSaveTime={hasMounted ? getLastSaveTime() : null}
        onContinueEditing={() => {
          const saved = loadSavedNewsletter();
          if (saved) {
            setNewsletter(migrateNewsletter(saved));
            setShowEditor(true);
          }
        }}
        projects={projects}
        onLoadProject={(projectId) => router.push(`/dashboard/editor/${projectId}`)}
        onDeleteProject={deleteNewsletter}
        onImportJSON={async (file) => {
          const data = await importFromJSON(file);
          setNewsletter(data);
          setShowEditor(true);
        }}
      />
    );
  }

  // Export
  const handleExport = async () => {
    const dynamics = findDynamicBlocks(newsletter);
    if (dynamics.length > 0) {
      handleConvertForEmail();
      return;
    }
    const resolved = await resolveNewsletterImages(newsletter, user?.id);
    const html = exportToHTML(resolved);
    setExportedHTML(html);
    setShowExportModal(true);
  };

  const handleCopyHTML = async () => {
    await navigator.clipboard.writeText(exportedHTML);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadHTML = () => {
    const blob = new Blob([exportedHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Copy rendered HTML to clipboard. Gmail strips raw text/html clipboard
  // data aggressively, so we render the HTML in an off-screen container,
  // select it, then execCommand('copy') which preserves the visual formatting.
  function copyRenderedHtml(html) {
    const container = document.createElement('div');
    container.innerHTML = html;
    Object.assign(container.style, {
      position: 'fixed',
      left: '0',
      top: '0',
      width: '780px',
      opacity: '0',
      pointerEvents: 'none',
      zIndex: '-1',
    });
    document.body.appendChild(container);

    const range = document.createRange();
    range.selectNodeContents(container);
    const sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);

    let ok = false;
    try { ok = document.execCommand('copy'); } catch { /* */ }
    sel.removeAllRanges();
    document.body.removeChild(container);
    return ok;
  }

  const handleCopyDesign = async () => {
    const dynamics = findDynamicBlocks(newsletter);
    if (dynamics.length > 0) {
      handleConvertForEmail();
      return;
    }

    const resolved = await resolveNewsletterImages(newsletter, user?.id);
    const html = exportForGmail(resolved);
    const ok = copyRenderedHtml(html);
    if (!ok) {
      try { await navigator.clipboard.writeText(html); } catch { /* */ }
    }
    setCopiedDesign(true);
    setTimeout(() => setCopiedDesign(false), 2500);
  };

  function handleCopyShareLink() {
    const nid = newsletter?.projectId || params?.id;
    if (!nid || nid === 'new') {
      alert('Save the newsletter first before sharing.');
      return;
    }
    const url = `${window.location.origin}/templates/${nid}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedShareLink(true);
      setTimeout(() => setCopiedShareLink(false), 2500);
    });
  }

  // --- Convert for Email flow ---
  const handleConvertForEmail = async () => {
    setShowConvertModal(true);
    setConvertProgress(null);
    setConvertedNewsletter(null);
    setConvertError(null);
    setCopiedConverted(false);

    try {
      const result = await convertNewsletterForEmail(newsletter, {
        userId: user?.id,
        onProgress: setConvertProgress,
      });
      setConvertedNewsletter(result.newsletter);
    } catch (err) {
      setConvertError(err.message);
    }
  };

  const handleCopyConvertedDesign = async () => {
    const data = convertedNewsletter || newsletter;
    const resolved = await resolveNewsletterImages(data, user?.id);
    const html = exportForGmail(resolved);
    const ok = copyRenderedHtml(html);
    if (!ok) {
      try { await navigator.clipboard.writeText(html); } catch { /* */ }
    }
    setCopiedConverted(true);
    setTimeout(() => setCopiedConverted(false), 2500);
  };

  const handleDownloadConvertedHTML = async () => {
    const data = convertedNewsletter || newsletter;
    const resolved = await resolveNewsletterImages(data, user?.id);
    const html = exportToHTML(resolved);
    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-email-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // MJML Email Preview
  const handleEmailPreview = async () => {
    setShowPreviewModal(true);
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const res = await fetch('/api/email/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ newsletter, options: { preview: true } }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPreviewHTML(data.html);
    } catch (err) {
      setPreviewError(err.message);
    }
    setPreviewLoading(false);
  };

  // Send campaign
  const handleSend = async () => {
    if (!sendSubject) return;
    setSendStatus('sending');
    try {
      const subRes = await fetch('/api/subscribers?status=active&limit=10000');
      const subData = await subRes.json();
      if (!subData.subscribers?.length) {
        throw new Error('No active subscribers found. Add subscribers first.');
      }

      // Pre-process: generate animated GIF for marquee blocks
      const prepared = JSON.parse(JSON.stringify(newsletter));
      const seenIds = new Set();
      for (const section of prepared.sections) {
        const marqueeBlocks = [];
        const collectUnique = (blocks) => {
          for (const b of blocks || []) {
            if (b.type === 'marquee' && !seenIds.has(b.id)) {
              seenIds.add(b.id);
              marqueeBlocks.push(b);
            }
          }
        };
        collectUnique(section.blocks);
        (section.rows || []).forEach(r =>
          (r.columns || []).forEach(c => collectUnique(c.blocks))
        );
        if (section.type === 'marquee' && section.items && !section.gifUrl && !seenIds.has(section.id)) {
          seenIds.add(section.id);
          marqueeBlocks.push(section);
        }

        for (const mq of marqueeBlocks) {
          if (mq.gifUrl) continue;
          try {
            const result = await exportMarqueeAsGif(mq, { width: 700 });
            const formData = new FormData();
            formData.append('file', result.blob, `marquee-${Date.now()}.gif`);
            const uploadRes = await fetch('/api/images/upload', {
              method: 'POST',
              body: formData,
            });
            const uploadData = await uploadRes.json();
            if (uploadData.url) {
              mq.gifUrl = uploadData.url;
            }
          } catch (e) {
            console.warn('Marquee GIF generation failed, using static fallback:', e.message);
          }
        }
      }

      const res = await fetch('/api/email/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          newsletter: prepared,
          subject: sendSubject,
          subscribers: subData.subscribers,
          userId: user?.id,
        }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setSendResults(data.results);
      setSendStatus('sent');
    } catch (err) {
      setSendResults({ error: err.message });
      setSendStatus('error');
    }
  };

  // Save
  const handleSaveToProject = async () => {
    if (!newsletter) return;
    const projectName = newsletter.name || 'My Newsletter';
    try {
      const saved = await saveNewsletter({ ...newsletter, name: projectName });
      setNewsletter((prev) => ({ ...prev, projectId: saved.id, name: saved.name }));
      setSavedToProject(true);
      setTimeout(() => setSavedToProject(false), 2000);
      if (isNew && saved.id) {
        router.replace(`/dashboard/editor/${saved.id}`);
      }
    } catch (err) {
      // Fallback to localStorage when Supabase fails
      const project = saveProject(newsletter, projectName);
      setNewsletter((prev) => ({ ...prev, projectId: project.id, name: projectName }));
      setSavedToProject(true);
      setTimeout(() => setSavedToProject(false), 2000);
    }
  };

  // JSON
  const handleDownloadJSON = () => {
    if (newsletter) exportAsJSON(newsletter);
  };

  const handleUploadJSON = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      const imported = await importFromJSON(file);
      setNewsletter(imported);
    } catch (error) {
      alert(`Import failed: ${error.message}`);
    }
    event.target.value = '';
  };

  if (!newsletter) return null;

  const buttonBase = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 11,
    fontWeight: 500,
    padding: '5px 10px',
    borderRadius: 7,
    border: 'none',
    cursor: 'pointer',
    transition: 'all 200ms ease-out',
    whiteSpace: 'nowrap',
  };

  const primaryBtn = {
    ...buttonBase,
    background: 'var(--accent)',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(59,130,246,0.25)',
  };

  const touchIcon = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    borderRadius: 12,
    border: 'none',
    background: 'transparent',
    color: 'var(--text-2)',
    cursor: 'pointer',
    flexShrink: 0,
  };

  const menuRowBtn = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    minHeight: 48,
    padding: '0 12px',
    border: 'none',
    borderRadius: 10,
    background: 'transparent',
    fontSize: 14,
    fontWeight: 500,
    color: 'var(--text-1)',
    cursor: 'pointer',
    textAlign: 'left',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
      {/* Editor header — touch targets, overflow menu, full-width CTAs */}
      <header
        ref={headerRef}
        className="glass-panel-strong"
        style={{
          flexShrink: 0,
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          gap: 8,
          padding: '6px 8px 8px',
          borderBottom: '1px solid var(--border)',
          zIndex: 50,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0 }}>
          <button
            type="button"
            aria-label="Back to list"
            onClick={() => router.push('/dashboard')}
            style={touchIcon}
          >
            <ArrowLeft size={22} strokeWidth={2} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, minWidth: 0, flex: 1 }}>
            <Mail size={18} color="var(--text-3)" style={{ flexShrink: 0 }} />
            <span
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text-1)',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {newsletter?.name || 'Newsletter'}
            </span>
          </div>
          <button
            type="button"
            aria-label="Undo"
            onClick={undo}
            disabled={!canUndo}
            style={{ ...touchIcon, opacity: canUndo ? 1 : 0.35 }}
          >
            <Undo2 size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label="Redo"
            onClick={redo}
            disabled={!canRedo}
            style={{ ...touchIcon, opacity: canRedo ? 1 : 0.35 }}
          >
            <Redo2 size={20} strokeWidth={2} />
          </button>
          <button
            type="button"
            aria-label={isUnlocked ? 'Lock sections' : 'Unlock to reorder sections'}
            onClick={handleToggleUnlock}
            style={{
              ...touchIcon,
              color: isUnlocked ? 'var(--accent)' : 'var(--text-2)',
              background: isUnlocked ? 'var(--accent-soft)' : 'transparent',
            }}
          >
            {isUnlocked ? <Unlock size={20} strokeWidth={2} /> : <Lock size={20} strokeWidth={2} />}
          </button>
          <button
            type="button"
            aria-label="More actions"
            aria-expanded={headerMenuOpen}
            onClick={() => setHeaderMenuOpen((o) => !o)}
            style={{
              ...touchIcon,
              color: headerMenuOpen ? 'var(--accent)' : 'var(--text-2)',
              background: headerMenuOpen ? 'var(--accent-soft)' : 'transparent',
            }}
          >
            <MoreHorizontal size={22} strokeWidth={2} />
          </button>
        </div>

        {headerMenuOpen && (
          <div
            className="glass-panel-strong"
            style={{
              position: 'absolute',
              top: 56,
              right: 8,
              left: 8,
              borderRadius: 14,
              padding: 6,
              boxShadow: 'var(--shadow-elevated)',
              border: '1px solid var(--border)',
              zIndex: 60,
            }}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div style={{ fontSize: 11, color: 'var(--text-3)', padding: '6px 10px 8px', display: 'flex', alignItems: 'center', gap: 6 }}>
              <Save size={14} /> Auto-saved
            </div>
            <button
              type="button"
              style={menuRowBtn}
              onClick={() => {
                setHeaderMenuOpen(false);
                setShowPageSettingsModal(true);
              }}
            >
              <LayoutTemplate size={18} />
              Page layout
            </button>
            <button
              type="button"
              style={menuRowBtn}
              onClick={() => {
                setHeaderMenuOpen(false);
                setShowThemeSwatchesModal(true);
              }}
            >
              <Palette size={18} />
              Theme swatches
            </button>
            <button
              type="button"
              style={menuRowBtn}
              onClick={() => {
                setHeaderMenuOpen(false);
                handleSaveToProject();
              }}
            >
              {savedToProject ? <Check size={18} color="#16a34a" /> : <Save size={18} />}
              {savedToProject ? 'Saved to project' : 'Save to project'}
            </button>
            <button
              type="button"
              style={menuRowBtn}
              onClick={() => {
                setHeaderMenuOpen(false);
                handleCopyShareLink();
              }}
            >
              {copiedShareLink ? <Check size={18} color="#16a34a" /> : <Share2 size={18} />}
              {copiedShareLink ? 'Link copied' : 'Copy share link'}
            </button>
            <button
              type="button"
              style={menuRowBtn}
              onClick={() => {
                setHeaderMenuOpen(false);
                handleDownloadJSON();
              }}
            >
              <FileJson size={18} />
              Download JSON
            </button>
            <button
              type="button"
              style={menuRowBtn}
              onClick={() => {
                setHeaderMenuOpen(false);
                fileInputRef.current?.click();
              }}
            >
              <Upload size={18} />
              Upload JSON
            </button>
          </div>
        )}

        <input ref={fileInputRef} type="file" accept=".json" onChange={handleUploadJSON} style={{ display: 'none' }} />
      </header>

      {/* Main: canvas + properties; glass dock pinned to bottom (reserved padding so properties stay usable) */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 0,
          position: 'relative',
        }}
      >
        <div
          style={{
            flex: 1,
            minHeight: 0,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            ref={canvasOuterRef}
            style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'stretch',
              /* Toolbar overlaps canvas (translateX); symmetric horizontal padding */
              padding: '8px 12px 12px',
              background: 'linear-gradient(145deg, #f1f5f9, #e8edf5)',
            }}
          >
            <div
              ref={newsletterColumnRef}
              style={{
                width: '100%',
                maxWidth: 700,
                margin: '0 auto',
                position: 'relative',
                flexShrink: 0,
                transform: selectedSection && !selectedBlock ? 'scale(0.8)' : 'scale(1)',
                transformOrigin: 'top center',
                transition: 'transform 500ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <NewsletterEditor
                newsletter={newsletter}
                selectedSection={selectedSection}
                selectedBlock={selectedBlock}
                onSectionClick={handleSectionClick}
                onBlockClick={handleBlockClick}
                onAddSection={handleAddSection}
                onInsertSection={handleInsertSection}
                onAddBlock={handleAddBlock}
                onAddBlockToColumn={handleAddBlockToColumn}
                onReorderSections={handleReorderSections}
                onSectionUpdate={handleSectionUpdate}
                onPageSettingsUpdate={handlePageSettingsUpdate}
                onResizeColumn={handleResizeColumn}
                onDropBlock={handleDropBlock}
                onDeleteSection={handleDeleteSection}
                onMoveSection={handleMoveSection}
                onDuplicateSection={handleDuplicateSection}
                onOpenCanvasMedia={openCanvasMedia}
                onOpenCanvasProperty={openCanvasProperty}
                onCloseCanvasSheet={closeCanvasSheet}
                canvasSheet={canvasSheet}
                onSetBlockImage={handleSetBlockImage}
                onSetCollageImage={handleSetCollageImage}
                isUnlocked={isUnlocked}
                sheetBoundsRef={newsletterColumnRef}
                sheetBottomInsetPx={EDITOR_DOCK_CLEARANCE_PX}
              />
            </div>
          </div>
        </div>

        <div
          style={{
            flex: hideBottomSidebar ? '0 0 0px' : '0 0 min(40vh, 320px)',
            minHeight: hideBottomSidebar ? 0 : 180,
            maxHeight: hideBottomSidebar ? 0 : 360,
            display: 'flex',
            flexDirection: 'column',
            borderTop: hideBottomSidebar ? 'none' : '1px solid var(--border)',
            background: hideBottomSidebar ? 'transparent' : 'rgba(255,255,255,0.98)',
            paddingBottom: hideBottomSidebar ? 0 : 'calc(86px + env(safe-area-inset-bottom, 0px))',
            overflow: 'hidden',
          }}
        >
          {!hideBottomSidebar && (
            <SidebarEditor
              newsletter={newsletter}
              selectedSection={selectedSection}
              selectedBlock={selectedBlock}
              onSectionClick={handleSectionClick}
              onBlockClick={handleBlockClick}
              onSectionUpdate={handleSectionUpdate}
              onBlockUpdate={handleBlockUpdate}
              onDeleteBlock={handleDeleteBlock}
              onReorderBlocks={handleReorderBlocks}
              onMoveSection={handleMoveSection}
              onSetBlockImage={handleSetBlockImage}
              onSetCollageImage={handleSetCollageImage}
            />
          )}
        </div>

        <EditorBottomBar
          newsletter={newsletter}
          selectedSection={selectedSection}
          onSectionClick={handleSectionClick}
          onAddBlock={handleAddBlock}
          onExport={handleExport}
          onCopyGmail={handleCopyDesign}
          copiedDesign={copiedDesign}
          shareLinkCopied={copiedShareLink}
          onThemeColor={handleThemeColor}
          onThemeGradient={handleThemeGradient}
          onNavigateHome={() => router.push('/dashboard')}
          onCopyShareLink={handleCopyShareLink}
          onOpenSend={() => {
            setSendStatus('loading');
            setSendSubject('');
            setSendResults(null);
            setShowSendModal(true);
          }}
          dockStackBottomPx={hideBottomSidebar ? 24 : 86}
          layoutPickerOpen={!!layoutCarousel}
        />
      </div>

      {/* Layout Carousel */}
      {layoutCarousel && (
        <LayoutCarousel
          onSelect={handleLayoutCarouselSelect}
          onClose={() => setLayoutCarousel(null)}
        />
      )}

      {/* Floating Media Modal */}
      <FloatingMediaModal
        open={canvasSheet?.type === 'media'}
        onClose={closeCanvasSheet}
        onSelectLogo={handleMediaSelect}
        onBulkUpload={handleBulkUpload}
        userId={user?.id}
        boundsRef={newsletterColumnRef}
        bottomInsetPx={EDITOR_DOCK_CLEARANCE_PX}
      />

      {/* === MODALS === */}

      {/* Export Modal */}
      {showExportModal && (
        <Modal onClose={() => setShowExportModal(false)} title="Export Newsletter" subtitle="Copy or download the HTML code">
          <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
            <button onClick={handleCopyHTML} style={{ ...primaryBtn, flex: 1, justifyContent: 'center', background: copied ? '#16a34a' : 'var(--accent)' }}>
              <Copy size={14} /> {copied ? 'Copied!' : 'Copy HTML'}
            </button>
            <button onClick={handleDownloadHTML} style={{ ...buttonBase, flex: 1, justifyContent: 'center', border: '1px solid var(--control-border)', background: 'rgba(255,255,255,0.5)', color: 'var(--text-2)' }}>
              <Download size={14} /> Download File
            </button>
          </div>
          <div style={{ background: '#f8f9fa', borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', maxHeight: 400 }}>
            <pre style={{ padding: 16, fontSize: 10, color: 'var(--text-2)', fontFamily: 'monospace', overflow: 'auto', maxHeight: 400, margin: 0 }}>
              {exportedHTML}
            </pre>
          </div>
        </Modal>
      )}

      {/* Email Preview Modal (MJML rendered) */}
      {showPreviewModal && (
        <Modal onClose={() => setShowPreviewModal(false)} title="Email Preview" subtitle="How your newsletter looks in email clients" wide>
          {previewLoading && (
            <div style={{ padding: 60, textAlign: 'center', color: 'var(--text-3)' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13 }}>Rendering with MJML...</p>
            </div>
          )}
          {previewError && (
            <div style={{ padding: 40, textAlign: 'center', color: '#dc2626' }}>
              <AlertTriangle size={24} style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13 }}>{previewError}</p>
            </div>
          )}
          {previewHTML && !previewLoading && (
            <div style={{ borderRadius: 10, border: '1px solid var(--border)', overflow: 'hidden', background: '#fff' }}>
              <iframe
                srcDoc={previewHTML}
                style={{ width: '100%', height: 600, border: 'none' }}
                title="Email Preview"
                sandbox="allow-same-origin"
              />
            </div>
          )}
        </Modal>
      )}

      {/* Send Campaign Modal */}
      {showSendModal && (
        <Modal
          onClose={() => {
            setShowSendModal(false);
            setSendStatus(null);
          }}
          title="Send Campaign"
          subtitle="Send this newsletter to your subscribers"
        >
          {sendStatus === 'loading' && (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13 }}>Checking subscribers...</p>
            </div>
          )}
          {sendStatus === 'ready' && subscriberCount === 0 && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <Users size={32} color="var(--text-3)" style={{ margin: '0 auto 12px', opacity: 0.5 }} />
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>No subscribers yet</h3>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
                Add subscribers before sending a campaign. You can add them manually or import a CSV file.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button onClick={() => setShowSendModal(false)} style={{ ...buttonBase, border: '1px solid var(--control-border)', background: 'rgba(255,255,255,0.5)', color: 'var(--text-2)' }}>Cancel</button>
                <button onClick={() => { setShowSendModal(false); router.push('/dashboard/subscribers'); }} style={primaryBtn}>
                  <Users size={13} /> Go to Subscribers
                </button>
              </div>
            </div>
          )}
          {sendStatus === 'ready' && subscriberCount > 0 && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 6, display: 'block' }}>Subject Line</label>
                <input
                  type="text"
                  value={sendSubject}
                  onChange={(e) => setSendSubject(e.target.value)}
                  placeholder="Enter email subject..."
                  style={{ width: '100%', height: 36, padding: '0 12px', fontSize: 13, border: '1px solid var(--control-border)', borderRadius: 8, background: 'rgba(255,255,255,0.6)', outline: 'none', color: 'var(--text-1)' }}
                />
              </div>
              <div style={{ padding: 14, borderRadius: 10, background: 'var(--accent-soft)', fontSize: 12, color: 'var(--text-2)', lineHeight: 1.5 }}>
                This will send to <strong>{subscriberCount} active subscriber{subscriberCount !== 1 ? 's' : ''}</strong>. Images will be automatically optimized and hosted. The email will be rendered via MJML for maximum compatibility.
              </div>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                <button onClick={() => setShowSendModal(false)} style={{ ...buttonBase, border: '1px solid var(--control-border)', background: 'rgba(255,255,255,0.5)', color: 'var(--text-2)' }}>Cancel</button>
                <button onClick={handleSend} disabled={!sendSubject} style={{ ...primaryBtn, opacity: sendSubject ? 1 : 0.4 }}>
                  <Send size={13} /> Send Now
                </button>
              </div>
            </div>
          )}
          {sendStatus === 'sending' && (
            <div style={{ padding: 48, textAlign: 'center', color: 'var(--text-3)' }}>
              <Loader2 size={28} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', marginBottom: 4 }}>Sending campaign...</p>
              <p style={{ fontSize: 12 }}>Processing images, rendering MJML, sending via SES</p>
            </div>
          )}
          {sendStatus === 'sent' && sendResults && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#16a34a15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Check size={24} color="#16a34a" />
              </div>
              <h3 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>Campaign Sent!</h3>
              <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 16 }}>
                {sendResults.sent} sent · {sendResults.failed} failed
              </p>
              <button onClick={() => setShowSendModal(false)} style={primaryBtn}>Done</button>
            </div>
          )}
          {sendStatus === 'error' && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <AlertTriangle size={28} color="#dc2626" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>Failed to send</h3>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>{sendResults?.error}</p>
              <button onClick={() => setSendStatus(null)} style={{ ...buttonBase, border: '1px solid var(--control-border)', background: 'rgba(255,255,255,0.5)', color: 'var(--text-2)' }}>Try Again</button>
            </div>
          )}
        </Modal>
      )}

      {/* Convert for Email Modal */}
      {showConvertModal && (
        <Modal onClose={() => setShowConvertModal(false)} title="Convert for Email" subtitle="Replacing dynamic elements with static images">
          {/* Progress */}
          {convertProgress && convertProgress.step !== 'done' && !convertError && (
            <div style={{ padding: 32, textAlign: 'center' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-1)', marginBottom: 4 }}>
                {convertProgress.step === 'capture' ? `Capturing ${convertProgress.label}...` : ''}
                {convertProgress.step === 'upload' ? `Uploading ${convertProgress.label}...` : ''}
              </p>
              <p style={{ fontSize: 12, color: 'var(--text-3)' }}>
                {convertProgress.current} of {convertProgress.total}
              </p>
              <div style={{ marginTop: 16, height: 4, borderRadius: 2, background: 'var(--border)', overflow: 'hidden' }}>
                <div style={{
                  height: '100%',
                  borderRadius: 2,
                  background: 'var(--accent)',
                  transition: 'width 300ms ease-out',
                  width: `${Math.round((convertProgress.current / convertProgress.total) * 100)}%`,
                }} />
              </div>
            </div>
          )}

          {/* Not started yet (shouldn't appear, but safety) */}
          {!convertProgress && !convertError && (
            <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-3)' }}>
              <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', margin: '0 auto 12px' }} />
              <p style={{ fontSize: 13 }}>Scanning newsletter...</p>
            </div>
          )}

          {/* Done */}
          {convertProgress?.step === 'done' && convertedNewsletter && (
            <div style={{ textAlign: 'center', padding: 24 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#16a34a15', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Check size={24} color="#16a34a" />
              </div>
              <h3 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', marginBottom: 8 }}>
                Converted {convertProgress.count} element{convertProgress.count !== 1 ? 's' : ''}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.5 }}>
                Dynamic elements replaced with static images.<br />Ready to paste into Gmail or download.
              </p>
              <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                <button
                  onClick={handleCopyConvertedDesign}
                  style={{ ...primaryBtn, background: copiedConverted ? '#16a34a' : 'var(--accent)' }}
                >
                  {copiedConverted ? <><Check size={13} /> Copied!</> : <><Clipboard size={13} /> Copy for Gmail</>}
                </button>
                <button
                  onClick={handleDownloadConvertedHTML}
                  style={{ ...buttonBase, border: '1px solid var(--control-border)', background: 'rgba(255,255,255,0.5)', color: 'var(--text-2)' }}
                >
                  <Download size={13} /> Download HTML
                </button>
              </div>
            </div>
          )}

          {/* Error */}
          {convertError && (
            <div style={{ textAlign: 'center', padding: 32 }}>
              <AlertTriangle size={28} color="#dc2626" style={{ margin: '0 auto 12px' }} />
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#dc2626', marginBottom: 8 }}>Conversion failed</h3>
              <p style={{ fontSize: 12, color: 'var(--text-3)', marginBottom: 16 }}>{convertError}</p>
              <button onClick={() => setShowConvertModal(false)} style={{ ...buttonBase, border: '1px solid var(--control-border)', background: 'rgba(255,255,255,0.5)', color: 'var(--text-2)' }}>
                Close
              </button>
            </div>
          )}
        </Modal>
      )}

      {showThemeSwatchesModal && (
        <Modal
          onClose={() => setShowThemeSwatchesModal(false)}
          title="Theme swatches"
          subtitle="Tap a swatch: applies to a selected Text/Title block, or the current section background"
        >
          <ThemePanel onSelectColor={handleSwatchColorPick} onSelectGradient={handleSwatchGradientPick} />
        </Modal>
      )}

      {showPageSettingsModal && (
        <Modal
          wide
          onClose={() => setShowPageSettingsModal(false)}
          title="Page layout"
          subtitle="Outer frame, spacing, and inner content card"
        >
          <PageSettingsPanel newsletter={newsletter} onPageSettingsUpdate={handlePageSettingsUpdate} />
        </Modal>
      )}

    </div>
  );
}

function Modal({ children, onClose, title, subtitle, wide }) {
  return (
    <div
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(6px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 24 }}
      onClick={onClose}
    >
      <div
        className="glass-panel-strong"
        style={{ width: '100%', maxWidth: wide ? 720 : 520, maxHeight: '85vh', display: 'flex', flexDirection: 'column', borderRadius: 16, overflow: 'hidden' }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-1)', margin: 0 }}>{title}</h2>
            {subtitle && <p style={{ fontSize: 12, color: 'var(--text-3)', margin: '2px 0 0' }}>{subtitle}</p>}
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-3)', padding: 4 }}>
            <X size={18} />
          </button>
        </div>
        <div style={{ padding: 20, overflowY: 'auto' }}>{children}</div>
      </div>
    </div>
  );
}
