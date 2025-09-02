"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { Team } from "@/types/team";

export function useTeamRealtime(teamId?: string) {
  const [team, setTeam] = useState<Team | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTeam = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const res = await fetch(`/api/teams/${teamId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        const data: Team = await res.json();
        setTeam(data);
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Failed to fetch team");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch team");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchTeam();
  }, [fetchTeam]);

  useEffect(() => {
    if (!teamId) return;
    const channel = supabase
      .channel(`team:${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams", filter: `id=eq.${teamId}` },
        fetchTeam
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "join_requests", filter: `team_id=eq.${teamId}` },
        fetchTeam
      )
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "users", filter: `team_id=eq.${teamId}` },
        fetchTeam
      )
      .subscribe();
    const interval = setInterval(() => {
      fetchTeam();
    }, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [teamId, fetchTeam]);

  return { team, loading, error, refetch: fetchTeam };
}