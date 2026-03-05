import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { getVideos, getUserProgress, type Video } from '@/services/api';
import { useLibrary } from '@/hooks/useLibrary';

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
  const ITEMS_PER_PAGE = 12;
const [currentPage, setCurrentPage] = useState(1);
  const [activeItem, setActiveItem] = useState<Video | null>(null);
  const [, setLocation] = useLocation();
  const [allContent, setAllContent] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'All' | string>('All');
  const [selectedType, setSelectedType] = useState('All');
  const [sortBy, setSortBy] = useState('latest');
  const [continueItems, setContinueItems] = useState<any[]>([]);
  const [readBlogs, setReadBlogs] = useState<Set<string>>(new Set());
  const { saveToLibrary, isSaved } = useLibrary();
  
  const isSearching = searchQuery.trim().length > 0;
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      try {
        const [videosData, progressData] = await Promise.all([
          getVideos(),
          getUserProgress()
        ]);
        setAllContent(videosData);
        setContinueItems(progressData);
        
        // Load read blogs from localStorage
        const savedReadBlogs = JSON.parse(localStorage.getItem('vms_read_blogs') || '[]');
        setReadBlogs(new Set(savedReadBlogs));
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

  const handleMarkAsRead = (blogId: string) => {
    const newReadBlogs = new Set(readBlogs);
    newReadBlogs.add(blogId);
    setReadBlogs(newReadBlogs);
    localStorage.setItem('vms_read_blogs', JSON.stringify(Array.from(newReadBlogs)));
  };

  const filteredContent = allContent
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

      let matchesDate = true;
      

      return matchesSearch && matchesCategory && matchesType && matchesDate;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      if (sortBy === 'oldest') return dateA - dateB;
      return dateB - dateA;
    });
  // HERO ROW already uses first 4

  const featuredContent = filteredContent.length > 0 ? filteredContent[0] : null;

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
  onClick={() => {
    setSelectedCategory('All');
    setSelectedType('All');
    setSortBy('latest');
    setSearchQuery('');
  }}
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
  Latest
</span>
    <span
  className="nav-link"
  onClick={() => setSortBy('oldest')}
>
  Oldest
</span>
    <span
  className="nav-link"
  onClick={() => setLocation('/library')}
>
  My Library
</span>

<select
  className="nav-dropdown"
  value={selectedCategory}
  onChange={(e) => setSelectedCategory(e.target.value)}
