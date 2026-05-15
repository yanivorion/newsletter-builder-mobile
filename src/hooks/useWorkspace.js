import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY_SIZE = 50;

export function useWorkspace() {
  const [, forceUpdate] = useState(0);
  
  const workspaceRef = useRef({
    // Workspace state
    zoom: 1,
    newsletters: [], // Array of { id, name, position: {x, y}, data: newsletterData }
    activeNewsletterId: null,
    selectedSectionId: null,
    clipboard: null, // For copy/paste
    
    // History per newsletter
    histories: {}, // { [newsletterId]: { states: [], index: 0 } }
  });

  // Get current workspace state
  const getWorkspace = () => workspaceRef.current;

  // Add a new newsletter
  const addNewsletter = useCallback((template, position = null) => {
    const ws = workspaceRef.current;
    const id = `newsletter-${Date.now()}`;
    
    // Calculate position (stack horizontally)
    const xOffset = ws.newsletters.length * 680; // 600px width + 80px gap
    
    const newNewsletter = {
      id,
      name: `Newsletter ${ws.newsletters.length + 1}`,
      position: position || { x: xOffset, y: 0 },
      data: JSON.parse(JSON.stringify(template))
    };
    
    ws.newsletters.push(newNewsletter);
    ws.histories[id] = { states: [JSON.parse(JSON.stringify(newNewsletter.data))], index: 0 };
    ws.activeNewsletterId = id;
    ws.selectedSectionId = null;
    
    forceUpdate(n => n + 1);
    return id;
  }, []);

  // Update a newsletter's data
  const updateNewsletter = useCallback((id, updater) => {
    const ws = workspaceRef.current;
    const newsletter = ws.newsletters.find(n => n.id === id);
    if (!newsletter) return;
    
    const newData = typeof updater === 'function' 
      ? updater(newsletter.data) 
      : updater;
    
    newsletter.data = newData;
    
    // Update history
    const history = ws.histories[id];
    if (history) {
      history.states = history.states.slice(0, history.index + 1);
      history.states.push(JSON.parse(JSON.stringify(newData)));
      if (history.states.length > MAX_HISTORY_SIZE) {
        history.states.shift();
      } else {
        history.index++;
      }
    }
    
    forceUpdate(n => n + 1);
  }, []);

  // Copy newsletter to clipboard
  const copyNewsletter = useCallback((id) => {
    const ws = workspaceRef.current;
    const newsletter = ws.newsletters.find(n => n.id === id);
    if (newsletter) {
      ws.clipboard = JSON.parse(JSON.stringify(newsletter.data));
    }
  }, []);

  // Paste newsletter from clipboard
  const pasteNewsletter = useCallback(() => {
    const ws = workspaceRef.current;
    if (ws.clipboard) {
      const id = `newsletter-${Date.now()}`;
      const xOffset = ws.newsletters.length * 680;
      
      const newNewsletter = {
        id,
        name: `Newsletter ${ws.newsletters.length + 1} (Pasted)`,
        position: { x: xOffset, y: 0 },
        data: JSON.parse(JSON.stringify(ws.clipboard))
      };
      
      ws.newsletters.push(newNewsletter);
      ws.histories[id] = { states: [JSON.parse(JSON.stringify(newNewsletter.data))], index: 0 };
      ws.activeNewsletterId = id;
      ws.selectedSectionId = null;
      
      forceUpdate(n => n + 1);
    }
  }, []);

  // Duplicate a newsletter
  const duplicateNewsletter = useCallback((id) => {
    const ws = workspaceRef.current;
    const newsletter = ws.newsletters.find(n => n.id === id);
    if (newsletter) {
      const newId = `newsletter-${Date.now()}`;
      const xOffset = ws.newsletters.length * 680;
      
      const newNewsletter = {
        id: newId,
        name: `${newsletter.name} (Copy)`,
        position: { x: xOffset, y: 0 },
        data: JSON.parse(JSON.stringify(newsletter.data))
      };
      
      ws.newsletters.push(newNewsletter);
      ws.histories[newId] = { states: [JSON.parse(JSON.stringify(newNewsletter.data))], index: 0 };
      ws.activeNewsletterId = newId;
      ws.selectedSectionId = null;
      
      forceUpdate(n => n + 1);
    }
  }, []);

  // Delete a newsletter
  const deleteNewsletter = useCallback((id) => {
    const ws = workspaceRef.current;
    ws.newsletters = ws.newsletters.filter(n => n.id !== id);
    delete ws.histories[id];
    if (ws.activeNewsletterId === id) {
      ws.activeNewsletterId = ws.newsletters[0]?.id || null;
      ws.selectedSectionId = null;
    }
    forceUpdate(n => n + 1);
  }, []);

  // Rename a newsletter
  const renameNewsletter = useCallback((id, name) => {
    const ws = workspaceRef.current;
    const newsletter = ws.newsletters.find(n => n.id === id);
    if (newsletter) {
      newsletter.name = name;
      forceUpdate(n => n + 1);
    }
  }, []);

  // Update newsletter position
  const updateNewsletterPosition = useCallback((id, position) => {
    const ws = workspaceRef.current;
    const newsletter = ws.newsletters.find(n => n.id === id);
    if (newsletter) {
      newsletter.position = position;
      forceUpdate(n => n + 1);
    }
  }, []);

  // Set active newsletter
  const setActiveNewsletter = useCallback((id) => {
    const ws = workspaceRef.current;
    if (ws.activeNewsletterId !== id) {
      ws.activeNewsletterId = id;
      ws.selectedSectionId = null;
      forceUpdate(n => n + 1);
    }
  }, []);

  // Set selected section
  const setSelectedSection = useCallback((sectionId) => {
    workspaceRef.current.selectedSectionId = sectionId;
    forceUpdate(n => n + 1);
  }, []);

  // Zoom controls - limits match WorkspaceCanvas
  const MIN_ZOOM = 0.1;
  const MAX_ZOOM = 3;
  const ZOOM_STEP = 0.1; // For button zoom
  
  const setZoom = useCallback((zoom) => {
    workspaceRef.current.zoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom));
    forceUpdate(n => n + 1);
  }, []);

  const zoomIn = useCallback(() => {
    const ws = workspaceRef.current;
    ws.zoom = Math.min(MAX_ZOOM, ws.zoom + ZOOM_STEP);
    forceUpdate(n => n + 1);
  }, []);

  const zoomOut = useCallback(() => {
    const ws = workspaceRef.current;
    ws.zoom = Math.max(MIN_ZOOM, ws.zoom - ZOOM_STEP);
    forceUpdate(n => n + 1);
  }, []);

  // Undo/Redo for active newsletter
  const undo = useCallback(() => {
    const ws = workspaceRef.current;
    if (!ws.activeNewsletterId) return;
    
    const history = ws.histories[ws.activeNewsletterId];
    if (history && history.index > 0) {
      history.index--;
      const newsletter = ws.newsletters.find(n => n.id === ws.activeNewsletterId);
      if (newsletter) {
        newsletter.data = JSON.parse(JSON.stringify(history.states[history.index]));
      }
      forceUpdate(n => n + 1);
    }
  }, []);

  const redo = useCallback(() => {
    const ws = workspaceRef.current;
    if (!ws.activeNewsletterId) return;
    
    const history = ws.histories[ws.activeNewsletterId];
    if (history && history.index < history.states.length - 1) {
      history.index++;
      const newsletter = ws.newsletters.find(n => n.id === ws.activeNewsletterId);
      if (newsletter) {
        newsletter.data = JSON.parse(JSON.stringify(history.states[history.index]));
      }
      forceUpdate(n => n + 1);
    }
  }, []);

  // Get full state for saving
  const getFullState = useCallback(() => {
    const ws = workspaceRef.current;
    return {
      newsletters: ws.newsletters,
      zoom: ws.zoom
    };
  }, []);

  // Load state from saved data
  const loadState = useCallback((state) => {
    if (state) {
    const ws = workspaceRef.current;
    ws.newsletters = state.newsletters || [];
    ws.zoom = state.zoom || 1;
    ws.newsletters.forEach(n => {
        ws.histories[n.id] = { states: [JSON.parse(JSON.stringify(n.data))], index: 0 };
    });
    ws.activeNewsletterId = ws.newsletters[0]?.id || null;
    ws.selectedSectionId = null;
    forceUpdate(n => n + 1);
    }
  }, []);

  const ws = workspaceRef.current;
  const activeNewsletter = ws.newsletters.find(n => n.id === ws.activeNewsletterId);
  const activeHistory = ws.activeNewsletterId ? ws.histories[ws.activeNewsletterId] : null;

  return {
    // State
    zoom: ws.zoom,
    newsletters: ws.newsletters,
    activeNewsletterId: ws.activeNewsletterId,
    activeNewsletter: activeNewsletter?.data || null,
    activeNewsletterName: activeNewsletter?.name || null,
    selectedSectionId: ws.selectedSectionId,
    hasClipboard: !!ws.clipboard,
    
    // History state for active newsletter
    canUndo: activeHistory ? activeHistory.index > 0 : false,
    canRedo: activeHistory ? activeHistory.index < activeHistory.states.length - 1 : false,
    
    // Actions
    addNewsletter,
    updateNewsletter,
    updateNewsletterPosition,
    deleteNewsletter,
    renameNewsletter,
    duplicateNewsletter,
    copyNewsletter,
    pasteNewsletter,
    setActiveNewsletter,
    setSelectedSection,
    setZoom,
    zoomIn,
    zoomOut,
    undo,
    redo,
    
    // For autosave
    getFullState,
    loadState
  };
}

export default useWorkspace;
