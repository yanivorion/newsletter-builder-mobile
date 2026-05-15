import React, { useState, useRef, useCallback, useEffect } from 'react';

const FONT_STACKS = {
  'Noto Sans Hebrew': "'Noto Sans Hebrew', 'Arial Hebrew', Arial, sans-serif",
  'Poppins': "'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Inter': "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
};

function FeatureCardsSection({
  cards = [
    {
      image: '',
      label: 'New',
      title: 'Card title',
      description: 'A short description of the feature or update you want to share with readers.',
      linkText: 'Read more',
      linkUrl: '#'
    },
    {
      image: '',
      label: 'Update',
      title: 'Second title',
      description: 'Another line that explains the content or announcement.',
      linkText: 'Learn more',
      linkUrl: '#'
    }
  ],
  columns = 2,
  imageHeight = 200,
  imageFit = 'cover',
  backgroundColor = '#F5F5F7',
  cardBackgroundColor = '#FFFFFF',
  textColor = '#1D1D1F',
  labelColor = '#86868B',
  linkColor = '#5856D6',
  fontFamily = 'Poppins',
  titleFontSize = 20,
  descFontSize = 14,
  labelFontSize = 12,
  paddingVertical = 48,
  paddingHorizontal = 24,
  gap = 24,
  cardPadding = 0,
  cardBorderRadius = 8,
  textAlign = 'left',
  textDirection = 'ltr',
  showLabels = true,
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

  useEffect(() => {
    if (editingField && editRef.current) {
      editRef.current.focus();
    }
  }, [editingField]);

  useEffect(() => {
    if (!isSelected) setEditingField(null);
  }, [isSelected]);

  const containerStyle = {
    backgroundColor,
    padding: `${paddingVertical}px ${paddingHorizontal}px`,
    fontFamily: fontStack,
    direction: textDirection,
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns}, 1fr)`,
    gap: `${gap}px`,
  };

  const cardStyle = {
    backgroundColor: cardBackgroundColor,
    borderRadius: `${cardBorderRadius}px`,
    overflow: 'hidden',
  };

  const imageContainerStyle = {
    width: '100%',
    height: `${imageHeight}px`,
    backgroundColor: '#E5E5E7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  };

  const cardContentStyle = {
    padding: cardPadding > 0 ? `${cardPadding}px` : '16px',
    textAlign,
  };

  const labelStyle = {
    fontSize: `${labelFontSize}px`,
    fontWeight: '500',
    color: labelColor,
    textTransform: 'uppercase',
    letterSpacing: '0.05em',
    marginBottom: '8px',
    cursor: isSelected ? 'text' : 'default',
  };

  const titleStyle = {
    fontSize: `${titleFontSize}px`,
    fontWeight: '600',
    color: textColor,
    margin: 0,
    marginBottom: '8px',
    lineHeight: 1.3,
    cursor: isSelected ? 'text' : 'default',
  };

  const descStyle = {
    fontSize: `${descFontSize}px`,
    fontWeight: '400',
    color: labelColor,
    margin: 0,
    marginBottom: '12px',
    lineHeight: 1.5,
    cursor: isSelected ? 'text' : 'default',
  };

  const linkStyle = {
    fontSize: `${descFontSize}px`,
    fontWeight: '500',
    color: linkColor,
    textDecoration: 'underline',
    cursor: isSelected ? 'text' : 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '4px',
  };

  const editableProps = (field) => ({
    ref: editingField === field ? editRef : null,
    contentEditable: editingField === field,
    suppressContentEditableWarning: true,
    onDoubleClick: (e) => handleDoubleClick(field, e),
    onBlur: () => handleBlur(field),
  });

  return (
    <div style={containerStyle}>
      <div style={gridStyle}>
        {cards.map((card, index) => (
          <div key={index} style={cardStyle}>
            <div style={imageContainerStyle}>
              {card.image ? (
                <img 
                  src={card.image} 
                  alt={card.title}
                  style={{ width: '100%', height: '100%', objectFit: imageFit }}
                />
              ) : (
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#C0C0C0" strokeWidth="1">
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <circle cx="8.5" cy="8.5" r="1.5" />
                  <path d="M21 15l-5-5L5 21" />
                </svg>
              )}
            </div>
            <div style={cardContentStyle}>
              {showLabels && card.label && (
                <div 
                  {...editableProps(`card-${index}-label`)}
                  style={{
                    ...labelStyle,
                    outline: editingField === `card-${index}-label` ? '2px dashed #04D1FC' : 'none',
                  }}
                >
                  {card.label}
                </div>
              )}
              <h3 
                {...editableProps(`card-${index}-title`)}
                style={{
                  ...titleStyle,
                  outline: editingField === `card-${index}-title` ? '2px dashed #04D1FC' : 'none',
                }}
              >
                {card.title}
              </h3>
              <p 
                {...editableProps(`card-${index}-description`)}
                style={{
                  ...descStyle,
                  outline: editingField === `card-${index}-description` ? '2px dashed #04D1FC' : 'none',
                }}
              >
                {card.description}
              </p>
                <a 
                {...editableProps(`card-${index}-linkText`)}
                  style={{
                  ...linkStyle,
                  outline: editingField === `card-${index}-linkText` ? '2px dashed #04D1FC' : 'none',
                  }}
                href={editingField ? undefined : card.linkUrl}
                >
                {card.linkText}
                <span style={{ fontSize: '14px' }}>→</span>
                </a>
            </div>
          </div>
        ))}
      </div>
      
      {isSelected && !editingField && onTextChange && (
        <div style={{
            position: 'absolute',
            bottom: '8px',
            left: '50%',
            transform: 'translateX(-50%)',
            fontSize: '10px',
            color: 'rgba(0,0,0,0.4)',
            backgroundColor: 'rgba(255,255,255,0.8)',
            padding: '2px 8px',
            borderRadius: '4px',
        }}>
          Double-click to edit
        </div>
      )}
    </div>
  );
}

export default FeatureCardsSection;
