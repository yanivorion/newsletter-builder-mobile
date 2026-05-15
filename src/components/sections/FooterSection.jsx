import React from 'react';

// Social media icons - clean minimal SVGs
const SocialIcons = {
  facebook: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z"/>
    </svg>
  ),
  x: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
    </svg>
  ),
  linkedin: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
    </svg>
  ),
  instagram: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
    </svg>
  ),
  rss: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M6.503 20.752c0 1.794-1.456 3.248-3.251 3.248-1.796 0-3.252-1.454-3.252-3.248 0-1.794 1.456-3.248 3.252-3.248 1.795.001 3.251 1.454 3.251 3.248zm-6.503-12.572v4.811c6.05.062 10.96 4.966 11.022 11.009h4.817c-.062-8.71-7.118-15.758-15.839-15.82zm0-3.368c10.58.046 19.152 8.594 19.183 19.188h4.817c-.03-13.231-10.755-23.954-24-24v4.812z"/>
    </svg>
  ),
  youtube: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
    </svg>
  ),
  tiktok: (props) => (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
    </svg>
  )
};

function FooterSection({ 
  // Logo
  logo = null,
  logoWidth = 120,
  logoHeight = 40,
  showLogo = true,
  
  // Tagline (linkable text row below logo)
  tagline = '',
  taglineUrl = '',
  showTagline = true,
  taglineColor = '#6B7280',
  taglineFontSize = 13,
  
  // Social links
  socialLinks = {
    facebook: '',
    x: '',
    linkedin: '',
    instagram: '',
    rss: ''
  },
  showSocial = true,
  socialIconSize = 24,
  socialIconColor = '#4B5563',
  socialGap = 16,
  
  // Address/Company info
  companyInfo = '100 Gansevoort St., New York, NY 10014 • Wix.com Ltd • Wix.com Inc. • Wix.com',
  showCompanyInfo = true,
  companyInfoColor = '#374151',
  companyInfoFontSize = 14,
  
  // Footer links
  footerLinks = [
    { text: 'Unsubscribe', url: '#' },
    { text: 'Help Center', url: '#' },
    { text: 'Privacy Policy', url: '#' },
    { text: 'Terms of Use', url: '#' }
  ],
  showFooterLinks = true,
  linkColor = '#374151',
  linkFontSize = 14,
  linkSeparator = '|',
  
  // Divider
  showDivider = true,
  dividerColor = '#E5E7EB',
  dividerWidth = 1,
  
  // Container
  backgroundColor = '#FFFFFF',
  padding = 40,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight,
  fontFamily = 'Poppins',
  textAlign = 'center',
  
  // Spacing between sections
  sectionGap = 24
}) {
  const containerStyle = {
    fontFamily: `'${fontFamily}', sans-serif`,
    textAlign
  };

  const sectionStyle = {
    marginBottom: `${sectionGap}px`
  };

  const socialContainerStyle = {
    display: 'flex',
    justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
    gap: `${socialGap}px`,
    flexWrap: 'wrap'
  };

  const socialIconStyle = {
    width: `${socialIconSize}px`,
    height: `${socialIconSize}px`,
    color: socialIconColor,
    cursor: 'pointer',
    transition: 'opacity 0.2s'
  };

  const companyInfoStyle = {
    color: companyInfoColor,
    fontSize: `${companyInfoFontSize}px`,
    lineHeight: 1.6
  };

  const linksContainerStyle = {
    display: 'flex',
    justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'center'
  };

  const linkStyle = {
    color: linkColor,
    fontSize: `${linkFontSize}px`,
    textDecoration: 'underline',
    cursor: 'pointer'
  };

  const separatorStyle = {
    color: linkColor,
    fontSize: `${linkFontSize}px`,
    opacity: 0.5
  };

  const dividerStyle = {
    height: `${dividerWidth}px`,
    backgroundColor: dividerColor,
    margin: `${sectionGap}px 0`,
    border: 'none'
  };

  // Get active social platforms
  const activeSocials = Object.entries(socialLinks || {}).filter(([_, url]) => url);

  return (
    <div style={containerStyle}>
      {/* Logo */}
      {showLogo !== false && logo && (
        <div style={{ ...sectionStyle, display: 'flex', justifyContent: textAlign === 'center' ? 'center' : textAlign === 'right' ? 'flex-end' : 'flex-start' }}>
          <img 
            src={logo} 
            alt="Logo" 
            style={{ 
              width: logoWidth ? `${logoWidth}px` : 'auto', 
              height: logoHeight ? `${logoHeight}px` : 'auto',
              objectFit: 'contain'
            }} 
          />
        </div>
      )}

      {/* Tagline */}
      {showTagline !== false && tagline && (
        <div style={{ ...sectionStyle, marginBottom: `${sectionGap / 2}px` }}>
          {taglineUrl ? (
            <a href={taglineUrl} style={{ margin: 0, color: taglineColor, fontSize: `${taglineFontSize}px`, lineHeight: 1.5, textDecoration: 'underline', cursor: 'pointer' }}>
              {tagline}
            </a>
          ) : (
            <p style={{ margin: 0, color: taglineColor, fontSize: `${taglineFontSize}px`, lineHeight: 1.5 }}>
              {tagline}
            </p>
          )}
        </div>
      )}

      {/* Social Icons */}
      {showSocial && (
        <div style={sectionStyle}>
          <div style={socialContainerStyle}>
            {Object.entries(socialLinks || {}).map(([platform, url]) => {
              const IconComponent = SocialIcons[platform];
              if (!IconComponent) return null;
              return (
                <a 
                  key={platform} 
                  href={url || '#'} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ textDecoration: 'none' }}
                >
                  <IconComponent style={socialIconStyle} />
                </a>
              );
            })}
          </div>
        </div>
      )}

      {/* Divider */}
      {showDivider && (showSocial || logo || tagline) && <hr style={dividerStyle} />}

      {/* Company Info */}
      {showCompanyInfo && companyInfo && (
        <div style={{ ...sectionStyle, marginBottom: `${sectionGap / 2}px` }}>
          <p style={{ ...companyInfoStyle, margin: 0 }}>
            {companyInfo}
          </p>
        </div>
      )}

      {/* Footer Links */}
      {showFooterLinks && footerLinks && footerLinks.length > 0 && (
        <div style={sectionStyle}>
          <div style={linksContainerStyle}>
            {footerLinks.map((link, index) => (
              <React.Fragment key={index}>
                <a href={link.url || '#'} style={linkStyle}>
                  {link.text}
                </a>
                {index < footerLinks.length - 1 && linkSeparator && (
                  <span style={separatorStyle}>{linkSeparator}</span>
                )}
              </React.Fragment>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FooterSection;
