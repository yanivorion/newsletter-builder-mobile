import React, { useRef, useState, useCallback } from 'react';
import { Plus } from 'lucide-react';
import BlockRenderer from '../blocks/BlockRenderer';
import { spanToPercent, GRID_COLUMNS } from '../../lib/grid-schema';

/**
 * A single grid column inside a GridRow.
 * Renders its child blocks vertically and provides drop zones
 * for drag-and-drop between columns.
 */
export default function GridColumn({
  column,
  rowId,
  sectionId,
  isSelected,
  selectedBlockId,
  isSectionSelected,
  sectionBackground,
  onBlockClick,
  onAddBlock,
  onDropBlock,
  onInteractionStart,
  onInteractionEnd,
  isOnlyColumn,
  onSetBlockImage,
  onSetCollageImage,
}) {
  const colRef = useRef(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const widthPercent = spanToPercent(column.span);
  const isFullWidth = column.span === GRID_COLUMNS;

  const handleDragOver = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    const hasBlockType = e.dataTransfer.types.includes('application/block-type');
    e.dataTransfer.dropEffect = hasBlockType ? 'copy' : 'move';
    if (!isDragOver) {
      setIsDragOver(true);
      onInteractionStart?.();
    }
  }, [isDragOver, onInteractionStart]);

  const handleDragLeave = useCallback(() => {
    setIsDragOver(false);
    onInteractionEnd?.();
  }, [onInteractionEnd]);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    onInteractionEnd?.();

    // Toolbar block-type drop
    const blockType = e.dataTransfer.getData('application/block-type');
    if (blockType) {
      onAddBlock?.(sectionId, rowId, column.id, blockType);
      return;
    }

    // Column-to-column block move
    const data = e.dataTransfer.getData('application/grid-block');
    if (data) {
      try {
        const parsed = JSON.parse(data);
        onDropBlock?.(parsed, rowId, column.id);
      } catch { /* ignore */ }
    }
  }, [sectionId, rowId, column.id, onAddBlock, onDropBlock, onInteractionEnd]);

  return (
    <div
      ref={colRef}
      data-col-id={column.id}
      data-col-span={column.span}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      style={{
        width: `${widthPercent}%`,
        minHeight: 0,
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        flex: '1 1 auto',
        outline: isDragOver ? '2px dashed #04D1FC' : isSelected ? '1px dashed rgba(4,209,252,0.4)' : 'none',
        outlineOffset: isDragOver ? -2 : -1,
        borderRadius: 2,
        transition: 'outline 0.1s',
      }}
    >
      {/* Blocks in this column */}
      {column.blocks.length > 0 ? (
        column.blocks.map((block) => (
          <BlockRenderer
            key={block.id}
            block={block}
            isSelected={selectedBlockId === block.id}
            isSectionSelected={isSectionSelected}
            onClick={(blockId) => onBlockClick?.(sectionId, blockId)}
            sectionBackground={sectionBackground}
            draggable={isSectionSelected}
            onDragStart={(e, blockId) => {
              onInteractionStart?.();
              e.dataTransfer.setData('application/grid-block', JSON.stringify({
                blockId,
                fromRowId: rowId,
                fromColId: column.id,
                sectionId,
              }));
              e.dataTransfer.effectAllowed = 'move';
            }}
            onDragEnd={() => {
              onInteractionEnd?.();
            }}
            onSetImage={block.type === 'image' ? () => onSetBlockImage?.(sectionId, block.id) : undefined}
            onSetCollageImage={block.type === 'imageCollage' ? (imgIdx) => onSetCollageImage?.(sectionId, block.id, imgIdx) : undefined}
            onSetLayoutImage={block.type === 'multiLayout' ? (imgIdx) => onSetCollageImage?.(sectionId, block.id, imgIdx) : undefined}
          />
        ))
      ) : (
        <div
          style={{
            minHeight: isFullWidth ? 20 : 24,
          }}
        >
          {isDragOver && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              minHeight: 'inherit',
            }}>
              <span style={{ color: '#04D1FC', fontStyle: 'normal', fontWeight: 500, fontSize: 11 }}>Drop here</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
