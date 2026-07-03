import random
import json
from math import sqrt, hypot
import time

# Глобальные параметры симуляции
frame = 10                 # секунд между кадрами
countOfFrame = 0           # номер текущего кадра

# Функции для кривых Безье
def generate_bezier_controls(start, end, curvature_scale=0.3):
    #Генерирует две контрольные точки для кубической кривой Безье. start, end – кортежи (x, y). curvature_scale – коэффициент "изогнутости" (чем больше, тем сильнее изгиб). Возвращает (ctrl1, ctrl2)
    x0, y0 = start
    x3, y3 = end
    dx = x3 - x0
    dy = y3 - y0
    length = hypot(dx, dy)
    if length == 0:
        return start, end

    # Нормализованный вектор направления
    ux = dx / length
    uy = dy / length
    # Перпендикулярный вектор (поворот на 90°)
    px = -uy
    py = ux

    # Случайное смещение в пределах [0.2, 0.8] от длины отрезка
    offset = random.uniform(0.2, 0.8) * length * curvature_scale
    sign = 1 if random.random() > 0.5 else -1

    # Контрольные точки на 1/3 и 2/3 пути со смещением перпендикулярно
    t1, t2 = 1/3, 2/3
    bx1 = x0 + dx * t1
    by1 = y0 + dy * t1
    bx2 = x0 + dx * t2
    by2 = y0 + dy * t2

    c1 = (bx1 + sign * offset * px, by1 + sign * offset * py)
    c2 = (bx2 + sign * offset * px, by2 + sign * offset * py)
    return c1, c2

def bezier_point(t, p0, p1, p2, p3):
    #Вычисляет координаты точки на кубической кривой Безье при параметре t (0..1). p0, p1, p2, p3 – кортежи (x, y)
    u = 1 - t
    x = u**3 * p0[0] + 3*u**2*t * p1[0] + 3*u*t**2 * p2[0] + t**3 * p3[0]
    y = u**3 * p0[1] + 3*u**2*t * p1[1] + 3*u*t**2 * p2[1] + t**3 * p3[1]
    return x, y

# Основные функции симуляции
def accident_probability(data):
    #Расчёт вероятности аварии
    if random.randint(1, 100) > data['chance']:
        data['chance'] = min(100, data['chance'] + random.randint(2, 5))
        return 0
    else:
        data['chance'] = max(0, data['chance'] - 50)
        return 1

def change_value(value, minVal, maxVal, changeInterval, resChanse):
    #Изменяет значение с учётом аварии и интервала
    if value is None:
        value = (minVal + maxVal) // 2
    value = int(value)
    minVal = int(minVal)
    maxVal = int(maxVal)

    if resChanse == 0:
        change = random.randrange(-changeInterval, changeInterval)
        new_value = value + change
        return max(minVal, min(maxVal, new_value))
    else:
        change = random.randrange(0, changeInterval * 3)
        if value - minVal >= maxVal - value:
            return maxVal + change
        else:
            return minVal - change

def minuend_value(value, changeInterval):
    #Уменьшающееся значение (топливо, заряд)
    changeOfValue = random.randrange(0, changeInterval)
    if value - changeOfValue >= 0:
        return value - changeOfValue
    else:
        return 0

