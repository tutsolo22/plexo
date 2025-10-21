'use client';

import React, { useState, useEffect } from 'react';
import { Bell, X, FileText, Calendar, Mail, AlertCircle, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  entityId?: string;
  entityType?: string;
  metadata?: Record<string, any>;
  priority?: 'low' | 'medium' | 'high';
}

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  // Cargar notificaciones al montar el componente
  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/notifications');
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setNotifications(data.data);
        }
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: string) => {
    try {
      const response = await fetch(`/api/notifications/${notificationId}/read`, {
        method: 'POST',
      });

      if (response.ok) {
        // Actualizar el estado local
        setNotifications(prev =>
          prev.map(notif => (notif.id === notificationId ? { ...notif, read: true } : notif))
        );
      }
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
    }
  };

  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter(n => !n.read);
    await Promise.all(unreadNotifications.map(notif => markAsRead(notif.id)));
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'quote_created':
      case 'quote_sent':
      case 'quote_accepted':
      case 'quote_rejected':
        return <FileText className='h-4 w-4' />;
      case 'event_created':
      case 'event_updated':
        return <Calendar className='h-4 w-4' />;
      case 'payment_received':
      case 'payment_overdue':
        return <Mail className='h-4 w-4' />;
      default:
        return <AlertCircle className='h-4 w-4' />;
    }
  };

  const getPriorityColor = (priority?: string) => {
    switch (priority) {
      case 'high':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-blue-600 bg-blue-50 border-blue-200';
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className='relative'>
      {/* Botón de notificaciones */}
      <Button variant='ghost' size='sm' onClick={() => setIsOpen(!isOpen)} className='relative'>
        <Bell className='h-4 w-4' />
        {unreadCount > 0 && (
          <Badge
            variant='destructive'
            className='absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center p-0 text-xs'
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {/* Panel de notificaciones */}
      {isOpen && (
        <Card className='absolute right-0 top-12 z-50 max-h-96 w-96 overflow-hidden shadow-lg'>
          <div className='flex items-center justify-between border-b p-4'>
            <h3 className='font-semibold'>Notificaciones</h3>
            <div className='flex gap-2'>
              {unreadCount > 0 && (
                <Button variant='ghost' size='sm' onClick={markAllAsRead} className='text-xs'>
                  <Check className='mr-1 h-3 w-3' />
                  Marcar todas como leídas
                </Button>
              )}
              <Button variant='ghost' size='sm' onClick={() => setIsOpen(false)}>
                <X className='h-4 w-4' />
              </Button>
            </div>
          </div>

          <CardContent className='max-h-80 overflow-y-auto p-0'>
            {loading ? (
              <div className='p-4 text-center text-gray-500'>Cargando notificaciones...</div>
            ) : notifications.length === 0 ? (
              <div className='p-4 text-center text-gray-500'>No hay notificaciones</div>
            ) : (
              <div className='divide-y'>
                {notifications.map(notification => (
                  <div
                    key={notification.id}
                    className={`cursor-pointer p-4 hover:bg-gray-50 ${
                      !notification.read ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => !notification.read && markAsRead(notification.id)}
                  >
                    <div className='flex items-start gap-3'>
                      <div
                        className={`rounded-full p-2 ${getPriorityColor(notification.priority)}`}
                      >
                        {getNotificationIcon(notification.type)}
                      </div>
                      <div className='min-w-0 flex-1'>
                        <div className='flex items-center justify-between'>
                          <h4 className='truncate text-sm font-medium text-gray-900'>
                            {notification.title}
                          </h4>
                          {!notification.read && (
                            <div className='h-2 w-2 flex-shrink-0 rounded-full bg-blue-600' />
                          )}
                        </div>
                        <p className='mt-1 line-clamp-2 text-sm text-gray-600'>
                          {notification.message}
                        </p>
                        <p className='mt-2 text-xs text-gray-400'>
                          {new Date(notification.timestamp).toLocaleString('es-ES')}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
