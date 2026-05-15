import React from 'react';

// Minimalistic user icon SVG
const MinimalUserIcon = ({ size = 40, color = '#9CA3AF' }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" fill={color} />
    <path d="M4 20c0-4 4-6 8-6s8 2 8 6" fill={color} />
  </svg>
);

function ProfileCardsSection({ 
  profiles, 
  columns, 
  imageShape, 
  backgroundColor, 
  showName, 
  showTitle,
  // New props for customization
  imageSize = 100,
  placeholderColor = '#F3F4F6',
  iconColor = '#9CA3AF',
  nameColor = '#1F2937',
  titleColor = '#6B7280',
  nameFontSize = 14,
  titleFontSize = 12,
  fontFamily = 'Poppins',
  gap = 20,
  padding = 30,
  paddingTop,
  paddingBottom,
  paddingLeft,
  paddingRight
}) {
  const containerStyle = {
    backgroundColor: backgroundColor || '#FFFFFF',
    paddingTop: `${paddingTop ?? padding}px`,
    paddingBottom: `${paddingBottom ?? padding}px`,
    paddingLeft: `${paddingLeft ?? 20}px`,
    paddingRight: `${paddingRight ?? 20}px`
  };

  const gridStyle = {
    display: 'grid',
    gridTemplateColumns: `repeat(${columns || 4}, 1fr)`,
    gap: `${gap}px`,
    maxWidth: '600px',
    margin: '0 auto'
  };

  const cardStyle = {
    textAlign: 'center'
  };

  const imageStyle = {
    width: `${imageSize}px`,
    height: `${imageSize}px`,
    borderRadius: imageShape === 'circular' ? '50%' : '8px',
    objectFit: 'cover',
    margin: '0 auto 10px',
    display: 'block'
  };

  const nameStyle = {
    fontFamily: `'${fontFamily}', sans-serif`,
    fontSize: `${nameFontSize}px`,
    fontWeight: '500',
    color: nameColor,
    margin: '8px 0 4px'
  };

  const titleStyle = {
    fontFamily: `'${fontFamily}', sans-serif`,
    fontSize: `${titleFontSize}px`,
    color: titleColor,
    margin: '0'
  };

  const placeholderCount = columns || 4;
  const displayProfiles = profiles && profiles.length > 0 ? profiles : Array(placeholderCount).fill(null);

  return (
    <div style={containerStyle}>
      <div style={gridStyle}>
        {displayProfiles.map((profile, index) => (
          <div key={index} style={cardStyle}>
            {profile && profile.image ? (
              <img src={profile.image} alt={profile.name || `Profile ${index + 1}`} style={imageStyle} />
            ) : (
              <div 
                style={{
                  ...imageStyle,
                  backgroundColor: placeholderColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <MinimalUserIcon size={imageSize * 0.5} color={iconColor} />
              </div>
            )}
            {showName && (
              <div style={nameStyle}>
                {profile?.name || `Name ${index + 1}`}
              </div>
            )}
            {showTitle && (
              <div style={titleStyle}>
                {profile?.title || 'Position'}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

export default ProfileCardsSection;
