import { useState, useEffect, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

/**
 * Hook for managing newsletters with Supabase
 */
export function useNewsletters() {
  const { user, isAuthenticated } = useAuth();
  const [newsletters, setNewsletters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all newsletters for current user
  const fetchNewsletters = useCallback(async () => {
    if (!isSupabaseConfigured() || !user) {
      setLoading(false);
      return [];
    }

    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;

      setNewsletters(data || []);
      return data || [];
    } catch (err) {
      console.error('Error fetching newsletters:', err);
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Fetch single newsletter by ID
  const fetchNewsletter = useCallback(async (id) => {
    if (!isSupabaseConfigured() || !user) return null;

    try {
      const { data, error } = await supabase
        .from('newsletters')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error fetching newsletter:', err);
      setError(err.message);
      return null;
    }
  }, [user]);

  // Create new newsletter
  const createNewsletter = useCallback(async (newsletterData) => {
    if (!isSupabaseConfigured() || !user) {
      throw new Error('Not authenticated');
    }

    try {
      setError(null);

      const newNewsletter = {
        user_id: user.id,
        name: newsletterData.name || 'Untitled Newsletter',
        description: newsletterData.description || '',
        sections: newsletterData.sections || [],
        settings: newsletterData.settings || {},
        is_template: false,
        is_public: false
      };

      const { data, error } = await supabase
        .from('newsletters')
        .insert([newNewsletter])
        .select()
        .single();

      if (error) throw error;

      setNewsletters(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error creating newsletter:', err);
      setError(err.message);
      throw err;
    }
  }, [user]);

  // Update newsletter
  const updateNewsletter = useCallback(async (id, updates) => {
    if (!isSupabaseConfigured() || !user) {
      throw new Error('Not authenticated');
    }

    try {
      setError(null);

      const { data, error } = await supabase
        .from('newsletters')
        .update(updates)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      setNewsletters(prev => 
        prev.map(n => n.id === id ? data : n)
      );

      return data;
    } catch (err) {
      console.error('Error updating newsletter:', err);
      setError(err.message);
      throw err;
    }
  }, [user]);

  // Update newsletter sections (optimized for frequent updates)
  const updateSections = useCallback(async (id, sections) => {
    return updateNewsletter(id, { sections });
  }, [updateNewsletter]);

  // Rename newsletter
  const renameNewsletter = useCallback(async (id, name) => {
    return updateNewsletter(id, { name });
  }, [updateNewsletter]);

  // Delete newsletter
  const deleteNewsletter = useCallback(async (id) => {
    if (!isSupabaseConfigured() || !user) {
      throw new Error('Not authenticated');
    }

    try {
      setError(null);

      const { error } = await supabase
        .from('newsletters')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setNewsletters(prev => prev.filter(n => n.id !== id));
      return true;
    } catch (err) {
      console.error('Error deleting newsletter:', err);
      setError(err.message);
      throw err;
    }
  }, [user]);

  // Duplicate newsletter
  const duplicateNewsletter = useCallback(async (id) => {
    if (!isSupabaseConfigured() || !user) {
      throw new Error('Not authenticated');
    }

    try {
      setError(null);

      // Fetch the original
      const original = await fetchNewsletter(id);
      if (!original) throw new Error('Newsletter not found');

      // Create duplicate
      const duplicate = {
        user_id: user.id,
        name: `${original.name} (Copy)`,
        description: original.description,
        sections: original.sections,
        settings: original.settings,
        is_template: false,
        is_public: false
      };

      const { data, error } = await supabase
        .from('newsletters')
        .insert([duplicate])
        .select()
        .single();

      if (error) throw error;

      setNewsletters(prev => [data, ...prev]);
      return data;
    } catch (err) {
      console.error('Error duplicating newsletter:', err);
      setError(err.message);
      throw err;
    }
  }, [user, fetchNewsletter]);

  // Save newsletter history (for undo/versioning)
  const saveHistory = useCallback(async (newsletterId, sections, settings) => {
    if (!isSupabaseConfigured() || !user) return null;

    try {
      // Get current version
      const { data: versions } = await supabase
        .from('newsletter_history')
        .select('version')
        .eq('newsletter_id', newsletterId)
        .order('version', { ascending: false })
        .limit(1);

      const newVersion = versions?.length > 0 ? versions[0].version + 1 : 1;

      const { data, error } = await supabase
        .from('newsletter_history')
        .insert([{
          newsletter_id: newsletterId,
          user_id: user.id,
          sections,
          settings,
          version: newVersion
        }])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (err) {
      console.error('Error saving history:', err);
      return null;
    }
  }, [user]);

  // Fetch newsletter history
  const fetchHistory = useCallback(async (newsletterId, limit = 50) => {
    if (!isSupabaseConfigured() || !user) return [];

    try {
      const { data, error } = await supabase
        .from('newsletter_history')
        .select('*')
        .eq('newsletter_id', newsletterId)
        .order('version', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Error fetching history:', err);
      return [];
    }
  }, [user]);

  // Restore from history
  const restoreFromHistory = useCallback(async (newsletterId, historyId) => {
    if (!isSupabaseConfigured() || !user) {
      throw new Error('Not authenticated');
    }

    try {
      // Fetch history entry
      const { data: history, error: historyError } = await supabase
        .from('newsletter_history')
        .select('*')
        .eq('id', historyId)
        .single();

      if (historyError) throw historyError;

      // Update newsletter with history
      return updateNewsletter(newsletterId, {
        sections: history.sections,
        settings: history.settings
      });
    } catch (err) {
      console.error('Error restoring from history:', err);
      throw err;
    }
  }, [user, updateNewsletter]);

  // Initial fetch
  useEffect(() => {
    if (isAuthenticated) {
      fetchNewsletters();
    } else {
      setNewsletters([]);
      setLoading(false);
    }
  }, [isAuthenticated, fetchNewsletters]);

  // Real-time subscription for updates
  useEffect(() => {
    if (!isSupabaseConfigured() || !user) return;

    const subscription = supabase
      .channel('newsletters-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'newsletters',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Newsletter change:', payload);
          
          if (payload.eventType === 'INSERT') {
            setNewsletters(prev => [payload.new, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setNewsletters(prev => 
              prev.map(n => n.id === payload.new.id ? payload.new : n)
            );
          } else if (payload.eventType === 'DELETE') {
            setNewsletters(prev => 
              prev.filter(n => n.id !== payload.old.id)
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  return {
    newsletters,
    loading,
    error,
    fetchNewsletters,
    fetchNewsletter,
    createNewsletter,
    updateNewsletter,
    updateSections,
    renameNewsletter,
    deleteNewsletter,
    duplicateNewsletter,
    saveHistory,
    fetchHistory,
    restoreFromHistory
  };
}

export default useNewsletters;


