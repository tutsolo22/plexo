// lib/notifications/notification-service.ts
import { prisma } from '@/lib/prisma';
import { emailService } from '@/lib/email/email-service';
import { getRedisClient, CacheKeys } from '@/lib/redis';

export type NotificationChannel = 'email' | 'whatsapp' | 'in_app';

export type NotificationType =
  | 'quote_created'
  | 'quote_updated'
  | 'quote_sent'
  | 'quote_accepted'
  | 'quote_rejected'
  | 'event_created'
  | 'event_updated'
  | 'payment_received'
  | 'payment_overdue'
  | 'reminder'
  | 'custom';

export interface NotificationData {
  type: NotificationType;
  title: string;
  message: string;
  recipientId?: string;
  recipientEmail?: string;
  recipientPhone?: string | null;
  tenantId: string;
  entityId?: string; // ID de la entidad relacionada (quote, event, etc.)
  entityType?: string; // Tipo de entidad
  metadata?: Record<string, any>;
  channels?: NotificationChannel[];
  priority?: 'low' | 'medium' | 'high';
}

export interface NotificationTemplate {
  type: NotificationType;
  subject: string;
  emailTemplate: string;
  whatsappTemplate: string;
  variables: string[];
}

export class NotificationService {
  private static templates: Record<NotificationType, NotificationTemplate> = {
    quote_created: {
      type: 'quote_created',
      subject: 'Nueva cotización creada - {{quoteNumber}}',
      emailTemplate: `
        <h2>¡Nueva cotización creada!</h2>
        <p>Estimado {{clientName}},</p>
        <p>Se ha creado una nueva cotización para su evento <strong>{{eventTitle}}</strong>.</p>
        <p><strong>Número de cotización:</strong> {{quoteNumber}}</p>
        <p><strong>Total:</strong> \${{total}}</p>
        <p><strong>Válida hasta:</strong> {{validUntil}}</p>
        <p>Puede revisar los detalles accediendo a su panel de cliente.</p>
        <br>
        <p>Atentamente,<br>{{businessName}}</p>
      `,
      whatsappTemplate: `¡Hola {{clientName}}! 🎉 Se ha creado una nueva cotización para tu evento "{{eventTitle}}". Número: {{quoteNumber}}, Total: \${{total}}. Válida hasta {{validUntil}}. Revisa los detalles en tu panel.`,
      variables: ['clientName', 'eventTitle', 'quoteNumber', 'total', 'validUntil', 'businessName'],
    },
    quote_sent: {
      type: 'quote_sent',
      subject: 'Cotización enviada - {{quoteNumber}}',
      emailTemplate: `
        <h2>Cotización enviada</h2>
        <p>Estimado {{clientName}},</p>
        <p>Le hemos enviado la cotización para su evento <strong>{{eventTitle}}</strong>.</p>
        <p><strong>Número de cotización:</strong> {{quoteNumber}}</p>
        <p><strong>Total:</strong> \${{total}}</p>
        <p>Por favor, revise los detalles y contáctenos si tiene alguna pregunta.</p>
        <br>
        <p>Atentamente,<br>{{businessName}}</p>
      `,
      whatsappTemplate: `¡Hola {{clientName}}! 📄 Te hemos enviado la cotización para tu evento "{{eventTitle}}". Número: {{quoteNumber}}, Total: \${{total}}. Revisa tu email para más detalles.`,
      variables: ['clientName', 'eventTitle', 'quoteNumber', 'total', 'businessName'],
    },
    quote_accepted: {
      type: 'quote_accepted',
      subject: 'Cotización aceptada - {{quoteNumber}}',
      emailTemplate: `
        <h2>¡Cotización aceptada!</h2>
        <p>¡Excelente noticia!</p>
        <p>El cliente <strong>{{clientName}}</strong> ha aceptado la cotización <strong>{{quoteNumber}}</strong> para el evento <strong>{{eventTitle}}</strong>.</p>
        <p><strong>Total confirmado:</strong> \${{total}}</p>
        <p>Es momento de comenzar con los preparativos del evento.</p>
        <br>
        <p>¡Felicitaciones!</p>
      `,
      whatsappTemplate: `¡Felicitaciones! 🎊 El cliente {{clientName}} ha aceptado la cotización {{quoteNumber}} por \${{total}}. ¡Es hora de preparar el evento "{{eventTitle}}"!`,
      variables: ['clientName', 'eventTitle', 'quoteNumber', 'total'],
    },
    quote_rejected: {
      type: 'quote_rejected',
      subject: 'Cotización rechazada - {{quoteNumber}}',
      emailTemplate: `
        <h2>Cotización rechazada</h2>
        <p>El cliente <strong>{{clientName}}</strong> ha rechazado la cotización <strong>{{quoteNumber}}</strong> para el evento <strong>{{eventTitle}}</strong>.</p>
        <p><strong>Motivo:</strong> {{reason}}</p>
        <p>Te recomendamos contactar al cliente para entender mejor sus necesidades y ajustar la propuesta.</p>
        <br>
        <p>¡Sigue adelante!</p>
      `,
      whatsappTemplate: `El cliente {{clientName}} ha rechazado la cotización {{quoteNumber}} para "{{eventTitle}}". Motivo: {{reason}}. Contacta al cliente para ajustar la propuesta.`,
      variables: ['clientName', 'eventTitle', 'quoteNumber', 'reason'],
    },
    event_created: {
      type: 'event_created',
      subject: 'Nuevo evento creado - {{eventTitle}}',
      emailTemplate: `
        <h2>Nuevo evento creado</h2>
        <p>Se ha creado un nuevo evento en el sistema.</p>
        <p><strong>Evento:</strong> {{eventTitle}}</p>
        <p><strong>Cliente:</strong> {{clientName}}</p>
        <p><strong>Fecha:</strong> {{eventDate}}</p>
        <p><strong>Ubicación:</strong> {{location}}</p>
        <p>Recuerda crear una cotización para este evento.</p>
      `,
      whatsappTemplate: `Nuevo evento creado: "{{eventTitle}}" para {{clientName}} el {{eventDate}} en {{location}}. Recuerda crear la cotización.`,
      variables: ['eventTitle', 'clientName', 'eventDate', 'location'],
    },
    payment_received: {
      type: 'payment_received',
      subject: 'Pago recibido - \${{amount}}',
      emailTemplate: `
        <h2>¡Pago recibido!</h2>
        <p>Se ha recibido un pago de <strong>\${{amount}}</strong>.</p>
        <p><strong>Cliente:</strong> {{clientName}}</p>
        <p><strong>Concepto:</strong> {{concept}}</p>
        <p><strong>Referencia:</strong> {{reference}}</p>
        <p>Gracias por su pago.</p>
      `,
      whatsappTemplate: `¡Pago recibido! 💰 \${{amount}} de {{clientName}} por {{concept}}. Referencia: {{reference}}. ¡Gracias!`,
      variables: ['amount', 'clientName', 'concept', 'reference'],
    },
    reminder: {
      type: 'reminder',
      subject: 'Recordatorio - {{title}}',
      emailTemplate: `
        <h2>Recordatorio</h2>
        <p>{{message}}</p>
        <p><strong>Fecha límite:</strong> {{dueDate}}</p>
        <p>Por favor, atienda este asunto a la brevedad.</p>
      `,
      whatsappTemplate: `⏰ Recordatorio: {{message}}. Fecha límite: {{dueDate}}.`,
      variables: ['title', 'message', 'dueDate'],
    },
    quote_updated: {
      type: 'quote_updated',
      subject: 'Cotización actualizada - {{quoteNumber}}',
      emailTemplate: `
        <h2>Cotización actualizada</h2>
        <p>Estimado {{clientName}},</p>
        <p>Se ha actualizado la cotización para su evento <strong>{{eventTitle}}</strong>.</p>
        <p><strong>Número de cotización:</strong> {{quoteNumber}}</p>
        <p><strong>Nuevo total:</strong> \${{total}}</p>
        <p>Por favor, revise los cambios y contáctenos si tiene preguntas.</p>
        <br>
        <p>Atentamente,<br>{{businessName}}</p>
      `,
      whatsappTemplate: `Cotización actualizada: {{quoteNumber}} para "{{eventTitle}}". Nuevo total: \${{total}}. Revisa los detalles.`,
      variables: ['clientName', 'eventTitle', 'quoteNumber', 'total', 'businessName'],
    },
    event_updated: {
      type: 'event_updated',
      subject: 'Evento actualizado - {{eventTitle}}',
      emailTemplate: `
        <h2>Evento actualizado</h2>
        <p>Se han realizado cambios en el evento <strong>{{eventTitle}}</strong>.</p>
        <p><strong>Cliente:</strong> {{clientName}}</p>
        <p><strong>Nueva fecha:</strong> {{eventDate}}</p>
        <p>Por favor, revise los detalles actualizados.</p>
      `,
      whatsappTemplate: `Evento actualizado: "{{eventTitle}}" para {{clientName}}. Nueva fecha: {{eventDate}}.`,
      variables: ['eventTitle', 'clientName', 'eventDate'],
    },
    payment_overdue: {
      type: 'payment_overdue',
      subject: 'Pago pendiente - \${{amount}}',
      emailTemplate: `
        <h2>Pago pendiente</h2>
        <p>Estimado {{clientName}},</p>
        <p>Tiene un pago pendiente por <strong>\${{amount}}</strong>.</p>
        <p><strong>Concepto:</strong> {{concept}}</p>
        <p><strong>Fecha límite:</strong> {{dueDate}}</p>
        <p>Por favor, realice el pago a la brevedad para evitar inconvenientes.</p>
        <br>
        <p>Atentamente,<br>{{businessName}}</p>
      `,
      whatsappTemplate: `Pago pendiente: \${{amount}} por {{concept}}. Fecha límite: {{dueDate}}. Por favor, realiza el pago pronto.`,
      variables: ['clientName', 'amount', 'concept', 'dueDate', 'businessName'],
    },
    custom: {
      type: 'custom',
      subject: '{{subject}}',
      emailTemplate: '{{message}}',
      whatsappTemplate: '{{message}}',
      variables: ['subject', 'message'],
    },
  };

