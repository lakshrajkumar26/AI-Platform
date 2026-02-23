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
  const [activeItem, setActiveItem] = useState<Video | null>(null);
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
              <div
  key={item._id}
  className="netflix-card-container"
  onClick={() => setActiveItem(item)}
>
  <div className="netflix-card">
    {/* THUMBNAIL */}
    <div className="video-thumbnail">
      {item.thumbnailPath ? (
        <img src={item.thumbnailPath} alt={item.title} />
      ) : (
        <div className="placeholder-thumb">
          {item.type}
        </div>
      )}

      <div className="play-overlay">
        <div className="play-icon">
          {item.type === 'VIDEO' ? 'PLAY' : 'VIEW'}
        </div>
      </div>

      <div className="card-badge">{item.type}</div>
    </div>

    {/* POPUP (CHILD OF SAME CARD) */}
    <div className="card-info-popup">
      <h3>{item.title}</h3>
      <p>{item.description || 'No description available.'}</p>
      <button
  onClick={(e) => {
    e.stopPropagation();
    setActiveItem(item);
  }}
>
  {item.type === 'VIDEO' ? '▶ Play' : '📖 Read'}
</button>
    </div>
  </div>
</div>
            ))}
          </div>
        )}
      </main>
      {activeItem && (
  <div className="netflix-modal-backdrop" onClick={() => setActiveItem(null)}>
    <div
      className="netflix-modal"
      onClick={(e) => e.stopPropagation()}
    >
      <button className="modal-close" onClick={() => setActiveItem(null)}>
        ✕
      </button>

      <div className="modal-hero">
        <img src={activeItem.thumbnailPath} alt={activeItem.title} />
      </div>

      <div className="modal-content">
        <h1>{activeItem.title}</h1>

        <div className="modal-meta">
          <span>{activeItem.category}</span>
          <span>{activeItem.type}</span>
        </div>

        <p>{activeItem.description}</p>

        <div className="modal-actions">
          <button
            className="modal-play"
            onClick={() => handleCardClick(activeItem._id)}
          >
            {activeItem.type === 'VIDEO' ? '▶ Play' : '📖 Read'}
          </button>
        </div>
      </div>
    </div>
  </div>
)}
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
  
  .netflix-card-container {
    position: relative;
    z-index: 1;
    transition: transform 0.3s ease;
  }

  .netflix-card-container:hover {
    z-index: 100;
    transform: scale(1.05);
  }

  .netflix-card-container:hover .card-info-popup {
    opacity: 1;
    visibility: visible;
    transform: translateY(0);
  }

  .netflix-card-container:hover .play-overlay {
    opacity: 1;
  }

  .netflix-card-container:hover .video-thumbnail {
    border-bottom-left-radius: 0;
    border-bottom-right-radius: 0;
    box-shadow: 0 10px 20px rgba(0,0,0,0.5);
  }
    .netflix-card-container {
  position: relative;
  z-index: 1;
}

.netflix-card-container:hover {
  z-index: 100;
}

.netflix-card {
  position: relative;
}

/* Thumbnail */
.video-thumbnail {
  position: relative;
  aspect-ratio: 16 / 9;
  overflow: hidden;
  border-radius: 6px;
}

.video-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* Play overlay */
.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.25s ease;
}

.netflix-card-container:hover .play-overlay {
  opacity: 1;
}

/* 🔥 POPUP */
.card-info-popup {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: #181818;
  padding: 16px;
  border-bottom-left-radius: 6px;
  border-bottom-right-radius: 6px;
  box-shadow: 0 20px 40px rgba(0,0,0,0.8);
  opacity: 0;
  transform: translateY(-10px);
  pointer-events: none;
  transition: all 0.25s ease;
}

.netflix-card-container:hover .card-info-popup {
  opacity: 1;
  transform: translateY(0);
  pointer-events: none;
}
  .netflix-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.75);
  z-index: 1000;
  display: flex;
  justify-content: center;
  align-items: center;
}

.netflix-modal {
  width: 900px;
  max-width: 95%;
  background: #141414;
  border-radius: 10px;
  overflow: hidden;
  position: relative;
  animation: modalIn 0.3s ease;
}

@keyframes modalIn {
  from {
    transform: translateY(40px) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1);
    opacity: 1;
  }
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0,0,0,0.7);
  border: none;
  color: #fff;
  font-size: 18px;
  width: 36px;
  height: 36px;
  border-radius: 50%;
  cursor: pointer;
  z-index: 10;
}

.modal-hero img {
  width: 100%;
  height: 420px;
  object-fit: cover;
}

.modal-content {
  padding: 24px;
}

.modal-content h1 {
  font-size: 32px;
  margin-bottom: 12px;
}

.modal-meta {
  display: flex;
  gap: 16px;
  color: #aaa;
  font-size: 14px;
  margin-bottom: 16px;
}

.modal-actions {
  margin-top: 24px;
}

.modal-play {
  background: #E50914;
  color: #fff;
  border: none;
  padding: 14px 28px;
  font-size: 14px;
  font-weight: 800;
  border-radius: 4px;
  cursor: pointer;
}
`;

const styles: Record<string, React.CSSProperties> = {
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
    fontSize: '56px',
    fontWeight: '900',
    lineHeight: '1.1',
    marginBottom: '20px',
    textTransform: 'none',
    color: '#fff',
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
    backgroundColor: '#E50914',
    color: '#fff',
    border: 'none',
    padding: '14px 28px',
    fontSize: '14px',
    fontWeight: '900',
    cursor: 'pointer',
    letterSpacing: '1px',
    borderRadius: '4px',
  },
  mainContent: {
    maxWidth: '1400px',
    margin: '0 auto',
    padding: '48px 56px',
    flex: 1,
    width: '100%',
    overflow: 'visible',
  },
  contentGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '32px',
    width: '100%',
    overflow: 'visible',
  },
  videoCard: {
    backgroundColor: '#181818',
    borderRadius: '6px',
    cursor: 'pointer',
    position: 'relative',
    height: 'fit-content',
  },
  videoThumbnail: {
    position: 'relative',
    zIndex: 2,
    aspectRatio: '16 / 9',
    backgroundColor: '#181818',
    borderRadius: '6px',
    overflow: 'hidden',
    transition: 'all 0.3s ease',
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
    backgroundColor: 'rgba(0,0,0,0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0,
    transition: 'opacity 0.3s',
  },
  playIcon: {
    fontSize: '12px',
    padding: '10px 16px',
    backgroundColor: '#E50914',
    color: '#fff',
    fontWeight: '900',
    borderRadius: '4px',
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
    zIndex: 3,
  },
  cardInfo: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    zIndex: 10,
    padding: '16px',
    backgroundColor: '#181818',
    borderBottomLeftRadius: '6px',
    borderBottomRightRadius: '6px',
    boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
    opacity: 0,
    visibility: 'hidden',
    transition: 'all 0.3s ease',
    transform: 'translateY(-10px)',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: '#fff',
    marginBottom: '8px',
  },
  cardDescription: {
    fontSize: '13px',
    lineHeight: '1.4',
    color: '#d1d1d1',
    marginBottom: '16px',
    display: '-webkit-box',
    WebkitLineClamp: 3,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardAction: {
    backgroundColor: '#E50914',
    color: '#fff',
    border: 'none',
    padding: '10px 16px',
    fontSize: '12px',
    fontWeight: '800',
    borderRadius: '4px',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.2s',
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
