import React, { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Upload, Trash2, Plus } from 'lucide-react';
import { createSavedTemplate2 } from '@/lib/templates/saved-template-2';

const blankTemplate = {
  id: 'blank',
  name: 'New Newsletter',
  pageSettings: {
    outerBackgroundColor: '#F5F5F5',
    outerPadding: 20,
    innerBackgroundColor: '#FFFFFF',
    innerBorderWidth: 0,
    innerBorderColor: '#E5E5E5',
    innerBorderRadius: 0
  },
  sections: [
    { 
      id: 'header-1', 
      type: 'header', 
      backgroundColor: '#FFFFFF', 
      gradientEnd: '#F5F5F5', 
      logo: null, 
      title: '', 
      titleFontSize: 32,
      subtitle: '', 
      textColor: '#1C1917',
      paddingTop: 0,
      paddingBottom: 0,
      paddingHorizontal: 0,
      spacingLogoToHero: 20,
      spacingHeroToTitle: 24,
      spacingTitleToSubtitle: 8,
      showHeroPlaceholder: false,
      height: 350
    },
    {
      id: 'footer-1',
      type: 'footer',
      background: { type: 'solid', color: '#FFFFFF' },
      padding: { top: 40, bottom: 40, left: 24, right: 24 },
      height: 'auto',
      textColor: '#6B7280',
      textAlign: 'center',
      logo: null,
      showLogo: true,
      tagline: '',
      taglineUrl: '',
      showTagline: true,
      showSocial: true,
      socialLinks: {},
      socialIconSize: 24,
      socialIconColor: '#4B5563',
      showCompanyInfo: true,
      companyInfo: 'Wix.com \u2022 40 Namal Tel Aviv St.,Tel Aviv 6350671',
      companyInfoColor: '#374151',
      companyInfoFontSize: 14,
      showDivider: true,
      dividerColor: '#E5E7EB',
      showFooterLinks: true,
      footerLinks: [
        { text: 'Unsubscribe', url: '#' },
        { text: 'View in Browser', url: '#' },
        { text: 'Privacy Policy', url: '#' },
      ],
      linkColor: '#374151',
      linkFontSize: 14,
      fontFamily: 'Poppins',
    }
  ]
};

const BRAND = {
  navy: '#1B2845',
  blue: '#4A7FF8',
  orange: '#FF7648',
  yellow: '#FFC757',
  cream: '#F0EFEB',
  white: '#FFFFFF',
  dark: '#202020',
  warmGradient: 'linear-gradient(135deg, #FFB347 0%, #FF7648 40%, #FFC757 100%)',
  meshBg: `
    radial-gradient(ellipse at 20% 50%, rgba(255,179,71,0.35) 0%, transparent 50%),
    radial-gradient(ellipse at 80% 20%, rgba(255,118,72,0.25) 0%, transparent 50%),
    radial-gradient(ellipse at 60% 80%, rgba(255,199,87,0.3) 0%, transparent 50%),
    radial-gradient(ellipse at 90% 60%, rgba(74,127,248,0.12) 0%, transparent 50%),
    linear-gradient(180deg, #F0EFEB 0%, #FAF8F5 100%)
  `,
};

