"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { Brand } from "@/types/brand";

export function useBrandsRealtime(teamId?: string) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBrands = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const res = await fetch(`/api/brands?teamId=${teamId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        const data: Brand[] = await res.json();
        setBrands(data);
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Failed to fetch brands");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch brands");
    } finally {
      setLoading(false);
    }
  }, [teamId]);

  useEffect(() => {
    fetchBrands();
  }, [fetchBrands]);

  useEffect(() => {
    if (!teamId) return;
    const channel = supabase
      .channel(`brands:team:${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "brands", filter: `team_id=eq.${teamId}` },
        fetchBrands
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [teamId, fetchBrands]);

  return { brands, loading, error, refetch: fetchBrands };
}

