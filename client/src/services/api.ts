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
