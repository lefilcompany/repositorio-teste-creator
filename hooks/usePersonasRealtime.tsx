"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { Persona } from "@/types/persona";

export function usePersonasRealtime(teamId?: string) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPersonas = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const res = await fetch(`/api/personas?teamId=${teamId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        const data: Persona[] = await res.json();
        setPersonas(data);
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Failed to fetch personas");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch personas");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchPersonas();
  }, [fetchPersonas]);

  useEffect(() => {
    if (!teamId) return;
    const channel = supabase
      .channel(`personas:team:${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "personas", filter: `team_id=eq.${teamId}` },
        fetchPersonas
      )
      .subscribe();
    const interval = setInterval(() => {
      fetchPersonas();
    }, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [teamId, fetchPersonas]);

  return { personas, loading, error, refetch: fetchPersonas };
}

