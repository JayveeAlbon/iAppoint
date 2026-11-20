FROM php:8.2-fpm-alpine

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
RUN composer install --no-scripts --no-autoloader --no-interaction

COPY . .

RUN composer dump-autoload --no-scripts --no-interaction

RUN printf '[www]\npm = dynamic\npm.max_children = 20\npm.start_servers = 3\npm.min_spare_servers = 2\npm.max_spare_servers = 10\nrequest_terminate_timeout = 300\n' \
    > /usr/local/etc/php-fpm.d/zzz-custom.conf

RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html/storage \
    && chmod -R 755 /var/www/html/bootstrap/cache

COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/supervisord.conf /etc/supervisord.conf
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

EXPOSE 8080
CMD ["/bin/sh", "/start.sh"]
