import React, { useState, useRef, useCallback, useEffect } from 'react';

const FONT_STACKS = {
  'Noto Sans Hebrew': "'Noto Sans Hebrew', 'Arial Hebrew', Arial, sans-serif",
  'Poppins': "'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Inter': "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Assistant': "'Assistant', 'Arial Hebrew', Arial, sans-serif",
  'Heebo': "'Heebo', 'Arial Hebrew', Arial, sans-serif"
};

function StatsSection({
  title = '',
  subtitle = '',
  stats = [
    { value: '10', label: 'years of experience' },
    { value: '3', label: 'offices in different countries' },
    { value: '12', label: 'countries we operate in' },
    { value: '+100', label: 'completed projects' }
  ],
  columns = 2,
  backgroundColor = '#FFFFFF',
  textColor = '#000000',
  accentColor = '#E5E5E5',
  fontFamily = 'Poppins',
  titleFontSize = 32,
  titleFontWeight = '700',
  valueFontSize = 48,
  valueFontWeight = '400',
  labelFontSize = 14,
  labelFontWeight = '400',
  labelColor = '#666666',
  paddingVertical = 40,
  paddingHorizontal = 24,
  gap = 24,
  showDividers = true,
  // RTL support
  textAlign = 'left',
  textDirection = 'ltr',
  // Divider
  dividerBottom = false,
  dividerColor = '#E5E5E5',
  dividerThickness = 1,
  // Inline editing
  isSelected = false,
  onTextChange
}) {
  const fontStack = FONT_STACKS[fontFamily] || FONT_STACKS.Poppins;
  const [editingField, setEditingField] = useState(null);
  const editRef = useRef(null);

  // Handle double-click to start editing
  const handleDoubleClick = useCallback((field, e) => {
    if (!onTextChange) return;
    e.stopPropagation();
    setEditingField(field);
  }, [onTextChange]);

  // Handle blur to save
  const handleBlur = useCallback((field) => {
    if (editRef.current && onTextChange) {
      const newValue = editRef.current.innerText.trim();
      onTextChange(field, newValue);
    }
    setEditingField(null);
  }, [onTextChange]);

  // Handle key events
  const handleKeyDown = useCallback((field, e) => {
    if (e.key === 'Escape') {
      setEditingField(null);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur(field);
    }
  }, [handleBlur]);

  // Focus when editing starts
  useEffect(() => {
    if (editingField && editRef.current) {
      editRef.current.focus();
      const range = document.createRange();
      const sel = window.getSelection();
      range.selectNodeContents(editRef.current);
      range.collapse(false);
      sel?.removeAllRanges();
      sel?.addRange(range);
    }
  }, [editingField]);

  // Exit edit mode when deselected
  useEffect(() => {
    if (!isSelected) setEditingField(null);
  }, [isSelected]);

  const containerStyle = {
    backgroundColor,
    padding: `${paddingVertical}px ${paddingHorizontal}px`,
    fontFamily: fontStack,
    direction: textDirection,
    textAlign,
    borderBottom: dividerBottom ? `${dividerThickness}px solid ${dividerColor}` : 'none'
  };

  // Check if content exists
  const hasTitle = title && title.trim().length > 0;
  const hasSubtitle = subtitle && subtitle.trim().length > 0;

  const titleStyle = {
    fontSize: `${titleFontSize}px`,
    fontWeight: titleFontWeight,
    color: textColor,
    margin: 0,
    marginBottom: hasSubtitle ? '12px' : (stats && stats.length > 0 ? '32px' : 0),
    lineHeight: 1.2,
    outline: editingField === 'title' ? '2px dashed #04D1FC' : 'none',
    outlineOffset: '4px',
    cursor: isSelected ? 'text' : 'default',
    borderRadius: '4px',
    minHeight: '1em'
  };

  const subtitleStyle = {
    fontSize: '14px',
    fontWeight: '400',
    color: labelColor,
    margin: 0,
    marginBottom: stats && stats.length > 0 ? '32px' : 0,
    lineHeight: 1.5,
    outline: editingField === 'subtitle' ? '2px dashed #04D1FC' : 'none',
    outlineOffset: '4px',
    cursor: isSelected ? 'text' : 'default',
    borderRadius: '4px'
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`
  };

  const statItemStyle = {
    padding: '16px 0',
    borderTop: showDividers ? `1px solid ${accentColor}` : 'none'
  };

  const valueStyle = {
    fontSize: `${valueFontSize}px`,
    fontWeight: valueFontWeight,
    color: textColor,
    lineHeight: 1.1,
    marginBottom: '8px',
    outline: 'none',
    cursor: isSelected ? 'text' : 'default',
    borderRadius: '4px',
    minHeight: '1em'
  };

  const labelStyle = {
    fontSize: `${labelFontSize}px`,
    fontWeight: labelFontWeight,
    color: labelColor,
    lineHeight: 1.4,
    outline: 'none',
    cursor: isSelected ? 'text' : 'default',
    borderRadius: '4px'
  };

  const editableProps = (field, currentValue) => ({
    ref: editingField === field ? editRef : null,
    contentEditable: editingField === field,
    suppressContentEditableWarning: true,
    onDoubleClick: (e) => handleDoubleClick(field, e),
    onBlur: () => handleBlur(field),
    onKeyDown: (e) => handleKeyDown(field, e),
    style: {
      ...(field === 'title' ? titleStyle : field === 'subtitle' ? subtitleStyle : 
          field.includes('value') ? { ...valueStyle, outline: editingField === field ? '2px dashed #04D1FC' : 'none' } : 
          { ...labelStyle, outline: editingField === field ? '2px dashed #04D1FC' : 'none' })
    }
  });

  return (
    <div style={containerStyle}>
      {(hasTitle || isSelected) && (
        <h2 {...editableProps('title', title)}>
          {title || (isSelected ? 'Add title...' : '')}
        </h2>
      )}
      {(hasSubtitle || (isSelected && hasTitle)) && (
        <p {...editableProps('subtitle', subtitle)}>
          {subtitle || (isSelected ? 'Add subtitle...' : '')}
        </p>
      )}
      
      <div style={gridStyle}>
        {stats.map((stat, index) => (
          <div key={index} style={statItemStyle}>
            <div 
              {...editableProps(`stat-${index}-value`, stat.value)}
              style={{ ...valueStyle, outline: editingField === `stat-${index}-value` ? '2px dashed #04D1FC' : 'none' }}
            >
              {stat.value}
            </div>
            <div 
              {...editableProps(`stat-${index}-label`, stat.label)}
              style={{ ...labelStyle, outline: editingField === `stat-${index}-label` ? '2px dashed #04D1FC' : 'none' }}
            >
              {stat.label}
            </div>
          </div>
        ))}
      </div>
      
      {/* Edit hint */}
      {isSelected && !editingField && onTextChange && (
        <div 
          style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            color: 'rgba(0,0,0,0.4)',
            backgroundColor: 'rgba(255,255,255,0.8)',
            padding: '2px 8px',
            borderRadius: '4px',
            zIndex: 10
          }}
        >
          Double-click to edit
        </div>
      )}
    </div>
  );
}

export default StatsSection;
