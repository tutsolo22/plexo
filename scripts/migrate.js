#!/usr/bin/env node

const { execSync } = require("child_process");

try {
  console.log("[STARTUP] Iniciando secuencia de startup...");

  if (!process.env.DATABASE_URL) {
    console.warn("[STARTUP] DATABASE_URL no configurada, omitiendo migraciones");
  } else {
    console.log("[STARTUP] Ejecutando migraciones de Prisma...");

    try {
      execSync("npx prisma migrate deploy --skip-generate", {
        stdio: "inherit",
        env: {
          ...process.env,
          NODE_ENV: "production"
        }
      });
      console.log("[STARTUP] Migraciones completadas");
    } catch (error) {
      console.warn("[STARTUP] Advertencia en migraciones (continuando):", error.message);
    }
  }

  console.log("[STARTUP] Iniciando Next.js...");
  execSync("next start", {
    stdio: "inherit",
    cwd: process.cwd()
  });
} catch (error) {
  console.error("[ERROR] Error:", error.message);
  process.exit(1);
}
