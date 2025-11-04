import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';

// Tipo para una variable de template
type TemplateVariable = {
  key: string;
  description: string;
  example: string;
  category: string;
};

// Variables globales disponibles en todos los templates
export const GLOBAL_VARIABLES: Record<string, TemplateVariable> = {
  // Variables del cliente
  clientName: {
    key: '{{clientName}}',
    description: 'Nombre completo del cliente',
    example: 'Juan Pérez',
    category: 'cliente'
  },
  clientEmail: {
    key: '{{clientEmail}}',
    description: 'Email del cliente',
    example: 'juan.perez@email.com',
    category: 'cliente'
  },
  clientPhone: {
    key: '{{clientPhone}}',
    description: 'Teléfono del cliente',
    example: '+502 1234-5678',
    category: 'cliente'
  },
  clientAddress: {
    key: '{{clientAddress}}',
    description: 'Dirección del cliente',
    example: 'Ciudad de Guatemala, Guatemala',
    category: 'cliente'
  },
  
  // Variables del evento
  eventTitle: {
    key: '{{eventTitle}}',
    description: 'Título o nombre del evento',
    example: 'Celebración de Aniversario',
    category: 'evento'
  },
  eventDate: {
    key: '{{eventDate}}',
    description: 'Fecha del evento',
    example: '15 de diciembre de 2024',
    category: 'evento'
  },
  eventTime: {
    key: '{{eventTime}}',
    description: 'Hora de inicio del evento',
    example: '18:00',
    category: 'evento'
  },
  eventDuration: {
    key: '{{eventDuration}}',
    description: 'Duración estimada del evento',
    example: '4 horas',
    category: 'evento'
  },
  roomName: {
    key: '{{roomName}}',
    description: 'Nombre de la sala o espacio',
    example: 'Salón Principal',
    category: 'evento'
  },
  locationName: {
    key: '{{locationName}}',
    description: 'Nombre del local o venue',
    example: 'Plexo Events',
    category: 'evento'
  },
  
  // Variables de la cotización
  quoteNumber: {
    key: '{{quoteNumber}}',
    description: 'Número de cotización',
    example: 'COT-2024-001',
    category: 'cotizacion'
  },
  quoteDate: {
    key: '{{quoteDate}}',
    description: 'Fecha de creación de la cotización',
    example: '10 de diciembre de 2024',
    category: 'cotizacion'
  },
  subtotal: {
    key: '{{subtotal}}',
    description: 'Subtotal de la cotización',
    example: 'Q 2,500.00',
    category: 'cotizacion'
  },
  discount: {
    key: '{{discount}}',
    description: 'Descuento aplicado',
    example: 'Q 250.00',
    category: 'cotizacion'
  },
  total: {
    key: '{{total}}',
    description: 'Total de la cotización',
    example: 'Q 2,250.00',
    category: 'cotizacion'
  },
  validUntil: {
    key: '{{validUntil}}',
    description: 'Fecha de vencimiento de la cotización',
    example: '15 de enero de 2025',
    category: 'cotizacion'
  },
  
  // Variables de la empresa
  businessName: {
    key: '{{businessName}}',
    description: 'Nombre de la empresa',
    example: 'Plexo',
    category: 'empresa'
  },
  businessPhone: {
    key: '{{businessPhone}}',
    description: 'Teléfono de la empresa',
    example: '+502 2345-6789',
    category: 'empresa'
  },
  businessEmail: {
    key: '{{businessEmail}}',
    description: 'Email de la empresa',
    example: 'info@plexo.app',
    category: 'empresa'
  },
  businessAddress: {
    key: '{{businessAddress}}',
    description: 'Dirección de la empresa',
    example: 'Ciudad de Guatemala, Guatemala',
    category: 'empresa'
  },
  businessLogo: {
    key: '{{businessLogo}}',
    description: 'URL del logo de la empresa',
    example: 'https://ejemplo.com/logo.png',
    category: 'empresa'
  },
  businessSlogan: {
    key: '{{businessSlogan}}',
    description: 'Eslogan de la empresa',
    example: 'Hacemos tus eventos inolvidables',
    category: 'empresa'
  },
  
  // Variables dinámicas
  currentDate: {
    key: '{{currentDate}}',
    description: 'Fecha actual',
    example: '10 de diciembre de 2024',
    category: 'dinamicas'
  },
  currentTime: {
    key: '{{currentTime}}',
    description: 'Hora actual',
    example: '14:30',
    category: 'dinamicas'
  },
  currentUser: {
    key: '{{currentUser}}',
    description: 'Usuario que genera la cotización',
    example: 'María González',
    category: 'dinamicas'
  },
};

