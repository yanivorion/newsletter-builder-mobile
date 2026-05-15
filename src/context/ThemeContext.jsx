import React, { createContext, useContext, useState, useCallback } from 'react';
import { electreonTheme, defaultTheme, getThemeColors, getThemeGradients } from '../lib/theme';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [isElectreonTheme, setIsElectreonTheme] = useState(true);
  const [customColors, setCustomColors] = useState([]);
  const [customGradients, setCustomGradients] = useState([]);

  const currentTheme = isElectreonTheme ? electreonTheme : defaultTheme;

  const toggleTheme = useCallback(() => {
    setIsElectreonTheme(prev => !prev);
  }, []);

  const connectTheme = useCallback(() => {
    setIsElectreonTheme(true);
  }, []);

  const disconnectTheme = useCallback(() => {
    setIsElectreonTheme(false);
  }, []);

  const addCustomColor = useCallback((color) => {
    setCustomColors(prev => [...prev, { id: `custom-${Date.now()}`, ...color }]);
  }, []);

  const removeCustomColor = useCallback((id) => {
    setCustomColors(prev => prev.filter(c => c.id !== id));
  }, []);

  const addCustomGradient = useCallback((gradient) => {
    setCustomGradients(prev => [...prev, { id: `gradient-${Date.now()}`, ...gradient }]);
  }, []);

  const removeCustomGradient = useCallback((id) => {
    setCustomGradients(prev => prev.filter(g => g.id !== id));
  }, []);

  const getAllColors = useCallback(() => {
    const themeColors = getThemeColors(currentTheme);
    return [...themeColors, ...customColors];
  }, [currentTheme, customColors]);

  const getAllGradients = useCallback(() => {
    const themeGradients = getThemeGradients(currentTheme);
    return [...themeGradients, ...customGradients];
  }, [currentTheme, customGradients]);

  const value = {
    currentTheme,
    isElectreonTheme,
    toggleTheme,
    connectTheme,
    disconnectTheme,
    customColors,
    customGradients,
    addCustomColor,
    removeCustomColor,
    addCustomGradient,
    removeCustomGradient,
    getAllColors,
    getAllGradients,
    electreonTheme,
    defaultTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

