-- Enable pgvector extension in PostgreSQL (idempotent)
-- This file can be executed on the target database to create the vector extension
-- used by pgvector. The extension name for pgvector is `vector`.

CREATE EXTENSION IF NOT EXISTS vector;

-- Optionally, create the extension in public schema explicitly:
-- CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA public;

-- End of script
-- PostgreSQL Script: Habilitar extensión pgvector para vectores de IA
-- Este archivo debe ejecutarse en PostgreSQL, NO en SQL Server
-- Comando: psql -d tu_database -f enable-pgvector.sql

-- Habilitar extensión pgvector para soporte de vectores
CREATE EXTENSION IF NOT EXISTS vector;

-- Verificar que la extensión está habilitada correctamente  
SELECT 
    extname as extension_name,
    extversion as version,
    extowner::regrole as owner
FROM pg_extension 
WHERE extname = 'vector';