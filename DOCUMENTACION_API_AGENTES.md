# Documentación de API - Sistema de Agentes de IA

## Descripción General

El sistema implementa un coordinador inteligente que gestiona múltiples agentes especializados para diferentes tipos de conversaciones:

- **CRM Agent**: Manejo de consultas relacionadas con clientes, eventos, cotizaciones
- **WhatsApp Agent**: Conversaciones casuales, detección de intención, escalación
- **Agent Coordinator**: Distribuye mensajes al agente más apropiado automáticamente

## Endpoints Disponibles

### 1. Chat Principal con Coordinador de Agentes
**Endpoint**: `POST /api/ai/chat`

**Descripción**: Endpoint principal que usa el coordinador para seleccionar automáticamente el agente más apropiado.

**Body**:
```json
{
  "message": "¿Puedes ayudarme con mi evento?",
  "conversationId": "opcional-uuid",
  "sessionId": "opcional-para-compatibilidad",
  "userId": "opcional-user-id",
  "platform": "web", // "web" | "whatsapp"
  "userPhone": "opcional-numero-telefono"
}
```

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "message": "Respuesta del agente seleccionado",
    "conversationId": "uuid-de-conversacion",
    "agent": "crm-agent", // o "whatsapp-agent"
    "escalated": false,
    "intent": "information_request",
    "confidence": 0.85,
    "results": { /* resultados específicos del agente */ },
    "platform": "web",
    "metadata": {
      "userRole": "USER",
      "tenantId": "tenant-uuid",
      "tenantName": "Nombre Empresa",
      "processingTime": 1234,
      "timestamp": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

### 2. Webhook de WhatsApp
**Endpoint**: `POST /api/ai/whatsapp/webhook`

**Descripción**: Recibe mensajes directamente desde WhatsApp Business API y los procesa automáticamente.

**Verificación (GET)**: `GET /api/ai/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE`

**Body para webhook oficial de WhatsApp**:
```json
{
  "entry": [{
    "id": "entry-id",
    "changes": [{
      "value": {
        "messaging_product": "whatsapp",
        "metadata": {
          "display_phone_number": "15551234567",
          "phone_number_id": "phone-id"
        },
        "messages": [{
          "from": "5215551234567",
          "id": "message-id",
          "timestamp": "1671234567",
          "type": "text",
          "text": {
            "body": "Hola, necesito ayuda"
          }
        }]
      },
      "field": "messages"
    }]
  }]
}
```

**Body para testing directo**:
```json
{
  "from": "5215551234567",
  "body": "Hola, necesito ayuda",
  "tenantId": "tenant-uuid",
  "type": "text"
}
```

**Variables de entorno requeridas**:
```env
WHATSAPP_VERIFY_TOKEN=tu_token_de_verificacion
WHATSAPP_PROVIDER=meta # o "twilio"
WHATSAPP_ACCESS_TOKEN=token_de_acceso
WHATSAPP_PHONE_NUMBER_ID=id_del_numero

# Para Twilio (alternativo)
TWILIO_ACCOUNT_SID=tu_account_sid
TWILIO_AUTH_TOKEN=tu_auth_token
TWILIO_WHATSAPP_NUMBER=+14155238886
```

### 3. Chat CRM Específico
**Endpoint**: `POST /api/ai/crm/chat`

**Descripción**: Endpoint específico que usa únicamente el CRM Agent (sin coordinador).

**Body**: Mismo formato que `/api/ai/chat`

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "message": "Respuesta del CRM Agent",
    "conversationId": "uuid",
    "agent": "crm-agent-v2",
    "intent": "client_search",
    "results": {
      "searchType": "clients",
      "clients": [/* resultados */]
    },
    "searchType": "clients",
    "platform": "web"
  }
}
```

### 4. Testing de Agentes
**Endpoint**: `POST /api/ai/test/agents`

**Descripción**: Endpoint para probar el funcionamiento de los agentes con escenarios predefinidos.

**Body**:
```json
{
  "message": "Mensaje personalizado", // Opcional si usas testScenario
  "tenantId": "test-tenant",
  "from": "test-user",
  "platform": "whatsapp", // "web" | "whatsapp"
  "testScenario": "simple-greeting" // Opcional
}
```

**Escenarios disponibles**:
- `simple-greeting`: Saludo básico para WhatsApp Agent
- `crm-query`: Consulta de CRM (clientes importantes)
- `complex-request`: Solicitud compleja (cotización detallada)
- `escalation`: Mensaje que requiere escalación
- `whatsapp-specific`: Mensaje típico de WhatsApp

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "test": {
      "scenario": "simple-greeting",
      "message": "¡Hola! ¿Cómo estás?",
      "platform": "whatsapp",
      "tenantId": "test-tenant",
      "from": "test-user"
    },
    "response": {
      "message": "¡Hola! Muy bien, gracias por preguntar...",
      "agent": "whatsapp-agent",
      "escalated": false,
      "confidence": 0.95,
      "intent": "greeting"
    },
    "performance": {
      "totalProcessingTime": 1500,
      "agentProcessingTime": 1200,
      "coordinatorOverhead": 300
    }
  }
}
```

