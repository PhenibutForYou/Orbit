FROM python:3.10-slim

WORKDIR /app

# Копируем все файлы проекта
COPY . .

# Даём права на выполнение entrypoint-скрипта
RUN chmod +x entrypoint.sh

# Точка входа – наш скрипт
ENTRYPOINT ["./entrypoint.sh"]