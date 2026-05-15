// Drop-in replacement for `next/navigation` in this Vite SPA.
// Implements just the bits the editor uses: useRouter().push(), .replace(), .back().
// Routes are encoded in the URL hash so the SPA works as a single-page app
// without server-side routing rules.
//
//   `useRouter()` returns { push, replace, back, refresh, hash }.
//
// Use `useHashRoute()` in the app shell to read the current route as
// { name, id } so you can branch the UI.

import { useEffect, useState } from 'react';

function parseHash() {
  if (typeof window === 'undefined') return { name: 'home', id: null };
  const h = (window.location.hash || '').replace(/^#/, '');
  if (!h || h === '/' || h === '') return { name: 'home', id: null };
  // Accept things like /editor/abc, editor/abc, /dashboard/editor/abc
  const parts = h.replace(/^\/+/, '').split('/').filter(Boolean);
  // strip leading 'dashboard' if present (legacy paths)
  if (parts[0] === 'dashboard') parts.shift();
  if (!parts.length) return { name: 'home', id: null };
  if (parts[0] === 'editor') return { name: 'editor', id: parts[1] ?? 'new' };
  return { name: parts[0], id: parts[1] ?? null };
}

function pathToHash(path) {
  if (!path) return '#/';
  if (path.startsWith('#')) return path;
  // Convert "/dashboard/editor/abc" → "#/editor/abc"
  let p = path.replace(/^\/+/, '/');
  p = p.replace(/^\/dashboard/, '');
  if (!p.startsWith('/')) p = '/' + p;
  return '#' + p;
}

export function useRouter() {
  return {
    push(path) {
      window.location.hash = pathToHash(path);
    },
    replace(path) {
      const newHash = pathToHash(path);
      const url = window.location.pathname + window.location.search + newHash;
      window.history.replaceState(null, '', url);
      // Force listeners (notably useHashRoute) to react to the change.
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    },
    back() {
      window.history.back();
    },
    refresh() {
      window.dispatchEvent(new HashChangeEvent('hashchange'));
    },
  };
}

export function useHashRoute() {
  const [route, setRoute] = useState(parseHash);
  useEffect(() => {
    const handler = () => setRoute(parseHash());
    window.addEventListener('hashchange', handler);
    return () => window.removeEventListener('hashchange', handler);
  }, []);
  return route;
}

export function navigate(path) {
  window.location.hash = pathToHash(path);
}
