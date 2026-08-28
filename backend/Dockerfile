FROM richarvey/nginx-php-fpm:3.1.0

ENV PHP_ERRORS_STDERR 1
ENV RUN_SCRIPTS 1
ENV REAL_IP_HEADER 1
ENV PHP_EXTENSIONS "pdo_pgsql pgsql mbstring exif pcntl bcmath gd zip"

WORKDIR /var/www/html

# Копируем файлы проекта
COPY composer.json composer.lock ./

# Устанавливаем зависимости Composer
RUN composer install --no-interaction --optimize-autoloader --no-dev --no-scripts || true

COPY . .

# Права доступа
RUN chown -R www-data /var/www/html/storage /var/www/html/bootstrap/cache || true
RUN chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache || true

EXPOSE 9000
CMD ["/start.sh"]
