'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Bell, X, FileText, Calendar, Mail, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id?: string;
  type: 'new_quote' | 'upcoming_event' | 'email_opened' | 'connected' | 'heartbeat' | 'error';
  title?: string;
  message: string;
  data?: Record<string, unknown>;
  timestamp: string;
  priority?: 'low' | 'normal' | 'high';
  read?: boolean;
}

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Conectar a Server-Sent Events
    const connectToNotifications = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      const eventSource = new EventSource('/api/notifications/stream');
      eventSourceRef.current = eventSource;

      eventSource.onopen = () => {
        // console.log('🔔 Conectado al sistema de notificaciones');
        setIsConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const notification: Notification = JSON.parse(event.data);
          
          // Filtrar heartbeats y mensajes de conexión
          if (notification.type === 'heartbeat' || notification.type === 'connected') {
            return;
          }

          // Agregar ID único y marcar como no leída
          const notificationWithId = {
            ...notification,
            id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
            read: false
          };

          setNotifications(prev => {
            // Evitar duplicados
            const exists = prev.some(n => 
              n.type === notification.type && 
              n.message === notification.message &&
              Math.abs(new Date(n.timestamp).getTime() - new Date(notification.timestamp).getTime()) < 60000
            );

            if (exists) return prev;

            // Agregar nueva notificación al inicio
            const newNotifications = [notificationWithId, ...prev].slice(0, 50); // Máximo 50 notificaciones
            return newNotifications;
          });

          // Incrementar contador de no leídas
          setUnreadCount(prev => prev + 1);

          // Mostrar notificación del navegador si está permitido
          if (Notification.permission === 'granted' && notification.title) {
            new Notification(notification.title, {
              body: notification.message,
              icon: '/favicon.ico',
              tag: notification.type
            });
          }

        } catch (error) {
          console.error('Error parsing notification:', error);
        }
      };

      eventSource.onerror = (error) => {
        console.error('🔔 Error en notificaciones:', error);
        setIsConnected(false);
        
        // Intentar reconectar después de 5 segundos
        setTimeout(() => {
          if (eventSourceRef.current?.readyState === EventSource.CLOSED) {
            connectToNotifications();
          }
        }, 5000);
      };
    };

    // Solicitar permisos de notificación
    if (Notification.permission === 'default') {
      Notification.requestPermission();
    }

    connectToNotifications();

    // Cleanup
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, []);

  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const removeNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
    const notification = notifications.find(n => n.id === id);
    if (notification && !notification.read) {
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'new_quote':
        return <FileText className="h-4 w-4 text-blue-500" />;
      case 'upcoming_event':
        return <Calendar className="h-4 w-4 text-orange-500" />;
      case 'email_opened':
        return <Mail className="h-4 w-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'normal':
        return 'border-l-blue-500 bg-blue-50';
      case 'low':
        return 'border-l-gray-500 bg-gray-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 60000) { // Menos de 1 minuto
      return 'Ahora';
    } else if (diff < 3600000) { // Menos de 1 hora
      const minutes = Math.floor(diff / 60000);
      return `${minutes}m`;
    } else if (diff < 86400000) { // Menos de 1 día
      const hours = Math.floor(diff / 3600000);
      return `${hours}h`;
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <div className="relative">
      {/* Botón de notificaciones */}
      <Button
        variant="ghost"
        size="sm"
        className="relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <Card className="absolute right-0 top-full mt-2 w-96 max-h-96 overflow-hidden shadow-lg z-50">
          <CardContent className="p-0">
            {/* Header */}
            <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                <span className="font-medium">Notificaciones</span>
                <div className={`h-2 w-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
              </div>
              <div className="flex items-center gap-2">
                {unreadCount > 0 && (
                  <Button variant="ghost" size="sm" onClick={markAllAsRead}>
                    Marcar todas
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => setIsOpen(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Lista de notificaciones */}
            <div className="max-h-80 overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No hay notificaciones</p>
                </div>
              ) : (
                notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`p-3 border-l-4 hover:bg-gray-50 cursor-pointer ${
                      getPriorityColor(notification.priority)
                    } ${!notification.read ? 'bg-blue-50' : 'bg-white'}`}
                    onClick={() => notification.id && markAsRead(notification.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {getNotificationIcon(notification.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {notification.title && (
                          <p className="font-medium text-sm text-gray-900 truncate">
                            {notification.title}
                          </p>
                        )}
                        <p className="text-sm text-gray-600 line-clamp-2">
                          {notification.message}
                        </p>
                        
                        <div className="flex items-center justify-between mt-1">
                          <span className="text-xs text-gray-500">
                            {formatTimestamp(notification.timestamp)}
                          </span>
                          
                          {notification.priority === 'high' && (
                            <Badge variant="destructive" className="text-xs">
                              Urgente
                            </Badge>
                          )}
                        </div>
                      </div>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex-shrink-0 h-6 w-6 p-0"
                        onClick={(e) => {
                          e.stopPropagation();
                          notification.id && removeNotification(notification.id);
                        }}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Footer */}
            {notifications.length > 0 && (
              <div className="p-2 border-t bg-gray-50 text-center">
                <span className="text-xs text-gray-500">
                  {isConnected ? 'Conectado en tiempo real' : 'Desconectado'}
                </span>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}