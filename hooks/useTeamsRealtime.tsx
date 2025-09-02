"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { Team } from "@/types/team";

export function useTeamsRealtime(userId?: string) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeams = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const res = await fetch(`/api/teams?userId=${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        const data: Team[] = await res.json();
        setTeams(data);
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Failed to fetch teams");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch teams");
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchTeams();
  }, [fetchTeams]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`teams:user:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams", filter: `members=cs.{${userId}}` },
        fetchTeams
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchTeams]);

  return { teams, loading, error, refetch: fetchTeams };
}

