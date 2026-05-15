import React, { useRef, useCallback, useEffect, useState } from 'react';
import { 
  Bold, 
  Italic, 
  Underline, 
  AlignLeft, 
  AlignCenter, 
  AlignRight,
  List,
  Link,
  Type
} from 'lucide-react';
import { cn } from '../../lib/utils';

function RichTextEditor({ 
  value, 
  onChange, 
  placeholder = "Enter text...",
  direction = 'ltr',
  minHeight = 120,
  className
}) {
  const editorRef = useRef(null);
  const [isFocused, setIsFocused] = useState(false);

  // Initialize content
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      const html = editorRef.current.innerHTML;
      // Convert to plain text with line breaks preserved
      const text = html
        .replace(/<div>/gi, '\n')
        .replace(/<\/div>/gi, '')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim();
      onChange(text);
    }
  }, [onChange]);

  const execCommand = (command, value = null) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  const ToolbarButton = ({ icon: Icon, command, active, title }) => (
    <button
      type="button"
      onMouseDown={(e) => {
        e.preventDefault();
        execCommand(command);
      }}
      className={cn(
        "p-1.5 rounded transition-colors",
        active 
          ? "bg-zinc-200 text-zinc-900" 
          : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
      )}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );

  return (
    <div className={cn(
      "rounded-lg border border-zinc-200 overflow-hidden transition-shadow duration-200",
      isFocused && "ring-2 ring-[#04D1FC] border-transparent",
      className
    )}>
      {/* Toolbar */}
      <div className="flex items-center gap-0.5 px-2 py-1.5 bg-zinc-50 border-b border-zinc-200">
        <ToolbarButton icon={Bold} command="bold" title="Bold" />
        <ToolbarButton icon={Italic} command="italic" title="Italic" />
        <ToolbarButton icon={Underline} command="underline" title="Underline" />
        
        <div className="w-px h-4 bg-zinc-200 mx-1" />
        
        <ToolbarButton icon={AlignLeft} command="justifyLeft" title="Align Left" />
        <ToolbarButton icon={AlignCenter} command="justifyCenter" title="Align Center" />
        <ToolbarButton icon={AlignRight} command="justifyRight" title="Align Right" />
        
        <div className="w-px h-4 bg-zinc-200 mx-1" />
        
        <ToolbarButton icon={List} command="insertUnorderedList" title="Bullet List" />
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          "px-3 py-2 text-sm outline-none",
          "empty:before:content-[attr(data-placeholder)] empty:before:text-zinc-400"
        )}
        style={{ 
          minHeight: `${minHeight}px`,
          direction,
          textAlign: direction === 'rtl' ? 'right' : 'left'
        }}
        data-placeholder={placeholder}
        suppressContentEditableWarning
      />
    </div>
  );
}

export default RichTextEditor;

