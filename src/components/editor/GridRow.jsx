import React, { useRef } from 'react';
import GridColumn from './GridColumn';
import ColumnResizer from './ColumnResizer';

/**
 * A single grid row containing 1–4 columns.
 * Renders columns side-by-side with optional resizers between them.
 */
export default function GridRow({
  row,
  sectionId,
  selectedBlockId,
  isSectionSelected,
  sectionBackground,
  onBlockClick,
  onAddBlock,
  onDropBlock,
  onResizeColumn,
  onInteractionStart,
  onInteractionEnd,
  showGrid,
  onSetBlockImage,
  onSetCollageImage,
}) {
  const rowRef = useRef(null);

  const containerWidth = rowRef.current?.offsetWidth || 600;

  return (
    <div
      ref={rowRef}
      data-row-id={row.id}
      style={{
        display: 'flex',
        width: '100%',
        position: 'relative',
        minHeight: 0,
        flex: '1 1 auto',
      }}
    >
      {row.columns.map((col, colIdx) => (
        <React.Fragment key={col.id}>
          <GridColumn
            column={col}
            rowId={row.id}
            sectionId={sectionId}
            isSelected={isSectionSelected && row.columns.length > 1}
            selectedBlockId={selectedBlockId}
            isSectionSelected={isSectionSelected}
            sectionBackground={sectionBackground}
            onBlockClick={onBlockClick}
            onAddBlock={onAddBlock}
            onDropBlock={onDropBlock}
            onInteractionStart={onInteractionStart}
            onInteractionEnd={onInteractionEnd}
            isOnlyColumn={row.columns.length === 1}
            onSetBlockImage={onSetBlockImage}
            onSetCollageImage={onSetCollageImage}
          />

          {/* Resizer between columns */}
          {colIdx < row.columns.length - 1 && isSectionSelected && (
            <ColumnResizer
              containerWidth={containerWidth}
              onResize={(delta) => onResizeColumn?.(sectionId, row.id, colIdx, delta)}
              onInteractionStart={onInteractionStart}
              onInteractionEnd={onInteractionEnd}
            />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}
