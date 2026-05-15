import { useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'newsletter-builder-autosave';
const AUTOSAVE_DELAY = 1000; // 1 second debounce

export function useAutosave(newsletter, setNewsletter) {
  const timeoutRef = useRef(null);
  const isInitializedRef = useRef(false);

  // Load saved newsletter on mount
  const loadSavedNewsletter = useCallback(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load autosaved newsletter:', error);
    }
    return null;
  }, []);

  // Save newsletter to localStorage
  const saveNewsletter = useCallback((data) => {
    try {
      if (data) {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        localStorage.setItem(`${STORAGE_KEY}-timestamp`, Date.now().toString());
      }
    } catch (error) {
      console.error('Failed to autosave newsletter:', error);
    }
  }, []);

  // Clear saved newsletter
  const clearSavedNewsletter = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(`${STORAGE_KEY}-timestamp`);
    } catch (error) {
      console.error('Failed to clear autosaved newsletter:', error);
    }
  }, []);

  // Get last save timestamp
  const getLastSaveTime = useCallback(() => {
    try {
      const timestamp = localStorage.getItem(`${STORAGE_KEY}-timestamp`);
      return timestamp ? new Date(parseInt(timestamp, 10)) : null;
    } catch {
      return null;
    }
  }, []);

  // Check if there's a saved newsletter
  const hasSavedNewsletter = useCallback(() => {
    try {
      return !!localStorage.getItem(STORAGE_KEY);
    } catch {
      return false;
    }
  }, []);

  // Autosave effect - debounced
  useEffect(() => {
    if (!newsletter || !isInitializedRef.current) {
      isInitializedRef.current = true;
      return;
    }

    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for autosave
    timeoutRef.current = setTimeout(() => {
      saveNewsletter(newsletter);
    }, AUTOSAVE_DELAY);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [newsletter, saveNewsletter]);

  return {
    loadSavedNewsletter,
    saveNewsletter,
    clearSavedNewsletter,
    getLastSaveTime,
    hasSavedNewsletter
  };
}

export default useAutosave;

