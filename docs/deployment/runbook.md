# Runbook de Producción - Gestión de Eventos v3.0

## 📋 Información General

- **Sistema**: Gestión de Eventos v3.0
- **Versión**: 3.0.0
- **Arquitectura**: Next.js + PostgreSQL + Redis + Nginx
- **Despliegue**: Docker Compose
- **Uptime Objetivo**: 99.9%

## 🚨 Incidentes Críticos

### Nivel 1: Sistema Completamente Inaccesible
**Impacto**: Todos los usuarios afectados, pérdida total de servicio

#### Pasos de Respuesta
1. **Verificar estado del sistema**
   ```bash
   ./deploy.sh status
   curl -f https://tu-dominio.com/api/health
   ```

2. **Revisar logs de error**
   ```bash
   ./deploy.sh logs | tail -50
   docker-compose -f docker-compose.prod.yml logs --tail=50 app
   ```

3. **Reiniciar servicios**
   ```bash
   docker-compose -f docker-compose.prod.yml restart
   ```

4. **Si no funciona, rollback inmediato**
   ```bash
   ./deploy.sh rollback
   ```

5. **Notificar stakeholders**
   - Slack: #incidentes-criticos
   - Email: equipo-tecnico@empresa.com

#### Tiempo de Resolución Objetivo: 15 minutos

---

### Nivel 2: Funcionalidad Parcial Afectada
**Impacto**: Algunas funcionalidades no disponibles, usuarios parcialmente afectados

#### Pasos de Respuesta
1. **Identificar funcionalidad afectada**
   ```bash
   # Verificar health check detallado
   curl https://tu-dominio.com/api/health

   # Revisar logs específicos
   docker-compose -f docker-compose.prod.yml logs --tail=100 | grep -i error
   ```

2. **Aislar el problema**
   - Base de datos: `docker-compose -f docker-compose.prod.yml logs postgres`
   - Redis: `docker-compose -f docker-compose.prod.yml logs redis`
   - Aplicación: `docker-compose -f docker-compose.prod.yml logs app`

3. **Aplicar solución temporal**
   - Reiniciar servicio específico
   - Escalar recursos si es necesario

4. **Implementar solución permanente**
   - Actualizar código/configuración
   - Desplegar parche

#### Tiempo de Resolución Objetivo: 1 hora

---

### Nivel 3: Problemas de Rendimiento
**Impacto**: Sistema lento pero funcional

#### Pasos de Respuesta
1. **Monitorear recursos**
   ```bash
   docker stats
   top -p $(pgrep -f "node")
   ```

2. **Identificar bottleneck**
   - CPU alta: Optimizar queries
   - Memoria alta: Revisar leaks
   - Disco I/O: Verificar logs

3. **Aplicar optimizaciones**
   - Aumentar recursos del contenedor
   - Optimizar queries de base de datos
   - Implementar caching adicional

#### Tiempo de Resolución Objetivo: 4 horas

---

## 🔄 Procedimientos de Mantenimiento

### Despliegue de Nuevas Versiones

#### Pre-Despliegue
```bash
# 1. Verificar que todos los tests pasan
npm run test
npm run test:e2e

# 2. Crear backup manual
./deploy.sh backup

# 3. Notificar mantenimiento
# Slack: #general "Mantenimiento programado en 10 minutos"
```

#### Durante el Despliegue
```bash
# 4. Ejecutar despliegue
./deploy.sh

# 5. Verificar health check
curl -f https://tu-dominio.com/api/health

# 6. Ejecutar smoke tests
npm run test:smoke
```

#### Post-Despliegue
```bash
# 7. Monitorear por 30 minutos
watch -n 60 './deploy.sh status'

# 8. Notificar finalización
# Slack: #general "Despliegue completado exitosamente"
```

### Backup y Restauración

#### Backup Diario (Automático)
- **Horario**: 02:00 AM
- **Ubicación**: `docker/backups/`
- **Retención**: 30 días
- **Compresión**: gzip

#### Backup Manual
```bash
# Crear backup con timestamp
docker/backup.sh

# Listar backups disponibles
docker/backup.sh list
```

#### Restauración de Emergencia
```bash
# Detener aplicación
docker-compose -f docker-compose.prod.yml stop app

# Restaurar backup específico
docker/backup.sh restore docker/backups/backup_20241201_020000.sql.gz

# Reiniciar aplicación
docker-compose -f docker-compose.prod.yml start app

# Verificar integridad
curl -f https://tu-dominio.com/api/health
```

### Monitoreo de Recursos

#### Métricas Críticas
- **CPU**: < 80% promedio
- **Memoria**: < 85% del límite
- **Disco**: > 20% libre
- **Conexiones DB**: < 90% del pool máximo

#### Comandos de Monitoreo
```bash
# Uso de recursos en tiempo real
docker stats

# Conexiones de base de datos
docker-compose -f docker-compose.prod.yml exec postgres psql -U user -d dbname -c "SELECT count(*) FROM pg_stat_activity;"

# Logs de aplicación
docker-compose -f docker-compose.prod.yml logs -f --tail=100 app

# Métricas de Nginx
curl http://localhost/nginx_status
```

## 📊 Alertas y Monitoreo

### Alertas Críticas (Notificar Inmediatamente)
- Sistema inaccesible > 5 minutos
- Error rate > 5%
- Latencia P95 > 5 segundos
- Uso de CPU > 90%
- Memoria disponible < 10%

### Alertas de Advertencia
- Uso de CPU > 75%
- Memoria > 80%
- Disco disponible < 25%
- Conexiones DB > 80% del pool