def change_coordinates(obj):
    #Обновляет координаты объекта, двигая его по кривой Безье.
    #obj – словарь с данными (должен содержать 'start', 'end', 'coordinates', 'speed' или 'Speed', а также поля 'ctrl1', 'ctrl2', 'progress').
    coord = obj['coordinates']
    start = obj['start']
    end = obj['end']
    speed = obj.get('Speed') or obj.get('speed')
    if speed is None or speed == 0:
        return coord

    # Инициализация контрольных точек и прогресса, если их нет
    if 'ctrl1' not in obj or 'ctrl2' not in obj:
        c1, c2 = generate_bezier_controls(start, end)
        obj['ctrl1'] = c1
        obj['ctrl2'] = c2
        obj['progress'] = 0.0

    # Если уже достиг конца, не двигаемся дальше
    if obj['progress'] >= 1.0:
        coord[0] = round(end[0], 5)
        coord[1] = round(end[1], 5)
        return coord

    # Длина прямой (используется для приближённой оценки времени)
    dx = end[0] - start[0]
    dy = end[1] - start[1]
    dist = hypot(dx, dy)
    if dist == 0:
        coord[0] = round(end[0], 5)
        coord[1] = round(end[1], 5)
        obj['progress'] = 1.0
        return coord

    # Скорость в км/ч → км/с
    speed_km_per_sec = speed / 3600.0
    # Оценочное время в секундах для прохождения всего пути
    total_time = dist / speed_km_per_sec if speed_km_per_sec > 0 else 1e-6
    dt = frame / total_time
    obj['progress'] = min(obj['progress'] + dt, 1.0)

    # Вычисляем текущую точку на кривой
    p0 = start
    p1 = obj['ctrl1']
    p2 = obj['ctrl2']
    p3 = end
    x, y = bezier_point(obj['progress'], p0, p1, p2, p3)
    coord[0] = round(x, 5)
    coord[1] = round(y, 5)

    # Если достигли конца, фиксируем конечные координаты
    if obj['progress'] >= 1.0:
        coord[0] = round(end[0], 5)
        coord[1] = round(end[1], 5)

    return coord

def change_data(data):
    #Изменяет все данные объекта в зависимости от типа
    global countOfFrame
    resultOfChanse = accident_probability(data)

    if not data['accident']:
        if data['type'] == "car":
            data['Fuel'] = minuend_value(data['Fuel'], 4)
            data['temperature'] = change_value(data['temperature'], 90, 110, 30, resultOfChanse)
            data['Speed'] = change_value(data['Speed'], 60, 110, 20, resultOfChanse)
            change_coordinates(data)                      # <-- обновлённый вызов
            if data['Fuel'] <= 0:
                data['accident'] = True
                data['timeOfAc'] = countOfFrame

        elif data['type'] == "drn":
            data['charge'] = minuend_value(data['charge'], 4)
            data['propeller_rpm'] = change_value(data['propeller_rpm'], 3000, 8000, 1000, resultOfChanse)
            data['speed'] = change_value(data['speed'], 60, 110, 20, resultOfChanse)
            data['altitude'] = change_value(data['altitude'], 10, 300, 3, resultOfChanse)
            change_coordinates(data)                      # <-- обновлённый вызов
            if data['charge'] <= 0:
                data['accident'] = True
                data['timeOfAc'] = countOfFrame

    else:
        # Если авария – обнуляем параметры движения
        if data['type'] == "car":
            data['Fuel'] = 0
            data['temperature'] = 0
            data['Speed'] = 0
        elif data['type'] == "drn":
            data['charge'] = 0
            data['propeller_rpm'] = 0
            data['speed'] = 0
            data['altitude'] = 0

    # Обработка для АЗС и складов (не движутся)
    if data['type'] == 'gas':
        data['fuel_level'] = minuend_value(data['fuel_level'], 2)
        data['price'] = change_value(data['price'], 0, 85, 5, resultOfChanse)
        data['occupancy'] = change_value(data['occupancy'], 0, 85, 5, resultOfChanse)
    elif data['type'] == 'wrh':
        data['goods_load'] = change_value(data['goods_load'], 0, 85, 5, resultOfChanse)
        data['temperature'] = change_value(data['temperature'], 10, 25, 5, resultOfChanse)
        data['humidity'] = change_value(data['humidity'], 30, 70, 10, resultOfChanse)
        data['trucks_loading'] = change_value(data['trucks_loading'], 3, 50, 1, resultOfChanse)

    if resultOfChanse and not data['accident']:
        data['accident'] = True
        data['timeOfAc'] = countOfFrame

