"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { Brand } from "@/types/brand";

export function useBrandsRealtime(teamId?: string) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Busca inicial
  useEffect(() => {
    if (!teamId) return;
    setLoading(true);
    supabase
      .from("brands")
      .select("*")
      .eq("team_id", teamId)
      .then(({ data, error }) => {
        if (error) setError(error.message);
        else setBrands(data || []);
        setLoading(false);
      });
  }, [teamId]);

  // Realtime subscribe
  useEffect(() => {
    if (!teamId) return;
    const channel = supabase
      .channel(`brands:team:${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brands", filter: `team_id=eq.${teamId}` },
        (payload) => {
          setBrands((prev) => {
            if (payload.eventType === "INSERT") {
              return [...prev, payload.new as Brand];
            }
            if (payload.eventType === "UPDATE") {
              return prev.map((b) => (b.id === payload.new.id ? (payload.new as Brand) : b));
            }
            if (payload.eventType === "DELETE") {
              return prev.filter((b) => b.id !== payload.old.id);
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

  return { brands, loading, error };
}
