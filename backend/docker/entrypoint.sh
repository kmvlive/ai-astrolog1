#!/bin/sh
set -e

# Устанавливаем crontab для Laravel scheduler
echo "* * * * * cd /var/www/html && php artisan schedule:run >> /dev/null 2>&1" | crontab -

# Запускаем cron в фоне
crond -b -l 8

# Запускаем основную команду
exec "$@"
