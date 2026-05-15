import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Image } from 'lucide-react';

function ImageSequenceSection({
  images = [],
  frameDuration = 500,
  backgroundColor = '#FFFFFF',
  showControls = false,
  showThumbnails = false,
  showFrameCounter = false,
  autoPlay = true,
  previewHeight = 300,
  borderRadius = 0,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const animationRef = useRef(null);

  // Animation loop
  useEffect(() => {
    if (isPlaying && images.length > 1) {
      animationRef.current = setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % images.length);
      }, frameDuration);
    }
    
    return () => {
      if (animationRef.current) {
        clearTimeout(animationRef.current);
      }
    };
  }, [isPlaying, currentIndex, frameDuration, images.length]);

  // Auto-play when images exist
  useEffect(() => {
    if (images.length > 1 && autoPlay) {
      setIsPlaying(true);
    }
  }, [images.length, autoPlay]);

  if (images.length === 0) {
    return (
      <div 
        style={{ 
          backgroundColor, 
          padding: showThumbnails ? '16px' : '0' 
        }}
      >
        <div 
          style={{
            width: '100%',
            height: `${previewHeight}px`,
            backgroundColor: '#f4f4f5',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            color: '#a1a1aa'
          }}
        >
          <Image style={{ width: 48, height: 48, opacity: 0.4 }} />
          <span style={{ fontSize: '14px' }}>Image Sequence</span>
          <span style={{ fontSize: '12px', opacity: 0.7 }}>Upload images in the sidebar</span>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="image-sequence-section"
      style={{ 
        backgroundColor, 
        padding: showThumbnails ? '16px' : '0',
        position: 'relative'
      }}
    >
      {/* Preview Area - using background-image for reliable cover */}
      <div 
        style={{
          width: '100%',
          height: `${previewHeight}px`,
          position: 'relative',
          overflow: 'hidden',
          borderRadius: borderRadius || (showThumbnails ? 8 : 0),
          backgroundColor: backgroundColor
        }}
      >
        {images.map((image, index) => (
          <div
            key={index}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundImage: `url(${image})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              backgroundRepeat: 'no-repeat',
              opacity: currentIndex === index ? 1 : 0,
              transition: 'opacity 150ms ease-out'
            }}
          />
        ))}
        
        {/* Frame Counter */}
        {showFrameCounter && (
          <div style={{
            position: 'absolute',
            bottom: '12px',
            right: '12px',
            backgroundColor: 'rgba(0,0,0,0.6)',
            color: '#FFFFFF',
            padding: '4px 12px',
            borderRadius: '4px',
            fontSize: '12px',
            fontWeight: '500',
            zIndex: 10
          }}>
            {currentIndex + 1} / {images.length}
          </div>
        )}

        {/* Play/Pause Controls */}
        {showControls && images.length > 1 && (
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              backgroundColor: 'rgba(0,0,0,0.6)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '4px',
              padding: '6px 12px',
              fontSize: '12px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '4px',
              zIndex: 10
            }}
          >
            {isPlaying ? <Pause size={14} /> : <Play size={14} />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
        )}
      </div>

      {/* Thumbnail Strip */}
      {showThumbnails && images.length > 1 && (
        <div style={{
          display: 'flex',
          gap: '8px',
          marginTop: '12px',
          overflowX: 'auto',
          paddingBottom: '4px'
        }}>
          {images.map((image, index) => (
            <div
              key={index}
              onClick={() => setCurrentIndex(index)}
              style={{
                flexShrink: 0,
                width: '60px',
                height: '60px',
                borderRadius: '4px',
                overflow: 'hidden',
                border: currentIndex === index ? '2px solid #04D1FC' : '1px solid #e4e4e7',
                cursor: 'pointer',
                opacity: currentIndex === index ? 1 : 0.7,
                backgroundImage: `url(${image})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ImageSequenceSection;
