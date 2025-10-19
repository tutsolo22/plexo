import { PrismaClient, EmailTemplate, EmailCategory } from '@prisma/client';

const prisma = new PrismaClient();

export interface TemplateInheritanceOptions {
  tenantId: string;
  businessIdentityId?: string;
  category: EmailCategory;
  createIfNotFound?: boolean;
}

export interface TemplateCustomization {
  subject?: string;
  htmlContent?: string;
  textContent?: string;
  variables?: any;
  metadata?: any;
}

/**
 * Busca el template más específico disponible siguiendo la jerarquía de herencia:
 * 1. Template específico del Business Identity
 * 2. Template base del Business Identity
 * 3. Template base del Tenant
 * 4. Template global del sistema
 */
export async function findBestTemplate(
  options: TemplateInheritanceOptions
): Promise<EmailTemplate | null> {
  const { tenantId, businessIdentityId, category } = options;

  // 1. Buscar template específico del Business Identity (si se proporciona)
  if (businessIdentityId) {
    const businessTemplate = await prisma.emailTemplate.findFirst({
      where: {
        tenantId,
        businessIdentityId,
        category,
        isActive: true,
        templateType: { in: ['CUSTOM', 'INHERITED'] },
      },
      include: {
        parentTemplate: true,
      },
      orderBy: [{ isDefault: 'desc' }, { updatedAt: 'desc' }],
    });

    if (businessTemplate) {
      return businessTemplate;
    }

    // 1.5. Buscar template base del Business Identity
    const businessBaseTemplate = await prisma.emailTemplate.findFirst({
      where: {
        tenantId,
        businessIdentityId,
        category,
        isActive: true,
        templateType: 'BUSINESS_BASE',
      },
      include: {
        parentTemplate: true,
      },
    });

    if (businessBaseTemplate) {
      return businessBaseTemplate;
    }
  }

  // 2. Buscar template base del Tenant
  const tenantTemplate = await prisma.emailTemplate.findFirst({
    where: {
      tenantId,
      businessIdentityId: null,
      category,
      isActive: true,
      templateType: 'TENANT_BASE',
    },
    include: {
      parentTemplate: true,
    },
  });

  if (tenantTemplate) {
    return tenantTemplate;
  }

  // 3. Buscar template global del sistema
  const globalTemplate = await prisma.emailTemplate.findFirst({
    where: {
      category,
      isActive: true,
      templateType: 'GLOBAL',
      isGlobal: true,
    },
    include: {
      parentTemplate: true,
    },
  });

  return globalTemplate;
}

/**
 * Resuelve un template aplicando las personalizaciones de la herencia
 */
export async function resolveTemplate(
  template: EmailTemplate & { parentTemplate?: EmailTemplate | null }
): Promise<EmailTemplate> {
  // Si no tiene padre, devolver tal como está
  if (!template.parentTemplateId || !template.parentTemplate) {
    return template;
  }

  // Resolver el template padre recursivamente
  const resolvedParent = await resolveTemplate(template.parentTemplate);

  // Aplicar personalizaciones del template hijo sobre el padre
  const customizations = template.customizations as TemplateCustomization | null;

  return {
    ...template,
    subject: customizations?.subject || resolvedParent.subject,
    htmlContent: customizations?.htmlContent || resolvedParent.htmlContent,
    textContent: customizations?.textContent || resolvedParent.textContent,
    variables: customizations?.variables || resolvedParent.variables,
    metadata: {
      ...((resolvedParent.metadata as any) || {}),
      ...(customizations?.metadata || {}),
      ...((template.metadata as any) || {}),
    },
  };
}

/**
 * Crea un template heredado con personalizaciones
 */
export async function createInheritedTemplate(
  parentTemplateId: string,
  customizations: TemplateCustomization,
  options: {
    name: string;
    tenantId: string;
    businessIdentityId?: string;
    isDefault?: boolean;
  }
): Promise<EmailTemplate> {
  // Obtener el template padre
  const parentTemplate = await prisma.emailTemplate.findUnique({
    where: { id: parentTemplateId },
  });

  if (!parentTemplate) {
    throw new Error('Template padre no encontrado');
  }

  // Crear el template heredado
  const inheritedTemplate = await prisma.emailTemplate.create({
    data: {
      name: options.name,
      subject: parentTemplate.subject, // Se mantendrá el del padre, las personalizaciones van en customizations
      htmlContent: parentTemplate.htmlContent,
      textContent: parentTemplate.textContent,
      variables: parentTemplate.variables as any,
      category: parentTemplate.category,
      isDefault: options.isDefault || false,
      templateType: 'INHERITED',
      inheritanceLevel: (parentTemplate.inheritanceLevel || 0) + 1,
      parentTemplateId: parentTemplateId,
      customizations: customizations as any,
      tenantId: options.tenantId,
      businessIdentityId: options.businessIdentityId ?? null,
    },
    include: {
      parentTemplate: true,
    },
  });

  return inheritedTemplate;
}

