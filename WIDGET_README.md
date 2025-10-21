# 🎯 Widget de Chat - Documentación de Instalación

## 📋 Descripción General

El **Widget de Chat** es un componente integrable que permite agregar un chatbot inteligente a cualquier sitio web. Utiliza la misma IA avanzada del sistema de gestión de eventos para proporcionar respuestas automáticas, gestionar reservas y ofrecer información sobre servicios.

## ✨ Características Principales

- 🤖 **IA Avanzada** - Respuestas inteligentes usando Google Gemini
- 🎨 **Personalizable** - Colores, mensajes y posición configurables
- 📱 **Responsive** - Funciona en desktop y móvil
- 🔒 **Seguro** - Autenticación por API Key con aislamiento por tenant
- 📊 **Analytics** - Métricas detalladas de uso y conversaciones
- 🚀 **Fácil Integración** - Solo un script para instalar

## 🛠️ Instalación Rápida

### Paso 1: Obtener API Key

1. Accede al panel de administración: `/admin/widget`
2. Ve a la pestaña **"Claves API"**
3. Crea una nueva clave API con nombre descriptivo
4. Copia la clave generada (formato: `widget_xxx...`)

### Paso 2: Configurar Widget

1. Ve a la pestaña **"Configuración"** en el panel admin
2. Personaliza:
   - **Mensaje de bienvenida**
   - **Colores primarios y secundarios**
   - **Nombre del negocio**
   - **Información de contacto**

### Paso 3: Integrar en tu Sitio Web

Agrega este código HTML en el `<head>` o antes del `</body>` de tu sitio web:

```html
<script src="https://tu-dominio.com/widget.js"></script>
<script>
  ChatWidget.init({
    apiKey: 'tu_api_key_aqui',
    baseUrl: 'https://tu-dominio.com',
    position: 'bottom-right', // 'bottom-right', 'bottom-left', 'top-right', 'top-left'
    primaryColor: '#3B82F6',   // Color principal (opcional)
    secondaryColor: '#F3F4F6'  // Color secundario (opcional)
  });
</script>
```

## ⚙️ Configuración Avanzada

### Opciones de Inicialización

```javascript
ChatWidget.init({
  // Requerido
  apiKey: 'widget_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // Tu clave API

  // Opcional
  baseUrl: 'https://tu-dominio.com',                 // URL base de la API
  position: 'bottom-right',                          // Posición del widget
  primaryColor: '#3B82F6',                           // Color principal
  secondaryColor: '#F3F4F6',                         // Color de fondo
  size: 'normal',                                    // 'small', 'normal', 'large'
  language: 'es'                                     // Idioma: 'es', 'en'
});
```

### Posiciones Disponibles

- `bottom-right` - Esquina inferior derecha (predeterminado)
- `bottom-left` - Esquina inferior izquierda
- `top-right` - Esquina superior derecha
- `top-left` - Esquina superior izquierda

## 🎨 Personalización Visual

### Colores
El widget usa un sistema de colores consistente:
- **Primary Color**: Botones, enlaces, elementos interactivos
- **Secondary Color**: Fondos, bordes, elementos secundarios

### Ejemplos de Configuración

```javascript
// Tema corporativo azul
ChatWidget.init({
  apiKey: 'tu_api_key',
  primaryColor: '#1E40AF',    // Azul corporativo
  secondaryColor: '#F8FAFC'   // Gris claro
});

// Tema moderno verde
ChatWidget.init({
  apiKey: 'tu_api_key',
  primaryColor: '#059669',    // Verde moderno
  secondaryColor: '#ECFDF5'   // Verde muy claro
});
```

## 🔧 Funcionalidades del Chatbot

### Capacidades de la IA

- **Información General**: Horarios, ubicación, servicios disponibles
- **Reservas**: Crear cotizaciones y reservas preliminares
- **Preguntas Frecuentes**: Respuestas automáticas a consultas comunes
- **Soporte**: Escalado a atención humana cuando es necesario

### Comandos Especiales

- `ayuda` - Muestra comandos disponibles
- `horarios` - Información de horarios de atención
- `servicios` - Lista de servicios disponibles
- `contacto` - Información de contacto
- `reservar` - Iniciar proceso de reserva

## 📊 Panel de Administración

### Gestión de Claves API

1. **Crear Claves**: Genera nuevas claves para diferentes sitios web
2. **Estado**: Activar/desactivar claves según necesites
3. **Límites**: Configurar límites de uso por clave
4. **Analytics**: Ver uso por clave API

### Configuración del Widget

- **Mensaje de Bienvenida**: Personaliza el saludo inicial
- **Información del Negocio**: Nombre, descripción, contacto
- **Colores**: Tema visual consistente
- **Comportamiento**: Configuraciones avanzadas

### Analytics y Métricas