def azs_and_truks(data):
    #Проверка, есть ли машина рядом с АЗС (заправка)
    for rows1 in data:
        if rows1['type'] == "car":
            for rows2 in data:
                if rows2['type'] == 'gas':
                    if hypot(rows1['coordinates'][0] - rows2['coordinates'][0],
                             rows1['coordinates'][1] - rows2['coordinates'][1]) <= 1:
                        rows1['Fuel'] = 100

def print_data(data):
    #Вывод всех объектов в консоль
    for i in data:
        if i['type'] == "car":
            print(f"{i['type']}_{i['id']}#{i['Fuel']}#{i['Speed']}#{i['coordinates'][0]:.5f}#{i['coordinates'][1]:.5f}#"
                  f"{i['start'][0]:.5f}#{i['start'][1]:.5f}#{i['end'][0]:.5f}#{i['end'][1]:.5f}#"
                  f"{i['name']}#{i['description']}")
        elif i['type'] == 'gas':
            print(f"{i['type']}_{i['id']}#{i['coordinates'][0]:.5f}#{i['coordinates'][1]:.5f}#"
                  f"{i['fuel_level']}#{i['fuel_type']}#{i['price']}#{i['occupancy']}#"
                  f"{i['name']}#{i['description']}")
        elif i['type'] == 'wrh':
            print(f"{i['type']}_{i['id']}#{i['coordinates'][0]:.5f}#{i['coordinates'][1]:.5f}#"
                  f"{i['goods_load']}#{i['temperature']}#{i['humidity']}#{i['trucks_loading']}#"
                  f"{i['name']}#{i['description']}")
        else:  # дроны
            print(f"{i['type']}_{i['id']}#{i['coordinates'][0]:.5f}#{i['coordinates'][1]:.5f}#"
                  f"{i['charge']}#{i['propeller_rpm']}#{i['speed']}#{i['altitude']}#"
                  f"{i['start'][0]:.5f}#{i['start'][1]:.5f}#{i['end'][0]:.5f}#{i['end'][1]:.5f}#"
                  f"{i['name']}#{i['description']}")

def recovery(data):
    #Восстановление после аварии
    global countOfFrame
    for i in data:
        if i['accident']:
            if i['timeOfAc'] + i['recovery'] <= countOfFrame:
                i['accident'] = False
                if i['type'] == "car":
                    i['Fuel'] = 100
                    # скорость не восстанавливается – объект останется на месте
                elif i['type'] == "drn":
                    i['charge'] = 100
                elif i['type'] == "gas":
                    i['fuel_level'] = 100

def main_function():
    #Главная функция, выполняемая каждый кадр
    global countOfFrame

    with open('data.json', 'r', encoding='cp1251') as f:
        data = json.load(f)

    # Инициализация и округление координат
    for obj in data:
        # Приводим все координаты к 5 знакам после запятой
        if 'coordinates' in obj:
            obj['coordinates'] = [round(obj['coordinates'][0], 5),
                                  round(obj['coordinates'][1], 5)]
        if 'start' in obj:
            obj['start'] = [round(obj['start'][0], 5),
                            round(obj['start'][1], 5)]
        if 'end' in obj:
            obj['end'] = [round(obj['end'][0], 5),
                          round(obj['end'][1], 5)]

        # Генерируем контрольные точки для движущихся объектов, если их ещё нет
        if obj['type'] in ('car', 'drn') and 'ctrl1' not in obj:
            c1, c2 = generate_bezier_controls(obj['start'], obj['end'])
            obj['ctrl1'] = c1
            obj['ctrl2'] = c2
            obj['progress'] = 0.0

    # Обновляем данные всех объектов
    for row in data:
        change_data(row)

    # Проверка заправок
    azs_and_truks(data)

    # Вывод
    print_data(data)

    # Восстановление после аварий
    recovery(data)

    # Сохранение в файл
    with open('data.json', 'w', encoding='cp1251') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# Запуск бесконечного цикла
if __name__ == "__main__":
    while True:
        countOfFrame += 1
        main_function()
        print("-----")
        time.sleep(frame)