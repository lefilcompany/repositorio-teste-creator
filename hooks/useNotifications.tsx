"use client";
import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase-browser";

export interface Notification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
  team: {
    id: string;
    name: string;
  };
}

export function useNotifications(userId?: string, teamId?: string) {
  const [items, setItems] = useState<Notification[]>([]);
  const [unread, setUnread] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Buscar notificações iniciais via API (Prisma)
  const fetchNotifications = useCallback(async () => {
    if (!userId || !teamId) return;
    
    setIsLoading(true);
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/notifications?limit=5', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setItems(data.notifications || []);
        setUnread(data.notifications?.filter((n: Notification) => !n.read).length || 0);
      }
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }, [userId, teamId]);

  // Marcar como lida
  const markAsRead = async (id: string) => {
    try {
      const token = localStorage.getItem('authToken');
      if (!token) return;

      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ notificationId: id, markAsRead: true })
      });

      if (response.ok) {
        setItems(prev => 
          prev.map(n => 
            n.id === id ? { ...n, read: true } : n
          )
        );
        setUnread(prev => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  // Marcar todas como lidas
  const markAllAsRead = async () => {
    const unreadItems = items.filter(n => !n.read);
    await Promise.all(unreadItems.map(item => markAsRead(item.id)));
  };

  useEffect(() => {
    if (!userId || !teamId) return;

    // Carregar notificações iniciais
    fetchNotifications();

    // Configurar Realtime para novas notificações
    const channel = supabase
      .channel(`notifications:${userId}`)
      .on("postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          const newNotification = payload.new as any;
          
          // Converter formato do Supabase para nosso formato
          const notification: Notification = {
            id: newNotification.id,
            message: newNotification.message,
            type: newNotification.type,
            read: !!newNotification.read_at,
            createdAt: newNotification.created_at,
            team: {
              id: teamId,
              name: newNotification.team_name || 'Equipe'
            }
          };

          // Adicionar nova notificação no topo
          setItems(prev => [notification, ...prev.slice(0, 4)]); // Manter apenas 5
          setUnread(prev => prev + 1);

          // Notificação nativa do navegador (se permitido)
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification(notification.message, { 
              body: notification.type,
              icon: '/assets/logoCreatorPreta.png'
            });
          }

          // Som de notificação (opcional)
          try {
            const audio = new Audio('/notification.mp3');
            audio.play().catch(() => {}); // Ignorar erros de autoplay
          } catch {}
        }
      )
      .subscribe();

    // Fallback polling: caso o Realtime falhe ou esteja indisponível,
    // garantimos que novas notificações sejam carregadas periodicamente
    // sem a necessidade de refresh manual da página.
    const interval = setInterval(() => {
      fetchNotifications();
    }, 15000); // 15s

    return () => {
      supabase.removeChannel(channel);
      clearInterval(interval);
    };
  }, [userId, teamId, fetchNotifications]);

  return { 
    items, 
    unread, 
    isLoading, 
    markAsRead, 
    markAllAsRead,
    refetch: fetchNotifications 
  };
}
