import React from 'react';
import { Image, GripHorizontal } from 'lucide-react';
import { cn } from '../../lib/utils';
import { renderLinkedText } from '../../lib/textUtils';

// Inline draggable spacer for edit mode
function InlineSpacerHandle({ value, onChange, min = 0, max = 100, label, isEditing }) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isHovered, setIsHovered] = React.useState(false);
  const startYRef = React.useRef(0);
  const startValueRef = React.useRef(0);

  const handleMouseDown = React.useCallback((e) => {
    if (!isEditing) return;
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;

    const handleMouseMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startYRef.current;
      const newValue = Math.min(max, Math.max(min, startValueRef.current + deltaY));
      onChange(Math.round(newValue));
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [value, onChange, min, max, isEditing]);

  if (!isEditing) {
    // Just render the spacing
    return <div style={{ height: `${value}px` }} />;
  }

  const showHandle = isDragging || isHovered;

  return (
    <div 
      className={cn(
        "relative flex items-center justify-center select-none transition-all group/spacer",
        "cursor-ns-resize"
      )}
      style={{ height: `${Math.max(value, 16)}px`, minHeight: '16px' }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onMouseDown={handleMouseDown}
    >
      {/* Always visible indicator dots */}
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex items-center justify-center gap-1 opacity-30 group-hover/spacer:opacity-0 transition-opacity">
        <div className="w-1 h-1 rounded-full bg-white" />
        <div className="w-1 h-1 rounded-full bg-white" />
        <div className="w-1 h-1 rounded-full bg-white" />
      </div>
      
      {/* Visual spacer line on hover */}
      <div 
        className={cn(
          "absolute inset-x-8 top-1/2 -translate-y-1/2 h-[2px] rounded-full transition-all",
          showHandle ? "opacity-100" : "opacity-0"
        )}
        style={{ 
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)'
        }}
      />
      
      {/* Handle pill */}
      <div 
        className={cn(
          "absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10",
          "flex items-center gap-1 px-2.5 py-1 rounded-full",
          "text-[10px] font-semibold whitespace-nowrap",
          "transition-all duration-150",
          showHandle 
            ? "opacity-100 bg-white text-zinc-800 shadow-xl scale-100" 
            : "opacity-0 scale-90 pointer-events-none"
        )}
      >
        <GripHorizontal className="w-3.5 h-3.5 text-zinc-400" />
        <span>{value}px</span>
        {label && <span className="text-zinc-400 ml-1">{label}</span>}
      </div>
    </div>
  );
}

