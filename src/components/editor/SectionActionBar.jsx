import React, { useState, useCallback, useRef, useEffect } from 'react';
import { 
  ChevronDown, 
  Trash2, 
  Copy, 
  MoveUp, 
  MoveDown,
  Type,
  Palette,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  AlignCenterVertical,
  Bold,
  Italic,
  Minus,
  Plus,
  Upload,
  Layers,
  Grid3X3,
  LetterText,
  AlignVerticalSpaceAround,
  GripHorizontal,
  ImageIcon,
  Waves,
  FlipHorizontal,
  FlipVertical,
  Loader2,
  Sparkles,
  X,
  User,
  Users,
  Film,
  Play,
  Pause,
  FileImage,
  Clock,
  Settings,
  Move,
  Smile,
  Languages,
  SeparatorHorizontal,
  LayoutGrid,
  Camera,
  Download
} from 'lucide-react';
import domtoimage from 'dom-to-image-more';
import { captureElement, downloadDataUrl } from '../../utils/gifExport';
import { exportSequenceAsGif, exportMarqueeAsGif, downloadBlob } from '../../utils/sequenceGifExport';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import CollagePresetPicker from './CollagePresetPicker';
import ShapeDividerPicker from './ShapeDividerPicker';
import { mediaKit, getLogosByCategory } from '../../lib/mediaKit';
import IconPicker, { getIconByName } from './IconPicker';
import { GOOGLE_FONTS, loadGoogleFont, getFontStack, getFontCategories } from '../../lib/googleFonts';
import { useClipboard } from '../../context/ClipboardContext';

// Theme colors for dividers
const DIVIDER_THEME_COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Electric Blue', value: '#04D1FC' },
  { name: 'Persian Green', value: '#17A298' },
  { name: 'Black', value: '#120F0F' },
  { name: 'Horizon', value: '#F2D64C' },
  { name: 'Settle Ember', value: '#FF7B3E' },
  { name: 'Deep Purple', value: '#5B2C6F' },
  { name: 'Grey', value: '#E1E1E1' },
];

// Quick colors
const QUICK_COLORS = [
  '#04D1FC', '#17A298', '#120F0F', '#FFFFFF',
  '#FF6B6B', '#FFD93D', '#6C5CE7', '#00B894',
];

const REMOVE_BG_API_KEY = 'rDrPT41QWFrheRJc4MARam3m';

// Theme gradients
const THEME_GRADIENTS = [
  { name: 'Electric Blue', start: '#04D1FC', end: '#17A298' },
  { name: 'Sunset', start: '#FF7B3E', end: '#F2D64C' },
  { name: 'Deep Purple', start: '#5B2C6F', end: '#04D1FC' },
  { name: 'Dark', start: '#120F0F', end: '#5E5E5E' },
  { name: 'Ocean', start: '#667eea', end: '#764ba2' },
  { name: 'Emerald', start: '#11998e', end: '#38ef7d' },
];

