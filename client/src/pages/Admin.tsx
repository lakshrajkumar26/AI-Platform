import { useState, useEffect, useMemo } from "react";
import { adminLogin, uploadVideo, getVideos, deleteVideo, type Video } from "@/services/api";

const CATEGORIES = [
  'EMOTIONAL', 
  'TECHNOLOGY', 
  'SCIENCE', 
  'PERSONAL FINANCE', 
  'INFORMATIONAL BRIEFING', 
  'NEWS',
  'TECH INFO'
];

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not load image for cropping"));
    img.src = src;
  });

const buildCroppedThumbnail = async (
  file: File,
  focusX: number,
  focusY: number,
  zoom: number,
  outputWidth = 1280,
  outputHeight = 720
): Promise<File> => {
  const imageUrl = URL.createObjectURL(file);
  try {
    const image = await loadImage(imageUrl);
    const targetRatio = outputWidth / outputHeight;
    const sourceRatio = image.width / image.height;

    let baseCropWidth = image.width;
    let baseCropHeight = image.height;

    if (sourceRatio > targetRatio) {
      baseCropWidth = image.height * targetRatio;
      baseCropHeight = image.height;
    } else {
      baseCropWidth = image.width;
      baseCropHeight = image.width / targetRatio;
    }

    const cropWidth = baseCropWidth / zoom;
    const cropHeight = baseCropHeight / zoom;
    const centerX = (focusX / 100) * image.width;
    const centerY = (focusY / 100) * image.height;
    const cropX = clamp(centerX - cropWidth / 2, 0, image.width - cropWidth);
    const cropY = clamp(centerY - cropHeight / 2, 0, image.height - cropHeight);

    const canvas = document.createElement("canvas");
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Could not initialize crop canvas");
    }

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      outputWidth,
      outputHeight
    );

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", 0.92)
    );

    if (!blob) {
      throw new Error("Could not create cropped image");
    }

    const baseName = file.name.replace(/\.[^/.]+$/, "");
    return new File([blob], `${baseName}-cover.jpg`, { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(imageUrl);
  }
};

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [token, setToken] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<"VIDEO" | "BLOG">("VIDEO");
  const [category, setCategory] = useState(CATEGORIES[4]); // Default Informational Briefing
  const [blogContent, setBlogContent] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreviewUrl, setThumbnailPreviewUrl] = useState("");
  const [thumbnailFocusX, setThumbnailFocusX] = useState(50);
  const [thumbnailFocusY, setThumbnailFocusY] = useState(50);
  const [thumbnailZoom, setThumbnailZoom] = useState(1);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  
  const [contentList, setContentList] = useState<Video[]>([]);
  const [activeTab, setActiveTab] = useState<"upload" | "manage">("upload");
  const [manageSort, setManageSort] = useState<"latest" | "oldest">("latest");
  const [filterType, setFilterType] = useState<"ALL" | "VIDEO" | "BLOG">("ALL");
  const [filterCategory, setFilterCategory] = useState<string>("ALL");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [manageSearch, setManageSearch] = useState("");

  useEffect(() => {
    const savedToken = localStorage.getItem("adminToken");
    if (savedToken) {
      setToken(savedToken);
      setIsLoggedIn(true);
      fetchContent();
    }
  }, []);

  useEffect(() => {
    if (!thumbnailFile) {
      setThumbnailPreviewUrl("");
      return;
    }

    const objectUrl = URL.createObjectURL(thumbnailFile);
    setThumbnailPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [thumbnailFile]);

  const fetchContent = async () => {
    const data = await getVideos();
    setContentList(data);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await adminLogin(username, password);
    if (res) {
      setToken(res.token);
      localStorage.setItem("adminToken", res.token);
      setIsLoggedIn(true);
      fetchContent();
    } else {
      setError("Invalid credentials");
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("adminToken");
    setIsLoggedIn(false);
    setToken("");
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) return alert("Title is required");
    if (type === "BLOG" && !pdfFile && !blogContent.trim()) {
      return alert("For blog uploads, provide a PDF or enter blog content.");
    }
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("type", type);
      formData.append("category", category);
      
      if (type === "BLOG") {
        if (pdfFile) {
          formData.append("pdf", pdfFile);
        } else {
          formData.append("blogContent", blogContent);
        }
      }

      if (videoFile) formData.append("video", videoFile);
      if (thumbnailFile) {
        try {
          const croppedThumbnail = await buildCroppedThumbnail(
            thumbnailFile,
            thumbnailFocusX,
            thumbnailFocusY,
            thumbnailZoom
          );
          formData.append("thumbnail", croppedThumbnail);
        } catch (cropError) {
          console.error("Thumbnail crop failed, uploading original:", cropError);
          formData.append("thumbnail", thumbnailFile);
        }
      }

      await uploadVideo(formData, token);
      alert("Uploaded successfully!");
      setTitle("");
      setDescription("");
      setBlogContent("");
      setVideoFile(null);
      setThumbnailFile(null);
      setThumbnailFocusX(50);
      setThumbnailFocusY(50);
      setThumbnailZoom(1);
      setPdfFile(null);
      fetchContent();
    } catch (uploadError) {
      const message =
        uploadError instanceof Error ? uploadError.message : "Upload failed";
      alert(`Upload failed: ${message}`);
      console.error("Upload failed:", uploadError);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this?")) {
      const success = await deleteVideo(id, token);
      if (success) {
        fetchContent();
      }
    }
  };

  const filteredContent = useMemo(() => {
    let items = [...contentList];

    if (manageSearch.trim()) {
      const query = manageSearch.toLowerCase();
      items = items.filter((item) =>
        item.title.toLowerCase().includes(query) ||
        item.category.toLowerCase().includes(query) ||
        item.type.toLowerCase().includes(query)
      );
    }

    if (filterType !== "ALL") {
      items = items.filter((item) => item.type === filterType);
    }

    if (filterCategory !== "ALL") {
      items = items.filter((item) => item.category === filterCategory);
    }

    if (fromDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      items = items.filter((item) => new Date(item.createdAt) >= start);
    }

    if (toDate) {
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      items = items.filter((item) => new Date(item.createdAt) <= end);
    }

    items.sort((a, b) => {
      const aTime = new Date(a.createdAt).getTime();
      const bTime = new Date(b.createdAt).getTime();
      return manageSort === "latest" ? bTime - aTime : aTime - bTime;
    });

    return items;
  }, [contentList, manageSearch, filterType, filterCategory, fromDate, toDate, manageSort]);

  if (!isLoggedIn) {
    return (
      <div style={styles.loginWrapper}>
        <div style={styles.loginCard}>
          <div style={styles.loginHeader}>
            <span style={{fontSize: '40px'}}>🇮🇳</span>
            <h1 style={styles.loginTitle}>VMS ADMIN</h1>
            <p style={styles.loginSubtitle}>Secure Access Required</p>
          </div>
          <form onSubmit={handleLogin}>
            <div style={styles.formGroup}>
              <label style={styles.label}>USERNAME</label>
              <input 
                type="text" 
                style={styles.input} 
                value={username} 
                onChange={(e) => setUsername(e.target.value)} 
                required 
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>PASSWORD</label>
              <input 
                type="password" 
                style={styles.input} 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
            {error && <p style={{color: 'red', fontSize: '12px', marginBottom: '10px'}}>{error}</p>}
            <button type="submit" style={styles.btnPrimary} disabled={loading}>
              {loading ? "AUTHENTICATING..." : "LOGIN"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.adminWrapper}>
      <header style={styles.adminHeader}>
        <div style={styles.headerContent}>
          <h1 style={styles.logoText}>VMS COMMAND CENTER</h1>
          <button onClick={handleLogout} style={styles.btnLogout}>LOGOUT</button>
        </div>
      </header>

      <main style={styles.mainContent}>
        <div style={styles.tabBar}>
          <button 
            onClick={() => setActiveTab("upload")} 
            style={{...styles.tabBtn, borderBottom: activeTab === "upload" ? "4px solid #c8a951" : "none"}}
          >
            UPLOAD CONTENT
          </button>
          <button 
            onClick={() => setActiveTab("manage")} 
            style={{...styles.tabBtn, borderBottom: activeTab === "manage" ? "4px solid #c8a951" : "none"}}
          >
            MANAGE CONTENT
          </button>
        </div>

        {activeTab === "upload" ? (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>NEW UPLOAD</h2>
            <form onSubmit={handleUpload}>
              <div style={styles.formGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>TITLE *</label>
                  <input 
                    type="text" 
                    style={styles.input} 
                    value={title} 
                    onChange={(e) => setTitle(e.target.value)} 
                    required 
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>CATEGORY</label>
                  <select 
                    style={styles.input} 
                    value={category} 
                    onChange={(e) => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>CONTENT TYPE</label>
                  <div style={styles.contentTypeSwitch}>
                    <label
                      style={{
                        ...styles.contentTypeOption,
                        ...(type === "VIDEO" ? styles.contentTypeOptionActive : {}),
                      }}
                    >
                      <input
                        type="radio"
                        name="contentType"
                        checked={type === "VIDEO"}
                        onChange={() => setType("VIDEO")}
                        style={styles.hiddenRadio}
                      />
                      <span style={styles.contentTypeIcon}>VIDEO</span>
                    </label>
                    <label
                      style={{
                        ...styles.contentTypeOption,
                        ...(type === "BLOG" ? styles.contentTypeOptionActive : {}),
                      }}
                    >
                      <input
                        type="radio"
                        name="contentType"
                        checked={type === "BLOG"}
                        onChange={() => setType("BLOG")}
                        style={styles.hiddenRadio}
                      />
                      <span style={styles.contentTypeIcon}>BLOG</span>
                    </label>
                  </div>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>COVER IMAGE (OPTIONAL)</label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={(e) => {
                      const selected = e.target.files?.[0] || null;
                      setThumbnailFile(selected);
                      setThumbnailFocusX(50);
                      setThumbnailFocusY(50);
                      setThumbnailZoom(1);
                    }}
                    style={styles.fileInput}
                  />
                  {thumbnailPreviewUrl && (
                    <div style={styles.cropPanel}>
                      <div style={styles.cropPreviewLabel}>CROP PREVIEW (16:9)</div>
                      <div style={styles.cropPreviewFrame}>
                        <img
                          src={thumbnailPreviewUrl}
                          alt="Thumbnail crop preview"
                          style={{
                            ...styles.cropPreviewImage,
                            objectPosition: `${thumbnailFocusX}% ${thumbnailFocusY}%`,
                            transform: `scale(${thumbnailZoom})`,
                          }}
                        />
                        <div style={styles.cropGuide} />
                      </div>
                      <div style={styles.cropControls}>
                        <label style={styles.cropControlRow}>
                          <span style={styles.cropControlLabel}>HORIZONTAL</span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={thumbnailFocusX}
                            onChange={(e) => setThumbnailFocusX(Number(e.target.value))}
                            style={styles.cropSlider}
                          />
                          <span style={styles.cropControlValue}>{Math.round(thumbnailFocusX)}%</span>
                        </label>
                        <label style={styles.cropControlRow}>
                          <span style={styles.cropControlLabel}>VERTICAL</span>
                          <input
                            type="range"
                            min={0}
                            max={100}
                            value={thumbnailFocusY}
                            onChange={(e) => setThumbnailFocusY(Number(e.target.value))}
                            style={styles.cropSlider}
                          />
                          <span style={styles.cropControlValue}>{Math.round(thumbnailFocusY)}%</span>
                        </label>
                        <label style={styles.cropControlRow}>
                          <span style={styles.cropControlLabel}>ZOOM</span>
                          <input
                            type="range"
                            min={1}
                            max={3}
                            step={0.05}
                            value={thumbnailZoom}
                            onChange={(e) => setThumbnailZoom(Number(e.target.value))}
                            style={styles.cropSlider}
                          />
                          <span style={styles.cropControlValue}>{thumbnailZoom.toFixed(2)}x</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div style={styles.formGroup}>
                <label style={styles.label}>DESCRIPTION</label>
                <textarea 
                  style={styles.textarea} 
                  value={description} 
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              {type === "VIDEO" ? (
                <div style={styles.formGroup}>
                  <label style={styles.label}>VIDEO FILE</label>
                  <input 
                    type="file" 
                    accept="video/*" 
                    onChange={(e) => setVideoFile(e.target.files?.[0] || null)} 
                    style={styles.fileInput}
                  />
                </div>
              ) : (
                <div
  style={{
    backgroundColor: '#0b0d0c',
    border: '1px solid #333',
    padding: '24px',
    marginBottom: '24px',
    borderRadius: '4px',
  }}
>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>UPLOAD PDF (EXTRACT CONTENT)</label>
                    <input 
                      type="file" 
                      accept=".pdf" 
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)} 
                      style={styles.fileInput}
                    />
                  </div>
                  <div style={{textAlign: 'center', margin: '10px 0', color: '#666'}}>— OR —</div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>WRITE BLOG CONTENT</label>
                    <textarea 
                      style={{...styles.textarea, minHeight: '200px'}} 
                      value={blogContent} 
                      onChange={(e) => setBlogContent(e.target.value)}
                      disabled={!!pdfFile}
                      placeholder={pdfFile ? "Content will be fetched from PDF" : "Enter blog text here..."}
                    />
                  </div>
                </div>
              )}

              <button type="submit" style={styles.btnPrimary} disabled={loading}>
                {loading ? "UPLOADING..." : "START UPLOAD"}
              </button>
            </form>
          </div>
        ) : (
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>EXISTING CONTENT</h2>
            <div style={styles.manageControls}>
              <div style={styles.manageFiltersGrid}>
                <div style={styles.formGroup}>
                  <label style={styles.label}>SEARCH</label>
                  <input
                    type="text"
                    style={styles.input}
                    placeholder="Title, type, category..."
                    value={manageSearch}
                    onChange={(e) => setManageSearch(e.target.value)}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>TYPE</label>
                  <select
                    style={styles.input}
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as "ALL" | "VIDEO" | "BLOG")}
                  >
                    <option value="ALL">ALL</option>
                    <option value="VIDEO">VIDEO</option>
                    <option value="BLOG">BLOG</option>
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>CATEGORY</label>
                  <select
                    style={styles.input}
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                  >
                    <option value="ALL">ALL</option>
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>FROM DATE</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </div>
                <div style={styles.formGroup}>
                  <label style={styles.label}>TO DATE</label>
                  <input
                    type="date"
                    style={styles.input}
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </div>
              </div>

              <div style={styles.manageControlFooter}>
                <div style={styles.sortSwitch}>
                  <button
                    type="button"
                    style={{
                      ...styles.sortBtn,
                      ...(manageSort === "latest" ? styles.sortBtnActive : {})
                    }}
                    onClick={() => setManageSort("latest")}
                  >
                    LATEST UPLOAD
                  </button>
                  <button
                    type="button"
                    style={{
                      ...styles.sortBtn,
                      ...(manageSort === "oldest" ? styles.sortBtnActive : {})
                    }}
                    onClick={() => setManageSort("oldest")}
                  >
                    OLDEST UPLOAD
                  </button>
                </div>
                <button
                  type="button"
                  style={styles.btnGhost}
                  onClick={() => {
                    setManageSearch("");
                    setFilterType("ALL");
                    setFilterCategory("ALL");
                    setFromDate("");
                    setToDate("");
                    setManageSort("latest");
                  }}
                >
                  RESET FILTERS
                </button>
              </div>

              <div style={styles.manageMeta}>
                Showing {filteredContent.length} of {contentList.length} items
              </div>
            </div>

            <div style={styles.tableWrapper}>
              <table style={styles.table}>
                <thead>
                  <tr>
                    <th style={styles.th}>TITLE</th>
                    <th style={styles.th}>TYPE</th>
                    <th style={styles.th}>CATEGORY</th>
                    <th style={styles.th}>DATE</th>
                    <th style={styles.th}>ACTIONS</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContent.length === 0 ? (
                    <tr>
                      <td style={styles.emptyCell} colSpan={5}>
                        No content found for current filters.
                      </td>
                    </tr>
                  ) : filteredContent.map(item => (
                    <tr key={item._id} style={styles.tr}>
                      <td style={styles.td}>{item.title}</td>
                      <td style={styles.td}>{item.type}</td>
                      <td style={styles.td}>{item.category}</td>
                      <td style={styles.td}>{new Date(item.createdAt).toLocaleString()}</td>
                      <td style={styles.td}>
                        <button 
                          onClick={() => handleDelete(item._id)} 
                          style={styles.btnDelete}
                        >
                          DELETE
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  loginWrapper: {
    height: '100vh',
    backgroundColor: '#0b0d0c',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontFamily: 'sans-serif',
  },
  loginCard: {
    width: '100%',
    maxWidth: '400px',
    backgroundColor: '#151817',
    border: '2px solid #c8a951',
    padding: '40px',
    textAlign: 'center' as const,
  },
  loginHeader: {
    marginBottom: '30px',
  },
  loginTitle: {
    color: '#c8a951',
    fontSize: '24px',
    fontWeight: '900',
    margin: '10px 0',
  },
  loginSubtitle: {
    color: '#888',
    fontSize: '12px',
    textTransform: 'uppercase' as const,
  },
  adminWrapper: {
    minHeight: '100vh',
    backgroundColor: '#0b0d0c',
    color: '#fff',
    fontFamily: 'sans-serif',
  },
  adminHeader: {
    backgroundColor: '#151817',
    borderBottom: '2px solid #c8a951',
    padding: '20px',
  },
  headerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoText: {
    color: '#c8a951',
    fontSize: '20px',
    fontWeight: '900',
    letterSpacing: '2px',
  },
  btnLogout: {
    backgroundColor: 'transparent',
    border: '1px solid #c8a951',
    color: '#c8a951',
    padding: '8px 16px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  mainContent: {
    maxWidth: '1200px',
    margin: '40px auto',
    padding: '0 20px',
  },
  tabBar: {
    display: 'flex',
    gap: '20px',
    marginBottom: '30px',
    borderBottom: '1px solid #333',
  },
  tabBtn: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#c8a951',
    padding: '10px 20px',
    fontSize: '14px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  card: {
    backgroundColor: '#151817',
    border: '1px solid #333',
    padding: '30px',
  },
  cardTitle: {
    color: '#c8a951',
    fontSize: '18px',
    fontWeight: '800',
    marginBottom: '25px',
    borderLeft: '4px solid #c8a951',
    paddingLeft: '15px',
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '20px',
  },
  formGroup: {
    marginBottom: '20px',
    textAlign: 'left' as const,
  },
  contentTypeSwitch: {
    display: 'flex',
    gap: '12px',
    marginTop: '10px',
    height: '44px',
  },
  contentTypeOption: {
    flex: 1,
    border: '1px solid #333',
    backgroundColor: '#0b0d0c',
    padding: '0 12px',
    borderRadius: '6px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.2s ease',
  },
  contentTypeOptionActive: {
    border: '1px solid #c8a951',
    backgroundColor: '#1a1d1c',
    boxShadow: '0 0 0 1px #c8a951 inset',
  },
  hiddenRadio: {
    position: 'absolute' as const,
    opacity: 0,
    width: 0,
    height: 0,
  },
  contentTypeIcon: {
    color: '#c8a951',
    fontSize: '13px',
    fontWeight: '800',
    letterSpacing: '1px',
  },
  label: {
    display: 'block',
    color: '#c8a951',
    fontSize: '12px',
    fontWeight: '700',
    marginBottom: '8px',
  },
  input: {
    width: '100%',
    backgroundColor: '#0b0d0c',
    border: '1px solid #333',
    color: '#fff',
    padding: '12px',
    fontSize: '14px',
    outline: 'none',
  },
  textarea: {
    width: '100%',
    backgroundColor: '#0b0d0c',
    border: '1px solid #333',
    color: '#fff',
    padding: '12px',
    fontSize: '14px',
    minHeight: '100px',
    outline: 'none',
    fontFamily: 'inherit',
  },
  fileInput: {
  color: '#888',
  fontSize: '12px',
  backgroundColor: '#0b0d0c',
  border: '1px solid #333',
  padding: '10px',
  width: '100%',
  appearance: 'none',
  WebkitAppearance: 'none',
  MozAppearance: 'none',
},
  cropPanel: {
    marginTop: '14px',
    border: '1px solid #2f2f2f',
    backgroundColor: '#0b0d0c',
    borderRadius: '6px',
    padding: '12px',
  },
  cropPreviewLabel: {
    color: '#c8a951',
    fontSize: '11px',
    fontWeight: '700',
    letterSpacing: '1px',
    marginBottom: '8px',
  },
  cropPreviewFrame: {
    position: 'relative' as const,
    width: '100%',
    aspectRatio: '16 / 9',
    border: '1px solid #333',
    borderRadius: '4px',
    overflow: 'hidden' as const,
    backgroundColor: '#111',
    marginBottom: '10px',
  },
  cropPreviewImage: {
    width: '100%',
    height: '100%',
    objectFit: 'cover' as const,
    transformOrigin: 'center center',
  },
  cropGuide: {
    position: 'absolute' as const,
    inset: '8px',
    border: '1px dashed rgba(200, 169, 81, 0.6)',
    pointerEvents: 'none' as const,
  },
  cropControls: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '8px',
  },
  cropControlRow: {
    display: 'grid',
    gridTemplateColumns: '90px 1fr 52px',
    alignItems: 'center',
    gap: '8px',
  },
  cropControlLabel: {
    color: '#b8b8b8',
    fontSize: '11px',
    fontWeight: '700',
  },
  cropSlider: {
    width: '100%',
  },
  cropControlValue: {
    color: '#c8a951',
    fontSize: '11px',
    fontWeight: '700',
    textAlign: 'right' as const,
  },
  btnPrimary: {
    width: '100%',
    backgroundColor: '#c8a951',
    color: '#000',
    border: 'none',
    padding: '15px',
    fontSize: '14px',
    fontWeight: '900',
    cursor: 'pointer',
    marginTop: '10px',
  },
  tableWrapper: {
    overflowX: 'auto' as const,
    border: '1px solid #2c302f',
    borderRadius: '8px',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    backgroundColor: '#111413',
  },
  th: {
    textAlign: 'left' as const,
    padding: '12px',
    borderBottom: '2px solid #333',
    color: '#c8a951',
    fontSize: '12px',
  },
  td: {
    padding: '12px',
    borderBottom: '1px solid #222',
    fontSize: '14px',
  },
  manageControls: {
    marginBottom: '20px',
    padding: '16px',
    border: '1px solid #2c302f',
    borderRadius: '8px',
    backgroundColor: '#111413',
  },
  manageFiltersGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
    gap: '12px',
  },
  manageControlFooter: {
    marginTop: '6px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap' as const,
  },
  sortSwitch: {
    display: 'flex',
    border: '1px solid #333',
    borderRadius: '6px',
    overflow: 'hidden',
  },
  sortBtn: {
    backgroundColor: '#0b0d0c',
    color: '#8d8d8d',
    border: 'none',
    padding: '10px 14px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
  },
  sortBtnActive: {
    backgroundColor: '#c8a951',
    color: '#0b0d0c',
  },
  manageMeta: {
    marginTop: '10px',
    color: '#8d8d8d',
    fontSize: '12px',
    fontWeight: '600',
  },
  btnGhost: {
    backgroundColor: 'transparent',
    color: '#c8a951',
    border: '1px solid #c8a951',
    padding: '10px 14px',
    fontSize: '12px',
    fontWeight: '700',
    cursor: 'pointer',
    borderRadius: '6px',
  },
  btnDelete: {
    backgroundColor: '#e03b3b',
    color: '#fff',
    border: 'none',
    padding: '7px 12px',
    cursor: 'pointer',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: '700',
  },
  emptyCell: {
    textAlign: 'center' as const,
    color: '#888',
    padding: '24px',
    fontSize: '13px',
  },
  tr: {
    ':hover': {
      backgroundColor: '#1a1d1c',
    }
  }
};
