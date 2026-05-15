import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '@/App.jsx';
import '@/index.css';
import { installApiShim } from '@/lib/api-shim';
import { AuthProvider } from '@/context/AuthContext';
import { ThemeProvider } from '@/context/ThemeContext';
import { ClipboardProvider } from '@/context/ClipboardContext';

installApiShim();

// StrictMode is intentionally OFF: the editor relies on heavy DOM-side effects
// (html2canvas clones, canvas-based GIF encoding, clipboard selection ranges)
// that don't tolerate React's double-mount in dev. Production already runs once,
// but we want consistent behavior end-to-end.
ReactDOM.createRoot(document.getElementById('root')).render(
  <AuthProvider>
    <ThemeProvider>
      <ClipboardProvider>
        <App />
      </ClipboardProvider>
    </ThemeProvider>
  </AuthProvider>
);