function TemplateSelector({ 
  onSelectTemplate, 
  hasSavedNewsletter, 
  onContinueEditing,
  lastSaveTime,
  projects = [],
  onLoadProject,
  onDeleteProject,
  onImportJSON
}) {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (file && onImportJSON) {
      try {
        await onImportJSON(file);
      } catch (error) {
        alert(`Import failed: ${error.message}`);
      }
    }
    e.target.value = '';
  };

  const handleStartNew = () => {
    onSelectTemplate(blankTemplate);
  };

  return (
    <div style={{
      minHeight: '100%',
      height: '100%',
      background: BRAND.meshBg,
      fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap" rel="stylesheet" />

      {/* Top bar */}
      <header style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 16px',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: 'rgba(240, 239, 235, 0.7)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(0,0,0,0.04)',
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}>
          <svg width="28" height="28" viewBox="0 0 32 32" fill="none">
            <path d="M16 4C9.373 4 4 9.373 4 16s5.373 12 12 12 12-5.373 12-12S22.627 4 16 4zm0 2c5.523 0 10 4.477 10 10s-4.477 10-10 10S6 21.523 6 16 10.477 6 16 6z" fill={BRAND.navy} opacity="0.15"/>
            <path d="M12 11.5c0-1.38 1.12-2.5 2.5-2.5h3c1.38 0 2.5 1.12 2.5 2.5v0c0 1.38-1.12 2.5-2.5 2.5h-1v4h1c1.38 0 2.5 1.12 2.5 2.5v0c0 1.38-1.12 2.5-2.5 2.5h-3c-1.38 0-2.5-1.12-2.5-2.5v0c0-1.38 1.12-2.5 2.5-2.5h1v-4h-1C13.12 14 12 12.88 12 11.5z" fill={BRAND.navy}/>
          </svg>
          <span style={{
            fontSize: 14,
            fontWeight: 600,
            color: BRAND.dark,
            letterSpacing: '-0.01em',
          }}>
            Studio Newsletter
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: BRAND.dark,
              background: 'rgba(255,255,255,0.6)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 8,
              padding: '8px 16px',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'all 200ms ease-out',
            }}
          >
            <Upload size={14} />
            Import JSON
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            style={{ display: 'none' }}
          />
        </div>
      </header>

      {/* Hero */}
      <div style={{
        maxWidth: 1000,
        margin: '0 auto',
        padding: '80px 32px 40px',
        textAlign: 'center',
      }}>
        {/* Headline */}
        <h1 style={{
          fontSize: 'clamp(40px, 6vw, 72px)',
          fontWeight: 700,
          color: BRAND.dark,
          margin: '0 0 16px 0',
          lineHeight: 1.05,
          letterSpacing: '-0.035em',
        }}>
          Create your<br />
          <span style={{
            background: 'linear-gradient(135deg, #FF7648 0%, #FFC757 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}>
            next newsletter
          </span>
        </h1>

        <p style={{
          fontSize: 18,
          fontWeight: 400,
          color: 'rgba(32,32,32,0.55)',
          margin: '0 0 48px 0',
          lineHeight: 1.5,
          maxWidth: 420,
          marginLeft: 'auto',
          marginRight: 'auto',
        }}>
          Design, build and share beautiful newsletters with the Studio visual editor.
        </p>

        {/* Action buttons */}
        <div style={{
          display: 'flex',
          gap: 12,
          justifyContent: 'center',
          alignItems: 'center',
          flexWrap: 'wrap',
          marginBottom: 80,
        }}>
          <button
            onClick={handleStartNew}
            onMouseEnter={() => setHoveredCard('start')}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              background: BRAND.dark,
              color: BRAND.white,
              border: 'none',
              borderRadius: 12,
              padding: '14px 36px',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              transform: hoveredCard === 'start' ? 'translateY(-2px)' : 'translateY(0)',
              transition: 'all 280ms cubic-bezier(0.22, 1, 0.36, 1)',
              boxShadow: hoveredCard === 'start'
                ? '0 12px 32px rgba(32,32,32,0.2)'
                : '0 4px 16px rgba(32,32,32,0.12)',
            }}
          >
            Start New
            <ArrowRight size={16} strokeWidth={2.5} />
          </button>

          {hasSavedNewsletter && (
            <button
              onClick={onContinueEditing}
              onMouseEnter={() => setHoveredCard('continue')}
              onMouseLeave={() => setHoveredCard(null)}
              title={lastSaveTime ? `Last saved: ${lastSaveTime.toLocaleString()}` : undefined}
              style={{
                background: 'rgba(255,255,255,0.7)',
                color: BRAND.dark,
                border: '1px solid rgba(0,0,0,0.08)',
                borderRadius: 12,
                padding: '14px 36px',
                fontSize: 15,
                fontWeight: 500,
                cursor: 'pointer',
                transform: hoveredCard === 'continue' ? 'translateY(-2px)' : 'translateY(0)',
                transition: 'all 280ms cubic-bezier(0.22, 1, 0.36, 1)',
                boxShadow: hoveredCard === 'continue'
                  ? '0 12px 32px rgba(0,0,0,0.08)'
                  : '0 2px 8px rgba(0,0,0,0.03)',
                backdropFilter: 'blur(12px)',
              }}
            >
              Continue Editing
            </button>
          )}
        </div>

        {/* Templates section */}
        {(projects.length > 0) && (
          <div style={{ maxWidth: 1000, margin: '0 auto' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 28,
              justifyContent: 'center',
            }}>
              <div style={{
                width: 20,
                height: 2,
                background: BRAND.orange,
                borderRadius: 1,
              }} />
              <span style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                color: 'rgba(32,32,32,0.4)',
              }}>
                Templates
              </span>
              <div style={{
                width: 20,
                height: 2,
                background: BRAND.orange,
                borderRadius: 1,
              }} />
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
              gap: 20,
            }}>
              {/* "Start from Scratch" card */}
              <button
                onClick={handleStartNew}
                onMouseEnter={() => setHoveredCard('scratch')}
                onMouseLeave={() => setHoveredCard(null)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: hoveredCard === 'scratch'
                    ? 'rgba(255,255,255,0.85)'
                    : 'rgba(255,255,255,0.5)',
                  border: hoveredCard === 'scratch'
                    ? `2px dashed ${BRAND.blue}`
                    : '2px dashed rgba(0,0,0,0.1)',
                  borderRadius: 16,
                  padding: '48px 24px',
                  cursor: 'pointer',
                  transition: 'all 280ms cubic-bezier(0.22, 1, 0.36, 1)',
                  transform: hoveredCard === 'scratch' ? 'translateY(-3px)' : 'translateY(0)',
                  boxShadow: hoveredCard === 'scratch'
                    ? '0 16px 40px rgba(74,127,248,0.12)'
                    : 'none',
                  minHeight: 240,
                }}
              >
                <div style={{
                  width: 48,
                  height: 48,
                  borderRadius: 14,
                  background: hoveredCard === 'scratch'
                    ? 'rgba(74,127,248,0.1)'
                    : 'rgba(0,0,0,0.04)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 16,
                  transition: 'all 280ms ease-out',
                }}>
                  <Plus size={22} color={hoveredCard === 'scratch' ? BRAND.blue : '#9CA3AF'} />
                </div>
                <span style={{
                  fontSize: 14,
                  fontWeight: 600,
                  color: hoveredCard === 'scratch' ? BRAND.dark : 'rgba(32,32,32,0.6)',
                  marginBottom: 4,
                  transition: 'color 200ms',
                }}>
                  Blank Canvas
                </span>
                <span style={{
                  fontSize: 12,
                  color: 'rgba(32,32,32,0.35)',
                }}>
                  Start from scratch
                </span>
              </button>

              {/* Hero Above Template */}
              <TemplateCard
                id="hero-above"
                label="Studio 2.0 — Hero Above"
                description="Header, hero-above layout cards, footer"
                coverGradient={`linear-gradient(135deg, ${BRAND.navy} 0%, #2D4A7A 100%)`}
                previewContent={
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '16px 0' }}>
                    <div style={{ width: '60%', height: 6, background: 'rgba(255,255,255,0.15)', borderRadius: 3 }} />
                    <div style={{ width: '40%', height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }} />
                    <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                      <div style={{ width: 48, height: 32, background: 'rgba(255,255,255,0.08)', borderRadius: 6 }} />
                      <div style={{ width: 48, height: 32, background: 'rgba(255,255,255,0.08)', borderRadius: 6 }} />
                    </div>
                    <div style={{
                      padding: '4px 12px',
                      background: BRAND.orange,
                      borderRadius: 4,
                      fontSize: 8,
                      fontWeight: 700,
                      color: '#fff',
                      letterSpacing: '0.08em',
                      textTransform: 'uppercase',
                      marginTop: 4,
                    }}>
                      BUILDER
                    </div>
                  </div>
                }
                hovered={hoveredCard}
                onHover={setHoveredCard}
                onClick={() =>
                  onSelectTemplate(JSON.parse(JSON.stringify(createSavedTemplate2())))
                }
              />

              {/* Saved project cards */}
              {projects.map(project => {
                const header = project.data?.sections?.find(s => s.type === 'header');
                const coverUrl = header?.backgroundImage || header?.background?.image || null;
                return (
                  <TemplateCard
                    key={project.id}
                    id={`proj-${project.id}`}
                    label={project.name}
                    description={`${new Date(project.updatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} \u00B7 ${project.data?.sections?.length || 0} sections`}
                    coverUrl={coverUrl}
                    hovered={hoveredCard}
                    onHover={setHoveredCard}
                    onClick={() => router.push(`/templates/${project.id}`)}
                    onDelete={onDeleteProject ? () => {
                      if (confirm('Delete this project?')) onDeleteProject(project.id);
                    } : null}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{
        textAlign: 'center',
        padding: '40px 24px 32px',
        fontSize: 12,
        color: 'rgba(32,32,32,0.25)',
        letterSpacing: '0.02em',
      }}>
        Studio Newsletter — Powered by Wix
      </div>
    </div>
  );
}

function TemplateCard({ id, label, description, coverUrl, coverGradient, previewContent, hovered, onHover, onClick, onDelete }) {
  const isHovered = hovered === id;

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={onClick}
        onMouseEnter={() => onHover(id)}
        onMouseLeave={() => onHover(null)}
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'stretch',
          width: '100%',
          background: '#FFFFFF',
          border: isHovered ? '1px solid rgba(0,0,0,0.12)' : '1px solid rgba(0,0,0,0.06)',
          borderRadius: 16,
          overflow: 'hidden',
          cursor: 'pointer',
          transition: 'all 280ms cubic-bezier(0.22, 1, 0.36, 1)',
          transform: isHovered ? 'translateY(-4px)' : 'translateY(0)',
          boxShadow: isHovered
            ? '0 20px 48px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.04)'
            : '0 2px 12px rgba(0,0,0,0.04)',
          padding: 0,
          textAlign: 'left',
        }}
      >
        <div style={{
          height: 170,
          backgroundImage: coverUrl ? `url(${coverUrl})` : (coverGradient || 'linear-gradient(180deg, #F5F5F5 0%, #E8E8EC 100%)'),
          backgroundSize: 'cover',
          backgroundPosition: 'center top',
          backgroundColor: coverUrl ? undefined : (coverGradient ? undefined : '#F5F5F5'),
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          {previewContent}
          {!coverUrl && !previewContent && (
            <div style={{ fontSize: 12, color: '#B0B0B8' }}>
              No cover image
            </div>
          )}
        </div>
        <div style={{ padding: '16px 20px' }}>
          <div style={{
            fontSize: 14,
            fontWeight: 600,
            color: '#202020',
            marginBottom: 4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}>
            {label}
          </div>
          <div style={{
            fontSize: 12,
            color: 'rgba(32,32,32,0.4)',
          }}>
            {description}
          </div>
        </div>
      </button>

      {onDelete && (
        <button
          onClick={(e) => { e.stopPropagation(); onDelete(); }}
          onMouseEnter={() => onHover(id)}
          style={{
            position: 'absolute',
            top: 10,
            right: 10,
            background: 'rgba(255,255,255,0.9)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(0,0,0,0.06)',
            borderRadius: 8,
            padding: '5px 7px',
            cursor: 'pointer',
            opacity: isHovered ? 1 : 0,
            transition: 'opacity 200ms, transform 200ms',
            transform: isHovered ? 'scale(1)' : 'scale(0.9)',
            color: '#EF4444',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Trash2 size={13} />
        </button>
      )}
    </div>
  );
}

export default TemplateSelector;