function HeaderSection({ 
  backgroundColor, 
  gradientEnd, 
  logo, 
  logoWidth = 120,
  logoHeight = 'auto',
  logoAlignment = 'center',
  // Hero image (below logo)
  heroImage,
  heroImageWidth = '100%',
  heroImageHeight = 200,
  heroImageFit = 'cover',
  showHeroPlaceholder = true,
  title, 
  titleFontSize = 28,
  titleFontWeight = '700',
  titleFontStyle = 'normal',
  titleLetterSpacing = '-0.02em',
  titleLineHeight = 1.2,
  subtitle,
  subtitleFontSize = 16,
  subtitleFontWeight = '400',
  subtitleLetterSpacing = '0',
  subtitleLineHeight = 1.4,
  showDateBadge = false,
  dateBadgeText = 'JULY 2025',
  dateBadgeBg = '#04D1FC',
  dateBadgeColor = '#FFFFFF',
  textColor = '#FFFFFF',
  // Spacing controls
  paddingTop = 0,
  paddingBottom = 0,
  paddingHorizontal = 0,
  spacingLogoToHero = 20,
  spacingHeroToTitle = 24,
  spacingTitleToSubtitle = 8,
  // Edit mode
  isEditing = false,
  onSpacingChange
}) {
  const handleSpacingChange = (field, value) => {
    if (onSpacingChange) {
      onSpacingChange(field, value);
    }
  };

  // Support transparent background to show container's background image
  const hasBackground = backgroundColor && backgroundColor !== 'transparent' && backgroundColor !== '';
  
  const headerStyle = {
    background: hasBackground 
      ? `linear-gradient(135deg, ${backgroundColor} 0%, ${gradientEnd || backgroundColor} 100%)`
      : 'transparent',
    paddingLeft: `${paddingHorizontal}px`,
    paddingRight: `${paddingHorizontal}px`,
    textAlign: 'center',
    color: textColor,
    position: 'relative'
  };

  const logoContainerStyle = {
    textAlign: logoAlignment
  };

  const logoStyle = {
    width: `${logoWidth}px`,
    height: logoHeight === 'auto' ? 'auto' : `${logoHeight}px`,
    maxWidth: '100%',
    display: 'inline-block',
    objectFit: 'contain'
  };

  const heroContainerStyle = {
    borderRadius: '8px',
    overflow: 'hidden'
  };

  const heroImageStyle = {
    width: heroImageWidth,
    height: `${heroImageHeight}px`,
    objectFit: heroImageFit,
    display: 'block',
    margin: '0 auto',
    borderRadius: '8px'
  };

  const heroPlaceholderStyle = {
    width: '100%',
    height: `${heroImageHeight}px`,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '8px',
    border: '2px dashed rgba(255,255,255,0.3)'
  };

  const titleStyle = {
    fontFamily: "'Poppins', 'Helvetica Neue', Arial, sans-serif", 
    fontSize: `${titleFontSize}px`, 
    fontWeight: titleFontWeight,
    fontStyle: titleFontStyle,
    margin: '0',
    letterSpacing: titleLetterSpacing,
    lineHeight: titleLineHeight,
    color: textColor
  };

  const dateBadgeStyle = {
    position: 'absolute',
    bottom: '16px',
    right: '16px',
    backgroundColor: dateBadgeBg,
    color: dateBadgeColor,
    padding: '6px 14px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '600',
    fontFamily: "'Poppins', Arial, sans-serif",
    letterSpacing: '0.05em'
  };

  const showHero = heroImage || showHeroPlaceholder;

  return (
    <div style={headerStyle}>
      {/* Top Padding Handle */}
      <InlineSpacerHandle
        value={paddingTop}
        onChange={(v) => handleSpacingChange('paddingTop', v)}
        min={8}
        max={120}
        isEditing={isEditing}
      />

      {logo && (
        <>
          <div style={logoContainerStyle}>
            <img 
              src={logo} 
              alt="Logo" 
              style={logoStyle}
            />
          </div>
          
          {/* Logo to Hero Spacing Handle */}
          {showHero && (
            <InlineSpacerHandle
              value={spacingLogoToHero}
              onChange={(v) => handleSpacingChange('spacingLogoToHero', v)}
              min={0}
              max={80}
              isEditing={isEditing}
            />
          )}
        </>
      )}

      {/* Hero Image Section */}
      {showHero && (
        <>
          <div style={heroContainerStyle}>
            {heroImage ? (
              <img 
                src={heroImage} 
                alt="Hero" 
                style={heroImageStyle}
              />
            ) : (
              <div style={heroPlaceholderStyle}>
                <Image style={{ width: 32, height: 32, opacity: 0.5 }} />
                <span style={{ fontSize: '12px', opacity: 0.6 }}>Hero Image</span>
              </div>
            )}
          </div>
          
          {/* Hero to Title Spacing Handle */}
          {title && (
            <InlineSpacerHandle
              value={spacingHeroToTitle}
              onChange={(v) => handleSpacingChange('spacingHeroToTitle', v)}
              min={0}
              max={80}
              isEditing={isEditing}
            />
          )}
        </>
      )}
      
      {title && (
        <h1 style={titleStyle}>
          {renderLinkedText(title)}
        </h1>
      )}
      
      {/* Title to Subtitle Spacing Handle */}
      {title && subtitle && (
        <InlineSpacerHandle
          value={spacingTitleToSubtitle}
          onChange={(v) => handleSpacingChange('spacingTitleToSubtitle', v)}
          min={0}
          max={40}
          isEditing={isEditing}
        />
      )}
      
      {subtitle && (
        <p style={{ 
          fontFamily: "'Poppins', 'Noto Sans Hebrew', Arial, sans-serif", 
          fontSize: `${subtitleFontSize}px`,
          fontWeight: subtitleFontWeight,
          margin: '0',
          opacity: 0.9,
          letterSpacing: subtitleLetterSpacing,
          lineHeight: subtitleLineHeight,
          color: textColor
        }}>
          {subtitle}
        </p>
      )}

      {/* Bottom Padding Handle */}
      <InlineSpacerHandle
        value={paddingBottom}
        onChange={(v) => handleSpacingChange('paddingBottom', v)}
        min={8}
        max={120}
        isEditing={isEditing}
      />

      {showDateBadge && dateBadgeText && (
        <div style={dateBadgeStyle}>
          {dateBadgeText}
        </div>
      )}
    </div>
  );
}

export default HeaderSection;
