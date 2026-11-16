# ─────────────────────────────────────────────────────────────────────────────
# Stage 1 — Build frontend assets
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2 — PHP application
# ─────────────────────────────────────────────────────────────────────────────
FROM php:8.2-fpm-alpine AS app

RUN apk add --no-cache \
    nginx supervisor curl \
    libpng-dev libzip-dev zip unzip \
    oniguruma-dev icu-dev postgresql-dev \
    mysql-client bash

RUN docker-php-ext-install \
    pdo pdo_mysql pdo_pgsql pgsql \
    mbstring zip gd bcmath intl

COPY --from=composer:2.8 /usr/bin/composer /usr/bin/composer

WORKDIR /var/www/html

COPY composer.json composer.lock ./
RUN composer install --no-dev --optimize-autoloader --no-scripts --no-interaction

COPY . .
COPY --from=frontend /app/public/build ./public/build

# Build the package manifest using Laravel's PHP API directly
# This avoids running artisan (which needs DB) but still creates packages.php
RUN php -r "
define('LARAVEL_START', microtime(true));
\$_SERVER['APP_KEY'] = 'base64:dGVtcGtleWZvcmJ1aWxkb25seXVzZTMyY2hhcnM=';
putenv('APP_KEY=base64:dGVtcGtleWZvcmJ1aWxkb25seXVzZTMyY2hhcnM=');
putenv('APP_ENV=production');
putenv('DB_CONNECTION=sqlite');
putenv('DB_DATABASE=/dev/null');
putenv('LOG_CHANNEL=stderr');
require __DIR__.'/vendor/autoload.php';
\$app = require_once __DIR__.'/bootstrap/app.php';
\$app->make('Illuminate\Foundation\PackageManifest')->build();
echo 'Package manifest built successfully.' . PHP_EOL;
"

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8080
CMD ["/bin/sh", "/start.sh"]
