#!/bin/bash
FLAG_FILE="/app/.initialized"
if [ ! -f "$FLAG_FILE" ]; then
    echo "Первый запуск: выполняем reset.py..."
    python reset.py
    touch "$FLAG_FILE"
    echo "Сброс выполнен."
else
    echo "Сброс уже был, пропускаем reset.py."
fi
echo "Запуск main.py..."
exec python main.py