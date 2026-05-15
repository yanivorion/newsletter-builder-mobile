import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ChevronUp, 
  ChevronDown, 
  ChevronLeft,
  ChevronRight,
  Trash2, 
  Loader2,
  Image,
  Layers,
  FileImage,
  Camera,
  Plus,
  Type,
  GripVertical,
  Proportions,
  LayoutList,
} from 'lucide-react';
import { Button } from '../ui/button';
import { Select } from '../ui/input';
import { EditableInput, EditableTextarea, EditableColorInput } from '../ui/EditableField';
import { NumberInput } from '../ui/NumberInput';
import { Label } from '../ui/Label';
import { Badge } from '../ui/Badge';
import { cn } from '../../lib/utils';
import { useTheme } from '../../context/ThemeContext';
import GradientPicker from './GradientPicker';
import ImageUploader from './ImageUploader';
import MediaKitPanel from './MediaKitPanel';
import CollagePresetPicker from './CollagePresetPicker';
import FocalPointPicker from './FocalPointPicker';
import BulkImageUploader from './BulkImageUploader';
import { getPresetById, getImageCountForPreset } from '../../lib/collagePresets';
import { exportToGif, downloadDataUrl } from '../../utils/gifExport';
import {
  exportSequenceAsGif,
  exportMarqueeAsGif,
  exportAnimatedTextAsGif,
  exportBlockAsGifFromDOM,
  downloadBlob,
} from '../../utils/sequenceGifExport';
import { IconPickerButton } from './IconPicker';
import { isGridSection } from '../../lib/grid-schema';
import { flattenImageTransparency } from '@/lib/flatten-image-transparency';
import { LAYOUT_PRESETS } from '../blocks/MultiLayoutBlock';

const REMOVE_BG_API_KEY = 'rDrPT41QWFrheRJc4MARam3m';

function LocalInput({ value, onSave, placeholder, className, live = false, debounceMs = 0 }) {
  const [local, setLocal] = useState(value);
  useEffect(() => { setLocal(value); }, [value]);
  const timerRef = useRef(null);

  const flush = (next) => {
    if (next !== value) onSave(next);
  };

  const handleChange = (e) => {
    const next = e.target.value;
    setLocal(next);
    if (live) {
      if (debounceMs > 0) {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => flush(next), debounceMs);
      } else {
        flush(next);
      }
    }
  };

  return (
    <input
      type="text"
      value={local}
      onChange={handleChange}
      onBlur={() => {
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
        flush(local);
      }}
      onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); flush(local); } }}
      placeholder={placeholder}
      className={className}
    />
  );
}

// Uncontrolled color picker component - uses refs to avoid focus issues
function ImageColorPicker({ value, onChange, placeholder = 'Enter color', allowClear = false }) {
  const textRef = useRef(null);
  const lastValueRef = useRef(value);

  // Initialize and sync only when value changes from parent (not during typing)
  React.useEffect(() => {
    if (textRef.current && document.activeElement !== textRef.current) {
      textRef.current.value = value || '';
      lastValueRef.current = value;
    }
  }, [value]);

  const handleColorChange = (e) => {
    const newValue = e.target.value;
    if (textRef.current) {
      textRef.current.value = newValue;
    }
    lastValueRef.current = newValue;
    onChange?.(newValue);
  };

  const handleTextBlur = () => {
    if (textRef.current) {
      lastValueRef.current = textRef.current.value;
      onChange?.(textRef.current.value);
    }
  };

  const handleClear = () => {
    if (textRef.current) {
      textRef.current.value = '';
    }
    lastValueRef.current = '';
    onChange?.('');
  };

  const safeColorValue = /^#[0-9A-Fa-f]{6}$/.test(value) ? value : '#04D1FC';

  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={safeColorValue}
        onChange={handleColorChange}
        className="w-8 h-8 rounded border border-zinc-200 cursor-pointer"
      />
      <input
        ref={textRef}
        type="text"
        defaultValue={value || ''}
        onBlur={handleTextBlur}
        placeholder={placeholder}
        className="flex-1 h-8 px-2 text-xs rounded border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#04D1FC]"
      />
      {allowClear && (
        <button
          onClick={handleClear}
          type="button"
          className="h-8 px-2 text-[10px] text-zinc-500 hover:text-zinc-700 border border-zinc-200 rounded"
        >
          Clear
        </button>
      )}
    </div>
  );
}

const FieldGroup = ({ label, children, className }) => (
  <div className={cn("space-y-2", className)}>
    <Label className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">{label}</Label>
    {children}
  </div>
);