// Variables de paquetes (array)
export const PACKAGE_VARIABLES = {
  packages: {
    key: '{{#each packages}}',
    description: 'Lista de paquetes (usar con #each)',
    example: '{{#each packages}}{{name}}{{/each}}',
    category: 'paquetes',
    subVariables: {
      packageName: {
        key: '{{name}}',
        description: 'Nombre del paquete',
        example: 'Paquete Básico'
      },
      packageDescription: {
        key: '{{description}}',
        description: 'Descripción del paquete',
        example: 'Incluye servicios esenciales'
      },
      packageSubtotal: {
        key: '{{subtotal}}',
        description: 'Subtotal del paquete',
        example: 'Q 1,100.00'
      },
      packageItems: {
        key: '{{#each items}}',
        description: 'Items del paquete (usar con #each)',
        example: '{{#each items}}{{name}}{{/each}}',
        subVariables: {
          itemName: {
            key: '{{name}}',
            description: 'Nombre del item',
            example: 'Decoración básica'
          },
          itemQuantity: {
            key: '{{quantity}}',
            description: 'Cantidad del item',
            example: '2'
          },
          itemUnitPrice: {
            key: '{{unitPrice}}',
            description: 'Precio unitario',
            example: 'Q 300.00'
          },
          itemTotalPrice: {
            key: '{{totalPrice}}',
            description: 'Precio total del item',
            example: 'Q 600.00'
          }
        }
      }
    }
  }
};

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.tenantId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const format = searchParams.get('format') || 'grouped';

    let variables = GLOBAL_VARIABLES;
    
    // Filtrar por categoría si se especifica
    if (category) {
      variables = Object.fromEntries(
        Object.entries(GLOBAL_VARIABLES).filter(
          ([_, variable]) => variable.category === category
        )
      );
    }

    // Formatear respuesta
    if (format === 'flat') {
      // Lista plana con solo las claves
      const flatVariables = Object.values(variables).map(v => v.key);
      return NextResponse.json({
        variables: flatVariables,
        count: flatVariables.length,
      });
    }

    // Respuesta agrupada por categorías
    const groupedVariables = Object.entries(variables).reduce((acc, [name, variable]) => {
      const category = variable.category;
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push({
        name,
        ...variable,
      });
      return acc;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      variables: groupedVariables,
      packageVariables: PACKAGE_VARIABLES,
      categories: Object.keys(groupedVariables),
      totalCount: Object.keys(variables).length,
      examples: {
        basicTemplate: `
<h1>{{businessName}}</h1>
<h2>Cotización {{quoteNumber}}</h2>
<p><strong>Cliente:</strong> {{clientName}}</p>
<p><strong>Evento:</strong> {{eventTitle}}</p>
<p><strong>Fecha:</strong> {{eventDate}} a las {{eventTime}}</p>
<p><strong>Total:</strong> {{total}}</p>
        `.trim(),
        
        withPackages: `
<h1>{{businessName}}</h1>
<h2>Cotización {{quoteNumber}}</h2>
<p><strong>Cliente:</strong> {{clientName}}</p>

<h3>Paquetes:</h3>
{{#each packages}}
<div class="package">
  <h4>{{name}}</h4>
  <p>{{description}}</p>
  <ul>
    {{#each items}}
    <li>{{name}} - Cantidad: {{quantity}} - Total: {{totalPrice}}</li>
    {{/each}}
  </ul>
  <p><strong>Subtotal: {{subtotal}}</strong></p>
</div>
{{/each}}

<p><strong>Total General: {{total}}</strong></p>
        `.trim(),
      },
      handlebarsHelpers: {
        formatCurrency: 'Formatear moneda: {{formatCurrency total}}',
        formatDate: 'Formatear fecha: {{formatDate eventDate}}',
        uppercase: 'Texto en mayúsculas: {{uppercase clientName}}',
        lowercase: 'Texto en minúsculas: {{lowercase eventTitle}}',
      }
    });

  } catch (error) {
    console.error('Error fetching template variables:', error);
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    );
  }
}
