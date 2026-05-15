import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Plus } from 'lucide-react';
import NewsletterCard from './NewsletterCard';
import { cn } from '../../lib/utils';

const GRID_SIZE = 40; // Size of snap grid

// Zoom constants for smooth Figma-like zoom
const MIN_ZOOM = 0.1;
const MAX_ZOOM = 3;
const ZOOM_SENSITIVITY = 0.002; // Lower = slower/smoother zoom

function WorkspaceCanvas({
  zoom,
  newsletters,
  activeNewsletterId,
  selectedSectionId,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onSetZoom,
  onAddNewsletter,
  onSelectNewsletter,
  onSelectSection,
  onRenameNewsletter,
  onDuplicateNewsletter,
  onDeleteNewsletter,
  onUpdateNewsletterPosition,
  onSectionUpdate,
  onAddSection,
  onReorderSections,
  isUnlocked
}) {
  const canvasRef = useRef(null);
  const [isPanning, setIsPanning] = useState(false);
  const [panOffset, setPanOffset] = useState({ x: 100, y: 100 });
  const [startPan, setStartPan] = useState({ x: 0, y: 0 });

  // Dragging newsletter state
  const [draggingId, setDraggingId] = useState(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  // Snap to grid helper
  const snapToGrid = (value) => Math.round(value / GRID_SIZE) * GRID_SIZE;

  // Pan handlers (hold space/alt + drag, or middle mouse)
  const handleCanvasMouseDown = useCallback((e) => {
    // Only pan if clicking on canvas background (not on a card)
    if (e.target === canvasRef.current || e.target.classList.contains('canvas-background')) {
      if (e.button === 1 || (e.button === 0 && (e.altKey || e.spaceKey))) {
      setIsPanning(true);
      setStartPan({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      e.preventDefault();
      }
    }
  }, [panOffset]);

  const handleMouseMove = useCallback((e) => {
    if (isPanning) {
      setPanOffset({
        x: e.clientX - startPan.x,
        y: e.clientY - startPan.y
      });
    } else if (draggingId) {
      const deltaX = (e.clientX - dragStart.x) / zoom;
      const deltaY = (e.clientY - dragStart.y) / zoom;
      setDragOffset({ x: deltaX, y: deltaY });
    }
  }, [isPanning, startPan, draggingId, dragStart, zoom]);

  const handleMouseUp = useCallback(() => {
    if (draggingId && onUpdateNewsletterPosition) {
      const newsletter = newsletters.find(n => n.id === draggingId);
      if (newsletter) {
        const newX = snapToGrid(newsletter.position.x + dragOffset.x);
        const newY = snapToGrid(newsletter.position.y + dragOffset.y);
        onUpdateNewsletterPosition(draggingId, { x: newX, y: newY });
      }
    }
    setIsPanning(false);
    setDraggingId(null);
    setDragOffset({ x: 0, y: 0 });
  }, [draggingId, dragOffset, newsletters, onUpdateNewsletterPosition]);

  const handleWheel = useCallback((e) => {
    if (e.ctrlKey || e.metaKey) {
      e.preventDefault();
      
      // Get cursor position relative to canvas
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;
      
      const cursorX = e.clientX - rect.left;
      const cursorY = e.clientY - rect.top;
      
      // Calculate zoom change - smooth and slow like Figma
      const zoomDelta = -e.deltaY * ZOOM_SENSITIVITY;
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom * (1 + zoomDelta)));
      
      if (newZoom !== zoom && onSetZoom) {
        // Calculate the point in world coordinates before zoom
        const worldX = (cursorX - panOffset.x) / zoom;
        const worldY = (cursorY - panOffset.y) / zoom;
        
        // After zoom, adjust pan so the world point stays under cursor
        const newPanX = cursorX - worldX * newZoom;
        const newPanY = cursorY - worldY * newZoom;
        
        setPanOffset({ x: newPanX, y: newPanY });
        onSetZoom(newZoom);
      }
    } else {
      // Pan with scroll wheel
      setPanOffset(prev => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY
      }));
    }
  }, [zoom, panOffset, onSetZoom]);

  // Handle newsletter drag start
  const handleNewsletterDragStart = useCallback((id, e) => {
    e.stopPropagation();
    setDraggingId(id);
    setDragStart({ x: e.clientX, y: e.clientY });
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // Add keyboard listener for space bar panning
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.code === 'Space' && !e.repeat) {
        document.body.style.cursor = 'grab';
      }
    };
    const handleKeyUp = (e) => {
      if (e.code === 'Space') {
        document.body.style.cursor = 'default';
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);


  // Calculate "Add Newsletter" button position
  const getAddButtonPosition = () => {
    if (newsletters.length === 0) {
      return { x: 0, y: 0 };
    }
    // Find the rightmost newsletter
    let maxRight = 0;
    newsletters.forEach(n => {
      const right = n.position.x + 650; // Newsletter width + gap
      if (right > maxRight) maxRight = right;
    });
    return { x: snapToGrid(maxRight + 50), y: 0 };
  };

  const addButtonPos = getAddButtonPosition();

  return (
    <div 
      ref={canvasRef}
      className="flex-1 relative overflow-hidden bg-zinc-100"
      onMouseDown={handleCanvasMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      style={{ cursor: isPanning ? 'grabbing' : (draggingId ? 'grabbing' : 'default') }}
    >
      {/* Infinite dot pattern background - subtle */}
      <div 
        className="canvas-background absolute pointer-events-none"
        style={{
          // Make it much larger than viewport to feel infinite
          width: '200%',
          height: '200%',
          left: '-50%',
          top: '-50%',
          backgroundImage: `radial-gradient(circle, #d4d4d8 0.8px, transparent 0.8px)`,
          backgroundSize: `${GRID_SIZE * zoom}px ${GRID_SIZE * zoom}px`,
          backgroundPosition: `${panOffset.x % (GRID_SIZE * zoom)}px ${panOffset.y % (GRID_SIZE * zoom)}px`,
          opacity: 0.4
        }}
      />


      {/* Infinite Canvas Layer */}
      <div
        className="absolute inset-0"
        style={{
          transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
        }}
      >
        {/* Newsletter Cards - Absolutely positioned */}
        {newsletters.map((newsletter) => {
          const isDragging = draggingId === newsletter.id;
          const position = {
            x: newsletter.position.x + (isDragging ? dragOffset.x : 0),
            y: newsletter.position.y + (isDragging ? dragOffset.y : 0)
          };
          
          return (
            <div
              key={newsletter.id}
              className={cn(
                "absolute transition-shadow",
                isDragging && "z-50 shadow-2xl"
              )}
              style={{
                left: position.x,
                top: position.y,
                transition: isDragging ? 'none' : 'box-shadow 0.2s',
              }}
            >
          <NewsletterCard
            id={newsletter.id}
            name={newsletter.name}
            newsletter={newsletter.data}
            isActive={activeNewsletterId === newsletter.id}
            selectedSectionId={activeNewsletterId === newsletter.id ? selectedSectionId : null}
            onSelect={() => onSelectNewsletter(newsletter.id)}
            onSectionClick={(sectionId) => {
              onSelectNewsletter(newsletter.id);
              onSelectSection(sectionId);
            }}
            onRename={(name) => onRenameNewsletter(newsletter.id, name)}
            onDuplicate={() => onDuplicateNewsletter(newsletter.id)}
            onDelete={() => onDeleteNewsletter(newsletter.id)}
            onAddSection={onAddSection}
            onReorderSections={onReorderSections}
            onSectionUpdate={onSectionUpdate}
            isUnlocked={isUnlocked}
            canDelete={newsletters.length > 1}
                onDragStart={(e) => handleNewsletterDragStart(newsletter.id, e)}
                isDragging={isDragging}
          />
            </div>
          );
        })}

        {/* Add Newsletter Button - Positioned after last newsletter */}
        <button
          onClick={onAddNewsletter}
          className={cn(
            "absolute w-[600px] h-[300px] rounded-2xl border-2 border-dashed",
            "border-zinc-300 hover:border-[#04D1FC] hover:bg-[#04D1FC]/5",
            "flex flex-col items-center justify-center gap-3 transition-all duration-300",
            "text-zinc-400 hover:text-[#04D1FC] group"
          )}
          style={{
            left: addButtonPos.x,
            top: addButtonPos.y,
          }}
        >
          <div className="w-16 h-16 rounded-2xl bg-zinc-100 group-hover:bg-[#04D1FC]/10 flex items-center justify-center transition-colors">
            <Plus className="w-8 h-8" strokeWidth={1.5} />
          </div>
          <span className="text-sm font-medium">Add Newsletter</span>
          <span className="text-xs opacity-60">or press ⌘N</span>
        </button>
      </div>

    </div>
  );
}

export default WorkspaceCanvas;