### Dashboards de Monitoreo
- **Health Check**: `https://tu-dominio.com/api/health`
- **Métricas de Aplicación**: Integrar con Prometheus/Grafana
- **Logs Centralizados**: Configurar ELK stack

## 🔧 Solución de Problemas Comunes

### Error: "Connection refused" en Base de Datos
```bash
# Verificar estado del contenedor
docker-compose -f docker-compose.prod.yml ps postgres

# Revisar logs
docker-compose -f docker-compose.prod.yml logs postgres

# Reiniciar PostgreSQL
docker-compose -f docker-compose.prod.yml restart postgres

# Verificar conectividad
docker-compose -f docker-compose.prod.yml exec postgres pg_isready -U user -d dbname
```

### Error: "Out of Memory"
```bash
# Verificar uso de memoria
docker stats

# Aumentar límites en docker-compose.prod.yml
services:
  app:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

# Reiniciar con nuevos límites
docker-compose -f docker-compose.prod.yml up -d
```

### Error: "Too Many Connections"
```bash
# Verificar conexiones activas
docker-compose -f docker-compose.prod.yml exec postgres psql -U user -d dbname -c "SELECT count(*) FROM pg_stat_activity;"

# Aumentar pool de conexiones en .env.production
DATABASE_POOL_SIZE=20
DATABASE_POOL_MAX_IDLE_TIME=60000

# Reiniciar aplicación
docker-compose -f docker-compose.prod.yml restart app
```

### Error: SSL Certificate Expired
```bash
# Renovar certificado Let's Encrypt
certbot renew

# Copiar nuevo certificado
cp /etc/letsencrypt/live/tu-dominio.com/fullchain.pem docker/nginx/ssl/
cp /etc/letsencrypt/live/tu-dominio.com/privkey.pem docker/nginx/ssl/

# Reiniciar Nginx
docker-compose -f docker-compose.prod.yml restart nginx
```

## 📈 Escalabilidad

### Escalado Vertical
```bash
# Aumentar recursos de CPU/RAM
# Editar docker-compose.prod.yml
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '2.0'
          memory: 4G

docker-compose -f docker-compose.prod.yml up -d
```

### Escalado Horizontal
```bash
# Escalar aplicación
docker-compose -f docker-compose.prod.yml up -d --scale app=3

# Configurar load balancer (Nginx ya incluido)
# Verificar distribución de carga
docker-compose -f docker-compose.prod.yml ps
```

### Optimización de Base de Datos
```bash
# Analizar queries lentas
docker-compose -f docker-compose.prod.yml exec postgres psql -U user -d dbname -c "SELECT * FROM pg_stat_statements ORDER BY total_time DESC LIMIT 10;"

# Crear índices si es necesario
docker-compose -f docker-compose.prod.yml exec postgres psql -U user -d dbname -c "CREATE INDEX CONCURRENTLY idx_table_column ON table(column);"

# Vacuum y analyze
docker-compose -f docker-compose.prod.yml exec postgres psql -U user -d dbname -c "VACUUM ANALYZE;"
```

## 🔒 Seguridad

### Actualizaciones de Seguridad
```bash
# Actualizar imágenes Docker
docker-compose -f docker-compose.prod.yml pull

# Actualizar dependencias
npm audit fix

# Rotar secrets
# Generar nuevos secrets y actualizar .env.production
NEXTAUTH_SECRET=nuevo-secret-seguro
```

### Auditoría de Acceso
```bash
# Revisar logs de acceso
docker-compose -f docker-compose.prod.yml logs nginx | grep -E "(POST|PUT|DELETE)"

# Monitorear intentos de login fallidos
docker-compose -f docker-compose.prod.yml logs app | grep -i "login.*failed"
```

### Respuesta a Breach
1. **Contener**: Desconectar sistemas comprometidos
2. **Investigar**: Revisar logs y identificar alcance
3. **Recuperar**: Restaurar desde backup limpio
4. **Notificar**: Informar a usuarios afectados y autoridades si aplica

## 📞 Contactos de Emergencia

### Equipo Técnico
- **Líder Técnico**: Juan Pérez - +54 9 11 1234-5678
- **DevOps**: María García - +54 9 11 8765-4321
- **Backend**: Carlos López - +54 9 11 5555-1234

### Stakeholders
- **Producto**: Ana Rodríguez - +54 9 11 9999-0000
- **Cliente**: Roberto Martínez - +54 9 11 1111-2222

### Proveedores Externos
- **Hosting**: Support AWS - support@aws.amazon.com
- **Base de Datos**: Support PostgreSQL - pgsql-bugs@postgresql.org
- **Email**: Support Gmail - support@google.com

---

## 📋 Checklist de Respuesta a Incidentes

### Inmediatamente Después del Incidente
- [ ] Identificar impacto y alcance
- [ ] Notificar equipo técnico
- [ ] Crear ticket de incidente
- [ ] Iniciar comunicación con stakeholders

### Durante la Resolución
- [ ] Documentar pasos de troubleshooting
- [ ] Implementar solución temporal si aplica
- [ ] Probar solución en staging
- [ ] Desplegar solución a producción

### Después de la Resolución
- [ ] Verificar funcionamiento completo
- [ ] Documentar causa raíz
- [ ] Implementar medidas preventivas
- [ ] Actualizar runbook si es necesario
- [ ] Cerrar ticket con lecciones aprendidas

### Post-Mortem (Dentro de 24 horas)
- [ ] Reunión con equipo completo
- [ ] Análisis detallado de timeline
- [ ] Identificar mejoras en procesos
- [ ] Actualizar documentación y alertas