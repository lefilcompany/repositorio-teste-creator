// hooks/useTemporaryContent.tsx
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import type { TemporaryContent } from '@/types/temporaryContent';

export function useTemporaryContent() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const saveTemporaryContent = useCallback(async (contentData: {
    actionId: string;
    imageUrl: string;
    title: string;
    body: string;
    hashtags: string[];
    brand?: string;
    theme?: string;
    originalId?: string;
    revisions?: number;
  }): Promise<TemporaryContent | null> => {
    if (!user?.id || !user?.teamId) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/temporary-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user.id,
          teamId: user.teamId,
          ...contentData
        })
      });

      if (!response.ok) {
        throw new Error('Failed to save temporary content');
      }

      const savedContent = await response.json();
      return savedContent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const getTemporaryContent = useCallback(async (): Promise<TemporaryContent | null> => {
    if (!user?.id || !user?.teamId) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/temporary-content?userId=${user.id}&teamId=${user.teamId}`);

      if (!response.ok) {
        throw new Error('Failed to fetch temporary content');
      }

      const content = await response.json();
      return content || null;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const updateTemporaryContent = useCallback(async (
    contentId: string,
    updates: {
      imageUrl?: string;
      title?: string;
      body?: string;
      hashtags?: string[];
      revisions?: number;
    }
  ): Promise<TemporaryContent | null> => {
    if (!user?.id || !user?.teamId) {
      setError('User not authenticated');
      return null;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/temporary-content', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: contentId,
          userId: user.id,
          teamId: user.teamId,
          ...updates
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update temporary content');
      }

      const updatedContent = await response.json();
      return updatedContent;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return null;
    } finally {
      setLoading(false);
    }
  }, [user]);

  const deleteTemporaryContent = useCallback(async (contentId: string): Promise<boolean> => {
    if (!user?.id || !user?.teamId) {
      setError('User not authenticated');
      return false;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/temporary-content?id=${contentId}&userId=${user.id}&teamId=${user.teamId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error('Failed to delete temporary content');
      }

      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      return false;
    } finally {
      setLoading(false);
    }
  }, [user]);

  return {
    saveTemporaryContent,
    getTemporaryContent,
    updateTemporaryContent,
    deleteTemporaryContent,
    loading,
    error
  };
}
