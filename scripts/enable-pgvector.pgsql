-- PostgreSQL Script: Habilitar extensión pgvector para vectores de IA
-- Este archivo debe ejecutarse en PostgreSQL, NO en SQL Server
-- Comando: psql -d tu_database -f enable-pgvector.pgsql

-- Habilitar extensión pgvector para soporte de vectores
CREATE EXTENSION IF NOT EXISTS vector;

-- Verificar que la extensión está habilitada correctamente  
SELECT 
    extname as extension_name,
    extversion as version,
    extowner::regrole as owner
FROM pg_extension 
WHERE extname = 'vector';