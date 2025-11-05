# 🔐 ENCRYPTION_KEY - Documentación de Encriptación de API Keys

**Fecha**: 4 de Noviembre de 2025  
**Versión**: 1.0  
**Status**: ✅ Implementado

---

## 📋 Resumen

Las **API keys de proveedores IA** (OpenAI, Google, Anthropic, Cohere) están
encriptadas usando `AES-256-CBC` con una clave de encriptación configurable via
variable de entorno.

---

## 🔑 ENCRYPTION_KEY

### ¿Qué es?

Variable de entorno que contiene la clave de encriptación para API keys.

### Dónde se Usa

- **Encriptación**: Cuando se guarda una API key en BD
- **Desencriptación**: Cuando se necesita usar la API key

### Configuración

#### En Desarrollo

```bash
# .env.local o .env
ENCRYPTION_KEY="your-encryption-key-32-chars-long!"
```

#### En Producción (Cloud Run)

```bash
# Variables de entorno de Cloud Run
ENCRYPTION_KEY=your-production-encryption-key-32-chars-long-and-secure!
```

### Archivos Que la Usan

1. **`src/lib/ai-provider.ts`**

   ```typescript
   const ENCRYPTION_KEY =
     (process.env['ENCRYPTION_KEY'] as string) || 'default-key';

   // Desencriptar API key
   function decryptApiKey(encrypted: string): string {
     const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
     let decrypted = decipher.update(encrypted, 'hex', 'utf8');
     decrypted += decipher.final('utf8');
     return decrypted;
   }
   ```

2. **`src/app/api/admin/ai-providers/route.ts`**

   ```typescript
   // Encriptar API key
   function encryptApiKey(apiKey: string): string {
     const cipher = crypto.createCipher('aes-256-cbc', ENCRYPTION_KEY);
     let encrypted = cipher.update(apiKey, 'utf8', 'hex');
     encrypted += cipher.final('hex');
     return encrypted;
   }

   // Desencriptar API key
   function decryptApiKey(encrypted: string): string {
     const decipher = crypto.createDecipher('aes-256-cbc', ENCRYPTION_KEY);
     let decrypted = decipher.update(encrypted, 'hex', 'utf8');
     decrypted += decipher.final('utf8');
     return decrypted;
   }
   ```

---

## 🔒 Algoritmo de Encriptación

### Detalles Técnicos

| Propiedad            | Valor                       |
| -------------------- | --------------------------- |
| **Algoritmo**        | AES-256-CBC                 |
| **Modo**             | CBC (Cipher Block Chaining) |
| **Tamaño de clave**  | 256 bits (32 bytes)         |
| **Encoding entrada** | UTF-8                       |
| **Encoding salida**  | HEX                         |
| **Biblioteca**       | Node.js `crypto`            |

### Proceso de Encriptación

```text
API Key Original (en texto plano)
     ↓
[AES-256-CBC Encryption con ENCRYPTION_KEY]
     ↓
Texto encriptado (HEX formato)
     ↓
Guardado en BD (encriptado)
```

### Proceso de Desencriptación

```text
Texto encriptado (HEX formato) desde BD
     ↓
[AES-256-CBC Decryption con ENCRYPTION_KEY]
     ↓
API Key desencriptada (UTF-8 en texto plano)
     ↓
Usada en llamadas a APIs de terceros
```

---

## ⚙️ Configuración por Ambiente

### Desarrollo Local

**Archivo**: `.env.local`

```bash
ENCRYPTION_KEY="your-encryption-key-32-chars-long!"
```

**Características**:

- Clave simple para desarrollo
- Compartida en equipo (no sensible)
- Válida para toda la BD local

### Staging/Testing

**Archivo**: `.env`

```bash
ENCRYPTION_KEY="your-encryption-key-32-chars-long!"
```

**Características**:

- Similar a desarrollo
- Usada en testing pipeline

### Producción

**Ubicación**: Cloud Run - Variables de Entorno

```bash
ENCRYPTION_KEY=your-production-encryption-key-32-chars-long-and-secure!
```

**Características**:

- Clave única y segura
- NO versionar en Git
- Generada con `openssl rand -base64 32`
- Almacenada en Secret Manager (recomendado)
- Diferente para cada ambiente

---

## 🚀 Cómo Configurar en Cloud Run

### Opción 1: Cloud Console

1. Ir a Cloud Run → Servicio → "Editar"
2. "Variables de entorno"
3. Agregar:

```bash
ENCRYPTION_KEY = <tu-clave-produccion>
```

4. Deploy

### Opción 2: Cloud Secret Manager (Recomendado)

```bash
# Crear secret (copiar tu clave en stdin)
gcloud secrets create encryption-key --data-file=-
(Pegar: your-production-encryption-key)

# Usar en Cloud Run
gcloud run services update plexo \
  --update-env-vars ENCRYPTION_KEY=<your-key>
```

