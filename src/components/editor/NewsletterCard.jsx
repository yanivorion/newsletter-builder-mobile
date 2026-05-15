import React, { useState, useRef, useEffect } from 'react';
import { Copy, Trash2, Check, X, MoreHorizontal, GripHorizontal } from 'lucide-react';
import NewsletterEditor from './NewsletterEditor';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';

function NewsletterCard({
  id,
  name,
  newsletter,
  isActive,
  selectedSectionId,
  onSelect,
  onSectionClick,
  onRename,
  onDuplicate,
  onDelete,
  onAddSection,
  onReorderSections,
  onSectionUpdate,
  isUnlocked,
  canDelete = true,
  onDragStart,
  isDragging = false
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(name);
  const [showMenu, setShowMenu] = useState(false);
  const inputRef = useRef(null);
  const menuRef = useRef(null);
  const editorColumnRef = useRef(null);

  useEffect(() => {
    setEditedName(name);
  }, [name]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSaveName = () => {
    if (editedName.trim()) {
      onRename(editedName.trim());
    } else {
      setEditedName(name);
    }
    setIsEditing(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSaveName();
    if (e.key === 'Escape') {
      setEditedName(name);
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (window.confirm(`Delete "${name}"?`)) {
      onDelete();
    }
  };

  const handleHeaderMouseDown = (e) => {
    // Don't start drag if clicking on buttons or inputs
    if (
      e.target.tagName === 'BUTTON' ||
      e.target.tagName === 'INPUT' ||
      e.target.closest('button') ||
      e.target.closest('input')
    ) {
      return;
    }
    onDragStart?.(e);
  };

  return (
    <div
      className={cn(
        "flex-shrink-0 rounded-2xl bg-white shadow-lg transition-all duration-200 overflow-hidden",
        isActive 
          ? "ring-2 ring-[#04D1FC] shadow-xl shadow-[#04D1FC]/10" 
          : "hover:shadow-xl",
        isDragging && "opacity-90 ring-2 ring-[#04D1FC] shadow-2xl"
      )}
    >
      {/* Card Header - Draggable area */}
      <div 
        className={cn(
          "flex items-center justify-between px-4 py-3 border-b transition-colors select-none rounded-t-2xl",
          isActive 
            ? "bg-[#04D1FC]/5 border-[#04D1FC]/20" 
            : "bg-zinc-50/80 border-zinc-100 hover:bg-zinc-50",
          "cursor-grab active:cursor-grabbing"
        )}
        onMouseDown={handleHeaderMouseDown}
        onClick={onSelect}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {/* Drag handle indicator */}
          <GripHorizontal className="w-4 h-4 text-zinc-300 flex-shrink-0" />
          
          {/* Active indicator */}
          <div 
            className={cn(
              "w-2 h-2 rounded-full transition-all flex-shrink-0",
              isActive ? "bg-[#04D1FC]" : "bg-zinc-300"
            )} 
          />
          
          {/* Name - Editable */}
          {isEditing ? (
            <div className="flex items-center gap-1 flex-1" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
              <input
                ref={inputRef}
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                onBlur={handleSaveName}
                onKeyDown={handleKeyDown}
                className="flex-1 h-7 px-2 text-sm font-medium bg-white border border-[#04D1FC] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#04D1FC]/20 cursor-text"
                maxLength={50}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSaveName}
                className="h-7 w-7 p-0"
              >
                <Check className="w-3 h-3 text-emerald-500" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setEditedName(name);
                  setIsEditing(false);
                }}
                className="h-7 w-7 p-0"
              >
                <X className="w-3 h-3 text-zinc-400" />
              </Button>
            </div>
          ) : (
            <span 
              className={cn(
                "text-sm font-medium truncate transition-colors",
                isActive ? "text-zinc-900" : "text-zinc-600 hover:text-zinc-900"
              )}
              onDoubleClick={(e) => {
                e.stopPropagation();
                setIsEditing(true);
              }}
              title="Double-click to rename"
            >
              {name}
            </span>
          )}
        </div>

        {/* Card Actions */}
        <div className="flex items-center gap-1 ml-2" onClick={e => e.stopPropagation()} onMouseDown={e => e.stopPropagation()}>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDuplicate}
            className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-600"
            title="Duplicate (⌘D)"
          >
            <Copy className="w-3.5 h-3.5" />
          </Button>
          
          {/* More menu */}
          <div className="relative" ref={menuRef}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowMenu(!showMenu)}
              className="h-7 w-7 p-0 text-zinc-400 hover:text-zinc-600"
            >
              <MoreHorizontal className="w-3.5 h-3.5" />
            </Button>
            
            {showMenu && (
              <div className="absolute right-0 top-full mt-1 bg-white rounded-lg shadow-lg border border-zinc-200 py-1 z-50 min-w-[140px]">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    setIsEditing(true);
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-50 flex items-center gap-2"
                >
                  Rename
                </button>
                <button
                  onClick={() => {
                    setShowMenu(false);
                    onDuplicate();
                  }}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-600 hover:bg-zinc-50 flex items-center gap-2"
                >
                  Duplicate
                </button>
                {canDelete && (
                  <>
                    <div className="h-px bg-zinc-100 my-1" />
                    <button
                      onClick={handleDelete}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Newsletter Content */}
      <div ref={editorColumnRef} className="w-[600px]" onClick={onSelect}>
        <NewsletterEditor
          newsletter={newsletter}
          selectedSection={selectedSectionId}
          onSectionClick={onSectionClick}
          onAddSection={onAddSection}
          onReorderSections={onReorderSections}
          onSectionUpdate={onSectionUpdate}
          isUnlocked={isUnlocked}
          compact={true}
          sheetBoundsRef={editorColumnRef}
        />
      </div>
    </div>
  );
}

export default NewsletterCard;
