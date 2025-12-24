### supabase gen types
````bash
supabase gen types typescript --project-id meneprjtfpcppidpgava > ./app/types/database.types.ts
````

````bash
supabase gen types typescript --local > ./app/types/database.types.ts
````

### supabase db

````bash
supabase db pull --local
````

````bash
supabase db push --local
````

### supabase functions

````bash
supabase functions list
````

### supabase backup

````bash
supabase db dump --local --data-only > supabase/seed.sql
````
# Backup completo de producción
````bash
supabase db dump --db-url "tu_connection_string_de_prod" > prod_backup_final.sql
````

````bash
# Usando psql (el puerto por defecto local es 54322)
psql "postgresql://postgres:postgres@localhost:54322/postgres" -f supabase/seed.sql
````

### supabase auth

````bash
supabase auth admin reset-password --email <email>
````

### Cuando hayan problemas para actualizar la db en prod; repasar esto.
[https://github.com/supabase/cli/issues/2136#issuecomment-2055592079](https://github.com/supabase/cli/issues/2136#issuecomment-2055592079)