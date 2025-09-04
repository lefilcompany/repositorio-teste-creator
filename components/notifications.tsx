'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Users, UserPlus, UserX, Clock, Info, AlertTriangle, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/hooks/useAuth';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { toast } from 'sonner';

interface Notification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function Notifications() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Carregar notificações via API
  const loadNotifications = useCallback(async () => {
    if (!user?.id || !user?.teamId) {
      console.log('User not ready for notifications:', { 
        userId: user?.id, 
        teamId: user?.teamId, 
        userExists: !!user 
      });
      // Limpar notificações se o usuário não tem equipe
      setNotifications([]);
      setUnreadCount(0);
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log('Loading notifications for:', { userId: user.id, teamId: user.teamId });
      
      const response = await fetch(`/api/notifications?teamId=${user.teamId}&userId=${user.id}`);
      const data = await response.json();
      
      if (response.ok) {
        const notificationsList = data.notifications || [];
        setNotifications(notificationsList);
        setUnreadCount(notificationsList.filter((n: Notification) => !n.read).length);
        console.log(`Loaded ${notificationsList.length} notifications`);
      } else {
        console.error('API error response:', data);
        toast.error(data.error || 'Erro ao carregar notificações');
        // Em caso de erro, definir arrays vazios para evitar estados inconsistentes
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error('Erro ao carregar notificações:', error);
      toast.error('Erro de conexão ao carregar notificações');
      // Em caso de erro, definir arrays vazios para evitar estados inconsistentes
      setNotifications([]);
      setUnreadCount(0);
    } finally {
      setIsLoading(false);
    }
  }, [user?.id, user?.teamId]);

  // Marcar notificação como lida
  const markAsRead = useCallback(async (notificationId: string) => {
    if (!user?.id || !user?.teamId) {
      console.log('Cannot mark as read - user not ready:', { userId: user?.id, teamId: user?.teamId });
      return;
    }
    
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          teamId: user.teamId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setNotifications(prev => 
          prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
        toast.success('Notificação marcada como lida');
      } else {
        console.error('Error marking as read:', data);
        toast.error(data.error || 'Erro ao marcar notificação como lida');
      }
    } catch (error) {
      console.error('Erro ao marcar notificação como lida:', error);
      toast.error('Erro de conexão ao marcar notificação como lida');
    }
  }, [user?.id, user?.teamId]);

  // Marcar todas como lidas
  const markAllAsRead = useCallback(async () => {
    if (!user?.id || !user?.teamId) {
      console.log('Cannot mark all as read - user not ready:', { userId: user?.id, teamId: user?.teamId });
      return;
    }
    
    try {
      const response = await fetch('/api/notifications/read-all', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          teamId: user.teamId
        })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
        toast.success('Todas as notificações foram marcadas como lidas');
      } else {
        console.error('Error marking all as read:', data);
        toast.error(data.error || 'Erro ao marcar todas como lidas');
      }
    } catch (error) {
      console.error('Erro ao marcar todas como lidas:', error);
      toast.error('Erro de conexão ao marcar todas como lidas');
    }
  }, [user?.id, user?.teamId]);

  // Carregar notificações quando o usuário estiver disponível
  useEffect(() => {
    if (user?.id && user?.teamId) {
      loadNotifications();
    }
  }, [loadNotifications]);

  // Recarregar notificações quando o dropdown for aberto
  useEffect(() => {
    if (isOpen && user?.id && user?.teamId) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Solicitar permissão para notificações nativas
  useEffect(() => {
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  }, []);



  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'TEAM_JOIN_REQUEST':
        return <UserPlus className="h-4 w-4 text-blue-500" />;
      case 'TEAM_JOIN_APPROVED':
        return <Users className="h-4 w-4 text-green-500" />;
      case 'TEAM_JOIN_REJECTED':
        return <UserX className="h-4 w-4 text-red-500" />;
      case 'SYSTEM':
        return <Bell className="h-4 w-4 text-blue-500" />;
      case 'INFO':
        return <Info className="h-4 w-4 text-blue-500" />;
      case 'WARNING':
        return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'ERROR':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatTime = (dateString: string) => {
    try {
      return formatDistanceToNow(new Date(dateString), { 
        addSuffix: true, 
        locale: ptBR 
      });
    } catch {
      return 'há pouco tempo';
    }
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button
          id="topbar-notifications"
          variant="ghost"
          size="icon"
          className="rounded-2xl h-12 w-12 hover:bg-primary/20 transition-all duration-200 border border-transparent bg-background hover:border-primary/40 hover:shadow-md relative"
        >
          <Bell className="h-5 w-5 text-muted-foreground transition-colors duration-200" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-medium animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">Notificações</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-80 max-h-96 overflow-y-auto border-border/20 shadow-xl"
        sideOffset={8}
      >
        <div className="p-3 border-b border-border/20">
          <h3 className="font-semibold text-foreground">Notificações</h3>
          {unreadCount > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
            </p>
          )}
        </div>

        {isLoading ? (
          <div className="p-6 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
            <p className="text-sm text-muted-foreground mt-2">Carregando...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="py-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-4 border-b border-border/30 last:border-b-0 ${
                  !notification.read ? 'bg-muted/30' : ''
                }`}
              >
                <div className="flex items-start gap-3 w-full">
                  <div className="flex-shrink-0 mt-0.5">
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm leading-relaxed ${!notification.read ? 'font-medium' : ''}`}>
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            markAsRead(notification.id);
                          }}
                          className="flex-shrink-0 p-1 hover:bg-primary/10 rounded transition-colors"
                          title="Marcar como lida"
                        >
                          <Check className="h-3 w-3 text-primary" />
                        </button>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-2">
                      <Clock className="h-3 w-3 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {formatTime(notification.createdAt)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center">
            <Bell className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            {!user?.teamId ? (
              <>
                <p className="text-muted-foreground">Sem notificações</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Entre em uma equipe para receber notificações
                </p>
              </>
            ) : (
              <>
                <p className="text-muted-foreground">Nenhuma notificação</p>
                <p className="text-sm text-muted-foreground/70 mt-1">
                  Você será notificado sobre atividades da equipe
                </p>
              </>
            )}
          </div>
        )}

                 {notifications.length > 0 && (
           <>
             <DropdownMenuSeparator />
             <div className="p-3">
               <button
                 onClick={markAllAsRead}
                 className="text-sm text-primary hover:text-primary/80 transition-colors w-full text-left"
               >
                 Marcar todas como lidas
               </button>
             </div>
           </>
         )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
