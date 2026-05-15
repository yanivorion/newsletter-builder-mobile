import React, { useState, useRef, useCallback, useEffect } from 'react';

const FONT_STACKS = {
  'Noto Sans Hebrew': "'Noto Sans Hebrew', 'Arial Hebrew', Arial, sans-serif",
  'Poppins': "'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Inter': "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Assistant': "'Assistant', 'Arial Hebrew', Arial, sans-serif",
  'Heebo': "'Heebo', 'Arial Hebrew', Arial, sans-serif"
};

function StepsSection({
  sectionLabel = 'STAGES OF COOPERATION',
  title = 'Cooperation & payment',
  steps = [
    { number: '01', title: 'Terms Of Reference From The Customer', note: 'Payment 30%' },
    { number: '02', title: 'Measurement & Layout', note: '' },
    { number: '03', title: 'Visualization Development (Up To 3 Options)', note: 'Payment 40%' },
    { number: '04', title: 'Working Documentation Album Issuing', note: 'Payment 30%' }
  ],
  backgroundColor = '#F5F5F5',
  textColor = '#1D1D1F',
  labelColor = '#86868B',
  noteColor = '#86868B',
  dividerColor = '#D2D2D7',
  fontFamily = 'Poppins',
  sectionLabelFontSize = 11,
  sectionLabelFontWeight = '500',
  titleFontSize = 32,
  titleFontWeight = '700',
  numberFontSize = 12,
  stepTitleFontSize = 16,
  stepTitleFontWeight = '400',
  noteFontSize = 14,
  paddingVertical = 48,
  paddingHorizontal = 24,
  stepPadding = 20,
  showDividers = true,
  // RTL support
  textAlign = 'left',
  textDirection = 'ltr',
  // Divider
  dividerBottom = false,
  dividerBottomColor = '#E5E5E5',
  dividerThickness = 1,
  // Inline editing
  isSelected = false,
  onTextChange
}) {
  const fontStack = FONT_STACKS[fontFamily] || FONT_STACKS.Poppins;
  const [editingField, setEditingField] = useState(null);
  const editRef = useRef(null);

  const handleDoubleClick = useCallback((field, e) => {
    if (!onTextChange) return;
    e.stopPropagation();
    setEditingField(field);
  }, [onTextChange]);

  const handleBlur = useCallback((field) => {
    if (editRef.current && onTextChange) {
      const newValue = editRef.current.innerText.trim();
      onTextChange(field, newValue);
    }
    setEditingField(null);
  }, [onTextChange]);

  const handleKeyDown = useCallback((field, e) => {
    if (e.key === 'Escape') {
      setEditingField(null);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur(field);
    }
  }, [handleBlur]);

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

  useEffect(() => {
    if (!isSelected) setEditingField(null);
  }, [isSelected]);

  // Check if content exists
  const hasSectionLabel = sectionLabel && sectionLabel.trim().length > 0;
  const hasTitle = title && title.trim().length > 0;
  const hasSteps = steps && steps.length > 0;

  const containerStyle = {
    backgroundColor,
    padding: `${paddingVertical}px ${paddingHorizontal}px`,
    fontFamily: fontStack,
    direction: textDirection,
    borderBottom: dividerBottom ? `${dividerThickness}px solid ${dividerBottomColor}` : 'none'
  };

  const sectionLabelStyle = {
    fontSize: `${sectionLabelFontSize}px`,
    fontWeight: sectionLabelFontWeight,
    color: labelColor,
    letterSpacing: '0.1em',
    textTransform: 'uppercase',
    margin: 0,
    marginBottom: (hasTitle || hasSteps) ? '8px' : 0,
    textAlign,
    cursor: isSelected ? 'text' : 'default',
    borderRadius: '4px'
  };

  const titleStyle = {
    fontSize: `${titleFontSize}px`,
    fontWeight: titleFontWeight,
    color: textColor,
    margin: 0,
    marginBottom: hasSteps ? '32px' : 0,
    lineHeight: 1.2,
    textAlign,
    cursor: isSelected ? 'text' : 'default',
    borderRadius: '4px',
    minHeight: '1em'
  };

  const stepsContainerStyle = {
    borderTop: showDividers ? `2px solid ${textColor}` : 'none'
  };

  const stepStyle = {
    padding: `${stepPadding}px 0`,
    borderBottom: showDividers ? `1px solid ${dividerColor}` : 'none',
    display: 'grid',
    gridTemplateColumns: textDirection === 'rtl' ? '1fr 1fr' : '1fr 1fr',
    gap: '16px',
    alignItems: 'start'
  };

  const stepLeftStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    textAlign
  };

  const numberStyle = {
    fontSize: `${numberFontSize}px`,
    fontWeight: '400',
    color: labelColor,
    margin: 0,
    cursor: isSelected ? 'text' : 'default',
    borderRadius: '4px'
  };

  const stepTitleStyle = {
    fontSize: `${stepTitleFontSize}px`,
    fontWeight: stepTitleFontWeight,
    color: labelColor,
    lineHeight: 1.4,
    margin: 0,
    cursor: isSelected ? 'text' : 'default',
    borderRadius: '4px'
  };

  const noteStyle = {
    fontSize: `${noteFontSize}px`,
    fontWeight: '400',
    color: noteColor,
    textAlign: textDirection === 'rtl' ? 'left' : 'right',
    margin: 0,
    cursor: isSelected ? 'text' : 'default',
    borderRadius: '4px'
  };

  const editableProps = (field) => ({
    ref: editingField === field ? editRef : null,
    contentEditable: editingField === field,
    suppressContentEditableWarning: true,
    onDoubleClick: (e) => handleDoubleClick(field, e),
    onBlur: () => handleBlur(field),
    onKeyDown: (e) => handleKeyDown(field, e)
  });

  return (
    <div style={containerStyle}>
      {(hasSectionLabel || isSelected) && (
        <p 
          {...editableProps('sectionLabel')}
          style={{
            ...sectionLabelStyle,
            outline: editingField === 'sectionLabel' ? '2px dashed #04D1FC' : 'none'
          }}
        >
          {sectionLabel || (isSelected ? 'ADD LABEL...' : '')}
        </p>
      )}
      {(hasTitle || isSelected) && (
        <h2 
          {...editableProps('title')}
          style={{
            ...titleStyle,
            outline: editingField === 'title' ? '2px dashed #04D1FC' : 'none'
          }}
        >
          {title || (isSelected ? 'Add title...' : '')}
        </h2>
      )}
      
      {hasSteps && <div style={stepsContainerStyle}>
        {steps.map((step, index) => (
          <div 
            key={index} 
            style={{
              ...stepStyle,
              borderBottom: (showDividers && index < steps.length - 1) ? `1px solid ${dividerColor}` : 'none'
            }}
          >
            <div style={stepLeftStyle}>
              <p 
                {...editableProps(`step-${index}-number`)}
                style={{
                  ...numberStyle,
                  outline: editingField === `step-${index}-number` ? '2px dashed #04D1FC' : 'none'
                }}
              >
                {step.number}
              </p>
              <p 
                {...editableProps(`step-${index}-title`)}
                style={{
                  ...stepTitleStyle,
                  outline: editingField === `step-${index}-title` ? '2px dashed #04D1FC' : 'none'
                }}
              >
                {step.title}
              </p>
            </div>
            {(step.note || isSelected) && (
              <p 
                {...editableProps(`step-${index}-note`)}
                style={{
                  ...noteStyle,
                  outline: editingField === `step-${index}-note` ? '2px dashed #04D1FC' : 'none'
                }}
              >
                {step.note || (isSelected ? 'Add note...' : '')}
              </p>
            )}
          </div>
        ))}
      </div>}
      
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

export default StepsSection;
