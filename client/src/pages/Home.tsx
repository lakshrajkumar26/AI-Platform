import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { getVideos, type Video } from '@/services/api';

const CATEGORIES = [
  'All',
  'EMOTIONAL',
  'TECHNOLOGY',
  'SCIENCE',
  'PERSONAL FINANCE',
  'INFORMATIONAL BRIEFING',
  'NEWS',
  'TECH INFO'
];

export default function Home() {
  const [, setLocation] = useLocation();
  const [allContent, setAllContent] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [filterDate, setFilterDate] = useState('');

  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const data = await getVideos();
        setAllContent(data);
      } catch (error) {
        console.error('Failed to fetch content:', error);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, []);

  const handleCardClick = (contentId: string) => {
    setLocation(`/video/${contentId}`);
  };

  const filteredContent = allContent
    .filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const matchesType = selectedType === 'All' || item.type === selectedType;

      let matchesDate = true;
      if (sortBy === 'date' && filterDate) {
        const itemDate = new Date(item.createdAt).toISOString().split('T')[0];
        matchesDate = itemDate === filterDate;
      }

      return matchesSearch && matchesCategory && matchesType && matchesDate;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      if (sortBy === 'oldest') return dateA - dateB;
      return dateB - dateA;
    });

  const featuredContent = filteredContent.length > 0 ? filteredContent[0] : null;

  return (
    <div style={styles.container}>
      <style>{cssStyles}</style>

      <header style={styles.commandBar}>
        <div style={styles.commandBarContent}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>IN</span>
            <div>
              <div style={styles.logoTitle}>VMS</div>
              <div style={styles.logoSubtitle}>Visual Media System</div>
            </div>
          </div>

          <div style={styles.searchContainer}>
            <div style={styles.searchShell}>
              <span style={styles.searchIcon}>SEARCH</span>
              <input
                type="text"
                placeholder="Search by title or description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={styles.searchInput}
              />
            </div>
          </div>

          <div style={styles.headerRight}>
            <a href="/admin" style={styles.adminLink}>
              ADMIN PANEL
            </a>
          </div>
        </div>
      </header>

      <div style={styles.filterBar}>
        <div className="vms-filter-controls" style={styles.filterControls}>
          <div style={styles.filterField}>
            <label style={styles.filterLabel}>CATEGORY</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={styles.selectInput}
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div style={styles.filterField}>
            <label style={styles.filterLabel}>SORT</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              style={styles.selectInput}
            >
              <option value="latest">LATEST UPLOAD</option>
              <option value="oldest">OLDEST UPLOAD</option>
              <option value="date">SPECIFIC DATE</option>
            </select>
          </div>

          <div style={styles.filterField}>
            <label style={styles.filterLabel}>TYPE</label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              style={styles.selectInput}
            >
              <option value="All">ALL</option>
              <option value="VIDEO">VIDEO</option>
              <option value="BLOG">BLOG</option>
            </select>
          </div>

          {sortBy === 'date' && (
            <div style={styles.filterField}>
              <label style={styles.filterLabel}>DATE</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={styles.dateInput}
              />
            </div>
          )}

          <div style={styles.filterField}>
            <label style={styles.filterLabel}>ACTION</label>
            <button
              type="button"
              style={styles.clearBtn}
              onClick={() => {
                setSelectedCategory('All');
                setSelectedType('All');
                setSortBy('latest');
                setFilterDate('');
              }}
            >
              RESET
            </button>
          </div>
        </div>
      </div>

      {featuredContent && !searchQuery && selectedCategory === 'All' && (
        <section
          style={{
            ...styles.heroSection,
            backgroundImage: featuredContent.thumbnailPath
              ? `linear-gradient(rgba(11,13,12,0.35), rgba(11,13,12,0.62)), url('${featuredContent.thumbnailPath}')`
              : undefined,
          }}
        >
          <div style={styles.heroContent}>
            <div style={styles.heroCategory}>{featuredContent.category}</div>
            <h1 style={styles.heroTitle}>{featuredContent.title}</h1>
            <p style={styles.heroDescription}>{featuredContent.description}</p>
            <div style={styles.heroButtons}>
              <button style={styles.btnWatch} onClick={() => handleCardClick(featuredContent._id)}>
                {featuredContent.type === 'VIDEO' ? 'WATCH VIDEO' : 'READ BLOG'}
              </button>
            </div>
          </div>
        </section>
      )}

      <main style={styles.mainContent}>
        {loading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Loading secure content...</p>
          </div>
        ) : filteredContent.length === 0 ? (
          <div style={styles.emptyState}>
            <p>No content available for the selected filters.</p>
          </div>
        ) : (
        <div className="vms-content-grid" style={styles.contentGrid}>
            {filteredContent.map((item) => (
              <div key={item._id} style={styles.videoCard} onClick={() => handleCardClick(item._id)}>
                <div style={styles.videoThumbnail}>
                  {item.thumbnailPath ? (
                    <img src={item.thumbnailPath} alt={item.title} style={styles.thumbnailImg} />
                  ) : (
                    <div style={styles.placeholderThumb}>{item.type === 'VIDEO' ? 'VIDEO' : 'BLOG'}</div>
                  )}
                  <div style={styles.playOverlay}>
                    <div style={styles.playIcon}>{item.type === 'VIDEO' ? 'PLAY' : 'VIEW'}</div>
                  </div>
                  <div style={styles.cardBadge}>{item.type}</div>
                </div>
                <div style={styles.cardInfo}>
                  <h3 style={styles.cardTitle}>{item.title}</h3>
                  <p style={styles.cardDescription}>
                    {item.description || 'No description available.'}
                  </p>
                  <p style={styles.cardMeta}>
                    {item.category} - {new Date(item.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <p>VMS - Visual Media System | Secure Platform for Armed Forces and Defence Personnel</p>
          <p style={styles.footerMeta}>Copyright 2026 Government Portal</p>
        </div>
      </footer>
    </div>
  );
}

const cssStyles = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @media (max-width: 1100px) {
    .vms-content-grid {
      grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
    }
  }
  @media (max-width: 720px) {
    .vms-content-grid {
      grid-template-columns: 1fr !important;
    }
  }
`;

const styles = {
  container: {
    backgroundColor: '#0b0d0c',
    color: '#e8e8e8',
    fontFamily: 'sans-serif',
    minHeight: '100vh',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  commandBar: {
    backgroundColor: '#151817',
    borderBottom: '2px solid #c8a951',
    padding: '0',
    height: '68px',
    display: 'flex',
    alignItems: 'center',
    zIndex: 100,
  },
  commandBarContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    padding: '0 56px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '24px',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  logoIcon: {
    fontSize: '13px',
    fontWeight: '900',
    letterSpacing: '1px',
    color: '#0b0d0c',
    backgroundColor: '#c8a951',
    padding: '9px 10px',
    borderRadius: '4px',
  },
  logoTitle: {
    fontSize: '24px',
    fontWeight: '900',
    color: '#c8a951',
    lineHeight: '1',
    letterSpacing: '1px',
  },
  logoSubtitle: {
    fontSize: '10px',
    color: '#888',
    textTransform: 'uppercase' as const,
    letterSpacing: '2px',
    marginTop: '2px',
  },
  searchContainer: {
    flex: 1,
    maxWidth: '680px',
  },
  searchShell: {
    position: 'relative' as const,
    border: '1px solid #3f3f3f',
    borderRadius: '8px',
    background: 'linear-gradient(180deg, #141716 0%, #0f1211 100%)',
    boxShadow: 'inset 0 0 0 1px rgba(200,169,81,0.08)',
    overflow: 'hidden',
  },
  searchIcon: {
    position: 'absolute' as const,
    left: '12px',
    top: '50%',
    transform: 'translateY(-50%)',
    color: '#c8a951',
    fontSize: '10px',
    fontWeight: '800',
    letterSpacing: '0.8px',
  },
  searchInput: {
    width: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#fff',
    padding: '12px 14px 12px 78px',
    fontSize: '14px',
    outline: 'none',
  },
  headerRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px',
  },
  adminLink: {
    color: '#0b0d0c',
    textDecoration: 'none',
    fontSize: '12px',
    fontWeight: '800',
    letterSpacing: '1px',
    border: '1px solid #c8a951',
    backgroundColor: '#c8a951',
    padding: '10px 14px',
    borderRadius: '6px',
    textTransform: 'uppercase' as const,
  },
  filterBar: {
    backgroundColor: '#1a1d1c',
    padding: '14px 24px',
    borderBottom: '1px solid #333',
  },
  filterControls: {
    maxWidth: '1400px',
    margin: '0 auto',
    width: '100%',
    display: 'flex',
    flexWrap: 'nowrap' as const,
    gap: '10px',
    alignItems: 'end',
    overflowX: 'auto' as const,
  },
  filterField: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '6px',
    flex: 1,
    minWidth: '140px',
  },
  filterLabel: {
    color: '#c8a951',
    fontSize: '11px',
    fontWeight: '800',
    letterSpacing: '0.8px',
  },
  clearBtn: {
    height: '36px',
    border: '1px solid #c8a951',
    backgroundColor: '#c8a951',
    color: '#0b0d0c',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
    width: '100%',
  },
  selectInput: {
    backgroundColor: '#0b0d0c',
    color: '#c8a951',
    border: '1px solid #3b3b3b',
    borderRadius: '4px',
    padding: '8px 10px',
    fontSize: '12px',
    fontWeight: '700',
    outline: 'none',
    height: '36px',
  },
  dateInput: {
    backgroundColor: '#0b0d0c',
    color: '#c8a951',
    border: '1px solid #3b3b3b',
    borderRadius: '4px',
    padding: '8px 10px',
    fontSize: '12px',
    height: '36px',
  },
  heroSection: {
    minHeight: '560px',
    maxWidth: '1400px',
    width: 'calc(100% - 112px)',
    margin: '0 auto',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    alignItems: 'center',
    padding: '90px 56px 56px',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  heroContent: {
    maxWidth: '760px',
  },
  heroCategory: {
    color: '#c8a951',
    fontSize: '14px',
    fontWeight: '800',
    letterSpacing: '2px',
    marginBottom: '12px',
  },
  heroTitle: {
    fontSize: '64px',
    fontWeight: '900',
    lineHeight: '1.1',
    marginBottom: '20px',
    textTransform: 'uppercase' as const,
    color: '#c8a951',
    textShadow: '0 4px 18px rgba(0,0,0,0.5)',
  },
  heroDescription: {
    fontSize: '18px',
    color: '#ddd',
    marginBottom: '32px',
    lineHeight: '1.6',
    maxWidth: '760px',
  },
  heroButtons: {
    display: 'flex',
    gap: '16px',
  },
  btnWatch: {
    backgroundColor: '#c8a951',
    color: '#000',
    border: 'none',
    padding: '14px 28px',
    fontSize: '14px',
    fontWeight: '900',
    cursor: 'pointer',
    letterSpacing: '1px',
    borderRadius: '6px',
  },
  mainContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '48px 56px',
    flex: 1,
    width: '100%'
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '24px',
    width: '100%',
  },
  videoCard: {
    backgroundColor: '#141414',
    borderRadius: '8px',
    overflow: 'hidden',
    cursor: 'pointer',
    transition: 'transform 0.26s ease, box-shadow 0.26s ease',
    minHeight: '460px',
  },
  videoThumbnail: {
    position: 'relative' as const,
    aspectRatio: '4/3',
    backgroundColor: '#1a1d1c',
    overflow: 'hidden',
    border: 'none',
    borderRadius: '0',
  },
  thumbnailImg: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
  },
  placeholderThumb: {
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '16px',
    fontWeight: '800',
    color: '#c8a951',
  },
  playOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.38)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.2s',
  },
  playIcon: {
    fontSize: '14px',
    color: '#c8a951',
    fontWeight: '800',
    letterSpacing: '1px',
  },
  cardBadge: {
    position: 'absolute' as const,
    top: '10px',
    right: '10px',
    backgroundColor: 'rgba(0,0,0,0.8)',
    color: '#c8a951',
    padding: '4px 8px',
    fontSize: '10px',
    fontWeight: '800',
    border: '1px solid #c8a951',
    borderRadius: '4px',
  },
  cardInfo: {
    padding: '16px 16px 18px',
  },
  cardTitle: {
    fontSize: '20px',
    fontWeight: '800',
    lineHeight: '1.25',
    marginBottom: '10px',
    color: '#fff',
    letterSpacing: '-0.01em',
  },
  cardDescription: {
    fontSize: '14px',
    lineHeight: '1.6',
    color: '#b3b3b3',
    marginBottom: '12px',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical' as const,
    overflow: 'hidden',
  },
  cardMeta: {
    fontSize: '12px',
    color: '#b3b3b3',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    padding: '100px 0',
    color: '#c8a951',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '3px solid #c8a951',
    borderTop: '3px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  emptyState: {
    textAlign: 'center' as const,
    padding: '100px 0',
    color: '#888',
  },
  footer: {
    backgroundColor: '#0b0d0c',
    borderTop: '1px solid #333',
    padding: '40px 24px',
    textAlign: 'center' as const,
  },
  footerContent: {
    maxWidth: '800px',
    margin: '0 auto',
  },
  footerMeta: {
    fontSize: '12px',
    color: '#555',
    marginTop: '12px',
  },
};
