-- Crear la extensión pgvector para el soporte de embeddings de IA
CREATE EXTENSION IF NOT EXISTS vector;

-- Mensaje de confirmación
SELECT 'Extensión pgvector instalada correctamente' as status;