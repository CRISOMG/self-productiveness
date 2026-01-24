# Database Backup and Restore Procedures

This document outlines the procedures for backing up and restoring the Supabase Postgres databases for both the **local** development environment and the **production** environment.

Since the local host machine may not have PostgreSQL tools (`pg_dump`, `psql`) installed, these commands presume we are leveraging the tools already present _inside_ the running local Supabase Docker container (`supabase_db_self-productiveness`).

## Prerequisites

1.  **Docker** must be running.
2.  The Local Supabase stack must be up (`docker ps` should show `supabase_db_self-productiveness`).
3.  **Credentials**:
    - **Local**: Default user `postgres`.
    - **Production**: Credentials are defined in `.env` under `DATABASE_URL` (or `N8N_POSTGRES_URL`).

## Backup

Create a directory for backups if it doesn't exist:

```bash
mkdir -p backups
```

### 1. Local Database Backup

This dumps the entire local database structure and data.

```bash
docker exec -t supabase_db_self-productiveness pg_dumpall -c -U postgres > backups/local_backup_$(date +%Y%m%d_%H%M%S).sql
```

- `-c`: Identify clean (drop) commands to clear the database before creating it.
- `-U postgres`: Connect as the default superuser.

### 2. Production Database Backup

This connects to the remote production database _from_ your local Docker container and dumps it.

**Note:** Replace the connection string with the current value from your `.env` file (`DATABASE_URL`).

```bash
# Example connection string from project .env
PROD_DB_URL='postgresql://postgres.meneprjtfpcppidpgava:HCfU!3n8R-5b$hE@aws-1-us-east-2.pooler.supabase.com:6543/postgres'

docker exec -t supabase_db_self-productiveness pg_dump "$PROD_DB_URL" > backups/prod_backup_$(date +%Y%m%d_%H%M%S).sql
```

---

## Restore (Revert Changes)

### 1. Restore Local Database

**WARNING:** This is a destructive action for the current local state. It will overwrite the database with the backup.

```bash
cat backups/local_backup_YYYYMMDD_HHMMSS.sql | docker exec -i supabase_db_self-productiveness psql -U postgres
```

### 2. Restore Production Database

**WARNING:** This is a **HIGHLY DESTRUCTIVE** action. It will overwrite the live production database. Double-check your backup file integrity before running this.

```bash
# Example connection string from project .env
PROD_DB_URL='postgresql://postgres.meneprjtfpcppidpgava:HCfU!3n8R-5b$hE@aws-1-us-east-2.pooler.supabase.com:6543/postgres'

cat backups/prod_backup_YYYYMMDD_HHMMSS.sql | docker exec -i supabase_db_self-productiveness psql "$PROD_DB_URL"
```

## Troubleshooting

- **`pg_dump` not found**: Ensure you are running the command _through_ `docker exec`, as shown above.
- **Connection Refused**: Check if the local docker container is running (`docker ps`) and healthy. For production, check your internet connection and verify the credentials in `.env` are still valid.
