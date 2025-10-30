# Actualización Agente IA - Integración Google Gemini 2.5

## 📋 Resumen de Cambios

Esta actualización incluye mejoras significativas al componente flotante de Asistente IA:

### ✨ Nuevas Características

1. **Componente Redimensionable**
   - El asistente flotante ahora puede ajustar su tamaño dinámicamente
   - Límites: Mínimo 320x400px, Máximo 800x900px
   - Icono visual de redimensión en esquina inferior derecha
   - Las conversaciones se ajustan automáticamente al nuevo tamaño

2. **Contexto de Usuario con NextAuth**
   - El agente reconoce al usuario autenticado
   - Saludo personalizado con nombre del usuario
   - Mensajes adaptados según el rol del usuario:
     - **SUPER_ADMIN**: Acceso completo a CRUD de todos los módulos
     - **ADMIN**: Gestión de eventos y configuración
     - **MANAGER**: Gestión operativa
     - **USER**: Consultas de información

3. **Actualización a Google Gemini 2.5**
   - Migración de modelos obsoletos (`gemini-pro`, `gemini-1.5-flash`)
   - Implementación de modelos actuales:
     - `gemini-2.5-flash` (predeterminado, más rápido)
     - `gemini-2.5-pro` (más potente)
     - `gemini-2.0-flash` (alternativa)
   - Uso directo de REST API v1beta (sin SDK)
   - Cliente centralizado en `src/lib/ai/google-ai-client.ts`

## 🔧 Cambios Técnicos

### Archivos Modificados

#### Componente Principal
- **`src/components/ai-agent.tsx`**
  - ✅ Integración de `useSession` para contexto de usuario
  - ✅ Estado de tamaño dinámico con límites
  - ✅ Funciones de redimensión (`startResize`, `onResize`, `endResize`)
  - ✅ Manejador visual de redimensión con icono `GripVertical`
  - ✅ Scroll área adaptable al tamaño del contenedor
  - ✅ Saludos personalizados por rol

#### Cliente Google AI
- **`src/lib/ai/google-ai-client.ts`**
  - ✅ Manejo automático del prefijo `models/` en nombres de modelo
  - ✅ Uso de API v1beta (única versión que soporta Gemini actualmente)
  - ✅ Métodos: `generateContent()`, `generateContentWithHistory()`, `embedContent()`
  - ✅ Modelo predeterminado: `gemini-2.5-flash`

#### Configuración AI
- **`src/lib/ai/index.ts`**
  - ✅ AI_CONFIG actualizado: modelos `gemini-2.5-flash` para CRM y WhatsApp

#### Endpoints API
- **`src/app/api/ai/google/route.ts`**
  - ✅ Uso directo de REST API (sin SDK)
  - ✅ Modelo `gemini-2.5-flash`
  - ✅ Soporte de historial de conversación

- **`src/app/api/ai/gemini/route.ts`**
  - ✅ Actualizado a `gemini-2.5-flash`

- **`src/app/api/ai/test/providers/route.ts`**
  - ✅ Lista de modelos actualizada
  - ✅ Endpoint de prueba con modelo correcto

- **`src/app/api/ai/test/api-panel/route.ts`**
  - ✅ Array de modelos: `['gemini-2.5-flash', 'gemini-2.5-pro', 'gemini-2.0-flash']`

#### Agentes AI
Todos los agentes actualizados para usar el cliente centralizado:
- **`src/lib/ai/whatsapp-agent.ts`** - Análisis de intención WhatsApp
- **`src/lib/ai/crm-agent.ts`** - Operaciones CRM con function calling
- **`src/lib/ai/crm-agent-v2.ts`** - Agente CRM simplificado
- **`src/lib/ai/crm-embeddings.ts`** - Búsqueda semántica

#### Documentación
- **`AI_PROVIDERS_SETUP.md`**
  - ✅ Actualizado con modelos Gemini 2.5
  - ✅ Variables de entorno actualizadas
  - ✅ Referencias a modelos obsoletos eliminadas

## 🐛 Problemas Resueltos

### Issue #1: Modelos Obsoletos
**Problema**: Errores 404 al usar `gemini-pro` y `gemini-1.5-flash`
```
Error: models/gemini-1.5-flash is not found for API version v1beta
```

**Solución**:
- Actualización a modelos Gemini 2.5
- Uso correcto del prefijo `models/` en nombres
- Migración a API v1beta (única que soporta Gemini actualmente)

### Issue #2: SDK con API Version Hardcoded
**Problema**: El SDK `@google/generative-ai` usaba v1beta internamente sin opción de cambio