>
  <option value="All">
    Browse by Category
  </option>

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
      placeholder="Search"
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
      

      {featuredContent && !searchQuery && selectedCategory === 'All' && (
        <section
          style={{
            ...styles.heroSection,
            backgroundImage: featuredContent.thumbnailPath
  ? `
    linear-gradient(
  to bottom,
  rgba(0,0,0,0) 0%,
  rgba(0,0,0,0.15) 50%,
  rgba(0,0,0,0.45) 70%,
  rgba(11,13,12,0.65) 88%,
#0b0d0c 100%
),
    linear-gradient(
      to right,
      rgba(0,0,0,0.75) 0%,
      rgba(0,0,0,0.45) 40%,
      rgba(0,0,0,0.15) 70%,
      rgba(0,0,0,0) 100%
    ),
    url('${featuredContent.thumbnailPath}')
  `
  : undefined,
          }}
        >
           
          <div style={styles.heroContent}>
  <div style={styles.heroCategory}>{featuredContent.category}</div>
  <h1 style={styles.heroTitle}>{featuredContent.title}</h1>
  <p style={styles.heroDescription}>{featuredContent.description}</p>
  <div style={styles.heroButtons}>
    <button
      style={styles.btnWatch}
      onClick={() => setActiveItem(featuredContent)}
    >
      {featuredContent.type === 'VIDEO' ? 'WATCH VIDEO' : 'READ BLOG'}
    </button>
    <button
      style={{
        ...styles.btnSave,
        background: isSaved(featuredContent._id) ? '#E50914' : 'rgba(255,255,255,0.2)',
      }}
      onClick={() => saveToLibrary(featuredContent)}
    >
      {isSaved(featuredContent._id) ? '❤ SAVED' : '🤍 SAVE'}
    </button>
  </div>
</div>

{/* 🔥 HERO ROW (LABEL + CARDS TOGETHER) */}
<div style={styles.heroRowWrapper}>
  <div style={styles.netflixRowTitle}>
  Latest
</div>

  <div style={styles.heroGrid}>
    {filteredContent.slice(0, 4).map((item) => (
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
  className={`save-btn ${isSaved(item._id) ? 'saved' : ''}`}
  onClick={(e) => {
    e.stopPropagation();
    saveToLibrary(item);
  }}
>
  {isSaved(item._id) ? '❤' : '🤍'}
</button>
          </div>

          <div className="card-info-popup">
            <h3>{item.title}</h3>
            <p>{item.description || 'No description available.'}</p>
          </div>
        </div>
      </div>
    ))}
  </div>
</div>



<div style={styles.heroFadeBottom} />
        </section>
      )}
      {/* 🔍 SEARCH RESULTS */}
{isSearching && !loading && filteredContent.length > 0 && (
  <main
  style={{
    ...styles.mainContent,
    margin: '0',          // 🔥 center hata
    maxWidth: '100%',     // 🔥 full width
    paddingTop: '104px',   // navbar gap
  }}
>
      <h2
      style={{
        fontSize: '18px',
        fontWeight: 700,
        marginBottom: '16px',
        color: '#ffffff',
        letterSpacing: '0.3px',
        paddingLeft: '56px',
      }}
    >
      Your results
    </h2>

   <div
  className="vms-content-grid"
  style={{
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '32px',
    marginTop: '24px',
    paddingLeft: '56px',
    paddingRight: '56px',
    justifyContent: 'start',
    alignContent: 'start',
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
  className={`save-btn ${isSaved(item._id) ? 'saved' : ''}`}
  onClick={(e) => {
    e.stopPropagation();
    saveToLibrary(item);
  }}
>
  {isSaved(item._id) ? '❤' : '🤍'}
</button>
            </div>

            <div className="card-info-popup">
              <h3>{item.title}</h3>
              <p>{item.description || 'No description available.'}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </main>
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
  ) : null}
</main>
{/* 🍿 CONTINUE WATCHING SECTION */}
{continueItems.filter(i => i.content?.type === 'VIDEO').length > 0 && (
  <div
  style={{
    ...styles.heroRowWrapper,
    marginTop: '40px',
    paddingLeft: '56px',
    paddingRight: '56px',
  }}
>
    <div style={styles.netflixRowTitle}>Continue Watching</div>
    <div style={styles.heroGrid}>
      {continueItems.filter(i => i.content?.type === 'VIDEO').slice(0, 4).map((item) => (
        <div
          key={item.contentId}
          className="netflix-card-container"
          onClick={() => setActiveItem(item.content)}
        >
          <div className="netflix-card">
            <div className="video-thumbnail">
              {item.content?.thumbnailPath ? (
                <img
  src={item.content.thumbnailPath}
  alt={item.content.title}
/>
              ) : (
                <div className="placeholder-thumb">VIDEO</div>
              )}
              <div className="play-overlay">
                <div className="play-icon">RESUME</div>
              </div>
              {/* Progress Bar */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '4px',
                backgroundColor: 'rgba(255,255,255,0.3)',
                zIndex: 10
              }}>
                <div style={{
                  width: `${item.progress}%`,
                  height: '100%',
                  backgroundColor: '#E50914'
                }} />
              </div>
            </div>
            <div className="card-info-popup">
              <h3>{item.content?.title}</h3>
              <p>{item.progress}% watched</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}

{/* 📖 CONTINUE READING SECTION */}
{continueItems.filter(i => i.content?.type === 'BLOG').length > 0 && (
  <div
  style={{
    ...styles.heroRowWrapper,
    marginTop: '40px',
    paddingLeft: '56px',
    paddingRight: '56px',
  }}
>
    <div style={styles.netflixRowTitle}>Continue Reading</div>
    <div style={styles.heroGrid}>
      {continueItems.filter(i => i.content?.type === 'BLOG').slice(0, 4).map((item) => (
        <div
          key={item.contentId}
          className="netflix-card-container"
          onClick={() => setActiveItem(item.content)}
        >
          <div className="netflix-card">
            <div className="video-thumbnail">
              {item.content?.thumbnailPath ? (
                <img src={item.content.thumbnailPath} alt={item.content?.title} />
              ) : (
                <div className="placeholder-thumb">BLOG</div>
              )}
              <div className="play-overlay">
                <div className="play-icon">READ</div>
              </div>
              {/* Progress Bar */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                width: '100%',
                height: '4px',
                backgroundColor: 'rgba(255,255,255,0.3)',
                zIndex: 10
              }}>
                <div style={{
                  width: `${item.progress}%`,
                  height: '100%',
                  backgroundColor: '#c8a951'
                }} />
              </div>
            </div>
            <div className="card-info-popup">
              <h3>{item.content?.title}</h3>
              <p>{item.progress}% read</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
{/* ✅ UPLOADS — OUTSIDE MAIN */}
{!isSearching && !loading && filteredContent.length > 0 && (
  <section
    style={{
      marginTop: '48px',   // 👈 reduces gap from hero
paddingBottom: '80px', // 👈 pushes footer down
      paddingLeft: '56px',
      paddingRight: '56px',
      width: '100%',
    }}
  >
    <h2
      style={{
        fontSize: '18px',
        fontWeight: 700,
        marginBottom: '16px',
        color: '#ffffff',
        letterSpacing: '0.3px',
      }}
    >
      Uploads
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
      {(searchQuery ? filteredContent : filteredContent.slice(4)).map((item) => (
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
  className={`save-btn ${isSaved(item._id) ? 'saved' : ''}`}
  onClick={(e) => {
    e.stopPropagation();
    saveToLibrary(item);
  }}
>
  {isSaved(item._id) ? '❤' : '🤍'}
</button>
            </div>

            <div className="card-info-popup">
              <h3>{item.title}</h3>
              <p>{item.description || 'No description available.'}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  </section>
)}
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
  src={activeItem.thumbnailPath ? activeItem.thumbnailPath : '/placeholder.jpg'}
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
          {activeItem.type === 'BLOG' && (
            <button
              className="modal-save"
              onClick={() => handleMarkAsRead(activeItem._id)}
              style={{
                background: readBlogs.has(activeItem._id) ? '#c8a951' : 'rgba(255,255,255,0.2)',
              }}
            >
              {readBlogs.has(activeItem._id) ? '✓ MARKED AS READ' : '📖 MARK AS READ'}
            </button>
          )}
          <button
            className="modal-save"
            onClick={() => saveToLibrary(activeItem)}
            style={{
              background: isSaved(activeItem._id) ? '#E50914' : 'rgba(255,255,255,0.2)',
            }}
          >
            {isSaved(activeItem._id) ? '❤ SAVED' : '🤍 SAVE'}
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

/* Arrow color */
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

.save-btn {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(0,0,0,0.6);
  border: none;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 3;
  transition: all 0.2s ease;
}
.save-btn.saved {
  background: #E50914;
  color: #ffffff;
}

.save-btn.saved:hover {
  background: #ff1f1f;
}
.save-btn:hover {
  background: rgba(0,0,0,0.9);
  transform: scale(1.1);
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
  z-index: 200;
}

.netflix-card-container:hover .card-info-popup {
  opacity: 1;
  transform: translateY(0);
  pointer-events: auto;
}

.card-info-popup h3 {
  margin: 0 0 8px 0;
  font-size: 14px;
  color: #fff;
  font-weight: 700;
}

.card-info-popup p {
  margin: 0;
  font-size: 12px;
  color: #aaa;
  line-height: 1.4;
}

/* MODAL */
.netflix-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(4px);
}

.netflix-modal {
  background: #181818;
  border-radius: 12px;
  overflow: hidden;
  max-width: 600px;
  width: 90%;
  max-height: 90vh;
  overflow-y: auto;
  position: relative;
  box-shadow: 0 20px 60px rgba(0,0,0,0.9);
}

.modal-close {
  position: absolute;
  top: 16px;
  right: 16px;
  background: rgba(0,0,0,0.6);
  border: none;
  color: #fff;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  z-index: 10;
  transition: all 0.2s ease;
}

.modal-close:hover {
  background: rgba(0,0,0,0.9);
  transform: scale(1.1);
}

.modal-hero {
  width: 100%;
  aspect-ratio: 16 / 9;
  overflow: hidden;
}

.modal-hero img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.modal-content {
  padding: 24px;
}

.modal-content h1 {
  margin: 0 0 12px 0;
  font-size: 28px;
  color: #fff;
  line-height: 1.2;
}

.modal-meta {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.modal-meta span {
  font-size: 12px;
  color: #c8a951;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.modal-content p {
  margin: 0 0 20px 0;
  color: #d0d0d0;
  line-height: 1.6;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.modal-play {
  background: #E50914;
  color: #fff;
  border: none;
  padding: 12px 24px;
  font-weight: 800;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  letter-spacing: 0.5px;
}

.modal-play:hover {
  background: #ff1f1f;
  transform: scale(1.05);
}

.modal-save {
  background: rgba(255,255,255,0.2);
  color: #fff;
  border: 1px solid rgba(255,255,255,0.3);
  padding: 12px 24px;
  font-weight: 800;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease;
  letter-spacing: 0.5px;
}

.modal-save:hover {
  background: rgba(255,255,255,0.3);
  transform: scale(1.05);
}
`;

const styles = {
  container: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: '#0b0d0c',
    color: '#fff',
    display: 'flex',
    flexDirection: 'column' as const,
  },
  heroSection: {
    height: '720px',
    backgroundSize: 'cover',
    backgroundPosition: 'center',
    display: 'flex',
    flexDirection: 'column' as const,
    justifyContent: 'flex-end',
    paddingBottom: '120px',
    paddingLeft: '56px',
    paddingRight: '56px',
    position: 'relative' as const,
    marginTop: '64px',
  },
  heroContent: {
    maxWidth: '550px',
  },
  heroCategory: {
    fontSize: '13px',
    fontWeight: '700',
    color: '#c8a951',
    letterSpacing: '1px',
    textTransform: 'uppercase' as const,
    marginBottom: '12px',
  },
  heroTitle: {
    fontSize: '48px',
    fontWeight: '900',
    margin: '0 0 16px 0',
    lineHeight: '1.1',
    color: '#fff',
  },
  heroDescription: {
    fontSize: '16px',
    lineHeight: '1.6',
    color: '#d0d0d0',
    marginBottom: '24px',
  },
  heroButtons: {
    display: 'flex',
    gap: '12px',
    alignItems: 'center',
  },
  btnWatch: {
    backgroundColor: '#E50914',
    color: '#fff',
    border: 'none',
    padding: '12px 28px',
    fontSize: '14px',
    fontWeight: '800',
    borderRadius: '4px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
  },
  btnSave: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.3)',
    padding: '12px 28px',
    fontSize: '14px',
    fontWeight: '800',
    borderRadius: '4px',
    cursor: 'pointer',
    letterSpacing: '0.5px',
    transition: 'all 0.2s ease',
  },
  heroRowWrapper: {
    marginTop: '48px',
  },
  netflixRowTitle: {
    fontSize: '18px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#ffffff',
    letterSpacing: '0.3px',
  },
  heroGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '32px',
  },
  heroFadeBottom: {
    position: 'absolute' as const,
    bottom: '0',
    left: '0',
    right: '0',
    height: '120px',
    background: 'linear-gradient(to bottom, transparent, #0b0d0c)',
    pointerEvents: 'none' as const,
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
  mainContent: {
    flex: 1,
    backgroundColor: '#0b0d0c',
    width: '100%',
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
    fontSize: '11px',
    fontWeight: '700',
    color: '#c8a951',
    letterSpacing: '0.5px',
    textTransform: 'uppercase' as const,
  },
  filterSelect: {
    backgroundColor: '#1a1d1c',
    border: '1px solid #3f3f3f',
    color: '#fff',
    padding: '8px 10px',
    borderRadius: '4px',
    fontSize: '13px',
    fontWeight: '600',
  },
};
