#!/bin/bash
set -e

echo "Starting PostgreSQL..."
# For homebrew, postgresql@17 is the service name
brew services start postgresql@17 || true
sleep 3

echo "Setting up postgres user and databases..."
# If postgres role doesn't exist, create it with password 'changeme'
psql postgres -c "DO \$\$ BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'postgres') THEN
    CREATE ROLE postgres LOGIN SUPERUSER PASSWORD 'changeme';
  ELSE
    ALTER ROLE postgres PASSWORD 'changeme';
  END IF;
END \$\$;" || true

echo "Creating databases..."
createdb -U postgres darukaa || echo "darukaa DB already exists"
createdb -U postgres darukaa_test || echo "darukaa_test DB already exists"

echo "Database setup complete."
