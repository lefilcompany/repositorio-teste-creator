'use client';

import { useState, useEffect, useCallback } from 'react';
import { Bell, Check, Users, UserPlus, UserX, Clock, Info, AlertTriangle, AlertCircle, BellRing, CheckCheck } from 'lucide-react';
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
import { cn } from '@/lib/utils';

interface Notification {
  id: string;
  message: string;
  type: string;
  read: boolean;
  createdAt: string;
}

export default function   Notifications() {
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
          size="sm"
          className={cn(
            "h-12 w-12 rounded-2xl hover:bg-primary/20 transition-all duration-200 border border-transparent bg-background hover:border-primary/40 hover:shadow-md hover:text-muted-foreground",
            unreadCount > 0 ? "text-primary" : "text-muted-foreground"
          )}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-4 w-4 md:h-5 md:w-5" />
          ) : (
            <Bell className="h-4 w-4 md:h-5 md:w-5" />
          )}
          
          {unreadCount > 0 && (
            <div className="absolute -top-1 -right-1 h-4 w-4 md:h-5 md:w-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center font-bold animate-pulse border-2 border-background">
              {unreadCount > 9 ? '9+' : unreadCount}
            </div>
          )}
          <span className="sr-only">
            Notificações {unreadCount > 0 && `(${unreadCount} não lidas)`}
          </span>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent 
        align="end" 
        className="w-80 md:w-96 max-h-[70vh] overflow-hidden border-border/20 shadow-2xl rounded-xl"
        sideOffset={12}
      >
        {/* Header */}
        <div className="p-4 border-b border-border/20 bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-foreground">Notificações</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  {unreadCount} não lida{unreadCount > 1 ? 's' : ''}
                </p>
              )}
            </div>
            {notifications.length > 0 && unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="text-xs h-7 px-2 hover:bg-primary/10 hover:text-primary"
              >
                <CheckCheck className="h-3 w-3 mr-1" />
                Marcar todas
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-80">
          {isLoading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary border-t-transparent mx-auto mb-3"></div>
              <p className="text-sm text-muted-foreground">Carregando notificações...</p>
            </div>
          ) : notifications.length > 0 ? (
            <div className="divide-y divide-border/20">
              {notifications.map((notification, index) => (
                <div
                  key={notification.id}
                  className={cn(
                    "p-4 transition-all duration-200 hover:bg-muted/30 group cursor-pointer",
                    !notification.read && "bg-primary/5 border-l-4 border-l-primary"
                  )}
                  onClick={() => !notification.read && markAsRead(notification.id)}
                >
                  <div className="flex items-start gap-3">
                    {/* Icon */}
                    <div className={cn(
                      "p-2 rounded-lg flex-shrink-0 mt-0.5",
                      !notification.read ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                    )}>
                      {getNotificationIcon(notification.type)}
                    </div>
                    
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <p className={cn(
                        "text-sm leading-relaxed",
                        !notification.read ? "font-medium text-foreground" : "text-muted-foreground"
                      )}>
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <p className="text-xs text-muted-foreground/70">
                          {formatTime(notification.createdAt)}
                        </p>
                        
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              markAsRead(notification.id);
                            }}
                            className="h-6 px-2 text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-200 hover:bg-primary/10 hover:text-primary"
                          >
                            <Check className="h-3 w-3 mr-1" />
                            Marcar lida
                          </Button>
                        )}
                      </div>
                    </div>
                    
                    {/* Unread indicator */}
                    {!notification.read && (
                      <div className="w-2 h-2 bg-primary rounded-full flex-shrink-0 mt-2"></div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Bell className="h-12 w-12 text-muted-foreground/40 mx-auto mb-4" />
              <p className="text-sm font-medium text-muted-foreground mb-1">Nenhuma notificação</p>
              <p className="text-xs text-muted-foreground/70">
                Você está em dia! Todas as suas notificações foram visualizadas.
              </p>
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Helper function to get notification icon
const getNotificationIcon = (type: string) => {
  switch (type) {
    case 'team_join':
      return <UserPlus className="h-4 w-4" />;
    case 'team_leave':
      return <UserX className="h-4 w-4" />;
    case 'team_update':
      return <Users className="h-4 w-4" />;
    case 'warning':
      return <AlertTriangle className="h-4 w-4" />;
    case 'error':
      return <AlertCircle className="h-4 w-4" />;
    case 'info':
    default:
      return <Info className="h-4 w-4" />;
  }
};
