import React, { createContext, useContext, useState, useCallback } from 'react';

const ClipboardContext = createContext(null);

// Keys to exclude when copying style (content-specific fields)
const CONTENT_KEYS = [
  'id', 'type', 'title', 'subtitle', 'description', 'content', 'text',
  'image', 'images', 'logo', 'heroImage', 'decorativeImage', 'backgroundImage',
  'ctaText', 'ctaUrl', 'dateBadgeText', 'linkText', 'headerLinkText',
  'stats', 'features', 'specs', 'contacts', 'steps', 'rows', 'cards', 'items',
  'segments', 'titleSegments', 'profiles', 'ingredients', 'instructions',
  'socialLinks', 'footerLinks', 'names', 'message', 'headline', 'badgeText',
  'sectionLabel', 'tag', 'headerCta', 'apps', 'updates'
];

export function ClipboardProvider({ children }) {
  const [copiedStyle, setCopiedStyle] = useState(null);
  const [copiedSection, setCopiedSection] = useState(null);

  // Copy style from a section (excludes content)
  const copyStyle = useCallback((section) => {
    if (!section) return;
    
    const style = {};
    Object.keys(section).forEach(key => {
      if (!CONTENT_KEYS.includes(key)) {
        style[key] = section[key];
      }
    });
    
    // Store the section type for validation
    style._sourceType = section.type;
    
    setCopiedStyle(style);
    
    // Also store in localStorage for cross-board copying
    localStorage.setItem('newsletter_copied_style', JSON.stringify(style));
    
    return style;
  }, []);

  // Paste style to a section (returns style object to apply)
  const pasteStyle = useCallback((targetType) => {
    // Try from state first, then localStorage
    let style = copiedStyle;
    if (!style) {
      const stored = localStorage.getItem('newsletter_copied_style');
      if (stored) {
        style = JSON.parse(stored);
        setCopiedStyle(style);
      }
    }
    
    if (!style) return null;
    
    // Check if types are compatible
    if (style._sourceType !== targetType) {
      console.warn(`Cannot paste style from ${style._sourceType} to ${targetType}`);
      return null;
    }
    
    // Return style without the _sourceType meta field
    const { _sourceType, ...styleToApply } = style;
    return styleToApply;
  }, [copiedStyle]);

  // Check if we can paste style to a section type
  const canPasteStyle = useCallback((targetType) => {
    let style = copiedStyle;
    if (!style) {
      const stored = localStorage.getItem('newsletter_copied_style');
      if (stored) {
        style = JSON.parse(stored);
      }
    }
    return style && style._sourceType === targetType;
  }, [copiedStyle]);

  // Copy entire section
  const copySection = useCallback((section) => {
    if (!section) return;
    
    // Deep clone the section
    const sectionCopy = JSON.parse(JSON.stringify(section));
    
    setCopiedSection(sectionCopy);
    
    // Store in localStorage for cross-board copying
    localStorage.setItem('newsletter_copied_section', JSON.stringify(sectionCopy));
    
    return sectionCopy;
  }, []);

  // Get copied section (generates new ID)
  const getCopiedSection = useCallback(() => {
    // Try from state first, then localStorage
    let section = copiedSection;
    if (!section) {
      const stored = localStorage.getItem('newsletter_copied_section');
      if (stored) {
        section = JSON.parse(stored);
        setCopiedSection(section);
      }
    }
    
    if (!section) return null;
    
    // Return with a new unique ID
    return {
      ...section,
      id: `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    };
  }, [copiedSection]);

  // Check if we have a copied section
  const hasCopiedSection = useCallback(() => {
    if (copiedSection) return true;
    const stored = localStorage.getItem('newsletter_copied_section');
    return !!stored;
  }, [copiedSection]);

  // Get copied style type (for UI display)
  const getCopiedStyleType = useCallback(() => {
    let style = copiedStyle;
    if (!style) {
      const stored = localStorage.getItem('newsletter_copied_style');
      if (stored) {
        style = JSON.parse(stored);
      }
    }
    return style?._sourceType || null;
  }, [copiedStyle]);

  // Get copied section type (for UI display)
  const getCopiedSectionType = useCallback(() => {
    let section = copiedSection;
    if (!section) {
      const stored = localStorage.getItem('newsletter_copied_section');
      if (stored) {
        section = JSON.parse(stored);
      }
    }
    return section?.type || null;
  }, [copiedSection]);

  // Clear clipboard
  const clearClipboard = useCallback(() => {
    setCopiedStyle(null);
    setCopiedSection(null);
    localStorage.removeItem('newsletter_copied_style');
    localStorage.removeItem('newsletter_copied_section');
  }, []);

  const value = {
    copyStyle,
    pasteStyle,
    canPasteStyle,
    copySection,
    getCopiedSection,
    hasCopiedSection,
    getCopiedStyleType,
    getCopiedSectionType,
    clearClipboard
  };

  return (
    <ClipboardContext.Provider value={value}>
      {children}
    </ClipboardContext.Provider>
  );
}

export function useClipboard() {
  const context = useContext(ClipboardContext);
  if (!context) {
    throw new Error('useClipboard must be used within a ClipboardProvider');
  }
  return context;
}

export default ClipboardContext;



