"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

import type { StrategicTheme } from "@/types/theme";


export function useThemesRealtime(teamId?: string) {
  const [themes, setThemes] = useState<StrategicTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    supabase
      .from("themes")
      .select("*")
      .eq("team_id", teamId)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setThemes(data || []);
        setLoading(false);
      });
  }, [teamId]);

  useEffect(() => {
    if (!teamId) return;
    const channel = supabase
      .channel(`themes:team:${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "themes", filter: `team_id=eq.${teamId}` },
        (payload) => {
          setThemes((prev) => {
            if (payload.eventType === "INSERT") {
              return [...prev, payload.new as StrategicTheme];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((t) => (t.id === payload.new.id ? (payload.new as StrategicTheme) : t));
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((t) => t.id !== payload.old.id);
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

  return { themes, loading, error };
}