- **Conversaciones Totales**: Número de chats iniciados
- **Mensajes Enviados**: Volumen de mensajes
- **Tasa de Conversión**: Chats que resultaron en reservas
- **Tiempo de Respuesta**: Métricas de rendimiento
- **Ubicación Geográfica**: Origen de los visitantes

## 🔒 Seguridad y Privacidad

### Autenticación
- **API Keys**: Cada integración requiere una clave única
- **Tenant Isolation**: Datos completamente aislados por empresa
- **Rate Limiting**: Protección contra abuso

### Privacidad de Datos
- **No se almacenan datos sensibles** del sitio web huésped
- **Conversaciones encriptadas** en tránsito y reposo
- **Cumplimiento GDPR** y regulaciones de privacidad

## 🚀 Despliegue y Mantenimiento

### Requisitos del Servidor

- **Next.js 14+** con API Routes
- **Base de datos PostgreSQL** con Prisma ORM
- **Google Gemini API** para respuestas de IA
- **HTTPS obligatorio** para seguridad

### Actualizaciones

El widget se actualiza automáticamente. Para forzar una actualización:

```javascript
// Recargar el widget
ChatWidget.reload();

// Verificar versión
console.log(ChatWidget.version);
```

## 🐛 Solución de Problemas

### Problemas Comunes

#### Widget no aparece
```javascript
// Verificar inicialización
if (window.ChatWidget) {
  console.log('Widget cargado correctamente');
} else {
  console.error('Widget no se cargó');
}
```

#### Error de API Key
- Verifica que la clave API sea correcta
- Confirma que esté activa en el panel admin
- Revisa la URL base de la API

#### Problemas de estilo
- Verifica que no haya conflictos CSS con `z-index`
- Confirma que el contenedor padre tenga `position: relative`

### Debug Mode

Habilita el modo debug para más información:

```javascript
ChatWidget.init({
  apiKey: 'tu_api_key',
  debug: true  // Habilita logs detallados
});
```

## 📞 Soporte

### Recursos de Ayuda

- **Documentación**: Esta guía completa
- **Panel Admin**: `/admin/widget` para configuración
- **Logs del Servidor**: Revisa logs de Next.js para errores
- **Analytics**: Métricas detalladas en el panel admin

### Contacto de Soporte

Para soporte técnico:
- Email: soporte@tu-empresa.com
- Panel Admin: Sección de ayuda integrada

## 📝 Ejemplos de Integración

### Sitio Web Estático (HTML puro)

```html
<!DOCTYPE html>
<html>
<head>
    <title>Mi Sitio Web</title>
    <script src="https://tu-dominio.com/widget.js"></script>
</head>
<body>
    <h1>Bienvenido a mi sitio</h1>

    <script>
      ChatWidget.init({
        apiKey: 'widget_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        baseUrl: 'https://tu-dominio.com'
      });
    </script>
</body>
</html>
```

### WordPress

```php
// functions.php
function add_chat_widget() {
    ?>
    <script src="https://tu-dominio.com/widget.js"></script>
    <script>
      ChatWidget.init({
        apiKey: 'tu_api_key_aqui',
        baseUrl: 'https://tu-dominio.com'
      });
    </script>
    <?php
}
add_action('wp_footer', 'add_chat_widget');
```

### React/Next.js

```jsx
import { useEffect } from 'react';

export default function Layout({ children }) {
  useEffect(() => {
    // Cargar script del widget
    const script = document.createElement('script');
    script.src = 'https://tu-dominio.com/widget.js';
    script.onload = () => {
      window.ChatWidget.init({
        apiKey: 'tu_api_key_aqui',
        baseUrl: 'https://tu-dominio.com'
      });
    };
    document.head.appendChild(script);
  }, []);

  return <div>{children}</div>;
}
```

## 🎯 Mejores Prácticas

### Optimización de Performance

1. **Carga Asíncrona**: El script se carga de forma asíncrona
2. **Lazy Loading**: Solo se carga cuando es necesario
3. **Minificación**: Código optimizado para producción

### UX/UI Recomendaciones

1. **Posicionamiento**: Esquina inferior derecha para mejor visibilidad
2. **Colores**: Mantén consistencia con tu marca
3. **Mensajes**: Personaliza el saludo según tu público
4. **Testing**: Prueba en diferentes dispositivos y navegadores

### Analytics y Métricas

1. **Monitorea Conversión**: Chats → Reservas
2. **Tiempo de Respuesta**: Mide satisfacción del usuario
3. **Páginas Populares**: Identifica dónde colocar el widget
4. **Horarios**: Ajusta disponibilidad según demanda

---

## 📋 Checklist de Implementación

- [ ] Obtener API Key del panel admin
- [ ] Configurar apariencia del widget
- [ ] Agregar script a tu sitio web
- [ ] Probar funcionalidad en diferentes dispositivos
- [ ] Revisar analytics después de 24 horas
- [ ] Ajustar configuración según métricas

¡Tu widget de chat está listo para recibir visitantes! 🎉