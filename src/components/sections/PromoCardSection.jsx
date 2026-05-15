import React from 'react';
import { Image } from 'lucide-react';
import { renderLinkedText } from '../../lib/textUtils';

/**
 * PromoCardSection - A promotional card with image and CTA
 * 
 * Features:
 * - Title + body text
 * - Image placeholder/upload
 * - CTA link with arrow
 * - RTL/LTR support
 * - Flexible layout (image left or right)
 */
function PromoCardSection({
  // Title
  title = 'Card Title',
  titleFontSize = 28,
  titleFontWeight = '700',
  titleColor = '#1A1A1A',
  
  // Body
  body = 'Add your promotional content here. Describe the feature, benefit, or announcement.',
  bodyFontSize = 16,
  bodyLineHeight = 1.7,
  bodyColor = '#555555',
  
  // CTA
  ctaText = 'Learn More →',
  ctaColor = '#04D1FC',
  ctaFontSize = 16,
  ctaFontWeight = '500',
  ctaLink = '#',
  showCta = true,
  
  // Image
  image = null,
  imagePosition = 'right', // 'left' or 'right'
  imageWidth = 200,
  imageHeight = 160,
  imageBorderRadius = 12,
  showImagePlaceholder = true,
  
  // Container
  backgroundColor = '#F8F9FA',
  padding = 32,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  borderRadius = 16,
  gap = 24,
  direction = 'ltr',
  fontFamily = 'Poppins',
  
  // Alignment  
  contentAlign = 'left', // for LTR text alignment
  verticalAlign = 'center', // 'top', 'center', 'bottom'
  
  // Spacing
  titleToBodyGap = 16, // gap between title and body
  bodyToCtaGap = 20 // gap between body and CTA
}) {
  const containerStyle = {
    backgroundColor,
    paddingTop: `${paddingTop ?? padding}px`,
    paddingBottom: `${paddingBottom ?? padding}px`,
    paddingLeft: `${paddingLeft ?? padding}px`,
    paddingRight: `${paddingRight ?? padding}px`,
    borderRadius: `${borderRadius}px`,
    direction,
    fontFamily: `'${fontFamily}', Arial, sans-serif`,
    display: 'flex',
    flexDirection: direction === 'rtl' 
      ? (imagePosition === 'right' ? 'row' : 'row-reverse')
      : (imagePosition === 'right' ? 'row-reverse' : 'row'),
    gap: `${gap}px`,
    alignItems: verticalAlign === 'top' ? 'flex-start' : verticalAlign === 'bottom' ? 'flex-end' : 'center'
  };

  const contentStyle = {
    flex: 1,
    textAlign: contentAlign
  };

  const titleStyle = {
    fontSize: `${titleFontSize}px`,
    fontWeight: titleFontWeight,
    color: titleColor,
    margin: 0,
    marginBottom: `${titleToBodyGap}px`,
    lineHeight: 1.3
  };

  const bodyStyle = {
    fontSize: `${bodyFontSize}px`,
    lineHeight: bodyLineHeight,
    color: bodyColor,
    margin: 0,
    marginBottom: showCta ? `${bodyToCtaGap}px` : 0
  };

  const ctaStyle = {
    display: 'inline-block',
    color: ctaColor,
    fontSize: `${ctaFontSize}px`,
    fontWeight: ctaFontWeight,
    textDecoration: 'none',
    cursor: 'pointer'
  };

  const imageContainerStyle = {
    width: `${imageWidth}px`,
    height: `${imageHeight}px`,
    borderRadius: `${imageBorderRadius}px`,
    overflow: 'hidden',
    flexShrink: 0,
    backgroundColor: '#EAEAEA',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  };

  const imageStyle = {
    width: '100%',
    height: '100%',
    objectFit: 'cover'
  };

  const placeholderStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    color: '#999',
    fontSize: '12px'
  };

  // Parse body - split by double newlines for paragraphs
  const paragraphs = body.split('\n\n').filter(p => p.trim());

  return (
    <div style={containerStyle}>
      {/* Content */}
      <div style={contentStyle}>
        <h3 style={titleStyle}>{renderLinkedText(title)}</h3>
        <div style={bodyStyle}>
          {paragraphs.map((paragraph, index) => (
            <p key={index} style={{ margin: index === 0 ? 0 : '0.8em 0 0 0' }}>
              {renderLinkedText(paragraph)}
            </p>
          ))}
        </div>
        {showCta && ctaText && (
          <a href={ctaLink} style={ctaStyle}>
            {ctaText}
          </a>
        )}
      </div>
      
      {/* Image */}
      {(image || showImagePlaceholder) && (
        <div style={imageContainerStyle}>
          {image ? (
            <img src={image} alt="Promo" style={imageStyle} />
          ) : (
            <div style={placeholderStyle}>
              <Image style={{ width: 32, height: 32, opacity: 0.4 }} />
              <span>Click to add image</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PromoCardSection;
