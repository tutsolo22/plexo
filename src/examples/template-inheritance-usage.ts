import { findBestTemplate, resolveTemplate, createInheritedTemplate, updateTemplateCustomizations } from '../lib/template-inheritance'
import { EmailCategory } from '@prisma/client'

/**
 * Ejemplo de uso del sistema de herencia de templates
 */

// Ejemplo 1: Buscar el mejor template disponible para una categoría
export async function sendRegistrationEmail(
  tenantId: string,
  businessIdentityId: string,
  clientEmail: string,
  clientName: string
) {
  try {
    // 1. Buscar el mejor template disponible siguiendo la jerarquía
    const template = await findBestTemplate({
      tenantId,
      businessIdentityId,
      category: EmailCategory.REGISTRATION
    })

    if (!template) {
      throw new Error('No se encontró template de registro')
    }

    // 2. Resolver el template aplicando herencia
    const resolvedTemplate = await resolveTemplate(template)

    // 3. Reemplazar variables en el contenido
    const emailSubject = replaceTemplateVariables(resolvedTemplate.subject, {
      businessName: 'Mi Empresa de Eventos'
    })

    const emailContent = replaceTemplateVariables(resolvedTemplate.htmlContent, {
      businessName: 'Mi Empresa de Eventos',
      clientName: clientName,
      activationLink: `https://miempresa.com/activate?email=${clientEmail}`
    })

    // 4. Enviar el email (aquí iría la lógica de envío real)
    console.log(`📧 Enviando email de registro a ${clientEmail}`)
    console.log(`Asunto: ${emailSubject}`)
    console.log(`Template usado: ${template.name} (${template.templateType})`)
    console.log(`Contenido: ${emailContent.substring(0, 100)}...`)

    return {
      success: true,
      templateId: template.id,
      templateName: template.name
    }

  } catch (error) {
    console.error('Error al enviar email de registro:', error)
    throw error
  }
}

// Ejemplo 2: Crear un template personalizado heredado
export async function createCustomWelcomeTemplate(
  tenantId: string,
  businessIdentityId: string,
  customizations: {
    companyColors?: { primary: string; secondary: string }
    customMessage?: string
    logoUrl?: string
  }
) {
  try {
    // 1. Buscar el template base
    const baseTemplate = await findBestTemplate({
      tenantId,
      businessIdentityId,
      category: EmailCategory.REGISTRATION
    })

    if (!baseTemplate) {
      throw new Error('No se encontró template base para personalizar')
    }

    // 2. Crear personalizaciones
    const customHtmlContent = customizations.logoUrl 
      ? baseTemplate.htmlContent.replace(
          '{{businessName}}',
          `<img src="${customizations.logoUrl}" alt="Logo" style="max-height: 60px; margin-bottom: 20px;">` +
          '<br>{{businessName}}'
        )
      : baseTemplate.htmlContent

    const customizations_data = {
      htmlContent: customHtmlContent,
      metadata: {
        customColors: customizations.companyColors,
        customMessage: customizations.customMessage,
        logoUrl: customizations.logoUrl
      }
    }

    // 3. Crear template heredado personalizado
    const customTemplate = await createInheritedTemplate(
      baseTemplate.id,
      customizations_data,
      {
        name: `Bienvenida Personalizada - ${businessIdentityId}`,
        tenantId,
        businessIdentityId,
        isDefault: true
      }
    )

    console.log(`✅ Template personalizado creado: ${customTemplate.name}`)
    return customTemplate

  } catch (error) {
    console.error('Error al crear template personalizado:', error)
    throw error
  }
}

// Ejemplo 3: Actualizar personalizaciones de un template existente
export async function updateBusinessBranding(
  templateId: string,
  newBranding: {
    primaryColor?: string
    secondaryColor?: string
    logoUrl?: string
    footerText?: string
  }
) {
  try {
    const updatedTemplate = await updateTemplateCustomizations(templateId, {
      metadata: {
        branding: newBranding,
        lastBrandingUpdate: new Date().toISOString()
      }
    })

    console.log(`✅ Branding actualizado para template: ${updatedTemplate.name}`)
    return updatedTemplate

  } catch (error) {
    console.error('Error al actualizar branding:', error)
    throw error
  }
}

// Utilidad para reemplazar variables en templates
function replaceTemplateVariables(content: string, variables: Record<string, string>): string {
  let result = content

  Object.entries(variables).forEach(([key, value]) => {
    const placeholder = `{{${key}}}`
    result = result.replace(new RegExp(placeholder, 'g'), value)
  })

  return result
}

// Ejemplo de uso en un API endpoint
export async function handleRegistrationEndpoint(req: any, res: any) {
  try {
    const { tenantId, businessIdentityId, clientEmail, clientName } = req.body

    const result = await sendRegistrationEmail(
      tenantId,
      businessIdentityId,
      clientEmail,
      clientName
    )

    res.json({
      success: true,
      message: 'Email de registro enviado correctamente',
      data: result
    })

  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error al enviar email de registro',
      error: error instanceof Error ? error.message : 'Error desconocido'
    })
  }
}