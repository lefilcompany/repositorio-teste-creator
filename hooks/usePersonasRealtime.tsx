"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { Persona } from "@/types/persona";

export function usePersonasRealtime(teamId?: string) {
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    supabase
      .from("personas")
      .select("*")
      .eq("team_id", teamId)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setPersonas(data || []);
        setLoading(false);
      });
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;
    const channel = supabase
      .channel(`personas:team:${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "personas", filter: `team_id=eq.${teamId}` },
        (payload) => {
          setPersonas((prev) => {
            if (payload.eventType === "INSERT") {
              return [...prev, payload.new as Persona];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((p) => (p.id === payload.new.id ? (payload.new as Persona) : p));
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((p) => p.id !== payload.old.id);
            }
            return prev;
          });
        }
      );
    channel.subscribe();
    return () => {
      channel.unsubscribe();
    };
  }, [teamId]);

  return { personas, loading, error };
}
