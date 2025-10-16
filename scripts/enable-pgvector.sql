-- Habilitar extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- Verificar que la extensión está habilitada
SELECT * FROM pg_extension WHERE extname = 'vector';