// Base44-backed newsletter storage.
//
// Same external API as the original Supabase/localStorage version so the
// editor doesn't need to change:
//   { newsletters, saveNewsletter, loadNewsletter, deleteNewsletter,
//     exportAsJSON, importFromJSON, loading, error, refetch }
//
// Internally each newsletter is one row of the `Newsletter` entity.
// The full editor state (sections, pageSettings, …) lives in entity.state.
// We expose it via the same `data` field the editor expects.

import { useCallback, useEffect, useState } from 'react';
import { base44 } from '@/api/base44Client';

const Newsletter = base44.entities.Newsletter;

function entityToRow(item) {
  if (!item) return null;
  const state = item.state || {};
  return {
    id: item.id,
    name: item.name,
    updatedAt: item.updated_date || item.updatedAt || null,
    createdAt: item.created_date || item.createdAt || null,
    data: {
      ...state,
      name: item.name,
      projectId: item.id,
    },
  };
}

export function useNewsletterStorage(_userId) {
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNewsletters = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await Newsletter.list('-updated_date');
      setNewsletters(list.map(entityToRow));
    } catch (err) {
      setError(err?.message ?? String(err));
      setNewsletters([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNewsletters();
  }, [fetchNewsletters]);

  const saveNewsletter = useCallback(
    async (newsletterData) => {
      const name = newsletterData.name || 'Untitled Newsletter';
      const id = newsletterData.projectId || newsletterData.id;
      const isUpdate = id && /^[a-f0-9]{20,}$/i.test(String(id));

      const state = {
        sections: newsletterData.sections || [],
        pageSettings: newsletterData.pageSettings || {},
      };

      try {
        let saved;
        if (isUpdate) {
          saved = await Newsletter.update(id, { name, state });
        } else {
          saved = await Newsletter.create({
            name,
            description: newsletterData.description || '',
            state,
          });
        }
        await fetchNewsletters();
        return entityToRow(saved);
      } catch (err) {
        setError(err?.message ?? String(err));
        throw err;
      }
    },
    [fetchNewsletters]
  );

  const loadNewsletter = useCallback(async (id) => {
    if (!id) return null;
    try {
      const entity = await Newsletter.get(id);
      return entityToRow(entity)?.data || null;
    } catch (err) {
      setError(err?.message ?? String(err));
      return null;
    }
  }, []);

  const deleteNewsletter = useCallback(
    async (id) => {
      try {
        await Newsletter.delete(id);
        await fetchNewsletters();
      } catch (err) {
        setError(err?.message ?? String(err));
        throw err;
      }
    },
    [fetchNewsletters]
  );

  const exportAsJSON = useCallback((newsletter) => {
    const data = {
      version: '1.0',
      exportedAt: new Date().toISOString(),
      newsletter,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${newsletter?.name || 'newsletter'}-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, []);

  const importFromJSON = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target.result);
          const nl = parsed.newsletter || parsed;
          if (!nl.sections || !Array.isArray(nl.sections)) {
            throw new Error('Invalid newsletter format: missing sections array');
          }
          resolve({
            ...nl,
            projectId: nl.projectId || `import-${Date.now()}`,
            name: nl.name || 'Imported Newsletter',
            importedAt: new Date().toISOString(),
          });
        } catch (err) {
          reject(new Error(`Failed to parse JSON: ${err.message}`));
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }, []);

  return {
    newsletters,
    saveNewsletter,
    loadNewsletter,
    deleteNewsletter,
    exportAsJSON,
    importFromJSON,
    loading,
    error,
    refetch: fetchNewsletters,
  };
}

export default useNewsletterStorage;
