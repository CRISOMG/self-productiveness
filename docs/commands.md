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

### Cuando hayan problemas para actualizar la db en prod; repasar esto.
[https://github.com/supabase/cli/issues/2136#issuecomment-2055592079](https://github.com/supabase/cli/issues/2136#issuecomment-2055592079)