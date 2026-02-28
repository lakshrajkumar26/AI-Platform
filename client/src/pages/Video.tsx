import { useEffect, useRef, useState } from 'react';
import { useRoute, useLocation } from 'wouter';
import { getSingleVideo } from '@/services/api';
import { useLibrary } from '@/hooks/useLibrary';

export default function Video() {
  const [, params] = useRoute('/video/:id');
  const [, setLocation] = useLocation();
  const [video, setVideo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const playerShellRef = useRef<HTMLDivElement | null>(null);
  const { saveToLibrary, isSaved } = useLibrary();

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

  const handleGoBack = () => setLocation('/');
  const isBlog = video?.type === 'BLOG';

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
        <main style={styles.blogShell}>
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
            src={video.videoPath}
            controls
            controlsList="nodownload"
            disablePictureInPicture
            onContextMenu={(e) => e.preventDefault()}
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
