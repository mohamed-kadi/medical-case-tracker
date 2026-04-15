#!/usr/bin/env bash
set -euo pipefail

PGHOST="${PGHOST:-localhost}"
PGPORT="${PGPORT:-5432}"
PG_SUPERUSER="${PG_SUPERUSER:-postgres}"

APP_DB_NAME="${APP_DB_NAME:-medicaltracker}"
APP_DB_USER="${APP_DB_USER:-medical_user}"
APP_DB_PASSWORD="${APP_DB_PASSWORD:-medical_password}"

IDENTIFIER_REGEX='^[A-Za-z_][A-Za-z0-9_]*$'

if ! command -v psql >/dev/null 2>&1; then
  echo "psql is required but not found in PATH."
  exit 1
fi

if [[ ! "${APP_DB_NAME}" =~ ${IDENTIFIER_REGEX} ]]; then
  echo "APP_DB_NAME must be a valid SQL identifier (letters, numbers, underscore)."
  exit 1
fi

if [[ ! "${APP_DB_USER}" =~ ${IDENTIFIER_REGEX} ]]; then
  echo "APP_DB_USER must be a valid SQL identifier (letters, numbers, underscore)."
  exit 1
fi

PSQL_BASE=(psql -h "${PGHOST}" -p "${PGPORT}" -U "${PG_SUPERUSER}" -d postgres -v ON_ERROR_STOP=1)

echo "Ensuring role '${APP_DB_USER}' exists on ${PGHOST}:${PGPORT}..."
"${PSQL_BASE[@]}" --set=app_user="${APP_DB_USER}" --set=app_pass="${APP_DB_PASSWORD}" <<'SQL'
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = :'app_user') THEN
    EXECUTE format('CREATE ROLE %I WITH LOGIN', :'app_user');
  END IF;

  EXECUTE format('ALTER ROLE %I WITH LOGIN PASSWORD %L', :'app_user', :'app_pass');
END
$$;
SQL

DB_EXISTS="$("${PSQL_BASE[@]}" -tAc "SELECT 1 FROM pg_database WHERE datname='${APP_DB_NAME}'" | tr -d '[:space:]')"

if [[ "${DB_EXISTS}" != "1" ]]; then
  echo "Creating database '${APP_DB_NAME}' owned by '${APP_DB_USER}'..."
  "${PSQL_BASE[@]}" -c "CREATE DATABASE \"${APP_DB_NAME}\" OWNER \"${APP_DB_USER}\";"
else
  echo "Database '${APP_DB_NAME}' already exists. Ensuring owner is '${APP_DB_USER}'..."
  "${PSQL_BASE[@]}" -c "ALTER DATABASE \"${APP_DB_NAME}\" OWNER TO \"${APP_DB_USER}\";"
fi

echo "PostgreSQL bootstrap complete."
echo "Use these values in backend/.env:"
echo "DB_URL=jdbc:postgresql://${PGHOST}:${PGPORT}/${APP_DB_NAME}"
echo "DB_USERNAME=${APP_DB_USER}"
echo "DB_PASSWORD=${APP_DB_PASSWORD}"