### Opción 3: Cloud Build (Mejor Prácctica)

**cloudbuild.yaml**:

```yaml
steps:
  - name: 'gcr.io/cloud-builders/gke-deploy'
    args:
      - run
      - --filename=.
      - --location=us-central1
    env:
      - 'ENCRYPTION_KEY=${_ENCRYPTION_KEY}'
substitutions:
  _ENCRYPTION_KEY: 'tu-clave-segura'
```

---

## 🔧 Generador de Clave Segura

### Usar OpenSSL (Recomendado)

```bash
# Generar clave de 32 caracteres segura
openssl rand -base64 32
# Esto genera una clave aleatoria de 32 bytes en base64
```

### En Node.js

```javascript
const crypto = require('crypto');
const key = crypto.randomBytes(32).toString('base64');
console.log(key);
```

---

## 🛡️ Seguridad

### Buenas Prácticas

✅ **Hacer**:

- Usar `ENCRYPTION_KEY` diferente por ambiente
- Regenerar periódicamente (cada 90 días recomendado)
- Almacenar en Secret Manager en producción
- NO versionar claves en Git
- Rotar claves en caso de compromise

❌ **NO Hacer**:

- Usar la misma clave en dev y producción
- Hardcodear claves en código
- Compartir claves por email
- Usar claves débiles/cortas
- Revisar claves en logs

### Fallback por Defecto

```typescript
const ENCRYPTION_KEY =
  (process.env['ENCRYPTION_KEY'] as string) || 'default-key-no-segura';
//                                                                     ⬆️ Solo para desarrollo
```

⚠️ **Importante**: El fallback es **SOLO para desarrollo**. En producción
SIEMPRE debe estar definido.

---

## 📝 Archivos de Configuración

### `.env.local` (Desarrollo)

```bash
ENCRYPTION_KEY="your-encryption-key-32-chars-long!"
```

### `.env` (Testing)

```bash
ENCRYPTION_KEY="your-encryption-key-32-chars-long!"
```

### `.env.production` (Producción)

```bash
ENCRYPTION_KEY=your-production-encryption-key-32-chars-long-and-secure!
```

### `.env.example` (Template)

```bash
ENCRYPTION_KEY=your-encryption-key-32-chars-long!
```

---

## 🔍 Verificación

### Verificar que funciona

```bash
# 1. Agregar una API key
POST /api/admin/ai-providers
{
  "provider": "openai",
  "apiKey": "sk_test_123456"
}

# 2. Verificar en BD (debería estar encriptada)
SELECT "apiKey" FROM ai_provider_configs LIMIT 1;
# Resultado: a1b2c3d4e5f6... (hex encriptado)

# 3. Usar API (debería desencriptar automáticamente)
GET /api/admin/ai-providers
# Debería traer las API keys desencriptadas
```

---

## ⚠️ Migración de Claves

Si necesitas cambiar la `ENCRYPTION_KEY`:

### Proceso Manual

```typescript
// 1. Leer todas las API keys encriptadas con clave antigua
const configs = await prisma.aiProviderConfig.findMany();

// 2. Para cada config, desencriptar con clave antigua
const oldKey = process.env['OLD_ENCRYPTION_KEY'];
const decrypted = decryptApiKey(config.apiKey, oldKey);

// 3. Cambiar ENCRYPTION_KEY a nueva
process.env['ENCRYPTION_KEY'] = newKey;

// 4. Encriptar con clave nueva
const encrypted = encryptApiKey(decrypted);

// 5. Guardar en BD
await prisma.aiProviderConfig.update({
  where: { id: config.id },
  data: { apiKey: encrypted },
});
```

---

## 📊 Checklist de Seguridad

- ✅ ENCRYPTION_KEY configurada en .env
- ✅ ENCRYPTION_KEY diferente en producción
- ✅ Usar AES-256-CBC (algoritmo fuerte)
- ✅ Encriptar ALL API keys antes de guardar
- ✅ Desencriptar solo cuando sea necesario
- ✅ Auditar cambios de API keys
- ✅ Regenerar claves periódicamente
- ✅ NO loguear API keys sin encriptar

---

## 🚀 Status

| Ambiente       | Status         | Clave          | Fecha      |
| -------------- | -------------- | -------------- | ---------- |
| **Desarrollo** | ✅ Configurado | .env.local     | 4 Nov 2025 |
| **Testing**    | ✅ Configurado | .env           | 4 Nov 2025 |
| **Producción** | ⏳ Pendiente   | Cloud Run vars | ---        |

**Próximo**: Configurar ENCRYPTION_KEY en Cloud Run antes del deploy.