/**
 * Actualiza las personalizaciones de un template heredado
 */
export async function updateTemplateCustomizations(
  templateId: string,
  customizations: TemplateCustomization
): Promise<EmailTemplate> {
  const template = await prisma.emailTemplate.findUnique({
    where: { id: templateId },
  });

  if (!template) {
    throw new Error('Template no encontrado');
  }

  if (template.templateType !== 'INHERITED') {
    throw new Error('Solo se pueden actualizar personalizaciones en templates heredados');
  }

  const existingCustomizations = (template.customizations as TemplateCustomization) || {};
  const mergedCustomizations = {
    ...existingCustomizations,
    ...customizations,
  };

  return await prisma.emailTemplate.update({
    where: { id: templateId },
    data: {
      customizations: mergedCustomizations,
      updatedAt: new Date(),
    },
    include: {
      parentTemplate: true,
    },
  });
}

/**
 * Obtiene la jerarquía completa de un template
 */
export async function getTemplateHierarchy(templateId: string): Promise<EmailTemplate[]> {
  const hierarchy: EmailTemplate[] = [];

  let currentTemplate = await prisma.emailTemplate.findUnique({
    where: { id: templateId },
    include: { parentTemplate: true },
  });

  while (currentTemplate) {
    hierarchy.push(currentTemplate);

    if (currentTemplate.parentTemplateId && currentTemplate.parentTemplate) {
      currentTemplate = await prisma.emailTemplate.findUnique({
        where: { id: currentTemplate.parentTemplateId },
        include: { parentTemplate: true },
      });
    } else {
      break;
    }
  }

  return hierarchy;
}

/**
 * Crea templates base para un nuevo tenant
 */
export async function createBaseTenantTemplates(tenantId: string): Promise<EmailTemplate[]> {
  const globalTemplates = await prisma.emailTemplate.findMany({
    where: {
      templateType: 'GLOBAL',
      isGlobal: true,
      isActive: true,
    },
  });

  const tenantTemplates: EmailTemplate[] = [];

  for (const globalTemplate of globalTemplates) {
    const tenantTemplate = await prisma.emailTemplate.create({
      data: {
        name: `${globalTemplate.name} - Base Tenant`,
        subject: globalTemplate.subject,
        htmlContent: globalTemplate.htmlContent,
        textContent: globalTemplate.textContent,
        variables: globalTemplate.variables as any,
        category: globalTemplate.category,
        isDefault: globalTemplate.isDefault,
        templateType: 'TENANT_BASE',
        inheritanceLevel: 1,
        parentTemplateId: globalTemplate.id,
        tenantId: tenantId,
      },
    });

    tenantTemplates.push(tenantTemplate);
  }

  return tenantTemplates;
}

/**
 * Crea templates base para una nueva business identity
 */
export async function createBaseBusinessTemplates(
  tenantId: string,
  businessIdentityId: string
): Promise<EmailTemplate[]> {
  const tenantTemplates = await prisma.emailTemplate.findMany({
    where: {
      tenantId,
      templateType: 'TENANT_BASE',
      isActive: true,
    },
  });

  const businessTemplates: EmailTemplate[] = [];

  for (const tenantTemplate of tenantTemplates) {
    const businessTemplate = await prisma.emailTemplate.create({
      data: {
        name: `${tenantTemplate.name} - Base Business`,
        subject: tenantTemplate.subject,
        htmlContent: tenantTemplate.htmlContent,
        textContent: tenantTemplate.textContent,
        variables: tenantTemplate.variables as any,
        category: tenantTemplate.category,
        isDefault: tenantTemplate.isDefault,
        templateType: 'BUSINESS_BASE',
        inheritanceLevel: 2,
        parentTemplateId: tenantTemplate.id,
        tenantId: tenantId,
        businessIdentityId: businessIdentityId,
      },
    });

    businessTemplates.push(businessTemplate);
  }

  return businessTemplates;
}
