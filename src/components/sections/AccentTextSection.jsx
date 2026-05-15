import React from 'react';
import { renderLinkedText } from '../../lib/textUtils';

/**
 * AccentTextSection - A text section with a prominent tag/badge
 * 
 * Features:
 * - Colored tag/badge positioned in corner
 * - Rich text content area
 * - RTL/LTR support
 * - Customizable colors
 */
function AccentTextSection({
  // Tag/Badge
  tagText = 'HIGHLIGHT',
  tagBackgroundColor = '#04D1FC',
  tagTextColor = '#FFFFFF',
  tagPosition = 'top-right', // top-left, top-right
  tagFontSize = 14,
  tagPadding = '8px 20px',
  tagBorderRadius = 8,
  
  // Content
  content = 'Enter your text here...',
  contentFontSize = 18,
  contentLineHeight = 1.8,
  contentColor = '#333333',
  contentAlign = 'left', // for LTR
  
  // Spacing
  tagToContentGap = 60, // gap between tag and content
  
  // Container
  backgroundColor = '#FFFFFF',
  padding = 40,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  direction = 'ltr',
  fontFamily = 'Poppins'
}) {
  const containerStyle = {
    backgroundColor,
    paddingTop: `${paddingTop ?? padding}px`,
    paddingBottom: `${paddingBottom ?? padding}px`,
    paddingLeft: `${paddingLeft ?? padding}px`,
    paddingRight: `${paddingRight ?? padding}px`,
    position: 'relative',
    direction,
    fontFamily: `'${fontFamily}', Arial, sans-serif`
  };

  const tagStyle = {
    position: 'absolute',
    top: '20px',
    [tagPosition === 'top-right' ? 'right' : 'left']: '20px',
    backgroundColor: tagBackgroundColor,
    color: tagTextColor,
    padding: tagPadding,
    borderRadius: `${tagBorderRadius}px`,
    fontSize: `${tagFontSize}px`,
    fontWeight: '600',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap'
  };

  const contentStyle = {
    fontSize: `${contentFontSize}px`,
    lineHeight: contentLineHeight,
    color: contentColor,
    textAlign: contentAlign,
    marginTop: `${tagToContentGap}px`, // Space for the tag
    paddingTop: '20px'
  };

  // Parse content - split by double newlines for paragraphs
  const paragraphs = content.split('\n\n').filter(p => p.trim());

  return (
    <div style={containerStyle}>
      {/* Tag/Badge */}
      <div style={tagStyle}>
        {tagText}
      </div>
      
      {/* Content */}
      <div style={contentStyle}>
        {paragraphs.map((paragraph, index) => (
          <p key={index} style={{ margin: index === 0 ? 0 : '1em 0 0 0' }}>
            {renderLinkedText(paragraph)}
          </p>
        ))}
      </div>
    </div>
  );
}

export default AccentTextSection;
