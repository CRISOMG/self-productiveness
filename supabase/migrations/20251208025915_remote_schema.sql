create extension if not exists "pg_cron" with schema "pg_catalog";

create extension if not exists "pg_net" with schema "extensions";

create schema if not exists "pgmq";

create extension if not exists "pgmq" with schema "pgmq";
