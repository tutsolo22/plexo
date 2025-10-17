import Handlebars from 'handlebars';

// Registro de helpers de Handlebars
Handlebars.registerHelper('formatCurrency', function(amount: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP'
  }).format(amount);
});

Handlebars.registerHelper('formatDate', function(date: string | Date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

Handlebars.registerHelper('formatDateTime', function(date: string | Date) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('es-CL', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
});

export interface QuoteEmailData {
  quote: {
    id: string;
    quoteNumber: string;
    title?: string;
    description?: string;
    total: number;
    validUntil: string;
    createdAt: string;
  };
  client: {
    name: string;
    email: string;
    phone?: string;
  };
  event?: {
    title: string;
    startDate: string;
    endDate: string;
    location?: string;
  };
  packages: Array<{
    name: string;
    description?: string;
    subtotal: number;
    items?: Array<{
      name: string;
      description?: string;
      quantity: number;
      unitPrice: number;
      totalPrice: number;
    }>;
  }>;
  company: {
    name: string;
    email: string;
    phone?: string;
    website?: string;
    address?: string;
  };
  tracking?: {
    token: string;
    trackingUrl: string;
  };
}

// Plantilla básica - Simple y limpia
const basicTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{quote.title}}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: #2563eb; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
        .content { background: #f8f9fa; padding: 20px; border: 1px solid #e9ecef; }
        .footer { background: #6c757d; color: white; padding: 15px; text-align: center; border-radius: 0 0 8px 8px; font-size: 14px; }
        .quote-details { background: white; padding: 15px; margin: 15px 0; border-radius: 4px; border-left: 4px solid #2563eb; }
        .package { background: white; padding: 10px; margin: 10px 0; border-radius: 4px; border: 1px solid #dee2e6; }
        .total { background: #e7f3ff; padding: 15px; margin: 15px 0; border-radius: 4px; text-align: center; font-size: 18px; font-weight: bold; }
        .btn { display: inline-block; padding: 12px 24px; background: #2563eb; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; }
        .btn:hover { background: #1d4ed8; }
    </style>
</head>
<body>
    <div class="header">
        <h1>{{company.name}}</h1>
        <h2>{{quote.title}}</h2>
    </div>

    <div class="content">
                <p>Estimado/a <strong>{{client.name}}</strong>,</p>
        
        <p>Nos complace enviarle la cotización solicitada para su evento. A continuación encontrará todos los detalles:</p>

        <div class="quote-details">
            <h3>Detalles de la Cotización</h3>
            <p><strong>Número:</strong> {{quote.quoteNumber}}</p>
            <p><strong>Fecha:</strong> {{formatDate quote.createdAt}}</p>
            <p><strong>Válida hasta:</strong> {{formatDate quote.validUntil}}</p>
            {{#if quote.description}}
            <p><strong>Descripción:</strong> {{quote.description}}</p>
            {{/if}}
        </div>

        {{#if event}}
        <div class="quote-details">
            <h3>Información del Evento</h3>
            <p><strong>Evento:</strong> {{event.title}}</p>
            <p><strong>Fecha:</strong> {{formatDateTime event.startDate}}</p>
            {{#if event.location}}
            <p><strong>Ubicación:</strong> {{event.location}}</p>
            {{/if}}
        </div>
        {{/if}}

        <h3>Paquetes y Servicios</h3>
        {{#each packages}}
        <div class="package">
            <h4>{{name}} (x{{quantity}})</h4>
            {{#if description}}
            <p>{{description}}</p>
            {{/if}}
            <p><strong>Precio unitario:</strong> {{formatCurrency price}}</p>
            <p><strong>Subtotal:</strong> {{formatCurrency (multiply price quantity)}}</p>
        </div>
        {{/each}}

        {{#if adjustments}}
        <h3>Ajustes</h3>
        {{#each adjustments}}
        <div class="package">
            <p><strong>{{description}}:</strong> {{#if (eq type 'discount')}}-{{else}}+{{/if}}{{formatCurrency amount}}</p>
        </div>
        {{/each}}
        {{/if}}

        <div class="total">
            <p>Total: {{formatCurrency quote.total}}</p>
        </div>

        <p style="text-align: center; margin: 30px 0;">
            <a href="{{tracking.trackingUrl}}" class="btn">Ver Cotización Detallada</a>
        </p>

        <p>Si tiene alguna pregunta o desea realizar modificaciones, no dude en contactarnos.</p>
        
        <p>¡Esperamos poder ser parte de su evento especial!</p>

        <p>Saludos cordiales,<br>
        Equipo de {{company.name}}</p>
    </div>

    <div class="footer">
        <p>{{company.name}}</p>
        {{#if company.phone}}<p>📞 {{company.phone}}</p>{{/if}}
        {{#if company.email}}<p>✉️ {{company.email}}</p>{{/if}}
        {{#if company.website}}<p>🌐 {{company.website}}</p>{{/if}}
    </div>

    {{#if tracking}}
    <img src="{{tracking.trackingUrl}}" width="1" height="1" style="display:none;" alt="">
    {{/if}}
</body>
</html>
`;

// Plantilla profesional - Diseño empresarial elegante
const professionalTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{quote.title}} - {{company.name}}</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Georgia', serif; line-height: 1.6; color: #2c3e50; background: #f8f9fa; }
        .container { max-width: 700px; margin: 0 auto; background: white; box-shadow: 0 0 20px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px 30px; position: relative; }
        .header::after { content: ''; position: absolute; bottom: -10px; left: 0; right: 0; height: 10px; background: linear-gradient(90deg, #667eea, #764ba2); clip-path: polygon(0 0, 100% 0, 95% 100%, 5% 100%); }
        .logo { font-size: 28px; font-weight: bold; margin-bottom: 10px; }
        .quote-title { font-size: 20px; opacity: 0.9; }
        .content { padding: 30px; }
        .greeting { font-size: 18px; color: #34495e; margin-bottom: 25px; }
        .section { margin: 30px 0; }
        .section-title { color: #667eea; font-size: 20px; font-weight: bold; margin-bottom: 15px; padding-bottom: 5px; border-bottom: 2px solid #667eea; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin: 20px 0; }
        .info-item { background: #f8f9fa; padding: 15px; border-radius: 8px; border-left: 4px solid #667eea; }
        .info-label { font-weight: bold; color: #555; display: block; margin-bottom: 5px; }
        .package-card { background: linear-gradient(145deg, #ffffff, #f0f0f0); border: 1px solid #e0e0e0; border-radius: 12px; padding: 20px; margin: 15px 0; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
        .package-header { display: flex; justify-content: between; align-items: center; margin-bottom: 10px; }
        .package-name { font-size: 18px; font-weight: bold; color: #2c3e50; }
        .package-price { font-size: 16px; color: #667eea; font-weight: bold; }
        .package-description { color: #7f8c8d; margin: 8px 0; }
        .items-list { background: #f8f9fa; border-radius: 6px; padding: 10px; margin-top: 10px; }
        .item { display: flex; justify-content: space-between; padding: 5px 0; border-bottom: 1px solid #ecf0f1; }
        .item:last-child { border-bottom: none; }
        .adjustment { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 10px; margin: 5px 0; }
        .adjustment.discount { background: #d1ecf1; border-color: #bee5eb; }
        .total-section { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 25px; border-radius: 12px; text-align: center; margin: 30px 0; }
        .total-amount { font-size: 32px; font-weight: bold; margin: 10px 0; }
        .cta-section { text-align: center; margin: 40px 0; }
        .btn { display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 15px 30px; text-decoration: none; border-radius: 25px; font-weight: bold; font-size: 16px; box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4); transition: transform 0.3s; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6); }
        .footer { background: #2c3e50; color: #ecf0f1; padding: 30px; text-align: center; }
        .footer-content { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; }
        .footer-section h4 { color: #667eea; margin-bottom: 10px; }
        .contact-info { display: flex; align-items: center; margin: 5px 0; }
        .contact-info::before { content: ''; width: 16px; height: 16px; margin-right: 8px; background-size: contain; }
        .phone::before { content: '📞'; }
        .email::before { content: '✉️'; }
        .website::before { content: '🌐'; }
        .address::before { content: '📍'; }
        @media (max-width: 600px) {
            .container { margin: 0; }
            .header { padding: 20px; }
            .content { padding: 20px; }
            .info-grid { grid-template-columns: 1fr; }
            .package-header { flex-direction: column; align-items: start; }
            .footer-content { grid-template-columns: 1fr; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="logo">{{company.name}}</div>
            <div class="quote-title">{{quote.title}}</div>
        </div>

        <div class="content">
            <div class="greeting">
                Estimado/a {{client.name}},
            </div>

            <p>Esperamos que se encuentre muy bien. Nos complace presentarle nuestra propuesta detallada para su evento. Hemos preparado cuidadosamente esta cotización considerando todos sus requerimientos.</p>

            <div class="section">
                <div class="section-title">Información de la Cotización</div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Número de Cotización</span>
                        {{quote.quoteNumber}}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Fecha de Emisión</span>
                        {{formatDate quote.createdAt}}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Válida Hasta</span>
                        {{formatDate quote.validUntil}}
                    </div>
                    {{#if event}}
                    <div class="info-item">
                        <span class="info-label">Fecha del Evento</span>
                        {{formatDateTime event.startDate}}
                    </div>
                    {{/if}}
                </div>
                {{#if quote.description}}
                <div class="info-item">
                    <span class="info-label">Descripción</span>
                    {{quote.description}}
                </div>
                {{/if}}
            </div>

            {{#if event}}
            <div class="section">
                <div class="section-title">Detalles del Evento</div>
                <div class="info-item">
                    <span class="info-label">Nombre del Evento</span>
                    {{event.title}}
                </div>
                <div class="info-grid">
                    <div class="info-item">
                        <span class="info-label">Fecha de Inicio</span>
                        {{formatDateTime event.startDate}}
                    </div>
                    <div class="info-item">
                        <span class="info-label">Fecha de Finalización</span>
                        {{formatDateTime event.endDate}}
                    </div>
                </div>
                {{#if event.location}}
                <div class="info-item">
                    <span class="info-label">Ubicación</span>
                    {{event.location}}
                </div>
                {{/if}}
            </div>
            {{/if}}

            <div class="section">
                <div class="section-title">Paquetes de Servicios</div>
                {{#each packages}}
                <div class="package-card">
                    <div class="package-header">
                        <div class="package-name">{{name}}</div>
                        <div class="package-price">{{formatCurrency subtotal}}</div>
                    </div>
                    {{#if description}}
                    <div class="package-description">{{description}}</div>
                    {{/if}}
                    {{#if items}}
                    <div class="items-list">
                        <strong>Incluye:</strong>
                        {{#each items}}
                        <div class="item">
                            <span>{{name}} (x{{quantity}})</span>
                            <span>{{formatCurrency unitPrice}}</span>
                        </div>
                        {{/each}}
                    </div>
                    {{/if}}
                    <div style="text-align: right; margin-top: 15px; font-weight: bold; color: #667eea;">
                        Subtotal: {{formatCurrency (multiply price quantity)}}
                    </div>
                </div>
                {{/each}}
            </div>

            {{#if adjustments}}
            <div class="section">
                <div class="section-title">Ajustes y Descuentos</div>
                {{#each adjustments}}
                <div class="adjustment {{#if (eq type 'discount')}}discount{{/if}}">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <span>{{description}}</span>
                        <span style="font-weight: bold;">
                            {{#if (eq type 'discount')}}-{{else}}+{{/if}}{{formatCurrency amount}}
                        </span>
                    </div>
                </div>
                {{/each}}
            </div>
            {{/if}}

            <div class="total-section">
                <div style="font-size: 18px; opacity: 0.9;">Total de la Cotización</div>
                <div class="total-amount">{{formatCurrency quote.total}}</div>
                <div style="font-size: 14px; opacity: 0.8;">Impuestos incluidos</div>
            </div>

            <div class="cta-section">
                <a href="{{tracking.trackingUrl}}" class="btn">Ver Cotización Completa</a>
                <p style="margin-top: 15px; color: #7f8c8d; font-size: 14px;">
                    Haga clic para ver la cotización detallada y opciones de aceptación
                </p>
            </div>

            <div class="section">
                <p>Esta propuesta ha sido elaborada especialmente para usted, considerando la importancia y particularidades de su evento. Estamos comprometidos en brindarle un servicio de excelencia que supere sus expectativas.</p>
                
                <p>Si desea realizar alguna modificación o tiene alguna consulta adicional, nuestro equipo está disponible para atenderle. Nos encantaría poder ser parte de este momento especial.</p>

                <p style="margin-top: 20px;">Quedamos a la espera de su pronta respuesta.</p>

                <p style="margin-top: 20px;"><strong>Cordialmente,</strong><br>
                Equipo Comercial<br>
                {{company.name}}</p>
            </div>
        </div>

        <div class="footer">
            <div class="footer-content">
                <div class="footer-section">
                    <h4>Contacto</h4>
                    {{#if company.phone}}<div class="contact-info phone">{{company.phone}}</div>{{/if}}
                    {{#if company.email}}<div class="contact-info email">{{company.email}}</div>{{/if}}
                    {{#if company.website}}<div class="contact-info website">{{company.website}}</div>{{/if}}
                </div>
                {{#if company.address}}
                <div class="footer-section">
                    <h4>Ubicación</h4>
                    <div class="contact-info address">{{company.address}}</div>
                </div>
                {{/if}}
                <div class="footer-section">
                    <h4>Síguenos</h4>
                    <p>Mantente al día con nuestros eventos y promociones especiales.</p>
                </div>
            </div>
            <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #34495e; text-align: center; font-size: 12px; opacity: 0.7;">
                © {{currentYear}} {{company.name}}. Todos los derechos reservados.
            </div>
        </div>
    </div>

    {{#if tracking}}
    <img src="{{tracking.trackingUrl}}" width="1" height="1" style="display:none;" alt="">
    {{/if}}
</body>
</html>
`;

// Plantilla personalizada - Diseño moderno y creativo
const customTemplate = `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>{{quote.title}} - {{company.name}}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Poppins', sans-serif; line-height: 1.6; color: #2d3748; background: #f7fafc; }
        .container { max-width: 800px; margin: 20px auto; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); position: relative; overflow: hidden; }
        .header-content { position: relative; z-index: 2; padding: 40px 30px; color: white; }
        .header-bg { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 300"><polygon fill="%23ffffff" fill-opacity="0.05" points="0,100 50,120 100,100 150,130 200,110 250,140 300,120 350,150 400,130 450,160 500,140 550,170 600,150 650,180 700,160 750,190 800,170 850,200 900,180 950,210 1000,190 1000,300 0,300"/></svg>') repeat-x; opacity: 0.1; }
        .company-name { font-size: 32px; font-weight: 700; margin-bottom: 8px; }
        .quote-subtitle { font-size: 18px; opacity: 0.9; font-weight: 300; }
        .content { padding: 40px 30px; }
        .client-greeting { background: linear-gradient(135deg, #edf2f7, #e2e8f0); border-radius: 15px; padding: 25px; margin-bottom: 30px; border-left: 5px solid #667eea; }
        .client-name { font-size: 24px; font-weight: 600; color: #2d3748; margin-bottom: 10px; }
        .greeting-text { color: #4a5568; }
        .section { margin: 40px 0; }
        .section-header { display: flex; align-items: center; margin-bottom: 20px; }
        .section-icon { width: 40px; height: 40px; background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin-right: 15px; color: white; font-size: 18px; }
        .section-title { font-size: 22px; font-weight: 600; color: #2d3748; }
        .info-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 20px; margin: 20px 0; }
        .info-card { background: linear-gradient(135deg, #f7fafc, #edf2f7); border-radius: 12px; padding: 20px; border: 1px solid #e2e8f0; transition: transform 0.3s; }
        .info-card:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(0,0,0,0.1); }
        .info-label { font-size: 12px; text-transform: uppercase; font-weight: 600; color: #718096; margin-bottom: 5px; letter-spacing: 0.5px; }
        .info-value { font-size: 16px; font-weight: 500; color: #2d3748; }
        .package-container { display: grid; gap: 20px; }
        .package { background: white; border: 2px solid #e2e8f0; border-radius: 16px; overflow: hidden; transition: all 0.3s; }
        .package:hover { border-color: #667eea; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.15); }
        .package-header { background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 20px; }
        .package-title { font-size: 20px; font-weight: 600; margin-bottom: 5px; }
        .package-subtitle { opacity: 0.9; font-size: 14px; }
        .package-content { padding: 20px; }
        .package-description { color: #4a5568; margin-bottom: 15px; }
        .package-items { background: #f7fafc; border-radius: 8px; padding: 15px; margin: 15px 0; }
        .package-items-title { font-weight: 600; color: #2d3748; margin-bottom: 10px; }
        .item-row { display: flex; justify-content: space-between; align-items: center; padding: 8px 0; border-bottom: 1px solid #e2e8f0; }
        .item-row:last-child { border-bottom: none; }
        .item-name { color: #4a5568; }
        .item-price { font-weight: 500; color: #2d3748; }
        .package-total { text-align: right; padding: 15px 20px; background: #f7fafc; border-top: 1px solid #e2e8f0; }
        .package-price { font-size: 18px; font-weight: 600; color: #667eea; }
        .adjustments-container { display: grid; gap: 10px; }
        .adjustment { border-radius: 10px; padding: 15px; display: flex; justify-content: space-between; align-items: center; }
        .adjustment.discount { background: #c6f6d5; border: 1px solid #9ae6b4; color: #276749; }
        .adjustment.surcharge { background: #fed7d7; border: 1px solid #fbb6ce; color: #742a2a; }
        .adjustment-description { font-weight: 500; }
        .adjustment-amount { font-weight: 600; font-size: 16px; }
        .total-container { background: linear-gradient(135deg, #667eea, #764ba2); border-radius: 20px; padding: 40px; text-align: center; color: white; margin: 40px 0; position: relative; overflow: hidden; }
        .total-container::before { content: ''; position: absolute; top: -50%; left: -50%; width: 200%; height: 200%; background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px); background-size: 20px 20px; animation: float 20s linear infinite; }
        .total-label { font-size: 16px; opacity: 0.9; margin-bottom: 10px; }
        .total-amount { font-size: 48px; font-weight: 700; margin-bottom: 10px; }
        .total-note { font-size: 14px; opacity: 0.8; }
        .cta-container { text-align: center; margin: 50px 0; }
        .cta-button { display: inline-block; background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 18px 40px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 16px; box-shadow: 0 8px 25px rgba(102, 126, 234, 0.3); transition: all 0.3s; }
        .cta-button:hover { transform: translateY(-3px); box-shadow: 0 15px 35px rgba(102, 126, 234, 0.4); }
        .cta-description { margin-top: 15px; color: #718096; font-size: 14px; }
        .message-section { background: linear-gradient(135deg, #f7fafc, #edf2f7); border-radius: 15px; padding: 30px; margin: 40px 0; border-left: 5px solid #667eea; }
        .footer { background: #2d3748; color: #a0aec0; padding: 40px 30px; }
        .footer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 30px; }
        .footer-section h4 { color: #667eea; font-weight: 600; margin-bottom: 15px; }
        .footer-item { display: flex; align-items: center; margin-bottom: 10px; }
        .footer-icon { margin-right: 10px; }
        .footer-bottom { margin-top: 30px; padding-top: 20px; border-top: 1px solid #4a5568; text-align: center; font-size: 12px; opacity: 0.7; }
        @keyframes float { 0% { transform: translate(-50%, -50%) rotate(0deg); } 100% { transform: translate(-50%, -50%) rotate(360deg); } }
        @media (max-width: 768px) {
            .container { margin: 10px; border-radius: 15px; }
            .header-content, .content { padding: 20px; }
            .info-cards { grid-template-columns: 1fr; }
            .total-amount { font-size: 36px; }
            .cta-button { padding: 15px 30px; font-size: 14px; }
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <div class="header-bg"></div>
            <div class="header-content">
                <div class="company-name">{{company.name}}</div>
                <div class="quote-subtitle">{{quote.title}}</div>
            </div>
        </div>

        <div class="content">
            <div class="client-greeting">
                <div class="client-name">¡Hola {{client.name}}!</div>
                <div class="greeting-text">
                    Estamos emocionados de presentarte nuestra propuesta personalizada. Hemos diseñado esta cotización pensando en hacer de tu evento una experiencia inolvidable.
                </div>
            </div>

            <div class="section">
                <div class="section-header">
                    <div class="section-icon">📋</div>
                    <div class="section-title">Detalles de tu Cotización</div>
                </div>
                
                <div class="info-cards">
                    <div class="info-card">
                        <div class="info-label">Número de Cotización</div>
                        <div class="info-value">{{quote.quoteNumber}}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Fecha de Creación</div>
                        <div class="info-value">{{formatDate quote.createdAt}}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Válida Hasta</div>
                        <div class="info-value">{{formatDate quote.validUntil}}</div>
                    </div>
                    {{#if event}}
                    <div class="info-card">
                        <div class="info-label">Fecha del Evento</div>
                        <div class="info-value">{{formatDateTime event.startDate}}</div>
                    </div>
                    {{/if}}
                </div>

                {{#if quote.description}}
                <div class="info-card" style="margin-top: 20px;">
                    <div class="info-label">Descripción</div>
                    <div class="info-value">{{quote.description}}</div>
                </div>
                {{/if}}
            </div>

            {{#if event}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">🎉</div>
                    <div class="section-title">Tu Evento Especial</div>
                </div>
                
                <div class="info-cards">
                    <div class="info-card">
                        <div class="info-label">Nombre del Evento</div>
                        <div class="info-value">{{event.title}}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Fecha de Inicio</div>
                        <div class="info-value">{{formatDateTime event.startDate}}</div>
                    </div>
                    <div class="info-card">
                        <div class="info-label">Fecha de Finalización</div>
                        <div class="info-value">{{formatDateTime event.endDate}}</div>
                    </div>
                    {{#if event.location}}
                    <div class="info-card">
                        <div class="info-label">Ubicación</div>
                        <div class="info-value">{{event.location}}</div>
                    </div>
                    {{/if}}
                </div>
            </div>
            {{/if}}

            <div class="section">
                <div class="section-header">
                    <div class="section-icon">📦</div>
                    <div class="section-title">Paquetes de Servicios</div>
                </div>
                
                <div class="package-container">
                    {{#each packages}}
                    <div class="package">
                        <div class="package-header">
                            <div class="package-title">{{name}}</div>
                            <div class="package-subtitle">Cantidad: {{quantity}}</div>
                        </div>
                        
                        <div class="package-content">
                            {{#if description}}
                            <div class="package-description">{{description}}</div>
                            {{/if}}
                            
                            {{#if items}}
                            <div class="package-items">
                                <div class="package-items-title">Servicios incluidos:</div>
                                {{#each items}}
                                <div class="item-row">
                                    <span class="item-name">{{name}} (x{{quantity}})</span>
                                    <span class="item-price">{{formatCurrency unitPrice}}</span>
                                </div>
                                {{/each}}
                            </div>
                            {{/if}}
                        </div>
                        
                        <div class="package-total">
                            <div class="package-price">{{formatCurrency subtotal}}</div>
                        </div>
                    </div>
                    {{/each}}
                </div>
            </div>

            {{#if adjustments}}
            <div class="section">
                <div class="section-header">
                    <div class="section-icon">⚖️</div>
                    <div class="section-title">Ajustes Especiales</div>
                </div>
                
                <div class="adjustments-container">
                    {{#each adjustments}}
                    <div class="adjustment {{type}}">
                        <span class="adjustment-description">{{description}}</span>
                        <span class="adjustment-amount">
                            {{#if (eq type 'discount')}}-{{else}}+{{/if}}{{formatCurrency amount}}
                        </span>
                    </div>
                    {{/each}}
                </div>
            </div>
            {{/if}}

            <div class="total-container">
                <div class="total-label">Total de tu Inversión</div>
                <div class="total-amount">{{formatCurrency quote.total}}</div>
                <div class="total-note">Precio final con todos los servicios incluidos</div>
            </div>

            <div class="cta-container">
                <a href="{{tracking.trackingUrl}}" class="cta-button">Ver Propuesta Completa</a>
                <div class="cta-description">
                    Accede a tu cotización detallada y opciones de confirmación
                </div>
            </div>

            <div class="message-section">
                <p style="margin-bottom: 15px;">
                    <strong>¿Por qué elegirnos?</strong>
                </p>
                <p style="margin-bottom: 15px;">
                    En {{company.name}}, nos especializamos en crear experiencias únicas e inolvidables. Cada detalle de tu evento será cuidadosamente planificado y ejecutado por nuestro equipo de profesionales.
                </p>
                <p style="margin-bottom: 15px;">
                    Esta propuesta ha sido diseñada exclusivamente para ti, y estamos listos para adaptarla según tus necesidades específicas.
                </p>
                <p>
                    <strong>¡Estamos aquí para hacer realidad la celebración de tus sueños!</strong>
                </p>
            </div>
        </div>

        <div class="footer">
            <div class="footer-grid">
                <div class="footer-section">
                    <h4>Contacto Directo</h4>
                    {{#if company.phone}}
                    <div class="footer-item">
                        <span class="footer-icon">📞</span>
                        {{company.phone}}
                    </div>
                    {{/if}}
                    {{#if company.email}}
                    <div class="footer-item">
                        <span class="footer-icon">✉️</span>
                        {{company.email}}
                    </div>
                    {{/if}}
                    {{#if company.website}}
                    <div class="footer-item">
                        <span class="footer-icon">🌐</span>
                        {{company.website}}
                    </div>
                    {{/if}}
                </div>
                
                {{#if company.address}}
                <div class="footer-section">
                    <h4>Nuestra Ubicación</h4>
                    <div class="footer-item">
                        <span class="footer-icon">📍</span>
                        {{company.address}}
                    </div>
                </div>
                {{/if}}
                
                <div class="footer-section">
                    <h4>Síguenos</h4>
                    <p>Mantente conectado con nosotros para ver nuestros últimos eventos y obtener inspiración para el tuyo.</p>
                </div>
            </div>
            
            <div class="footer-bottom">
                © {{currentYear}} {{company.name}}. Creando momentos inolvidables desde el corazón.
            </div>
        </div>
    </div>

    {{#if tracking}}
    <img src="{{tracking.trackingUrl}}" width="1" height="1" style="display:none;" alt="">
    {{/if}}
</body>
</html>
`;

// Registrar helper adicional para multiplicación
Handlebars.registerHelper('multiply', function(a: number, b: number) {
  return a * b;
});

Handlebars.registerHelper('eq', function(a: any, b: any) {
  return a === b;
});

Handlebars.registerHelper('currentYear', function() {
  return new Date().getFullYear();
});

export const emailTemplates = {
  basic: {
    name: 'Plantilla Básica',
    description: 'Diseño simple y profesional',
    template: basicTemplate
  },
  professional: {
    name: 'Plantilla Profesional',
    description: 'Diseño empresarial elegante',
    template: professionalTemplate
  },
  custom: {
    name: 'Plantilla Personalizada',
    description: 'Diseño moderno y creativo',
    template: customTemplate
  }
};

export type EmailTemplateType = keyof typeof emailTemplates;

export function renderEmailTemplate(
  templateType: EmailTemplateType,
  data: QuoteEmailData
): string {
  const template = emailTemplates[templateType];
  if (!template) {
    throw new Error(`Plantilla de email '${templateType}' no encontrada`);
  }

  const compiledTemplate = Handlebars.compile(template.template);
  return compiledTemplate(data);
}

export function getAvailableTemplates() {
  return Object.entries(emailTemplates).map(([key, template]) => ({
    id: key,
    name: template.name,
    description: template.description
  }));
}