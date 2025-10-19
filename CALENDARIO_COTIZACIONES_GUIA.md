# 📅 Guía: Ver Cotizaciones desde el Calendario

## 🎯 **Respuesta: SÍ, puedes ver las cotizaciones del evento**

### **🚀 Cómo Funciona el Sistema**

El sistema ya está completamente implementado para ver cotizaciones desde el calendario. Aquí te explico el flujo completo:

## 📋 **Flujo Paso a Paso**

### **1. Acceder al Calendario**
- Ve a: http://localhost:3200/dashboard/events
- El calendario se carga automáticamente con vista mensual
- Los eventos se muestran con colores según su estado:
  - 🟡 **RESERVED** - Amarillo (Reservado)
  - 🔵 **QUOTED** - Azul (Cotizado)  
  - 🟢 **CONFIRMED** - Verde (Confirmado)
  - 🔴 **CANCELLED** - Rojo (Cancelado)

### **2. Hacer Clic en un Evento**
Al hacer clic en cualquier evento del calendario:
- Se ejecuta `handleEventClick(eventId)`
- Te redirige automáticamente a `/dashboard/events/{eventId}`
- Se carga la página de detalle completa del evento

### **3. Ver Cotizaciones del Evento**
En la página de detalle verás:

#### **📊 Información del Evento**
- Título y fechas
- Cliente asignado
- Ubicación (venue/sala)
- Estado actual
- Notas del evento

#### **💰 Sección de Cotizaciones**
- **Lista de cotizaciones existentes**
- **Estado de cada cotización** (DRAFT, SENT, VIEWED, ACCEPTED, REJECTED, EXPIRED)
- **Monto total** de cada cotización
- **Fecha de validez**
- **Acciones disponibles**: Ver, Editar, Enviar, Generar PDF

#### **⚡ Acciones Rápidas**
- **Crear nueva cotización** para el evento
- **Sincronizar estados** entre evento y cotizaciones
- **Gestionar paquetes** y servicios
- **Enviar cotizaciones** por email

## 🔧 **Funcionalidades Disponibles**

### **En el Calendario:**
```typescript
// Al hacer clic en evento
const handleEventClick = (eventId: string) => {
  router.push(`/dashboard/events/${eventId}`)
}
```

### **En la Página de Detalle:**
- **EventQuoteManager**: Componente especializado en gestión de cotizaciones
- **Creación rápida** de cotizaciones
- **Sincronización automática** de estados
- **Integración completa** evento ↔ cotizaciones

### **Estados Sincronizados:**
- **Evento CANCELLED** → Cotizaciones EXPIRED
- **Evento CONFIRMED** → Cotizaciones ACCEPTED
- **Cotización ACCEPTED** → Evento CONFIRMED

## 📱 **Interfaz Visual**

### **En el Calendario:**
```
┌─────────────────┐
│ Evento Boda     │ ← Clic aquí
│ 10:00 - 18:00   │
│ 🔵 QUOTED       │ ← Color indica estado
└─────────────────┘
```

### **En la Página de Detalle:**
```
┌─────────────────────────────────────┐
│ 📅 Evento: Boda Juan & María        │
│ 👤 Cliente: Juan Pérez              │
│ 📍 Ubicación: Salón Principal       │
│ 🔵 Estado: QUOTED                   │
├─────────────────────────────────────┤
│ 💰 COTIZACIONES DEL EVENTO          │
│                                     │
│ ┌─────────────────────────────────┐ │
│ │ 📄 QUO-2024-001                │ │
│ │ 💵 $25,000.00                  │ │
│ │ 📅 Válida hasta: 30/Oct/2024   │ │
│ │ 🟢 SENT                        │ │
│ │ [Ver] [Editar] [PDF] [Enviar]  │ │
│ └─────────────────────────────────┘ │
│                                     │
│ [+ Nueva Cotización]                │
└─────────────────────────────────────┘
```

## 🎯 **Datos que Verás**

### **Información de Cotizaciones:**
- **Número de cotización** (QUO-2024-001)
- **Estado actual** (DRAFT, SENT, VIEWED, ACCEPTED, etc.)
- **Monto total** con impuestos
- **Fecha de creación y vencimiento**
- **Paquetes incluidos**
- **Historial de cambios**

### **Acciones Disponibles:**
- ✅ **Ver cotización completa**
- ✅ **Editar contenido y precios**
- ✅ **Generar PDF** para envío
- ✅ **Enviar por email** al cliente
- ✅ **Duplicar cotización**
- ✅ **Cambiar estado** manualmente
- ✅ **Crear nueva** cotización derivada

## 🔍 **Validación Rápida**

### **Para Probar Ahora:**

1. **Login**: `soporteapps@hexalux.mx` / `password123`
2. **Ir a**: http://localhost:3200/dashboard/events
3. **Hacer clic** en cualquier evento del calendario
4. **Verificar** que se muestre la sección de cotizaciones

### **Eventos de Ejemplo Creados:**
- 📅 **Evento 1**: Conferencia de Tecnología 2024
- 📅 **Evento 2**: Boda Jardín Primavera  
- 📅 **Evento 3**: Evento Corporativo Plexo

## ✅ **Estado Actual del Sistema**

**🟢 Calendario**: Completamente funcional  
**🟢 Click en Eventos**: Redirige correctamente  
**🟢 Página de Detalle**: Carga información completa  
**🟢 Cotizaciones**: Se muestran con todos los datos  
**🟢 Gestión**: Crear, editar, enviar cotizaciones  
**🟢 Sincronización**: Estados automáticos  

---

## 🎉 **Respuesta Final**

**¡SÍ! El sistema ya tiene esta funcionalidad completamente implementada.**

Cuando haces clic en un evento del calendario:
1. Se abre la página de detalle del evento
2. Puedes ver todas las cotizaciones asociadas
3. Ves el estado, monto, y fechas de cada cotización
4. Puedes gestionar las cotizaciones directamente desde ahí

**¡La funcionalidad está lista para usar!** 🚀

---
*Documentación actualizada: 18 de octubre de 2025*
*Sistema de calendario-cotizaciones operativo*