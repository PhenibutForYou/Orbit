import json
import random

# Файл с данными
FILENAME = "data.json"

def load_data():
    try:
        with open(FILENAME, 'r', encoding='utf-8-sig') as f:
            return json.load(f)
    except (FileNotFoundError, json.JSONDecodeError):
        return []

def save_data(data):
    with open(FILENAME, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def input_coordinates(prompt):
    #Ввод двух чисел с разделителями (пробел или запятая).
    while True:
        s = input(prompt).strip()
        parts = s.replace(',', ' ').split()
        if len(parts) == 2:
            try:
                x = float(parts[0])
                y = float(parts[1])
                return [x, y]
            except ValueError:
                pass
        print("Ошибка: введите два числа, разделённых пробелом или запятой.")

def input_number(prompt, min_val=None, max_val=None):
    while True:
        try:
            val = float(input(prompt))
            if min_val is not None and val < min_val:
                print(f"Значение должно быть не менее {min_val}")
                continue
            if max_val is not None and val > max_val:
                print(f"Значение должно быть не более {max_val}")
                continue
            return val
        except ValueError:
            print("Введите число.")

def generate_car():
    print("\nДобавление автомобиля")
    name = input("Название (name): ")
    description = input("Описание (description): ")
    start = input_coordinates("Начальные координаты (start, два числа через пробел): ")
    end = input_coordinates("Конечные координаты (end, два числа через пробел): ")
    speed = int(input_number("Скорость (Speed, число): ", min_val=0))
    
    return {
        "type": "car",
        "name": name,
        "description": description,
        "start": start,
        "end": end,
        "Speed": speed,
        # генерируемые поля
        "Fuel": random.randint(0, 100),
        "temperature": random.randint(90, 110),
        "coordinates": start[:],
        "accident": False,
        "recovery": random.randint(1, 5),
        "timeOfAc": 0,
        "chance": random.randint(0, 40)
    }

def generate_drn():
    print("\nДобавление дрона")
    name = input("Название (name): ")
    description = input("Описание (description): ")
    start = input_coordinates("Начальные координаты (start, два числа): ")
    end = input_coordinates("Конечные координаты (end, два числа): ")
    speed = int(input_number("Скорость (speed, число): ", min_val=0))
    
    return {
        "type": "drn",
        "name": name,
        "description": description,
        "start": start,
        "end": end,
        "speed": speed,
        # генерируемые
        "charge": random.randint(0, 100),
        "propeller_rpm": random.randint(3000, 8000),
        "altitude": random.randint(10, 300),
        "coordinates": start[:],
        "accident": False,
        "recovery": random.randint(1, 5),
        "timeOfAc": 0,
        "chance": random.randint(0, 40)
    }

def generate_gas():
    print("\nДобавление АЗС")
    name = input("Название (name): ")
    description = input("Описание (description): ")
    coords = input_coordinates("Координаты (coordinates, два числа): ")
    
    fuel_types = ["AI-92", "AI-95", "AI-98", "DT"]
    return {
        "type": "gas",
        "name": name,
        "description": description,
        "coordinates": coords,
        # генерируемые
        "fuel_level": random.randint(0, 100),
        "fuel_type": random.choice(fuel_types),
        "price": random.randint(0, 85),
        "occupancy": random.randint(0, 85),
        "accident": False,
        "recovery": random.randint(1, 5),
        "timeOfAc": 0,
        "chance": random.randint(0, 40)
    }

def generate_wrh():
    print("\nДобавление склада")
    name = input("Название (name): ")
    description = input("Описание (description): ")
    coords = input_coordinates("Координаты (coordinates, два числа): ")
    
    return {
        "type": "wrh",
        "name": name,
        "description": description,
        "coordinates": coords,
        # генерируемые
        "goods_load": random.randint(0, 85),
        "temperature": random.randint(10, 25),
        "humidity": random.randint(30, 70),
        "trucks_loading": random.randint(3, 50),
        "accident": False,
        "recovery": random.randint(1, 5),
        "timeOfAc": 0,
        "chance": random.randint(0, 40)
    }

def main():
    data = load_data()
    # Определяем следующий id
    if data:
        next_id = max(obj.get("id", 0) for obj in data) + 1
    else:
        next_id = 1

    while True:
        print("\nДобавление нового объекта")
        print("Доступные типы: car, drn, gas, wrh")
        obj_type = input("Тип объекта (или 'q' для выхода): ").strip().lower()
        if obj_type == 'q':
            break
        if obj_type not in ("car", "drn", "gas", "wrh"):
            print("Неизвестный тип. Попробуйте снова.")
            continue

        if obj_type == "car":
            new_obj = generate_car()
        elif obj_type == "drn":
            new_obj = generate_drn()
        elif obj_type == "gas":
            new_obj = generate_gas()
        else:  # wrh
            new_obj = generate_wrh()

        new_obj["id"] = next_id
        next_id += 1
        data.append(new_obj)
        print(f"✅ Объект {obj_type} с id={new_obj['id']} добавлен.")

    save_data(data)
    print(f"\nСохранено {len(data)} записей в {FILENAME}.")

if __name__ == "__main__":
    main()