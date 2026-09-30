#!/bin/sh
# Railway startup script for iAppoint
set -e

echo "=== iAppoint Starting ==="
echo "Environment: $APP_ENV"
echo "DB Host: $DB_HOST"
echo "Port: $PORT"

# Clear any build-time cached config (it was cached without real env vars)
php artisan config:clear
php artisan cache:clear

# Run database migrations
echo "Running migrations..."
php artisan migrate --force

# Cache config now that env vars are available
echo "Caching config..."
php artisan config:cache
php artisan route:cache
php artisan view:cache

echo "Starting server on port $PORT..."
exec php artisan serve --host=0.0.0.0 --port=${PORT:-8080}
