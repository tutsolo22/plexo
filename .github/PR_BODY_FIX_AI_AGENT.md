### Título
Fix: AIAgent global, activación de usuarios y Resources (WhatsApp / MercadoPago)

### Resumen
Esta PR aplica cambios funcionales y de experiencia para la Iteration 2:

- Monta un asistente IA flotante globalmente y corrige pérdida de conversaciones.
- Permite que administradores creen usuarios sin contraseña; se genera un `activationCode` y se envía email para establecer la contraseña.
- Añade un cliente `Resources` para configurar WhatsApp y MercadoPago por tenant y persistirlo en `Configuration`.

Nota: Los errores de TypeScript menores (tipados/implicit any) fueron detectados y se dejarán para un PR de limpieza de tipos separado — ver `PR_NOTES_FIX_AI_AGENT.md`.

### Cambios principales (archivos)
- `src/components/ai-agent.tsx` — persistencia en localStorage, minimizado, drag y corrección de JSX.
- `src/components/providers.tsx` — monta el AIAgent globalmente.
- `src/app/api/users/route.ts` — permite crear usuarios sin password y genera `activationCode`.
- `src/app/api/auth/activate/route.ts` + `src/app/auth/activate/page.tsx` — endpoints y UI para validar token y establecer contraseña.
- `src/components/resources/ResourcesClient.tsx` + `src/app/dashboard/resources/page.tsx` — UI para guardar credenciales de WhatsApp y MercadoPago por tenant.
- `PR_NOTES_FIX_AI_AGENT.md` — notas del PR y lista de tareas pendientes.

### Como probar (resumen)
1. Levanta la app en dev: `npm run dev`.
2. Inicia sesión con el SUPER_ADMIN de seed (`soporteapps@hexalux.mx`) y verifica que el sidebar y `/dashboard` sean accesibles.
3. Interactúa con el asistente IA (botón flotante). La conversación debe persistir al navegar y tras hot-reloads.
4. Crear un usuario desde el panel de administración sin contraseña: revisar que el usuario reciba el `activationCode` (en dev revisa logs o el servicio de email configurado).
5. Ir a `/auth/activate?token=<activationCode>` y completar la contraseña; luego poder iniciar sesión.
6. Ir a Dashboard → Resources e ingresar credenciales de WhatsApp y MercadoPago; guardar y verificar que la API `/api/configurations` persista por tenant.

### Pendientes (separados en siguiente PR)
- Corregir errores TypeScript/typings detectados con `npx tsc --noEmit` (implicit any en forms y un `result.error` en el test de emails).
- Revisar y ajustar linter/CI para que el PR pase en pipelines.

### Notas
- Mantuvimos este PR enfocado en cambios funcionales y UX; los cambios de tipado se aplicarán en una PR de limpieza para facilitar review y reducir el riesgo.

---

Puedes copiar este contenido directamente en el cuerpo del PR o usarlo como base para editar el mensaje.
