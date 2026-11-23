FROM php:8.2-fpm-alpine

RUN apk add --no-cache \
    nginx supervisor curl \
    libpng-dev libzip-dev zip unzip \
    oniguruma-dev icu-dev postgresql-dev \
    mysql-client bash

RUN docker-php-ext-install \
    pdo pdo_mysql pdo_pgsql pgsql \
    mbstring zip gd bcmath intl

WORKDIR /var/www/html

COPY . .

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache \
    && chmod -R 777 /var/www/html/storage \
    && chmod -R 777 /var/www/html/bootstrap/cache

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8080
CMD ["/bin/sh", "/start.sh"]