### 5. Estadísticas del Sistema
**Endpoint**: `GET /api/ai/test/agents`

**Descripción**: Obtiene información del estado actual del sistema de agentes.

**Respuesta**:
```json
{
  "success": true,
  "data": {
    "agents": {
      "coordinator": "active",
      "crm": "active",
      "whatsapp": "active"
    },
    "system": {
      "uptime": 3661.234,
      "memory": {
        "rss": 52428800,
        "heapTotal": 29360128,
        "heapUsed": 23456789
      },
      "nodeVersion": "v18.17.0"
    },
    "endpoints": {
      "chat": "/api/ai/chat",
      "whatsappWebhook": "/api/ai/whatsapp/webhook",
      "crmChat": "/api/ai/crm/chat",
      "testAgents": "/api/ai/test/agents"
    }
  }
}
```

## Flujo de Decisión del Coordinador

```mermaid
graph TD
    A[Mensaje Entrante] --> B[Coordinador Analiza]
    B --> C{Plataforma?}
    C -->|WhatsApp| D[Analizar Complejidad]
    C -->|Web| E[Analizar Intención]
    D --> F{¿Es Complejo?}
    F -->|No| G[WhatsApp Agent]
    F -->|Sí| H[CRM Agent]
    E --> I{¿Es CRM Query?}
    I -->|Sí| H
    I -->|No| G
    G --> J[Respuesta Casual]
    H --> K[Respuesta Técnica]
    J --> L{¿Necesita Escalación?}
    L -->|Sí| M[Escalar a Humano]
    L -->|No| N[Respuesta Final]
    K --> N
    M --> N
```

## Ejemplos de Uso

### 1. Integración con Frontend Web
```javascript
// Enviar mensaje desde aplicación web
const response = await fetch('/api/ai/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer ' + token
  },
  body: JSON.stringify({
    message: "¿Cuáles son mis próximos eventos?",
    platform: "web"
  })
});

const result = await response.json();
console.log(`Agente usado: ${result.data.agent}`);
console.log(`Respuesta: ${result.data.message}`);
```

### 2. Configuración de Webhook en WhatsApp
```bash
# Configurar webhook en Meta Business
curl -X POST "https://graph.facebook.com/v18.0/{phone-number-id}/webhooks" \
  -H "Authorization: Bearer {access-token}" \
  -d "webhook_url=https://tu-dominio.com/api/ai/whatsapp/webhook" \
  -d "verify_token=tu_verify_token"
```

### 3. Testing de Agentes
```bash
# Probar con escenario de saludo
curl -X POST "https://tu-dominio.com/api/ai/test/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "testScenario": "simple-greeting",
    "platform": "whatsapp"
  }'

# Probar con mensaje personalizado
curl -X POST "https://tu-dominio.com/api/ai/test/agents" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Necesito una cotización urgente",
    "platform": "web",
    "tenantId": "mi-empresa"
  }'
```

## Errores Comunes y Soluciones

### 1. Error: "Agent not available"
- **Causa**: Problema con la inicialización de agentes
- **Solución**: Verificar variables de entorno `GOOGLE_API_KEY`

### 2. Error: "Tenant not found"
- **Causa**: TenantId inválido o no configurado
- **Solución**: Usar un tenantId válido o 'default' para testing

### 3. Error: "WhatsApp webhook verification failed"
- **Causa**: Token de verificación incorrecto
- **Solución**: Verificar `WHATSAPP_VERIFY_TOKEN` en variables de entorno

### 4. Error: "Unauthorized"
- **Causa**: Falta autenticación para endpoints protegidos
- **Solución**: Agregar header de autorización válido

## Configuración de Desarrollo

### Variables de Entorno Mínimas
```env
# API de Google AI
GOOGLE_API_KEY=tu_api_key_de_google

# Base de datos
DATABASE_URL="postgresql://user:pass@localhost:5432/eventos"

# WhatsApp (opcional para testing local)
WHATSAPP_VERIFY_TOKEN=mi_token_secreto
WHATSAPP_PROVIDER=mock # para development
```

### Comandos Útiles
```bash
# Probar conectividad de agentes
curl -X GET "http://localhost:3000/api/ai/test/agents"

# Simular mensaje de WhatsApp
curl -X POST "http://localhost:3000/api/ai/whatsapp/webhook" \
  -H "Content-Type: application/json" \
  -d '{
    "from": "5215551234567",
    "body": "Hola, es una prueba",
    "tenantId": "default"
  }'

# Chat normal con coordinador
curl -X POST "http://localhost:3000/api/ai/chat" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer tu_token" \
  -d '{
    "message": "¿Cómo están mis ventas?",
    "platform": "web"
  }'
```

---

## Próximos Pasos

1. **Métricas y Monitoreo**: Implementar `getStats()` en el coordinador
2. **Persistencia de Conversaciones**: Completar `deleteConversation()` en memoria
3. **Webhooks Adicionales**: Soporte para más proveedores de WhatsApp
4. **Rate Limiting**: Implementar límites de rate por tenant
5. **Logging Avanzado**: Structured logging para debugging

## Soporte

Para dudas técnicas o reportar issues, consulta la documentación del proyecto o crea un ticket en el repositorio.