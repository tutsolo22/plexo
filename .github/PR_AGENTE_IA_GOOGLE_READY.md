# 🤖 Actualización Agente IA: Google Gemini 2.5 + UX Mejorada

## 📝 Descripción

Esta PR actualiza el componente flotante de Asistente IA con mejoras significativas en UX y migración completa a Google Gemini 2.5.

## ✨ Cambios Principales

### 1. 🎨 Componente Redimensionable
- El asistente flotante ahora puede ajustar su tamaño dinámicamente
- **Límites**: 320-800px (ancho) x 400-900px (alto)
- Icono visual de redimensión en esquina inferior derecha
- Scroll automático que se adapta al tamaño del contenedor
- **Soluciona**: Conversaciones largas que no se podían seguir por tamaño fijo

### 2. 👤 Contexto de Usuario con NextAuth
- Integración con `useSession` para reconocer usuario autenticado
- Saludos personalizados con nombre del usuario
- Mensajes adaptados según el rol:
  - **SUPER_ADMIN**: Información sobre CRUD completo de todos los módulos
  - **ADMIN**: Gestión de eventos y configuración
  - **MANAGER**: Gestión operativa
  - **USER**: Consultas básicas

### 3. 🚀 Migración a Google Gemini 2.5
- **Modelos actualizados**:
  - `gemini-2.5-flash` (predeterminado, más rápido)
  - `gemini-2.5-pro` (más potente)
  - `gemini-2.0-flash` (alternativa)
- **Removidos modelos obsoletos**:
  - ❌ `gemini-pro`
  - ❌ `gemini-1.5-flash`
  - ❌ `gemini-1.5-pro`

### 4. 🏗️ Arquitectura Mejorada
- Cliente centralizado `GoogleAIClient` en `src/lib/ai/google-ai-client.ts`
- Uso directo de REST API v1beta (control total de versiones)
- Desinstalación del SDK `@google/generative-ai` (limitaciones de versión)
- Todos los agentes AI actualizados (WhatsApp, CRM, Embeddings)

## 🐛 Problemas Resueltos

### ❌ Errores 404 con Modelos Obsoletos
**Antes**:
```
Error: models/gemini-1.5-flash is not found for API version v1beta
Error: models/gemini-pro is not found for API version v1
```

**Solución**:
- Actualización a modelos Gemini 2.5
- Uso correcto de prefijo `models/` en nombres
- API v1beta (única versión que soporta Gemini actualmente)

### 🔧 SDK con API Version Hardcoded
**Antes**: El SDK `@google/generative-ai` usaba v1beta internamente sin control

**Solución**: Cliente REST directo con control total sobre endpoints y versiones

### 📏 Componente con Tamaño Estático
**Antes**: 420x520px fijo, conversaciones largas no visibles

**Solución**: Sistema de redimensión con límites razonables y scroll adaptativo

## 📦 Archivos Modificados

### Componente Principal
- ✅ `src/components/ai-agent.tsx`
  - Integración `useSession`
  - Sistema de redimensión
  - Scroll adaptativo
  - Saludos personalizados

### Cliente y Configuración
- ✅ `src/lib/ai/google-ai-client.ts` - Cliente centralizado REST
- ✅ `src/lib/ai/index.ts` - AI_CONFIG actualizado

### Endpoints API
- ✅ `src/app/api/ai/google/route.ts`
- ✅ `src/app/api/ai/gemini/route.ts`
- ✅ `src/app/api/ai/test/providers/route.ts`
- ✅ `src/app/api/ai/test/api-panel/route.ts`

### Agentes AI
- ✅ `src/lib/ai/whatsapp-agent.ts`
- ✅ `src/lib/ai/crm-agent.ts`
- ✅ `src/lib/ai/crm-agent-v2.ts`
- ✅ `src/lib/ai/crm-embeddings.ts`

### Documentación
- ✅ `AI_PROVIDERS_SETUP.md` - Actualizado con Gemini 2.5
- ✅ `CHANGELOG.md` - Registro de cambios
- ✅ `ACTUALIZACION_AGENTE_IA_GOOGLE.md` - Documentación detallada

## 🧪 Testing

### Funcionalidad de Redimensión
```bash
npm run dev
# 1. Abrir http://localhost:3200
# 2. Clic en asistente flotante
# 3. Arrastrar esquina inferior derecha
# 4. Verificar scroll adapta al nuevo tamaño
```

### Contexto de Usuario
```bash
# 1. Iniciar sesión con diferentes roles
# 2. Abrir asistente
# 3. Verificar saludo personalizado
```

### Google Gemini 2.5
```bash
# Test directo
curl -X POST http://localhost:3200/api/ai/google \
  -H "Content-Type: application/json" \
  -d '{"message": "Hola", "history": []}'

# Test desde UI
# 1. Seleccionar provider "Google"
# 2. Enviar mensaje
# 3. Verificar respuesta
```

## 📋 Checklist

- [x] Componente redimensionable implementado
- [x] Scroll adaptativo funcionando
- [x] Integración con NextAuth completada
- [x] Saludos personalizados por rol
- [x] Migración a Gemini 2.5 completa
- [x] Cliente centralizado REST creado
- [x] Todos los agentes actualizados
- [x] SDK Google AI desinstalado
- [x] Documentación actualizada
- [x] CHANGELOG actualizado
- [x] Sin errores TypeScript
- [x] Pruebas manuales exitosas

## 🔜 Trabajo Futuro

- [ ] Propagar rol de usuario a respuestas API (permisos CRUD)
- [ ] Function calling con verificación de permisos
- [ ] Streaming de respuestas
- [ ] Persistencia de conversaciones en BD
- [ ] Rate limiting por usuario

## 📚 Documentación

Ver detalles completos en:
- `ACTUALIZACION_AGENTE_IA_GOOGLE.md` - Guía completa de cambios
- `AI_PROVIDERS_SETUP.md` - Configuración de proveedores
- `CHANGELOG.md` - Registro de versiones

## 🎯 Impacto

- **UX**: Mejora significativa en usabilidad del asistente
- **Performance**: Gemini 2.5 Flash más rápido que versiones anteriores
- **Mantenibilidad**: Cliente centralizado facilita actualizaciones futuras
- **Personalización**: Contexto de usuario permite experiencias adaptadas

## 🔗 Referencias

- [Google AI Studio](https://aistudio.google.com/)
- [Gemini API Docs](https://ai.google.dev/docs)
- [NextAuth.js](https://next-auth.js.org/)

---

**Branch**: `fix/ai-agent-sidebar`  
**Fecha**: 29 de Octubre, 2025  
**Review Ready**: ✅ Sí
