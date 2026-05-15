// ── Grid Schema ───────────────────────────────────────────────────
// Extends the section architecture with rows + columns for
// Squarespace-style snappable grid layouts.
//
// Data hierarchy:
//   Section → rows[] → columns[] → blocks[]
//
// A 12-column grid maps to email-safe percentage widths:
//   1 col = 8.33%   |  6 cols = 50%   |  12 cols = 100%
//
// MJML supports up to 4 columns per row. Column widths are
// expressed as grid spans (1–12) and converted to percentages.
// ──────────────────────────────────────────────────────────────────

export const GRID_COLUMNS = 12;
export const MAX_COLUMNS_PER_ROW = 8;

const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

// ── Column span → percentage ────────────────────────────────────
export function spanToPercent(span) {
  return Math.round((span / GRID_COLUMNS) * 10000) / 100;
}

// ── Create a grid column ────────────────────────────────────────
export function createGridColumn(span = GRID_COLUMNS, blocks = []) {
  return {
    id: `col-${uid()}`,
    span,
    blocks,
  };
}

// ── Create a grid row ───────────────────────────────────────────
export function createGridRow(columns = null) {
  return {
    id: `row-${uid()}`,
    columns: columns || [createGridColumn(GRID_COLUMNS)],
  };
}

// ── Convert flat blocks[] → rows[] ──────────────────────────────
// Each block becomes its own full-width row (preserves layout).
export function blocksToRows(blocks = []) {
  if (!blocks || blocks.length === 0) return [];
  return blocks.map((block) =>
    createGridRow([createGridColumn(GRID_COLUMNS, [block])])
  );
}

// ── Check if a section uses grid mode ───────────────────────────
export function isGridSection(section) {
  return Array.isArray(section.rows) && section.rows.length > 0;
}

// ── Normalize: ensure section has rows (convert if needed) ──────
export function ensureRows(section) {
  if (isGridSection(section)) return section.rows;
  return blocksToRows(section.blocks || []);
}

// ── Split a column into two ─────────────────────────────────────
// Splits column at `colIndex` in the given row. The new column
// gets half the span (min 1). Returns new columns array.
export function splitColumn(row, colIndex) {
  const cols = [...row.columns];
  const col = cols[colIndex];
  if (!col || cols.length >= MAX_COLUMNS_PER_ROW) return cols;

  const leftSpan = Math.ceil(col.span / 2);
  const rightSpan = col.span - leftSpan;
  if (rightSpan < 1) return cols;

  cols.splice(colIndex, 1,
    { ...col, span: leftSpan },
    createGridColumn(rightSpan)
  );
  return cols;
}

// ── Merge column into neighbor ──────────────────────────────────
// Merges column at `colIndex` with the one to its right.
export function mergeColumns(row, colIndex) {
  const cols = [...row.columns];
  if (colIndex >= cols.length - 1) return cols;

  const left = cols[colIndex];
  const right = cols[colIndex + 1];

  cols.splice(colIndex, 2, {
    ...left,
    span: left.span + right.span,
    blocks: [...left.blocks, ...right.blocks],
  });
  return cols;
}

// ── Resize columns at a divider ─────────────────────────────────
// Adjusts the boundary between colIndex and colIndex+1.
// `delta` is in grid columns (positive = move right, negative = left).
export function resizeColumnsAtDivider(row, colIndex, delta) {
  const cols = [...row.columns];
  const left = cols[colIndex];
  const right = cols[colIndex + 1];
  if (!left || !right) return cols;

  const newLeftSpan = Math.max(1, Math.min(left.span + right.span - 1, left.span + delta));
  const newRightSpan = left.span + right.span - newLeftSpan;

  if (newLeftSpan < 1 || newRightSpan < 1) return cols;

  cols[colIndex] = { ...left, span: newLeftSpan };
  cols[colIndex + 1] = { ...right, span: newRightSpan };
  return cols;
}

// ── Add a block to a specific column in a row ───────────────────
export function addBlockToColumn(rows, rowId, colId, block) {
  return rows.map((r) => {
    if (r.id !== rowId) return r;
    return {
      ...r,
      columns: r.columns.map((c) => {
        if (c.id !== colId) return c;
        return { ...c, blocks: [...c.blocks, block] };
      }),
    };
  });
}

// ── Move a block between columns ────────────────────────────────
export function moveBlockBetweenColumns(
  rows,
  fromRowId, fromColId, blockId,
  toRowId, toColId, insertIndex = -1
) {
  let movedBlock = null;

  // Remove from source
  let updated = rows.map((r) => {
    if (r.id !== fromRowId) return r;
    return {
      ...r,
      columns: r.columns.map((c) => {
        if (c.id !== fromColId) return c;
        const idx = c.blocks.findIndex((b) => b.id === blockId);
        if (idx === -1) return c;
        movedBlock = c.blocks[idx];
        return { ...c, blocks: c.blocks.filter((b) => b.id !== blockId) };
      }),
    };
  });

  if (!movedBlock) return rows;

  // Insert into target
  updated = updated.map((r) => {
    if (r.id !== toRowId) return r;
    return {
      ...r,
      columns: r.columns.map((c) => {
        if (c.id !== toColId) return c;
        const blocks = [...c.blocks];
        const idx = insertIndex >= 0 ? insertIndex : blocks.length;
        blocks.splice(idx, 0, movedBlock);
        return { ...c, blocks };
      }),
    };
  });

  return updated;
}

// ── Remove empty rows (rows where all columns are empty) ────────
export function pruneEmptyRows(rows) {
  return rows.filter((r) =>
    r.columns.some((c) => c.blocks.length > 0)
  );
}

// ── Predefined row layouts ──────────────────────────────────────
export const ROW_LAYOUTS = [
  { id: '1',     label: 'Full Width',   spans: [12],                          icon: '████████████' },
  { id: '2-eq',  label: '2 Equal',      spans: [6, 6],                        icon: '██████ ██████' },
  { id: '2-lg',  label: '2/3 + 1/3',    spans: [8, 4],                        icon: '████████ ████' },
  { id: '2-sm',  label: '1/3 + 2/3',    spans: [4, 8],                        icon: '████ ████████' },
  { id: '3-eq',  label: '3 Equal',      spans: [4, 4, 4],                     icon: '████ ████ ████' },
  { id: '4-eq',  label: '4 Equal',      spans: [3, 3, 3, 3],                  icon: '███ ███ ███ ███' },
  { id: '6-eq',  label: '6 Equal',      spans: [2, 2, 2, 2, 2, 2],           icon: '██ ██ ██ ██ ██ ██' },
  { id: '8-eq',  label: '8 Equal',      spans: [1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5, 1.5], icon: '█ █ █ █ █ █ █ █' },
];
