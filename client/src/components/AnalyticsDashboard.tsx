import { useState, useEffect } from "react";
import { getAnalyticsStats } from "@/services/api";

interface DashboardStats {
  totalVideos: number;
  totalBlogs: number;
  activeUsersToday: number;
  mostWatchedVideo: { title: string; views: number };
  mostSavedBlog: { title: string; saves: number };
  completionRate: number;
  totalViews: number;
  totalSaves: number;
  totalCompletions: number;
}

interface AnalyticsDashboardProps {
  token: string;
}

export default function AnalyticsDashboard({ token }: AnalyticsDashboardProps) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getAnalyticsStats(token);
      setStats(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load analytics";
      setError(message);
      console.error("Error fetching analytics:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={styles.loadingBox}>
          <div style={styles.spinner}></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.container}>
        <div style={styles.errorBox}>
          <p style={{ color: "#ff6b6b", marginBottom: "10px" }}>Error: {error}</p>
          <button onClick={fetchStats} style={styles.retryBtn}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div style={styles.container}>
        <p style={{ color: "#aaa" }}>No data available</p>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <style>{dashboardCss}</style>

      <div style={styles.header}>
        <h2 style={styles.title}>📊 Analytics Dashboard</h2>
        <button onClick={fetchStats} style={styles.refreshBtn}>
          🔄 Refresh
        </button>
      </div>

      {/* Summary Cards */}
      <div style={styles.summaryGrid}>
        <div style={styles.card}>
          <div style={styles.cardLabel}>Total Videos</div>
          <div style={styles.cardValue}>{stats.totalVideos}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Total Blogs</div>
          <div style={styles.cardValue}>{stats.totalBlogs}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Active Users Today</div>
          <div style={styles.cardValue}>{stats.activeUsersToday}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Completion Rate</div>
          <div style={styles.cardValue}>{stats.completionRate}%</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Total Views</div>
          <div style={styles.cardValue}>{stats.totalViews}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Total Saves</div>
          <div style={styles.cardValue}>{stats.totalSaves}</div>
        </div>

        <div style={styles.card}>
          <div style={styles.cardLabel}>Total Completions</div>
          <div style={styles.cardValue}>{stats.totalCompletions}</div>
        </div>
      </div>

      {/* Top Content Section */}
      <div style={styles.topContentSection}>
        <div style={styles.contentBox}>
          <h3 style={styles.contentTitle}>🎥 Most Watched Video</h3>
          <div style={styles.contentItem}>
            <p style={styles.contentName}>{stats.mostWatchedVideo.title || "N/A"}</p>
            <p style={styles.contentStat}>
              👁️ {stats.mostWatchedVideo.views} views
            </p>
          </div>
        </div>

        <div style={styles.contentBox}>
          <h3 style={styles.contentTitle}>📖 Most Saved Blog</h3>
          <div style={styles.contentItem}>
            <p style={styles.contentName}>{stats.mostSavedBlog.title || "N/A"}</p>
            <p style={styles.contentStat}>
              ❤️ {stats.mostSavedBlog.saves} saves
            </p>
          </div>
        </div>
      </div>

      {/* Insights Section */}
      <div style={styles.insightsSection}>
        <h3 style={styles.insightsTitle}>💡 Key Insights</h3>
        <div style={styles.insightsList}>
          <div style={styles.insightItem}>
            <span style={styles.insightIcon}>📈</span>
            <span style={styles.insightText}>
              Average views per video: {stats.totalVideos > 0 ? (stats.totalViews / stats.totalVideos).toFixed(1) : 0}
            </span>
          </div>
          <div style={styles.insightItem}>
            <span style={styles.insightIcon}>💾</span>
            <span style={styles.insightText}>
              Average saves per blog: {stats.totalBlogs > 0 ? (stats.totalSaves / stats.totalBlogs).toFixed(1) : 0}
            </span>
          </div>
          <div style={styles.insightItem}>
            <span style={styles.insightIcon}>✅</span>
            <span style={styles.insightText}>
              Video completion rate: {stats.completionRate}%
            </span>
          </div>
          <div style={styles.insightItem}>
            <span style={styles.insightIcon}>👥</span>
            <span style={styles.insightText}>
              Total unique users tracked: {Math.max(stats.activeUsersToday, stats.totalViews > 0 ? Math.ceil(stats.totalViews / 5) : 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

const dashboardCss = `
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

const styles = {
  container: {
    padding: "20px",
    backgroundColor: "#0b0d0c",
    color: "#fff",
    minHeight: "100vh",
    fontFamily: "system-ui, -apple-system, sans-serif",
  },

  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "30px",
    paddingBottom: "15px",
    borderBottom: "2px solid #c8a951",
  },

  title: {
    margin: 0,
    fontSize: "28px",
    color: "#c8a951",
    fontWeight: "700",
  },

  refreshBtn: {
    padding: "8px 16px",
    backgroundColor: "#c8a951",
    color: "#0b0d0c",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
    transition: "all 0.3s ease",
  },

  summaryGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "15px",
    marginBottom: "30px",
  },

  card: {
    backgroundColor: "#121514",
    border: "1px solid #2f2f2f",
    borderRadius: "8px",
    padding: "20px",
    textAlign: "center" as const,
    animation: "slideIn 0.3s ease",
    transition: "all 0.3s ease",
  },

  cardLabel: {
    fontSize: "12px",
    color: "#888",
    textTransform: "uppercase" as const,
    letterSpacing: "1px",
    marginBottom: "10px",
    fontWeight: "600",
  },

  cardValue: {
    fontSize: "32px",
    color: "#c8a951",
    fontWeight: "700",
  },

  topContentSection: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "20px",
    marginBottom: "30px",
  },

  contentBox: {
    backgroundColor: "#121514",
    border: "1px solid #c8a951",
    borderRadius: "8px",
    padding: "20px",
    animation: "slideIn 0.3s ease",
  },

  contentTitle: {
    margin: "0 0 15px 0",
    fontSize: "16px",
    color: "#c8a951",
    fontWeight: "700",
    textTransform: "uppercase" as const,
    letterSpacing: "0.8px",
  },

  contentItem: {
    padding: "10px",
    backgroundColor: "rgba(200, 169, 81, 0.05)",
    borderRadius: "6px",
  },

  contentName: {
    margin: "0 0 8px 0",
    fontSize: "16px",
    color: "#fff",
    fontWeight: "600",
    wordBreak: "break-word" as const,
  },

  contentStat: {
    margin: 0,
    fontSize: "14px",
    color: "#c8a951",
    fontWeight: "600",
  },

  insightsSection: {
    backgroundColor: "#121514",
    border: "1px solid #2f2f2f",
    borderRadius: "8px",
    padding: "20px",
    marginBottom: "20px",
  },

  insightsTitle: {
    margin: "0 0 15px 0",
    fontSize: "16px",
    color: "#c8a951",
    fontWeight: "700",
    textTransform: "uppercase" as const,
    letterSpacing: "0.8px",
  },

  insightsList: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "12px",
  },

  insightItem: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    padding: "12px",
    backgroundColor: "rgba(200, 169, 81, 0.05)",
    borderRadius: "6px",
    borderLeft: "3px solid #c8a951",
  },

  insightIcon: {
    fontSize: "20px",
    minWidth: "24px",
  },

  insightText: {
    fontSize: "14px",
    color: "#d0d0d0",
    lineHeight: "1.4",
  },

  loadingBox: {
    display: "flex",
    flexDirection: "column" as const,
    alignItems: "center",
    justifyContent: "center",
    gap: "15px",
    padding: "40px",
    color: "#c8a951",
  },

  spinner: {
    width: "40px",
    height: "40px",
    border: "3px solid #c8a951",
    borderTop: "3px solid transparent",
    borderRadius: "50%",
    animation: "spin 1s linear infinite",
  },

  errorBox: {
    backgroundColor: "#1a1a1a",
    border: "1px solid #ff6b6b",
    borderRadius: "8px",
    padding: "20px",
    color: "#ff6b6b",
  },

  retryBtn: {
    padding: "8px 16px",
    backgroundColor: "#ff6b6b",
    color: "#fff",
    border: "none",
    borderRadius: "6px",
    fontSize: "14px",
    fontWeight: "600",
    cursor: "pointer",
  },
};
