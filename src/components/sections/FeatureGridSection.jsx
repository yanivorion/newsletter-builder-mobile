import React, { useState, useRef, useCallback, useEffect } from 'react';

const FONT_STACKS = {
  'Noto Sans Hebrew': "'Noto Sans Hebrew', 'Arial Hebrew', Arial, sans-serif",
  'Poppins': "'Poppins', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Inter': "'Inter', 'Helvetica Neue', Helvetica, Arial, sans-serif",
  'Assistant': "'Assistant', 'Arial Hebrew', Arial, sans-serif",
  'Heebo': "'Heebo', 'Arial Hebrew', Arial, sans-serif"
};

function FeatureGridSection({
  image = '',
  imageHeight = 400,
  imageFit = 'contain',
  imagePosition = 'top',
  title = '',
  subtitle = '',
  features = [
    { number: '①', title: 'Active Noise Cancellation', description: 'with Transparency mode' },
    { number: '②', title: 'Personalized Spatial Audio', description: 'for theater-like sound that surrounds you' },
    { number: '③', title: 'Stunning design', description: 'with an exceptional fit' },
    { number: '④', title: 'High-fidelity', description: 'audio' }
  ],
  featureColumns = 2,
  backgroundColor = '#F5F5F7',
  textColor = '#1D1D1F',
  accentColor = '#86868B',
  fontFamily = 'Poppins',
  titleFontSize = 56,
  titleFontWeight = '700',
  featureTitleFontSize = 14,
  featureDescFontSize = 14,
  paddingVertical = 48,
  paddingHorizontal = 24,
  gap = 24,
  showNumbers = true,
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
  const hasTitle = title && title.trim().length > 0;
  const hasSubtitle = subtitle && subtitle.trim().length > 0;
  const hasImage = image && image.trim().length > 0;
  const hasFeatures = features && features.length > 0;

  const containerStyle = {
    backgroundColor,
    padding: `${paddingVertical}px ${paddingHorizontal}px`,
    fontFamily: fontStack,
    direction: textDirection,
    textAlign,
    borderBottom: dividerBottom ? `${dividerThickness}px solid ${dividerColor}` : 'none'
  };

  // Calculate if there's content after title/subtitle
  const hasContentAfterTitle = hasSubtitle || (imagePosition === 'top' && hasImage) || hasFeatures;
  const hasContentAfterSubtitle = (imagePosition === 'top' && hasImage) || hasFeatures;

  const titleStyle = {
    fontSize: `${titleFontSize}px`,
    fontWeight: titleFontWeight,
    color: textColor,
    margin: 0,
    marginBottom: hasSubtitle ? '8px' : (hasContentAfterTitle ? '24px' : 0),
    lineHeight: 1.1,
    letterSpacing: '-0.02em',
    outline: editingField === 'title' ? '2px dashed #04D1FC' : 'none',
    outlineOffset: '4px',
    cursor: isSelected ? 'text' : 'default',
    borderRadius: '4px',
    minHeight: '1em'
  };

  const subtitleStyle = {
    fontSize: '17px',
    fontWeight: '400',
    color: accentColor,
    margin: 0,
    marginBottom: hasContentAfterSubtitle ? '24px' : 0,
    lineHeight: 1.4,
    outline: editingField === 'subtitle' ? '2px dashed #04D1FC' : 'none',
    outlineOffset: '4px',
    cursor: isSelected ? 'text' : 'default',
    borderRadius: '4px'
  };

  const imageContainerStyle = {
    width: '100%',
    height: `${imageHeight}px`,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: (imagePosition === 'top' && hasFeatures) ? `${gap}px` : 0,
    marginTop: (imagePosition === 'bottom' && hasFeatures) ? `${gap}px` : 0
  };

  const imageStyle = {
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: imageFit
  };

  const featuresGridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${featureColumns}, 1fr)`,
    gap: `${gap}px`
  };

  const featureItemStyle = {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  };

  const featureNumberStyle = {
    fontSize: '12px',
    color: accentColor,
    marginBottom: '4px'
  };

  const featureTitleStyle = {
    fontSize: `${featureTitleFontSize}px`,
    fontWeight: '400',
    color: accentColor,
    lineHeight: 1.4,
    margin: 0,
    cursor: isSelected ? 'text' : 'default',
    borderRadius: '4px'
  };

  const featureDescStyle = {
    fontSize: `${featureDescFontSize}px`,
    fontWeight: '400',
    color: accentColor,
    lineHeight: 1.4,
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

  const renderImage = () => (
    image && (
      <div style={imageContainerStyle}>
        <img src={image} alt="Feature" style={imageStyle} />
      </div>
    )
  );

  const renderFeatures = () => (
    <div style={featuresGridStyle}>
      {features.map((feature, index) => (
        <div key={index} style={featureItemStyle}>
          {showNumbers && (
            <div 
              {...editableProps(`feature-${index}-number`)}
              style={{
                ...featureNumberStyle,
                outline: editingField === `feature-${index}-number` ? '2px dashed #04D1FC' : 'none'
              }}
            >
              {feature.number || `⓪①②③④⑤⑥⑦⑧⑨`[index + 1] || `${index + 1}`}
            </div>
          )}
          <p 
            {...editableProps(`feature-${index}-title`)}
            style={{
              ...featureTitleStyle,
              outline: editingField === `feature-${index}-title` ? '2px dashed #04D1FC' : 'none'
            }}
          >
            {feature.title}
          </p>
          {feature.description && (
            <p 
              {...editableProps(`feature-${index}-description`)}
              style={{
                ...featureDescStyle,
                outline: editingField === `feature-${index}-description` ? '2px dashed #04D1FC' : 'none'
              }}
            >
              {feature.description}
            </p>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div style={containerStyle}>
      {(hasTitle || isSelected) && (
        <h2 {...editableProps('title')} style={titleStyle}>
          {title || (isSelected ? 'Add title...' : '')}
        </h2>
      )}
      {(hasSubtitle || (isSelected && hasTitle)) && (
        <p {...editableProps('subtitle')} style={subtitleStyle}>
          {subtitle || (isSelected ? 'Add subtitle...' : '')}
        </p>
      )}
      
      {imagePosition === 'top' && hasImage && renderImage()}
      {hasFeatures && renderFeatures()}
      {imagePosition === 'bottom' && hasImage && renderImage()}
      
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

export default FeatureGridSection;
