Título: fix/ai-agent-conversation-preserve — Mantener conversación y mostrar sidebar

Resumen
-------
Este PR contiene cambios funcionales pequeños y seguros que solucionan dos problemas reportados:

1. El Asistente IA (componente `AIAgent`) perdía la conversación tras 2 interacciones debido a remounts en desarrollo (React StrictMode). Ahora:
   - Persiste mensajes en `localStorage` (`plexo_ai_messages`).
   - Evita re-inicializar el saludo si ya hay mensajes guardados.
   - Mejora UX: usa `onKeyDown` para `Enter` y vuelve a enfocar el input tras enviar.

2. El layout del dashboard no estaba envolviendo el contenido con el componente cliente de layout (el `DashboardLayout` con la barra lateral). Ahora el `src/app/dashboard/layout.tsx` envuelve `children` con `DashboardLayout` y corrige las rutas de redirección a `/auth/signin`.

Archivos modificados
--------------------
- src/components/ai-agent.tsx — Persistencia en localStorage, manejo de foco, evitar reset en remounts
- src/app/dashboard/layout.tsx — Renderiza `DashboardLayout` y corrige redirecciones a `/auth/signin`
- next.config.js — Eliminadas claves inválidas y corrección de comas en cacheGroups (evita warnings/syntax errors)

Notas de verificación (qué probar)
----------------------------------
1. Levantar servidor de desarrollo:

   npm run dev

2. En el navegador, abrir http://localhost:3200, iniciar sesión con el usuario de pruebas y abrir el Asistente IA.
3. Enviar 3–5 mensajes seguidos; verificar que:
   - Puedes seguir escribiendo después de cada respuesta del asistente.
   - La conversación persiste tras recargar la página (localStorage).
4. Verificar que el dashboard muestra la barra lateral en anchos >= `lg`.
5. Revisar `Network` → `/api/auth/session` debe devolver el objeto de sesión (no `null`) cuando estés autenticado.

Notas de despliegue / Cloud Run
------------------------------
- Asegurar variables de entorno en Cloud Run: `NEXTAUTH_URL`, `NEXTAUTH_SECRET`, `DATABASE_URL` y credenciales SMTP si aplica.
- Cookies: en producción usar `secure` cookies y el dominio correcto. NEXTAUTH_URL debe coincidir con el host público.

TypeScript
----------
- `npx tsc --noEmit` muestra errores TS en archivos previos (auth/email/login). No se corrigieron en este PR por petición: aplicar solo cambios funcionales. El `next.config.js` contiene `ignoreBuildErrors: true` para permitir builds a pesar de errores de tipo.

Checklist
---------
- [x] Cambios funcionales aplicados
- [x] Comprobaciones locales básicas realizadas (login programático + fetch de /dashboard)
- [x] Draft PR creado (este archivo)

Siguientes pasos sugeridos
-------------------------
- Revisar y hacer merge del PR en `main`.
- (Opcional) Corregir errores TypeScript en un PR separado para mantener el repo "type clean".

Descripción corta para el PR
----------------------------
Arregla el reset de la conversación del Asistente IA (persistencia en localStorage y control de inicialización) y asegura que el layout del dashboard renderiza la barra lateral; además limpia claves inválidas en `next.config.js` para evitar warnings en dev.
