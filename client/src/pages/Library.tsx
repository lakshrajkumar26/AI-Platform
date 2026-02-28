import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { useLibrary } from '@/hooks/useLibrary';
import type { Video } from '@/services/api';

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

export default function Library() {
  const [, setLocation] = useLocation();
  const { savedItems, removeFromLibrary, isLoading } = useLibrary();
  const [activeItem, setActiveItem] = useState<Video | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<'All' | string>('All');
  const [selectedType, setSelectedType] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [searchQuery, setSearchQuery] = useState('');

  const handleCardClick = (contentId: string) => {
    setLocation(`/video/${contentId}`);
  };

  const filteredContent = savedItems
    .filter((item) => {
      const matchesSearch =
        searchQuery.trim() === '' ||
        item.title
          .toLowerCase()
          .split(' ')
          .some(word => word.startsWith(searchQuery.toLowerCase()));
      const matchesCategory =
        !selectedCategory || selectedCategory === 'All'
          ? true
          : item.category === selectedCategory;
      const matchesType = selectedType === 'All' || item.type === selectedType;

      return matchesSearch && matchesCategory && matchesType;
    })
    .sort((a, b) => {
      if (sortBy === 'oldest') {
        return new Date(a.savedAt).getTime() - new Date(b.savedAt).getTime();
      }
      // Latest saved (default)
      return new Date(b.savedAt).getTime() - new Date(a.savedAt).getTime();
    });

  return (
    <div style={styles.container}>
      <style>{cssStyles}</style>

      <header className="netflix-nav">
        <div className="nav-left">
          <span className="nav-logo">VMS</span>
        </div>

        <nav className="nav-center">
          <span
            className="nav-link"
            onClick={() => setLocation('/')}
          >
            Home
          </span>
          <span
            className="nav-link"
            onClick={() => setSelectedType('VIDEO')}
          >
            Videos
          </span>
          <span
            className="nav-link"
            onClick={() => setSelectedType('BLOG')}
          >
            Blogs
          </span>
          <span
            className="nav-link"
            onClick={() => setSortBy('latest')}
          >
            Latest Saved
          </span>
          <span
            className="nav-link"
            onClick={() => setSortBy('oldest')}
          >
            Old Saved
          </span>

          <select
            className="nav-dropdown"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="All">Browse by Category</option>
            {CATEGORIES.filter(c => c !== 'All').map(cat => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </nav>

        <div className="nav-right">
          <input
            className="nav-search"
            placeholder="Search Library"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="nav-admin"
            onClick={() => setLocation('/admin')}
          >
            ADMIN
          </button>
        </div>
      </header>

      <main style={styles.mainContent}>
        {isLoading ? (
          <div style={styles.loadingContainer}>
            <div style={styles.spinner}></div>
            <p>Loading your library...</p>
          </div>
        ) : filteredContent.length === 0 ? (
          <div style={styles.emptyState}>
            <p>
              {savedItems.length === 0
                ? 'Your library is empty. Start saving content from the Home page!'
                : 'No saved content matches your filters.'}
            </p>
          </div>
        ) : (
          <section
            style={{
              paddingTop: '104px',
              paddingBottom: '80px',
              paddingLeft: '56px',
              paddingRight: '56px',
              width: '100%',
            }}
          >
            <h2
              style={{
                fontSize: '18px',
                fontWeight: 700,
                marginBottom: '24px',
                color: '#ffffff',
                letterSpacing: '0.3px',
              }}
            >
              My Saved Content ({filteredContent.length})
            </h2>

            <div
              className="vms-content-grid"
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: '32px',
                width: '100%',
              }}
            >
              {filteredContent.map((item) => (
                <div
                  key={item._id}
                  className="netflix-card-container"
                  onClick={() => setActiveItem(item)}
                >
                  <div className="netflix-card">
                    <div className="video-thumbnail">
                      {item.thumbnailPath ? (
                        <img src={item.thumbnailPath} alt={item.title} />
                      ) : (
                        <div className="placeholder-thumb">{item.type}</div>
                      )}

                      <div className="play-overlay">
                        <div className="play-icon">
                          {item.type === 'VIDEO' ? 'PLAY' : 'VIEW'}
                        </div>
                      </div>

                      <div className="card-badge">{item.type}</div>

                      <button
                        className="remove-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromLibrary(item._id);
                        }}
                        title="Remove from library"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="card-info-popup">
                      <h3>{item.title}</h3>
                      <p>{item.description || 'No description available.'}</p>
                      <div style={styles.cardMeta}>
                        <small>{new Date(item.savedAt).toLocaleDateString()}</small>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
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
              <img
                src={activeItem.thumbnailPath || '/placeholder.jpg'}
                alt={activeItem.title}
              />
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
                <button
                  className="modal-remove"
                  onClick={() => {
                    removeFromLibrary(activeItem._id);
                    setActiveItem(null);
                  }}
                >
                  Remove from Library
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
  .netflix-nav {
  position: fixed;
  top: 0;
  width: 100%;
  height: 64px;
  background: linear-gradient(to bottom, rgba(0,0,0,0.85), rgba(0,0,0,0));
  display: flex;
  align-items: center;
  padding: 0 48px;
  z-index: 1000;
}

.nav-left {
  flex: 1;
}

.nav-logo {
  font-size: 22px;
  font-weight: 900;
  color: #E50914;
}

.nav-center {
  display: flex;
  align-items: center;
  gap: 14px;
  flex-wrap: nowrap;
}

.nav-center > * {
  flex: 0 0 auto;
}

.nav-link {
  font-size: 14px;
  color: #e5e5e5;
  cursor: pointer;
}

.nav-link:hover {
  color: #fff;
}

.nav-dropdown {
  background: transparent;
  color: #e5e5e5;
  border: none;
  font-size: 14px;
  cursor: pointer;

  appearance: none;
  -webkit-appearance: none;
  -moz-appearance: none;

  padding: 0;
  margin: 0;

  line-height: 1;
  height: 16px;
  align-items: center;
}

.nav-dropdown::-ms-expand {
  display: none;
}

.nav-dropdown:focus {
  outline: none;
}
  .nav-dropdown option {
  background-color: #141414;
  color: #ffffff;
}

.nav-right {
  flex: 1;
  display: flex;
  justify-content: flex-end;
  gap: 16px;
  align-items: center;
}

.nav-search {
  background: rgba(0,0,0,0.6);
  border: 1px solid #333;
  padding: 6px 10px;
  color: #fff;
  border-radius: 4px;
}

.nav-admin {
  background: #E50914;
  border: none;
  color: white;
  padding: 8px 14px;
  font-weight: 700;
  border-radius: 4px;
  cursor: pointer;
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

.netflix-card {
  position: relative;
}

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

.play-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.play-icon {
  font-size: 12px;
  padding: 10px 16px;
  background: #E50914;
  color: #fff;
  font-weight: 900;
  border-radius: 4px;
  letter-spacing: 1px;
}

.card-badge {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(0,0,0,0.8);
  color: #c8a951;
  padding: 4px 8px;
  font-size: 10px;
  font-weight: 800;
  border: 1px solid #c8a951;
  border-radius: 4px;
  z-index: 3;
}

.remove-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(229, 9, 20, 0.9);
  color: #fff;
  border: none;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  transition: background 0.2s ease;
}

.remove-btn:hover {
  background: rgba(229, 9, 20, 1);
}

.placeholder-thumb {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #181818;
  font-size: 14px;
  font-weight: 700;
  color: #c8a951;
}

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
  z-index: 200;
}

.netflix-card-container:hover .card-info-popup {
  opacity: 1;
  transform: translateY(0);
  pointer-events: none;
}

.card-info-popup h3 {
  font-size: 16px;
  font-weight: 700;
  color: #fff;
  margin-bottom: 8px;
}

.card-info-popup p {
  font-size: 13px;
  line-height: 1.4;
  color: #d1d1d1;
  margin-bottom: 12px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
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
  display: flex;
  gap: 12px;
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

.modal-remove {
  background: rgba(229, 9, 20, 0.3);
  color: #E50914;
  border: 1px solid #E50914;
  padding: 14px 28px;
  font-size: 14px;
  font-weight: 800;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.modal-remove:hover {
  background: rgba(229, 9, 20, 0.5);
}

  .vms-content-grid {
  position: relative;
  z-index: 10;
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
  mainContent: {
    flex: 1,
    backgroundColor: '#0b0d0c',
    width: '100%',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    gap: '16px',
  },
  spinner: {
    width: '46px',
    height: '46px',
    border: '3px solid #c8a951',
    borderTop: '3px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  emptyState: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '60vh',
    color: '#aaa',
    fontSize: '16px',
  },
  cardMeta: {
    marginTop: '8px',
    color: '#999',
    fontSize: '11px',
  },
  footer: {
    backgroundColor: '#0b0d0c',
    borderTop: '1px solid #2f2f2f',
    padding: '24px',
    textAlign: 'center' as const,
    marginTop: 'auto',
  },
  footerContent: {
    maxWidth: '1400px',
    margin: '0 auto',
  },
  footerMeta: {
    fontSize: '12px',
    color: '#666',
    margin: '8px 0 0 0',
  },
};