function SectionActionBar({ 
  section, 
  onUpdate, 
  onDelete, 
  onDuplicate,
  onMoveUp,
  onMoveDown,
  onReplace
}) {
  const [expanded, setExpanded] = useState({});
  const [mediaCategory, setMediaCategory] = useState('all');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isExportingImage, setIsExportingImage] = useState(false);

  // Export section as image - using same method as GIF export which works
  const handleExportAsImage = useCallback(async () => {
    if (!section?.id) return;
    
    setIsExportingImage(true);
    try {
      // Get the full section wrapper (includes dividers)
      const sectionWrapper = document.querySelector(`[data-section-id="${section.id}"]`);
      if (!sectionWrapper) {
        setIsExportingImage(false);
        return;
      }

      // Hide UI elements
      const buttons = sectionWrapper.querySelectorAll('button');
      buttons.forEach(b => b.style.visibility = 'hidden');
      
      // Hide spacer dots (the ... indicators)
      const spacerDots = sectionWrapper.querySelectorAll('[class*="tracking-widest"], .tracking-widest');
      spacerDots.forEach(d => d.style.visibility = 'hidden');
      
      // Hide any elements with "..." text content that are spacer indicators
      sectionWrapper.querySelectorAll('*').forEach(el => {
        if (el.textContent === '...' || el.textContent === '···') {
          el.dataset.wasVisible = el.style.visibility;
          el.style.visibility = 'hidden';
        }
      });
      
      // Remove selection ring
      const origClass = sectionWrapper.className;
      sectionWrapper.className = origClass.replace(/ring-\S+/g, '').replace(/ring-offset-\S+/g, '');

      // Capture the FULL wrapper (includes dividers) not just first child
      const dataUrl = await captureElement(sectionWrapper);
      
      // Restore UI
      buttons.forEach(b => b.style.visibility = '');
      spacerDots.forEach(d => d.style.visibility = '');
      sectionWrapper.querySelectorAll('*').forEach(el => {
        if (el.dataset.wasVisible !== undefined) {
          el.style.visibility = el.dataset.wasVisible;
          delete el.dataset.wasVisible;
        }
      });
      sectionWrapper.className = origClass;

      // Download
      downloadDataUrl(dataUrl, `section-${section.type}-${Date.now()}.png`);

    } catch (error) {
      console.error('Export failed:', error);
    } finally {
      setIsExportingImage(false);
    }
  }, [section?.id, section?.type]);
  const [prevSectionId, setPrevSectionId] = useState(null);
  const [isExportingGif, setIsExportingGif] = useState(false);
  const [gifProgress, setGifProgress] = useState(0);
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showCopyToast, setShowCopyToast] = useState(null); // 'style' | 'section' | null
  const fileInputRef = useRef(null);
  const bgImageInputRef = useRef(null);
  const heroImageInputRef = useRef(null);
  const sequenceInputRef = useRef(null);
  const barRef = useRef(null);
  
  // Clipboard for copy/paste style and sections
  const { copyStyle, pasteStyle, canPasteStyle, copySection } = useClipboard();
  
  // Draggable state - use ref to persist position across section changes
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // Use a ref for position so it persists and doesn't trigger re-renders
  const savedPosition = useRef(null);
  const [barPosition, setBarPosition] = useState(() => {
    // Default position: top-right area
    return { x: window.innerWidth - 340, y: 80 };
  });

  // Close all tabs when section changes, but KEEP position
  useEffect(() => {
    if (section?.id !== prevSectionId) {
      setExpanded({}); // Close all tabs
      setShowIconPicker(false); // Close icon picker
      setPrevSectionId(section?.id);
      // Position is preserved via barPosition state
    }
  }, [section?.id, prevSectionId]);

  const handleDragStart = useCallback((e) => {
    if (e.target.closest('button') || e.target.closest('input') || e.target.closest('select')) {
      return;
    }
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    
    const rect = barRef.current?.getBoundingClientRect();
    if (rect) {
      setDragOffset({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      });
    }
  }, []);

  const handleDrag = useCallback((e) => {
    if (!isDragging) return;
    e.preventDefault();
    
    // Calculate new position directly from mouse position minus offset
    const newX = e.clientX - dragOffset.x;
    const newY = e.clientY - dragOffset.y;
    
    // Clamp to viewport bounds
    const maxX = window.innerWidth - 320;
    const maxY = window.innerHeight - 100;
    
    setBarPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY))
    });
  }, [isDragging, dragOffset]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Global mouse events for dragging
  useEffect(() => {
    if (isDragging) {
      document.body.style.userSelect = 'none';
      window.addEventListener('mousemove', handleDrag);
      window.addEventListener('mouseup', handleDragEnd);
      return () => {
        document.body.style.userSelect = '';
        window.removeEventListener('mousemove', handleDrag);
        window.removeEventListener('mouseup', handleDragEnd);
      };
    }
  }, [isDragging, handleDrag, handleDragEnd]);

  // Accordion behavior - close others when opening one
  const toggleExpand = (key) => {
    setExpanded(prev => {
      const isCurrentlyOpen = prev[key];
      // Close all tabs, then open this one if it was closed
      return isCurrentlyOpen ? {} : { [key]: true };
    });
  };

  const handleColorChange = useCallback((field, color) => {
    // When setting backgroundColor as solid, clear the gradient
    if (field === 'backgroundColor') {
      onUpdate({ [field]: color, backgroundType: 'solid', gradientEnd: null });
    } else {
      onUpdate({ [field]: color });
    }
  }, [onUpdate]);

  // Remove background from image
  const handleRemoveBackground = useCallback(async (imageField) => {
    const imageData = section?.[imageField];
    if (!imageData) {
      alert('No image to process');
      return;
    }

    setIsProcessing(true);
    try {
      const base64Data = imageData.split(',')[1];
      if (!base64Data) throw new Error('Invalid image data');
      
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
      reader.onload = (e) => onUpdate({ [imageField]: e.target.result });
      reader.readAsDataURL(resultBlob);
    } catch (error) {
      console.error('Remove background error:', error);
      alert(`Failed to remove background: ${error.message}`);
    } finally {
      setIsProcessing(false);
    }
  }, [section, onUpdate]);

  const handleFileUpload = useCallback((e, field) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => onUpdate({ [field]: ev.target.result });
      reader.readAsDataURL(file);
    }
  }, [onUpdate]);

  // Reusable divider controls
  const renderDividerControls = () => (
    <ActionGroup label="Divider" icon={Waves} expanded={expanded.divider} onToggle={() => toggleExpand('divider')}>
      <div className="space-y-3">
        {/* Top Divider */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-medium">Top Divider</span>
            <div className="flex gap-0.5">
              <Button
                variant={section.topDividerFlip ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onUpdate({ topDividerFlip: !section.topDividerFlip })}
                className="h-5 w-5 p-0"
                title="Flip horizontal"
              >
                <FlipHorizontal className="w-3 h-3" />
              </Button>
              <Button
                variant={section.topDividerFlipV ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onUpdate({ topDividerFlipV: !section.topDividerFlipV })}
                className="h-5 w-5 p-0"
                title="Flip vertical"
              >
                <FlipVertical className="w-3 h-3" />
              </Button>
            </div>
          </div>
          {/* Theme Colors for Top Divider */}
          <div className="flex items-center gap-1 flex-wrap">
            {DIVIDER_THEME_COLORS.map(color => (
              <button
                key={color.value}
                onClick={() => onUpdate({ topDividerColor: color.value })}
                className={cn(
                  "w-5 h-5 rounded border-2 transition-transform hover:scale-110",
                  section.topDividerColor === color.value ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200"
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
            <input
              type="color"
              value={section.topDividerColor || '#FFFFFF'}
              onChange={(e) => onUpdate({ topDividerColor: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer border border-zinc-200"
              title="Custom color"
            />
          </div>
          <ShapeDividerPicker
            currentDivider={section.topDivider || 'none'}
            onSelectDivider={(id) => onUpdate({ topDivider: id })}
            position="top"
            flip={section.topDividerFlip}
          />
          {section.topDivider && section.topDivider !== 'none' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-10">Height</span>
              <NumberStepper
                value={section.topDividerHeight || 40}
                onChange={(v) => onUpdate({ topDividerHeight: v })}
                min={20}
                max={150}
                step={10}
                suffix="px"
              />
            </div>
          )}
        </div>
        
        {/* Bottom Divider */}
        <div className="space-y-2 pt-2 border-t border-zinc-100">
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400 font-medium">Bottom Divider</span>
            <div className="flex gap-0.5">
              <Button
                variant={section.bottomDividerFlip ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onUpdate({ bottomDividerFlip: !section.bottomDividerFlip })}
                className="h-5 w-5 p-0"
                title="Flip horizontal"
              >
                <FlipHorizontal className="w-3 h-3" />
              </Button>
              <Button
                variant={section.bottomDividerFlipV ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onUpdate({ bottomDividerFlipV: !section.bottomDividerFlipV })}
                className="h-5 w-5 p-0"
                title="Flip vertical"
              >
                <FlipVertical className="w-3 h-3" />
              </Button>
            </div>
          </div>
          {/* Theme Colors for Bottom Divider */}
          <div className="flex items-center gap-1 flex-wrap">
            {DIVIDER_THEME_COLORS.map(color => (
              <button
                key={color.value}
                onClick={() => onUpdate({ bottomDividerColor: color.value })}
                className={cn(
                  "w-5 h-5 rounded border-2 transition-transform hover:scale-110",
                  section.bottomDividerColor === color.value ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200"
                )}
                style={{ backgroundColor: color.value }}
                title={color.name}
              />
            ))}
            <input
              type="color"
              value={section.bottomDividerColor || '#FFFFFF'}
              onChange={(e) => onUpdate({ bottomDividerColor: e.target.value })}
              className="w-5 h-5 rounded cursor-pointer border border-zinc-200"
              title="Custom color"
            />
          </div>
          <ShapeDividerPicker
            currentDivider={section.bottomDivider || 'none'}
            onSelectDivider={(id) => onUpdate({ bottomDivider: id })}
            position="bottom"
            flip={section.bottomDividerFlip}
          />
          {section.bottomDivider && section.bottomDivider !== 'none' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-10">Height</span>
              <NumberStepper
                value={section.bottomDividerHeight || 40}
                onChange={(v) => onUpdate({ bottomDividerHeight: v })}
                min={20}
                max={150}
                step={10}
                suffix="px"
              />
            </div>
          )}
        </div>
      </div>
    </ActionGroup>
  );

  // Reusable background controls for all sections
  const renderBackgroundControls = () => (
    <ActionGroup label="Background" icon={Palette} expanded={expanded.background} onToggle={() => toggleExpand('background')}>
      <div className="space-y-3">
        {/* Background Type Selector */}
        <div className="flex gap-1">
          {['solid', 'gradient', 'image'].map(type => (
            <button
              key={type}
              onClick={() => onUpdate({ backgroundType: type })}
              className={cn(
                "flex-1 px-2 py-1 rounded text-[9px] font-medium transition-colors capitalize",
                (section.backgroundType || 'solid') === type 
                  ? "bg-zinc-900 text-white" 
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              )}
            >
              {type}
            </button>
          ))}
        </div>

        {/* Solid Color Options */}
        {(!section.backgroundType || section.backgroundType === 'solid') && (
          <div className="space-y-2">
            <p className="text-[9px] text-zinc-400 font-medium">Theme Colors</p>
            <div className="flex flex-wrap gap-1">
              {DIVIDER_THEME_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => onUpdate({ backgroundColor: color.value })}
                  className={cn(
                    "w-6 h-6 rounded border-2 transition-transform hover:scale-110",
                    section.backgroundColor === color.value ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
              <input
                type="color"
                value={section.backgroundColor || '#FFFFFF'}
                onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer border border-zinc-200"
                title="Custom color"
              />
            </div>
          </div>
        )}

        {/* Gradient Options */}
        {section.backgroundType === 'gradient' && (
          <div className="space-y-2">
            <p className="text-[9px] text-zinc-400 font-medium">Theme Gradients</p>
            <div className="grid grid-cols-3 gap-1.5">
              {THEME_GRADIENTS.map((gradient) => (
                <button
                  key={gradient.name}
                  onClick={() => onUpdate({ 
                    backgroundColor: gradient.start, 
                    gradientEnd: gradient.end 
                  })}
                  className={cn(
                    "h-8 rounded-lg border-2 transition-all",
                    section.backgroundColor === gradient.start && section.gradientEnd === gradient.end 
                      ? "border-zinc-900 ring-1 ring-zinc-900" 
                      : "border-zinc-200"
                  )}
                  style={{ 
                    background: `linear-gradient(135deg, ${gradient.start} 0%, ${gradient.end} 100%)` 
                  }}
                  title={gradient.name}
                />
              ))}
            </div>
            <div className="h-px bg-zinc-100 my-2" />
            <p className="text-[9px] text-zinc-400 font-medium">Custom Gradient</p>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-zinc-400">Start</span>
                <input
                  type="color"
                  value={section.backgroundColor || '#04D1FC'}
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border border-zinc-200"
                />
              </div>
              <div className="flex items-center gap-1">
                <span className="text-[9px] text-zinc-400">End</span>
                <input
                  type="color"
                  value={section.gradientEnd || '#17A298'}
                  onChange={(e) => onUpdate({ gradientEnd: e.target.value })}
                  className="w-6 h-6 rounded cursor-pointer border border-zinc-200"
                />
              </div>
            </div>
          </div>
        )}

        {/* Image Background Options */}
        {section.backgroundType === 'image' && (
          <div className="space-y-2">
            {section.backgroundImage ? (
              <div className="relative rounded-lg overflow-hidden">
                <img 
                  src={section.backgroundImage} 
                  alt="Background" 
                  className="w-full h-20 object-cover"
                />
                <div className="absolute top-1 right-1 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBackground('backgroundImage')}
                    disabled={isProcessing}
                    className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
                    title="Remove background"
                  >
                    {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdate({ backgroundImage: null })}
                    className="h-6 w-6 p-0 bg-white/80 hover:bg-red-50 text-red-500"
                  >
                    <X className="w-3 h-3" />
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <input
                  type="file"
                  ref={bgImageInputRef}
                  className="hidden"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'backgroundImage')}
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => bgImageInputRef.current?.click()}
                  className="h-8 text-xs w-full"
                >
                  <Upload className="w-3 h-3 mr-1.5" />
                  Upload Background Image
                </Button>
              </>
            )}

            {/* Overlay Controls - only show when image is set */}
            {section.backgroundImage && (
              <div className="pt-2 border-t border-zinc-100 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-zinc-400 font-medium">Overlay</span>
                  <input
                    type="color"
                    value={section.overlayColor || '#000000'}
                    onChange={(e) => onUpdate({ overlayColor: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border border-zinc-200"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-400 w-12">Opacity</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={section.overlayOpacity || 0}
                    onChange={(e) => onUpdate({ overlayOpacity: parseInt(e.target.value) })}
                    className="flex-1 h-1 bg-zinc-200 rounded-full appearance-none cursor-pointer"
                  />
                  <span className="text-[9px] text-zinc-600 w-8">{section.overlayOpacity || 0}%</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </ActionGroup>
  );

  // Reusable text direction controls (RTL/LTR) for Hebrew/Arabic support
  const renderTextDirectionControls = () => (
    <ActionGroup label="Direction" icon={Languages} expanded={expanded.direction} onToggle={() => toggleExpand('direction')}>
      <div className="space-y-3">
        {/* Text Direction */}
        <div className="space-y-1.5">
          <p className="text-[9px] text-zinc-400 font-medium">Text Direction</p>
          <div className="flex gap-1">
            <Button
              variant={(section.textDirection || 'ltr') === 'ltr' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onUpdate({ textDirection: 'ltr' })}
              className="flex-1 h-7 text-xs"
            >
              LTR →
            </Button>
            <Button
              variant={section.textDirection === 'rtl' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onUpdate({ textDirection: 'rtl' })}
              className="flex-1 h-7 text-xs"
            >
              ← RTL
            </Button>
          </div>
        </div>
        
        {/* Text Alignment */}
        <div className="space-y-1.5">
          <p className="text-[9px] text-zinc-400 font-medium">Alignment</p>
          <div className="flex gap-0.5">
            {[
              { align: 'left', Icon: AlignLeft },
              { align: 'center', Icon: AlignCenter },
              { align: 'right', Icon: AlignRight },
            ].map(({ align, Icon }) => (
              <Button
                key={align}
                variant={(section.textAlign || 'left') === align ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onUpdate({ textAlign: align })}
                className="flex-1 h-7 w-7 p-0"
              >
                <Icon className="w-3.5 h-3.5" />
              </Button>
            ))}
          </div>
        </div>
      </div>
    </ActionGroup>
  );

  // Reusable line divider controls (bottom border)
  const renderLineDividerControls = () => (
    <ActionGroup label="Line Divider" icon={SeparatorHorizontal} expanded={expanded.lineDivider} onToggle={() => toggleExpand('lineDivider')}>
      <div className="space-y-3">
        {/* Enable/Disable */}
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-zinc-500">Show Bottom Line</span>
          <button
            onClick={() => onUpdate({ dividerBottom: !section.dividerBottom })}
            className={cn(
              "w-9 h-5 rounded-full transition-colors relative",
              section.dividerBottom ? "bg-[#04D1FC]" : "bg-zinc-200"
            )}
          >
            <div
              className={cn(
                "w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform",
                section.dividerBottom ? "translate-x-4" : "translate-x-0.5"
              )}
            />
          </button>
        </div>
        
        {section.dividerBottom && (
          <>
            {/* Color */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-14">Color</span>
              <div className="flex gap-1 flex-1">
                {['#E5E5E5', '#D2D2D7', '#04D1FC', '#120F0F'].map(color => (
                  <button
                    key={color}
                    onClick={() => onUpdate({ dividerColor: color })}
                    className={cn(
                      "w-5 h-5 rounded border-2 transition-transform hover:scale-110",
                      (section.dividerColor || '#E5E5E5') === color ? "border-zinc-900" : "border-zinc-200"
                    )}
                    style={{ backgroundColor: color }}
                  />
                ))}
                <input
                  type="color"
                  value={section.dividerColor || '#E5E5E5'}
                  onChange={(e) => onUpdate({ dividerColor: e.target.value })}
                  className="w-5 h-5 rounded cursor-pointer border border-zinc-200"
                />
              </div>
            </div>
            
            {/* Thickness */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-14">Thickness</span>
              <div className="flex gap-1 flex-1">
                {[1, 2, 3, 4].map(t => (
                  <Button
                    key={t}
                    variant={(section.dividerThickness || 1) === t ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onUpdate({ dividerThickness: t })}
                    className="flex-1 h-6 text-[10px]"
                  >
                    {t}px
                  </Button>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </ActionGroup>
  );

  // Reusable font family control
  const renderFontFamilyControl = () => (
    <ActionGroup label="Font Family" icon={Type} expanded={expanded.fontFamily} onToggle={() => toggleExpand('fontFamily')}>
      <div className="space-y-2">
        <select
          value={section.fontFamily || 'Poppins'}
          onChange={(e) => onUpdate({ fontFamily: e.target.value })}
          className="w-full h-8 text-xs rounded border border-zinc-200 px-2"
          dir="ltr"
        >
          <option value="Noto Sans Hebrew">Noto Sans Hebrew</option>
          <option value="Assistant">Assistant</option>
          <option value="Heebo">Heebo</option>
          <option value="Poppins">Poppins (English)</option>
          <option value="Inter">Inter (English)</option>
        </select>
        <p className="text-[9px] text-zinc-400">
          Also for RTL: Noto Sans Hebrew, Assistant, Heebo
        </p>
      </div>
    </ActionGroup>
  );

  // Render section-specific controls
  const renderControls = () => {
    switch (section.type) {
      case 'header':
        return renderHeaderControls();
      case 'text':
        return renderTextControls();
      case 'sectionHeader':
        return renderSectionHeaderControls();
      case 'imageCollage':
        return renderImageCollageControls();
      case 'imageSequence':
        return renderImageSequenceControls();
      case 'marquee':
        return renderMarqueeControls();
      case 'footer':
        return renderFooterControls();
      case 'profileCards':
        return renderProfileCardsControls();
      case 'recipe':
        return renderRecipeControls();
      case 'stats':
        return renderStatsControls();
      case 'featureGrid':
        return renderFeatureGridControls();
      case 'specsTable':
        return renderSpecsTableControls();
      case 'contactCards':
        return renderContactCardsControls();
      case 'steps':
        return renderStepsControls();
      case 'accentText':
        return renderAccentTextControls();
      case 'featureCards':
        return renderFeatureCardsControls();
      case 'updatesList':
        return renderUpdatesListControls();
      case 'appCards':
        return renderAppCardsControls();
      case 'featureHighlight':
        return renderFeatureHighlightControls();
      case 'heroBanner':
        return renderHeroBannerControls();
      case 'celebration':
        return renderCelebrationControls();
      case 'heroSplit':
        return renderHeroSplitControls();
      case 'alternating':
        return renderAlternatingControls();
      case 'promoCard':
        return renderPromoCardControls();
      case 'styledTitle':
        return renderStyledTitleControls();
      default:
        return renderDefaultControls();
    }
  };

  // Outer Wrapper Controls (for card-style sections with outer padding and border radius)
  const renderOuterWrapperControls = () => (
    <ActionGroup label="Outer Frame" icon={Layers} expanded={expanded.outerFrame} onToggle={() => toggleExpand('outerFrame')}>
      <div className="space-y-3">
        {/* Outer Background Color */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 w-16">Outer Bg</span>
          <div className="flex items-center gap-1 flex-1">
            <input 
              type="color" 
              value={section.outerBackgroundColor === 'transparent' ? '#f5f5f5' : section.outerBackgroundColor} 
              onChange={(e) => onUpdate({ outerBackgroundColor: e.target.value })} 
              className="w-6 h-6 rounded cursor-pointer"
            />
            <Button
              variant={section.outerBackgroundColor === 'transparent' ? 'default' : 'outline'}
              size="sm"
              onClick={() => onUpdate({ outerBackgroundColor: 'transparent' })}
              className="h-6 px-2 text-[10px]"
            >
              None
            </Button>
          </div>
        </div>
        
        {/* Border Radius */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 w-16">Radius</span>
          <NumberStepper value={section.borderRadius || 0} onChange={(v) => onUpdate({ borderRadius: v })} min={0} max={48} suffix="px" />
        </div>
        
        {/* Outer Padding */}
        <div className="space-y-1.5">
          <span className="text-[10px] text-zinc-400">Outer Padding</span>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-zinc-300 w-4">T</span>
              <NumberStepper value={section.outerPaddingTop || 0} onChange={(v) => onUpdate({ outerPaddingTop: v })} min={0} max={80} suffix="px" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-zinc-300 w-4">R</span>
              <NumberStepper value={section.outerPaddingRight || 0} onChange={(v) => onUpdate({ outerPaddingRight: v })} min={0} max={80} suffix="px" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-zinc-300 w-4">B</span>
              <NumberStepper value={section.outerPaddingBottom || 0} onChange={(v) => onUpdate({ outerPaddingBottom: v })} min={0} max={80} suffix="px" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-zinc-300 w-4">L</span>
              <NumberStepper value={section.outerPaddingLeft || 0} onChange={(v) => onUpdate({ outerPaddingLeft: v })} min={0} max={80} suffix="px" />
            </div>
          </div>
          {/* Quick link all edges */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const val = section.outerPaddingTop || 16;
              onUpdate({ 
                outerPaddingTop: val, 
                outerPaddingRight: val, 
                outerPaddingBottom: val, 
                outerPaddingLeft: val 
              });
            }}
            className="w-full h-6 text-[10px]"
          >
            Set All Edges to {section.outerPaddingTop || 16}px
          </Button>
        </div>
      </div>
    </ActionGroup>
  );

  const renderHeaderControls = () => (
    <>
      {/* Logo / Media */}
      <ActionGroup label="Logo / Media" icon={Image} expanded={expanded.logo} onToggle={() => toggleExpand('logo')}>
        <div className="space-y-3">
          {/* Preview */}
          {section.logo && (
            <>
              <div className="relative w-full h-16 bg-zinc-100 rounded-lg overflow-hidden">
                <img 
                  src={section.logo} 
                  alt="Logo preview" 
                  className="w-full h-full object-contain"
                />
                <div className="absolute top-1 right-1 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBackground('logo')}
                    disabled={isProcessing}
                    className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
                    title="Remove background"
                  >
                    {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdate({ logo: null })}
                    className="h-6 w-6 p-0 bg-white/80 hover:bg-red-50 text-red-500"
                  >
                    <Trash2 className="w-3 h-3" />
                  </Button>
                </div>
              </div>
              
              {/* Logo Size Controls */}
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <p className="text-[9px] text-zinc-400 font-medium">Size</p>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 w-10">Width</span>
                  <NumberStepper
                    value={section.logoWidth || 120}
                    onChange={(v) => onUpdate({ logoWidth: v })}
                    min={30}
                    max={400}
                    step={10}
                    suffix="px"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 w-10">Height</span>
                  <div className="flex items-center gap-1 flex-1">
                    <button
                      onClick={() => onUpdate({ logoHeight: 'auto' })}
                      className={cn(
                        "px-2 py-1 rounded text-[9px] font-medium transition-colors",
                        section.logoHeight === 'auto' || !section.logoHeight
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      )}
                    >
                      Auto
                    </button>
                    {section.logoHeight !== 'auto' && section.logoHeight && (
                      <NumberStepper
                        value={section.logoHeight}
                        onChange={(v) => onUpdate({ logoHeight: v })}
                        min={20}
                        max={200}
                        step={5}
                        suffix="px"
                      />
                    )}
                    {(section.logoHeight === 'auto' || !section.logoHeight) && (
                      <button
                        onClick={() => onUpdate({ logoHeight: 60 })}
                        className="px-2 py-1 rounded text-[9px] font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      >
                        Set Height
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Logo Alignment */}
                <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
                  <span className="text-[10px] text-zinc-400 w-14">Align</span>
                  <div className="flex gap-1 flex-1">
                    {[
                      { value: 'left', icon: AlignLeft },
                      { value: 'center', icon: AlignCenter },
                      { value: 'right', icon: AlignRight }
                    ].map(({ value, icon: Icon }) => (
                      <button
                        key={value}
                        onClick={() => onUpdate({ logoAlignment: value })}
                        className={cn(
                          "flex-1 h-7 flex items-center justify-center rounded transition-colors",
                          (section.logoAlignment || 'center') === value
                            ? "bg-zinc-900 text-white"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        )}
                      >
                        <Icon className="w-3.5 h-3.5" />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo Vertical Offset */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 w-14">Offset Y</span>
                  <NumberStepper
                    value={section.logoOffsetY || 0}
                    onChange={(v) => onUpdate({ logoOffsetY: v })}
                    min={-100}
                    max={100}
                    step={5}
                    suffix="px"
                  />
                </div>
              </div>
            </>
          )}
          
          {/* Media Kit Library */}
          <div className="space-y-2">
            <p className="text-[10px] text-zinc-400 font-medium">Media Library</p>
            
            {/* Category Filter */}
            <div className="flex gap-1">
              {mediaKit.categories.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setMediaCategory(cat.id)}
                  className={cn(
                    "px-2 py-0.5 rounded text-[9px] font-medium transition-colors",
                    mediaCategory === cat.id 
                      ? "bg-zinc-900 text-white" 
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  )}
                >
                  {cat.name}
                </button>
              ))}
            </div>
            
            {/* Logos Grid */}
            <div className="grid grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto">
              {getLogosByCategory(mediaCategory).map((logo) => (
                <button
                  key={logo.id}
                  onClick={() => onUpdate({ logo: logo.url })}
                  className={cn(
                    "relative rounded-lg border p-1.5 hover:border-[#04D1FC] hover:ring-1 hover:ring-[#04D1FC]/20 transition-all bg-white overflow-hidden",
                    section.logo === logo.url ? "border-[#04D1FC] ring-1 ring-[#04D1FC]/20" : "border-zinc-200"
                  )}
                >
                  <div className="h-10 flex items-center justify-center bg-zinc-50 rounded overflow-hidden">
                    <img 
                      src={logo.url} 
                      alt={logo.name}
                      className="max-w-full max-h-full object-contain"
                      loading="lazy"
                    />
                  </div>
                  <p className="text-[8px] text-center mt-1 truncate text-zinc-500">
                    {logo.name}
                  </p>
                </button>
              ))}
            </div>
          </div>
          
          {/* Divider */}
          <div className="border-t border-zinc-100 pt-2">
            <p className="text-[10px] text-zinc-400 font-medium mb-2">Or upload custom</p>
            
            {/* Upload Button */}
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'logo')}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              className="h-7 text-xs w-full"
            >
              <Upload className="w-3 h-3 mr-1.5" />
              Upload Image
            </Button>
            
            {/* URL Input */}
            <input
              type="text"
              placeholder="Or paste image URL..."
              className="w-full h-7 px-2 text-xs rounded border border-zinc-200 focus:outline-none focus:border-[#04D1FC] mt-1.5"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  onUpdate({ logo: e.target.value });
                  e.target.value = '';
                }
              }}
              onBlur={(e) => {
                if (e.target.value) {
                  onUpdate({ logo: e.target.value });
                  e.target.value = '';
                }
              }}
            />
          </div>
          
          {/* Logo Size */}
          {section.logo && (
            <div className="flex items-center gap-2 pt-1 border-t border-zinc-100">
              <span className="text-[10px] text-zinc-400 w-8">Size</span>
              <NumberStepper
                value={section.logoSize || 40}
                onChange={(v) => onUpdate({ logoSize: v })}
                min={20}
                max={120}
                step={5}
                suffix="px"
              />
            </div>
          )}
        </div>
      </ActionGroup>

      {/* Hero Image */}
      <ActionGroup label="Hero Image" icon={FileImage} expanded={expanded.heroImage} onToggle={() => toggleExpand('heroImage')}>
        <div className="space-y-3">
          {/* Preview */}
          {section.heroImage ? (
            <div className="relative w-full h-24 bg-zinc-100 rounded-lg overflow-hidden">
              <img 
                src={section.heroImage} 
                alt="Hero preview" 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-1 right-1 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdate({ heroImage: null })}
                  className="h-6 w-6 p-0 bg-white/80 hover:bg-red-50 text-red-500"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between py-2">
              <span className="text-[10px] text-zinc-500">Show Placeholder</span>
              <input 
                type="checkbox" 
                checked={section.showHeroPlaceholder || false}
                onChange={(e) => onUpdate({ showHeroPlaceholder: e.target.checked })}
                className="w-4 h-4 rounded"
              />
            </div>
          )}
          
          {/* Upload */}
          <div className="space-y-2">
            <input
              type="file"
              ref={heroImageInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleFileUpload(e, 'heroImage')}
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => heroImageInputRef.current?.click()}
              className="h-7 text-xs w-full"
            >
              <Upload className="w-3 h-3 mr-1.5" />
              Upload Hero Image
            </Button>
            
            {/* URL Input */}
            <input
              type="text"
              placeholder="Or paste image URL..."
              className="w-full h-7 px-2 text-xs rounded border border-zinc-200 focus:outline-none focus:border-[#04D1FC]"
              onKeyDown={(e) => {
                if (e.key === 'Enter' && e.target.value) {
                  onUpdate({ heroImage: e.target.value });
                  e.target.value = '';
                }
              }}
              onBlur={(e) => {
                if (e.target.value) {
                  onUpdate({ heroImage: e.target.value });
                  e.target.value = '';
                }
              }}
            />
          </div>
          
          {/* Image always uses contain fit, height is auto */}
        </div>
      </ActionGroup>

      {/* Colors - merged with Background */}
      <ActionGroup label="Colors" icon={Palette} expanded={expanded.colors} onToggle={() => toggleExpand('colors')}>
        <div className="space-y-3">
          {/* Theme Colors - Quick Selection */}
          <div>
            <p className="text-[9px] text-zinc-400 font-medium mb-1.5">Theme Colors</p>
            <div className="flex gap-1 flex-wrap">
              {DIVIDER_THEME_COLORS.map(color => (
                <button
                  key={color.value}
                  onClick={() => onUpdate({ backgroundColor: color.value, backgroundType: 'solid', gradientEnd: null })}
                  className={cn(
                    "w-6 h-6 rounded border-2 transition-transform hover:scale-110",
                    section.backgroundColor === color.value && (!section.backgroundType || section.backgroundType === 'solid')
                      ? "border-zinc-900 ring-1 ring-zinc-900" 
                      : "border-zinc-200"
                  )}
                  style={{ backgroundColor: color.value }}
                  title={color.name}
                />
              ))}
              {/* Full color picker */}
              <div className="relative w-6 h-6 rounded border-2 border-zinc-200 overflow-hidden hover:border-zinc-400 transition-colors">
                <input
                  type="color"
                  value={section.backgroundColor || '#FFFFFF'}
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value, backgroundType: 'solid', gradientEnd: null })}
                  className="absolute inset-0 w-8 h-8 -top-1 -left-1 cursor-pointer"
                  title="Pick custom color"
                />
              </div>
            </div>
          </div>

          <div className="h-px bg-zinc-100" />

          {/* Custom Background */}
          <div>
            <p className="text-[9px] text-zinc-400 font-medium mb-1.5">Custom Background</p>
            <div className="flex gap-1 mb-2">
              {['solid', 'gradient', 'image'].map(type => (
                <button
                  key={type}
                  onClick={() => onUpdate({ backgroundType: type })}
                  className={cn(
                    "flex-1 px-2 py-1 rounded text-[9px] font-medium transition-colors capitalize",
                    (section.backgroundType || 'solid') === type 
                      ? "bg-zinc-900 text-white" 
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
            
            {/* Solid Custom Color */}
            {(!section.backgroundType || section.backgroundType === 'solid') && (
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400">Color</span>
                <input
                  type="color"
                  value={section.backgroundColor || '#04D1FC'}
                  onChange={(e) => onUpdate({ backgroundColor: e.target.value, backgroundType: 'solid', gradientEnd: null })}
                  className="w-6 h-6 rounded cursor-pointer border border-zinc-200"
                />
              </div>
            )}
            
            {/* Gradient */}
            {section.backgroundType === 'gradient' && (
              <div className="space-y-2">
                <div className="grid grid-cols-3 gap-1">
                  {THEME_GRADIENTS.slice(0, 6).map((gradient) => (
                    <button
                      key={gradient.name}
                      onClick={() => onUpdate({ 
                        backgroundColor: gradient.start, 
                        gradientEnd: gradient.end,
                        backgroundType: 'gradient'
                      })}
                      className={cn(
                        "h-6 rounded border-2 transition-all",
                        section.backgroundColor === gradient.start && section.gradientEnd === gradient.end 
                          ? "border-zinc-900" : "border-zinc-200"
                      )}
                      style={{ background: `linear-gradient(135deg, ${gradient.start} 0%, ${gradient.end} 100%)` }}
                      title={gradient.name}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-zinc-400">Start</span>
                    <input
                      type="color"
                      value={section.backgroundColor || '#04D1FC'}
                      onChange={(e) => onUpdate({ backgroundColor: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer border border-zinc-200"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[9px] text-zinc-400">End</span>
                    <input
                      type="color"
                      value={section.gradientEnd || '#17A298'}
                      onChange={(e) => onUpdate({ gradientEnd: e.target.value })}
                      className="w-5 h-5 rounded cursor-pointer border border-zinc-200"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-zinc-100" />
          
          {/* Text Color */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400">Text Color</span>
            <input
              type="color"
              value={section.textColor || '#FFFFFF'}
              onChange={(e) => onUpdate({ textColor: e.target.value })}
              className="w-6 h-6 rounded cursor-pointer border border-zinc-200"
            />
          </div>
        </div>
      </ActionGroup>

      {/* Title Segments - Multi-styled title */}
      <ActionGroup label="Title Segments" icon={Type} expanded={expanded.titleSegments} onToggle={() => toggleExpand('titleSegments')}>
        <div className="space-y-3">
          {/* Mode Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">Multi-style Mode</span>
            <button
              onClick={() => {
                if (!section.useTitleSegments) {
                  // Enable segments mode - create initial segments from current title
                  const initialSegments = section.titleSegments || [
                    { id: 'seg-1', text: section.title || 'Title', fontWeight: '700', fontStyle: 'normal', color: section.textColor || '#FFFFFF' }
                  ];
                  onUpdate({ useTitleSegments: true, titleSegments: initialSegments });
                } else {
                  onUpdate({ useTitleSegments: false });
                }
              }}
              className={cn(
                "w-9 h-5 rounded-full transition-colors relative",
                section.useTitleSegments ? "bg-[#04D1FC]" : "bg-zinc-200"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform",
                  section.useTitleSegments ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
          
          {section.useTitleSegments ? (
            <>
              {/* Segments List */}
              {(section.titleSegments || []).map((segment, index) => (
                <div key={segment.id} className="p-2 bg-zinc-50 rounded-lg space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-medium text-zinc-500">Segment {index + 1}</span>
                    {(section.titleSegments || []).length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          const newSegments = (section.titleSegments || []).filter((_, i) => i !== index);
                          onUpdate({ titleSegments: newSegments });
                        }}
                        className="h-5 w-5 p-0 text-red-400 hover:text-red-600"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Text */}
                  <input
                    type="text"
                    value={segment.text}
                    onChange={(e) => {
                      const newSegments = [...(section.titleSegments || [])];
                      newSegments[index] = { ...segment, text: e.target.value };
                      onUpdate({ titleSegments: newSegments });
                    }}
                    className="w-full h-7 text-xs rounded border border-zinc-200 px-2"
                    placeholder="Text..."
                  />
                  
                  {/* Font Weight */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 w-14">Weight</span>
                    <select
                      value={segment.fontWeight || '400'}
                      onChange={(e) => {
                        const newSegments = [...(section.titleSegments || [])];
                        newSegments[index] = { ...segment, fontWeight: e.target.value };
                        onUpdate({ titleSegments: newSegments });
                      }}
                      className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1"
                    >
                      <option value="100">Thin (100)</option>
                      <option value="200">ExtraLight (200)</option>
                      <option value="300">Light (300)</option>
                      <option value="400">Regular (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">SemiBold (600)</option>
                      <option value="700">Bold (700)</option>
                      <option value="800">ExtraBold (800)</option>
                      <option value="900">Black (900)</option>
                    </select>
                  </div>
                  
                  {/* Font Style */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 w-14">Style</span>
                    <div className="flex gap-1">
                      <Button
                        variant={segment.fontStyle === 'normal' || !segment.fontStyle ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const newSegments = [...(section.titleSegments || [])];
                          newSegments[index] = { ...segment, fontStyle: 'normal' };
                          onUpdate({ titleSegments: newSegments });
                        }}
                        className="h-6 px-2 text-[10px]"
                      >
                        Normal
                      </Button>
                      <Button
                        variant={segment.fontStyle === 'italic' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => {
                          const newSegments = [...(section.titleSegments || [])];
                          newSegments[index] = { ...segment, fontStyle: 'italic' };
                          onUpdate({ titleSegments: newSegments });
                        }}
                        className="h-6 px-2 text-[10px] italic"
                      >
                        Italic
                      </Button>
                    </div>
                  </div>
                  
                  {/* Segment Color */}
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-zinc-400 w-14">Color</span>
                    <input
                      type="color"
                      value={segment.color || '#FFFFFF'}
                      onChange={(e) => {
                        const newSegments = [...(section.titleSegments || [])];
                        newSegments[index] = { ...segment, color: e.target.value };
                        onUpdate({ titleSegments: newSegments });
                      }}
                      className="w-6 h-6 rounded cursor-pointer"
                    />
                  </div>
                </div>
              ))}
              
              {/* Add Segment Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const newSegment = {
                    id: `seg-${Date.now()}`,
                    text: 'Text',
                    fontWeight: '400',
                    fontStyle: 'normal',
                    color: section.textColor || '#FFFFFF'
                  };
                  onUpdate({ titleSegments: [...(section.titleSegments || []), newSegment] });
                }}
                className="w-full h-7 text-xs"
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Segment
              </Button>
            </>
          ) : (
            /* Simple title mode */
            <input
              type="text"
              value={section.title || 'Newsletter'}
              onChange={(e) => onUpdate({ title: e.target.value })}
              placeholder="Enter title..."
              className="w-full h-8 px-2 text-sm font-medium rounded border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#04D1FC] focus:border-transparent"
            />
          )}
        </div>
      </ActionGroup>

      {/* Title Settings */}
      <ActionGroup label="Title Settings" icon={Type} expanded={expanded.title} onToggle={() => toggleExpand('title')}>
        <div className="space-y-2">
          {/* Font Family */}
          <div className="flex items-center gap-2">
            <Type className="w-3 h-3 text-zinc-400" />
            <span className="text-[10px] text-zinc-400 w-12">Font</span>
            <select
              value={section.fontFamily || 'Poppins'}
              onChange={(e) => onUpdate({ fontFamily: e.target.value })}
              className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1"
            >
              <option value="Noto Sans Hebrew">Noto Sans Hebrew</option>
              <option value="Poppins">Poppins</option>
              <option value="Inter">Inter</option>
              <option value="Montserrat">Montserrat</option>
              <option value="Playfair Display">Playfair Display</option>
              <option value="Bebas Neue">Bebas Neue</option>
              <option value="Space Grotesk">Space Grotesk</option>
              <option value="Assistant">Assistant</option>
              <option value="Heebo">Heebo</option>
            </select>
          </div>
          {/* Size */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper
              value={section.titleFontSize || 28}
              onChange={(v) => onUpdate({ titleFontSize: v })}
              min={12}
              max={150}
              suffix="px"
            />
          </div>
          {/* Text Color (only for simple mode) */}
          {!section.useTitleSegments && (
            <div className="flex items-center gap-2">
              <Palette className="w-3 h-3 text-zinc-400" />
              <span className="text-[10px] text-zinc-400 w-12">Color</span>
              <input 
                type="color" 
                value={section.textColor || '#FFFFFF'} 
                onChange={(e) => onUpdate({ textColor: e.target.value })} 
                className="w-6 h-6 rounded cursor-pointer border border-zinc-200" 
              />
              <div className="flex gap-0.5">
                {['#FFFFFF', '#000000', '#04D1FC'].map(c => (
                  <button
                    key={c}
                    onClick={() => onUpdate({ textColor: c })}
                    className={cn("w-5 h-5 rounded border", section.textColor === c ? "border-[#04D1FC]" : "border-zinc-200")}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>
          )}
          {/* Bold/Italic for simple mode */}
          {!section.useTitleSegments && (
            <div className="flex items-center gap-1">
              <Button
                variant={section.titleFontWeight === '700' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onUpdate({ titleFontWeight: section.titleFontWeight === '700' ? '400' : '700' })}
                className="h-7 w-7 p-0"
              >
                <Bold className="w-3 h-3" />
              </Button>
              <Button
                variant={section.titleFontStyle === 'italic' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onUpdate({ titleFontStyle: section.titleFontStyle === 'italic' ? 'normal' : 'italic' })}
                className="h-7 w-7 p-0"
              >
                <Italic className="w-3 h-3" />
              </Button>
            </div>
          )}
          {/* Title Alignment */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Align</span>
            <div className="flex gap-1 flex-1">
              <Button
                variant={section.titleAlign === 'left' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdate({ titleAlign: 'left' })}
                className="h-6 w-6 p-0"
              >
                <AlignLeft className="w-3 h-3" />
              </Button>
              <Button
                variant={section.titleAlign === 'center' || !section.titleAlign ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdate({ titleAlign: 'center' })}
                className="h-6 w-6 p-0"
              >
                <AlignCenter className="w-3 h-3" />
              </Button>
              <Button
                variant={section.titleAlign === 'right' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdate({ titleAlign: 'right' })}
                className="h-6 w-6 p-0"
              >
                <AlignRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
          {/* Kerning */}
          <div className="flex items-center gap-2">
            <LetterText className="w-3 h-3 text-zinc-400" />
            <span className="text-[10px] text-zinc-400 w-12">Kerning</span>
            <select
              value={section.titleLetterSpacing || '-0.02em'}
              onChange={(e) => onUpdate({ titleLetterSpacing: e.target.value })}
              className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1"
            >
              <option value="-0.05em">Tight</option>
              <option value="-0.02em">Snug</option>
              <option value="0">Normal</option>
              <option value="0.02em">Wide</option>
              <option value="0.05em">Wider</option>
            </select>
          </div>
          {/* Leading */}
          <div className="flex items-center gap-2">
            <AlignVerticalSpaceAround className="w-3 h-3 text-zinc-400" />
            <span className="text-[10px] text-zinc-400 w-12">Leading</span>
            <select
              value={section.titleLineHeight || '1.2'}
              onChange={(e) => onUpdate({ titleLineHeight: parseFloat(e.target.value) })}
              className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1"
            >
              <option value="1">Tight (1.0)</option>
              <option value="1.1">Snug (1.1)</option>
              <option value="1.2">Normal (1.2)</option>
              <option value="1.4">Relaxed (1.4)</option>
              <option value="1.6">Loose (1.6)</option>
            </select>
          </div>
        </div>
      </ActionGroup>

      {/* Vertical Alignment */}
      <ActionGroup label="Vertical Align" icon={AlignCenterVertical} expanded={expanded.verticalAlign} onToggle={() => toggleExpand('verticalAlign')}>
        <VerticalAlignControl 
          value={section.verticalAlign || 'center'} 
          onChange={(v) => onUpdate({ verticalAlign: v })} 
        />
      </ActionGroup>

      {/* Date Badge */}
      <ActionGroup label="Date Badge" icon={Clock} expanded={expanded.dateBadge} onToggle={() => toggleExpand('dateBadge')}>
        <div className="space-y-3">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">Show Badge</span>
            <button
              onClick={() => onUpdate({ showDateBadge: !section.showDateBadge })}
              className={cn(
                "w-9 h-5 rounded-full transition-colors relative",
                section.showDateBadge ? "bg-[#04D1FC]" : "bg-zinc-200"
              )}
            >
              <div
                className={cn(
                  "w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform",
                  section.showDateBadge ? "translate-x-4" : "translate-x-0.5"
                )}
              />
            </button>
          </div>
          
          {section.showDateBadge && (
            <>
              {/* Badge Text */}
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Text</span>
                <input
                  type="text"
                  value={section.dateBadgeText || 'JULY 2025'}
                  onChange={(e) => onUpdate({ dateBadgeText: e.target.value })}
                  placeholder="JULY 2025"
                  className="w-full h-7 px-2 text-xs rounded border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#04D1FC]"
                />
              </div>
              
              {/* Badge Colors */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-zinc-400">BG</span>
                  <input
                    type="color"
                    value={section.dateBadgeBg || '#04D1FC'}
                    onChange={(e) => onUpdate({ dateBadgeBg: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border border-zinc-200"
                  />
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-[9px] text-zinc-400">Text</span>
                  <input
                    type="color"
                    value={section.dateBadgeColor || '#FFFFFF'}
                    onChange={(e) => onUpdate({ dateBadgeColor: e.target.value })}
                    className="w-5 h-5 rounded cursor-pointer border border-zinc-200"
                  />
                </div>
              </div>
              
              {/* Badge Position */}
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <span className="text-[10px] text-zinc-400 font-medium">Position Offset</span>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-400 w-10">X</span>
                  <NumberStepper
                    value={section.dateBadgeOffsetX || 0}
                    onChange={(v) => onUpdate({ dateBadgeOffsetX: v })}
                    min={-200}
                    max={200}
                    step={5}
                    suffix="px"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-zinc-400 w-10">Y</span>
                  <NumberStepper
                    value={section.dateBadgeOffsetY || 0}
                    onChange={(v) => onUpdate({ dateBadgeOffsetY: v })}
                    min={-200}
                    max={200}
                    step={5}
                    suffix="px"
                  />
                </div>
              </div>
            </>
          )}
        </div>
      </ActionGroup>

      {/* Outer Frame (card style) */}
      {renderOuterWrapperControls()}
    </>
  );

  const renderTextControls = () => (
    <>
      {/* Text Content Editor */}
      <ActionGroup label="Content" icon={Type} expanded={expanded.content} onToggle={() => toggleExpand('content')}>
        <textarea
          value={section.content || ''}
          onChange={(e) => onUpdate({ content: e.target.value })}
          placeholder="Enter your text here..."
          className="w-full h-24 p-2 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#04D1FC] focus:border-transparent resize-none"
          dir={section.textDirection || 'ltr'}
          style={{ textAlign: section.textAlign || 'right' }}
        />
      </ActionGroup>

      {/* Text Direction & Alignment */}
      {renderTextDirectionControls()}
      
      {/* Vertical Alignment */}
      <ActionGroup label="Vertical Align" icon={AlignCenterVertical} expanded={expanded.verticalAlign} onToggle={() => toggleExpand('verticalAlign')}>
        <VerticalAlignControl 
          value={section.verticalAlign || 'center'} 
          onChange={(v) => onUpdate({ verticalAlign: v })} 
        />
      </ActionGroup>

      {/* Font Size */}
      <ActionGroup label="Size" icon={Type} expanded={expanded.size} onToggle={() => toggleExpand('size')}>
        <NumberStepper
          value={section.fontSize || 16}
          onChange={(v) => onUpdate({ fontSize: v })}
          min={10}
          max={48}
          suffix="px"
        />
      </ActionGroup>

      {/* Kerning & Leading */}
      <ActionGroup label="Typography" icon={LetterText} expanded={expanded.typography} onToggle={() => toggleExpand('typography')}>
        <div className="space-y-2">
          {/* Kerning */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-14">Kerning</span>
            <select
              value={section.letterSpacing || '0'}
              onChange={(e) => onUpdate({ letterSpacing: e.target.value })}
              className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1"
            >
              <option value="-0.05em">Tight</option>
              <option value="-0.02em">Snug</option>
              <option value="0">Normal</option>
              <option value="0.02em">Wide</option>
              <option value="0.05em">Wider</option>
              <option value="0.1em">Widest</option>
            </select>
          </div>
          {/* Leading */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-14">Leading</span>
            <select
              value={section.lineHeight || '1.5'}
              onChange={(e) => onUpdate({ lineHeight: parseFloat(e.target.value) })}
              className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1"
            >
              <option value="1">Tight (1.0)</option>
              <option value="1.25">Snug (1.25)</option>
              <option value="1.5">Normal (1.5)</option>
              <option value="1.75">Relaxed (1.75)</option>
              <option value="2">Loose (2.0)</option>
            </select>
          </div>
        </div>
      </ActionGroup>

      {/* Background */}
      {renderBackgroundControls()}

      {/* Outer Frame (card style) */}
      {renderOuterWrapperControls()}

      {/* Divider */}
      {renderDividerControls()}
    </>
  );

  const renderSectionHeaderControls = () => (
    <>
      {/* Title Text Editor */}
      <ActionGroup label="Title Text" icon={Type} expanded={expanded.titleText} onToggle={() => toggleExpand('titleText')}>
        <input
          type="text"
          value={section.text || ''}
          onChange={(e) => onUpdate({ text: e.target.value })}
          placeholder="Enter section title..."
          className="w-full h-8 px-2 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#04D1FC] focus:border-transparent"
        />
      </ActionGroup>

      {/* Font Family */}
      <ActionGroup label="Font Family" icon={Type} expanded={expanded.fontFamily} onToggle={() => toggleExpand('fontFamily')}>
        <select
          value={section.fontFamily || 'Poppins'}
          onChange={(e) => onUpdate({ fontFamily: e.target.value })}
          className="w-full h-7 text-xs rounded border border-zinc-200 px-2"
        >
          <option value="Noto Sans Hebrew">Noto Sans Hebrew</option>
          <option value="Poppins">Poppins (English)</option>
          <option value="Inter">Inter (English)</option>
          <option value="Assistant">Assistant</option>
          <option value="Heebo">Heebo</option>
        </select>
      </ActionGroup>

      {/* Text Color */}
      <ActionGroup label="Text Color" icon={Palette} expanded={expanded.textColor} onToggle={() => toggleExpand('textColor')}>
        <div className="space-y-2">
          <div className="flex gap-1 flex-wrap">
            {['#FFFFFF', '#000000', '#1D1D1F', '#04D1FC', '#17A298', '#F2D64C', '#FF7B3E'].map(color => (
              <button
                key={color}
                onClick={() => onUpdate({ color: color })}
                className={cn(
                  "w-6 h-6 rounded border-2 transition-transform hover:scale-110",
                  section.color === color ? "border-[#04D1FC] scale-110" : "border-transparent"
                )}
                style={{ backgroundColor: color }}
                title={color}
              />
            ))}
            <label className="w-6 h-6 rounded border border-dashed border-zinc-300 flex items-center justify-center cursor-pointer hover:border-zinc-400">
              <input
                type="color"
                value={section.color || '#FFFFFF'}
                onChange={(e) => onUpdate({ color: e.target.value })}
                className="sr-only"
              />
              <Palette className="w-3 h-3 text-zinc-400" />
            </label>
          </div>
        </div>
      </ActionGroup>

      {/* Background */}
      {renderBackgroundControls()}

      <ActionGroup label="Size" icon={Type} expanded={expanded.size} onToggle={() => toggleExpand('size')}>
        <NumberStepper
          value={section.fontSize || 18}
          onChange={(v) => onUpdate({ fontSize: v })}
          min={12}
          max={36}
          suffix="px"
        />
      </ActionGroup>

      {/* Kerning */}
      <ActionGroup label="Kerning" icon={LetterText} expanded={expanded.kerning} onToggle={() => toggleExpand('kerning')}>
        <select
          value={section.letterSpacing || '0.1em'}
          onChange={(e) => onUpdate({ letterSpacing: e.target.value })}
          className="w-full h-7 text-xs rounded border border-zinc-200 px-2"
        >
          <option value="0">Normal</option>
          <option value="0.05em">Wide</option>
          <option value="0.1em">Wider</option>
          <option value="0.15em">Widest</option>
          <option value="0.2em">Ultra Wide</option>
        </select>
      </ActionGroup>

      {/* Vertical Alignment */}
      <ActionGroup label="Vertical Align" icon={AlignCenterVertical} expanded={expanded.verticalAlign} onToggle={() => toggleExpand('verticalAlign')}>
        <VerticalAlignControl 
          value={section.verticalAlign || 'center'} 
          onChange={(v) => onUpdate({ verticalAlign: v })} 
        />
      </ActionGroup>

      {/* Horizontal Alignment */}
      <ActionGroup label="Horizontal Align" icon={AlignCenter} expanded={expanded.horizontalAlign} onToggle={() => toggleExpand('horizontalAlign')}>
        <div className="flex gap-0.5">
          {[
            { value: 'left', icon: AlignLeft, label: 'Left' },
            { value: 'center', icon: AlignCenter, label: 'Center' },
            { value: 'right', icon: AlignRight, label: 'Right' },
          ].map(({ value, icon: Icon, label }) => (
            <Button
              key={value}
              variant={section.textAlign === value ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onUpdate({ textAlign: value })}
              className="h-7 w-7 p-0"
              title={label}
            >
              <Icon className="w-3.5 h-3.5" />
            </Button>
          ))}
        </div>
      </ActionGroup>

      {/* Divider */}
      {renderDividerControls()}
    </>
  );

  const renderImageCollageControls = () => (
    <>
      {/* Layout Presets - Using original CollagePresetPicker */}
      <ActionGroup label="Layout" icon={Grid3X3} expanded={expanded.layout} onToggle={() => toggleExpand('layout')}>
        <CollagePresetPicker
          currentPreset={section.layout || 'single'}
          onSelectPreset={(presetId) => onUpdate({ layout: presetId })}
        />
      </ActionGroup>

      {/* Image Upload */}
      <ActionGroup label="Images" icon={Image} expanded={expanded.images} onToggle={() => toggleExpand('images')}>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept="image/*"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []);
            const promises = files.map(file => {
              return new Promise((resolve) => {
                const reader = new FileReader();
                reader.onload = (ev) => resolve(ev.target.result);
                reader.readAsDataURL(file);
              });
            });
            Promise.all(promises).then(images => {
              onUpdate({ images: [...(section.images || []), ...images] });
            });
          }}
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="h-7 text-xs w-full"
        >
          <Upload className="w-3 h-3" />
          Add Images ({section.images?.length || 0})
        </Button>
      </ActionGroup>

      {/* Gap & Height */}
      <ActionGroup label="Spacing" icon={Layers} expanded={expanded.spacing} onToggle={() => toggleExpand('spacing')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-10">Gap</span>
            <NumberStepper
              value={section.gap || 8}
              onChange={(v) => onUpdate({ gap: v })}
              min={0}
              max={32}
              suffix="px"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-10">Height</span>
            <NumberStepper
              value={section.imageHeight || 200}
              onChange={(v) => onUpdate({ imageHeight: v })}
              min={20}
              max={600}
              step={10}
              suffix="px"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-10">Padding</span>
            <NumberStepper
              value={section.padding ?? 20}
              onChange={(v) => onUpdate({ padding: v })}
              min={0}
              max={60}
              step={5}
              suffix="px"
            />
          </div>
        </div>
      </ActionGroup>
    </>
  );

  const renderImageSequenceControls = () => {
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

      onUpdate({ images: [...sequenceImages, ...newImages] });
    };

    const removeSequenceImage = (index) => {
      const newImages = sequenceImages.filter((_, i) => i !== index);
      onUpdate({ images: newImages });
    };

    const clearAllImages = () => {
      onUpdate({ images: [] });
    };

    const handleExportGif = async () => {
      if (sequenceImages.length < 2) {
        alert('Add at least 2 images to create a GIF');
        return;
      }
      
      setIsExportingGif(true);
      setGifProgress(0);
      
      try {
        const result = await exportSequenceAsGif(sequenceImages, {
          width: 600,
          height: section.previewHeight || 300,
          delay: section.frameDuration || 500,
          backgroundColor: section.backgroundColor || '#FFFFFF',
          onProgress: setGifProgress
        });
        
        // Convert blob to data URL and replace section with image collage
        // Use exact dimensions from export
        const reader = new FileReader();
        reader.onloadend = () => {
          const dataUrl = reader.result;
          onReplace?.({
            type: 'imageCollage',
            layout: 'single',
            images: [dataUrl],
            imageHeight: result.height,
            gap: 0,
            padding: 0,
            backgroundColor: section.backgroundColor || '#FFFFFF'
          });
        };
        reader.readAsDataURL(result.blob);
      } catch (error) {
        console.error('GIF export failed:', error);
        alert('GIF export failed: ' + error.message);
      } finally {
        setIsExportingGif(false);
        setGifProgress(0);
      }
    };

    return (
      <>
        {/* Upload Images */}
        <ActionGroup label="Frames" icon={Film} expanded={expanded.frames} onToggle={() => toggleExpand('frames')}>
          <div className="space-y-3">
            {/* Upload Area */}
            <div 
              className="border-2 border-dashed border-zinc-200 rounded-lg p-3 text-center hover:border-[#04D1FC] transition-colors cursor-pointer"
              onClick={() => sequenceInputRef.current?.click()}
              onDrop={(e) => {
                e.preventDefault();
                handleSequenceImageUpload(e.dataTransfer.files);
              }}
              onDragOver={(e) => e.preventDefault()}
            >
              <Upload className="w-5 h-5 mx-auto mb-1 text-zinc-400" />
              <p className="text-[10px] text-zinc-500 mb-0.5">Drop images or click</p>
              <p className="text-[9px] text-zinc-400">{sequenceImages.length} frames</p>
              <input
                ref={sequenceInputRef}
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                onChange={(e) => handleSequenceImageUpload(e.target.files)}
              />
            </div>

            {/* Frame Thumbnails */}
            {sequenceImages.length > 0 && (
              <div className="space-y-2">
                <div className="grid grid-cols-4 gap-1.5 max-h-32 overflow-y-auto">
                  {sequenceImages.map((img, index) => (
                    <div key={index} className="relative group aspect-square rounded overflow-hidden border border-zinc-200">
                      <img src={img} alt={`Frame ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeSequenceImage(index)}
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-black/60 text-white rounded-full text-[10px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      >
                        ×
                      </button>
                      <span className="absolute bottom-0.5 left-0.5 bg-black/60 text-white text-[8px] px-1 rounded">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={clearAllImages}
                  className="h-6 text-[10px] w-full"
                >
                  <Trash2 className="w-3 h-3" />
                  Clear All
                </Button>
              </div>
            )}
          </div>
        </ActionGroup>

        {/* Timing */}
        <ActionGroup label="Timing" icon={Clock} expanded={expanded.timing} onToggle={() => toggleExpand('timing')}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-14">Duration</span>
              <select
                value={section.frameDuration || 500}
                onChange={(e) => onUpdate({ frameDuration: parseInt(e.target.value) })}
                className="flex-1 h-7 text-xs rounded border border-zinc-200 px-2"
              >
                <option value={200}>200ms (Fast)</option>
                <option value={300}>300ms</option>
                <option value={500}>500ms</option>
                <option value={750}>750ms</option>
                <option value={1000}>1s</option>
                <option value={1500}>1.5s</option>
                <option value={2000}>2s (Slow)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-14">Height</span>
              <NumberStepper
                value={section.previewHeight || 300}
                onChange={(v) => onUpdate({ previewHeight: v })}
                min={150}
                max={600}
                step={25}
                suffix="px"
              />
            </div>
          </div>
        </ActionGroup>

        {/* Display Options */}
        <ActionGroup label="Options" icon={Settings} expanded={expanded.options} onToggle={() => toggleExpand('options')}>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-[10px] text-zinc-600 cursor-pointer">
              <input
                type="checkbox"
                checked={section.autoPlay !== false}
                onChange={(e) => onUpdate({ autoPlay: e.target.checked })}
                className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC] w-3.5 h-3.5"
              />
              Auto-play animation
            </label>
            <label className="flex items-center gap-2 text-[10px] text-zinc-600 cursor-pointer">
              <input
                type="checkbox"
                checked={section.showControls || false}
                onChange={(e) => onUpdate({ showControls: e.target.checked })}
                className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC] w-3.5 h-3.5"
              />
              Show play/pause
            </label>
            <label className="flex items-center gap-2 text-[10px] text-zinc-600 cursor-pointer">
              <input
                type="checkbox"
                checked={section.showThumbnails || false}
                onChange={(e) => onUpdate({ showThumbnails: e.target.checked })}
                className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC] w-3.5 h-3.5"
              />
              Show thumbnails
            </label>
            <label className="flex items-center gap-2 text-[10px] text-zinc-600 cursor-pointer">
              <input
                type="checkbox"
                checked={section.showFrameCounter || false}
                onChange={(e) => onUpdate({ showFrameCounter: e.target.checked })}
                className="rounded border-zinc-300 text-[#04D1FC] focus:ring-[#04D1FC] w-3.5 h-3.5"
              />
              Show frame counter
            </label>
          </div>
        </ActionGroup>

        {/* Convert to GIF */}
        {sequenceImages.length >= 2 && (
          <ActionGroup label="Convert" icon={FileImage} expanded={expanded.export} onToggle={() => toggleExpand('export')}>
            <div className="space-y-2">
              <p className="text-[9px] text-zinc-400">Convert to animated GIF image section</p>
              <Button
                size="sm"
                onClick={handleExportGif}
                disabled={isExportingGif}
                className="h-8 text-xs w-full"
              >
                {isExportingGif ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    {gifProgress}%
                  </>
                ) : (
                  <>
                    <FileImage className="w-3.5 h-3.5" />
                    Convert to GIF Image
                  </>
                )}
              </Button>
            </div>
          </ActionGroup>
        )}

        {/* Background */}
        {renderBackgroundControls()}
      </>
    );
  };

  const renderMarqueeControls = () => {
    const getItemsArray = () => {
      const raw = section.items;
      if (Array.isArray(raw)) return raw;
      if (typeof raw === 'string') {
        return raw.split(',').map(s => s.trim()).filter(Boolean).map(v => ({ type: 'text', value: v }));
      }
      return [];
    };

    const itemsArray = getItemsArray();

    const updateItems = (newItems) => onUpdate({ items: newItems });

    const addTextLayer = () => updateItems([...itemsArray, { type: 'text', value: 'New item' }]);
    const addImageLayer = () => updateItems([...itemsArray, { type: 'image', src: '' }]);

    const updateItemAt = (index, patch) => {
      const next = [...itemsArray];
      next[index] = { ...next[index], ...patch };
      updateItems(next);
    };

    const removeItemAt = (index) => updateItems(itemsArray.filter((_, i) => i !== index));

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

    return (
    <>
      {/* Layers */}
      <ActionGroup label="Layers" icon={Layers} expanded={expanded.content} onToggle={() => toggleExpand('content')}>
        <div className="space-y-1.5">
          {itemsArray.map((item, i) => (
            <div key={i} className="flex items-center gap-1 p-1.5 bg-zinc-50 rounded border border-zinc-200">
              <div className={cn(
                'flex-shrink-0 w-5 h-5 rounded flex items-center justify-center',
                item.type === 'image' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'
              )}>
                {item.type === 'image' ? <FileImage className="w-2.5 h-2.5" /> : <Type className="w-2.5 h-2.5" />}
              </div>
              <div className="flex-1 min-w-0">
                {item.type === 'image' ? (
                  item.src ? (
                    <img src={item.src} alt="" className="w-6 h-6 object-contain rounded" />
                  ) : (
                    <label className="flex items-center gap-1 cursor-pointer text-[9px] text-zinc-400 hover:text-zinc-600">
                      <Upload className="w-2.5 h-2.5" />
                      Upload
                      <input type="file" accept="image/png,image/svg+xml,image/webp,image/gif" className="hidden"
                        onChange={(e) => handleImageUpload(i, e.target.files?.[0])} />
                    </label>
                  )
                ) : (
                  <input
                    type="text"
                    value={item.value || ''}
                    onChange={(e) => updateItemAt(i, { value: e.target.value })}
                    className="w-full h-5 px-1 text-[10px] rounded border border-zinc-200 bg-white"
                  />
                )}
              </div>
              <button onClick={() => removeItemAt(i)} className="p-0.5 text-zinc-400 hover:text-red-500">
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
          <div className="flex gap-1 pt-0.5">
            <button onClick={addTextLayer} className="flex-1 flex items-center justify-center gap-1 h-6 rounded border border-dashed border-zinc-300 hover:border-[#04D1FC] text-[9px] text-zinc-500 hover:text-[#04D1FC]">
              + Text
            </button>
            <button onClick={addImageLayer} className="flex-1 flex items-center justify-center gap-1 h-6 rounded border border-dashed border-zinc-300 hover:border-purple-400 text-[9px] text-zinc-500 hover:text-purple-500">
              + Image
            </button>
          </div>
        </div>
      </ActionGroup>

      {/* Colors */}
      <ActionGroup label="Colors" icon={Palette} expanded={expanded.colors} onToggle={() => toggleExpand('colors')}>
        <div className="flex gap-3">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-400">Bg</span>
            <input
              type="color"
              value={section.backgroundColor || '#04D1FC'}
              onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border border-zinc-200"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-zinc-400">Text</span>
            <input
              type="color"
              value={section.textColor || '#FFFFFF'}
              onChange={(e) => handleColorChange('textColor', e.target.value)}
              className="w-6 h-6 rounded cursor-pointer border border-zinc-200"
            />
          </div>
        </div>
      </ActionGroup>

      {/* Animation */}
      <ActionGroup label="Animation" icon={Move} expanded={expanded.animation} onToggle={() => toggleExpand('animation')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-14">Speed</span>
            <select
              value={section.speed || 30}
              onChange={(e) => onUpdate({ speed: parseInt(e.target.value) })}
              className="h-7 text-xs rounded border border-zinc-200 px-2 flex-1"
            >
              <option value={10}>Very Fast</option>
              <option value={15}>Fast</option>
              <option value={30}>Medium</option>
              <option value={60}>Slow</option>
              <option value={90}>Very Slow</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-14">Direction</span>
            <div className="flex gap-1 flex-1">
              <Button
                variant={section.direction !== 'right' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onUpdate({ direction: 'left' })}
                className="h-7 text-xs flex-1"
              >
                ← Left
              </Button>
              <Button
                variant={section.direction === 'right' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onUpdate({ direction: 'right' })}
                className="h-7 text-xs flex-1"
              >
                Right →
              </Button>
            </div>
          </div>
        </div>
      </ActionGroup>

      {/* Typography */}
      <ActionGroup label="Typography" icon={Type} expanded={expanded.typography} onToggle={() => toggleExpand('typography')}>
        <div className="space-y-2">
          {/* Google Fonts Picker */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Font Family</span>
            <select
              value={section.fontFamily || 'Poppins'}
              onChange={(e) => {
                const fontName = e.target.value;
                loadGoogleFont(fontName);
                onUpdate({ fontFamily: getFontStack(fontName) });
              }}
              className="w-full h-7 text-xs rounded border border-zinc-200 px-2"
              style={{ fontFamily: section.fontFamily || "'Poppins'" }}
            >
              <optgroup label="Hebrew (RTL)">
                {GOOGLE_FONTS.filter(f => f.category === 'hebrew').map(font => (
                  <option key={font.name} value={getFontStack(font.name)} style={{ fontFamily: `'${font.name}'` }}>
                    {font.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Sans-Serif">
                {GOOGLE_FONTS.filter(f => f.category === 'sans-serif').map(font => (
                  <option key={font.name} value={getFontStack(font.name)} style={{ fontFamily: `'${font.name}'` }}>
                    {font.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Serif">
                {GOOGLE_FONTS.filter(f => f.category === 'serif').map(font => (
                  <option key={font.name} value={getFontStack(font.name)} style={{ fontFamily: `'${font.name}'` }}>
                    {font.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Display">
                {GOOGLE_FONTS.filter(f => f.category === 'display').map(font => (
                  <option key={font.name} value={getFontStack(font.name)} style={{ fontFamily: `'${font.name}'` }}>
                    {font.name}
                  </option>
                ))}
              </optgroup>
              <optgroup label="Monospace">
                {GOOGLE_FONTS.filter(f => f.category === 'monospace').map(font => (
                  <option key={font.name} value={getFontStack(font.name)} style={{ fontFamily: `'${font.name}'` }}>
                    {font.name}
                  </option>
                ))}
              </optgroup>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-10">Size</span>
            <NumberStepper
              value={section.fontSize || 16}
              onChange={(v) => onUpdate({ fontSize: v })}
              min={10}
              max={72}
              suffix="px"
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-10">Weight</span>
            <select
              value={section.fontWeight || '500'}
              onChange={(e) => onUpdate({ fontWeight: e.target.value })}
              className="h-7 text-xs rounded border border-zinc-200 px-2 flex-1"
            >
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semi Bold</option>
              <option value="700">Bold</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-10">Sep.</span>
            <select
              value={section.separator || '•'}
              onChange={(e) => onUpdate({ separator: e.target.value })}
              className="h-7 text-xs rounded border border-zinc-200 px-2 flex-1"
            >
              <option value="•">• Bullet</option>
              <option value="|">| Pipe</option>
              <option value="·">· Dot</option>
              <option value="-">- Dash</option>
              <option value="★">★ Star</option>
              <option value="◆">◆ Diamond</option>
              <option value=" "> None</option>
            </select>
          </div>
        </div>
      </ActionGroup>

      {/* Spacing */}
      <ActionGroup label="Spacing" icon={Layers} expanded={expanded.spacing} onToggle={() => toggleExpand('spacing')}>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-zinc-400 w-14">Padding</span>
          <NumberStepper
            value={section.paddingVertical || 12}
            onChange={(v) => onUpdate({ paddingVertical: v })}
            min={4}
            max={40}
            suffix="px"
          />
        </div>
      </ActionGroup>

      {/* Convert to GIF */}
      <ActionGroup label="Convert" icon={Film} expanded={expanded.export} onToggle={() => toggleExpand('export')}>
        <div className="space-y-2">
          <p className="text-[9px] text-zinc-400">Convert to animated GIF image section</p>
          <Button
            variant="outline"
            size="sm"
            onClick={async () => {
              setIsExportingGif(true);
              setGifProgress(0);
              try {
                const result = await exportMarqueeAsGif(section, {
                  width: 600,
                  onProgress: setGifProgress
                });
                
                // Convert blob to data URL and replace section
                // Use exact dimensions from export to prevent size changes
                const reader = new FileReader();
                reader.onloadend = () => {
                  const dataUrl = reader.result;
                  
                  onReplace?.({
                    type: 'imageCollage',
                    layout: 'single',
                    images: [dataUrl],
                    imageHeight: result.height,
                    gap: 0,
                    padding: 0,
                    backgroundColor: section.backgroundColor || '#04D1FC'
                  });
                };
                reader.readAsDataURL(result.blob);
              } catch (error) {
                console.error('GIF export failed:', error);
                alert('GIF export failed: ' + error.message);
              } finally {
                setIsExportingGif(false);
                setGifProgress(0);
              }
            }}
            disabled={isExportingGif}
            className="h-8 text-xs w-full"
          >
            {isExportingGif ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                {gifProgress > 0 ? `${gifProgress}%` : 'Converting...'}
              </>
            ) : (
              <>
                <Film className="w-3.5 h-3.5 mr-1.5" />
                Convert to GIF Image
              </>
            )}
          </Button>
        </div>
      </ActionGroup>
    </>
  );
  };

  const renderFooterControls = () => (
    <>
      <ActionGroup label="Colors" icon={Palette} expanded={expanded.colors} onToggle={() => toggleExpand('colors')}>
        <div className="flex gap-1 flex-wrap">
          {QUICK_COLORS.map(color => (
            <button
              key={color}
              onClick={() => handleColorChange('backgroundColor', color)}
              className={cn(
                "w-6 h-6 rounded border-2 transition-transform hover:scale-110",
                section.backgroundColor === color ? "border-zinc-900" : "border-zinc-200"
              )}
              style={{ backgroundColor: color }}
            />
          ))}
        </div>
      </ActionGroup>
      <ActionGroup label="Size" icon={Type} expanded={expanded.size} onToggle={() => toggleExpand('size')}>
        <NumberStepper
          value={section.fontSize || 14}
          onChange={(v) => onUpdate({ fontSize: v })}
          min={10}
          max={24}
          suffix="px"
        />
      </ActionGroup>
    </>
  );

  const renderProfileCardsControls = () => {
    // Get current profiles or create default ones
    const numColumns = section.columns || 4;
    const profiles = (section.profiles && section.profiles.length > 0) 
      ? section.profiles 
      : Array(numColumns).fill(null).map((_, i) => ({
          name: `Name ${i + 1}`,
          title: 'Position',
          image: null
        }));

    const updateProfile = (index, field, value) => {
      const newProfiles = [...profiles];
      if (!newProfiles[index]) {
        newProfiles[index] = { name: '', title: '', image: null };
      }
      newProfiles[index] = { ...newProfiles[index], [field]: value };
      onUpdate({ profiles: newProfiles });
    };

    return (
      <>
        <ActionGroup label="Columns" icon={Grid3X3} expanded={expanded.columns} onToggle={() => toggleExpand('columns')}>
          <div className="flex gap-1">
            {[2, 3, 4].map(cols => (
              <Button
                key={cols}
                variant={section.columns === cols ? 'default' : 'ghost'}
                size="sm"
                onClick={() => onUpdate({ columns: cols })}
                className="h-7 w-7 p-0"
              >
                {cols}
              </Button>
            ))}
          </div>
        </ActionGroup>

        <ActionGroup label="Shape" icon={Image} expanded={expanded.shape} onToggle={() => toggleExpand('shape')}>
          <div className="flex gap-1">
            <Button
              variant={section.imageShape === 'circular' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onUpdate({ imageShape: 'circular' })}
              className="h-7 text-xs flex-1"
            >
              Circle
            </Button>
            <Button
              variant={section.imageShape === 'square' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onUpdate({ imageShape: 'square' })}
              className="h-7 text-xs flex-1"
            >
              Square
            </Button>
          </div>
        </ActionGroup>

        {/* Profile Editing */}
        <ActionGroup label="Profiles" icon={Type} expanded={expanded.profiles} onToggle={() => toggleExpand('profiles')}>
          <div className="space-y-3 max-h-[300px] overflow-y-auto">
            {profiles.slice(0, numColumns).map((profile, index) => (
              <div key={index} className="space-y-2 p-2 bg-zinc-50 rounded-lg">
                <p className="text-[9px] text-zinc-400 font-medium">Profile {index + 1}</p>
                
                {/* Profile Image */}
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-12 h-12 bg-zinc-200 flex items-center justify-center overflow-hidden flex-shrink-0 relative",
                    section.imageShape === 'circular' ? "rounded-full" : "rounded-lg"
                  )}>
                    {profile?.image ? (
                      <img src={profile.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-6 h-6 text-zinc-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-1">
                    <label className="block">
                      <span className="sr-only">Upload image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => {
                              updateProfile(index, 'image', ev.target?.result);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="block w-full text-[10px] text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded file:border-0 file:text-[10px] file:font-medium file:bg-zinc-100 file:text-zinc-700 hover:file:bg-zinc-200"
                      />
                    </label>
                    {profile?.image && (
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={async () => {
                            if (!profile.image) return;
                            setIsProcessing(true);
                            try {
                              const base64Data = profile.image.split(',')[1];
                              if (!base64Data) throw new Error('Invalid image');
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
                              if (!response.ok) throw new Error('API error');
                              const resultBlob = await response.blob();
                              const reader = new FileReader();
                              reader.onload = () => updateProfile(index, 'image', reader.result);
                              reader.readAsDataURL(resultBlob);
                            } catch (err) {
                              alert('Failed to remove background');
                            } finally {
                              setIsProcessing(false);
                            }
                          }}
                          disabled={isProcessing}
                          className="h-5 px-2 text-[10px] text-zinc-600 hover:text-zinc-800 hover:bg-zinc-100"
                          title="Remove background"
                        >
                          {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => updateProfile(index, 'image', null)}
                          className="h-5 px-2 text-[10px] text-red-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Name Input */}
                <input
                  type="text"
                  value={profile?.name || ''}
                  onChange={(e) => updateProfile(index, 'name', e.target.value)}
                  placeholder="Name..."
                  className="w-full h-7 px-2 text-xs rounded border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#04D1FC] focus:border-transparent"
                />
                
                {/* Title Input */}
                <input
                  type="text"
                  value={profile?.title || ''}
                  onChange={(e) => updateProfile(index, 'title', e.target.value)}
                  placeholder="Title/Position..."
                  className="w-full h-7 px-2 text-xs rounded border border-zinc-200 focus:outline-none focus:ring-1 focus:ring-[#04D1FC] focus:border-transparent"
                />
                
                {/* Image Background Layer */}
                {profile?.image && (
                  <div className="pt-2 border-t border-zinc-200 mt-2">
                    <p className="text-[9px] text-zinc-400 font-medium mb-1">Image Background</p>
                    <div className="flex gap-1 mb-1">
                      <button
                        onClick={() => updateProfile(index, 'bgType', 'none')}
                        className={cn(
                          "flex-1 h-6 text-[9px] rounded border",
                          (!profile.bgType || profile.bgType === 'none') ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200"
                        )}
                      >
                        None
                      </button>
                      <button
                        onClick={() => updateProfile(index, 'bgType', 'solid')}
                        className={cn(
                          "flex-1 h-6 text-[9px] rounded border",
                          profile.bgType === 'solid' ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200"
                        )}
                      >
                        Solid
                      </button>
                      <button
                        onClick={() => updateProfile(index, 'bgType', 'gradient')}
                        className={cn(
                          "flex-1 h-6 text-[9px] rounded border",
                          profile.bgType === 'gradient' ? "bg-zinc-900 text-white border-zinc-900" : "bg-white text-zinc-600 border-zinc-200"
                        )}
                      >
                        Gradient
                      </button>
                    </div>
                    {profile.bgType === 'solid' && (
                      <div className="flex gap-1 flex-wrap">
                        {QUICK_COLORS.map(color => (
                          <button
                            key={color}
                            onClick={() => updateProfile(index, 'bgColor', color)}
                            className={cn(
                              "w-5 h-5 rounded border transition-transform hover:scale-110",
                              profile.bgColor === color ? "border-zinc-900 ring-1 ring-zinc-900" : "border-zinc-200"
                            )}
                            style={{ backgroundColor: color }}
                          />
                        ))}
                        <input
                          type="color"
                          value={profile.bgColor || '#ffffff'}
                          onChange={(e) => updateProfile(index, 'bgColor', e.target.value)}
                          className="w-5 h-5 rounded cursor-pointer"
                        />
                      </div>
                    )}
                    {profile.bgType === 'gradient' && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          <input
                            type="color"
                            value={profile.bgGradientStart || '#04D1FC'}
                            onChange={(e) => updateProfile(index, 'bgGradientStart', e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer"
                          />
                          <span className="text-[9px] text-zinc-400">→</span>
                          <input
                            type="color"
                            value={profile.bgGradientEnd || '#7C3AED'}
                            onChange={(e) => updateProfile(index, 'bgGradientEnd', e.target.value)}
                            className="w-6 h-6 rounded cursor-pointer"
                          />
                        </div>
                        <select
                          value={profile.bgGradientDirection || 'to bottom'}
                          onChange={(e) => updateProfile(index, 'bgGradientDirection', e.target.value)}
                          className="w-full h-6 text-[9px] rounded border border-zinc-200 px-1"
                        >
                          <option value="to bottom">↓ Top to Bottom</option>
                          <option value="to top">↑ Bottom to Top</option>
                          <option value="to right">→ Left to Right</option>
                          <option value="to left">← Right to Left</option>
                          <option value="to bottom right">↘ Diagonal</option>
                        </select>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ActionGroup>

        {/* Vertical Alignment */}
        <ActionGroup label="Vertical Align" icon={AlignCenterVertical} expanded={expanded.verticalAlign} onToggle={() => toggleExpand('verticalAlign')}>
          <VerticalAlignControl 
            value={section.verticalAlign || 'center'} 
            onChange={(v) => onUpdate({ verticalAlign: v })} 
          />
        </ActionGroup>

        {/* Background */}
        {renderBackgroundControls()}

        {/* Divider */}
        {renderDividerControls()}
      </>
    );
  };

  const renderRecipeControls = () => (
    <>
      {/* Recipe Image */}
      <ActionGroup label="Recipe Image" icon={Image} expanded={expanded.recipeImage} onToggle={() => toggleExpand('recipeImage')}>
        <div className="space-y-3">
          {section.image ? (
            <div className="relative rounded-lg overflow-hidden">
              <img 
                src={section.image} 
                alt="Recipe" 
                className="w-full h-24 object-cover"
              />
              <div className="absolute top-1 right-1 flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleRemoveBackground('image')}
                  disabled={isProcessing}
                  className="h-6 w-6 p-0 bg-white/80 hover:bg-white"
                  title="Remove background"
                >
                  {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdate({ image: null })}
                  className="h-6 w-6 p-0 bg-white/80 hover:bg-red-50 text-red-500"
                >
                  <X className="w-3 h-3" />
                </Button>
              </div>
            </div>
          ) : (
            <>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept="image/*"
                onChange={(e) => handleFileUpload(e, 'image')}
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="h-8 text-xs w-full"
              >
                <Upload className="w-3 h-3 mr-1.5" />
                Upload Recipe Image
              </Button>
            </>
          )}
          
          {/* Image Fill Mode */}
          {section.image && (
            <div className="space-y-2 pt-2 border-t border-zinc-100">
              <p className="text-[10px] text-zinc-400 font-medium">Fill Mode</p>
              <div className="flex gap-1">
                {[
                  { value: 'cover', label: 'Cover' },
                  { value: 'contain', label: 'Contain' },
                  { value: 'fill', label: 'Fill' }
                ].map(mode => (
                  <button
                    key={mode.value}
                    onClick={() => onUpdate({ imageFit: mode.value })}
                    className={cn(
                      "flex-1 h-6 text-[9px] rounded border transition-colors",
                      section.imageFit === mode.value || (!section.imageFit && mode.value === 'cover')
                        ? "bg-zinc-900 text-white border-zinc-900"
                        : "bg-white text-zinc-600 border-zinc-200 hover:border-zinc-300"
                    )}
                  >
                    {mode.label}
                  </button>
                ))}
              </div>
              
              {/* Image Height */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 w-12">Height</span>
                <NumberStepper
                  value={section.imageHeight || 200}
                  onChange={(v) => onUpdate({ imageHeight: v })}
                  min={100}
                  max={1000}
                  step={20}
                  suffix="px"
                />
              </div>
            </div>
          )}
        </div>
      </ActionGroup>

      {/* Recipe Title */}
      <ActionGroup label="Title" icon={Type} expanded={expanded.recipeTitle} onToggle={() => toggleExpand('recipeTitle')}>
        <input
          type="text"
          value={section.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          placeholder="Recipe Title..."
          className="w-full h-8 px-2 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#04D1FC] focus:border-transparent"
        />
      </ActionGroup>

      {/* Ingredients */}
      <ActionGroup label="Ingredients" icon={Type} expanded={expanded.ingredients} onToggle={() => toggleExpand('ingredients')}>
        <textarea
          value={section.ingredients || ''}
          onChange={(e) => onUpdate({ ingredients: e.target.value })}
          placeholder="Enter ingredients..."
          className="w-full h-24 p-2 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#04D1FC] focus:border-transparent resize-none"
        />
      </ActionGroup>

      {/* Instructions */}
      <ActionGroup label="Instructions" icon={Type} expanded={expanded.instructions} onToggle={() => toggleExpand('instructions')}>
        <textarea
          value={section.instructions || ''}
          onChange={(e) => onUpdate({ instructions: e.target.value })}
          placeholder="Enter instructions..."
          className="w-full h-24 p-2 text-sm rounded-lg border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-[#04D1FC] focus:border-transparent resize-none"
        />
      </ActionGroup>
      
      {/* Background */}
      {renderBackgroundControls()}

      {/* Divider */}
      {renderDividerControls()}
    </>
  );

  // Stats Section Controls
  const renderStatsControls = () => (
    <>
      <ActionGroup label="Content" icon={Type} expanded={expanded.content} onToggle={() => toggleExpand('content')}>
        <div className="space-y-3">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Title</label>
            <input
              type="text"
              value={section.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full h-8 px-2 text-xs rounded border border-zinc-200"
              placeholder="Section title..."
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Subtitle</label>
            <input
              type="text"
              value={section.subtitle || ''}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
              className="w-full h-8 px-2 text-xs rounded border border-zinc-200"
              placeholder="Section subtitle..."
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Columns</label>
            <div className="flex gap-1">
              {[2, 3, 4].map(cols => (
                <Button
                  key={cols}
                  variant={section.columns === cols ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdate({ columns: cols })}
                  className="flex-1 h-7 text-xs"
                >
                  {cols}
                </Button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-zinc-400 w-16">Dividers</label>
            <input type="checkbox" checked={section.showDividers !== false} onChange={(e) => onUpdate({ showDividers: e.target.checked })} />
          </div>
        </div>
      </ActionGroup>
      
      {/* Title Typography */}
      <ActionGroup label="Title Style" icon={LetterText} expanded={expanded.titleStyle} onToggle={() => toggleExpand('titleStyle')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper value={section.titleFontSize || 32} onChange={(v) => onUpdate({ titleFontSize: v })} min={12} max={72} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Weight</span>
            <select value={section.titleFontWeight || '700'} onChange={(e) => onUpdate({ titleFontWeight: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
              <option value="800">Extra Bold</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Color</span>
            <input type="color" value={section.textColor || '#000000'} onChange={(e) => onUpdate({ textColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {/* Value Typography */}
      <ActionGroup label="Value Style" icon={LetterText} expanded={expanded.valueStyle} onToggle={() => toggleExpand('valueStyle')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper value={section.valueFontSize || 48} onChange={(v) => onUpdate({ valueFontSize: v })} min={16} max={96} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Weight</span>
            <select value={section.valueFontWeight || '400'} onChange={(e) => onUpdate({ valueFontWeight: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
              <option value="800">Extra Bold</option>
            </select>
          </div>
        </div>
      </ActionGroup>
      
      {/* Label Typography */}
      <ActionGroup label="Label Style" icon={LetterText} expanded={expanded.labelStyle} onToggle={() => toggleExpand('labelStyle')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper value={section.labelFontSize || 14} onChange={(v) => onUpdate({ labelFontSize: v })} min={10} max={24} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Weight</span>
            <select value={section.labelFontWeight || '400'} onChange={(e) => onUpdate({ labelFontWeight: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Color</span>
            <input type="color" value={section.labelColor || '#666666'} onChange={(e) => onUpdate({ labelColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {/* Spacing */}
      <ActionGroup label="Spacing" icon={AlignVerticalSpaceAround} expanded={expanded.spacing} onToggle={() => toggleExpand('spacing')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">V Pad</span>
            <NumberStepper value={section.paddingVertical || 40} onChange={(v) => onUpdate({ paddingVertical: v })} min={0} max={100} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">H Pad</span>
            <NumberStepper value={section.paddingHorizontal || 24} onChange={(v) => onUpdate({ paddingHorizontal: v })} min={0} max={100} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Gap</span>
            <NumberStepper value={section.gap || 24} onChange={(v) => onUpdate({ gap: v })} min={0} max={60} suffix="px" />
          </div>
        </div>
      </ActionGroup>
      
      {renderFontFamilyControl()}
      {renderTextDirectionControls()}
      {renderBackgroundControls()}
      {renderLineDividerControls()}
    </>
  );

  // Feature Grid Section Controls
  const renderFeatureGridControls = () => (
    <>
      <ActionGroup label="Image" icon={Image} expanded={expanded.image} onToggle={() => toggleExpand('image')}>
        <div className="space-y-3">
          {section.image ? (
            <div className="relative rounded-lg overflow-hidden">
              <img src={section.image} alt="Feature" className="w-full h-24 object-contain bg-zinc-100" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate({ image: '' })}
                className="absolute top-1 right-1 h-6 w-6 p-0 bg-white/80 hover:bg-red-50 text-red-500"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <>
              <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={(e) => handleFileUpload(e, 'image')} />
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="h-8 text-xs w-full">
                <Upload className="w-3 h-3 mr-1.5" />
                Upload Image
              </Button>
            </>
          )}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-14">Height</span>
            <NumberStepper value={section.imageHeight || 300} onChange={(v) => onUpdate({ imageHeight: v })} min={100} max={600} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-14">Position</span>
            <select value={section.imagePosition || 'top'} onChange={(e) => onUpdate({ imagePosition: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        </div>
      </ActionGroup>
      
      <ActionGroup label="Content" icon={Type} expanded={expanded.content} onToggle={() => toggleExpand('content')}>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Title</label>
            <input
              type="text"
              value={section.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full h-8 px-2 text-xs rounded border border-zinc-200"
              placeholder="Title..."
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Subtitle</label>
            <input
              type="text"
              value={section.subtitle || ''}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
              className="w-full h-8 px-2 text-xs rounded border border-zinc-200"
              placeholder="Subtitle..."
            />
          </div>
          <div className="flex gap-1">
            <span className="text-[10px] text-zinc-400 w-14">Columns</span>
            {[2, 3, 4].map(cols => (
              <Button
                key={cols}
                variant={section.featureColumns === cols ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdate({ featureColumns: cols })}
                className="flex-1 h-7 text-xs"
              >
                {cols}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-zinc-400 w-14">Numbers</label>
            <input type="checkbox" checked={section.showNumbers !== false} onChange={(e) => onUpdate({ showNumbers: e.target.checked })} />
          </div>
        </div>
      </ActionGroup>
      
      {/* Title Typography */}
      <ActionGroup label="Title Style" icon={LetterText} expanded={expanded.titleStyle} onToggle={() => toggleExpand('titleStyle')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper value={section.titleFontSize || 56} onChange={(v) => onUpdate({ titleFontSize: v })} min={16} max={96} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Weight</span>
            <select value={section.titleFontWeight || '700'} onChange={(e) => onUpdate({ titleFontWeight: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
              <option value="800">Extra Bold</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Color</span>
            <input type="color" value={section.textColor || '#1D1D1F'} onChange={(e) => onUpdate({ textColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {/* Feature Typography */}
      <ActionGroup label="Feature Style" icon={LetterText} expanded={expanded.featureStyle} onToggle={() => toggleExpand('featureStyle')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Title</span>
            <NumberStepper value={section.featureTitleFontSize || 14} onChange={(v) => onUpdate({ featureTitleFontSize: v })} min={10} max={24} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Desc</span>
            <NumberStepper value={section.featureDescFontSize || 14} onChange={(v) => onUpdate({ featureDescFontSize: v })} min={10} max={24} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Color</span>
            <input type="color" value={section.accentColor || '#86868B'} onChange={(e) => onUpdate({ accentColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {/* Spacing */}
      <ActionGroup label="Spacing" icon={AlignVerticalSpaceAround} expanded={expanded.spacing} onToggle={() => toggleExpand('spacing')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">V Pad</span>
            <NumberStepper value={section.paddingVertical || 48} onChange={(v) => onUpdate({ paddingVertical: v })} min={0} max={100} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">H Pad</span>
            <NumberStepper value={section.paddingHorizontal || 24} onChange={(v) => onUpdate({ paddingHorizontal: v })} min={0} max={100} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Gap</span>
            <NumberStepper value={section.gap || 24} onChange={(v) => onUpdate({ gap: v })} min={0} max={60} suffix="px" />
          </div>
        </div>
      </ActionGroup>
      
      {renderFontFamilyControl()}
      {renderTextDirectionControls()}
      {renderBackgroundControls()}
      {renderLineDividerControls()}
    </>
  );

  // Specs Table Section Controls
  const renderSpecsTableControls = () => (
    <>
      <ActionGroup label="Content" icon={Type} expanded={expanded.content} onToggle={() => toggleExpand('content')}>
        <div className="space-y-2">
          <input
            type="text"
            value={section.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full h-8 px-2 text-xs rounded border border-zinc-200"
            placeholder="Section title..."
          />
        </div>
      </ActionGroup>
      
      {/* Title Typography */}
      <ActionGroup label="Title Style" icon={LetterText} expanded={expanded.titleStyle} onToggle={() => toggleExpand('titleStyle')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper value={section.titleFontSize || 40} onChange={(v) => onUpdate({ titleFontSize: v })} min={16} max={72} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Weight</span>
            <select value={section.titleFontWeight || '700'} onChange={(e) => onUpdate({ titleFontWeight: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="300">Light</option>
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
              <option value="800">Extra Bold</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Color</span>
            <input type="color" value={section.textColor || '#1D1D1F'} onChange={(e) => onUpdate({ textColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {/* Label Typography */}
      <ActionGroup label="Label Style" icon={LetterText} expanded={expanded.labelStyle} onToggle={() => toggleExpand('labelStyle')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper value={section.labelFontSize || 14} onChange={(v) => onUpdate({ labelFontSize: v })} min={10} max={24} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Weight</span>
            <select value={section.labelFontWeight || '600'} onChange={(e) => onUpdate({ labelFontWeight: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Color</span>
            <input type="color" value={section.labelColor || '#1D1D1F'} onChange={(e) => onUpdate({ labelColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {/* Value Typography */}
      <ActionGroup label="Value Style" icon={LetterText} expanded={expanded.valueStyle} onToggle={() => toggleExpand('valueStyle')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper value={section.valueFontSize || 14} onChange={(v) => onUpdate({ valueFontSize: v })} min={10} max={24} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Weight</span>
            <select value={section.valueFontWeight || '400'} onChange={(e) => onUpdate({ valueFontWeight: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Color</span>
            <input type="color" value={section.valueColor || '#86868B'} onChange={(e) => onUpdate({ valueColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {/* Spacing */}
      <ActionGroup label="Spacing" icon={AlignVerticalSpaceAround} expanded={expanded.spacing} onToggle={() => toggleExpand('spacing')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">V Pad</span>
            <NumberStepper value={section.paddingVertical || 48} onChange={(v) => onUpdate({ paddingVertical: v })} min={0} max={100} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">H Pad</span>
            <NumberStepper value={section.paddingHorizontal || 24} onChange={(v) => onUpdate({ paddingHorizontal: v })} min={0} max={100} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Row Pad</span>
            <NumberStepper value={section.rowPadding || 16} onChange={(v) => onUpdate({ rowPadding: v })} min={8} max={40} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Divider</span>
            <input type="color" value={section.dividerColor || '#D2D2D7'} onChange={(e) => onUpdate({ dividerColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {renderFontFamilyControl()}
      {renderTextDirectionControls()}
      {renderBackgroundControls()}
      {renderLineDividerControls()}
    </>
  );

  // Contact Cards Section Controls
  const renderContactCardsControls = () => (
    <>
      <ActionGroup label="Layout" icon={Layers} expanded={expanded.layout} onToggle={() => toggleExpand('layout')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-zinc-400 w-12">Dividers</label>
            <input type="checkbox" checked={section.showDividers !== false} onChange={(e) => onUpdate({ showDividers: e.target.checked })} />
          </div>
        </div>
      </ActionGroup>
      
      {/* City Typography */}
      <ActionGroup label="City Style" icon={LetterText} expanded={expanded.cityStyle} onToggle={() => toggleExpand('cityStyle')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper value={section.cityFontSize || 28} onChange={(v) => onUpdate({ cityFontSize: v })} min={14} max={48} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Weight</span>
            <select value={section.cityFontWeight || '600'} onChange={(e) => onUpdate({ cityFontWeight: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Color</span>
            <input type="color" value={section.textColor || '#1D1D1F'} onChange={(e) => onUpdate({ textColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {/* Info Typography */}
      <ActionGroup label="Info Style" icon={LetterText} expanded={expanded.infoStyle} onToggle={() => toggleExpand('infoStyle')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper value={section.infoFontSize || 13} onChange={(v) => onUpdate({ infoFontSize: v })} min={10} max={20} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Weight</span>
            <select value={section.infoFontWeight || '400'} onChange={(e) => onUpdate({ infoFontWeight: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Color</span>
            <input type="color" value={section.labelColor || '#86868B'} onChange={(e) => onUpdate({ labelColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {/* Spacing */}
      <ActionGroup label="Spacing" icon={AlignVerticalSpaceAround} expanded={expanded.spacing} onToggle={() => toggleExpand('spacing')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">V Pad</span>
            <NumberStepper value={section.paddingVertical || 32} onChange={(v) => onUpdate({ paddingVertical: v })} min={0} max={100} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">H Pad</span>
            <NumberStepper value={section.paddingHorizontal || 24} onChange={(v) => onUpdate({ paddingHorizontal: v })} min={0} max={100} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Card Pad</span>
            <NumberStepper value={section.cardPadding || 24} onChange={(v) => onUpdate({ cardPadding: v })} min={8} max={48} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Divider</span>
            <input type="color" value={section.dividerColor || '#D2D2D7'} onChange={(e) => onUpdate({ dividerColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {renderFontFamilyControl()}
      {renderTextDirectionControls()}
      {renderBackgroundControls()}
      {renderLineDividerControls()}
    </>
  );

  // Steps Section Controls
  const renderStepsControls = () => (
    <>
      <ActionGroup label="Content" icon={Type} expanded={expanded.content} onToggle={() => toggleExpand('content')}>
        <div className="space-y-2">
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Section Label</label>
            <input
              type="text"
              value={section.sectionLabel || ''}
              onChange={(e) => onUpdate({ sectionLabel: e.target.value })}
              className="w-full h-7 px-2 text-xs rounded border border-zinc-200"
              placeholder="SECTION LABEL"
            />
          </div>
          <div>
            <label className="text-[10px] text-zinc-400 block mb-1">Title</label>
            <input
              type="text"
              value={section.title || ''}
              onChange={(e) => onUpdate({ title: e.target.value })}
              className="w-full h-8 px-2 text-xs rounded border border-zinc-200"
              placeholder="Section title..."
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[10px] text-zinc-400 w-12">Dividers</label>
            <input type="checkbox" checked={section.showDividers !== false} onChange={(e) => onUpdate({ showDividers: e.target.checked })} />
          </div>
        </div>
      </ActionGroup>
      
      {/* Section Label Typography */}
      <ActionGroup label="Label Style" icon={LetterText} expanded={expanded.sectionLabelStyle} onToggle={() => toggleExpand('sectionLabelStyle')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper value={section.sectionLabelFontSize || 11} onChange={(v) => onUpdate({ sectionLabelFontSize: v })} min={8} max={16} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Weight</span>
            <select value={section.sectionLabelFontWeight || '500'} onChange={(e) => onUpdate({ sectionLabelFontWeight: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Color</span>
            <input type="color" value={section.labelColor || '#86868B'} onChange={(e) => onUpdate({ labelColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {/* Title Typography */}
      <ActionGroup label="Title Style" icon={LetterText} expanded={expanded.titleStyle} onToggle={() => toggleExpand('titleStyle')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper value={section.titleFontSize || 32} onChange={(v) => onUpdate({ titleFontSize: v })} min={16} max={56} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Weight</span>
            <select value={section.titleFontWeight || '700'} onChange={(e) => onUpdate({ titleFontWeight: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
              <option value="700">Bold</option>
              <option value="800">Extra Bold</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Color</span>
            <input type="color" value={section.textColor || '#1D1D1F'} onChange={(e) => onUpdate({ textColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {/* Step Typography */}
      <ActionGroup label="Step Style" icon={LetterText} expanded={expanded.stepStyle} onToggle={() => toggleExpand('stepStyle')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Num Size</span>
            <NumberStepper value={section.numberFontSize || 12} onChange={(v) => onUpdate({ numberFontSize: v })} min={10} max={20} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Title Size</span>
            <NumberStepper value={section.stepTitleFontSize || 16} onChange={(v) => onUpdate({ stepTitleFontSize: v })} min={12} max={24} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Weight</span>
            <select value={section.stepTitleFontWeight || '400'} onChange={(e) => onUpdate({ stepTitleFontWeight: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semibold</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Note Size</span>
            <NumberStepper value={section.noteFontSize || 14} onChange={(v) => onUpdate({ noteFontSize: v })} min={10} max={20} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Note Color</span>
            <input type="color" value={section.noteColor || '#86868B'} onChange={(e) => onUpdate({ noteColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {/* Spacing */}
      <ActionGroup label="Spacing" icon={AlignVerticalSpaceAround} expanded={expanded.spacing} onToggle={() => toggleExpand('spacing')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">V Pad</span>
            <NumberStepper value={section.paddingVertical || 48} onChange={(v) => onUpdate({ paddingVertical: v })} min={0} max={100} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">H Pad</span>
            <NumberStepper value={section.paddingHorizontal || 24} onChange={(v) => onUpdate({ paddingHorizontal: v })} min={0} max={100} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Step Pad</span>
            <NumberStepper value={section.stepPadding || 20} onChange={(v) => onUpdate({ stepPadding: v })} min={8} max={40} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Divider</span>
            <input type="color" value={section.dividerColor || '#D2D2D7'} onChange={(e) => onUpdate({ dividerColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {renderFontFamilyControl()}
      {renderTextDirectionControls()}
      {renderBackgroundControls()}
      {renderLineDividerControls()}
    </>
  );

  // NEW SECTION CONTROLS

  const renderAccentTextControls = () => (
    <>
      <ActionGroup label="Tag" icon={Type} expanded={expanded.tag} onToggle={() => toggleExpand('tag')}>
        <div className="space-y-2">
          <input
            type="text"
            value={section.tag || ''}
            onChange={(e) => onUpdate({ tag: e.target.value })}
            className="w-full h-7 px-2 text-xs rounded border border-zinc-200"
            placeholder="Tag text..."
            dir={section.textDirection || 'ltr'}
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-10">BG</span>
            <input type="color" value={section.tagBg || '#04D1FC'} onChange={(e) => onUpdate({ tagBg: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
            <span className="text-[10px] text-zinc-400 w-10">Text</span>
            <input type="color" value={section.tagColor || '#FFFFFF'} onChange={(e) => onUpdate({ tagColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          {/* Tag Position */}
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Tag Position</span>
            <select
              value={section.tagPosition || 'sidebar-right'}
              onChange={(e) => onUpdate({ tagPosition: e.target.value })}
              className="w-full h-7 px-2 text-xs rounded border border-zinc-200"
            >
              <option value="sidebar-right">Sidebar Right</option>
              <option value="sidebar-left">Sidebar Left</option>
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
              <option value="top-center">Top Center</option>
            </select>
          </div>
          {/* Tag Height */}
          <div className="flex items-center gap-2 pt-2 border-t border-zinc-100">
            <span className="text-[10px] text-zinc-400 w-12">Height</span>
            <div className="flex items-center gap-1 flex-1">
              <button
                onClick={() => onUpdate({ tagHeight: 'auto' })}
                className={cn(
                  "px-2 py-1 rounded text-[9px] font-medium transition-colors",
                  section.tagHeight === 'auto' || !section.tagHeight
                    ? "bg-zinc-900 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                )}
              >
                Auto
              </button>
              {section.tagHeight !== 'auto' && section.tagHeight ? (
                <NumberStepper
                  value={section.tagHeight}
                  onChange={(v) => onUpdate({ tagHeight: v })}
                  min={40}
                  max={400}
                  step={10}
                  suffix="px"
                />
              ) : (
                <button
                  onClick={() => onUpdate({ tagHeight: 100 })}
                  className="px-2 py-1 rounded text-[9px] font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                >
                  Set Height
                </button>
              )}
            </div>
          </div>
          {/* Tag Gap */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Gap</span>
            <NumberStepper
              value={section.tagGap || 24}
              onChange={(v) => onUpdate({ tagGap: v })}
              min={0}
              max={80}
              step={4}
              suffix="px"
            />
          </div>
          {/* Tag Horizontal Offset */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Offset X</span>
            <NumberStepper
              value={section.tagOffsetX || 0}
              onChange={(v) => onUpdate({ tagOffsetX: v })}
              min={-100}
              max={100}
              step={5}
              suffix="px"
            />
          </div>
        </div>
      </ActionGroup>
      
      <ActionGroup label="Content" icon={Type} expanded={expanded.content} onToggle={() => toggleExpand('content')}>
        <textarea
          value={section.content || ''}
          onChange={(e) => onUpdate({ content: e.target.value })}
          className="w-full h-24 p-2 text-sm rounded-lg border border-zinc-200 resize-none"
          placeholder="Content..."
          dir={section.textDirection || 'ltr'}
        />
      </ActionGroup>
      
      <ActionGroup label="Accent Line" icon={Palette} expanded={expanded.accent} onToggle={() => toggleExpand('accent')}>
        <div className="space-y-2">
          {/* Show Accent Bar Toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-400">Show Accent Bar</span>
            <input 
              type="checkbox" 
              checked={section.showAccentBar || false} 
              onChange={(e) => onUpdate({ showAccentBar: e.target.checked })}
              className="w-4 h-4 rounded"
            />
          </div>
          {section.showAccentBar && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 w-12">Position</span>
                <div className="flex gap-1 flex-1">
                  <Button
                    variant={(section.accentPosition || 'right') === 'left' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onUpdate({ accentPosition: 'left' })}
                    className="flex-1 h-6 text-xs"
                  >
                    Left
                  </Button>
                  <Button
                    variant={(section.accentPosition || 'right') === 'right' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => onUpdate({ accentPosition: 'right' })}
                    className="flex-1 h-6 text-xs"
                  >
                    Right
                  </Button>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 w-12">Color</span>
                <input type="color" value={section.accentColor || '#04D1FC'} onChange={(e) => onUpdate({ accentColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 w-12">Width</span>
                <NumberStepper value={section.accentWidth || 4} onChange={(v) => onUpdate({ accentWidth: v })} min={2} max={12} suffix="px" />
              </div>
            </>
          )}
        </div>
      </ActionGroup>
      
      <ActionGroup label="Typography" icon={LetterText} expanded={expanded.typography} onToggle={() => toggleExpand('typography')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper value={section.fontSize || 16} onChange={(v) => onUpdate({ fontSize: v })} min={12} max={24} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Color</span>
            <input type="color" value={section.textColor || '#1D1D1F'} onChange={(e) => onUpdate({ textColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {renderFontFamilyControl()}
      {renderTextDirectionControls()}
      {renderBackgroundControls()}
      {renderLineDividerControls()}
    </>
  );

  const renderFeatureCardsControls = () => (
    <>
      <ActionGroup label="Layout" icon={Grid3X3} expanded={expanded.layout} onToggle={() => toggleExpand('layout')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Columns</span>
            <NumberStepper value={section.columns || 2} onChange={(v) => onUpdate({ columns: v })} min={1} max={3} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Gap</span>
            <NumberStepper value={section.gap || 24} onChange={(v) => onUpdate({ gap: v })} min={8} max={48} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Img H</span>
            <NumberStepper value={section.imageHeight || 180} onChange={(v) => onUpdate({ imageHeight: v })} min={100} max={400} suffix="px" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">Labels</span>
            <input type="checkbox" checked={section.showLabels !== false} onChange={(e) => onUpdate({ showLabels: e.target.checked })} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">CTA Links</span>
            <input type="checkbox" checked={section.showCta !== false} onChange={(e) => onUpdate({ showCta: e.target.checked })} />
          </div>
        </div>
      </ActionGroup>
      
      <ActionGroup label="Cards" icon={Layers} expanded={expanded.cards} onToggle={() => toggleExpand('cards')}>
        <div className="space-y-3">
          {(section.cards || []).map((card, index) => (
            <div key={index} className="p-2 border border-zinc-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-medium">Card {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newCards = [...(section.cards || [])];
                    newCards.splice(index, 1);
                    onUpdate({ cards: newCards });
                  }}
                  className="h-5 w-5 p-0 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <input
                type="text"
                value={card.title || ''}
                onChange={(e) => {
                  const newCards = [...(section.cards || [])];
                  newCards[index] = { ...newCards[index], title: e.target.value };
                  onUpdate({ cards: newCards });
                }}
                className="w-full h-6 px-2 text-xs rounded border border-zinc-200"
                placeholder="Title..."
                dir={section.textDirection || 'ltr'}
              />
              <textarea
                value={card.description || ''}
                onChange={(e) => {
                  const newCards = [...(section.cards || [])];
                  newCards[index] = { ...newCards[index], description: e.target.value };
                  onUpdate({ cards: newCards });
                }}
                className="w-full h-12 p-1 text-xs rounded border border-zinc-200 resize-none"
                placeholder="Description..."
                dir={section.textDirection || 'ltr'}
              />
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const newCards = [...(section.cards || [])];
                        newCards[index] = { ...newCards[index], image: ev.target?.result };
                        onUpdate({ cards: newCards });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                  id={`card-image-${index}`}
                />
                <label
                  htmlFor={`card-image-${index}`}
                  className="flex-1 flex items-center justify-center gap-1 h-6 rounded bg-zinc-100 hover:bg-zinc-200 text-xs cursor-pointer"
                >
                  <Upload className="w-3 h-3" /> Image
                </label>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newCards = [...(section.cards || [])];
              newCards.push({ image: '', label: 'New', title: 'New title', description: 'Description...', cta: 'Learn more', ctaUrl: '#' });
              onUpdate({ cards: newCards });
            }}
            className="w-full h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" /> Add Card
          </Button>
        </div>
      </ActionGroup>
      
      <ActionGroup label="Colors" icon={Palette} expanded={expanded.colors} onToggle={() => toggleExpand('colors')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Card BG</span>
            <input type="color" value={section.cardBg || '#FFFFFF'} onChange={(e) => onUpdate({ cardBg: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Text</span>
            <input type="color" value={section.textColor || '#1D1D1F'} onChange={(e) => onUpdate({ textColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Label</span>
            <input type="color" value={section.labelColor || '#86868B'} onChange={(e) => onUpdate({ labelColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">CTA</span>
            <input type="color" value={section.ctaColor || '#5856D6'} onChange={(e) => onUpdate({ ctaColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {renderFontFamilyControl()}
      {renderTextDirectionControls()}
      {renderBackgroundControls()}
      {renderLineDividerControls()}
    </>
  );

  const renderUpdatesListControls = () => (
    <>
      <ActionGroup label="Header" icon={Type} expanded={expanded.header} onToggle={() => toggleExpand('header')}>
        <div className="space-y-2">
          <input
            type="text"
            value={section.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full h-7 px-2 text-xs rounded border border-zinc-200"
            placeholder="Title..."
            dir={section.textDirection || 'ltr'}
          />
          <input
            type="text"
            value={section.headerCta || ''}
            onChange={(e) => onUpdate({ headerCta: e.target.value })}
            className="w-full h-7 px-2 text-xs rounded border border-zinc-200"
            placeholder="Header CTA..."
            dir={section.textDirection || 'ltr'}
          />
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">Show Icons</span>
            <input type="checkbox" checked={section.showIcons !== false} onChange={(e) => onUpdate({ showIcons: e.target.checked })} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">Dividers</span>
            <input type="checkbox" checked={section.showDividers !== false} onChange={(e) => onUpdate({ showDividers: e.target.checked })} />
          </div>
        </div>
      </ActionGroup>
      
      <ActionGroup label="Items" icon={Layers} expanded={expanded.items} onToggle={() => toggleExpand('items')}>
        <div className="space-y-3">
          {(section.items || []).map((item, index) => (
            <div key={index} className="p-2 border border-zinc-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-medium">Item {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newItems = [...(section.items || [])];
                    newItems.splice(index, 1);
                    onUpdate({ items: newItems });
                  }}
                  className="h-5 w-5 p-0 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={item.icon || ''}
                  onChange={(e) => {
                    const newItems = [...(section.items || [])];
                    newItems[index] = { ...newItems[index], icon: e.target.value };
                    onUpdate({ items: newItems });
                  }}
                  className="w-12 h-6 px-1 text-center text-sm rounded border border-zinc-200"
                  placeholder="🎯"
                />
                <input
                  type="color"
                  value={item.iconBg || '#F0F0F0'}
                  onChange={(e) => {
                    const newItems = [...(section.items || [])];
                    newItems[index] = { ...newItems[index], iconBg: e.target.value };
                    onUpdate({ items: newItems });
                  }}
                  className="w-6 h-6 rounded cursor-pointer"
                />
              </div>
              <input
                type="text"
                value={item.title || ''}
                onChange={(e) => {
                  const newItems = [...(section.items || [])];
                  newItems[index] = { ...newItems[index], title: e.target.value };
                  onUpdate({ items: newItems });
                }}
                className="w-full h-6 px-2 text-xs rounded border border-zinc-200"
                placeholder="Title..."
                dir={section.textDirection || 'ltr'}
              />
              <textarea
                value={item.description || ''}
                onChange={(e) => {
                  const newItems = [...(section.items || [])];
                  newItems[index] = { ...newItems[index], description: e.target.value };
                  onUpdate({ items: newItems });
                }}
                className="w-full h-12 p-1 text-xs rounded border border-zinc-200 resize-none"
                placeholder="Description..."
                dir={section.textDirection || 'ltr'}
              />
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newItems = [...(section.items || [])];
              newItems.push({ icon: '📌', iconBg: '#E8E0FF', title: 'New item', description: 'Description...', cta: 'Learn more', ctaUrl: '#' });
              onUpdate({ items: newItems });
            }}
            className="w-full h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" /> Add Item
          </Button>
        </div>
      </ActionGroup>
      
      <ActionGroup label="Colors" icon={Palette} expanded={expanded.colors} onToggle={() => toggleExpand('colors')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Text</span>
            <input type="color" value={section.textColor || '#1D1D1F'} onChange={(e) => onUpdate({ textColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Desc</span>
            <input type="color" value={section.descColor || '#86868B'} onChange={(e) => onUpdate({ descColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">CTA</span>
            <input type="color" value={section.ctaColor || '#5856D6'} onChange={(e) => onUpdate({ ctaColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {renderFontFamilyControl()}
      {renderTextDirectionControls()}
      {renderBackgroundControls()}
      {renderLineDividerControls()}
    </>
  );

  const renderAppCardsControls = () => (
    <>
      <ActionGroup label="Title" icon={Type} expanded={expanded.title} onToggle={() => toggleExpand('title')}>
        <input
          type="text"
          value={section.title || ''}
          onChange={(e) => onUpdate({ title: e.target.value })}
          className="w-full h-7 px-2 text-xs rounded border border-zinc-200"
          placeholder="Section title..."
          dir={section.textDirection || 'ltr'}
        />
      </ActionGroup>
      
      <ActionGroup label="Layout" icon={Grid3X3} expanded={expanded.layout} onToggle={() => toggleExpand('layout')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Columns</span>
            <NumberStepper value={section.columns || 3} onChange={(v) => onUpdate({ columns: v })} min={1} max={4} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Gap</span>
            <NumberStepper value={section.gap || 20} onChange={(v) => onUpdate({ gap: v })} min={8} max={40} suffix="px" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">Accent Lines</span>
            <input type="checkbox" checked={section.showAccentLine !== false} onChange={(e) => onUpdate({ showAccentLine: e.target.checked })} />
          </div>
        </div>
      </ActionGroup>
      
      <ActionGroup label="Cards" icon={Layers} expanded={expanded.cards} onToggle={() => toggleExpand('cards')}>
        <div className="space-y-3">
          {(section.cards || []).map((card, index) => (
            <div key={index} className="p-2 border border-zinc-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-medium">Card {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newCards = [...(section.cards || [])];
                    newCards.splice(index, 1);
                    onUpdate({ cards: newCards });
                  }}
                  className="h-5 w-5 p-0 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={card.icon || ''}
                  onChange={(e) => {
                    const newCards = [...(section.cards || [])];
                    newCards[index] = { ...newCards[index], icon: e.target.value };
                    onUpdate({ cards: newCards });
                  }}
                  className="w-12 h-6 px-1 text-center text-sm rounded border border-zinc-200"
                  placeholder="🎯"
                />
                <input
                  type="color"
                  value={card.iconBg || '#F0F0F0'}
                  onChange={(e) => {
                    const newCards = [...(section.cards || [])];
                    newCards[index] = { ...newCards[index], iconBg: e.target.value };
                    onUpdate({ cards: newCards });
                  }}
                  className="w-6 h-6 rounded cursor-pointer"
                  title="Icon BG"
                />
                <input
                  type="color"
                  value={card.accentColor || '#5856D6'}
                  onChange={(e) => {
                    const newCards = [...(section.cards || [])];
                    newCards[index] = { ...newCards[index], accentColor: e.target.value };
                    onUpdate({ cards: newCards });
                  }}
                  className="w-6 h-6 rounded cursor-pointer"
                  title="Accent"
                />
              </div>
              <input
                type="text"
                value={card.name || ''}
                onChange={(e) => {
                  const newCards = [...(section.cards || [])];
                  newCards[index] = { ...newCards[index], name: e.target.value };
                  onUpdate({ cards: newCards });
                }}
                className="w-full h-6 px-2 text-xs rounded border border-zinc-200"
                placeholder="Name..."
                dir={section.textDirection || 'ltr'}
              />
              <textarea
                value={card.description || ''}
                onChange={(e) => {
                  const newCards = [...(section.cards || [])];
                  newCards[index] = { ...newCards[index], description: e.target.value };
                  onUpdate({ cards: newCards });
                }}
                className="w-full h-12 p-1 text-xs rounded border border-zinc-200 resize-none"
                placeholder="Description..."
                dir={section.textDirection || 'ltr'}
              />
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newCards = [...(section.cards || [])];
              newCards.push({ icon: '📱', iconBg: '#E8FFE8', name: 'New app', accentColor: '#5856D6', description: 'Description...', cta: 'Try it', ctaUrl: '#' });
              onUpdate({ cards: newCards });
            }}
            className="w-full h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" /> Add Card
          </Button>
        </div>
      </ActionGroup>
      
      <ActionGroup label="Colors" icon={Palette} expanded={expanded.colors} onToggle={() => toggleExpand('colors')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Card BG</span>
            <input type="color" value={section.cardBg || '#FFFFFF'} onChange={(e) => onUpdate({ cardBg: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Text</span>
            <input type="color" value={section.textColor || '#1D1D1F'} onChange={(e) => onUpdate({ textColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">CTA</span>
            <input type="color" value={section.ctaColor || '#5856D6'} onChange={(e) => onUpdate({ ctaColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {renderFontFamilyControl()}
      {renderTextDirectionControls()}
      {renderBackgroundControls()}
      {renderLineDividerControls()}
    </>
  );

  const renderFeatureHighlightControls = () => (
    <>
      <ActionGroup label="Layout" icon={Grid3X3} expanded={expanded.layout} onToggle={() => toggleExpand('layout')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Img W</span>
            <NumberStepper value={section.imageWidth || 280} onChange={(v) => onUpdate({ imageWidth: v })} min={150} max={400} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Img H</span>
            <NumberStepper value={section.imageHeight || 200} onChange={(v) => onUpdate({ imageHeight: v })} min={100} max={400} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Gap</span>
            <NumberStepper value={section.itemGap || 48} onChange={(v) => onUpdate({ itemGap: v })} min={20} max={80} suffix="px" />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-zinc-500">Alternate Layout</span>
            <input type="checkbox" checked={section.alternateLayout !== false} onChange={(e) => onUpdate({ alternateLayout: e.target.checked })} />
          </div>
        </div>
      </ActionGroup>
      
      <ActionGroup label="Highlights" icon={Layers} expanded={expanded.highlights} onToggle={() => toggleExpand('highlights')}>
        <div className="space-y-3">
          {(section.highlights || []).map((highlight, index) => (
            <div key={index} className="p-2 border border-zinc-200 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-zinc-500 font-medium">Highlight {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newHighlights = [...(section.highlights || [])];
                    newHighlights.splice(index, 1);
                    onUpdate({ highlights: newHighlights });
                  }}
                  className="h-5 w-5 p-0 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <input
                type="text"
                value={highlight.title || ''}
                onChange={(e) => {
                  const newHighlights = [...(section.highlights || [])];
                  newHighlights[index] = { ...newHighlights[index], title: e.target.value };
                  onUpdate({ highlights: newHighlights });
                }}
                className="w-full h-6 px-2 text-xs rounded border border-zinc-200"
                placeholder="Title..."
                dir={section.textDirection || 'ltr'}
              />
              <textarea
                value={highlight.description || ''}
                onChange={(e) => {
                  const newHighlights = [...(section.highlights || [])];
                  newHighlights[index] = { ...newHighlights[index], description: e.target.value };
                  onUpdate({ highlights: newHighlights });
                }}
                className="w-full h-12 p-1 text-xs rounded border border-zinc-200 resize-none"
                placeholder="Description..."
                dir={section.textDirection || 'ltr'}
              />
              <div className="flex gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const newHighlights = [...(section.highlights || [])];
                        newHighlights[index] = { ...newHighlights[index], image: ev.target?.result };
                        onUpdate({ highlights: newHighlights });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                  id={`highlight-image-${index}`}
                />
                <label
                  htmlFor={`highlight-image-${index}`}
                  className="flex-1 flex items-center justify-center gap-1 h-6 rounded bg-zinc-100 hover:bg-zinc-200 text-xs cursor-pointer"
                >
                  <Upload className="w-3 h-3" /> Image
                </label>
              </div>
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newHighlights = [...(section.highlights || [])];
              newHighlights.push({ image: '', title: 'New title', description: 'Description...', cta: 'Learn more', ctaUrl: '#' });
              onUpdate({ highlights: newHighlights });
            }}
            className="w-full h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" /> Add Highlight
          </Button>
        </div>
      </ActionGroup>
      
      <ActionGroup label="Colors" icon={Palette} expanded={expanded.colors} onToggle={() => toggleExpand('colors')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Text</span>
            <input type="color" value={section.textColor || '#1D1D1F'} onChange={(e) => onUpdate({ textColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Desc</span>
            <input type="color" value={section.descColor || '#666666'} onChange={(e) => onUpdate({ descColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">CTA</span>
            <input type="color" value={section.ctaColor || '#1D1D1F'} onChange={(e) => onUpdate({ ctaColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {renderFontFamilyControl()}
      {renderTextDirectionControls()}
      {renderBackgroundControls()}
      {renderLineDividerControls()}
    </>
  );

  const renderHeroBannerControls = () => (
    <>
      <ActionGroup label="Title" icon={Type} expanded={expanded.title} onToggle={() => toggleExpand('title')}>
        <div className="space-y-2">
          <input
            type="text"
            value={section.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full h-7 px-2 text-xs rounded border border-zinc-200"
            placeholder="Title..."
            dir={section.textDirection || 'ltr'}
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper value={section.titleFontSize || 72} onChange={(v) => onUpdate({ titleFontSize: v })} min={32} max={200} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Weight</span>
            <select value={section.titleFontWeight || '900'} onChange={(e) => onUpdate({ titleFontWeight: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="400">Regular</option>
              <option value="700">Bold</option>
              <option value="900">Black</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Position</span>
            <select value={section.titlePosition || 'top'} onChange={(e) => onUpdate({ titlePosition: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="top">Above Image</option>
              <option value="overlay">Over Image</option>
              <option value="bottom">Below Image</option>
            </select>
          </div>
        </div>
      </ActionGroup>
      
      <ActionGroup label="Image" icon={Image} expanded={expanded.image} onToggle={() => toggleExpand('image')}>
        <div className="space-y-2">
          {section.image && (
            <div className="relative w-full h-20 bg-zinc-100 rounded overflow-hidden">
              <img src={section.image} alt="Hero" className="w-full h-full object-cover" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate({ image: '' })}
                className="absolute top-1 right-1 h-5 w-5 p-0 bg-white/80 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => onUpdate({ image: ev.target?.result });
                reader.readAsDataURL(file);
              }
            }}
            className="hidden"
            id="hero-banner-image"
          />
          <label
            htmlFor="hero-banner-image"
            className="w-full flex items-center justify-center gap-1 h-7 rounded bg-zinc-100 hover:bg-zinc-200 text-xs cursor-pointer"
          >
            <Upload className="w-3 h-3" /> Upload Image
          </label>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Height</span>
            <NumberStepper value={section.imageHeight || 400} onChange={(v) => onUpdate({ imageHeight: v })} min={200} max={600} suffix="px" />
          </div>
        </div>
      </ActionGroup>
      
      <ActionGroup label="Subtitle" icon={Type} expanded={expanded.subtitle} onToggle={() => toggleExpand('subtitle')}>
        <div className="space-y-2">
          <textarea
            value={section.subtitle || ''}
            onChange={(e) => onUpdate({ subtitle: e.target.value })}
            className="w-full h-16 p-2 text-xs rounded border border-zinc-200 resize-none"
            placeholder="Subtitle..."
            dir={section.textDirection || 'ltr'}
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper value={section.subtitleFontSize || 16} onChange={(v) => onUpdate({ subtitleFontSize: v })} min={12} max={24} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Color</span>
            <input type="color" value={section.subtitleColor || '#666666'} onChange={(e) => onUpdate({ subtitleColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      <ActionGroup label="Colors" icon={Palette} expanded={expanded.colors} onToggle={() => toggleExpand('colors')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Title</span>
            <input type="color" value={section.textColor || '#1D1D1F'} onChange={(e) => onUpdate({ textColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>
      
      {renderFontFamilyControl()}
      {renderTextDirectionControls()}
      {renderBackgroundControls()}
      {renderLineDividerControls()}
    </>
  );

  const renderCelebrationControls = () => (
    <>
      <ActionGroup label="Badge" icon={Type} expanded={expanded.badge} onToggle={() => toggleExpand('badge')}>
        <div className="space-y-2">
          <input
            type="text"
            value={section.badgeText || ''}
            onChange={(e) => onUpdate({ badgeText: e.target.value })}
            className="w-full h-7 px-2 text-xs rounded border border-zinc-200"
            placeholder="Badge text..."
            dir={section.textDirection || 'ltr'}
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper value={section.badgeFontSize || 16} onChange={(v) => onUpdate({ badgeFontSize: v })} min={12} max={24} suffix="px" />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-zinc-400">BG</span>
              <input type="color" value={section.badgeColor || '#04D1FC'} onChange={(e) => onUpdate({ badgeColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer" />
            </div>
            <div className="flex items-center gap-1">
              <span className="text-[9px] text-zinc-400">Text</span>
              <input type="color" value={section.badgeTextColor || '#FFFFFF'} onChange={(e) => onUpdate({ badgeTextColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer" />
            </div>
          </div>
        </div>
      </ActionGroup>

      <ActionGroup label="Names" icon={Users} expanded={expanded.names} onToggle={() => toggleExpand('names')}>
        <textarea
          value={section.names || ''}
          onChange={(e) => onUpdate({ names: e.target.value })}
          className="w-full h-20 p-2 text-xs rounded border border-zinc-200 resize-none"
          placeholder="Enter names..."
          dir={section.textDirection || 'ltr'}
        />
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-zinc-400 w-12">Size</span>
          <NumberStepper value={section.nameFontSize || 18} onChange={(v) => onUpdate({ nameFontSize: v })} min={12} max={32} suffix="px" />
        </div>
      </ActionGroup>

      <ActionGroup label="Message" icon={Type} expanded={expanded.message} onToggle={() => toggleExpand('message')}>
        <textarea
          value={section.message || ''}
          onChange={(e) => onUpdate({ message: e.target.value })}
          className="w-full h-16 p-2 text-xs rounded border border-zinc-200 resize-none"
          placeholder="Enter message..."
          dir={section.textDirection || 'ltr'}
        />
        <div className="flex items-center gap-2 mt-2">
          <span className="text-[10px] text-zinc-400 w-12">Size</span>
          <NumberStepper value={section.messageFontSize || 18} onChange={(v) => onUpdate({ messageFontSize: v })} min={12} max={32} suffix="px" />
        </div>
      </ActionGroup>

      <ActionGroup label="Accent" icon={Palette} expanded={expanded.accent} onToggle={() => toggleExpand('accent')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Color</span>
            <input type="color" value={section.accentColor || '#FF6B6B'} onChange={(e) => onUpdate({ accentColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Width</span>
            <NumberStepper value={section.accentWidth || 4} onChange={(v) => onUpdate({ accentWidth: v })} min={2} max={12} suffix="px" />
          </div>
        </div>
      </ActionGroup>

      {renderFontFamilyControl()}
      {renderTextDirectionControls()}
      {renderBackgroundControls()}
    </>
  );

  const renderHeroSplitControls = () => (
    <>
      <ActionGroup label="Headline" icon={Type} expanded={expanded.headline} onToggle={() => toggleExpand('headline')}>
        <div className="space-y-2">
          <textarea
            value={section.headline || ''}
            onChange={(e) => onUpdate({ headline: e.target.value })}
            className="w-full h-16 p-2 text-xs rounded border border-zinc-200 resize-none"
            placeholder="Enter headline..."
            dir={section.textDirection || 'ltr'}
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper value={section.headlineFontSize || 48} onChange={(v) => onUpdate({ headlineFontSize: v })} min={24} max={96} suffix="px" />
          </div>
        </div>
      </ActionGroup>

      <ActionGroup label="Description" icon={Type} expanded={expanded.description} onToggle={() => toggleExpand('description')}>
        <div className="space-y-2">
          <textarea
            value={section.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="w-full h-24 p-2 text-xs rounded border border-zinc-200 resize-none"
            placeholder="Enter description..."
            dir={section.textDirection || 'ltr'}
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Size</span>
            <NumberStepper value={section.descFontSize || 16} onChange={(v) => onUpdate({ descFontSize: v })} min={12} max={24} suffix="px" />
          </div>
        </div>
      </ActionGroup>

      <ActionGroup label="Link" icon={Type} expanded={expanded.link} onToggle={() => toggleExpand('link')}>
        <div className="space-y-2">
          <input
            type="text"
            value={section.linkText || ''}
            onChange={(e) => onUpdate({ linkText: e.target.value })}
            className="w-full h-7 px-2 text-xs rounded border border-zinc-200"
            placeholder="Link text..."
            dir={section.textDirection || 'ltr'}
          />
          <input
            type="text"
            value={section.linkUrl || '#'}
            onChange={(e) => onUpdate({ linkUrl: e.target.value })}
            className="w-full h-7 px-2 text-xs rounded border border-zinc-200"
            placeholder="Link URL..."
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Color</span>
            <input type="color" value={section.linkColor || '#5856D6'} onChange={(e) => onUpdate({ linkColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>

      <ActionGroup label="Image" icon={Image} expanded={expanded.image} onToggle={() => toggleExpand('image')}>
        <div className="space-y-2">
          {section.image && (
            <div className="relative w-full h-20 bg-zinc-100 rounded overflow-hidden">
              <img src={section.image} alt="Hero" className="w-full h-full object-cover" />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onUpdate({ image: '' })}
                className="absolute top-1 right-1 h-5 w-5 p-0 bg-white/80 hover:bg-red-50"
              >
                <Trash2 className="w-3 h-3 text-red-500" />
              </Button>
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) {
                const reader = new FileReader();
                reader.onload = (ev) => onUpdate({ image: ev.target?.result });
                reader.readAsDataURL(file);
              }
            }}
            className="w-full text-xs"
          />
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Height</span>
            <NumberStepper value={section.imageHeight || 400} onChange={(v) => onUpdate({ imageHeight: v })} min={100} max={800} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Position</span>
            <select value={section.imagePosition || 'top'} onChange={(e) => onUpdate({ imagePosition: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="top">Top</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        </div>
      </ActionGroup>

      {renderFontFamilyControl()}
      {renderTextDirectionControls()}
      {renderBackgroundControls()}
    </>
  );

  const renderAlternatingControls = () => (
    <>
      <ActionGroup label="Rows" icon={LayoutGrid} expanded={expanded.rows} onToggle={() => toggleExpand('rows')}>
        <div className="space-y-3">
          {(section.rows || []).map((row, index) => (
            <div key={index} className="p-2 bg-zinc-50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-medium text-zinc-500">Row {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    const newRows = [...(section.rows || [])];
                    newRows.splice(index, 1);
                    onUpdate({ rows: newRows });
                  }}
                  className="h-5 w-5 p-0 text-red-500 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
              <input
                type="text"
                value={row.title || ''}
                onChange={(e) => {
                  const newRows = [...(section.rows || [])];
                  newRows[index] = { ...newRows[index], title: e.target.value };
                  onUpdate({ rows: newRows });
                }}
                className="w-full h-6 px-2 text-xs rounded border border-zinc-200"
                placeholder="Title..."
                dir={section.textDirection || 'ltr'}
              />
              <textarea
                value={row.description || ''}
                onChange={(e) => {
                  const newRows = [...(section.rows || [])];
                  newRows[index] = { ...newRows[index], description: e.target.value };
                  onUpdate({ rows: newRows });
                }}
                className="w-full h-12 p-2 text-xs rounded border border-zinc-200 resize-none"
                placeholder="Description..."
                dir={section.textDirection || 'ltr'}
              />
              <div className="flex items-center gap-1">
                <input
                  type="text"
                  value={row.linkText || ''}
                  onChange={(e) => {
                    const newRows = [...(section.rows || [])];
                    newRows[index] = { ...newRows[index], linkText: e.target.value };
                    onUpdate({ rows: newRows });
                  }}
                  className="flex-1 h-6 px-2 text-xs rounded border border-zinc-200"
                  placeholder="Link text..."
                  dir={section.textDirection || 'ltr'}
                />
              </div>
              {row.image ? (
                <div className="relative w-full h-12 bg-zinc-100 rounded overflow-hidden">
                  <img src={row.image} alt="" className="w-full h-full object-cover" />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newRows = [...(section.rows || [])];
                      newRows[index] = { ...newRows[index], image: '' };
                      onUpdate({ rows: newRows });
                    }}
                    className="absolute top-1 right-1 h-4 w-4 p-0 bg-white/80"
                  >
                    <Trash2 className="w-2.5 h-2.5 text-red-500" />
                  </Button>
                </div>
              ) : (
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => {
                        const newRows = [...(section.rows || [])];
                        newRows[index] = { ...newRows[index], image: ev.target?.result };
                        onUpdate({ rows: newRows });
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="w-full text-[10px]"
                />
              )}
            </div>
          ))}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const newRows = [...(section.rows || []), {
                image: '',
                title: 'New title',
                description: 'Short description',
                linkText: 'Learn more',
                linkUrl: '#'
              }];
              onUpdate({ rows: newRows });
            }}
            className="w-full h-7 text-xs"
          >
            <Plus className="w-3 h-3 mr-1" /> Add Row
          </Button>
        </div>
      </ActionGroup>

      <ActionGroup label="Layout" icon={Settings} expanded={expanded.layout} onToggle={() => toggleExpand('layout')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-14">Img Width</span>
            <select value={section.imageWidth || '45%'} onChange={(e) => onUpdate({ imageWidth: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="35%">35%</option>
              <option value="40%">40%</option>
              <option value="45%">45%</option>
              <option value="50%">50%</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-14">Img Height</span>
            <NumberStepper value={section.imageHeight || 250} onChange={(v) => onUpdate({ imageHeight: v })} min={100} max={500} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-14">Row Gap</span>
            <NumberStepper value={section.rowGap || 48} onChange={(v) => onUpdate({ rowGap: v })} min={16} max={80} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-14">Start</span>
            <select value={section.startImagePosition || 'left'} onChange={(e) => onUpdate({ startImagePosition: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="left">Image Left</option>
              <option value="right">Image Right</option>
            </select>
          </div>
        </div>
      </ActionGroup>

      <ActionGroup label="Colors" icon={Palette} expanded={expanded.colors} onToggle={() => toggleExpand('colors')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Title</span>
            <input type="color" value={section.textColor || '#1D1D1F'} onChange={(e) => onUpdate({ textColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Desc</span>
            <input type="color" value={section.descriptionColor || '#86868B'} onChange={(e) => onUpdate({ descriptionColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Link</span>
            <input type="color" value={section.linkColor || '#1D1D1F'} onChange={(e) => onUpdate({ linkColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
        </div>
      </ActionGroup>

      {renderFontFamilyControl()}
      {renderTextDirectionControls()}
      {renderBackgroundControls()}
    </>
  );

  const renderPromoCardControls = () => (
    <>
      {/* Layout */}
      <ActionGroup label="Layout" icon={LayoutGrid} expanded={expanded.layout} onToggle={() => toggleExpand('layout')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-16">Layout</span>
            <select 
              value={section.layout || 'image-left'} 
              onChange={(e) => onUpdate({ layout: e.target.value })} 
              className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1"
            >
              <option value="image-left">Image Left</option>
              <option value="image-right">Image Right</option>
              <option value="image-top">Image Top</option>
              <option value="no-image">No Image</option>
              <option value="text-only">Text Only</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-16">Align</span>
            <div className="flex gap-1 flex-1">
              <Button
                variant={section.contentAlign === 'left' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdate({ contentAlign: 'left' })}
                className="h-6 w-6 p-0"
              >
                <AlignLeft className="w-3 h-3" />
              </Button>
              <Button
                variant={section.contentAlign === 'center' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdate({ contentAlign: 'center' })}
                className="h-6 w-6 p-0"
              >
                <AlignCenter className="w-3 h-3" />
              </Button>
              <Button
                variant={section.contentAlign === 'right' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdate({ contentAlign: 'right' })}
                className="h-6 w-6 p-0"
              >
                <AlignRight className="w-3 h-3" />
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-16">V. Align</span>
            <select 
              value={section.verticalAlign || 'center'} 
              onChange={(e) => onUpdate({ verticalAlign: e.target.value })} 
              className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1"
            >
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
            </select>
          </div>
        </div>
      </ActionGroup>

      {/* Image */}
      {section.layout !== 'text-only' && section.layout !== 'no-image' && (
        <ActionGroup label="Image" icon={ImageIcon} expanded={expanded.image} onToggle={() => toggleExpand('image')}>
          <div className="space-y-2">
            {section.image ? (
              <div 
                className="relative w-full h-20 rounded-lg overflow-hidden"
                style={{ backgroundColor: section.imageBgColor || '#f4f4f5' }}
              >
                <img src={section.image} alt="" className="w-full h-full object-contain" />
                <div className="absolute top-1 right-1 flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleRemoveBackground('image')}
                    disabled={isProcessing}
                    className="h-5 w-5 p-0 bg-white/80 hover:bg-white"
                    title="Remove background"
                  >
                    {isProcessing ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onUpdate({ image: '' })}
                    className="h-5 w-5 p-0 bg-white/80 hover:bg-red-50"
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center p-3 bg-zinc-50 rounded-lg border-2 border-dashed border-zinc-200">
                <ImageIcon className="w-6 h-6 mx-auto mb-1 text-zinc-300" />
                <span className="text-[10px] text-zinc-400">No image</span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onload = (ev) => onUpdate({ image: ev.target?.result });
                  reader.readAsDataURL(file);
                }
              }}
              className="w-full text-[10px]"
            />
            {/* Image Background Color */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-12">Bg Color</span>
              <input 
                type="color" 
                value={section.imageBgColor || '#f4f4f5'} 
                onChange={(e) => onUpdate({ imageBgColor: e.target.value })} 
                className="w-6 h-6 rounded cursor-pointer border border-zinc-200"
              />
              <div className="flex gap-0.5">
                {['#f4f4f5', '#ffffff', '#000000', 'transparent'].map(c => (
                  <button
                    key={c}
                    onClick={() => onUpdate({ imageBgColor: c })}
                    className={cn(
                      "w-5 h-5 rounded border text-[8px]",
                      section.imageBgColor === c ? "border-[#04D1FC]" : "border-zinc-200"
                    )}
                    style={{ backgroundColor: c === 'transparent' ? 'white' : c }}
                    title={c === 'transparent' ? 'Transparent' : c}
                  >
                    {c === 'transparent' && '∅'}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-12">Width</span>
              <NumberStepper value={section.imageWidth || 200} onChange={(v) => onUpdate({ imageWidth: v })} min={100} max={400} suffix="px" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-12">Height</span>
              <NumberStepper value={section.imageHeight || 180} onChange={(v) => onUpdate({ imageHeight: v })} min={80} max={400} suffix="px" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-12">Radius</span>
              <NumberStepper value={section.imageRadius || 12} onChange={(v) => onUpdate({ imageRadius: v })} min={0} max={50} suffix="px" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-12">Fit</span>
              <select value={section.imageFit || 'cover'} onChange={(e) => onUpdate({ imageFit: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
                <option value="cover">Cover</option>
                <option value="contain">Contain</option>
                <option value="fill">Fill</option>
              </select>
            </div>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={section.showImagePlaceholder !== false}
                onChange={(e) => onUpdate({ showImagePlaceholder: e.target.checked })}
                className="rounded"
              />
              <span className="text-[10px] text-zinc-500">Show placeholder</span>
            </label>
          </div>
        </ActionGroup>
      )}

      {/* Content */}
      <ActionGroup label="Content" icon={Type} expanded={expanded.content} onToggle={() => toggleExpand('content')}>
        <div className="space-y-2">
          <input
            type="text"
            value={section.title || ''}
            onChange={(e) => onUpdate({ title: e.target.value })}
            className="w-full h-7 px-2 text-xs rounded border border-zinc-200"
            placeholder="Title..."
            dir={section.textDirection || 'ltr'}
          />
          <textarea
            value={section.description || ''}
            onChange={(e) => onUpdate({ description: e.target.value })}
            className="w-full h-16 p-2 text-xs rounded border border-zinc-200 resize-none"
            placeholder="Description..."
            dir={section.textDirection || 'ltr'}
          />
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={section.showCta !== false}
              onChange={(e) => onUpdate({ showCta: e.target.checked })}
              className="rounded"
            />
            <span className="text-[10px] text-zinc-500">Show CTA</span>
          </label>
          {section.showCta !== false && (
            <>
              <input
                type="text"
                value={section.ctaText || ''}
                onChange={(e) => onUpdate({ ctaText: e.target.value })}
                className="w-full h-6 px-2 text-xs rounded border border-zinc-200"
                placeholder="CTA text..."
                dir={section.textDirection || 'ltr'}
              />
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 w-12">Style</span>
                <select value={section.ctaStyle || 'link'} onChange={(e) => onUpdate({ ctaStyle: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
                  <option value="link">Link</option>
                  <option value="button">Button</option>
                </select>
              </div>
            </>
          )}
        </div>
      </ActionGroup>

      {/* Typography */}
      <ActionGroup label="Typography" icon={Type} expanded={expanded.typography} onToggle={() => toggleExpand('typography')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Title</span>
            <NumberStepper value={section.titleFontSize || 24} onChange={(v) => onUpdate({ titleFontSize: v })} min={14} max={48} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Weight</span>
            <select value={section.titleFontWeight || '600'} onChange={(e) => onUpdate({ titleFontWeight: e.target.value })} className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1">
              <option value="400">Regular</option>
              <option value="500">Medium</option>
              <option value="600">Semi Bold</option>
              <option value="700">Bold</option>
            </select>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Desc</span>
            <NumberStepper value={section.descFontSize || 15} onChange={(v) => onUpdate({ descFontSize: v })} min={11} max={24} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Height</span>
            <NumberStepper value={section.lineHeight || 1.6} onChange={(v) => onUpdate({ lineHeight: v })} min={1} max={2.5} step={0.1} />
          </div>
        </div>
      </ActionGroup>

      {/* Colors */}
      <ActionGroup label="Colors" icon={Palette} expanded={expanded.colors} onToggle={() => toggleExpand('colors')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Title</span>
            <input type="color" value={section.titleColor || '#1D1D1F'} onChange={(e) => onUpdate({ titleColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">Desc</span>
            <input type="color" value={section.descColor || '#666666'} onChange={(e) => onUpdate({ descColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-12">CTA</span>
            <input type="color" value={section.ctaColor || '#1D1D1F'} onChange={(e) => onUpdate({ ctaColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
          </div>
          {section.ctaStyle === 'button' && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-12">Btn Bg</span>
              <input type="color" value={section.ctaButtonBg || '#1D1D1F'} onChange={(e) => onUpdate({ ctaButtonBg: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
            </div>
          )}
        </div>
      </ActionGroup>

      {/* Spacing */}
      <ActionGroup label="Spacing" icon={Move} expanded={expanded.spacing} onToggle={() => toggleExpand('spacing')}>
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-14">Padding V</span>
            <NumberStepper value={section.paddingVertical || 32} onChange={(v) => onUpdate({ paddingVertical: v })} min={0} max={80} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-14">Padding H</span>
            <NumberStepper value={section.paddingHorizontal || 32} onChange={(v) => onUpdate({ paddingHorizontal: v })} min={0} max={80} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-14">Gap</span>
            <NumberStepper value={section.contentGap || 24} onChange={(v) => onUpdate({ contentGap: v })} min={8} max={64} suffix="px" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] text-zinc-400 w-14">Text Gap</span>
            <NumberStepper value={section.textGap || 12} onChange={(v) => onUpdate({ textGap: v })} min={4} max={32} suffix="px" />
          </div>
        </div>
      </ActionGroup>

      {/* Border */}
      <ActionGroup label="Border" icon={Layers} expanded={expanded.border} onToggle={() => toggleExpand('border')}>
        <div className="space-y-2">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={section.showBorder === true}
              onChange={(e) => onUpdate({ showBorder: e.target.checked })}
              className="rounded"
            />
            <span className="text-[10px] text-zinc-500">Show border</span>
          </label>
          {section.showBorder && (
            <>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 w-12">Color</span>
                <input type="color" value={section.borderColor || '#E5E5E5'} onChange={(e) => onUpdate({ borderColor: e.target.value })} className="w-6 h-6 rounded cursor-pointer" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-zinc-400 w-12">Radius</span>
                <NumberStepper value={section.borderRadius || 0} onChange={(v) => onUpdate({ borderRadius: v })} min={0} max={32} suffix="px" />
              </div>
            </>
          )}
        </div>
      </ActionGroup>

      {renderFontFamilyControl()}
      {renderTextDirectionControls()}
      {renderBackgroundControls()}
    </>
  );

  const renderStyledTitleControls = () => {
    const segments = section.segments || [];
    const currentLayout = section.layout || 'default';
    const isStripLayout = currentLayout === 'strip-left' || currentLayout === 'strip-right';
    
    return (
      <>
        {/* Layout Selection */}
        <ActionGroup label="Layout" icon={LayoutGrid} expanded={expanded.layout} onToggle={() => toggleExpand('layout')}>
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-1">
              <Button
                variant={currentLayout === 'default' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdate({ layout: 'default' })}
                className="h-14 p-1 flex flex-col items-center justify-center gap-0.5"
              >
                <div className="w-8 h-6 bg-current/20 rounded flex items-center justify-center">
                  <Type className="w-4 h-4" />
                </div>
                <span className="text-[9px]">Default</span>
              </Button>
              <Button
                variant={currentLayout === 'strip-left' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdate({ layout: 'strip-left' })}
                className="h-14 p-1 flex flex-col items-center justify-center gap-0.5"
              >
                <div className="w-8 h-6 flex items-center gap-0.5">
                  <div className="w-3 h-3 bg-current/40 rounded-full" />
                  <div className="flex-1 h-2 bg-current/20 rounded" />
                </div>
                <span className="text-[9px]">Strip L</span>
              </Button>
              <Button
                variant={currentLayout === 'strip-right' ? 'default' : 'outline'}
                size="sm"
                onClick={() => onUpdate({ layout: 'strip-right' })}
                className="h-14 p-1 flex flex-col items-center justify-center gap-0.5"
              >
                <div className="w-8 h-6 flex items-center gap-0.5">
                  <div className="flex-1 h-2 bg-current/20 rounded" />
                  <div className="w-3 h-3 bg-current/40 rounded-full" />
                </div>
                <span className="text-[9px]">Strip R</span>
              </Button>
            </div>
            
            {/* Strip Image Controls */}
            {isStripLayout && (
              <div className="space-y-2 pt-2 border-t border-zinc-100">
                <span className="text-[10px] font-medium text-zinc-500">Strip Image</span>
                
                {/* Image Upload */}
                <div className="flex items-center gap-2">
                  {section.stripImage ? (
                    <div className="relative">
                      <img 
                        src={section.stripImage} 
                        alt="Strip" 
                        className="w-12 h-12 object-cover rounded-full border border-zinc-200"
                      />
                      <button
                        onClick={() => onUpdate({ stripImage: null })}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600"
                      >
                        <X className="w-2.5 h-2.5" />
                      </button>
                    </div>
                  ) : (
                    <label className="w-12 h-12 rounded-full bg-zinc-100 border-2 border-dashed border-zinc-300 flex items-center justify-center cursor-pointer hover:bg-zinc-200 transition-colors">
                      <Upload className="w-4 h-4 text-zinc-400" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (ev) => onUpdate({ stripImage: ev.target.result });
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  )}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-zinc-400 w-8">Size</span>
                      <NumberStepper 
                        value={section.stripImageWidth || 180} 
                        onChange={(v) => onUpdate({ stripImageWidth: v })} 
                        min={60} 
                        max={400} 
                        suffix="px" 
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-[9px] text-zinc-400 w-8">Shape</span>
                      <select
                        value={section.stripImageBorderRadius || '50%'}
                        onChange={(e) => onUpdate({ stripImageBorderRadius: e.target.value })}
                        className="flex-1 h-5 text-[10px] rounded border border-zinc-200 px-1"
                      >
                        <option value="50%">Circle</option>
                        <option value="16px">Rounded</option>
                        <option value="8px">Soft</option>
                        <option value="0">Square</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </ActionGroup>
        
        {/* Title Segments */}
        <ActionGroup label="Title Segments" icon={Type} expanded={expanded.typography} onToggle={() => toggleExpand('typography')}>
          <div className="space-y-3">
            {segments.map((segment, index) => (
              <div key={segment.id} className="p-2 bg-zinc-50 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-medium text-zinc-500">Segment {index + 1}</span>
                  {segments.length > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const newSegments = segments.filter((_, i) => i !== index);
                        onUpdate({ segments: newSegments });
                      }}
                      className="h-5 w-5 p-0 text-red-400 hover:text-red-600"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  )}
                </div>
                
                {/* Text */}
                <input
                  type="text"
                  value={segment.text}
                  onChange={(e) => {
                    const newSegments = [...segments];
                    newSegments[index] = { ...segment, text: e.target.value };
                    onUpdate({ segments: newSegments });
                  }}
                  className="w-full h-7 text-xs rounded border border-zinc-200 px-2"
                  placeholder="Text..."
                />
                
                {/* Font Weight */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 w-14">Weight</span>
                  <select
                    value={segment.fontWeight || '400'}
                    onChange={(e) => {
                      const newSegments = [...segments];
                      newSegments[index] = { ...segment, fontWeight: e.target.value };
                      onUpdate({ segments: newSegments });
                    }}
                    className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1"
                  >
                    <option value="100">Thin (100)</option>
                    <option value="200">ExtraLight (200)</option>
                    <option value="300">Light (300)</option>
                    <option value="400">Regular (400)</option>
                    <option value="500">Medium (500)</option>
                    <option value="600">SemiBold (600)</option>
                    <option value="700">Bold (700)</option>
                    <option value="800">ExtraBold (800)</option>
                    <option value="900">Black (900)</option>
                  </select>
                </div>
                
                {/* Font Style */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 w-14">Style</span>
                  <div className="flex gap-1">
                    <Button
                      variant={segment.fontStyle === 'normal' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newSegments = [...segments];
                        newSegments[index] = { ...segment, fontStyle: 'normal' };
                        onUpdate({ segments: newSegments });
                      }}
                      className="h-6 px-2 text-[10px]"
                    >
                      Normal
                    </Button>
                    <Button
                      variant={segment.fontStyle === 'italic' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => {
                        const newSegments = [...segments];
                        newSegments[index] = { ...segment, fontStyle: 'italic' };
                        onUpdate({ segments: newSegments });
                      }}
                      className="h-6 px-2 text-[10px] italic"
                    >
                      Italic
                    </Button>
                  </div>
                </div>
                
                {/* Segment Color */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 w-14">Color</span>
                  <input
                    type="color"
                    value={segment.color || '#FFFFFF'}
                    onChange={(e) => {
                      const newSegments = [...segments];
                      newSegments[index] = { ...segment, color: e.target.value };
                      onUpdate({ segments: newSegments });
                    }}
                    className="w-6 h-6 rounded cursor-pointer"
                  />
                </div>
              </div>
            ))}
            
            {/* Add Segment Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newSegment = {
                  id: `seg-${Date.now()}`,
                  text: 'Text',
                  fontWeight: '400',
                  fontStyle: 'normal',
                  color: '#FFFFFF'
                };
                onUpdate({ segments: [...segments, newSegment] });
              }}
              className="w-full h-7 text-xs"
            >
              <Plus className="w-3 h-3 mr-1" />
              Add Segment
            </Button>
          </div>
        </ActionGroup>

        {/* Global Title Settings */}
        <ActionGroup label="Title Settings" icon={Type} expanded={expanded.titleSettings} onToggle={() => toggleExpand('titleSettings')}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-16">Font</span>
              <select
                value={section.fontFamily || 'Poppins'}
                onChange={(e) => onUpdate({ fontFamily: e.target.value })}
                className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1"
              >
                <option value="Poppins">Poppins</option>
                <option value="Inter">Inter</option>
                <option value="Montserrat">Montserrat</option>
                <option value="Noto Sans Hebrew">Noto Sans Hebrew</option>
                <option value="Playfair Display">Playfair Display</option>
                <option value="Bebas Neue">Bebas Neue</option>
                <option value="Space Grotesk">Space Grotesk</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-16">Size</span>
              <NumberStepper value={section.fontSize || 72} onChange={(v) => onUpdate({ fontSize: v })} min={24} max={150} suffix="px" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-16">Spacing</span>
              <select
                value={section.letterSpacing || '-0.02em'}
                onChange={(e) => onUpdate({ letterSpacing: e.target.value })}
                className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1"
              >
                <option value="-0.05em">Tight (-0.05em)</option>
                <option value="-0.02em">Normal (-0.02em)</option>
                <option value="0">None (0)</option>
                <option value="0.02em">Wide (0.02em)</option>
                <option value="0.05em">Extra Wide (0.05em)</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-16">Line H</span>
              <NumberStepper value={section.lineHeight || 1.1} onChange={(v) => onUpdate({ lineHeight: v })} min={0.8} max={2} step={0.05} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-16">Align</span>
              <div className="flex gap-1 flex-1">
                <Button
                  variant={section.textAlign === 'left' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdate({ textAlign: 'left' })}
                  className="h-6 w-6 p-0"
                >
                  <AlignLeft className="w-3 h-3" />
                </Button>
                <Button
                  variant={section.textAlign === 'center' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdate({ textAlign: 'center' })}
                  className="h-6 w-6 p-0"
                >
                  <AlignCenter className="w-3 h-3" />
                </Button>
                <Button
                  variant={section.textAlign === 'right' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdate({ textAlign: 'right' })}
                  className="h-6 w-6 p-0"
                >
                  <AlignRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </ActionGroup>

        {/* Logo */}
        <ActionGroup label="Logo" icon={ImageIcon} expanded={expanded.logo} onToggle={() => toggleExpand('logo')}>
          <div className="space-y-2">
            {section.logo ? (
              <div className="relative w-full h-16 bg-zinc-100 rounded-lg overflow-hidden">
                <img src={section.logo} alt="Logo" className="w-full h-full object-contain" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUpdate({ logo: null })}
                  className="absolute top-1 right-1 h-5 w-5 p-0 bg-white/80 hover:bg-red-50"
                >
                  <Trash2 className="w-3 h-3 text-red-500" />
                </Button>
              </div>
            ) : (
              <div className="text-center p-3 bg-zinc-50 rounded-lg border-2 border-dashed border-zinc-200">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = (ev) => onUpdate({ logo: ev.target.result });
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                  id="styled-title-logo-upload"
                />
                <label htmlFor="styled-title-logo-upload" className="cursor-pointer text-xs text-zinc-500">
                  Click to upload logo
                </label>
              </div>
            )}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-12">Width</span>
              <NumberStepper value={section.logoWidth || 120} onChange={(v) => onUpdate({ logoWidth: v })} min={40} max={300} suffix="px" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-12">Align</span>
              <div className="flex gap-1 flex-1">
                <Button
                  variant={section.logoAlignment === 'left' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdate({ logoAlignment: 'left' })}
                  className="h-6 w-6 p-0"
                >
                  <AlignLeft className="w-3 h-3" />
                </Button>
                <Button
                  variant={section.logoAlignment === 'center' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdate({ logoAlignment: 'center' })}
                  className="h-6 w-6 p-0"
                >
                  <AlignCenter className="w-3 h-3" />
                </Button>
                <Button
                  variant={section.logoAlignment === 'right' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onUpdate({ logoAlignment: 'right' })}
                  className="h-6 w-6 p-0"
                >
                  <AlignRight className="w-3 h-3" />
                </Button>
              </div>
            </div>
          </div>
        </ActionGroup>

        {/* Subtitle */}
        <ActionGroup label="Subtitle" icon={Type} expanded={expanded.subtitle} onToggle={() => toggleExpand('subtitle')}>
          <div className="space-y-2">
            <input
              type="text"
              value={section.subtitle || ''}
              onChange={(e) => onUpdate({ subtitle: e.target.value })}
              className="w-full h-7 text-xs rounded border border-zinc-200 px-2"
              placeholder="Optional subtitle..."
            />
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-12">Size</span>
              <NumberStepper value={section.subtitleFontSize || 18} onChange={(v) => onUpdate({ subtitleFontSize: v })} min={12} max={36} suffix="px" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-12">Weight</span>
              <select
                value={section.subtitleFontWeight || '400'}
                onChange={(e) => onUpdate({ subtitleFontWeight: e.target.value })}
                className="flex-1 h-6 text-xs rounded border border-zinc-200 px-1"
              >
                <option value="300">Light</option>
                <option value="400">Regular</option>
                <option value="500">Medium</option>
                <option value="600">SemiBold</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-12">Color</span>
              <input
                type="color"
                value={section.subtitleColor || '#FFFFFF'}
                onChange={(e) => onUpdate({ subtitleColor: e.target.value })}
                className="w-6 h-6 rounded cursor-pointer"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-12">Opacity</span>
              <NumberStepper value={section.subtitleOpacity || 0.8} onChange={(v) => onUpdate({ subtitleOpacity: v })} min={0.1} max={1} step={0.1} />
            </div>
          </div>
        </ActionGroup>

        {/* Spacing */}
        <ActionGroup label="Spacing" icon={Move} expanded={expanded.spacing} onToggle={() => toggleExpand('spacing')}>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-14">Pad Top</span>
              <NumberStepper value={section.paddingTop ?? 0} onChange={(v) => onUpdate({ paddingTop: v })} min={0} max={120} suffix="px" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-14">Pad Bottom</span>
              <NumberStepper value={section.paddingBottom ?? 0} onChange={(v) => onUpdate({ paddingBottom: v })} min={0} max={120} suffix="px" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-14">Pad H</span>
              <NumberStepper value={section.paddingHorizontal ?? 0} onChange={(v) => onUpdate({ paddingHorizontal: v })} min={0} max={80} suffix="px" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-14">Logo → Title</span>
              <NumberStepper value={section.spacingLogoToTitle || 24} onChange={(v) => onUpdate({ spacingLogoToTitle: v })} min={0} max={80} suffix="px" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-14">Title → Sub</span>
              <NumberStepper value={section.spacingTitleToSubtitle || 16} onChange={(v) => onUpdate({ spacingTitleToSubtitle: v })} min={0} max={60} suffix="px" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-zinc-400 w-14">Title → Img</span>
              <NumberStepper value={section.spacingTitleToImage || 24} onChange={(v) => onUpdate({ spacingTitleToImage: v })} min={0} max={80} suffix="px" />
            </div>
          </div>
        </ActionGroup>

        {/* Decorative Image */}
        <ActionGroup label="Decorative Image" icon={ImageIcon} expanded={expanded.decorativeImage} onToggle={() => toggleExpand('decorativeImage')}>
          <div className="space-y-3">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-zinc-500">Show Image</span>
              <button
                onClick={() => onUpdate({ showDecorativeImage: !section.showDecorativeImage })}
                className={cn(
                  "w-9 h-5 rounded-full transition-colors relative",
                  section.showDecorativeImage ? "bg-[#04D1FC]" : "bg-zinc-200"
                )}
              >
                <div
                  className={cn(
                    "w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform",
                    section.showDecorativeImage ? "translate-x-4" : "translate-x-0.5"
                  )}
                />
              </button>
            </div>

            {section.showDecorativeImage && (
              <>
                {/* Clip to bounds toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-zinc-500">Clip to section</span>
                  <button
                    onClick={() => onUpdate({ decorativeImageClip: section.decorativeImageClip === false ? true : false })}
                    className={cn(
                      "w-9 h-5 rounded-full transition-colors relative",
                      section.decorativeImageClip !== false ? "bg-[#04D1FC]" : "bg-zinc-200"
                    )}
                  >
                    <div
                      className={cn(
                        "w-4 h-4 rounded-full bg-white shadow-sm absolute top-0.5 transition-transform",
                        section.decorativeImageClip !== false ? "translate-x-4" : "translate-x-0.5"
                      )}
                    />
                  </button>
                </div>

                {/* Image Upload */}
                {section.decorativeImage ? (
                  <div className="relative w-full h-20 bg-zinc-100 rounded-lg overflow-hidden">
                    <img src={section.decorativeImage} alt="Decorative" className="w-full h-full object-contain" />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUpdate({ decorativeImage: null })}
                      className="absolute top-1 right-1 h-5 w-5 p-0 bg-white/80 hover:bg-red-50"
                    >
                      <Trash2 className="w-3 h-3 text-red-500" />
                    </Button>
                  </div>
                ) : (
                  <div className="text-center p-3 bg-zinc-50 rounded-lg border-2 border-dashed border-zinc-200">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => onUpdate({ decorativeImage: ev.target.result });
                          reader.readAsDataURL(file);
                        }
                      }}
                      className="hidden"
                      id="styled-title-decorative-upload"
                    />
                    <label htmlFor="styled-title-decorative-upload" className="cursor-pointer text-xs text-zinc-500">
                      Click to upload image
                    </label>
                  </div>
                )}

                {/* Image Size */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 w-12">Width</span>
                  <NumberStepper value={section.decorativeImageWidth || 150} onChange={(v) => onUpdate({ decorativeImageWidth: v })} min={50} max={500} suffix="px" />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 w-12">Height</span>
                  <div className="flex items-center gap-1 flex-1">
                    <button
                      onClick={() => onUpdate({ decorativeImageHeight: 'auto' })}
                      className={cn(
                        "px-2 py-1 rounded text-[9px] font-medium transition-colors",
                        section.decorativeImageHeight === 'auto' || !section.decorativeImageHeight
                          ? "bg-zinc-900 text-white"
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      )}
                    >
                      Auto
                    </button>
                    {section.decorativeImageHeight !== 'auto' && section.decorativeImageHeight && (
                      <NumberStepper
                        value={section.decorativeImageHeight}
                        onChange={(v) => onUpdate({ decorativeImageHeight: v })}
                        min={30}
                        max={400}
                        step={10}
                        suffix="px"
                      />
                    )}
                    {(section.decorativeImageHeight === 'auto' || !section.decorativeImageHeight) && (
                      <button
                        onClick={() => onUpdate({ decorativeImageHeight: 100 })}
                        className="px-2 py-1 rounded text-[9px] font-medium bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      >
                        Set Height
                      </button>
                    )}
                  </div>
                </div>

                {/* Image Position */}
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-zinc-400 w-12">Align</span>
                  <div className="flex gap-1 flex-1">
                    <Button
                      variant={section.decorativeImagePosition === 'left' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onUpdate({ decorativeImagePosition: 'left' })}
                      className="h-6 w-6 p-0"
                    >
                      <AlignLeft className="w-3 h-3" />
                    </Button>
                    <Button
                      variant={section.decorativeImagePosition === 'center' || !section.decorativeImagePosition ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onUpdate({ decorativeImagePosition: 'center' })}
                      className="h-6 w-6 p-0"
                    >
                      <AlignCenter className="w-3 h-3" />
                    </Button>
                    <Button
                      variant={section.decorativeImagePosition === 'right' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => onUpdate({ decorativeImagePosition: 'right' })}
                      className="h-6 w-6 p-0"
                    >
                      <AlignRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>

                {/* Offset Controls */}
                <div className="space-y-2 pt-2 border-t border-zinc-100">
                  <span className="text-[10px] text-zinc-400 font-medium">Position Offset</span>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-400 w-10">X</span>
                    <NumberStepper
                      value={section.decorativeImageOffsetX || 0}
                      onChange={(v) => onUpdate({ decorativeImageOffsetX: v })}
                      min={-300}
                      max={300}
                      step={5}
                      suffix="px"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[9px] text-zinc-400 w-10">Y</span>
                    <NumberStepper
                      value={section.decorativeImageOffsetY || 0}
                      onChange={(v) => onUpdate({ decorativeImageOffsetY: v })}
                      min={-300}
                      max={300}
                      step={5}
                      suffix="px"
                    />
                  </div>
                </div>

              </>
            )}
          </div>
        </ActionGroup>

        {renderTextDirectionControls()}
        {renderBackgroundControls()}
        {renderOuterWrapperControls()}
      </>
    );
  };

  const renderDefaultControls = () => (
    <>
      {/* Background - available for all sections */}
      {renderBackgroundControls()}
    </>
  );

  if (!section) return null;

  return (
    <div 
      ref={barRef}
      className={cn(
        "fixed z-50 bg-white rounded-xl shadow-xl border border-zinc-200 w-[300px] flex flex-col",
        isDragging && "shadow-2xl ring-2 ring-[#04D1FC]/30 pointer-events-none"
      )}
      style={{ 
        left: barPosition.x,
        top: barPosition.y,
        maxHeight: '700px',
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Header - Draggable */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-zinc-50 border-b border-zinc-100 cursor-grab active:cursor-grabbing select-none"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <GripHorizontal className="w-4 h-4 text-zinc-300" />
          <span className="text-xs font-medium text-zinc-700 capitalize">{section.type}</span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveUp}
            className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-600"
            title="Move up"
          >
            <MoveUp className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onMoveDown}
            className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-600"
            title="Move down"
          >
            <MoveDown className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDuplicate}
            className="h-6 w-6 p-0 text-zinc-400 hover:text-zinc-600"
            title="Duplicate"
          >
            <Copy className="w-3 h-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExportAsImage}
            disabled={isExportingImage}
            className="h-6 w-6 p-0 text-zinc-400 hover:text-green-600"
            title="Export as high-quality image"
          >
            {isExportingImage ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <Camera className="w-3 h-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDelete}
            className="h-6 w-6 p-0 text-red-400 hover:text-red-600"
            title="Delete"
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </div>

      {/* Copy/Paste Style & Section Row */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-zinc-50/50 border-b border-zinc-100">
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              copyStyle(section);
              setShowCopyToast('style');
              setTimeout(() => setShowCopyToast(null), 2000);
            }}
            className="h-6 px-2 text-[10px] gap-1"
            title="Copy style (colors, fonts, spacing)"
          >
            <Palette className="w-3 h-3" />
            Copy Style
          </Button>
          {canPasteStyle(section.type) && (
            <Button
              variant="default"
              size="sm"
              onClick={() => {
                const style = pasteStyle(section.type);
                if (style) {
                  onUpdate(style);
                }
              }}
              className="h-6 px-2 text-[10px] gap-1 bg-[#04D1FC] hover:bg-[#04D1FC]/90"
              title="Paste style to this section"
            >
              <Palette className="w-3 h-3" />
              Paste Style
            </Button>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            copySection(section);
            setShowCopyToast('section');
            setTimeout(() => setShowCopyToast(null), 2000);
          }}
          className="h-6 px-2 text-[10px] gap-1"
          title="Copy entire section"
        >
          <Copy className="w-3 h-3" />
          Copy Section
        </Button>
      </div>

      {/* Copy Toast */}
      {showCopyToast && (
        <div className="absolute top-12 left-1/2 -translate-x-1/2 bg-zinc-900 text-white text-[10px] px-3 py-1.5 rounded-full shadow-lg z-50 animate-in fade-in slide-in-from-top-2">
          {showCopyToast === 'style' ? '✓ Style copied!' : '✓ Section copied!'}
        </div>
      )}

      {/* Controls */}
      <div className="p-2 space-y-1 flex-1 overflow-y-auto">
        {renderControls()}
      </div>
    </div>
  );
}

// Reusable Action Group Component
function ActionGroup({ label, icon: Icon, children, expanded = false, onToggle }) {
  const handleToggle = () => {
    onToggle?.();
  };

  return (
    <div className="rounded-lg border border-zinc-100 overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-2 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          {Icon && <Icon className="w-3 h-3 text-zinc-400" />}
          {label}
        </div>
        <ChevronDown className={cn("w-3 h-3 text-zinc-400 transition-transform", expanded && "rotate-180")} />
      </button>
      {expanded && (
        <div className="px-2 pb-2 pt-1">
          {children}
        </div>
      )}
    </div>
  );
}

// Vertical Alignment Control Component
function VerticalAlignControl({ value, onChange }) {
  const alignOptions = [
    { value: 'top', icon: AlignVerticalJustifyStart, label: 'Top' },
    { value: 'center', icon: AlignVerticalJustifyCenter, label: 'Center' },
    { value: 'bottom', icon: AlignVerticalJustifyEnd, label: 'Bottom' }
  ];

  return (
    <div className="flex gap-0.5">
      {alignOptions.map(({ value: alignValue, icon: Icon, label }) => (
        <Button
          key={alignValue}
          variant={value === alignValue ? 'default' : 'ghost'}
          size="sm"
          onClick={() => onChange(alignValue)}
          className="h-7 w-7 p-0"
          title={label}
        >
          <Icon className="w-3.5 h-3.5" />
        </Button>
      ))}
    </div>
  );
}

// Marquee Icon Preview Component
function MarqueeIconPreview({ iconName }) {
  const IconComponent = getIconByName(iconName);
  if (!IconComponent) {
    // Check if it's an emoji
    if (iconName && iconName.length <= 2) {
      return <span className="text-sm">{iconName}</span>;
    }
    return <Smile className="w-4 h-4 text-zinc-400" />;
  }
  return <IconComponent className="w-4 h-4" />;
}

// Number Stepper Component
function NumberStepper({ value, onChange, min = 0, max = 100, step = 1, suffix = '' }) {
  return (
    <div className="flex items-center gap-1 bg-zinc-50 rounded-lg p-0.5">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange(Math.max(min, value - step))}
        className="h-6 w-6 p-0"
      >
        <Minus className="w-3 h-3" />
      </Button>
      <span className="text-xs font-mono w-12 text-center">
        {value}{suffix}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => onChange(Math.min(max, value + step))}
        className="h-6 w-6 p-0"
      >
        <Plus className="w-3 h-3" />
      </Button>
    </div>
  );
}

export default SectionActionBar;
