import { PrismaClient, EmailCategory } from '@prisma/client'
import { createBaseTenantTemplates, createBaseBusinessTemplates } from '../src/lib/template-inheritance'

const prisma = new PrismaClient()

async function createGlobalTemplates() {
  console.log('🌐 Creando templates globales del sistema...')

  const globalTemplates = [
    {
      name: 'Template Global - Bienvenida',
      subject: 'Bienvenido a {{businessName}}',
      category: 'REGISTRATION' as EmailCategory,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f8fafc;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px;">¡Bienvenido!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 18px;">{{businessName}}</p>
          </div>
          <div style="padding: 40px 20px; background-color: white;">
            <h2 style="color: #374151; margin-top: 0;">Hola {{clientName}},</h2>
            <p style="color: #6b7280; line-height: 1.6; font-size: 16px;">
              Te damos la más cordial bienvenida a nuestra familia de clientes. 
              Estamos emocionados de tenerte con nosotros y esperamos brindarte 
              el mejor servicio posible.
            </p>
            <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3 style="color: #1f2937; margin-top: 0;">Próximos pasos:</h3>
              <ol style="color: #4b5563; line-height: 1.8;">
                <li>Activa tu cuenta haciendo clic en el botón de abajo</li>
                <li>Completa tu perfil con tu información</li>
                <li>Explora nuestros servicios disponibles</li>
              </ol>
            </div>
            <div style="text-align: center; margin: 40px 0;">
              <a href="{{activationLink}}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Activar Mi Cuenta
              </a>
            </div>
            <p style="color: #6b7280; text-align: center; font-size: 14px; margin-top: 40px;">
              Si tienes alguna pregunta, no dudes en contactarnos.<br>
              Atentamente, el equipo de {{businessName}}
            </p>
          </div>
        </div>
      `,
      variables: ['businessName', 'clientName', 'activationLink']
    },
    {
      name: 'Template Global - Recuperación de Contraseña',
      subject: 'Recupera tu contraseña - {{businessName}}',
      category: 'PASSWORD_RESET' as EmailCategory,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #fef2f2;">
          <div style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">🔐 Recuperación de Contraseña</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">{{businessName}}</p>
          </div>
          <div style="padding: 40px 20px; background-color: white;">
            <h2 style="color: #374151; margin-top: 0;">Hola {{clientName}},</h2>
            <p style="color: #6b7280; line-height: 1.6; font-size: 16px;">
              Recibimos una solicitud para restablecer tu contraseña en {{businessName}}.
            </p>
            <div style="background-color: #fef3c7; border-left: 4px solid #f59e0b; padding: 20px; margin: 30px 0;">
              <p style="color: #92400e; margin: 0; font-weight: bold;">
                ⚠️ Este enlace expira en 24 horas por seguridad
              </p>
            </div>
            <p style="color: #6b7280; line-height: 1.6;">
              Si solicitaste este cambio, haz clic en el siguiente botón:
            </p>
            <div style="text-align: center; margin: 40px 0;">
              <a href="{{resetLink}}" style="background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;">
                Restablecer Contraseña
              </a>
            </div>
            <p style="color: #6b7280; font-size: 14px; text-align: center;">
              Si no solicitaste este cambio, puedes ignorar este email con total seguridad.
            </p>
            <p style="color: #6b7280; text-align: center; font-size: 14px; margin-top: 40px;">
              Saludos seguros,<br>Equipo de Seguridad {{businessName}}
            </p>
          </div>
        </div>
      `,
      variables: ['businessName', 'clientName', 'resetLink']
    },
    {
      name: 'Template Global - Envío de Cotización',
      subject: '💼 Tu cotización está lista - {{businessName}}',
      category: 'QUOTE_SEND' as EmailCategory,
      htmlContent: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background-color: #f0fdf4;">
          <div style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">💼 ¡Tu Cotización Está Lista!</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">{{businessName}}</p>
          </div>
          <div style="padding: 40px 20px; background-color: white;">
            <h2 style="color: #374151; margin-top: 0;">Estimado/a {{clientName}},</h2>
            <p style="color: #6b7280; line-height: 1.6; font-size: 16px;">
              Nos complace enviarte la cotización para tu evento: 
              <strong style="color: #059669;">{{eventTitle}}</strong>
            </p>
            
            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 30px; border-radius: 12px; margin: 30px 0; border: 1px solid #bbf7d0;">
              <h3 style="color: #065f46; margin-top: 0; text-align: center;">📋 Detalles del Evento</h3>
              <div style="display: grid; gap: 15px;">
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #bbf7d0;">
                  <span style="color: #374151; font-weight: bold;">Fecha:</span>
                  <span style="color: #059669;">{{eventDate}}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #bbf7d0;">
                  <span style="color: #374151; font-weight: bold;">Ubicación:</span>
                  <span style="color: #059669;">{{eventLocation}}</span>
                </div>
                <div style="display: flex; justify-content: space-between; padding: 10px 0; font-size: 18px;">
                  <span style="color: #374151; font-weight: bold;">Total:</span>
                  <span style="color: #059669; font-weight: bold; font-size: 20px;">{{quoteTotal}}</span>
                </div>
              </div>
            </div>

            <div style="text-align: center; margin: 40px 0;">
              <a href="{{quoteLink}}" style="background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);">
                📄 Ver Cotización Completa
              </a>
            </div>

            <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; margin: 0;">
                <strong>⏰ Validez:</strong> Esta cotización es válida hasta <strong>{{validUntil}}</strong>
              </p>
            </div>

            <p style="color: #6b7280; line-height: 1.6; margin-top: 30px;">
              Si tienes alguna pregunta o necesitas ajustar algún detalle, 
              no dudes en contactarnos. ¡Esperamos trabajar contigo en este evento especial!
            </p>
            
            <p style="color: #6b7280; text-align: center; font-size: 14px; margin-top: 40px;">
              Con la mejor atención,<br>Equipo {{businessName}}
            </p>
          </div>
        </div>
      `,
      variables: ['businessName', 'clientName', 'eventTitle', 'eventDate', 'eventLocation', 'quoteTotal', 'quoteLink', 'validUntil']
    }
  ]

  const createdTemplates = []

  for (const templateData of globalTemplates) {
    // Verificar si ya existe
    const existing = await prisma.emailTemplate.findFirst({
      where: {
        name: templateData.name,
        templateType: 'GLOBAL'
      }
    })

    if (!existing) {
      const template = await prisma.emailTemplate.create({
        data: {
          name: templateData.name,
          subject: templateData.subject,
          htmlContent: templateData.htmlContent,
          category: templateData.category,
          variables: templateData.variables,
          templateType: 'GLOBAL',
          isGlobal: true,
          isDefault: true,
          inheritanceLevel: 0,
          tenantId: 'global-system', // Placeholder, se puede cambiar por un tenant del sistema
        }
      })
      createdTemplates.push(template)
      console.log(`✅ Template global creado: ${template.name}`)
    } else {
      console.log(`⚠️ Template global ya existe: ${templateData.name}`)
    }
  }

  return createdTemplates
}

async function initializeTemplateSystem(tenantId: string, businessIdentityId?: string) {
  console.log('🚀 Inicializando sistema de herencia de templates...')

  // 1. Crear templates globales si no existen
  await createGlobalTemplates()

  // 2. Crear templates base para el tenant
  console.log('🏢 Creando templates base del tenant...')
  const tenantTemplates = await createBaseTenantTemplates(tenantId)
  console.log(`✅ Creados ${tenantTemplates.length} templates base del tenant`)

  // 3. Crear templates base para business identity si se proporciona
  if (businessIdentityId) {
    console.log('🏪 Creando templates base del business identity...')
    const businessTemplates = await createBaseBusinessTemplates(tenantId, businessIdentityId)
    console.log(`✅ Creados ${businessTemplates.length} templates base del business identity`)
  }

  console.log('🎉 Sistema de herencia de templates inicializado correctamente!')
}

// Script principal
async function main() {
  try {
    // Obtener el tenant principal
    const mainTenant = await prisma.tenant.findFirst({
      where: { domain: 'plexo.mx' }
    })

    if (!mainTenant) {
      console.error('❌ No se encontró el tenant principal')
      return
    }

    // Obtener el business identity principal
    const mainBusinessIdentity = await prisma.businessIdentity.findFirst({
      where: { tenantId: mainTenant.id }
    })

    // Inicializar el sistema
    await initializeTemplateSystem(
      mainTenant.id,
      mainBusinessIdentity?.id
    )

  } catch (error) {
    console.error('❌ Error al inicializar sistema de templates:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  main()
}

export { createGlobalTemplates, initializeTemplateSystem }