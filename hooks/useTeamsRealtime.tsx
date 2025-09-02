"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { Team } from "@/types/team";

export function useTeamsRealtime(userId?: string) {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    supabase
      .from("teams")
      .select("*")
      .contains("members", [userId])
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setTeams(data || []);
        setLoading(false);
      });
  }, [userId]);

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`teams:user:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "teams", filter: `members=cs.{${userId}}` },
        (payload) => {
          setTeams((prev) => {
            if (payload.eventType === "INSERT") {
              return [...prev, payload.new as Team];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((t) => (t.id === payload.new.id ? (payload.new as Team) : t));
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
  }, [userId]);

  return { teams, loading, error };
}