**Solución**:
- Desinstalación completa del SDK
- Implementación de cliente REST directo
- Control total sobre versión de API y endpoints

### Issue #3: Componente Estático
**Problema**: El asistente flotante tenía tamaño fijo (420x520px), dificultando seguimiento de conversaciones largas

**Solución**:
- Sistema de redimensión con límites (320-800px ancho, 400-900px alto)
- Scroll automático ajustado al contenedor
- Persistencia visual del tamaño durante la sesión

### Issue #4: Falta de Contexto de Usuario
**Problema**: El agente no reconocía al usuario autenticado ni sus permisos

**Solución**:
- Integración con NextAuth `useSession`
- Saludos personalizados por rol
- Base para futuras funciones CRUD conscientes de permisos

## 📦 Dependencias

### Removidas
```json
"@google/generative-ai": "^0.21.0" // ❌ Removido - usamos REST API directa
```

### Variables de Entorno Requeridas
```env
# Google AI
GOOGLE_API_KEY=tu_api_key_aqui
GOOGLE_AI_MODEL=gemini-2.5-flash # Opcional, este es el predeterminado

# OpenAI (ya existente)
OPENAI_API_KEY=tu_api_key_aqui

# Control de segundo agente (opcional)
NEXT_PUBLIC_ENABLE_SECOND_AI=true
```

## 🧪 Cómo Probar

### 1. Redimensión del Componente
```bash
# Iniciar servidor de desarrollo
npm run dev

# En navegador: http://localhost:3200
# 1. Abrir el asistente flotante (ícono Bot)
# 2. Arrastrar desde esquina inferior derecha para redimensionar
# 3. Verificar que conversaciones se ajustan al nuevo tamaño
```

### 2. Contexto de Usuario
```bash
# 1. Iniciar sesión con diferentes roles
# 2. Abrir asistente flotante
# 3. Verificar saludo personalizado según rol
```

### 3. Google Gemini 2.5
```bash
# Probar endpoint directo
curl -X POST http://localhost:3200/api/ai/google \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hola, ¿qué puedes hacer?",
    "history": []
  }'

# Probar desde UI
# 1. Seleccionar provider "Google" en dropdown
# 2. Enviar mensaje
# 3. Verificar respuesta de Gemini 2.5
```

### 4. Test de Proveedores
```bash
# Endpoint de prueba
curl -X POST http://localhost:3200/api/ai/test/providers \
  -H "Content-Type: application/json" \
  -d '{"provider": "google"}'
```

## 📝 Notas Importantes

### API v1 vs v1beta
Actualmente Google AI REST API v1 **NO soporta modelos Gemini**. Solo la versión v1beta tiene soporte completo. Por eso todos los endpoints usan v1beta:

```typescript
const url = `https://generativelanguage.googleapis.com/v1beta/${modelName}:generateContent`;
```

### Nombres de Modelos
Los modelos **DEBEN** incluir el prefijo `models/`:
- ✅ Correcto: `models/gemini-2.5-flash`
- ❌ Incorrecto: `gemini-2.5-flash`

El cliente `GoogleAIClient` maneja esto automáticamente.

### Modelos Disponibles (29 Oct 2025)
- `gemini-2.5-flash` ⭐ (recomendado, rápido)
- `gemini-2.5-pro` (más potente)
- `gemini-2.0-flash` (alternativa)
- `gemini-flash-latest` (siempre última versión flash)

Modelos **obsoletos** (no usar):
- ❌ `gemini-pro`
- ❌ `gemini-1.5-flash`
- ❌ `gemini-1.5-pro`

## 🔜 Trabajo Futuro

### Pendiente de Implementación
- [ ] Pasar rol de usuario a endpoints API para respuestas conscientes de permisos
- [ ] Implementar limitación de funciones CRUD según rol
- [ ] Agregar función calling para consultas reales a BD según permisos
- [ ] Streaming de respuestas (tokens uno a uno)
- [ ] Persistencia de conversaciones en base de datos
- [ ] Rate limiting por usuario

### Consideraciones
- El contexto de usuario está en el frontend, falta propagarlo a las respuestas del backend
- Las funciones CRUD del agente deben verificar permisos antes de ejecutar

## 👥 Créditos

**Branch**: `fix/ai-agent-sidebar`  
**Fecha**: 29 de Octubre, 2025  
**Versión**: 1.1.0

## 📚 Referencias

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Documentation](https://ai.google.dev/docs)
- [NextAuth.js](https://next-auth.js.org/)
- [Documentación del Proyecto](./AI_PROVIDERS_SETUP.md)
