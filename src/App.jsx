import React from 'react';
import { useHashRoute } from '@/lib/router-shim';
import Dashboard from '@/pages/Dashboard';
import EditorPage from '@/pages/EditorPage';

export default function App() {
  const route = useHashRoute();

  return (
    <div className="mobile-app-root">
      <div className="mobile-app-frame">
        {route.name === 'editor' ? (
          <EditorPage id={route.id || 'new'} key={route.id || 'new'} />
        ) : (
          <Dashboard />
        )}
      </div>
    </div>
  );
}