function SidebarEditor({ 
  newsletter, 
  selectedSection, 
  selectedBlock,
  onSectionClick,
  onBlockClick,
  onSectionUpdate, 
  onBlockUpdate,
  onDeleteBlock,
  onReorderBlocks,
  onMoveSection,
  marqueeRef,
  onSetBlockImage,
  onSetCollageImage, 
}) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [isExportingGif, setIsExportingGif] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const [isContainerExpanded, setIsContainerExpanded] = useState(false);
  // Ref to preserve scroll position
  const scrollContainerRef = useRef(null);
  const scrollPositionRef = useRef(0);
  
  // Preserve scroll position on re-render
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    // Save scroll position before any updates
    const handleScroll = () => {
      scrollPositionRef.current = container.scrollTop;
    };
    
    container.addEventListener('scroll', handleScroll);
    
    // Restore scroll position after render
    if (scrollPositionRef.current > 0) {
      container.scrollTop = scrollPositionRef.current;
    }
    
    return () => container.removeEventListener('scroll', handleScroll);
  });
  
  // Prevent scroll jump when clicking inputs
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;
    
    const preventScrollJump = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        // Save current scroll position
        const currentScroll = container.scrollTop;
        // Restore after a tiny delay (after browser's default scroll)
        requestAnimationFrame(() => {
          if (Math.abs(container.scrollTop - currentScroll) > 50) {
            container.scrollTop = currentScroll;
          }
        });
      }
    };
    
    container.addEventListener('focusin', preventScrollJump);
    return () => container.removeEventListener('focusin', preventScrollJump);
  }, []);

  // When a block is selected, scroll the canvas to it and flash a highlight.
  // Prevents editing the wrong block when multiple blocks of the same type exist.
  useEffect(() => {
    if (!selectedBlock) return;
    const el = document.querySelector(`[data-block-id="${selectedBlock}"]`);
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    const originalShadow = el.style.boxShadow;
    const originalTransition = el.style.transition;
    el.style.transition = 'box-shadow 0.3s';
    el.style.boxShadow = '0 0 0 4px rgba(4,209,252,0.7)';
    const t = setTimeout(() => {
      el.style.boxShadow = originalShadow;
      el.style.transition = originalTransition;
    }, 1200);
    return () => clearTimeout(t);
  }, [selectedBlock]);

  // parentSection: the actual section container (header/section/footer)
  const parentSection = selectedSection 
    ? newsletter?.sections.find(s => s.id === selectedSection)
    : null;

  // block: the selected child block within the section.
  // In grid sections, rows are the source of truth for updates/renders, so
  // prioritize row lookup to avoid editing stale mirrored data from `blocks`.
  const block = (() => {
    if (!selectedBlock || !parentSection) return null;
    const findInRows = () => {
      if (!parentSection.rows) return null;
      for (const r of parentSection.rows) {
        for (const c of r.columns) {
          const found = c.blocks?.find(b => b.id === selectedBlock);
          if (found) return found;
        }
      }
      return null;
    };
    const findInFlat = () => parentSection.blocks?.find(b => b.id === selectedBlock) || null;

    if (isGridSection(parentSection)) {
      return findInRows() || findInFlat();
    }

    const flat = findInFlat();
    if (flat) return flat;
    return findInRows();
  })();

  // 'section' alias: when editing a block, points to block (backward compat
  // with render*Editor functions that read section.fieldName). When no block
  // is selected, points to the section itself.
  const section = block || parentSection;

  const handleExportMarqueeGif = useCallback(async () => {
    const marqueeBlock = block?.type === 'marquee' ? block : section?.blocks?.find(b => b.type === 'marquee');
    if (!marqueeBlock) {
      alert('Marquee block not found.');
      return;
    }

    setIsExportingGif(true);
    setGifProgress(0);

    try {
      const KINETIC = ['marquee-horizontal', 'marquee-diagonal', 'variable-scale', 'kinetic-stack', 'dual-word', 'tag-marquee'];
      const isKinetic = KINETIC.includes(marqueeBlock.preset);

      let result;
      if (isKinetic) {
        // DOM capture — the kinetic renderer is too complex to mirror on canvas.
        result = await exportBlockAsGifFromDOM(marqueeBlock.id, {
          duration: 3000,
          fps: 12,
          onProgress: setGifProgress,
        });
      } else {
        result = await exportMarqueeAsGif(marqueeBlock, {
          width: 600,
          onProgress: setGifProgress,
        });
      }

      downloadBlob(result.blob, `marquee-${Date.now()}.gif`);
    } catch (error) {
      console.error('GIF export failed:', error);
      alert('Failed to export GIF: ' + error.message);
    } finally {
      setIsExportingGif(false);
      setGifProgress(0);
    }
  }, [block, section]);

  const handleExportAnimatedTextGif = useCallback(async () => {
    if (!block || block.type !== 'animatedText') {
      alert('Animated Text block not found.');
      return;
    }
    setIsExportingGif(true);
    setGifProgress(0);
    try {
      const result = await exportAnimatedTextAsGif(block, {
        width: 700,
        onProgress: setGifProgress,
      });
      downloadBlob(result.blob, `animated-text-${Date.now()}.gif`);
    } catch (error) {
      console.error('Animated Text GIF export failed:', error);
      alert('Failed to export GIF: ' + error.message);
    } finally {
      setIsExportingGif(false);
      setGifProgress(0);
    }
  }, [block]);

  // Routes field changes to block or section depending on what's selected
  const handleFieldChange = useCallback((field, value) => {
    if (selectedBlock && block) {
      onBlockUpdate?.(selectedSection, selectedBlock, { [field]: value });
    } else {
      onSectionUpdate(selectedSection, { [field]: value });
    }
  }, [selectedSection, selectedBlock, block, onSectionUpdate, onBlockUpdate]);

  const handleLogoSelect = useCallback((logoUrl, logoData) => {
    // Cover images → set as section background (flatten transparency)
    if (logoData?.category === 'cover' && parentSection) {
      const bgColor = parentSection.background?.color || '#FFFFFF';
      flattenImageTransparency(logoUrl, bgColor).then(({ dataUrl }) => {
        if (!dataUrl) return;
        onSectionUpdate(selectedSection, {
          height: 'auto',
          background: {
            ...(parentSection.background || {}),
            type: 'image',
            image: dataUrl,
            imageSize: 'auto',
            imagePosition: 'center',
          },
        });
      });
      return;
    }

    // Background images → set as section background (flatten transparency)
    if (logoData?.category === 'background' && parentSection) {
      const bgColor = parentSection.background?.color || '#FFFFFF';
      flattenImageTransparency(logoUrl, bgColor).then(({ dataUrl }) => {
        if (!dataUrl) return;
        onSectionUpdate(selectedSection, {
          height: 'auto',
          background: {
            ...(parentSection.background || {}),
            type: 'image',
            image: dataUrl,
            imageSize: 'auto',
            imagePosition: 'center',
          },
        });
      });
      return;
    }

    if (block) {
      if (block.type === 'logo' || block.type === 'image') {
        handleFieldChange('src', logoUrl);
      } else if ('image' in block) {
        handleFieldChange('image', logoUrl);
      }
    } else if (parentSection) {
      const logoBlock = (parentSection.blocks || []).find(b => b.type === 'logo');
      if (logoBlock) {
        onBlockUpdate?.(selectedSection, logoBlock.id, { src: logoUrl });
      } else {
        // Fallback: set as section background (flatten transparency)
        const bgColor = parentSection.background?.color || '#FFFFFF';
        flattenImageTransparency(logoUrl, bgColor).then(({ dataUrl }) => {
          if (!dataUrl) return;
          onSectionUpdate(selectedSection, {
            height: 'auto',
            background: {
              ...(parentSection.background || {}),
              type: 'image',
              image: dataUrl,
              imageSize: 'auto',
              imagePosition: 'center',
            },
          });
        });
      }
    }
  }, [block, parentSection, selectedSection, handleFieldChange, onBlockUpdate, onSectionUpdate, flattenImageTransparency]);

  const handleImageUpload = useCallback(async (fileOrUrl, field) => {
    // Handle removal (null/undefined)
    if (!fileOrUrl) {
      handleFieldChange(field, null);
      return;
    }
    
    // If it's a URL string, use it directly (no base64 conversion!)
    if (typeof fileOrUrl === 'string') {
      handleFieldChange(field, fileOrUrl);
      return;
    }
    
    // If it's a File, convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      handleFieldChange(field, e.target.result);
    };
    reader.readAsDataURL(fileOrUrl);
  }, [handleFieldChange]);

  const handleRemoveBackground = useCallback(async (imageField) => {
    const imageData = section?.[imageField];
    if (!imageData) {
      alert('No image to process');
      return;
    }

    setIsProcessing(true);
    try {
      // Extract base64 data
      const base64Data = imageData.split(',')[1];
      if (!base64Data) {
        throw new Error('Invalid image data');
      }
      
      // Convert base64 to blob
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });
      
      const formData = new FormData();
      formData.append('image_file', blob, 'image.png');
      formData.append('size', 'auto');

      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: { 'X-Api-Key': REMOVE_BG_API_KEY },
        body: formData
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Remove.bg API error:', response.status, errorText);
        throw new Error(`API Error: ${response.status}`);
      }

      const resultBlob = await response.blob();
      const reader = new FileReader();
      reader.onload = (e) => handleFieldChange(imageField, e.target.result);
      reader.readAsDataURL(resultBlob);
    } catch (error) {
      console.error('Remove background error:', error);
      alert(`Failed to remove background: ${error.message}\n\nTip: You can use remove.bg website directly and upload the result.`);
    } finally {
      setIsProcessing(false);
    }
  }, [section, handleFieldChange]);

  const handleArrayImageUpload = useCallback(async (fileOrUrl, arrayField, index) => {
    // Handle removal (null/undefined)
    if (!fileOrUrl) {
      const currentArray = section?.[arrayField] || [];
      const newArray = [...currentArray];
      newArray[index] = null;
      handleFieldChange(arrayField, newArray);
      return;
    }
    
    // If it's a URL string, use it directly (no base64!)
    if (typeof fileOrUrl === 'string') {
      const currentArray = section?.[arrayField] || [];
      const newArray = [...currentArray];
      newArray[index] = fileOrUrl;
      handleFieldChange(arrayField, newArray);
      return;
    }
    
    // If it's a File, convert to base64
    const reader = new FileReader();
    reader.onload = (e) => {
      const currentArray = section?.[arrayField] || [];
      const newArray = [...currentArray];
      newArray[index] = e.target.result;
      handleFieldChange(arrayField, newArray);
    };
    reader.readAsDataURL(fileOrUrl);
  }, [section, handleFieldChange]);

  const handleFocalPointChange = useCallback((index, focalPoint) => {
    const currentFocalPoints = section?.focalPoints || [];
    const newFocalPoints = [...currentFocalPoints];
    newFocalPoints[index] = focalPoint;
    handleFieldChange('focalPoints', newFocalPoints);
  }, [section, handleFieldChange]);

  const handleImageBackgroundChange = useCallback((index, color) => {
    const currentBackgrounds = section?.imageBackgrounds || [];
    const newBackgrounds = [...currentBackgrounds];
    newBackgrounds[index] = color;
    handleFieldChange('imageBackgrounds', newBackgrounds);
  }, [section, handleFieldChange]);

  const handleImageOverlayChange = useCallback((index, overlay) => {
    const currentOverlays = section?.imageOverlays || [];
    const newOverlays = [...currentOverlays];
    newOverlays[index] = overlay;
    handleFieldChange('imageOverlays', newOverlays);
  }, [section, handleFieldChange]);

  const handleBulkProfileImages = useCallback((images) => {
    const profiles = section?.profiles || [];
    const newProfiles = images.map((image, index) => ({
      ...profiles[index],
      image,
      name: profiles[index]?.name || '',
      title: profiles[index]?.title || ''
    }));
    handleFieldChange('profiles', newProfiles);
  }, [section, handleFieldChange]);

  const handleProfileFieldChange = useCallback((index, field, value) => {
    const profiles = section?.profiles || [];
    const newProfiles = [...profiles];
    newProfiles[index] = { ...newProfiles[index], [field]: value };
    handleFieldChange('profiles', newProfiles);
  }, [section, handleFieldChange]);


  // Container settings handler
  const handleContainerChange = useCallback((field, value) => {
    const currentContainer = section?.container || {};
    onSectionUpdate(selectedSection, { 
      container: { ...currentContainer, [field]: value } 
    });
  }, [selectedSection, onSectionUpdate, section?.container]);

  // Container Settings Component
  const renderContainerSettings = () => {
    const container = section?.container || {};
    
    return (
      <div className="mb-6 p-3 bg-gradient-to-br from-zinc-50 to-zinc-100/50 rounded-xl border border-zinc-200">
        <button
          onClick={() => setIsContainerExpanded(!isContainerExpanded)}
          className="w-full flex items-center justify-between text-xs font-semibold text-zinc-600 hover:text-zinc-900"
        >
          <div className="flex items-center gap-2">
            <Layers className="w-3.5 h-3.5" />
            <span>Container Frame</span>
          </div>
          <ChevronDown className={cn("w-4 h-4 transition-transform", isContainerExpanded && "rotate-180")} />
        </button>
        
        {isContainerExpanded && (
          <div className="mt-4 space-y-4">
            {/* Outer Container (Padding/Margin) */}
            <div className="space-y-2">
              <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm bg-zinc-400"></span>
                Outer Frame (Padding)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Top</span>
                  <NumberInput
                    value={container.outerPaddingTop ?? container.outerPadding ?? 0}
                    onChange={(val) => handleContainerChange('outerPaddingTop', val)}
                    step={4}
                    suffix="px"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Bottom</span>
                  <NumberInput
                    value={container.outerPaddingBottom ?? container.outerPadding ?? 0}
                    onChange={(val) => handleContainerChange('outerPaddingBottom', val)}
                    step={4}
                    suffix="px"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Left</span>
                  <NumberInput
                    value={container.outerPaddingLeft ?? container.outerPadding ?? 0}
                    onChange={(val) => handleContainerChange('outerPaddingLeft', val)}
                    step={4}
                    suffix="px"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Right</span>
                  <NumberInput
                    value={container.outerPaddingRight ?? container.outerPadding ?? 0}
                    onChange={(val) => handleContainerChange('outerPaddingRight', val)}
                    step={4}
                    suffix="px"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-400">Outer Background</span>
                <ImageColorPicker
                  value={container.outerBackgroundColor || ''}
                  onChange={(val) => handleContainerChange('outerBackgroundColor', val)}
                  placeholder="#FDFBF8"
                  allowClear
                />
              </div>
            </div>
            
            {/* Inner Container (Border/Radius/Background) */}
            <div className="space-y-2 pt-3 border-t border-zinc-200">
              <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                <span className="w-2 h-2 rounded-sm border-2 border-zinc-400"></span>
                Inner Frame (Stroke & Radius)
              </span>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Border Width</span>
                  <NumberInput
                    value={container.innerBorderWidth ?? 0}
                    onChange={(val) => handleContainerChange('innerBorderWidth', val)}
                    step={1}
                    suffix="px"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Border Radius</span>
                  <NumberInput
                    value={container.innerBorderRadius ?? 0}
                    onChange={(val) => handleContainerChange('innerBorderRadius', val)}
                    step={4}
                    suffix="px"
                  />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-400">Border Color</span>
                <ImageColorPicker
                  value={container.innerBorderColor || '#E5E5E5'}
                  onChange={(val) => handleContainerChange('innerBorderColor', val)}
                  placeholder="#E5E5E5"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-400">Inner Background</span>
                <ImageColorPicker
                  value={container.innerBackgroundColor || ''}
                  onChange={(val) => handleContainerChange('innerBackgroundColor', val)}
                  placeholder="transparent"
                  allowClear
                />
              </div>
            </div>
            
            {/* Background Image */}
            <div className="space-y-2 pt-3 border-t border-zinc-200">
              <span className="text-[10px] text-zinc-500 font-medium flex items-center gap-1">
                <Image className="w-3 h-3" />
                Background Image
              </span>
              <ImageUploader
                currentImage={container.backgroundImage}
                onImageUpload={(file) => {
                  if (!file) return;
                  const reader = new FileReader();
                  reader.onload = (e) => handleContainerChange('backgroundImage', e.target.result);
                  reader.readAsDataURL(file);
                }}
                onRemoveBackground={() => {}}
                isProcessing={false}
                compact
              />
              {container.backgroundImage && (
                <>
                  <button
                    onClick={() => handleContainerChange('backgroundImage', null)}
                    className="w-full h-7 text-[10px] text-zinc-500 hover:text-red-500 border border-zinc-200 rounded transition-colors"
                  >
                    Remove Background Image
                  </button>
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-400">Position</span>
                    <Select
                      value={container.backgroundPosition || 'center'}
                      onChange={(e) => handleContainerChange('backgroundPosition', e.target.value)}
                      className="h-8 text-xs"
                    >
                      <option value="center">Center</option>
                      <option value="top">Top</option>
                      <option value="bottom">Bottom</option>
                      <option value="left">Left</option>
                      <option value="right">Right</option>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[9px] text-zinc-400">Repeat</span>
                    <Select
                      value={container.backgroundRepeat || 'no-repeat'}
                      onChange={(e) => handleContainerChange('backgroundRepeat', e.target.value)}
                      className="h-8 text-xs"
                    >
                      <option value="no-repeat">No Repeat</option>
                      <option value="repeat">Repeat</option>
                      <option value="repeat-x">Repeat X</option>
                      <option value="repeat-y">Repeat Y</option>
                    </Select>
                  </div>
                </>
              )}
              <p className="text-[9px] text-zinc-400">
                Background fills 100% width, auto height
              </p>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderHeaderEditor = () => (
    <div className="space-y-6">
      {renderContainerSettings()}
      
      {/* Logo Section */}
      <FieldGroup label="Logo">
        <ImageUploader
          currentImage={section.logo}
          onImageUpload={(file) => handleImageUpload(file, 'logo')}
          onRemoveBackground={() => handleRemoveBackground('logo')}
          isProcessing={isProcessing}
        />
        {section.logo && (
          <div className="space-y-3 mt-2">
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Width</span>
                <NumberInput
                  value={section.logoWidth || 120}
                  onChange={(val) => handleFieldChange('logoWidth', val)}
                  
                  
                  step={10}
                  suffix="px"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Height</span>
                <Select
                  value={section.logoHeight || 'auto'}
                  onChange={(e) => handleFieldChange('logoHeight', e.target.value)}
                  className="h-10"
                >
                  <option value="auto">Auto</option>
                  <option value="40">40px</option>
                  <option value="60">60px</option>
                  <option value="80">80px</option>
                  <option value="100">100px</option>
                </Select>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Align</span>
                <Select
                  value={section.logoAlignment || 'center'}
                  onChange={(e) => handleFieldChange('logoAlignment', e.target.value)}
                  className="h-10"
                >
                  <option value="left">Left</option>
                  <option value="center">Center</option>
                  <option value="right">Right</option>
                </Select>
              </div>
            </div>
          </div>
        )}
      </FieldGroup>

      {/* Hero Image Section */}
      <FieldGroup label="Hero Image">
        <ImageUploader
          currentImage={section.heroImage}
          onImageUpload={(file) => handleImageUpload(file, 'heroImage')}
          onRemoveBackground={() => handleRemoveBackground('heroImage')}
          isProcessing={isProcessing}
        />
        {section.heroImage && (
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400">Height</span>
              <NumberInput
                value={section.heroImageHeight || 200}
                onChange={(val) => handleFieldChange('heroImageHeight', val)}
                
                
                step={10}
                suffix="px"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400">Fit</span>
              <Select
                value={section.heroImageFit || 'cover'}
                onChange={(e) => handleFieldChange('heroImageFit', e.target.value)}
                className="h-10"
              >
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
              </Select>
            </div>
          </div>
        )}
      </FieldGroup>

      {/* Title Section */}
      <FieldGroup label="Title">
        <input
          type="text"
          key={`title-${selectedSection}`}
          defaultValue={section.title || ''}
          onBlur={(e) => handleFieldChange('title', e.target.value)}
          placeholder="Newsletter title"
          className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-[#04D1FC] focus:border-transparent"
        />
        <p className="text-[10px] text-zinc-400 mt-1">Link: <code className="bg-zinc-100 px-1 rounded text-[9px]">[text](url)</code> · Line break: <code className="bg-zinc-100 px-1 rounded text-[9px]">&lt;br&gt;</code></p>

        <div className="grid grid-cols-3 gap-2 mt-3">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Size</span>
            <NumberInput
              value={section.titleFontSize || 28}
              onChange={(val) => handleFieldChange('titleFontSize', val)}
              
              
              step={2}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Weight</span>
            <Select
              value={section.titleFontWeight || '700'}
              onChange={(e) => handleFieldChange('titleFontWeight', e.target.value)}
              className="h-10"
            >
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Style</span>
            <Select
              value={section.titleFontStyle || 'normal'}
              onChange={(e) => handleFieldChange('titleFontStyle', e.target.value)}
              className="h-10"
            >
              <option value="normal">Normal</option>
              <option value="italic">Italic</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Kerning</span>
            <Select
              value={section.titleLetterSpacing || '-0.02em'}
              onChange={(e) => handleFieldChange('titleLetterSpacing', e.target.value)}
              className="h-10"
            >
              <option value="-0.05em">Tight (-0.05)</option>
              <option value="-0.02em">Snug (-0.02)</option>
              <option value="0">Normal (0)</option>
              <option value="0.02em">Wide (0.02)</option>
              <option value="0.05em">Wider (0.05)</option>
              <option value="0.1em">Widest (0.1)</option>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Leading</span>
            <Select
              value={section.titleLineHeight || '1.2'}
              onChange={(e) => handleFieldChange('titleLineHeight', parseFloat(e.target.value))}
              className="h-10"
            >
              <option value="1">Tight (1.0)</option>
              <option value="1.1">Snug (1.1)</option>
              <option value="1.2">Normal (1.2)</option>
              <option value="1.4">Relaxed (1.4)</option>
              <option value="1.6">Loose (1.6)</option>
            </Select>
          </div>
        </div>
      </FieldGroup>

      {/* Subtitle Section */}
      <FieldGroup label="Subtitle">
        <EditableInput
          value={section.subtitle || ''}
          onChange={(val) => handleFieldChange('subtitle', val)}
          sectionKey={selectedSection}
          placeholder="Newsletter subtitle"
        />
        <div className="grid grid-cols-3 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Size</span>
            <NumberInput
              value={section.subtitleFontSize || 16}
              onChange={(val) => handleFieldChange('subtitleFontSize', val)}
              
              
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Weight</span>
            <Select
              value={section.subtitleFontWeight || '400'}
              onChange={(e) => handleFieldChange('subtitleFontWeight', e.target.value)}
              className="h-10"
            >
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semi</option>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Kerning</span>
            <Select
              value={section.subtitleLetterSpacing || '0'}
              onChange={(e) => handleFieldChange('subtitleLetterSpacing', e.target.value)}
              className="h-10"
            >
              <option value="-0.02em">Tight</option>
              <option value="0">Normal</option>
              <option value="0.05em">Wide</option>
            </Select>
          </div>
        </div>
      </FieldGroup>

      {/* Date Badge */}
      <FieldGroup label="Date Badge">
        <div className="flex items-center gap-2 mb-2">
          <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
            <input
              type="checkbox"
              checked={section.showDateBadge || false}
              onChange={(e) => handleFieldChange('showDateBadge', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Show date badge
          </label>
        </div>
        {section.showDateBadge && (
          <div className="space-y-3 p-3 bg-zinc-50 rounded-xl">
            <EditableInput
              value={section.dateBadgeText || 'JULY 2025'}
              onChange={(val) => handleFieldChange('dateBadgeText', val)}
              sectionKey={selectedSection}
              placeholder="MONTH YEAR"
            />
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Background</span>
                <input
                  type="color"
                  value={section.dateBadgeBg || '#04D1FC'}
                  onChange={(e) => handleFieldChange('dateBadgeBg', e.target.value)}
                  className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Text</span>
                <input
                  type="color"
                  value={section.dateBadgeColor || '#FFFFFF'}
                  onChange={(e) => handleFieldChange('dateBadgeColor', e.target.value)}
                  className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}
      </FieldGroup>

      {/* Colors */}
      <FieldGroup label="Colors">
        <div className="space-y-3">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Text Color</span>
            <div className="flex gap-2">
              <input
                type="color"
                value={section.textColor || '#FFFFFF'}
                onChange={(e) => handleFieldChange('textColor', e.target.value)}
                className="w-10 h-10 rounded border border-zinc-200 cursor-pointer"
              />
              <EditableInput
                value={section.textColor || '#FFFFFF'}
                onChange={(val) => handleFieldChange('textColor', val)}
                sectionKey={selectedSection}
                className="flex-1 font-mono text-xs"
              />
            </div>
          </div>
          
          {/* Transparent background toggle - to show container's background image */}
          <div className="flex items-center gap-2 p-2 bg-zinc-50 rounded-lg">
            <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
              <input
                type="checkbox"
                checked={section.backgroundColor === 'transparent'}
                onChange={(e) => {
                  if (e.target.checked) {
                    handleFieldChange('backgroundColor', 'transparent');
                  } else {
                    handleFieldChange('backgroundColor', '#04D1FC');
                  }
                }}
                className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
              />
              Transparent (use container BG image)
            </label>
          </div>
          
          {section.backgroundColor !== 'transparent' && (
            <GradientPicker
              startColor={section.backgroundColor}
              endColor={section.gradientEnd}
              onStartColorChange={(color) => handleFieldChange('backgroundColor', color)}
              onEndColorChange={(color) => handleFieldChange('gradientEnd', color)}
              sectionKey={selectedSection}
            />
          )}
        </div>
      </FieldGroup>

      {/* Spacing & Padding */}
      <FieldGroup label="Spacing & Padding">
        <div className="space-y-4">
          {/* Container Padding */}
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-500 font-medium">Container Padding</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Top</span>
                <NumberInput
                  value={section.paddingTop ?? 0}
                  onChange={(val) => handleFieldChange('paddingTop', val)}
                  
                  
                  step={4}
                  suffix="px"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Bottom</span>
                <NumberInput
                  value={section.paddingBottom ?? 0}
                  onChange={(val) => handleFieldChange('paddingBottom', val)}
                  
                  
                  step={4}
                  suffix="px"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Sides</span>
                <NumberInput
                  value={section.paddingHorizontal ?? 0}
                  onChange={(val) => handleFieldChange('paddingHorizontal', val)}
                  
                  
                  step={4}
                  suffix="px"
                />
              </div>
            </div>
          </div>

          {/* Element Spacing */}
          <div className="space-y-2">
            <span className="text-[10px] text-zinc-500 font-medium">Element Spacing</span>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Logo→Hero</span>
                <NumberInput
                  value={section.spacingLogoToHero ?? 20}
                  onChange={(val) => handleFieldChange('spacingLogoToHero', val)}
                  
                  
                  step={4}
                  suffix="px"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Hero→Title</span>
                <NumberInput
                  value={section.spacingHeroToTitle ?? 24}
                  onChange={(val) => handleFieldChange('spacingHeroToTitle', val)}
                  
                  
                  step={4}
                  suffix="px"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Title→Sub</span>
                <NumberInput
                  value={section.spacingTitleToSubtitle ?? 8}
                  onChange={(val) => handleFieldChange('spacingTitleToSubtitle', val)}
                  
                  
                  step={2}
                  suffix="px"
                />
              </div>
            </div>
          </div>

          {/* Hero placeholder toggle */}
          <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer pt-2 border-t border-zinc-100">
            <input
              type="checkbox"
              checked={section.showHeroPlaceholder !== false}
              onChange={(e) => handleFieldChange('showHeroPlaceholder', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Show hero placeholder when empty
          </label>
        </div>
      </FieldGroup>
    </div>
  );

  const renderTextEditor = () => (
    <div className="space-y-6">
      {renderContainerSettings()}
      
      <FieldGroup label="Content">
        <EditableTextarea
          value={section.content || ''}
          onChange={(val) => handleFieldChange('content', val)}
          sectionKey={selectedSection}
          rows={6}
          placeholder="Enter your text..."
          className="resize-none"
        />
        <p className="text-[10px] text-zinc-400 mt-1">Link: <code className="bg-zinc-100 px-1 rounded text-[9px]">[text](url)</code> · Line break: <code className="bg-zinc-100 px-1 rounded text-[9px]">&lt;br&gt;</code></p>
      </FieldGroup>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Font">
          <Select
            value={section.fontFamily || 'Poppins'}
            onChange={(e) => handleFieldChange('fontFamily', e.target.value)}
          >
            <option value="Poppins">Poppins</option>
            <option value="Noto Sans Hebrew">Noto Sans Hebrew</option>
            <option value="Inter">Inter</option>
          </Select>
        </FieldGroup>

        <FieldGroup label="Size">
          <NumberInput
            value={section.fontSize || 16}
            onChange={(val) => handleFieldChange('fontSize', val)}
            
            
            suffix="px"
          />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Text Color">
          <EditableColorInput
            value={section.color || '#120F0F'}
            onChange={(val) => handleFieldChange('color', val)}
            sectionKey={selectedSection}
          />
        </FieldGroup>

        <FieldGroup label="Background">
          <EditableColorInput
            value={section.backgroundColor || '#FFFFFF'}
            onChange={(val) => handleFieldChange('backgroundColor', val)}
            sectionKey={selectedSection}
          />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Direction">
          <Select
            value={section.direction || 'ltr'}
            onChange={(e) => handleFieldChange('direction', e.target.value)}
          >
            <option value="ltr">LTR</option>
            <option value="rtl">RTL</option>
          </Select>
        </FieldGroup>

        <FieldGroup label="Align">
          <Select
            value={section.textAlign || 'center'}
            onChange={(e) => handleFieldChange('textAlign', e.target.value)}
          >
            <option value="left">Left</option>
            <option value="center">Center</option>
            <option value="right">Right</option>
          </Select>
        </FieldGroup>
      </div>
    </div>
  );

  const renderSectionHeaderEditor = () => (
    <div className="space-y-6">
      {renderContainerSettings()}
      
      <FieldGroup label="Text">
        <EditableInput
          value={section.text || ''}
          onChange={(val) => handleFieldChange('text', val)}
          sectionKey={selectedSection}
          placeholder="Section title"
        />
        <div className="space-y-1 mt-2">
          <span className="text-[9px] text-zinc-400">Link URL (optional)</span>
          <LocalInput
            value={section.link || ''}
            onSave={(val) => handleFieldChange('link', val)}
            placeholder="https://..."
            className="w-full h-8 px-2 text-xs rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#04D1FC] focus:border-transparent"
          />
        </div>
      </FieldGroup>

      <FieldGroup label="Background">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Start Color</span>
            <input
              type="color"
              value={section.backgroundColor || '#04D1FC'}
              onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
              className="w-full h-8 rounded border border-zinc-200 cursor-pointer bg-transparent"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">End Color (Gradient)</span>
            <div className="flex gap-1">
              <input
                type="color"
                value={section.gradientEnd || section.backgroundColor || '#04D1FC'}
                onChange={(e) => handleFieldChange('gradientEnd', e.target.value)}
                className="flex-1 h-8 rounded border border-zinc-200 cursor-pointer bg-transparent"
              />
              {section.gradientEnd && (
                <button
                  onClick={() => handleFieldChange('gradientEnd', null)}
                  className="px-2 h-8 text-xs text-zinc-400 hover:text-zinc-600 border border-zinc-200 rounded"
                >
                  ×
                </button>
              )}
            </div>
          </div>
        </div>
        {section.gradientEnd && (
          <div className="space-y-1 mt-2">
            <span className="text-[9px] text-zinc-400">Gradient Direction</span>
            <Select
              value={section.gradientDirection || '90deg'}
              onChange={(e) => handleFieldChange('gradientDirection', e.target.value)}
              className="h-8"
            >
              <option value="90deg">Left → Right</option>
              <option value="270deg">Right → Left</option>
              <option value="180deg">Top → Bottom</option>
              <option value="0deg">Bottom → Top</option>
              <option value="135deg">Diagonal ↘</option>
              <option value="45deg">Diagonal ↗</option>
            </Select>
          </div>
        )}
      </FieldGroup>

      <FieldGroup label="Text Color">
        <input
          type="color"
          value={section.color || '#FFFFFF'}
          onChange={(e) => handleFieldChange('color', e.target.value)}
          className="w-full h-8 rounded border border-zinc-200 cursor-pointer bg-transparent"
        />
      </FieldGroup>

      <FieldGroup label="Font Size">
        <NumberInput
          value={section.fontSize || 18}
          onChange={(val) => handleFieldChange('fontSize', val)}
          suffix="px"
        />
      </FieldGroup>

      <FieldGroup label="Section Padding">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Top</span>
            <NumberInput
              value={section.paddingTop ?? section.padding ?? 14}
              onChange={(val) => handleFieldChange('paddingTop', val)}
              step={2}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Bottom</span>
            <NumberInput
              value={section.paddingBottom ?? section.padding ?? 14}
              onChange={(val) => handleFieldChange('paddingBottom', val)}
              step={2}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Left</span>
            <NumberInput
              value={section.paddingLeft ?? 24}
              onChange={(val) => handleFieldChange('paddingLeft', val)}
              step={2}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Right</span>
            <NumberInput
              value={section.paddingRight ?? 24}
              onChange={(val) => handleFieldChange('paddingRight', val)}
              step={2}
              suffix="px"
            />
          </div>
        </div>
      </FieldGroup>
    </div>
  );

  const renderImageBlockEditor = () => (
    <div className="space-y-4">
      <FieldGroup label="Image">
        {block?.src ? (
          <div className="space-y-2">
            <div className="relative rounded-lg overflow-hidden border border-zinc-200">
              <img src={block.src} alt="" className="w-full h-24 object-cover" />
            </div>
            <button
              onClick={() => onSetBlockImage?.(selectedSection, selectedBlock)}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-zinc-200 hover:border-[#04D1FC] hover:bg-[#04D1FC]/5 text-zinc-600 hover:text-[#04D1FC] text-[11px] font-medium transition-colors"
            >
              Replace image
            </button>
          </div>
        ) : (
          <button
            onClick={() => onSetBlockImage?.(selectedSection, selectedBlock)}
            className="w-full flex items-center justify-center gap-2 px-3 py-3 rounded-lg border-2 border-dashed border-zinc-300 hover:border-[#04D1FC] hover:bg-[#04D1FC]/5 text-zinc-500 hover:text-[#04D1FC] text-[12px] font-medium transition-colors"
          >
            Set image
          </button>
        )}
      </FieldGroup>

      <FieldGroup label="Size">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Width</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleFieldChange('width', '100%')}
                className={cn(
                  "flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors",
                  (!block?.width || block.width === '100%') ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                )}
              >
                Full
              </button>
              <button
                onClick={() => handleFieldChange('width', block?.width && block.width !== '100%' ? block.width : 300)}
                className={cn(
                  "flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors",
                  (block?.width && block.width !== '100%') ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                )}
              >
                Fixed
              </button>
            </div>
            {block?.width && block.width !== '100%' && (
              <NumberInput
                value={typeof block.width === 'number' ? block.width : 300}
                onChange={(val) => handleFieldChange('width', val)}
                step={10}
                min={20}
                max={700}
                suffix="px"
              />
            )}
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Height</span>
            <div className="flex gap-1">
              <button
                onClick={() => handleFieldChange('height', 'auto')}
                className={cn(
                  "flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors",
                  (!block?.height || block.height === 'auto') ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                )}
              >
                Auto
              </button>
              <button
                onClick={() => handleFieldChange('height', typeof block?.height === 'number' ? block.height : 200)}
                className={cn(
                  "flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors",
                  (typeof block?.height === 'number') ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                )}
              >
                Fixed
              </button>
            </div>
            {typeof block?.height === 'number' && (
              <NumberInput
                value={block.height}
                onChange={(val) => handleFieldChange('height', val)}
                step={10}
                min={20}
                suffix="px"
              />
            )}
          </div>
        </div>
        {block?.width && block.width !== '100%' && (
          <div className="space-y-1 mt-2">
            <span className="text-[10px] text-zinc-400">Alignment</span>
            <div className="flex gap-1">
              {['left', 'center', 'right'].map((a) => (
                <button
                  key={a}
                  onClick={() => handleFieldChange('alignment', a)}
                  className={cn(
                    "flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors capitalize",
                    (block?.alignment || 'center') === a ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
                  )}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>
        )}
      </FieldGroup>

      <FieldGroup label="Object Fit">
        <div className="flex gap-1">
          {['cover', 'contain', 'fill'].map((fit) => (
            <button
              key={fit}
              onClick={() => handleFieldChange('objectFit', fit)}
              className={cn(
                "flex-1 px-2 py-1.5 text-[10px] font-medium rounded-md transition-colors",
                (block?.objectFit || 'cover') === fit
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-500 hover:bg-zinc-200"
              )}
            >
              {fit.charAt(0).toUpperCase() + fit.slice(1)}
            </button>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="Border Radius">
        <NumberInput
          value={block?.borderRadius || 0}
          min={0}
          max={50}
          onChange={(val) => handleFieldChange('borderRadius', val)}
          suffix="px"
        />
      </FieldGroup>
    </div>
  );

  const renderImageCollageEditor = () => {
    const currentPreset = section.layout || 'featured-left';
    const preset = getPresetById(currentPreset);
    const imageCount = preset ? getImageCountForPreset(preset) : 4;
    const selectedImage = selectedImageIndex !== null ? section.images?.[selectedImageIndex] : null;
    const selectedFocalPoint = selectedImageIndex !== null 
      ? section.focalPoints?.[selectedImageIndex] || { x: 50, y: 50 }
      : null;
    const selectedBackground = selectedImageIndex !== null 
      ? section.imageBackgrounds?.[selectedImageIndex] || ''
      : '';
    const selectedOverlay = selectedImageIndex !== null 
      ? section.imageOverlays?.[selectedImageIndex] || { color: '', opacity: 0 }
      : { color: '', opacity: 0 };
    
    return (
      <div className="space-y-6">
        {renderContainerSettings()}
        
        <FieldGroup label="Layout Preset">
          <CollagePresetPicker
            currentPreset={currentPreset}
            onSelectPreset={(presetId) => handleFieldChange('layout', presetId)}
          />
        </FieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Gap">
            <NumberInput
              value={section.gap || 8}
              onChange={(val) => handleFieldChange('gap', val)}
              
              
              suffix="px"
            />
          </FieldGroup>

          <FieldGroup label="Height">
            <NumberInput
              value={section.imageHeight || 200}
              onChange={(val) => handleFieldChange('imageHeight', val)}
              
              
              step={10}
              suffix="px"
            />
          </FieldGroup>
        </div>

        <FieldGroup label="Bulk Import">
          <BulkImageUploader
            maxImages={imageCount}
            currentImages={section.images || []}
            onImagesChange={(images) => handleFieldChange('images', images)}
          />
        </FieldGroup>

        <FieldGroup label={`Individual Images (${imageCount})`}>
          <div className="grid grid-cols-3 gap-2">
            {Array.from({ length: imageCount }).map((_, index) => {
              const hasBackground = section.imageBackgrounds?.[index];
              const hasOverlay = section.imageOverlays?.[index]?.opacity > 0;
              
              return (
                <div 
                  key={index} 
                  className={cn(
                    "relative cursor-pointer rounded-lg overflow-hidden border-2 transition-all",
                    selectedImageIndex === index 
                      ? "border-[#04D1FC] ring-2 ring-[#04D1FC]/20" 
                      : "border-zinc-200 hover:border-zinc-300"
                  )}
                  onClick={() => setSelectedImageIndex(selectedImageIndex === index ? null : index)}
                >
                  <ImageUploader
                    currentImage={section.images?.[index]}
                    onImageUpload={(file) => {
                      handleArrayImageUpload(file, 'images', index);
                      setSelectedImageIndex(index);
                    }}
                    onRemoveBackground={() => {}}
                    isProcessing={isProcessing}
                    compact={true}
                  />
                  <span className="absolute top-1 left-1 w-5 h-5 rounded bg-black/60 text-white text-[10px] font-bold flex items-center justify-center">
                    {index + 1}
                  </span>
                  {onSetCollageImage && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onSetCollageImage(selectedSection, selectedBlock, index); }}
                      className="absolute top-1 right-1 w-5 h-5 rounded bg-[#04D1FC]/80 hover:bg-[#04D1FC] text-white text-[8px] font-bold flex items-center justify-center transition-colors"
                      title="Set from media"
                    >
                      M
                    </button>
                  )}
                  {/* Indicators for background/overlay */}
                  <div className="absolute bottom-1 right-1 flex gap-0.5">
                    {hasBackground && (
                      <span 
                        className="w-3 h-3 rounded-full border border-white shadow"
                        style={{ backgroundColor: section.imageBackgrounds[index] }}
                        title="Has background"
                      />
                    )}
                    {hasOverlay && (
                      <span 
                        className="w-3 h-3 rounded-full border border-white shadow opacity-70"
                        style={{ backgroundColor: section.imageOverlays[index]?.color }}
                        title="Has overlay"
                      />
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </FieldGroup>

        {/* Selected Image Settings */}
        {selectedImageIndex !== null && selectedImage && (
          <>
            <FieldGroup label={`Image ${selectedImageIndex + 1} Settings`}>
              <div className="space-y-4 p-3 bg-zinc-50 rounded-xl">
                {/* Focal Point */}
                <div>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mb-2">Focal Point</span>
                  <FocalPointPicker
                    image={selectedImage}
                    focalPoint={selectedFocalPoint}
                    onChange={(fp) => handleFocalPointChange(selectedImageIndex, fp)}
                  />
                </div>

                {/* Background Color (for cutouts) */}
                <div>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mb-2">
                    Background (for cutouts)
                  </span>
                  <ImageColorPicker
                    value={selectedBackground}
                    onChange={(color) => handleImageBackgroundChange(selectedImageIndex, color)}
                    placeholder="No background"
                    allowClear
                  />
                  <p className="text-[9px] text-zinc-400 mt-1">
                    Set a solid color behind transparent images
                  </p>
                </div>

                {/* Overlay Color */}
                <div>
                  <span className="text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mb-2">
                    Color Overlay
                  </span>
                  <ImageColorPicker
                    value={selectedOverlay.color}
                    onChange={(color) => handleImageOverlayChange(selectedImageIndex, { 
                      ...selectedOverlay, 
                      color: color,
                      opacity: selectedOverlay.opacity || 30
                    })}
                    placeholder="No overlay"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-500 w-12">Opacity</span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={selectedOverlay.opacity || 0}
                      onChange={(e) => handleImageOverlayChange(selectedImageIndex, { 
                        ...selectedOverlay, 
                        opacity: parseInt(e.target.value) 
                      })}
                      className="flex-1 h-1 bg-zinc-200 rounded-lg appearance-none cursor-pointer"
                    />
                    <span className="text-[10px] text-zinc-600 w-8">{selectedOverlay.opacity || 0}%</span>
                  </div>
                  <p className="text-[9px] text-zinc-400 mt-1">
                    Add a color tint for text readability
                  </p>
                  {selectedOverlay.color && selectedOverlay.opacity > 0 && (
                    <button
                      onClick={() => handleImageOverlayChange(selectedImageIndex, { color: '', opacity: 0 })}
                      className="mt-2 h-7 px-2 text-[10px] text-zinc-500 hover:text-zinc-700 border border-zinc-200 rounded w-full"
                    >
                      Remove Overlay
                    </button>
                  )}
                </div>
              </div>
            </FieldGroup>
          </>
        )}

        {/* Snapshot to Image - backup for email clients that don't render gaps */}
        <FieldGroup label="Export as Image">
          <p className="text-[9px] text-zinc-400 mb-2">
            If gaps don't render correctly in email, snapshot the collage as a single image
          </p>
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={async () => {
              const images = section.images || [];
              if (images.length === 0) {
                alert('No images to snapshot');
                return;
              }
              
              try {
                const gap = section.gap || 8;
                const totalHeight = section.imageHeight || 200;
                const canvasWidth = 600;
                const bgColor = section.backgroundColor || '#ffffff';
                
                // Get preset layout
                const currentPreset = section.layout || 'featured-left';
                const presetModule = await import('../../lib/collagePresets');
                const presetData = presetModule.getPresetById(currentPreset);
                
                if (!presetData || !presetData.preview) {
                  alert('Could not find layout preset');
                  return;
                }
                
                const grid = presetData.preview;
                const rows = grid.length;
                const cols = grid[0].length;
                const cellWidth = (canvasWidth - (gap * (cols - 1))) / cols;
                const cellHeight = (totalHeight - (gap * (rows - 1))) / rows;
                
                // Create canvas
                const canvas = document.createElement('canvas');
                canvas.width = canvasWidth;
                canvas.height = totalHeight;
                const ctx = canvas.getContext('2d');
                
                // Fill background
                ctx.fillStyle = bgColor;
                ctx.fillRect(0, 0, canvasWidth, totalHeight);
                
                // Track which cells we've drawn
                const drawnCells = new Set();
                
                // Load and draw images
                for (let r = 0; r < rows; r++) {
                  for (let c = 0; c < cols; c++) {
                    const cellId = grid[r][c];
                    if (drawnCells.has(cellId)) continue;
                    drawnCells.add(cellId);
                    
                    const imageIndex = cellId - 1;
                    const imageSrc = images[imageIndex];
                    if (!imageSrc) continue;
                    
                    // Calculate cell span
                    let colSpan = 1, rowSpan = 1;
                    while (c + colSpan < cols && grid[r][c + colSpan] === cellId) colSpan++;
                    while (r + rowSpan < rows && grid[r + rowSpan]?.[c] === cellId) rowSpan++;
                    
                    const x = c * (cellWidth + gap);
                    const y = r * (cellHeight + gap);
                    const w = cellWidth * colSpan + gap * (colSpan - 1);
                    const h = cellHeight * rowSpan + gap * (rowSpan - 1);
                    
                    // Load image
                    const img = new window.Image();
                    img.crossOrigin = 'anonymous';
                    await new Promise((resolve, reject) => {
                      img.onload = resolve;
                      img.onerror = reject;
                      img.src = imageSrc;
                    });
                    
                    // Draw with object-fit: cover
                    const imgRatio = img.width / img.height;
                    const cellRatio = w / h;
                    let sx, sy, sw, sh;
                    
                    if (imgRatio > cellRatio) {
                      sh = img.height;
                      sw = sh * cellRatio;
                      sx = (img.width - sw) / 2;
                      sy = 0;
                    } else {
                      sw = img.width;
                      sh = sw / cellRatio;
                      sx = 0;
                      sy = (img.height - sh) / 2;
                    }
                    
                    // Round corners with clipping
                    ctx.save();
                    ctx.beginPath();
                    ctx.roundRect(x, y, w, h, 8);
                    ctx.clip();
                    ctx.drawImage(img, sx, sy, sw, sh, x, y, w, h);
                    ctx.restore();
                  }
                }
                
                // Download
                const link = document.createElement('a');
                link.download = `collage-${Date.now()}.png`;
                link.href = canvas.toDataURL('image/png');
                link.click();
              } catch (error) {
                console.error('Snapshot failed:', error);
                alert('Snapshot failed: ' + error.message);
              }
            }}
          >
            <Camera className="w-4 h-4" />
            Snapshot as PNG
          </Button>
        </FieldGroup>
      </div>
    );
  };

  const renderImageSequenceEditor = () => {
    const sequenceImages = section.images || [];

    const handleSequenceImageUpload = async (files) => {
      const imageFiles = Array.from(files).filter(f => f.type.startsWith('image/'));
      if (imageFiles.length === 0) return;

      const newImages = await Promise.all(
        imageFiles.map(file => {
          return new Promise((resolve) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.readAsDataURL(file);
          });
        })
      );

      handleFieldChange('images', [...sequenceImages, ...newImages]);
    };

    const removeSequenceImage = (index) => {
      const newImages = sequenceImages.filter((_, i) => i !== index);
      handleFieldChange('images', newImages);
    };

    const clearAllImages = () => {
      handleFieldChange('images', []);
    };

    return (
      <div className="space-y-6">
        {renderContainerSettings()}
        
        <FieldGroup label="Upload Images">
          <div 
            className="border-2 border-dashed border-zinc-200 rounded-xl p-6 text-center hover:border-[#04D1FC] transition-colors cursor-pointer"
            onClick={() => document.getElementById('sequence-upload')?.click()}
            onDrop={(e) => {
              e.preventDefault();
              handleSequenceImageUpload(e.dataTransfer.files);
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <div className="text-3xl mb-2 opacity-30">📁</div>
            <p className="text-sm text-zinc-600 mb-1">Drop images or click to upload</p>
            <p className="text-xs text-zinc-400">{sequenceImages.length} images added</p>
            <input
              id="sequence-upload"
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={(e) => handleSequenceImageUpload(e.target.files)}
            />
          </div>
        </FieldGroup>

        {sequenceImages.length > 0 && (
          <>
            <FieldGroup label={`Frames (${sequenceImages.length})`}>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto">
                {sequenceImages.map((img, index) => (
                  <div key={index} className="relative group aspect-square rounded overflow-hidden border border-zinc-200">
                    <img src={img} alt={`Frame ${index + 1}`} className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeSequenceImage(index)}
                      className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full text-xs opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                    >
                      ×
                    </button>
                    <span className="absolute bottom-1 left-1 bg-black/60 text-white text-[9px] px-1 rounded">
                      {index + 1}
                    </span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAllImages}
                  className="flex-1"
                >
                  Clear All
                </Button>
                <Button
                  size="sm"
                  onClick={async () => {
                    if (sequenceImages.length < 2) {
                      alert('Add at least 2 images to create a GIF');
                      return;
                    }
                    
                    setIsExportingGif(true);
                    setGifProgress(0);
                    
                    try {
                      const blob = await exportSequenceAsGif(sequenceImages, {
                        width: 600,
                        height: section.previewHeight || 300,
                        delay: section.frameDuration || 500,
                        backgroundColor: section.backgroundColor || '#FFFFFF',
                        onProgress: setGifProgress
                      });
                      
                      downloadBlob(blob, `sequence-${Date.now()}.gif`);
                    } catch (error) {
                      console.error('GIF export failed:', error);
                      alert('GIF export failed: ' + error.message);
                    } finally {
                      setIsExportingGif(false);
                      setGifProgress(0);
                    }
                  }}
                  disabled={isExportingGif || sequenceImages.length < 2}
                  className="flex-1 bg-[#04D1FC] hover:bg-[#04D1FC]/90"
                >
                  {isExportingGif ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      {gifProgress}%
                    </>
                  ) : (
                    <>
                      <FileImage className="w-3.5 h-3.5" />
                      Export GIF
                    </>
                  )}
                </Button>
              </div>
            </FieldGroup>

            <div className="grid grid-cols-2 gap-3">
              <FieldGroup label="Frame Duration">
                <Select
                  value={section.frameDuration || 500}
                  onChange={(e) => handleFieldChange('frameDuration', parseInt(e.target.value))}
                  className="h-10"
                >
                  <option value={200}>200ms (Fast)</option>
                  <option value={300}>300ms</option>
                  <option value={500}>500ms</option>
                  <option value={750}>750ms</option>
                  <option value={1000}>1s</option>
                  <option value={1500}>1.5s</option>
                  <option value={2000}>2s (Slow)</option>
                </Select>
              </FieldGroup>

              <FieldGroup label="Preview Height">
                <NumberInput
                  value={section.previewHeight || 300}
                  onChange={(val) => handleFieldChange('previewHeight', val)}
                  
                  
                  step={25}
                  suffix="px"
                />
              </FieldGroup>
            </div>

            <FieldGroup label="Border Radius">
              <NumberInput
                value={section.borderRadius || 0}
                onChange={(val) => handleFieldChange('borderRadius', val)}
                min={0}
                max={100}
                step={1}
                suffix="px"
              />
            </FieldGroup>

            <FieldGroup label="Display Options">
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={section.autoPlay !== false}
                    onChange={(e) => handleFieldChange('autoPlay', e.target.checked)}
                    className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
                  />
                  Auto-play animation
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={section.showControls || false}
                    onChange={(e) => handleFieldChange('showControls', e.target.checked)}
                    className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
                  />
                  Show play/pause controls
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={section.showThumbnails || false}
                    onChange={(e) => handleFieldChange('showThumbnails', e.target.checked)}
                    className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
                  />
                  Show thumbnails strip
                </label>
                <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={section.showFrameCounter || false}
                    onChange={(e) => handleFieldChange('showFrameCounter', e.target.checked)}
                    className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
                  />
                  Show frame counter
                </label>
              </div>
            </FieldGroup>

            <FieldGroup label="Background Color">
              <input
                type="color"
                value={section.backgroundColor || '#FFFFFF'}
                onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
                className="w-full h-10 rounded-lg border border-zinc-200 cursor-pointer"
              />
            </FieldGroup>

          </>
        )}

        {sequenceImages.length < 2 && (
          <FieldGroup label="GIF Export">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="w-full opacity-60"
            >
              <FileImage className="w-4 h-4" />
              Export as GIF
            </Button>
            <p className="text-[10px] text-zinc-400 mt-1">
              Upload at least 2 frames above to enable GIF export.
            </p>
          </FieldGroup>
        )}

        <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
          <p className="text-[10px] text-amber-700">
            <strong>Email Note:</strong> Most email clients support GIFs. Export your sequence as a GIF for better compatibility.
          </p>
        </div>
      </div>
    );
  };

  const renderProfileCardsEditor = () => {
    const profileCount = section.columns || 4;
    const currentProfileImages = (section.profiles || []).map(p => p?.image).filter(Boolean);
    
    return (
      <div className="space-y-6">
        {renderContainerSettings()}
        
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Columns">
            <Select
              value={section.columns || 4}
              onChange={(e) => handleFieldChange('columns', parseInt(e.target.value))}
            >
              <option value={2}>2</option>
              <option value={3}>3</option>
              <option value={4}>4</option>
            </Select>
          </FieldGroup>

          <FieldGroup label="Shape">
            <Select
              value={section.imageShape || 'circular'}
              onChange={(e) => handleFieldChange('imageShape', e.target.value)}
            >
              <option value="circular">Circle</option>
              <option value="square">Square</option>
            </Select>
          </FieldGroup>
        </div>

        <div className="flex gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
            <input
              type="checkbox"
              checked={section.showName !== false}
              onChange={(e) => handleFieldChange('showName', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Name
          </label>
          <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
            <input
              type="checkbox"
              checked={section.showTitle !== false}
              onChange={(e) => handleFieldChange('showTitle', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Title
          </label>
        </div>

        <FieldGroup label="Bulk Import Photos">
          <BulkImageUploader
            maxImages={profileCount}
            currentImages={currentProfileImages}
            onImagesChange={handleBulkProfileImages}
          />
        </FieldGroup>

        <FieldGroup label="Profiles">
          <div className="space-y-2">
            {Array.from({ length: profileCount }).map((_, index) => {
              const profile = section.profiles?.[index] || {};
              return (
                <div key={`${selectedSection}-profile-${index}`} className="p-3 bg-zinc-50 rounded-xl space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded bg-zinc-200 text-zinc-600 text-[10px] font-semibold flex items-center justify-center">
                      {index + 1}
                    </span>
                    <span className="text-xs text-zinc-500 font-medium">Profile {index + 1}</span>
                  </div>
                  
                  <ImageUploader
                    currentImage={profile.image}
                    onImageUpload={(file) => {
                      if (!file) {
                        handleProfileFieldChange(index, 'image', null);
                        return;
                      }
                      const reader = new FileReader();
                      reader.onload = (e) => {
                        handleProfileFieldChange(index, 'image', e.target.result);
                      };
                      reader.readAsDataURL(file);
                    }}
                    onRemoveBackground={() => {}}
                    isProcessing={isProcessing}
                    compact={true}
                  />

                  <EditableInput
                    placeholder="Name"
                    value={profile.name || ''}
                    onChange={(val) => handleProfileFieldChange(index, 'name', val)}
                    sectionKey={`${selectedSection}-${index}`}
                    className="text-sm"
                  />

                  <EditableInput
                    placeholder="Title"
                    value={profile.title || ''}
                    onChange={(val) => handleProfileFieldChange(index, 'title', val)}
                    sectionKey={`${selectedSection}-${index}`}
                    className="text-sm"
                  />
                </div>
              );
            })}
          </div>
        </FieldGroup>
      </div>
    );
  };

  const renderRecipeEditor = () => (
    <div className="space-y-6">
      {renderContainerSettings()}
      
      <FieldGroup label="Recipe Title">
        <EditableInput
          value={section.title || ''}
          onChange={(val) => handleFieldChange('title', val)}
          sectionKey={selectedSection}
          placeholder="Recipe name"
        />
      </FieldGroup>

      <FieldGroup label="Recipe Image">
        <ImageUploader
          currentImage={section.image}
          onImageUpload={(file) => handleImageUpload(file, 'image')}
          onRemoveBackground={() => handleRemoveBackground('image')}
          isProcessing={isProcessing}
        />
      </FieldGroup>

      <FieldGroup label="Ingredients">
        <EditableTextarea
          value={section.ingredients || ''}
          onChange={(val) => handleFieldChange('ingredients', val)}
          sectionKey={selectedSection}
          rows={4}
          placeholder="List ingredients..."
          className="resize-none"
        />
      </FieldGroup>

      <FieldGroup label="Instructions">
        <EditableTextarea
          value={section.instructions || ''}
          onChange={(val) => handleFieldChange('instructions', val)}
          sectionKey={selectedSection}
          rows={4}
          placeholder="Step by step..."
          className="resize-none"
        />
      </FieldGroup>
    </div>
  );

  const renderImageGridEditor = () => (
    <div className="space-y-6">
      {renderContainerSettings()}

      <FieldGroup label="Grid Layout">
        <div className="grid grid-cols-2 gap-1.5">
          {[
            { id: 'two-equal',   label: '2 Equal',     visual: '⬜⬜' },
            { id: 'two-wide',    label: '2 Wide (5/7)', visual: '◻️⬜' },
            { id: 'three-equal', label: '3 Equal',      visual: '⬜⬜⬜' },
            { id: 'two-by-two',  label: '2×2 Grid',     visual: '⊞' },
          ].map(({ id, label }) => (
            <button
              key={id}
              onClick={() => handleFieldChange('gridPreset', id)}
              className={cn(
                "px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                (block?.gridPreset || 'two-equal') === id
                  ? "bg-zinc-900 text-white border-zinc-900"
                  : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="Image Height">
        <NumberInput
          value={block?.imageHeight || 180}
          min={60}
          max={600}
          step={10}
          suffix="px"
          onChange={(val) => handleFieldChange('imageHeight', val)}
        />
      </FieldGroup>

      <FieldGroup label="Border Radius">
        <NumberInput
          value={block?.imageBorderRadius ?? 12}
          min={0}
          max={100}
          step={1}
          suffix="px"
          onChange={(val) => handleFieldChange('imageBorderRadius', val)}
        />
      </FieldGroup>

      <FieldGroup label="Gap">
        <NumberInput
          value={block?.imageGap ?? 8}
          min={0}
          max={32}
          step={1}
          suffix="px"
          onChange={(val) => handleFieldChange('imageGap', val)}
        />
      </FieldGroup>
    </div>
  );

  const renderMultiLayoutEditor = () => (
    <div className="space-y-6">
      {renderContainerSettings()}

      <FieldGroup label="Layout">
        <div className="grid grid-cols-3 gap-1.5">
          {Object.entries(LAYOUT_PRESETS).map(([id, preset]) => (
            <button
              key={id}
              onClick={() => handleFieldChange('layout', id)}
              className={cn(
                "relative rounded-lg overflow-hidden border transition-all",
                (block?.layout || 'two-col-wide') === id
                  ? "border-zinc-400"
                  : "border-zinc-200 hover:border-zinc-300"
              )}
              title={preset.label}
            >
              <img
                src={preset.thumbnail}
                alt={preset.label}
                className="w-full h-auto block"
                style={{ aspectRatio: '3/4', objectFit: 'cover', objectPosition: 'top' }}
              />
            </button>
          ))}
        </div>
      </FieldGroup>

      <FieldGroup label="Badge & Line">
        <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
          <input
            type="checkbox"
            checked={block?.showBadge !== false}
            onChange={(e) => handleFieldChange('showBadge', e.target.checked)}
            className="rounded"
          />
          Show badge & divider line
        </label>
      </FieldGroup>

      {block?.showBadge !== false && (
        <>
          <FieldGroup label="Badge Text">
            <EditableInput
              value={block?.badgeText || 'BUILDER'}
              onChange={(val) => handleFieldChange('badgeText', val)}
              sectionKey={selectedSection}
              placeholder="Badge label"
            />
          </FieldGroup>
        </>
      )}

      <FieldGroup label="Font Sizes">
        <div className="space-y-2">
          {block?.showBadge !== false && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-10 flex-shrink-0">Badge</span>
              <NumberInput
                value={block?.badgeFontSize || 19}
                min={8}
                max={32}
                step={1}
                suffix="px"
                onChange={(val) => handleFieldChange('badgeFontSize', val)}
              />
            </div>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-10 flex-shrink-0">Title</span>
            <NumberInput
              value={block?.titleFontSize || 17}
              min={8}
              max={48}
              step={1}
              suffix="px"
              onChange={(val) => handleFieldChange('titleFontSize', val)}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-10 flex-shrink-0">Body</span>
            <NumberInput
              value={block?.bodyFontSize || 15}
              min={8}
              max={32}
              step={1}
              suffix="px"
              onChange={(val) => handleFieldChange('bodyFontSize', val)}
            />
          </div>
        </div>
      </FieldGroup>

      {(block?.layout || 'two-col-wide') === 'track-list' ? (
        <>
          <FieldGroup label="Tracks">
            {(block?.tracks || [
              { title: 'TITLE PROJECT 01', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
              { title: 'TITLE PROJECT 02', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
              { title: 'TITLE PROJECT 03', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
              { title: 'TITLE PROJECT 04', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
            ]).map((track, ti) => (
              <div key={ti} style={{ marginBottom: 12, padding: 8, background: 'rgba(0,0,0,0.03)', borderRadius: 8 }}>
                <EditableInput
                  value={track.title}
                  onChange={(val) => {
                    const tracks = [...(block?.tracks || [
                      { title: 'TITLE PROJECT 01', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                      { title: 'TITLE PROJECT 02', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                      { title: 'TITLE PROJECT 03', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                      { title: 'TITLE PROJECT 04', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                    ])];
                    tracks[ti] = { ...tracks[ti], title: val };
                    handleFieldChange('tracks', tracks);
                  }}
                  sectionKey={selectedSection}
                  placeholder="Track title"
                />
                <EditableTextarea
                  value={track.subjects.join('\n')}
                  onChange={(val) => {
                    const tracks = [...(block?.tracks || [
                      { title: 'TITLE PROJECT 01', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                      { title: 'TITLE PROJECT 02', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                      { title: 'TITLE PROJECT 03', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                      { title: 'TITLE PROJECT 04', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                    ])];
                    tracks[ti] = { ...tracks[ti], subjects: val.split('\n').filter(Boolean) };
                    handleFieldChange('tracks', tracks);
                  }}
                  sectionKey={selectedSection}
                  rows={4}
                  placeholder="One subject per line"
                  className="resize-none"
                  style={{ marginTop: 4, fontSize: 12 }}
                />
              </div>
            ))}
            <button
              type="button"
              onClick={() => {
                const tracks = [...(block?.tracks || [
                  { title: 'TITLE PROJECT 01', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                  { title: 'TITLE PROJECT 02', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                  { title: 'TITLE PROJECT 03', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                  { title: 'TITLE PROJECT 04', subjects: ['Subject 01','Subject 02','Subject 03','Subject 04','Subject 05','Subject 06','Subject 07','Subject 08'] },
                ])];
                tracks.push({ title: `TITLE PROJECT ${String(tracks.length + 1).padStart(2, '0')}`, subjects: ['Subject 01'] });
                handleFieldChange('tracks', tracks);
              }}
              className="w-full py-1.5 text-xs text-zinc-500 hover:text-zinc-700 border border-dashed border-zinc-300 rounded-md"
            >
              + Add Track
            </button>
          </FieldGroup>
        </>
      ) : (
        <>
          <FieldGroup label="Title">
            <EditableInput
              value={block?.title || ''}
              onChange={(val) => handleFieldChange('title', val)}
              sectionKey={selectedSection}
              placeholder="Section title"
            />
            <p className="text-[10px] text-zinc-400 mt-1">Link: <code className="bg-zinc-100 px-1 rounded text-[9px]">[text](url)</code> · Line break: <code className="bg-zinc-100 px-1 rounded text-[9px]">&lt;br&gt;</code></p>
          </FieldGroup>

          <FieldGroup label="Body Text">
            <EditableTextarea
              value={block?.body || ''}
              onChange={(val) => handleFieldChange('body', val)}
              sectionKey={selectedSection}
              rows={4}
              placeholder="Description..."
              className="resize-none"
            />
            <p className="text-[10px] text-zinc-400 mt-1">Link: <code className="bg-zinc-100 px-1 rounded text-[9px]">[text](url)</code> · Line break: <code className="bg-zinc-100 px-1 rounded text-[9px]">&lt;br&gt;</code></p>
          </FieldGroup>

          <FieldGroup label="Image Height">
            <NumberInput
              value={block?.imageHeight || 180}
              min={80}
              max={400}
              onChange={(val) => handleFieldChange('imageHeight', val)}
            />
          </FieldGroup>

          <FieldGroup label="Image Border Radius">
            <NumberInput
              value={block?.imageBorderRadius || 12}
              min={0}
              max={32}
              onChange={(val) => handleFieldChange('imageBorderRadius', val)}
            />
          </FieldGroup>

          <FieldGroup label="Image to Content Gap">
            <NumberInput
              value={block?.imageGap ?? 8}
              min={0}
              max={60}
              step={4}
              suffix="px"
              onChange={(val) => handleFieldChange('imageGap', val)}
            />
          </FieldGroup>
        </>
      )}

      <FieldGroup label="Images">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, index) => {
            const img = block?.images?.[index];
            return (
              <div
                key={index}
                className="relative rounded-lg overflow-hidden border border-zinc-200 cursor-pointer hover:border-[#04D1FC] transition-colors"
                style={{ height: 48 }}
                onClick={() => onSetCollageImage?.(selectedSection, selectedBlock, index)}
              >
                {img ? (
                  <img src={img} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                    <Image size={14} style={{ opacity: 0.3 }} />
                  </div>
                )}
                <span className="absolute top-0.5 left-0.5 w-4 h-4 rounded bg-black/60 text-white text-[8px] font-bold flex items-center justify-center">
                  {index + 1}
                </span>
              </div>
            );
          })}
        </div>
      </FieldGroup>
    </div>
  );

  const renderFooterEditor = () => {
    const socialLinks = section.socialLinks || {};
    const footerLinks = section.footerLinks || [];

    const handleSocialLinkChange = (platform, url) => {
      handleFieldChange('socialLinks', { ...socialLinks, [platform]: url });
    };

    const handleFooterLinkChange = (index, field, value) => {
      const newLinks = [...footerLinks];
      newLinks[index] = { ...newLinks[index], [field]: value };
      handleFieldChange('footerLinks', newLinks);
    };

    const addFooterLink = () => {
      handleFieldChange('footerLinks', [...footerLinks, { text: 'New Link', url: '#' }]);
    };

    const removeFooterLink = (index) => {
      handleFieldChange('footerLinks', footerLinks.filter((_, i) => i !== index));
    };

    return (
      <div className="space-y-6">
        {renderContainerSettings()}
        
        {/* Logo */}
        <FieldGroup label="Logo">
          <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={section.showLogo !== false}
              onChange={(e) => handleFieldChange('showLogo', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Show logo
          </label>
          {section.showLogo !== false && (
            <>
              <ImageUploader
                currentImage={section.logo}
                onImageUpload={(file) => handleImageUpload(file, 'logo')}
                className="h-24"
              />
              {section.logo && (
                <>
                  <button
                    onClick={() => handleFieldChange('logo', null)}
                    className="w-full mt-1 h-7 text-[10px] text-red-400 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-100 rounded-md transition-colors"
                  >
                    Remove logo
                  </button>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-400">Width</span>
                      <NumberInput
                        value={section.logoWidth || 120}
                        onChange={(val) => handleFieldChange('logoWidth', val)}
                        suffix="px"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] text-zinc-400">Height</span>
                      <NumberInput
                        value={section.logoHeight || 40}
                        onChange={(val) => handleFieldChange('logoHeight', val)}
                        suffix="px"
                      />
                    </div>
                  </div>
                </>
              )}
            </>
          )}
        </FieldGroup>

        {/* Tagline */}
        <FieldGroup label="Tagline">
          <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={section.showTagline !== false}
              onChange={(e) => handleFieldChange('showTagline', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Show tagline
          </label>
          {section.showTagline !== false && (
            <>
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-400">Text</span>
                <LocalInput
                  value={section.tagline || ''}
                  onSave={(val) => handleFieldChange('tagline', val)}
                  placeholder="e.g. Your weekly dose of inspiration"
                  className="w-full h-8 px-2 text-xs rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#04D1FC] focus:border-transparent"
                />
              </div>
              <div className="space-y-1">
                <span className="text-[9px] text-zinc-400">Link URL (optional)</span>
                <LocalInput
                  value={section.taglineUrl || ''}
                  onSave={(val) => handleFieldChange('taglineUrl', val)}
                  placeholder="https://..."
                  className="w-full h-8 px-2 text-xs rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#04D1FC] focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Font Size</span>
                  <NumberInput
                    value={section.taglineFontSize || 13}
                    onChange={(val) => handleFieldChange('taglineFontSize', val)}
                    suffix="px"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Color</span>
                  <input
                    type="color"
                    value={section.taglineColor || '#6B7280'}
                    onChange={(e) => handleFieldChange('taglineColor', e.target.value)}
                    className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
                  />
                </div>
              </div>
            </>
          )}
        </FieldGroup>

        {/* Social Links */}
        <FieldGroup label="Social Links">
          <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer mb-3">
            <input
              type="checkbox"
              checked={section.showSocial !== false}
              onChange={(e) => handleFieldChange('showSocial', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Show social icons
          </label>
          {section.showSocial !== false && (
            <div className="space-y-2">
              {['facebook', 'x', 'linkedin', 'instagram', 'youtube', 'tiktok', 'rss'].map(platform => {
                const hasUrl = !!(socialLinks[platform]);
                return (
                  <div key={platform} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={hasUrl}
                      onChange={(e) => handleSocialLinkChange(platform, e.target.checked ? '#' : '')}
                      className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC] flex-shrink-0"
                    />
                    <span className="text-[10px] text-zinc-500 w-14 capitalize">{platform}</span>
                    {hasUrl && (
                      <LocalInput
                        value={socialLinks[platform]}
                        onSave={(val) => handleSocialLinkChange(platform, val)}
                        placeholder="URL"
                        className="flex-1 h-7 px-2 text-xs rounded border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#04D1FC]"
                      />
                    )}
                  </div>
                );
              })}
              <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-zinc-100">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Icon Size</span>
                  <NumberInput
                    value={section.socialIconSize || 24}
                    onChange={(val) => handleFieldChange('socialIconSize', val)}
                    suffix="px"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Icon Color</span>
                  <input
                    type="color"
                    value={section.socialIconColor || '#4B5563'}
                    onChange={(e) => handleFieldChange('socialIconColor', e.target.value)}
                    className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          )}
        </FieldGroup>

        {/* Company Info */}
        <FieldGroup label="Company Info">
          <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={section.showCompanyInfo !== false}
              onChange={(e) => handleFieldChange('showCompanyInfo', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Show company info
          </label>
          {section.showCompanyInfo !== false && (
            <>
              <EditableTextarea
                value={section.companyInfo || ''}
                onChange={(val) => handleFieldChange('companyInfo', val)}
                sectionKey={selectedSection}
                rows={2}
                placeholder="Address, company name..."
                className="resize-none text-xs"
              />
              <div className="grid grid-cols-2 gap-2 mt-2">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Font Size</span>
                  <NumberInput
                    value={section.companyInfoFontSize || 14}
                    onChange={(val) => handleFieldChange('companyInfoFontSize', val)}
                    suffix="px"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Text Color</span>
                  <input
                    type="color"
                    value={section.companyInfoColor || '#374151'}
                    onChange={(e) => handleFieldChange('companyInfoColor', e.target.value)}
                    className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
                  />
                </div>
              </div>
            </>
          )}
        </FieldGroup>

        {/* Footer Links */}
        <FieldGroup label="Footer Links">
          <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer mb-2">
            <input
              type="checkbox"
              checked={section.showFooterLinks !== false}
              onChange={(e) => handleFieldChange('showFooterLinks', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Show footer links
          </label>
          {section.showFooterLinks !== false && (
            <div className="space-y-2">
              {footerLinks.map((link, index) => (
                <div key={index} className="space-y-1 p-2 bg-zinc-50 rounded-md border border-zinc-100">
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-zinc-400 font-medium">Link {index + 1}</span>
                    <button
                      onClick={() => removeFooterLink(index)}
                      className="w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <LocalInput
                    value={link.text || ''}
                    onSave={(val) => handleFooterLinkChange(index, 'text', val)}
                    placeholder="Label text"
                    className="w-full h-7 px-2 text-xs rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#04D1FC]"
                  />
                  <LocalInput
                    value={link.url || ''}
                    onSave={(val) => handleFooterLinkChange(index, 'url', val)}
                    placeholder="https://..."
                    className="w-full h-7 px-2 text-xs rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#04D1FC]"
                  />
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={addFooterLink} className="w-full text-xs">
                + Add Link
              </Button>
              <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-zinc-100">
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Link Color</span>
                  <input
                    type="color"
                    value={section.linkColor || '#374151'}
                    onChange={(e) => handleFieldChange('linkColor', e.target.value)}
                    className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] text-zinc-400">Font Size</span>
                  <NumberInput
                    value={section.linkFontSize || 14}
                    onChange={(val) => handleFieldChange('linkFontSize', val)}
                    suffix="px"
                  />
                </div>
              </div>
            </div>
          )}
        </FieldGroup>

        {/* Divider */}
        <FieldGroup label="Divider">
          <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer">
            <input
              type="checkbox"
              checked={section.showDivider !== false}
              onChange={(e) => handleFieldChange('showDivider', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Show divider line
          </label>
          {section.showDivider !== false && (
            <div className="space-y-1 mt-2">
              <span className="text-[9px] text-zinc-400">Divider Color</span>
              <input
                type="color"
                value={section.dividerColor || '#E5E7EB'}
                onChange={(e) => handleFieldChange('dividerColor', e.target.value)}
                className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
              />
            </div>
          )}
        </FieldGroup>

        {/* Style */}
        <FieldGroup label="Style">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-400">Background</span>
              <input
                type="color"
                value={section.backgroundColor || '#FFFFFF'}
                onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
                className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-400">Text Align</span>
              <Select
                value={section.textAlign || 'center'}
                onChange={(e) => handleFieldChange('textAlign', e.target.value)}
                className="h-8 text-xs"
              >
                <option value="left">Left</option>
                <option value="center">Center</option>
                <option value="right">Right</option>
              </Select>
            </div>
          </div>
        </FieldGroup>

        {/* Spacing */}
        <FieldGroup label="Spacing">
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Tag to Content Gap</span>
            <NumberInput
              value={section.tagToContentGap ?? 60}
              onChange={(val) => handleFieldChange('tagToContentGap', val)}
              step={4}
              suffix="px"
            />
          </div>
        </FieldGroup>

        {/* Section Padding */}
        <FieldGroup label="Section Padding">
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-400">Top</span>
              <NumberInput
                value={section.paddingTop ?? section.padding ?? 40}
                onChange={(val) => handleFieldChange('paddingTop', val)}
                step={4}
                suffix="px"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-400">Bottom</span>
              <NumberInput
                value={section.paddingBottom ?? section.padding ?? 40}
                onChange={(val) => handleFieldChange('paddingBottom', val)}
                step={4}
                suffix="px"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-400">Left</span>
              <NumberInput
                value={section.paddingLeft ?? section.padding ?? 40}
                onChange={(val) => handleFieldChange('paddingLeft', val)}
                step={4}
                suffix="px"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[9px] text-zinc-400">Right</span>
              <NumberInput
                value={section.paddingRight ?? section.padding ?? 40}
                onChange={(val) => handleFieldChange('paddingRight', val)}
                step={4}
                suffix="px"
              />
            </div>
          </div>
        </FieldGroup>
      </div>
    );
  };

  const renderAnimatedTextEditor = () => {
    return (
      <div className="space-y-6">
        {renderContainerSettings()}

        <FieldGroup label="Text">
          <LocalInput
            value={section.text ?? 'TRANSFORM'}
            onSave={(val) => handleFieldChange('text', val)}
            placeholder="Animated headline"
            live
            className="w-full h-9 px-2 text-sm rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#04D1FC]"
          />
          <span className="text-[10px] text-zinc-400 mt-1">Single line of animated text — edits apply live.</span>
        </FieldGroup>

        <FieldGroup label="Animation">
          {(() => {
            const ANIMATED_TEXT_VARIANTS = [
              { id: 'variable-scale', label: 'Variable Scale', hint: 'Size pulses per character',   thumbnail: '/media-kit/animtext-variable-scale.svg' },
              { id: 'kinetic-stack',  label: 'Kinetic Stack',  hint: 'Rotation + weight wave',      thumbnail: '/media-kit/animtext-kinetic-stack.svg'  },
              { id: 'mirror-fold',    label: 'Mirror Fold',    hint: 'Symmetric reflection',        thumbnail: '/media-kit/animtext-mirror-fold.svg'    },
              { id: 'glitch-rgb',     label: 'Glitch RGB',     hint: 'Channel split + slice',       thumbnail: '/media-kit/animtext-glitch-rgb.svg'     },
              { id: 'neon-pulse',     label: 'Neon Pulse',     hint: 'Glowing pulse',               thumbnail: '/media-kit/animtext-neon-pulse.svg'     },
              { id: 'wave-flow',      label: 'Wave Flow',      hint: 'Smooth vertical wave',        thumbnail: '/media-kit/animtext-wave-flow.svg'      },
              { id: 'typewriter',     label: 'Typewriter',     hint: 'Character reveal',            thumbnail: '/media-kit/animtext-typewriter.svg'     },
              { id: 'shadow-stack',   label: 'Shadow Stack',   hint: '3D layered shadows',          thumbnail: '/media-kit/animtext-shadow-stack.svg'   },
            ];
            const activeVariant = section.variant || 'variable-scale';
            return (
              <div className="grid grid-cols-2 gap-1.5">
                {ANIMATED_TEXT_VARIANTS.map((opt) => {
                  const active = activeVariant === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => handleFieldChange('variant', opt.id)}
                      title={`${opt.label} — ${opt.hint}`}
                      className={cn(
                        "relative rounded-lg overflow-hidden border transition-all cursor-pointer select-none",
                        active
                          ? "border-[#04D1FC] ring-2 ring-[#04D1FC]/40 shadow-sm"
                          : "border-zinc-200 hover:border-zinc-300"
                      )}
                    >
                      <img
                        src={opt.thumbnail}
                        alt={opt.label}
                        className="w-full h-auto block"
                        style={{ aspectRatio: '16/7', objectFit: 'cover' }}
                      />
                      <div className={cn(
                        "px-2 py-1 text-left",
                        active ? "bg-[#04D1FC]/10" : "bg-white"
                      )}>
                        <div className={cn(
                          "text-[11px] font-semibold leading-tight",
                          active ? "text-zinc-900" : "text-zinc-700"
                        )}>
                          {opt.label}
                        </div>
                        <div className="text-[9px] text-zinc-500 mt-0.5 leading-snug truncate">
                          {opt.hint}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            );
          })()}
          <span className="text-[10px] text-zinc-400 mt-2 block">All variants render to GIF on Copy to Gmail.</span>
        </FieldGroup>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Wave Speed">
            <Select
              value={section.waveSpeed ?? 3}
              onChange={(e) => handleFieldChange('waveSpeed', parseFloat(e.target.value))}
            >
              {['1.5', '2', '3', '4', '6', '8'].map((n) => (
                <option key={n} value={n}>{n}s</option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Intensity">
            <Select
              value={section.waveIntensity || 'medium'}
              onChange={(e) => handleFieldChange('waveIntensity', e.target.value)}
            >
              <option value="subtle">Subtle</option>
              <option value="medium">Medium</option>
              <option value="dramatic">Dramatic</option>
            </Select>
          </FieldGroup>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Background">
            <input
              type="color"
              value={section.backgroundColor || '#0A0A0A'}
              onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-200 cursor-pointer"
            />
          </FieldGroup>
          <FieldGroup label="Text Color">
            <input
              type="color"
              value={section.textColor || '#FF2D2D'}
              onChange={(e) => handleFieldChange('textColor', e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-200 cursor-pointer"
            />
          </FieldGroup>
        </div>

        {['mirror-fold', 'neon-pulse', 'shadow-stack'].includes(section.variant || 'variable-scale') && (
          <FieldGroup label="Accent Color">
            <input
              type="color"
              value={section.textColor2 || '#FFFFFF'}
              onChange={(e) => handleFieldChange('textColor2', e.target.value)}
              className="w-full h-10 rounded-lg border border-zinc-200 cursor-pointer"
            />
            <span className="text-[10px] text-zinc-400 mt-1">Secondary color used by this variant.</span>
          </FieldGroup>
        )}

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Font Family">
            <Select
              value={section.fontFamily || 'Impact'}
              onChange={(e) => handleFieldChange('fontFamily', e.target.value)}
            >
              {['Impact', 'Anton', 'Bebas Neue', 'Oswald', 'Black Ops One', 'Dela Gothic One', 'Archivo Black', 'Passion One', 'Righteous', 'Secular One', 'Poppins', 'Inter'].map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Font Size">
            <NumberInput
              value={section.fontSize || 96}
              onChange={(val) => handleFieldChange('fontSize', val)}
              suffix="px"
            />
          </FieldGroup>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Font Weight">
            <Select
              value={section.fontWeight || '900'}
              onChange={(e) => handleFieldChange('fontWeight', e.target.value)}
            >
              {['400', '500', '600', '700', '800', '900'].map((w) => (
                <option key={w} value={w}>{w}</option>
              ))}
            </Select>
          </FieldGroup>
          <FieldGroup label="Letter Spacing">
            <Select
              value={section.letterSpacing || '-0.02em'}
              onChange={(e) => handleFieldChange('letterSpacing', e.target.value)}
            >
              {['-0.05em', '-0.03em', '-0.02em', '0em', '0.02em', '0.05em', '0.1em'].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
          </FieldGroup>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Text Transform">
            <Select
              value={section.textTransform || 'uppercase'}
              onChange={(e) => handleFieldChange('textTransform', e.target.value)}
            >
              <option value="none">None</option>
              <option value="uppercase">UPPERCASE</option>
              <option value="lowercase">lowercase</option>
              <option value="capitalize">Capitalize</option>
            </Select>
          </FieldGroup>
          <FieldGroup label="Text Align">
            <Select
              value={section.textAlign || 'center'}
              onChange={(e) => handleFieldChange('textAlign', e.target.value)}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
              <option value="right">Right</option>
            </Select>
          </FieldGroup>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Padding Y">
            <NumberInput
              value={section.paddingY ?? 48}
              onChange={(val) => handleFieldChange('paddingY', val)}
              suffix="px"
            />
          </FieldGroup>
          <FieldGroup label="Padding X">
            <NumberInput
              value={section.paddingX ?? 24}
              onChange={(val) => handleFieldChange('paddingX', val)}
              suffix="px"
            />
          </FieldGroup>
        </div>

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
            <input
              type="checkbox"
              checked={section.pauseOnHover !== false}
              onChange={(e) => handleFieldChange('pauseOnHover', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Pause on hover
          </label>
        </div>

        <FieldGroup label="GIF Export">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleExportAnimatedTextGif()}
            disabled={isExportingGif}
            className="w-full"
          >
            {isExportingGif ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Exporting... {gifProgress}%
              </>
            ) : (
              <>
                <FileImage className="w-4 h-4" />
                Export as GIF
              </>
            )}
          </Button>
          <p className="text-[9px] text-zinc-400 mt-1">
            Download this animation as a GIF — also auto-embedded on Copy to Gmail.
          </p>
        </FieldGroup>
      </div>
    );
  };

  const renderMarqueeEditor = () => {
    // Normalize items: backward compat for legacy comma-separated strings
    const getItemsArray = () => {
      const raw = section.items;
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        return raw.split(',').map(s => s.trim()).filter(Boolean).map(v => ({ type: 'text', value: v }));
      }
      return [];
    };

    const itemsArray = getItemsArray();

    const updateItems = (newItems) => handleFieldChange('items', newItems);

    const updateItemAt = (index, patch) => {
      const next = [...itemsArray];
      next[index] = { ...next[index], ...patch };
      updateItems(next);
    };

    const removeItemAt = (index) => {
      updateItems(itemsArray.filter((_, i) => i !== index));
    };

    const moveItem = (index, dir) => {
      const target = index + dir;
      if (target < 0 || target >= itemsArray.length) return;
      const next = [...itemsArray];
      [next[index], next[target]] = [next[target], next[index]];
      updateItems(next);
    };

    const addTextLayer = () => {
      updateItems([...itemsArray, { type: 'text', value: 'New item' }]);
    };

    const addImageLayer = () => {
      updateItems([...itemsArray, { type: 'image', src: '' }]);
    };

    const handleImageUpload = async (index, file) => {
      if (!file) return;
      try {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'newsletters/marquee');
        const res = await fetch('/api/images/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload failed');
        const data = await res.json();
        updateItemAt(index, { src: data.url });
      } catch (err) {
        console.error('Marquee image upload failed:', err);
      }
    };

    const preset = section.preset || 'classic';
    const isKinetic = preset !== 'classic';

    const PRESET_OPTIONS = [
      { id: 'classic',            label: 'Classic Ticker', hint: 'Single-row scrolling items',     thumbnail: '/media-kit/marquee-classic.svg'    },
      { id: 'marquee-horizontal', label: 'Horizontal',     hint: 'Multi-row infinite scroll',      thumbnail: '/media-kit/marquee-horizontal.svg' },
      { id: 'marquee-diagonal',   label: 'Diagonal',       hint: 'Rotated scrolling strips',       thumbnail: '/media-kit/marquee-diagonal.svg'   },
      { id: 'dual-word',          label: 'Dual Word',      hint: 'Alternating word transitions',   thumbnail: '/media-kit/marquee-dual-word.svg'  },
      { id: 'tag-marquee',        label: 'Tag Marquee',    hint: 'Scrolling colored pill tags',    thumbnail: '/media-kit/marquee-tag.svg'        },
    ];

    const switchPreset = (presetId) => {
      // eslint-disable-next-line no-console
      console.log('[marquee-preset] switchPreset ->', {
        presetId,
        selectedSection,
        selectedBlock,
        blockType: block?.type,
        currentPreset: section?.preset,
      });
      if (selectedBlock && block) {
        onBlockUpdate?.(selectedSection, selectedBlock, { preset: presetId });
      } else if (selectedSection) {
        onSectionUpdate?.(selectedSection, { preset: presetId });
      }
    };

    const activeLabel = PRESET_OPTIONS.find(o => o.id === preset)?.label || 'Classic Ticker';
    // Use the LAST segment of the id (after the last `-`) so each block shows a
    // distinct short tag. Slice(0,8) would print "block-17" for every entry.
    const shortenId = (id) => {
      if (!id) return 'none';
      const s = String(id);
      const parts = s.split('-');
      return parts[parts.length - 1] || s.slice(-5);
    };
    const shortBlockId = shortenId(selectedBlock);

    // Collect every marquee block across the whole newsletter so the user can
    // confirm which one they're editing – catches the "edited block != visible
    // block" foot-gun when a newsletter has more than one marquee.
    const allMarqueeBlocks = [];
    (newsletter?.sections || []).forEach((sec) => {
      const pushBlock = (b) => {
        if (b?.type === 'marquee') {
          allMarqueeBlocks.push({
            sectionId: sec.id,
            sectionName: sec.name || sec.type || 'Section',
            blockId: b.id,
            preset: b.preset || 'classic',
          });
        }
      };
      // Grid sections keep both a legacy flat `blocks` mirror and canonical
      // nested `rows`; listing both creates false duplicate-id warnings.
      if (isGridSection(sec)) {
        (sec.rows || []).forEach((r) => (r.columns || []).forEach((c) => (c.blocks || []).forEach(pushBlock)));
      } else {
        (sec.blocks || []).forEach(pushBlock);
      }
    });

    return (
    <div className="space-y-6">
      {renderContainerSettings()}

      <FieldGroup label="Marquee Preset">
        <div className="mb-2 px-2.5 py-1.5 rounded-md bg-zinc-900 text-white text-[11px] font-medium space-y-0.5">
          <div className="flex items-center justify-between">
            <span className="opacity-70">Current preset</span>
            <span className="font-semibold">{activeLabel}</span>
          </div>
          <div className="flex items-center justify-between opacity-60">
            <span>Block</span>
            <div className="flex items-center gap-1.5">
              <span className="font-mono">{shortBlockId}</span>
              <button
                type="button"
                onClick={() => {
                  if (!selectedBlock) return;
                  const el = document.querySelector(`[data-block-id="${selectedBlock}"]`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    el.style.transition = 'box-shadow 0.3s';
                    el.style.boxShadow = '0 0 0 4px rgba(4,209,252,0.7)';
                    setTimeout(() => { el.style.boxShadow = ''; }, 1500);
                  }
                }}
                className="text-[9px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 transition-colors"
              >
                show
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_OPTIONS.map((opt) => {
            const active = preset === opt.id;
            return (
              <button
                key={opt.id}
                type="button"
                onClick={() => switchPreset(opt.id)}
                title={`${opt.label} — ${opt.hint}`}
                className={cn(
                  "relative rounded-lg overflow-hidden border transition-all cursor-pointer select-none group",
                  active
                    ? "border-[#04D1FC] ring-2 ring-[#04D1FC]/40 shadow-sm"
                    : "border-zinc-200 hover:border-zinc-300"
                )}
              >
                <img
                  src={opt.thumbnail}
                  alt={opt.label}
                  className="w-full h-auto block"
                  style={{ aspectRatio: '16/7', objectFit: 'cover' }}
                />
                <div className={cn(
                  "px-2 py-1 text-left",
                  active ? "bg-[#04D1FC]/10" : "bg-white"
                )}>
                  <div className={cn(
                    "text-[11px] font-semibold leading-tight",
                    active ? "text-zinc-900" : "text-zinc-700"
                  )}>
                    {opt.label}
                  </div>
                  <div className="text-[9px] text-zinc-500 mt-0.5 leading-snug truncate">
                    {opt.hint}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
        <span className="text-[10px] text-zinc-400 mt-2 block">
          Tap a preset to switch the marquee style. The editable controls below change for each preset.
        </span>
        <span className="text-[10px] text-zinc-400 mt-1 block">
          Looking for <strong>Variable Scale</strong> or <strong>Kinetic Stack</strong>? Drag the <strong>Animated Text</strong> block from the top toolbar.
        </span>

        {allMarqueeBlocks.length > 1 && (() => {
          // Detect duplicate block ids (data corruption – these fight each
          // other during state updates and trigger React key warnings).
          const idCounts = allMarqueeBlocks.reduce((acc, m) => {
            acc[m.blockId] = (acc[m.blockId] || 0) + 1;
            return acc;
          }, {});
          const hasDupes = Object.values(idCounts).some((n) => n > 1);

          return (
            <div className="mt-3 p-2 rounded-md bg-amber-50 border border-amber-200">
              <div className="text-[10px] font-semibold text-amber-800 mb-1.5">
                ⚠ This newsletter has {allMarqueeBlocks.length} marquee blocks. Make sure you're editing the right one:
              </div>
              {hasDupes && (
                <div className="text-[10px] text-red-700 bg-red-50 border border-red-200 rounded px-2 py-1 mb-2">
                  Duplicate block IDs detected — reload the page to auto-heal, or use the delete buttons below to remove extras.
                </div>
              )}
              <div className="space-y-1">
                {allMarqueeBlocks.map((m, idx) => {
                  const isCurrent = m.blockId === selectedBlock;
                  const isDupe = idCounts[m.blockId] > 1;
                  return (
                    <div
                      key={`${m.sectionId}::${m.blockId}::${idx}`}
                      className={cn(
                        "w-full px-2 py-1.5 rounded text-[10px] flex items-center justify-between gap-2 transition-colors",
                        isCurrent
                          ? "bg-amber-200/80 text-amber-900 font-semibold"
                          : isDupe
                            ? "bg-red-50 text-red-800"
                            : "bg-white text-zinc-700"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => onBlockClick?.(m.sectionId, m.blockId)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left hover:opacity-80"
                      >
                        <span className="font-mono truncate">{shortenId(m.blockId)}</span>
                        <span className="text-zinc-500 truncate flex-1">{m.sectionName}</span>
                        <span className={cn(
                          "px-1.5 py-0.5 rounded text-[9px] font-semibold flex-shrink-0",
                          isCurrent ? "bg-amber-900/20 text-amber-900" : "bg-zinc-100 text-zinc-600"
                        )}>
                          {PRESET_OPTIONS.find(o => o.id === m.preset)?.label || m.preset}
                        </span>
                      </button>
                      {isCurrent && <span className="text-amber-700 flex-shrink-0">← editing</span>}
                      {!isCurrent && onDeleteBlock && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Delete this marquee block from "${m.sectionName}"?`)) {
                              onDeleteBlock(m.sectionId, m.blockId);
                            }
                          }}
                          title="Delete this marquee block"
                          className="flex-shrink-0 p-0.5 rounded hover:bg-red-100 text-red-600"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()}
      </FieldGroup>

      <div className="h-px bg-zinc-200" />

      <div key={`marquee-${selectedBlock || selectedSection}-${preset}`}>
        {isKinetic
          ? renderKineticMarqueeFields(section)
          : renderClassicMarqueeFields(section, itemsArray, { updateItemAt, removeItemAt, moveItem, addTextLayer, addImageLayer, handleImageUpload })}
      </div>
    </div>
    );
  };

  const renderClassicMarqueeFields = (section, itemsArray, handlers) => {
    const { updateItemAt, removeItemAt, moveItem, addTextLayer, addImageLayer, handleImageUpload } = handlers;
    return (
    <>
      <FieldGroup label="Marquee Layers">
        <div className="space-y-2">
          {itemsArray.map((item, i) => (
            <div
              key={i}
              className="group flex items-start gap-1.5 p-2 bg-zinc-50 rounded-lg border border-zinc-200 hover:border-zinc-300 transition-colors"
            >
              {/* Type badge */}
              <div className={cn(
                'flex-shrink-0 w-6 h-6 rounded flex items-center justify-center mt-0.5',
                item.type === 'image' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
              )}>
                {item.type === 'image' ? <FileImage className="w-3 h-3" /> : <Type className="w-3 h-3" />}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                {item.type === 'image' ? (
                  item.src ? (
                    <div className="flex items-center gap-2">
                      <img src={item.src} alt="" className="w-8 h-8 object-contain rounded border border-zinc-200 bg-white" />
                      <button
                        onClick={() => updateItemAt(i, { src: '' })}
                        className="text-[10px] text-zinc-400 hover:text-red-500"
                      >
                        Replace
                      </button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center gap-1.5 h-8 rounded border border-dashed border-zinc-300 hover:border-zinc-400 cursor-pointer transition-colors">
                      <FileImage className="w-3 h-3 text-zinc-400" />
                      <span className="text-[10px] text-zinc-500">Upload PNG</span>
                      <input
                        type="file"
                        accept="image/png,image/svg+xml,image/webp,image/gif"
                        className="hidden"
                        onChange={(e) => handleImageUpload(i, e.target.files?.[0])}
                      />
                    </label>
                  )
                ) : (
                  <LocalInput
                    value={item.value || ''}
                    onSave={(val) => updateItemAt(i, { value: val })}
                    placeholder="Enter text..."
                    live
                    className="w-full h-7 px-2 text-xs rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#04D1FC] focus:border-transparent"
                  />
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => moveItem(i, -1)}
                  disabled={i === 0}
                  className="p-0.5 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                >
                  <ChevronUp className="w-3 h-3" />
                </button>
                <button
                  onClick={() => moveItem(i, 1)}
                  disabled={i === itemsArray.length - 1}
                  className="p-0.5 text-zinc-400 hover:text-zinc-600 disabled:opacity-30"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>
                <button
                  onClick={() => removeItemAt(i)}
                  className="p-0.5 text-zinc-400 hover:text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}

          {/* Add layer buttons */}
          <div className="flex gap-2 pt-1">
            <button
              onClick={addTextLayer}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border-2 border-dashed border-zinc-300 hover:border-[#04D1FC] hover:text-[#04D1FC] text-zinc-500 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span className="text-[10px] font-medium">Text</span>
            </button>
            <button
              onClick={addImageLayer}
              className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-lg border-2 border-dashed border-zinc-300 hover:border-purple-400 hover:text-purple-500 text-zinc-500 transition-colors"
            >
              <Plus className="w-3 h-3" />
              <span className="text-[10px] font-medium">Image</span>
            </button>
          </div>
        </div>
      </FieldGroup>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Speed">
          <Select
            value={section.speed || 30}
            onChange={(e) => handleFieldChange('speed', parseInt(e.target.value))}
          >
            <option value={15}>Fast (15s)</option>
            <option value={20}>Medium-Fast (20s)</option>
            <option value={30}>Medium (30s)</option>
            <option value={40}>Slow (40s)</option>
            <option value={60}>Very Slow (60s)</option>
          </Select>
        </FieldGroup>

        <FieldGroup label="Direction">
          <Select
            value={section.direction || 'left'}
            onChange={(e) => handleFieldChange('direction', e.target.value)}
          >
            <option value="left">← Left</option>
            <option value="right">→ Right</option>
          </Select>
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Rows">
          <Select
            value={section.rows || 1}
            onChange={(e) => handleFieldChange('rows', parseInt(e.target.value))}
          >
            {[1, 2, 3, 4, 5, 6, 8, 10].map(n => (
              <option key={n} value={n}>{n} {n === 1 ? 'row' : 'rows'}</option>
            ))}
          </Select>
          <span className="text-[10px] text-zinc-400 mt-1">Stack multiple tickers vertically</span>
        </FieldGroup>

        <FieldGroup label="Row Gap">
          <Select
            value={section.rowGap ?? 0}
            onChange={(e) => handleFieldChange('rowGap', parseInt(e.target.value))}
          >
            {[0, 2, 4, 6, 8, 12, 16, 24].map(n => (
              <option key={n} value={n}>{n}px</option>
            ))}
          </Select>
          <span className="text-[10px] text-zinc-400 mt-1">Spacing between rows</span>
        </FieldGroup>
      </div>

      {(section.rows || 1) > 1 && (
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
            <input
              type="checkbox"
              checked={!!section.alternateDirections}
              onChange={(e) => handleFieldChange('alternateDirections', e.target.checked)}
              className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
            />
            Alternate row directions
          </label>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Background">
          <input
            type="color"
            value={section.backgroundColor || '#04D1FC'}
            onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
            className="w-full h-10 rounded-lg border border-zinc-200 cursor-pointer"
          />
        </FieldGroup>

        <FieldGroup label="Text Color">
          <input
            type="color"
            value={section.textColor || '#FFFFFF'}
            onChange={(e) => handleFieldChange('textColor', e.target.value)}
            className="w-full h-10 rounded-lg border border-zinc-200 cursor-pointer"
          />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Font Size">
          <NumberInput
            value={section.fontSize || 14}
            onChange={(val) => handleFieldChange('fontSize', val)}
            suffix="px"
          />
        </FieldGroup>

        <FieldGroup label="Padding">
          <NumberInput
            value={section.paddingVertical || 10}
            onChange={(val) => handleFieldChange('paddingVertical', val)}
            suffix="px"
          />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Separator">
          <Select
            value={section.separator || '•'}
            onChange={(e) => handleFieldChange('separator', e.target.value)}
          >
            <option value="•">• Bullet</option>
            <option value="|">| Pipe</option>
            <option value="·">· Dot</option>
            <option value="-">- Dash</option>
            <option value="★">★ Star</option>
            <option value="◆">◆ Diamond</option>
            <option value=" "> None</option>
          </Select>
        </FieldGroup>

        <FieldGroup label="Font Weight">
          <Select
            value={section.fontWeight || '500'}
            onChange={(e) => handleFieldChange('fontWeight', e.target.value)}
          >
            <option value="300">Light</option>
            <option value="400">Regular</option>
            <option value="500">Medium</option>
            <option value="600">Semibold</option>
            <option value="700">Bold</option>
          </Select>
        </FieldGroup>
      </div>

      <FieldGroup label="Image Size">
        <NumberInput
          value={section.imageSize || 24}
          onChange={(val) => handleFieldChange('imageSize', val)}
          suffix="px"
        />
        <span className="text-[10px] text-zinc-400 mt-1">Size of image layers in the marquee</span>
      </FieldGroup>

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
          <input
            type="checkbox"
            checked={section.pauseOnHover !== false}
            onChange={(e) => handleFieldChange('pauseOnHover', e.target.checked)}
            className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
          />
          Pause on hover
        </label>
      </div>

      <FieldGroup label="GIF Export">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportMarqueeGif()}
          disabled={isExportingGif}
          className="w-full"
        >
          {isExportingGif ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting... {gifProgress}%
            </>
          ) : (
            <>
              <FileImage className="w-4 h-4" />
              Export as GIF
            </>
          )}
        </Button>
        <p className="text-[9px] text-zinc-400 mt-1">
          For email clients without CSS animation support.
        </p>
      </FieldGroup>
    </>
    );
  };

  const renderKineticMarqueeFields = (section) => {
    const preset = section.preset;
    const isDiagonal = preset === 'marquee-diagonal';
    const isDualWord = preset === 'dual-word';
    const isTagMarquee = preset === 'tag-marquee';
    const isWave = preset === 'variable-scale' || preset === 'kinetic-stack';
    const needsText2 = isDualWord || isTagMarquee;
    const needsText3 = isTagMarquee;

    return (
    <>
      <FieldGroup label="Primary Text">
        <LocalInput
          value={section.text1 || 'TRANSFORM'}
          onSave={(val) => handleFieldChange('text1', val)}
          placeholder="Main word"
          live
          className="w-full h-8 px-2 text-xs rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#04D1FC]"
        />
      </FieldGroup>

      {needsText2 && (
        <FieldGroup label="Secondary Text">
          <LocalInput
            value={section.text2 || 'EVOLVE'}
            onSave={(val) => handleFieldChange('text2', val)}
            placeholder="Second word"
            live
            className="w-full h-8 px-2 text-xs rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#04D1FC]"
          />
        </FieldGroup>
      )}

      {needsText3 && (
        <FieldGroup label="Tertiary Text">
          <LocalInput
            value={section.text3 || 'CREATE'}
            onSave={(val) => handleFieldChange('text3', val)}
            placeholder="Third word"
            live
            className="w-full h-8 px-2 text-xs rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#04D1FC]"
          />
        </FieldGroup>
      )}

      {isTagMarquee && (
        <FieldGroup label="Tag Words">
          <textarea
            value={section.extraWords ?? 'design, motion, kinetic, type, visual, creative, bold, modern, code, art, digital, studio'}
            onChange={(e) => handleFieldChange('extraWords', e.target.value)}
            placeholder="Comma-separated words to fill the tags…"
            rows={3}
            className="w-full px-2 py-1.5 text-xs rounded border border-zinc-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#04D1FC] resize-y leading-relaxed"
          />
          <span className="text-[10px] text-zinc-400 mt-1">
            Comma-separated. These populate the pills alongside your Primary / Secondary / Tertiary text.
          </span>
        </FieldGroup>
      )}

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Height">
          <NumberInput
            value={section.height || 400}
            onChange={(val) => handleFieldChange('height', val)}
            suffix="px"
          />
        </FieldGroup>
        <FieldGroup label="Background">
          <input
            type="color"
            value={section.backgroundColor || '#0A0A0A'}
            onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
            className="w-full h-10 rounded-lg border border-zinc-200 cursor-pointer"
          />
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Rows">
          <Select
            value={section.rowCount || 8}
            onChange={(e) => handleFieldChange('rowCount', parseInt(e.target.value))}
          >
            {[4, 5, 6, 7, 8, 10, 12].map(n => <option key={n} value={n}>{n}</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Row Gap">
          <Select
            value={section.rowGap ?? 0}
            onChange={(e) => handleFieldChange('rowGap', parseInt(e.target.value))}
          >
            {[0, 2, 4, 8, 12, 16, 24].map(n => <option key={n} value={n}>{n}px</option>)}
          </Select>
        </FieldGroup>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Scroll Speed">
          <Select
            value={section.scrollSpeed || 12}
            onChange={(e) => handleFieldChange('scrollSpeed', parseFloat(e.target.value))}
          >
            {['6', '8', '10', '12', '16', '20', '30'].map(n => <option key={n} value={n}>{n}s</option>)}
          </Select>
        </FieldGroup>
        <FieldGroup label="Scroll Direction">
          <Select
            value={section.scrollDirection || 'left'}
            onChange={(e) => handleFieldChange('scrollDirection', e.target.value)}
          >
            <option value="left">← Left</option>
            <option value="right">→ Right</option>
            <option value="alternate">⇄ Alternate</option>
          </Select>
        </FieldGroup>
      </div>

      {isWave && (
        <div className="grid grid-cols-2 gap-3">
          <FieldGroup label="Wave Speed">
            <Select
              value={section.waveSpeed || 3}
              onChange={(e) => handleFieldChange('waveSpeed', parseFloat(e.target.value))}
            >
              {['1.5', '2', '3', '4', '6', '8'].map(n => <option key={n} value={n}>{n}s</option>)}
            </Select>
          </FieldGroup>
          <FieldGroup label="Wave Intensity">
            <Select
              value={section.waveIntensity || 'medium'}
              onChange={(e) => handleFieldChange('waveIntensity', e.target.value)}
            >
              <option value="subtle">Subtle</option>
              <option value="medium">Medium</option>
              <option value="dramatic">Dramatic</option>
            </Select>
          </FieldGroup>
        </div>
      )}

      {isDiagonal && (
        <FieldGroup label="Diagonal Angle">
          <Select
            value={section.diagonalAngle ?? -25}
            onChange={(e) => handleFieldChange('diagonalAngle', parseFloat(e.target.value))}
          >
            {['-45', '-35', '-25', '-15', '-10', '10', '15', '25', '35', '45'].map(n =>
              <option key={n} value={n}>{n}°</option>
            )}
          </Select>
        </FieldGroup>
      )}

      <FieldGroup label="Vertical Alignment">
        <Select
          value={section.verticalAlign || 'fill'}
          onChange={(e) => handleFieldChange('verticalAlign', e.target.value)}
        >
          <option value="fill">Fill</option>
          <option value="center">Center</option>
          <option value="top">Top</option>
          <option value="bottom">Bottom</option>
        </Select>
      </FieldGroup>

      <div className="grid grid-cols-2 gap-3">
        <FieldGroup label="Text Color 1">
          <input
            type="color"
            value={section.textColor1 || '#FF2D2D'}
            onChange={(e) => handleFieldChange('textColor1', e.target.value)}
            className="w-full h-10 rounded-lg border border-zinc-200 cursor-pointer"
          />
        </FieldGroup>
        <FieldGroup label="Text Color 2">
          <input
            type="color"
            value={section.textColor2 || '#FF2D2D'}
            onChange={(e) => handleFieldChange('textColor2', e.target.value)}
            className="w-full h-10 rounded-lg border border-zinc-200 cursor-pointer"
          />
        </FieldGroup>
      </div>

      {!isTagMarquee && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Font Family">
              <Select
                value={section.fontFamily || 'Impact'}
                onChange={(e) => handleFieldChange('fontFamily', e.target.value)}
              >
                {['Impact', 'Anton', 'Bebas Neue', 'Oswald', 'Black Ops One', 'Dela Gothic One', 'Archivo Black', 'Passion One', 'Righteous', 'Secular One'].map(f =>
                  <option key={f} value={f}>{f}</option>
                )}
              </Select>
            </FieldGroup>
            <FieldGroup label="Font Size">
              <NumberInput
                value={section.fontSize || 80}
                onChange={(val) => handleFieldChange('fontSize', val)}
                suffix="px"
              />
            </FieldGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Font Weight">
              <Select
                value={section.fontWeight || '900'}
                onChange={(e) => handleFieldChange('fontWeight', e.target.value)}
              >
                {['400', '500', '600', '700', '800', '900'].map(w =>
                  <option key={w} value={w}>{w}</option>
                )}
              </Select>
            </FieldGroup>
            <FieldGroup label="Letter Spacing">
              <Select
                value={section.letterSpacing || '-0.02em'}
                onChange={(e) => handleFieldChange('letterSpacing', e.target.value)}
              >
                {['-0.05em', '-0.03em', '-0.02em', '0em', '0.02em', '0.05em', '0.1em'].map(s =>
                  <option key={s} value={s}>{s}</option>
                )}
              </Select>
            </FieldGroup>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Text Transform">
              <Select
                value={section.textTransform || 'uppercase'}
                onChange={(e) => handleFieldChange('textTransform', e.target.value)}
              >
                <option value="none">None</option>
                <option value="uppercase">UPPERCASE</option>
                <option value="lowercase">lowercase</option>
                <option value="capitalize">Capitalize</option>
              </Select>
            </FieldGroup>
            <FieldGroup label="Line Height">
              <Select
                value={section.lineHeightRatio ?? 0.95}
                onChange={(e) => handleFieldChange('lineHeightRatio', parseFloat(e.target.value))}
              >
                {['0.8', '0.85', '0.9', '0.95', '1.0', '1.05', '1.1', '1.2'].map(lh =>
                  <option key={lh} value={lh}>{lh}</option>
                )}
              </Select>
            </FieldGroup>
          </div>
        </>
      )}

      {isTagMarquee && (
        <>
          <FieldGroup label="Tag Style">
            <Select
              value={section.tagStyle || 'mixed'}
              onChange={(e) => handleFieldChange('tagStyle', e.target.value)}
            >
              <option value="filled">Filled</option>
              <option value="outlined">Outlined</option>
              <option value="mixed">Mixed</option>
            </Select>
          </FieldGroup>

          <FieldGroup label="Tag Colors">
            <div className="grid grid-cols-5 gap-1.5">
              {[1, 2, 3, 4, 5].map(n => (
                <input
                  key={n}
                  type="color"
                  value={section[`tagColor${n}`] || ['#FF3366', '#7B61FF', '#00C2FF', '#FFB800', '#00E676'][n - 1]}
                  onChange={(e) => handleFieldChange(`tagColor${n}`, e.target.value)}
                  className="w-full h-10 rounded-lg border border-zinc-200 cursor-pointer"
                  title={`Tag Color ${n}`}
                />
              ))}
            </div>
          </FieldGroup>

          <div className="grid grid-cols-2 gap-3">
            <FieldGroup label="Tag Font">
              <Select
                value={section.tagFontFamily || 'DM Sans'}
                onChange={(e) => handleFieldChange('tagFontFamily', e.target.value)}
              >
                {['DM Sans', 'Inter', 'Poppins', 'Nunito', 'Quicksand', 'Outfit'].map(f =>
                  <option key={f} value={f}>{f}</option>
                )}
              </Select>
            </FieldGroup>
            <FieldGroup label="Tag Size">
              <NumberInput
                value={section.tagFontSize || 18}
                onChange={(val) => handleFieldChange('tagFontSize', val)}
                suffix="px"
              />
            </FieldGroup>
          </div>
        </>
      )}

      <div className="flex items-center gap-4">
        <label className="flex items-center gap-2 text-sm text-zinc-600 cursor-pointer">
          <input
            type="checkbox"
            checked={section.pauseOnHover !== false}
            onChange={(e) => handleFieldChange('pauseOnHover', e.target.checked)}
            className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
          />
          Pause on hover
        </label>
      </div>

      <FieldGroup label="GIF Export">
        <Button
          variant="outline"
          size="sm"
          onClick={() => handleExportMarqueeGif()}
          disabled={isExportingGif}
          className="w-full"
        >
          {isExportingGif ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Exporting... {gifProgress}%
            </>
          ) : (
            <>
              <FileImage className="w-4 h-4" />
              Export as GIF
            </>
          )}
        </Button>
        <p className="text-[9px] text-zinc-400 mt-1">
          Captures the live animation for email clients without CSS support.
        </p>
      </FieldGroup>
    </>
    );
  };

  const renderAccentTextEditor = () => (
    <div className="space-y-6">
      {renderContainerSettings()}
      
      <FieldGroup label="Tag/Badge">
        <input
          type="text"
          key={`tagText-${selectedSection}`}
          defaultValue={section.tagText || 'HIGHLIGHT'}
          onBlur={(e) => handleFieldChange('tagText', e.target.value)}
          placeholder="Tag text"
          className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#04D1FC]"
        />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Background</span>
            <input
              type="color"
              value={section.tagBackgroundColor || '#04D1FC'}
              onChange={(e) => handleFieldChange('tagBackgroundColor', e.target.value)}
              className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Text Color</span>
            <input
              type="color"
              value={section.tagTextColor || '#FFFFFF'}
              onChange={(e) => handleFieldChange('tagTextColor', e.target.value)}
              className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Position</span>
            <Select
              value={section.tagPosition || 'top-right'}
              onChange={(e) => handleFieldChange('tagPosition', e.target.value)}
              className="h-10"
            >
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Font Size</span>
            <NumberInput
              value={section.tagFontSize || 14}
              onChange={(val) => handleFieldChange('tagFontSize', val)}
              suffix="px"
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup label="Content">
        <EditableTextarea
          value={section.content || ''}
          onChange={(val) => handleFieldChange('content', val)}
          sectionKey={selectedSection}
          rows={5}
          placeholder="Enter content..."
          className="resize-none"
        />
        <p className="text-[10px] text-zinc-400 mt-1">Link: <code className="bg-zinc-100 px-1 rounded text-[9px]">[text](url)</code> · Line break: <code className="bg-zinc-100 px-1 rounded text-[9px]">&lt;br&gt;</code></p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Font Size</span>
            <NumberInput
              value={section.contentFontSize || 18}
              onChange={(val) => handleFieldChange('contentFontSize', val)}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Text Color</span>
            <input
              type="color"
              value={section.contentColor || '#333333'}
              onChange={(e) => handleFieldChange('contentColor', e.target.value)}
              className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup label="Layout">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Direction</span>
            <Select
              value={section.direction || 'ltr'}
              onChange={(e) => handleFieldChange('direction', e.target.value)}
              className="h-10"
            >
              <option value="rtl">RTL</option>
              <option value="ltr">LTR (English)</option>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Text Align</span>
            <Select
              value={section.contentAlign || 'right'}
              onChange={(e) => handleFieldChange('contentAlign', e.target.value)}
              className="h-10"
            >
              <option value="right">Right</option>
              <option value="center">Center</option>
              <option value="left">Left</option>
            </Select>
          </div>
        </div>
        <div className="space-y-1 mt-2">
          <span className="text-[10px] text-zinc-400">Background</span>
          <input
            type="color"
            value={section.backgroundColor || '#FFFFFF'}
            onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
            className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
          />
        </div>
      </FieldGroup>

      <FieldGroup label="Section Padding">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Top</span>
            <NumberInput
              value={section.paddingTop ?? section.padding ?? 40}
              onChange={(val) => handleFieldChange('paddingTop', val)}
              step={4}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Bottom</span>
            <NumberInput
              value={section.paddingBottom ?? section.padding ?? 40}
              onChange={(val) => handleFieldChange('paddingBottom', val)}
              step={4}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Left</span>
            <NumberInput
              value={section.paddingLeft ?? section.padding ?? 40}
              onChange={(val) => handleFieldChange('paddingLeft', val)}
              step={4}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Right</span>
            <NumberInput
              value={section.paddingRight ?? section.padding ?? 40}
              onChange={(val) => handleFieldChange('paddingRight', val)}
              step={4}
              suffix="px"
            />
          </div>
        </div>
      </FieldGroup>
    </div>
  );

  const renderPromoCardEditor = () => (
    <div className="space-y-6">
      {renderContainerSettings()}
      
      <FieldGroup label="Title">
        <input
          type="text"
          key={`title-${selectedSection}`}
          defaultValue={section.title || ''}
          onBlur={(e) => handleFieldChange('title', e.target.value)}
          placeholder="Card title"
          className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#04D1FC]"
        />
        <p className="text-[10px] text-zinc-400 mt-1">Link: <code className="bg-zinc-100 px-1 rounded text-[9px]">[text](url)</code> · Line break: <code className="bg-zinc-100 px-1 rounded text-[9px]">&lt;br&gt;</code></p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Font Size</span>
            <NumberInput
              value={section.titleFontSize || 28}
              onChange={(val) => handleFieldChange('titleFontSize', val)}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Color</span>
            <input
              type="color"
              value={section.titleColor || '#1A1A1A'}
              onChange={(e) => handleFieldChange('titleColor', e.target.value)}
              className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup label="Body">
        <EditableTextarea
          value={section.body || ''}
          onChange={(val) => handleFieldChange('body', val)}
          sectionKey={selectedSection}
          rows={4}
          placeholder="Card content..."
          className="resize-none"
        />
        <p className="text-[10px] text-zinc-400 mt-1">Link: <code className="bg-zinc-100 px-1 rounded text-[9px]">[text](url)</code> · Line break: <code className="bg-zinc-100 px-1 rounded text-[9px]">&lt;br&gt;</code></p>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Font Size</span>
            <NumberInput
              value={section.bodyFontSize || 16}
              onChange={(val) => handleFieldChange('bodyFontSize', val)}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Color</span>
            <input
              type="color"
              value={section.bodyColor || '#555555'}
              onChange={(e) => handleFieldChange('bodyColor', e.target.value)}
              className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup label="Call to Action">
        <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer mb-2">
          <input
            type="checkbox"
            checked={section.showCta !== false}
            onChange={(e) => handleFieldChange('showCta', e.target.checked)}
            className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
          />
          Show CTA link
        </label>
        {section.showCta !== false && (
          <>
            <input
              type="text"
              key={`cta-${selectedSection}`}
              defaultValue={section.ctaText || ''}
              onBlur={(e) => handleFieldChange('ctaText', e.target.value)}
              placeholder="Link text"
              className="flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#04D1FC]"
            />
            <div className="space-y-1 mt-2">
              <span className="text-[10px] text-zinc-400">CTA Color</span>
              <input
                type="color"
                value={section.ctaColor || '#04D1FC'}
                onChange={(e) => handleFieldChange('ctaColor', e.target.value)}
                className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
              />
            </div>
          </>
        )}
      </FieldGroup>

      <FieldGroup label="Image">
        <ImageUploader
          currentImage={section.image}
          onImageUpload={(file) => handleImageUpload(file, 'image')}
          onRemoveBackground={() => handleRemoveBackground('image')}
          isProcessing={isProcessing}
        />
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Position</span>
            <Select
              value={section.imagePosition || 'right'}
              onChange={(e) => handleFieldChange('imagePosition', e.target.value)}
              className="h-10"
            >
              <option value="right">Right</option>
              <option value="left">Left</option>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Width</span>
            <NumberInput
              value={section.imageWidth || 200}
              onChange={(val) => handleFieldChange('imageWidth', val)}
              suffix="px"
            />
          </div>
        </div>
        <label className="flex items-center gap-2 text-xs text-zinc-600 cursor-pointer mt-2">
          <input
            type="checkbox"
            checked={section.showImagePlaceholder !== false}
            onChange={(e) => handleFieldChange('showImagePlaceholder', e.target.checked)}
            className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC]"
          />
          Show placeholder when empty
        </label>
      </FieldGroup>

      <FieldGroup label="Card Style">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Background</span>
            <input
              type="color"
              value={section.backgroundColor || '#F8F9FA'}
              onChange={(e) => handleFieldChange('backgroundColor', e.target.value)}
              className="w-full h-8 rounded border border-zinc-200 cursor-pointer"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Border Radius</span>
            <NumberInput
              value={section.borderRadius || 16}
              onChange={(val) => handleFieldChange('borderRadius', val)}
              suffix="px"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-2">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Direction</span>
            <Select
              value={section.direction || 'ltr'}
              onChange={(e) => handleFieldChange('direction', e.target.value)}
              className="h-10"
            >
              <option value="rtl">RTL</option>
              <option value="ltr">LTR (English)</option>
            </Select>
          </div>
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Text Align</span>
            <Select
              value={section.contentAlign || 'right'}
              onChange={(e) => handleFieldChange('contentAlign', e.target.value)}
              className="h-10"
            >
              <option value="right">Right</option>
              <option value="center">Center</option>
              <option value="left">Left</option>
            </Select>
          </div>
        </div>
      </FieldGroup>

      {/* Spacing */}
      <FieldGroup label="Content Spacing">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Title to Body</span>
            <NumberInput
              value={section.titleToBodyGap ?? 16}
              onChange={(val) => handleFieldChange('titleToBodyGap', val)}
              step={4}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Body to CTA</span>
            <NumberInput
              value={section.bodyToCtaGap ?? 20}
              onChange={(val) => handleFieldChange('bodyToCtaGap', val)}
              step={4}
              suffix="px"
            />
          </div>
        </div>
      </FieldGroup>

      <FieldGroup label="Section Padding">
        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Top</span>
            <NumberInput
              value={section.paddingTop ?? section.padding ?? 32}
              onChange={(val) => handleFieldChange('paddingTop', val)}
              step={4}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Bottom</span>
            <NumberInput
              value={section.paddingBottom ?? section.padding ?? 32}
              onChange={(val) => handleFieldChange('paddingBottom', val)}
              step={4}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Left</span>
            <NumberInput
              value={section.paddingLeft ?? section.padding ?? 32}
              onChange={(val) => handleFieldChange('paddingLeft', val)}
              step={4}
              suffix="px"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[9px] text-zinc-400">Right</span>
            <NumberInput
              value={section.paddingRight ?? section.padding ?? 32}
              onChange={(val) => handleFieldChange('paddingRight', val)}
              step={4}
              suffix="px"
            />
          </div>
        </div>
      </FieldGroup>
    </div>
  );

  const renderBlockEditor = () => {
    if (!block) return null;

    switch (block.type) {
      case 'text': return renderTextEditor();
      case 'title': return renderSectionHeaderEditor();
      case 'marquee': return renderMarqueeEditor();
      case 'animatedText': return renderAnimatedTextEditor();
      case 'promoCard': return renderPromoCardEditor();
      case 'image': return renderImageBlockEditor();
      case 'imageCollage': return renderImageCollageEditor();
      case 'imageGrid': return renderImageGridEditor();
      case 'imageSequence': return renderImageSequenceEditor();
      case 'profileCards': return renderProfileCardsEditor();
      case 'recipe': return renderRecipeEditor();
      case 'multiLayout': return renderMultiLayoutEditor();
      default: return <p className="text-sm text-zinc-500">Block: {block.type}</p>;
    }
  };

  const renderEditor = () => {
    if (!section) return null;
    if (block) return renderBlockEditor();
    if (parentSection && parentSection.type === 'footer') return renderFooterEditor();
    return null;
  };

  const isSectionCanvasToolsOnly =
    !!selectedSection &&
    !block &&
    parentSection &&
    (parentSection.type === 'header' || parentSection.type === 'section');

  return (
    <div className="h-full min-h-0 w-full bg-white/95 backdrop-blur-sm border-zinc-200/60 flex flex-col">
      {/* Content */}
      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto"
        style={{ scrollBehavior: 'auto' }}
      >
            {selectedSection && !isSectionCanvasToolsOnly ? (
              <>
                <div className="p-4 border-b border-zinc-100 bg-zinc-50/50">
                  <div className="flex items-center justify-between gap-2">
                    {block ? (
                      <>
                        <div className="flex min-w-0 flex-1 items-center gap-2">
                          <button
                            onClick={() => onBlockClick?.(selectedSection, null)}
                            className="text-xs text-zinc-400 hover:text-zinc-600"
                          >
                            ← Section
                          </button>
                          <span className="text-zinc-300">/</span>
                          <h2 className="truncate text-sm font-semibold capitalize text-zinc-900">{block.type} Block</h2>
                        </div>
                        <div className="flex shrink-0 items-center gap-1.5">
                          <button
                            type="button"
                            title="Delete block"
                            onClick={() => {
                              if (window.confirm('Delete this block?')) {
                                onDeleteBlock?.(selectedSection, selectedBlock);
                              }
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-zinc-500 transition-colors hover:bg-red-50 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" strokeWidth={2} />
                          </button>
                          <Badge className="text-[10px] capitalize bg-[#04D1FC] text-white">
                            {block.type}
                          </Badge>
                        </div>
                      </>
                    ) : (
                      <>
                        <h2 className="text-sm font-semibold text-zinc-900 capitalize">
                          {parentSection?.name || (parentSection?.type === 'section' ? 'Section' : parentSection?.type)} Settings
                        </h2>
                        <Badge className="text-[10px] capitalize bg-zinc-900 text-white">
                          {parentSection?.type}
                        </Badge>
                      </>
                    )}
                  </div>
                </div>

                <div className="p-4 content-enter" key={block ? `block-${selectedBlock}` : `section-${selectedSection}`}>
                  {renderEditor()}
                </div>
              </>
            ) : null}

      </div>

    </div>
  );
}

export default SidebarEditor;
