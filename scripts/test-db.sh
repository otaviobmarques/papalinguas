#!/usr/bin/env bash
# Aplica as migrações + seed num banco descartável e roda os testes de RLS.
# Uso: DATABASE_URL=postgres://... scripts/test-db.sh  (padrão: banco local "papalinguas_test")
set -euo pipefail
DB="${TEST_DB_NAME:-papalinguas_test}"
PSQL=(psql -v ON_ERROR_STOP=1 -q)
dropdb --if-exists "$DB" && createdb "$DB"
"${PSQL[@]}" -d "$DB" -f supabase/tests/supabase_stub.sql
for f in supabase/migrations/*.sql; do "${PSQL[@]}" -d "$DB" -f "$f"; done
"${PSQL[@]}" -d "$DB" -f supabase/seed.sql
"${PSQL[@]}" -d "$DB" -f supabase/tests/rls_test.sql