  /**
   * Envía una notificación usando los canales especificados
   */
  static async sendNotification(data: NotificationData): Promise<{
    success: boolean;
    results: Record<NotificationChannel, boolean>;
    errors: string[];
  }> {
    const results: Record<NotificationChannel, boolean> = {
      email: false,
      whatsapp: false,
      in_app: false,
    };
    const errors: string[] = [];

    const channels = data.channels || ['in_app'];
    const template = this.templates[data.type];

    if (!template) {
      errors.push(`Template no encontrado para el tipo de notificación: ${data.type}`);
      return { success: false, results, errors };
    }

    // Preparar datos para el template
    const templateData = await this.prepareTemplateData(data);

    // Enviar por cada canal
    for (const channel of channels) {
      try {
        switch (channel) {
          case 'email':
            results.email = await this.sendEmailNotification(template, templateData, data);
            break;
          case 'whatsapp':
            results.whatsapp = await this.sendWhatsAppNotification(template, templateData, data);
            break;
          case 'in_app':
            results.in_app = await this.sendInAppNotification(data);
            break;
        }
      } catch (error) {
        errors.push(`${channel}: ${error instanceof Error ? error.message : 'Error desconocido'}`);
      }
    }

    const success = Object.values(results).some(result => result);

    return { success, results, errors };
  }

