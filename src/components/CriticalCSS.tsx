// Critical Above-the-fold CSS and Content
// This component renders critical content immediately without JS dependencies

export const CriticalHeroContent = () => {
  return (
    <div 
      id="critical-hero"
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #fdf2f8 0%, #fce7f3 50%, #f3e8ff 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        zIndex: 1
      }}
    >
      <div style={{ 
        maxWidth: '896px', 
        width: '100%',
        padding: '0 24px',
        textAlign: 'center' as const
      }}>
        {/* Critical LCP Content - Pre-rendered */}
        <h1 style={{
          fontSize: 'clamp(2rem, 5vw, 3rem)',
          fontWeight: 'bold',
          color: '#111827',
          marginBottom: '12px',
          lineHeight: '1.2'
        }}>
          <span style={{
            background: 'linear-gradient(135deg, #ec4899, #db2777, #a855f7)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            推し活をもっと楽しく
          </span>
        </h1>
        
        {/* LCP Target Element - Optimized */}
        <p style={{
          fontSize: 'clamp(1rem, 2.5vw, 1.125rem)',
          color: '#4b5563',
          marginBottom: '8px',
          fontWeight: '400',
          lineHeight: '1.5'
        }}>
          推し・アイテム・聖地巡礼スポットを検索・発見
        </p>

        {/* Fast Loading Search Bar Skeleton */}
        <div style={{
          maxWidth: '768px',
          margin: '32px auto',
          position: 'relative'
        }}>
          <div style={{
            width: '100%',
            height: '56px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            alignItems: 'center',
            padding: '0 20px',
            border: '1px solid #e5e7eb'
          }}>
            <span style={{
              color: '#9ca3af',
              fontSize: '16px'
            }}>
              推し・アイテム・場所を検索...
            </span>
          </div>
        </div>

        {/* Quick Stats for Immediate Value */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: '32px',
          marginTop: '24px',
          flexWrap: 'wrap' as const
        }}>
          <div style={{ textAlign: 'center' as const }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ec4899' }}>2600+</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>エピソード</div>
          </div>
          <div style={{ textAlign: 'center' as const }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ec4899' }}>250+</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>ロケ地</div>
          </div>
          <div style={{ textAlign: 'center' as const }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ec4899' }}>100+</div>
            <div style={{ fontSize: '14px', color: '#6b7280' }}>アイテム</div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Critical CSS injection
export const injectCriticalCSS = () => {
  if (typeof document === 'undefined') return;
  
  const criticalCSS = `
    /* Critical Above-the-fold Styles */
    #critical-hero {
      font-family: system-ui, -apple-system, sans-serif;
    }
    
    /* Fast font loading */
    @font-display: swap;
    
    /* Prevent layout shift */
    #root {
      min-height: 100vh;
    }
    
    /* Hide critical content when React loads */
    .react-loaded #critical-hero {
      display: none !important;
    }
  `;

  const styleElement = document.createElement('style');
  styleElement.innerHTML = criticalCSS;
  document.head.appendChild(styleElement);
};