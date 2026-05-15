import React, { useCallback, useRef } from 'react';
import { Label } from '../ui/Label';
import { NumberInput } from '../ui/NumberInput';
import { cn } from '@/lib/utils';
import ImageUploader from './ImageUploader';
import EditorBottomSheet from './EditorBottomSheet';
import { isGridSection } from '@/lib/grid-schema';
import { flattenImageTransparency } from '@/lib/flatten-image-transparency';

const PAD_SIDE_LABEL = { top: 'Top', bottom: 'Bottom', left: 'Left', right: 'Right' };

const MODE_TITLE = {
  name: 'Section name',
  background: 'Background',
  padding: 'Padding',
  layout: 'Layout & height',
  radius: 'Corner radius',
  blocks: 'Blocks',
};

function ImageColorPicker({ value, onChange, placeholder = 'Enter color', allowClear = false }) {
  const textRef = useRef(null);
  const lastValueRef = useRef(value);

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
        className="h-8 w-8 shrink-0 cursor-pointer rounded border border-zinc-200"
      />
      <input
        ref={textRef}
        type="text"
        defaultValue={value || ''}
        onBlur={handleTextBlur}
        placeholder={placeholder}
        className="h-8 min-w-0 flex-1 rounded border border-zinc-200 px-2 text-xs focus:outline-none focus:ring-2 focus:ring-[#04D1FC]"
      />
      {allowClear && (
        <button
          onClick={handleClear}
          type="button"
          className="h-8 shrink-0 rounded border border-zinc-200 px-2 text-[10px] text-zinc-500 hover:text-zinc-700"
        >
          Clear
        </button>
      )}
    </div>
  );
}

const FieldGroup = ({ label, children, className }) => (
  <div className={cn('space-y-2', className)}>
    <Label className="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">{label}</Label>
    {children}
  </div>
);

/**
 * Single-purpose section controls in a compact bottom glass sheet.
 */
