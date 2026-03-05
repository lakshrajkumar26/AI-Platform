// API Service for backend communication
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface Video {
  _id: string;
  title: string;
  description: string;
  blogContent?: string;
  videoPath?: string;
  thumbnailPath?: string | null;
  type: 'VIDEO' | 'BLOG';
  category: string;
  uploadedBy: {
    _id: string;
    username: string;
  };
  createdAt: string;
  views?: number;
  saves?: number;
  completions?: number;
}

// Get all videos
export const getVideos = async (): Promise<Video[]> => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch videos: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching videos:', error);
    return [];
  }
};

// Get single video
export const getSingleVideo = async (id: string): Promise<Video | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch video: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching single video:', error);
    return null;
  }
};

// Upload video (admin only)
export const uploadVideo = async (
  formData: FormData,
  token: string
): Promise<Video> => {
  const response = await fetch(`${API_BASE_URL}/videos`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let message = `Failed to upload video: ${response.statusText}`;
    try {
      const errorBody = await response.json();
      if (errorBody?.error) {
        message = errorBody.error;
      } else if (errorBody?.message) {
        message = errorBody.message;
      }
    } catch {
      // keep fallback message when response isn't JSON
    }
    throw new Error(message);
  }

  const data = await response.json();
  return data;
};

// Update video (admin only)
export const updateVideo = async (
  id: string,
  formData: FormData,
  token: string
): Promise<Video | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) {
      throw new Error(`Failed to update video: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error updating video:', error);
    return null;
  }
};

// Delete video (admin only)
export const deleteVideo = async (id: string, token: string): Promise<boolean> => {
  try {
    const response = await fetch(`${API_BASE_URL}/videos/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to delete video: ${response.statusText}`);
    }
    return true;
  } catch (error) {
    console.error('Error deleting video:', error);
    return false;
  }
};

// Admin login
export const adminLogin = async (
  username: string,
  password: string
): Promise<{ token: string; username: string } | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    if (!response.ok) {
      throw new Error(`Login failed: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error logging in:', error);
    return null;
  }
};

// ================= ANALYTICS FUNCTIONS =================

// Generate or get a unique user ID (stored in localStorage)
const getUserId = (): string => {
  let userId = localStorage.getItem('vms_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('vms_user_id', userId);
  }
  return userId;
};

// Track user action (view, save, complete)
export const trackAction = async (
  contentId: string,
  action: 'VIEW' | 'SAVE' | 'COMPLETE' | 'PROGRESS' | 'LIKE',
  metadata?: Record<string, any>
): Promise<boolean> => {
  try {
    const userId = getUserId();
    const response = await fetch(`${API_BASE_URL}/analytics/track`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contentId,
        action,
        userId,
        metadata: metadata || {},
      }),
    });

    if (!response.ok) {
      console.error(`Failed to track action: ${response.statusText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error tracking action:', error);
    return false;
  }
};

// Get analytics stats for dashboard (admin only)
export const getAnalyticsStats = async (token: string): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/stats`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch analytics: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching analytics stats:', error);
    throw error;
  }
};

// Get user progress
export const getUserProgress = async (): Promise<any[]> => {
  try {
    const userId = getUserId();
    const response = await fetch(`${API_BASE_URL}/analytics/progress?userId=${userId}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      throw new Error(`Failed to fetch progress: ${response.statusText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching user progress:', error);
    return [];
  }
};

// Get dashboard stats (public endpoint)
export const getDashboardStats = async (): Promise<any> => {
  try {
    const response = await fetch(`${API_BASE_URL}/analytics/dashboard`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch dashboard stats: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw error;
  }
};
