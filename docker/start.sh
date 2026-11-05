#!/bin/sh

echo "=== iAppoint Starting ==="
echo "APP_ENV:       ${APP_ENV}"
echo "DB_CONNECTION: ${DB_CONNECTION}"
echo "DB_HOST:       ${DB_HOST}"
echo "DB_PORT:       ${DB_PORT}"
echo "DB_DATABASE:   ${DB_DATABASE}"
echo "APP_URL:       ${APP_URL}"
echo "PHP version:   $(php -r 'echo PHP_VERSION;')"
echo "Extensions:    $(php -m | tr '\n' ' ')"

cd /var/www/html

# Clear build-time cache (best-effort — don't crash if it fails)
echo "--- Clearing build-time config cache ---"
php artisan config:clear  || echo "WARN: config:clear failed"
php artisan cache:clear   || echo "WARN: cache:clear failed"

# Test database connection before migrating
echo "--- Testing database connection ---"
php -r "
try {
    \$pdo = new PDO(
        '${DB_CONNECTION}:host=${DB_HOST};port=${DB_PORT};dbname=${DB_DATABASE}',
        '${DB_USERNAME}',
        '${DB_PASSWORD}'
    );
    echo 'DB connection OK' . PHP_EOL;
} catch (Exception \$e) {
    echo 'DB connection FAILED: ' . \$e->getMessage() . PHP_EOL;
}
" || true

# Run migrations (best-effort — app can still serve static pages if DB fails)
echo "--- Running migrations ---"
php artisan migrate --force --no-interaction 2>&1 || echo "WARN: migrate failed — continuing anyway"

# Cache config/routes/views with real env vars
echo "--- Caching config ---"
php artisan config:cache  || echo "WARN: config:cache failed"
php artisan route:cache   || echo "WARN: route:cache failed"
php artisan view:cache    || echo "WARN: view:cache failed"

# Ensure storage link exists
php artisan storage:link --force 2>/dev/null || true

echo "--- Starting supervisord (nginx + php-fpm + queue) ---"
exec /usr/bin/supervisord -c /etc/supervisord.conf
