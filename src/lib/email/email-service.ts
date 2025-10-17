import nodemailer from 'nodemailer';

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
        pass: process.env['ETHEREAL_PASSWORD'] || 'ethereal.password'
      }
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
        pass: process.env['SMTP_PASSWORD']
      }
    });
  }

  // Gmail y otros servicios conocidos
  return nodemailer.createTransport({
    service: emailService,
    auth: {
      user: process.env['EMAIL_USER'],
      pass: process.env['EMAIL_PASSWORD']
    }
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
}

export class EmailService {
  private transporter: nodemailer.Transporter;
  private defaultFrom: string;

  constructor() {
    this.transporter = createTransporter();
    this.defaultFrom = process.env['EMAIL_FROM'] || 'Gestión de Eventos <noreply@gestiondeeventos.com>';
  }

  async sendEmail(options: EmailOptions): Promise<{ success: boolean; messageId?: string; error?: string }> {
    try {
      const mailOptions = {
        from: options.from || this.defaultFrom,
        to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
        cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
        bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
        replyTo: options.replyTo
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      // En desarrollo, mostrar la URL de preview
      if (process.env.NODE_ENV === 'development') {
        console.log('📧 Email enviado en desarrollo:');
        console.log('📧 Para:', options.to);
        console.log('📧 Asunto:', options.subject);
        console.log('📧 Preview URL:', nodemailer.getTestMessageUrl(info));
      }

      return {
        success: true,
        messageId: info.messageId
      };
    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Error desconocido'
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
      pass: testAccount.pass
    };
  }
}

export const emailService = new EmailService();