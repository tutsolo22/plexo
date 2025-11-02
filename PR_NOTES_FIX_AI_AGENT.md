Resumen corto de la rama `fix/ai-agent-sidebar`

Cambios aplicados en este branch:

- AIAgent:
  - Se añadió persistencia de la conversación en localStorage para evitar que el widget pierda el historial tras remounts en modo Dev/Strict.
  - Se montó el asistente globalmente desde `src/components/providers.tsx` para que flote en todas las páginas.
  - Se implementó minimizado/maximizado y se agregó la posibilidad de arrastrar el widget (drag). 
  - Se corrigió un error de JSX (etiqueta `div` sin cerrar) en `src/components/ai-agent.tsx` que rompía la compilación.

- Recursos / Integraciones:
  - Componente cliente `ResourcesClient` añadido y conectado a `/api/configurations` para guardar WhatsApp y MercadoPago por tenant.

- Flujo de activación / usuarios:
  - `POST /api/users` ahora permite crear usuarios sin contraseña y genera un `activationCode` enviado por email para que el usuario establezca su contraseña.
  - Endpoints de activación (`/api/auth/activate`) y página cliente para validar token y establecer contraseña implementados.

Decisiones importantes y pendientes:

- Dejo los errores de tipo TypeScript para un PR separado (decisión del equipo para mantener este PR enfocado en cambios funcionales). Errores detectados con `npx tsc --noEmit`:
  - `src/app/api/emails/test/route.ts`: uso de `result.error` cuando el tipo actual no lo incluye.
  - Varios `implicit any` en: `src/app/auth/login/page.tsx`, `src/app/auth/signin/page.tsx`, `src/components/auth/AuthForm.tsx`.

  Estos son cambios de tipado/firmas pequeños y pueden corregirse en una PR de limpieza de types.

Próximos pasos recomendados (para la siguiente PR):

1. Corregir los `implicit any` y ajustar la firma de `useEffect` en `login/page.tsx`.
2. Ajustar el tipo/resultado del test de envío de correos o el manejador para exponer `error` cuando falle.
3. Ejecutar linter y `npx tsc --noEmit` hasta que pase.
4. Revisar el flujo de activación en entorno de staging (comprobar env vars SMTP y links).

Notas de verificación local:

- Ejecuté `npx tsc --noEmit` y la compilación dejó de fallar por el AIAgent. Quedan los errores de types listados arriba.
- Recomiendo que la corrección de tipos se aplique antes de mergear si el equipo quiere pasar CI sin fallos de tipo, o se haga en un PR independiente si se quiere mantener este PR enfocado en comportamiento.

Si quieres, aplico ahora las correcciones TypeScript menores en este branch; de lo contrario procedo a actualizar la PR con una nota corta y esperar tu confirmación para mergear.

Nota adicional:
- He creado un archivo con un cuerpo listo para el PR en `.github/PR_BODY_FIX_AI_AGENT.md` — puedes copiar/pegar su contenido directamente en el cuerpo del PR draft para dejar la descripción completa y las instrucciones de prueba.
