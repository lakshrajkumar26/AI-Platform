import { useState, useEffect, useCallback } from 'react';
import type { Video } from '@/services/api';

interface SavedItem extends Video {
  savedAt: string;
}

export const useLibrary = () => {
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load saved items from localStorage on mount
  useEffect(() => {
    const loadSavedItems = () => {
      try {
        const stored = localStorage.getItem('vms_library');
        if (stored) {
          setSavedItems(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading library:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSavedItems();
  }, []);

  // Save item to library
  const saveToLibrary = useCallback((video: Video) => {
    setSavedItems((prev) => {
      const exists = prev.some((item) => item._id === video._id);
      if (exists) {
        // Remove if already exists (toggle behavior)
        return prev.filter((item) => item._id !== video._id);
      }
      // Add new item with savedAt timestamp
      const newItem: SavedItem = {
        ...video,
        savedAt: new Date().toISOString(),
      };
      return [newItem, ...prev];
    });
  }, []);

  // Remove item from library
  const removeFromLibrary = useCallback((videoId: string) => {
    setSavedItems((prev) => prev.filter((item) => item._id !== videoId));
  }, []);

  // Check if item is saved
  const isSaved = useCallback(
    (videoId: string) => {
      return savedItems.some((item) => item._id === videoId);
    },
    [savedItems]
  );

  // Persist to localStorage whenever savedItems changes
  useEffect(() => {
    try {
      localStorage.setItem('vms_library', JSON.stringify(savedItems));
    } catch (error) {
      console.error('Error saving library:', error);
    }
  }, [savedItems]);

  return {
    savedItems,
    saveToLibrary,
    removeFromLibrary,
    isSaved,
    isLoading,
  };
};
