# Configuración SMTP para Testing de Emails

## Variables de Entorno Requeridas

Para testing con Gmail (recomendado):

```env
# Email Configuration - Gmail
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password
SMTP_FROM=tu-email@gmail.com

# Tracking Configuration
EMAIL_TRACKING_PIXEL_URL=http://localhost:3200/api/emails/track
```

## Pasos para Configurar Gmail:

### 1. Habilitar 2FA en Gmail
- Ve a tu cuenta de Google
- Habilita la verificación en 2 pasos

### 2. Generar App Password
- Ve a "Contraseñas de aplicaciones"
- Genera una nueva contraseña para "Mail"
- Usa esta contraseña en `SMTP_PASS`

### 3. Configuración Alternativa - Outlook
```env
# Email Configuration - Outlook
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@outlook.com
SMTP_PASS=tu-password
SMTP_FROM=tu-email@outlook.com
```

## Testing de Funcionalidades Email

### Endpoint de Configuración
- **URL**: `http://localhost:3200/dashboard/emails/config`
- **Funcionalidad**: Configurar SMTP desde la UI
- **Testing**: Botón "Test Connection"

### Endpoint de Dashboard
- **URL**: `http://localhost:3200/dashboard/emails`
- **Funcionalidad**: Ver estadísticas y logs
- **Testing**: Filtros y búsqueda

### API Testing
```bash
# Test SMTP Connection
curl -X GET http://localhost:3200/api/emails/test

# Enviar Email de Prueba
curl -X POST http://localhost:3200/api/emails/test \
  -H "Content-Type: application/json" \
  -d '{
    "to": "destinatario@example.com",
    "subject": "Test Email",
    "message": "Esto es un email de prueba"
  }'
```

## Usuarios de Prueba

### Usuario Admin
- **Email**: admin@gestioneventos.com
- **Password**: admin123
- **Roles**: Todos los permisos

### Usuario Manager  
- **Email**: manager@gestioneventos.com
- **Password**: manager123
- **Roles**: Gestión de eventos y cotizaciones

## Checklist de Testing

### ✅ Autenticación
- [ ] Login con usuarios de prueba
- [ ] Protección de rutas
- [ ] Sesiones persistentes

### ✅ Dashboard Principal
- [ ] Estadísticas generales
- [ ] Navegación por módulos
- [ ] Responsive design

### ✅ Gestión de Clientes
- [ ] Crear nuevo cliente
- [ ] Editar cliente existente
- [ ] Lista con filtros
- [ ] Vista detalle

### ✅ Gestión de Eventos
- [ ] Crear nuevo evento
- [ ] Calendario de eventos
- [ ] Editar evento
- [ ] Integración con cotizaciones

### ✅ Sistema de Cotizaciones
- [ ] Crear cotización desde evento
- [ ] Editor de cotización
- [ ] Cálculos automáticos
- [ ] Estados de cotización

### ✅ Generador de PDF
- [ ] Generar PDF desde cotización
- [ ] Probar diferentes engines
- [ ] Vista previa
- [ ] Descarga

### ✅ Sistema de Email
- [ ] Configurar SMTP
- [ ] Enviar cotización por email
- [ ] Tracking de apertura
- [ ] Dashboard de estadísticas

### ✅ Integración Completa
- [ ] Workflow: Evento → Cotización → PDF → Email
- [ ] Tracking completo
- [ ] Notificaciones

## URLs de Testing

- **Home**: http://localhost:3200
- **Login**: http://localhost:3200/auth/signin
- **Dashboard**: http://localhost:3200/dashboard
- **Clientes**: http://localhost:3200/dashboard/clients
- **Eventos**: http://localhost:3200/dashboard/events
- **Cotizaciones**: http://localhost:3200/dashboard/quotes
- **Plantillas**: http://localhost:3200/dashboard/templates
- **Emails**: http://localhost:3200/dashboard/emails
- **PDF Test**: http://localhost:3200/dashboard/pdf-test

## Notas de Testing

1. **Primero**: Configura SMTP en `/dashboard/emails/config`
2. **Segundo**: Prueba envío de email desde `/dashboard/quotes/[id]`
3. **Tercero**: Verifica tracking en `/dashboard/emails`
4. **Cuarto**: Prueba workflow completo

## Problemas Comunes

### SMTP No Conecta
- Verificar credenciales
- Verificar firewall/antivirus
- Probar con diferentes puertos

### Emails No Se Envían
- Verificar límites de envío del proveedor
- Verificar formato de email
- Revisar logs en consola

### Tracking No Funciona
- Verificar URL del pixel
- Verificar que el email sea HTML
- Verificar configuración del token