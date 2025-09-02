"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { Action } from "@/types/action";

interface Options {
  userId?: string;
  status?: string;
  type?: string;
  approved?: boolean;
  limit?: number;
}

export function useActionsRealtime(teamId?: string, options: Options = {}) {
  const [actions, setActions] = useState<Action[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActions = useCallback(async () => {
    if (!teamId) return;
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ teamId });
      if (options.userId) params.append("userId", options.userId);
      if (options.status) params.append("status", options.status);
      if (options.type) params.append("type", options.type);
      if (options.approved !== undefined) {
        params.append("approved", String(options.approved));
      }
      if (options.limit) params.append("limit", String(options.limit));
      const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
      const res = await fetch(`/api/actions?${params.toString()}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : undefined,
      });
      if (res.ok) {
        const data: Action[] = await res.json();
        setActions(data);
      } else {
        const json = await res.json().catch(() => ({}));
        setError(json.error || "Failed to fetch actions");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch actions");
    } finally {
      setLoading(false);
    }
  }, [teamId, options.userId, options.status, options.type, options.approved, options.limit]);

  useEffect(() => {
    fetchActions();
  }, [fetchActions]);

  useEffect(() => {
    if (!teamId) return;
    const channel = supabase
      .channel(`actions:team:${teamId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "actions", filter: `team_id=eq.${teamId}` },
        async (payload) => {
          if (payload.eventType === "DELETE") {
            setActions((prev) => prev.filter((a) => a.id !== (payload.old as any).id));
            return;
          }
          const id = (payload.new as any).id;
          try {
            const token = typeof window !== "undefined" ? localStorage.getItem("authToken") : null;
            const res = await fetch(`/api/actions/${id}?teamId=${teamId}`, {
              headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            });
            if (res.ok) {
              const action: Action = await res.json();
              setActions((prev) => {
                const index = prev.findIndex((a) => a.id === action.id);
                if (index === -1) {
                  return [action, ...prev];
                }
                const updated = [...prev];
                updated[index] = action;
                return updated;
              });
            }
          } catch {}
        }
      )
      .subscribe();
    const interval = setInterval(() => {
      fetchActions();
    }, 15000);
    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [teamId, fetchActions]);

  return { actions, loading, error, refetch: fetchActions };
}

