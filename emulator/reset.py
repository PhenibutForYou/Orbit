import json
import random

# Читаем с учётом возможного BOM
with open('data.json', 'r', encoding='utf-8-sig') as f:
    data = json.load(f)

for obj in data:
    obj['accident'] = False
    obj['timeOfAc'] = 0
    if 'Fuel' in obj:
        obj['Fuel'] = random.randint(0, 100)
    if 'charge' in obj:
        obj['charge'] = random.randint(0, 100)
    if 'start' in obj:
        obj['coordinates'] = obj['start']

# Записываем без BOM (стандартный UTF-8)
with open('data.json', 'w', encoding='utf-8') as f:
    json.dump(data, f, indent=2, ensure_ascii=False)

print("✅ Данные успешно сброшены!")