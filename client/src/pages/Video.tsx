import { useEffect, useRef, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { getSingleVideo, trackAction } from '@/services/api';
import { useLibrary } from '@/hooks/useLibrary';

export default function Video() {
  const [, params] = useRoute('/video/:id');
  const [, setLocation] = useLocation();
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const blogRef = useRef<HTMLElement | null>(null);
  const lastTrackedProgress = useRef<number>(0);
  const { saveToLibrary, isSaved } = useLibrary();
  const [isLiked, setIsLiked] = useState(false);

  // Check if liked from localStorage (simple implementation for now)
  useEffect(() => {
    if (video) {
      const likedItems = JSON.parse(localStorage.getItem('vms_likes') || '[]');
      setIsLiked(likedItems.includes(video._id));
    }
  }, [video]);

  useEffect(() => {
    if (params?.id) {
      setLoading(true);
      setError(null);
      getSingleVideo(params.id)
        .then((data) => {
          if (data) {
            setVideo(data);
          } else {
            setError('Video not found');
          }
        })
        .catch((err) => {
          console.error('Error loading video:', err);
          setError('Failed to load video');
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [params?.id]);

  const isBlog = video?.type === 'BLOG';

  // Track video progress
  useEffect(() => {
    if (!video || isBlog || !videoRef.current) return;

    const videoEl = videoRef.current;
    const handleTimeUpdate = () => {
      if (!videoEl.duration) return;
      const progress = Math.floor((videoEl.currentTime / videoEl.duration) * 100);
      // Track every 5% to avoid too many requests
      if (progress > 0 && progress < 100 && progress >= lastTrackedProgress.current + 5) {
        lastTrackedProgress.current = progress;
        trackAction(video._id, 'PROGRESS', { progress });
      }
    };

    videoEl.addEventListener('timeupdate', handleTimeUpdate);
    return () => videoEl.removeEventListener('timeupdate', handleTimeUpdate);
  }, [video, isBlog]);

  // Track blog progress
  useEffect(() => {
    if (!video || !isBlog || !blogRef.current) return;

    const blogEl = blogRef.current;
    const handleScroll = () => {
      const scrollPos = blogEl.scrollTop + blogEl.clientHeight;
      const totalHeight = blogEl.scrollHeight;
      const progress = Math.floor((scrollPos / totalHeight) * 100);

      if (progress > 0 && progress < 100 && progress >= lastTrackedProgress.current + 10) {
        lastTrackedProgress.current = progress;
        trackAction(video._id, 'PROGRESS', { progress });
      }

      if (progress >= 95 && lastTrackedProgress.current < 95) {
        lastTrackedProgress.current = 100;
        trackAction(video._id, 'COMPLETE');
      }
    };

    blogEl.addEventListener('scroll', handleScroll);
    return () => blogEl.removeEventListener('scroll', handleScroll);
  }, [video, isBlog]);

  const handleGoBack = () => setLocation('/');

  const handleFullscreen = async () => {
    if (!playerShellRef.current) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen();
      return;
    }
    await playerShellRef.current.requestFullscreen();
  };

  const handleSaveToLibrary = () => {
    if (video) {
      saveToLibrary(video);
    }
  };

  const handleLike = () => {
    if (video && !isLiked) {
      setIsLiked(true);
      const likedItems = JSON.parse(localStorage.getItem('vms_likes') || '[]');
      if (!likedItems.includes(video._id)) {
        likedItems.push(video._id);
        localStorage.setItem('vms_likes', JSON.stringify(likedItems));
        trackAction(video._id, 'LIKE');
      }
    }
  };

  if (loading) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner}></div>
          Loading video...
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div style={styles.centerScreen}>
        <div style={styles.errorBox}>
          <h2 style={styles.errorTitle}>{error || 'Video not found'}</h2>
          <p style={styles.errorText}>The requested content is not available.</p>
          <button onClick={handleGoBack} style={styles.actionBtn}>
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <style>{videoCss}</style>

      <header style={styles.topBar}>
        <button onClick={handleGoBack} style={styles.actionBtn}>
          Back
        </button>
        <h1 style={styles.title}>{video.title}</h1>
        <div style={styles.rightButtons}>
          <button
            onClick={handleLike}
            style={{
              ...styles.actionBtn,
              background: isLiked ? '#E50914' : 'rgba(255,255,255,0.2)',
              marginRight: '8px'
            }}
          >
            {isLiked ? '👍 LIKED' : '👍 LIKE'}
          </button>
          <button
            onClick={handleSaveToLibrary}
            style={{
              ...styles.actionBtn,
              background: isSaved(video._id) ? '#E50914' : 'rgba(255,255,255,0.2)',
            }}
            title={isSaved(video._id) ? 'Remove from library' : 'Add to library'}
          >
            {isSaved(video._id) ? '❤ SAVED' : '🤍 SAVE'}
          </button>
          {!isBlog && (
            <button onClick={handleFullscreen} style={styles.actionBtn}>
              Full Screen
            </button>
          )}
        </div>
      </header>

      {isBlog ? (
        <main ref={blogRef} style={styles.blogShell}>
          <article style={styles.blogCard}>
            <div style={styles.blogMeta}>
              {video.category} - {new Date(video.createdAt).toLocaleDateString()}
            </div>
            <h2 style={styles.blogTitle}>{video.title}</h2>
            {video.description ? <p style={styles.blogDesc}>{video.description}</p> : null}
            <div style={styles.blogContent}>
              {video.blogContent?.trim() || 'No blog content available.'}
            </div>
          </article>
        </main>
      ) : (
        <main ref={playerShellRef} style={styles.playerShell}>
          <video
            ref={videoRef}
            src={video.videoPath}
            controls
            controlsList="nodownload"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
            onEnded={() => {
              lastTrackedProgress.current = 100;
              trackAction(video._id, 'COMPLETE');
            }}
            style={styles.videoEl}
            autoPlay
          />
        </main>
      )}
    </div>
  );
}

const videoCss = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const styles = {
  page: {
    width: '100vw',
    height: '100dvh',
    backgroundColor: '#000',
    overflow: 'hidden',
    display: 'grid',
    gridTemplateRows: '64px 1fr',
  },
  centerScreen: {
    width: '100vw',
    height: '100dvh',
    backgroundColor: '#000',
    color: '#fff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
    gap: '14px',
    color: '#c8a951',
    fontWeight: '700',
  },
  spinner: {
    width: '46px',
    height: '46px',
    border: '3px solid #c8a951',
    borderTop: '3px solid transparent',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  errorBox: {
    textAlign: 'center' as const,
    padding: '24px',
  },
  errorTitle: {
    margin: '0 0 8px 0',
    fontSize: '24px',
    color: '#c8a951',
  },
  errorText: {
    margin: '0 0 16px 0',
    color: '#aaa',
  },
  topBar: {
    height: '64px',
    backgroundColor: '#0b0d0c',
    borderBottom: '1px solid #c8a951',
    display: 'grid',
    gridTemplateColumns: 'auto 1fr auto',
    alignItems: 'center',
    gap: '12px',
    padding: '0 14px',
    minWidth: 0,
  },
  title: {
    margin: 0,
    fontSize: '18px',
    color: '#c8a951',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap' as const,
    textAlign: 'center' as const,
  },
  rightButtons: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
  },
  actionBtn: {
    padding: '8px 12px',
    backgroundColor: '#c8a951',
    color: '#0b0d0c',
    border: 'none',
    borderRadius: '6px',
    fontSize: '12px',
    fontWeight: '800',
    cursor: 'pointer',
    whiteSpace: 'nowrap' as const,
  },
  playerShell: {
    minHeight: 0,
    width: '100%',
    height: '100%',
    padding: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  blogShell: {
    width: '100%',
    height: '100%',
    minHeight: 0,
    overflowY: 'auto' as const,
    backgroundColor: '#0b0d0c',
    padding: '20px',
  },
  blogCard: {
    width: '100%',
    maxWidth: '1100px',
    margin: '0 auto',
    border: '1px solid #2f2f2f',
    borderRadius: '8px',
    backgroundColor: '#121514',
    padding: '20px',
  },
  blogMeta: {
    color: '#c8a951',
    fontSize: '12px',
    fontWeight: '700',
    marginBottom: '10px',
    letterSpacing: '0.8px',
    textTransform: 'uppercase' as const,
  },
  blogTitle: {
    margin: '0 0 10px 0',
    color: '#c8a951',
    fontSize: '30px',
    lineHeight: 1.2,
  },
  blogDesc: {
    color: '#d0d0d0',
    margin: '0 0 18px 0',
    lineHeight: 1.6,
  },
  blogContent: {
    color: '#ececec',
    whiteSpace: 'pre-wrap' as const,
    lineHeight: 1.7,
    fontSize: '16px',
  },
  videoEl: {
    width: '100%',
    height: '100%',
    maxWidth: '100%',
    maxHeight: '100%',
    objectFit: 'contain' as const,
    backgroundColor: '#000',
    borderRadius: '8px',
  },
};
