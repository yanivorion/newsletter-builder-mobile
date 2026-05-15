import { useState, useCallback, useRef } from 'react';

const MAX_HISTORY_SIZE = 50;

export function useHistory(initialState) {
  const [, forceUpdate] = useState(0);
  const historyRef = useRef({
    states: [initialState],
    index: 0
  });

  const getState = () => historyRef.current.states[historyRef.current.index];

  const setState = useCallback((newStateOrUpdater) => {
    const h = historyRef.current;
    const prevState = h.states[h.index];
    const newState = typeof newStateOrUpdater === 'function' 
      ? newStateOrUpdater(prevState)
      : newStateOrUpdater;
    
    // Don't add to history if state hasn't changed
    if (newState === prevState) {
      return;
    }

    // Remove any future history (redo states)
    h.states = h.states.slice(0, h.index + 1);
    
    // Add new state
    h.states.push(newState);
    
    // Limit history size
    if (h.states.length > MAX_HISTORY_SIZE) {
      h.states.shift();
    } else {
      h.index++;
    }
    
    forceUpdate(n => n + 1);
  }, []);

  const undo = useCallback(() => {
    const h = historyRef.current;
    if (h.index > 0) {
      h.index--;
      forceUpdate(n => n + 1);
    }
  }, []);

  const redo = useCallback(() => {
    const h = historyRef.current;
    if (h.index < h.states.length - 1) {
      h.index++;
      forceUpdate(n => n + 1);
    }
  }, []);

  const reset = useCallback((newInitialState) => {
    historyRef.current = {
      states: [newInitialState],
      index: 0
    };
    forceUpdate(n => n + 1);
  }, []);

  const h = historyRef.current;
  
  return {
    state: getState(),
    setState,
    undo,
    redo,
    canUndo: h.index > 0,
    canRedo: h.index < h.states.length - 1,
    reset,
    historyLength: h.states.length,
    currentIndex: h.index
  };
}

export default useHistory;