export default function SectionPropertySheet({
  open,
  mode = 'name',
  section,
  sectionId,
  selectedBlock,
  onClose,
  onSectionUpdate,
  onBlockClick,
  boundsRef,
  bottomInsetPx = 78,
}) {
  const sheetActive = !!(open && section && sectionId && mode);

  const handleBackgroundChange = useCallback(
    (field, value) => {
      if (field === 'image' && value) {
        const bgColor =
          section?.background?.color || section?.background?.fallbackColor || '#FFFFFF';
        flattenImageTransparency(value, bgColor).then(({ dataUrl }) => {
          if (!dataUrl) return;
          onSectionUpdate(sectionId, {
            height: 'auto',
            background: {
              ...(section?.background || {}),
              type: 'image',
              image: dataUrl,
              imageSize: 'auto',
              imagePosition: section?.background?.imagePosition || 'center',
            },
          });
        });
        return;
      }

      onSectionUpdate(sectionId, {
        background: { ...(section?.background || {}), [field]: value },
      });
    },
    [sectionId, section, onSectionUpdate]
  );

  const handlePaddingChange = useCallback(
    (side, value) => {
      onSectionUpdate(sectionId, {
        padding: { ...(section?.padding || {}), [side]: value },
      });
    },
    [sectionId, section, onSectionUpdate]
  );

  if (!sheetActive) return null;

  const bg = section.background || {};
  const pad = section.padding || {};
  const allBlocks = isGridSection(section)
    ? (section.rows || []).flatMap((r) => (r.columns || []).flatMap((c) => c.blocks || []))
    : (section.blocks || []);

  const sheetMaxH =
    mode === 'background' ? 'min(48vh,380px)' : mode === 'blocks' ? 'min(40vh,320px)' : 'min(34vh,280px)';

  let body = null;

  if (mode === 'name') {
    body = (
      <FieldGroup label="Name">
        <input
          type="text"
          value={section.name || ''}
          onChange={(e) => onSectionUpdate(sectionId, { name: e.target.value || null })}
          placeholder={
            section.type === 'header' ? 'Header' : section.type === 'footer' ? 'Footer' : 'Section'
          }
          className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-3 text-sm placeholder:text-zinc-300"
        />
      </FieldGroup>
    );
  } else if (mode === 'background') {
    body = (
      <FieldGroup label="Background">
        <div className="space-y-2.5">
          <div className="space-y-1">
            <span className="text-[10px] text-zinc-400">Type</span>
            <select
              value={bg.type || 'solid'}
              onChange={(e) => handleBackgroundChange('type', e.target.value)}
              className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs"
            >
              <option value="solid">Solid Color</option>
              <option value="gradient">Gradient</option>
              <option value="image">Image</option>
              <option value="none">Transparent</option>
            </select>
          </div>

          {bg.type === 'solid' && (
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-400">Color</span>
              <ImageColorPicker
                value={bg.color || '#FFFFFF'}
                onChange={(val) => handleBackgroundChange('color', val)}
                allowClear
              />
            </div>
          )}

          {bg.type === 'gradient' && (
            <>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400">Start</span>
                  <ImageColorPicker
                    value={bg.gradientStart || '#04D1FC'}
                    onChange={(val) => handleBackgroundChange('gradientStart', val)}
                  />
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-zinc-400">End</span>
                  <ImageColorPicker
                    value={bg.gradientEnd || '#17A298'}
                    onChange={(val) => handleBackgroundChange('gradientEnd', val)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] text-zinc-400">Angle</span>
                <NumberInput
                  value={bg.gradientAngle ?? 180}
                  onChange={(val) => handleBackgroundChange('gradientAngle', val)}
                  min={0}
                  max={360}
                  step={15}
                  suffix="°"
                />
              </div>
            </>
          )}

          {bg.type === 'image' && (
            <div className="space-y-2">
              <ImageUploader
                currentImage={bg.image || null}
                onImageUpload={(fileOrUrl) => {
                  if (!fileOrUrl) {
                    handleBackgroundChange('image', null);
                    return;
                  }
                  if (typeof fileOrUrl === 'string') {
                    handleBackgroundChange('image', fileOrUrl);
                    return;
                  }
                  const reader = new FileReader();
                  reader.onload = (e) => handleBackgroundChange('image', e.target.result);
                  reader.readAsDataURL(fileOrUrl);
                }}
                onImageUrl={(url) => handleBackgroundChange('image', url)}
                compact
              />
              {bg.image && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400">Size</span>
                    <select
                      value={bg.imageSize === '100% auto' ? 'auto' : (bg.imageSize || 'auto')}
                      onChange={(e) => handleBackgroundChange('imageSize', e.target.value)}
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs"
                    >
                      <option value="auto">Natural (100% × auto)</option>
                      <option value="cover">Cover</option>
                      <option value="contain">Contain</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] text-zinc-400">Position</span>
                    <select
                      value={bg.imagePosition || 'center'}
                      onChange={(e) => handleBackgroundChange('imagePosition', e.target.value)}
                      className="h-9 w-full rounded-lg border border-zinc-200 bg-white px-2 text-xs"
                    >
                      <option value="center">Center</option>
                      <option value="center top">Top</option>
                      <option value="center bottom">Bottom</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </FieldGroup>
    );
  } else if (mode === 'padding') {
    body = (
      <div className="space-y-2.5">
        {['top', 'bottom', 'left', 'right'].map((side) => {
          const v = pad[side] ?? 24;
          return (
            <div key={side} className="flex items-center gap-2">
              <span className="w-12 shrink-0 text-[11px] font-medium text-zinc-600">
                {PAD_SIDE_LABEL[side]}
              </span>
              <input
                type="range"
                min={0}
                max={200}
                step={4}
                value={v}
                onChange={(e) => handlePaddingChange(side, Number(e.target.value))}
                className="min-w-0 flex-1 cursor-pointer accent-[#04D1FC]"
              />
              <span className="w-11 shrink-0 text-right text-[11px] tabular-nums text-zinc-500">
                {v}px
              </span>
            </div>
          );
        })}
      </div>
    );
  } else if (mode === 'layout') {
    const fixedH = typeof section.height === 'number' ? section.height : 200;
    body = (
      <FieldGroup label="Height">
        <div className="space-y-2">
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onSectionUpdate(sectionId, { height: 'auto' })}
              className={cn(
                'btn-spring flex-1 rounded-lg border py-2 text-xs font-medium',
                !section.height || section.height === 'auto'
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 bg-white text-zinc-600'
              )}
            >
              Auto
            </button>
            <button
              type="button"
              onClick={() => onSectionUpdate(sectionId, { height: 200 })}
              className={cn(
                'btn-spring flex-1 rounded-lg border py-2 text-xs font-medium',
                section.height && section.height !== 'auto'
                  ? 'border-zinc-900 bg-zinc-900 text-white'
                  : 'border-zinc-200 bg-white text-zinc-600'
              )}
            >
              Fixed
            </button>
          </div>
          {section.height && section.height !== 'auto' && (
            <div className="flex items-center gap-2 pt-1">
              <input
                type="range"
                min={40}
                max={1200}
                step={10}
                value={fixedH}
                onChange={(e) => onSectionUpdate(sectionId, { height: Number(e.target.value) })}
                className="min-w-0 flex-1 cursor-pointer accent-[#04D1FC]"
              />
              <span className="w-14 shrink-0 text-right text-[11px] tabular-nums text-zinc-500">
                {fixedH}px
              </span>
            </div>
          )}
        </div>
      </FieldGroup>
    );
  } else if (mode === 'radius') {
    const r = section.borderRadius ?? 0;
    body = (
      <FieldGroup label="Radius">
        <div className="mb-1 text-2xl font-semibold tabular-nums text-zinc-900">
          {r}
          <span className="text-xs font-medium text-zinc-500"> px</span>
        </div>
        <input
          type="range"
          min={0}
          max={48}
          step={2}
          value={r}
          onChange={(e) => onSectionUpdate(sectionId, { borderRadius: Number(e.target.value) })}
          className="mb-2 h-2 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-[#04D1FC]"
        />
        <NumberInput
          value={r}
          onChange={(v) => onSectionUpdate(sectionId, { borderRadius: v })}
          step={2}
          min={0}
          max={48}
          suffix="px"
        />
      </FieldGroup>
    );
  } else if (mode === 'blocks') {
    body = (
      <FieldGroup label={`Blocks (${allBlocks.length})`}>
        <div className="max-h-[min(28vh,220px)] space-y-1 overflow-y-auto overscroll-contain pr-0.5">
          {allBlocks.map((b, idx) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onBlockClick?.(section.id, b.id)}
              className={cn(
                'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-xs transition-all',
                selectedBlock === b.id ? 'bg-zinc-900 text-white' : 'bg-zinc-50 text-zinc-600 hover:bg-zinc-100'
              )}
            >
              <span className="truncate font-medium capitalize">{b.type}</span>
              <span className="ml-auto text-[10px] opacity-50">#{idx + 1}</span>
            </button>
          ))}
          {allBlocks.length === 0 && (
            <p className="py-2 text-center text-[10px] text-zinc-400">No blocks yet</p>
          )}
        </div>
      </FieldGroup>
    );
  }

  return (
    <EditorBottomSheet
      open={sheetActive}
      title={MODE_TITLE[mode]}
      onClose={onClose}
      boundsRef={boundsRef}
      bottomInsetPx={bottomInsetPx}
      maxHeight={sheetMaxH}
      ariaLabel={MODE_TITLE[mode]}
    >
      {body}
    </EditorBottomSheet>
  );
}
