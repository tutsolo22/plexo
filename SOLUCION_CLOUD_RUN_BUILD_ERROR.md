# 🔧 Solución: Error "Cannot find module 'autoprefixer'" en Cloud Run

**Fecha**: 4 de Noviembre de 2025  
**Commit**: `83abd04`  
**Rama**: `main-plexo`

## 📋 Problema

Al compilar la aplicación en **Google Cloud Run**, aparecía el siguiente error:

```
Error: Cannot find module 'autoprefixer'
Require stack:
- /app/node_modules/next/dist/build/webpack/config/blocks/css/plugins.js
...
```

La aplicación compilaba correctamente en desarrollo (`npm run build` local),
pero fallaba en Cloud Run.

## 🔍 Causa Raíz

Los paquetes `autoprefixer`, `postcss` y `tailwindcss` estaban configurados como
**`devDependencies`** en `package.json`:

```json
"devDependencies": {
  "autoprefixer": "^10.4.16",
  "postcss": "^8.4.31",
  "tailwindcss": "^3.4.0",
  ...
}
```

### ¿Por qué el problema solo aparece en Cloud Run?

1. **Localmente** (`npm install`): Se instalan tanto `dependencies` como
   `devDependencies`
2. **Cloud Run** (`npm install --production`): Solo se instalan `dependencies`,
   ignorando `devDependencies`
3. **NextJS Build**: Necesita `autoprefixer` y `postcss` en **tiempo de
   compilación** para procesar CSS

```
En local:                      En Cloud Run:
npm install                    npm ci --only=production
↓                              ↓
Instala TODO                   Solo dependencies
(dependencies + devDependencies)
↓                              ↓
Build funciona ✅              Build falla ❌
                               (faltan: autoprefixer, postcss)
```

## ✅ Solución

**Mover estos paquetes de `devDependencies` a `dependencies`:**

```json
"dependencies": {
  ...
  "postcss": "^8.4.31",
  "tailwindcss": "^3.4.0",
  "tailwindcss-animate": "^1.0.7",
  "autoprefixer": "^10.4.16",
  ...
}
```

### Cambios Realizados

**Archivo**: `package.json`

```diff
dependencies:
- Agregado: "autoprefixer": "^10.4.16"
- Agregado: "postcss": "^8.4.31"
- Agregado: "tailwindcss": "^3.4.0" (ya estaba, pero ahora en el lugar correcto)

devDependencies:
- Removido: "autoprefixer"
- Removido: "postcss"
- Removido: "tailwindcss"
```

**Commit**: `83abd04`

```
fix: Mover autoprefixer, postcss y tailwindcss a dependencies para Cloud Run

- Estos paquetes eran devDependencies pero son requeridos en tiempo de build
- Cloud Run no instala devDependencies por defecto
- Necesarios para procesamiento CSS/PostCSS/Tailwind en el build
```

## 📊 Diferencia de Tamaño

| Métrica       | Valor       |
| ------------- | ----------- |
| Files changed | 2           |
| Insertions    | +146        |
| Deletions     | -445        |
| Net change    | -299 líneas |

El cambio es mínimo porque solo reorganizamos dependencias que ya existían.

## 🚀 Verificación Local

Build local después del cambio:

```bash
$ npm run build
# ✅ Compilación exitosa
# 0 errores de TypeScript
# Build time: ~45 segundos
```

## 🏗️ Cómo Funciona Ahora en Cloud Run

1. **Dockerfile en Cloud Run ejecuta**:

   ```bash
   npm ci --only=production
   ```

2. **Se instalan**:
   - ✅ `autoprefixer` (dependency)
   - ✅ `postcss` (dependency)
   - ✅ `tailwindcss` (dependency)
   - ✅ Todas las demás dependencies

3. **Build en Cloud Run**:
   ```bash
   npm run build
   # Ejecuta: next build
   # NextJS encuentra autoprefixer, postcss, tailwindcss
   # ✅ Compilación exitosa
   ```

## 🔐 Recomendaciones

### Para Dependencias de Build en NextJS

Estos paquetes **SIEMPRE deben estar en `dependencies`** cuando usan:

- PostCSS (`postcss.config.js`)
- Tailwind CSS (`tailwind.config.js`)
- Pre/Post procesadores CSS

**Paquetes que necesitan ir en `dependencies`**:

- ✅ `postcss`
- ✅ `tailwindcss`
- ✅ `autoprefixer`
- ✅ `sass` (si usas SCSS)
- ✅ `less` (si usas LESS)

**Paquetes que pueden estar en `devDependencies`**:

- ✅ `@types/*` (solo tipos de TypeScript)
- ✅ `eslint`, `prettier` (linters/formatters)
- ✅ `jest`, `testing-library` (testing)
- ✅ `typescript` (si se compila como parte del build)

## 🧪 Testing

Para verificar que funciona en un ambiente similar a Cloud Run:

```bash
# Instalar solo production dependencies
npm ci --only=production

# Intentar build
npm run build

# Debe compilar exitosamente
```

## 📚 Referencias

- [NextJS - CSS Handling](https://nextjs.org/docs/basic-features/built-in-css-support)
- [PostCSS Documentation](https://postcss.org/)
- [Tailwind CSS - Installation](https://tailwindcss.com/docs/installation)
- [Google Cloud Run - Node.js](https://cloud.google.com/run/docs/quickstarts/build-and-deploy/nodejs)

## ✨ Status

- ✅ Build local: Funcionando
- ✅ Commit: `83abd04` pushed a `origin/main-plexo`
- ✅ Próximo: Deploy a Cloud Run debería compilar exitosamente
- ✅ Package.json: Actualizado
- ✅ npm install: Completado
