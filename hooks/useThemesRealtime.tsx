"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { StrategicTheme } from "@/types/theme";

export function useThemesRealtime(teamId?: string) {
  const [themes, setThemes] = useState<StrategicTheme[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchThemes = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const res = await fetch(`/api/themes?teamId=${teamId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        const data: StrategicTheme[] = await res.json();
        setThemes(data);
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Failed to fetch themes");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch themes");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchThemes();
  }, [fetchThemes]);

  useEffect(() => {
    if (!teamId) return;
    const channel = supabase
      .channel(`themes:team:${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "themes", filter: `team_id=eq.${teamId}` },
        fetchThemes
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, fetchThemes]);

  return { themes, loading, error, refetch: fetchThemes };
}

