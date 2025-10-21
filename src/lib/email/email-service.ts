import nodemailer from 'nodemailer';
import { getTenantSMTPConfig } from '@/app/api/emails/config/route';

// Configuración del transportador de email
const createTransporter = () => {
  // En desarrollo, usar Ethereal Email para testing
  if (process.env.NODE_ENV === 'development') {
    return nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: process.env['ETHEREAL_EMAIL'] || 'ethereal.user@ethereal.email',
        pass: process.env['ETHEREAL_PASSWORD'] || 'ethereal.password',
      },
    });
  }

  // En producción, usar configuración real
  const emailService = process.env['EMAIL_SERVICE'] || 'gmail';

  if (emailService === 'smtp') {
    return nodemailer.createTransport({
      host: process.env['SMTP_HOST'],
      port: parseInt(process.env['SMTP_PORT'] || '587'),
      secure: process.env['SMTP_SECURE'] === 'true',
      auth: {
        user: process.env['SMTP_USER'],
        pass: process.env['SMTP_PASSWORD'],
      },
    });
  }

  // Gmail y otros servicios conocidos
  return nodemailer.createTransport({
    service: emailService,
    auth: {
      user: process.env['EMAIL_USER'],
      pass: process.env['EMAIL_PASSWORD'],
    },
  });
};

export interface EmailAttachment {
  filename: string;
  content?: Buffer;
  path?: string;
  contentType?: string;
}

export interface EmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  text?: string;
  html?: string;
  attachments?: EmailAttachment[];
  replyTo?: string;
  from?: string;
  tenantId?: string; // ID del tenant para configuración específica
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private defaultFrom: string;
  private tenantTransporters: Map<string, nodemailer.Transporter> = new Map();

  constructor() {
    this.transporter = createTransporter();
    this.defaultFrom =
      process.env['EMAIL_FROM'] || 'Gestión de Eventos <noreply@gestiondeeventos.com>';
  }

  /**
   * Obtiene o crea un transportador específico para un tenant
   */
  private async getTenantTransporter(tenantId: string): Promise<nodemailer.Transporter> {
    const existingTransporter = this.tenantTransporters.get(tenantId);
    if (existingTransporter) {
      return existingTransporter;
    }

    // Cargar configuración específica del tenant desde la base de datos
    const tenantConfig = await getTenantSMTPConfig(tenantId);

    // Crear transportador para el tenant usando su configuración
    // Para servicios conocidos, usar configuraciones predefinidas
    const serviceConfigs: Record<string, { host: string; port: number; secure: boolean }> = {
      gmail: { host: 'smtp.gmail.com', port: 587, secure: false },
      outlook: { host: 'smtp-mail.outlook.com', port: 587, secure: false },
      hotmail: { host: 'smtp-mail.outlook.com', port: 587, secure: false },
      yahoo: { host: 'smtp.mail.yahoo.com', port: 587, secure: false },
      aol: { host: 'smtp.aol.com', port: 587, secure: false },
      icloud: { host: 'smtp.mail.me.com', port: 587, secure: false },
      zoho: { host: 'smtp.zoho.com', port: 587, secure: false },
    };

    let smtpConfig: any;

    if (tenantConfig.provider && serviceConfigs[tenantConfig.provider]) {
      // Usar configuración predefinida para servicio conocido
      const serviceConfig = serviceConfigs[tenantConfig.provider];
      if (serviceConfig) {
        smtpConfig = {
          host: serviceConfig.host,
          port: serviceConfig.port,
          secure: serviceConfig.secure,
          auth:
            tenantConfig.smtpUser && tenantConfig.smtpPassword
              ? {
                  user: tenantConfig.smtpUser,
                  pass: tenantConfig.smtpPassword,
                }
              : undefined,
        };
      }
    } else {
      // Usar configuración SMTP personalizada
      smtpConfig = {
        host: tenantConfig.smtpHost,
        port: tenantConfig.smtpPort,
        secure: tenantConfig.smtpSecure,
        auth:
          tenantConfig.smtpUser && tenantConfig.smtpPassword
            ? {
                user: tenantConfig.smtpUser,
                pass: tenantConfig.smtpPassword,
              }
            : undefined,
      };
    }

    const tenantTransporter: nodemailer.Transporter = nodemailer.createTransport(smtpConfig);

    this.tenantTransporters.set(tenantId, tenantTransporter);
    return tenantTransporter;
  }

  /**
   * Obtiene la dirección 'from' específica del tenant
   */
  private async getTenantFromAddress(tenantId: string): Promise<string> {
    const tenantConfig = await getTenantSMTPConfig(tenantId);

    if (tenantConfig.fromEmail) {
      const fromName = tenantConfig.fromName ? `${tenantConfig.fromName} ` : '';
      return `${fromName}<${tenantConfig.fromEmail}>`;
    }

    return this.defaultFrom;
  }

  async sendEmail(
    options: EmailOptions
  ): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      // Determinar qué transportador usar
      const transporter = options.tenantId
        ? await this.getTenantTransporter(options.tenantId)
        : this.transporter;

      // Determinar la dirección 'from'
      const fromAddress = options.tenantId
        ? await this.getTenantFromAddress(options.tenantId)
        : this.defaultFrom;

      const mailOptions = {
        from: options.from || fromAddress,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc
          ? Array.isArray(options.cc)
            ? options.cc.join(', ')
            : options.cc
          : undefined,
        bcc: options.bcc
          ? Array.isArray(options.bcc)
            ? options.bcc.join(', ')
            : options.bcc
          : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
        replyTo: options.replyTo,
      };

      const info = await transporter.sendMail(mailOptions);

      // En desarrollo, mostrar la URL de preview
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email enviado en desarrollo:');
        console.log('📧 Para:', options.to);
        console.log('📧 Asunto:', options.subject);
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId,
      };
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      };
    }
  }

  async verifyConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      return true;
    } catch (error) {
      console.error('❌ Error verificando conexión de email:', error);
      return false;
    }
  }

  // Método para testing en desarrollo
  async createTestAccount(): Promise<{ user: string; pass: string }> {
    const testAccount = await nodemailer.createTestAccount();
    return {
      user: testAccount.user,
      pass: testAccount.pass,
    };
  }
}

export const emailService = new EmailService();
