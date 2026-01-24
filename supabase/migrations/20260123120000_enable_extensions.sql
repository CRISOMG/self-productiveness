-- Enable pgvector extension
create extension if not exists "vector" with schema "extensions";

-- Ensure other extensions mentioned are enabled (most were already in squash migration)
create extension if not exists "pg_cron" with schema "pg_catalog";
create extension if not exists "pg_net" with schema "extensions";
create extension if not exists "pgmq" with schema "pgmq";
