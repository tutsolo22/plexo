# Configuración de Proveedores de IA

Este documento explica cómo configurar y usar los diferentes proveedores de IA en el asistente flotante.

## Proveedores Disponibles

1. **Local** - Respuestas predefinidas sin llamadas externas (no requiere configuración)
2. **OpenAI** - Usa GPT-4o-mini a través de `/api/ai/real`
3. **Google** - Usa Gemini 2.5 Flash a través de `/api/ai/google`

## Variables de Entorno Requeridas

### Para OpenAI (ya configurado)
```env
OPENAI_API_KEY=tu_api_key_de_openai
```

### Para Google AI (nuevo)
```env
# API Key de Google AI Studio
GOOGLE_API_KEY=tu_api_key_de_google

# Opcional: especificar modelo (por defecto usa gemini-2.5-flash)
GOOGLE_AI_MODEL=gemini-2.5-flash
```

### Para controlar el segundo agente en dashboard
```env
# Si quieres que aparezca un segundo agente en /dashboard (además del global)
NEXT_PUBLIC_ENABLE_SECOND_AI=true
```

## Cómo Obtener las API Keys

### OpenAI
1. Ve a https://platform.openai.com/api-keys
2. Crea una nueva API key
3. Copia y pega en tu `.env.local`

### Google AI
1. Ve a https://makersuite.google.com/app/apikey (o https://aistudio.google.com/)
2. Crea un nuevo proyecto si no tienes uno
3. Genera una API key
4. Copia y pega en tu `.env.local`

## Características Implementadas

### Historial Compartido
- **El historial de conversación se mantiene** cuando cambias de proveedor
- Los últimos 10 mensajes se envían como contexto en cada llamada
- Esto permite que cada modelo "continúe" la conversación anterior

### Selector de Proveedor
- En el header del asistente hay un selector dropdown
- Puedes cambiar entre Local/OpenAI/Google en cualquier momento
- El cambio es inmediato sin perder el historial

### Persistencia en Cliente
- Toda la conversación se guarda en `localStorage` (key: `plexo_ai_messages`)
- Sobrevive a recargas de página y cambios de ruta
- Puedes limpiar la conversación con el botón "C"

## Endpoints de API

### `/api/ai/real` (OpenAI)
**Request:**
```json
{
  "message": "tu mensaje actual",
  "history": [
    { "role": "user", "content": "mensaje anterior 1" },
    { "role": "assistant", "content": "respuesta anterior 1" },
    ...
  ],
  "sessionId": "opcional"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "respuesta del asistente",
    "conversationId": "real-ai-123456",
    "platform": "web",
    "metadata": {
      "model": "gpt-4o-mini",
      "timestamp": "2025-10-29T...",
      "tokensUsed": 450,
      "relevantDataTypes": ["events", "clients"],
      "historyLength": 10
    }
  }
}
```

### `/api/ai/google` (Google Gemini)
**Request:**
```json
{
  "prompt": "tu mensaje actual",
  "history": [
    { "role": "user", "content": "mensaje anterior 1" },
    { "role": "assistant", "content": "respuesta anterior 1" },
    ...
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "message": "respuesta del asistente",
    "conversationId": "google-ai-123456",
    "platform": "web",
    "metadata": {
      "model": "gemini-2.5-flash",
      "timestamp": "2025-10-29T...",
      "provider": "google",
      "historyLength": 10
    }
  }
}
```

## Pruebas en Desarrollo

1. Copia `.env.local.example` a `.env.local` (si no existe)
2. Añade las API keys necesarias
3. Reinicia el servidor de desarrollo: `npm run dev`
4. Abre el asistente flotante (botón en la esquina inferior derecha)
5. Selecciona el proveedor que quieres probar en el dropdown
6. Envía mensajes y observa las respuestas

## Pruebas en Producción

**IMPORTANTE:** Antes de mergear a main o desplegar:

1. Verifica que las env vars estén configuradas en tu plataforma de hosting (Vercel/Cloud Run/etc.)
2. Usa valores de producción (no uses API keys de desarrollo/testing en producción)
3. Configura rate limiting si es necesario (especialmente para Google que puede tener cuotas más bajas)
4. Monitorea el uso de tokens/costos en los dashboards de OpenAI y Google

## Troubleshooting

### Error: "Google API Key no configurada"
- Verifica que `GOOGLE_API_KEY` esté presente en `.env.local` o en las variables de entorno del servidor
- Reinicia el servidor después de añadir la variable

### Error: "Límite de uso alcanzado"
- Has excedido la cuota gratuita de Google AI
- Revisa tu uso en https://console.cloud.google.com/
- Considera actualizar tu plan o esperar al siguiente periodo de facturación

### Error: "API key no válida"
- Verifica que la API key sea correcta y esté activa
- Para Google: asegúrate de que la API "Generative Language API" esté habilitada en tu proyecto
- Para OpenAI: verifica que la key no haya expirado

### El historial no se mantiene
- Abre las DevTools del navegador y verifica que no haya errores en la consola
- Verifica que localStorage esté habilitado (puede estar bloqueado en modo incógnito)
- Limpia la conversación con el botón "C" y reinicia

## Modelos Disponibles

### OpenAI (en `/api/ai/real`)
- Actualmente usa: `gpt-4o-mini` (más económico y rápido)
- Puedes cambiarlo a `gpt-4` o `gpt-3.5-turbo` editando el archivo

### Google (en `/api/ai/google`)
- Por defecto: `gemini-2.5-flash` (modelo más reciente)
- Puedes configurar otro modelo vía env var: `GOOGLE_AI_MODEL=gemini-2.5-pro`
- Modelos disponibles: `gemini-2.5-flash`, `gemini-2.5-pro`, `gemini-2.0-flash`, `gemini-flash-latest`
- Más info: https://ai.google.dev/models/gemini

## Costos Estimados (referencia)

### OpenAI gpt-4o-mini
- Input: ~$0.15 / 1M tokens
- Output: ~$0.60 / 1M tokens
- Una conversación típica (10 mensajes): ~$0.001 - $0.005

### Google Gemini Pro
- Gratis hasta cierto límite (consulta https://ai.google.dev/pricing)
- Después: ~$0.00025 / 1K caracteres (input) y ~$0.0005 / 1K caracteres (output)

## Siguientes Pasos (opcional)

- [ ] Añadir streaming de respuestas (para que los tokens aparezcan uno a uno)
- [ ] Implementar rate limiting por usuario
- [ ] Guardar conversaciones en base de datos para análisis posterior
- [ ] Añadir más proveedores (Anthropic Claude, Llama, etc.)
- [ ] Implementar función calling/tools para que el asistente pueda buscar datos reales en la BD
