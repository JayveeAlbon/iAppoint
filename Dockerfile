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

# Install prod deps without scripts (avoids package:discover which needs APP_KEY)
RUN composer install --no-dev --no-scripts --no-autoloader --no-interaction

# Copy source
COPY . .
COPY --from=frontend /app/public/build ./public/build

# Create a temporary .env just for the build so package:discover works
RUN cp .env.example .env && \
    php artisan key:generate --force && \
    composer dump-autoload --optimize --no-interaction && \
    rm .env

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8080
CMD ["/bin/sh", "/start.sh"]