  /**
   * Envía notificación por email
   */
  private static async sendEmailNotification(
    template: NotificationTemplate,
    templateData: Record<string, any>,
    data: NotificationData
  ): Promise<boolean> {
    if (!data.recipientEmail) {
      throw new Error('Email del destinatario no especificado');
    }

    // Reemplazar variables en el template
    const subject = this.replaceVariables(template.subject, templateData);
    const htmlContent = this.replaceVariables(template.emailTemplate, templateData);

    const result = await emailService.sendEmail({
      to: data.recipientEmail,
      subject,
      html: htmlContent,
      tenantId: data.tenantId, // Importante para multi-tenant
    });

    return result.success;
  }

  /**
   * Envía notificación por WhatsApp
   */
  private static async sendWhatsAppNotification(
    template: NotificationTemplate,
    templateData: Record<string, any>,
    data: NotificationData
  ): Promise<boolean> {
    // TODO: Implementar envío de WhatsApp cuando esté disponible
    // Por ahora, solo registrar que se intentó enviar
    console.log('WhatsApp notification not implemented yet:', {
      to: data.recipientPhone,
      template: template.type,
      data: templateData,
    });
    return false;
  }

  /**
   * Guarda notificación en el sistema (in-app)
   */
  private static async sendInAppNotification(data: NotificationData): Promise<boolean> {
    if (!data.recipientId) {
      throw new Error('ID del destinatario no especificado');
    }

    try {
      // Guardar en Redis
      const redis = await getRedisClient();
      const notificationKey = CacheKeys.USER_NOTIFICATIONS(data.recipientId);
      const notification = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: data.type,
        title: data.title,
        message: data.message,
        timestamp: new Date().toISOString(),
        read: false,
        entityId: data.entityId,
        entityType: data.entityType,
        metadata: data.metadata,
        priority: data.priority || 'medium',
      };

      await redis.lPush(notificationKey, JSON.stringify(notification));
      await redis.expire(notificationKey, 60 * 60 * 24 * 30); // 30 días

      return true;
    } catch (error) {
      console.error('Error guardando notificación in-app:', error);
      return false;
    }
  }

  /**
   * Prepara los datos para reemplazar en los templates
   */
  private static async prepareTemplateData(data: NotificationData): Promise<Record<string, any>> {
    const templateData: Record<string, any> = {
      ...data.metadata,
      businessName: 'Plexo Eventos',
      currentDate: new Date().toLocaleDateString('es-GT'),
      currentTime: new Date().toLocaleTimeString('es-GT'),
    };

    // Si hay entityId y entityType, cargar datos adicionales
    if (data.entityId && data.entityType) {
      switch (data.entityType) {
        case 'quote':
          const quote = await prisma.quote.findUnique({
            where: { id: data.entityId },
            include: {
              event: {
                include: {
                  client: true,
                },
              },
              template: true,
            },
          });
          if (quote) {
            templateData['quoteNumber'] = quote['quoteNumber'];
            templateData['total'] = quote['total']?.toFixed(2);
            templateData['subtotal'] = quote['subtotal']?.toFixed(2);
            templateData['discount'] = quote['discount']?.toFixed(2);
            templateData['validUntil'] = quote['validUntil']?.toLocaleDateString('es-GT');
            templateData['clientName'] = quote.event?.client?.name;
            templateData['eventTitle'] = quote.event?.title;
          }
          break;
        case 'event':
          const event = await prisma.event.findUnique({
            where: { id: data.entityId },
            include: {
              client: true,
              room: true,
              venue: true,
            },
          });
          if (event) {
            templateData['eventTitle'] = event.title;
            templateData['eventDate'] = event.startDate?.toLocaleDateString('es-GT');
            templateData['location'] = event.room?.name || event.venue?.name || 'Por confirmar';
            templateData['clientName'] = event.client?.name;
          }
          break;
      }
    }

    return templateData;
  }

  /**
   * Reemplaza variables en un template
   */
  private static replaceVariables(template: string, data: Record<string, any>): string {
    let result = template;
    for (const [key, value] of Object.entries(data)) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), value || '');
    }
    return result;
  }

  /**
   * Obtiene notificaciones de un usuario
   */
  static async getUserNotifications(userId: string): Promise<any[]> {
    try {
      const redis = await getRedisClient();
      const notificationKey = CacheKeys.USER_NOTIFICATIONS(userId);
      const notifications = await redis.lRange(notificationKey, 0, -1);
      return notifications.map(n => JSON.parse(n)).reverse();
    } catch (error) {
      console.error('Error obteniendo notificaciones:', error);
      return [];
    }
  }

  /**
   * Marca notificación como leída
   */
  static async markAsRead(userId: string, notificationId: string): Promise<boolean> {
    try {
      const redis = await getRedisClient();
      const notificationKey = CacheKeys.USER_NOTIFICATIONS(userId);
      const notifications = await redis.lRange(notificationKey, 0, -1);

      const updatedNotifications = notifications.map(n => {
        const parsed = JSON.parse(n);
        if (parsed.id === notificationId) {
          parsed.read = true;
        }
        return JSON.stringify(parsed);
      });

      await redis.del(notificationKey);
      if (updatedNotifications.length > 0) {
        for (const notification of updatedNotifications) {
          await redis.rPush(notificationKey, notification);
        }
        await redis.expire(notificationKey, 60 * 60 * 24 * 30);
      }

      return true;
    } catch (error) {
      console.error('Error marcando notificación como leída:', error);
      return false;
    }
  }

  /**
   * Envía notificación cuando se crea una cotización
   */
  static async notifyQuoteCreated(quoteId: string): Promise<void> {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        event: {
          include: {
            client: true,
            tenant: true,
          },
        },
      },
    });

    if (!quote || !quote.event?.client) return;

    await this.sendNotification({
      type: 'quote_created',
      title: 'Nueva cotización creada',
      message: `Se ha creado la cotización ${quote.quoteNumber} para el evento ${quote.event.title}`,
      recipientId: quote.event.client.id,
      recipientEmail: quote.event.client.email,
      ...(quote.event.client.phone && { recipientPhone: quote.event.client.phone }),
      tenantId: quote.event.tenant.id,
      entityId: quoteId,
      entityType: 'quote',
      channels: ['in_app', 'email'],
      priority: 'medium',
    });
  }

  /**
   * Envía notificación cuando se envía una cotización
   */
  static async notifyQuoteSent(quoteId: string): Promise<void> {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        event: {
          include: {
            client: true,
            tenant: true,
          },
        },
      },
    });

    if (!quote || !quote.event?.client) return;

    await this.sendNotification({
      type: 'quote_sent',
      title: 'Cotización enviada',
      message: `La cotización ${quote.quoteNumber} ha sido enviada al cliente`,
      recipientId: quote.event.client.id,
      recipientEmail: quote.event.client.email,
      recipientPhone: quote.event.client.phone,
      tenantId: quote.event.tenant.id,
      entityId: quoteId,
      entityType: 'quote',
      channels: ['in_app', 'email', 'whatsapp'],
      priority: 'high',
    });
  }

  /**
   * Envía notificación cuando se acepta una cotización
   */
  static async notifyQuoteAccepted(quoteId: string): Promise<void> {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        event: {
          include: {
            client: true,
            tenant: true,
          },
        },
      },
    });

    if (!quote || !quote.event?.tenant) return;

    // Notificar al tenant/admin
    await this.sendNotification({
      type: 'quote_accepted',
      title: 'Cotización aceptada',
      message: `La cotización ${quote.quoteNumber} ha sido aceptada por el cliente`,
      recipientId: quote.event.tenant.id,
      tenantId: quote.event.tenant.id,
      entityId: quoteId,
      entityType: 'quote',
      channels: ['in_app'],
      priority: 'high',
    });
  }

  /**
   * Envía notificación cuando se rechaza una cotización
   */
  static async notifyQuoteRejected(quoteId: string, reason?: string): Promise<void> {
    const quote = await prisma.quote.findUnique({
      where: { id: quoteId },
      include: {
        event: {
          include: {
            tenant: true,
          },
        },
      },
    });

    if (!quote || !quote.event?.tenant) return;

    await this.sendNotification({
      type: 'quote_rejected',
      title: 'Cotización rechazada',
      message: `La cotización ${quote.quoteNumber} ha sido rechazada por el cliente`,
      recipientId: quote.event.tenant.id,
      tenantId: quote.event.tenant.id,
      entityId: quoteId,
      entityType: 'quote',
      metadata: { reason },
      channels: ['in_app'],
      priority: 'medium',
    });
  }
}

export const notificationService = new NotificationService();
