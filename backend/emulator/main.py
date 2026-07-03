import random
import json
from math import sqrt
import time

#frame - секунд между кадрами
frame = 10
#countOfFrame - номер конкретного кадра
countOfFrame = 0

#Расчитывает вероятность попадения в аварию
def accident_probability(data):
        if random.randint(1, 100) > data['chance']:
            data['chance'] = min(100, data['chance'] + random.randint(2, 5))
            return 0
        else:
            data['chance'] = max(0, data['chance'] - 50)
            return 1

#Изменяет значение элемента в зависимости от minVal, maxVal, результатов расчёта аварии и интервала изменения данных
def change_value(value, minVal, maxVal, changeInterval, resChanse):
    if value is None:
        value = (minVal + maxVal) // 2
    value = int(value)
    minVal = int(minVal)
    maxVal = int(maxVal)

    if resChanse == 0:
        #расчитывает, на сколько изменятся данные
        change = random.randrange(-changeInterval, changeInterval)
        new_value = value + change
        return max(minVal, min(maxVal, new_value))
    else:
        #В случае попадения в аварию считает значение, на которое параметр будет больше или меньше (в зависимости к чему ближе) максимума или минимума
        change = random.randrange(0, changeInterval * 3)
        if value - minVal >= maxVal - value:
            return maxVal + change
        else:
            return minVal - change

#Расчёт значений для характеристик, которые только уменьшаются, как бензин или заряд у дронов
def minuend_value(value, changeInterval):
    changeOfValue = random.randrange(0, changeInterval)
    if value  - changeOfValue >= 0:
        return value - changeOfValue
    else:
        return 0

#Изменение координат в зависимости от скорости и расстояния
def change_coordinates(coord, endcoord, speed):
    global frame
    if speed is None:
        return coord
    step = speed / 3600 * frame
    dx = endcoord[0] - coord[0]
    dy = endcoord[1] - coord[1]
    dist = sqrt(dx**2 + dy**2)
    if dist <= step:
        coord[0] = round(endcoord[0], 5)
        coord[1] = round(endcoord[1], 5)
    else:
        # Округляем приращение и затем сумму
        add_x = round(step * dx / dist * 20, 5)
        add_y = round(step * dy / dist * 20, 5)
        coord[0] = round(coord[0] + add_x, 5)
        coord[1] = round(coord[1] + add_y, 5)
    return coord

#Функция, которая изменяет все данные
def change_data(data):
    resultOfChanse = accident_probability(data)
    global countOfFrame
    #Смотрит, была ли авария, и если была, то данные не меняются
    if not data['accident']:
        #Изменение для машин
        if data['type'] == "car":
            data['Fuel'] = minuend_value(data['Fuel'], 4)
            data['temperature'] = change_value(data['temperature'], 90, 110, 30, resultOfChanse)
            data['Speed'] = change_value(data['Speed'], 60, 110, 20, resultOfChanse)
            data['coordinates'] = change_coordinates(data['coordinates'], data['end'], data['Speed'])
            #Если топливо на нуле, то тоже авария
            if data['Fuel'] <= 0:
                data['accident'] = True
                data['timeOfAc'] = countOfFrame
        #Тоже самое, только для дронов
        elif data['type'] == "drn":
            data['charge'] = minuend_value(data['charge'], 4)
            data['propeller_rpm'] = change_value(data['propeller_rpm'], 3000, 8000, 1000, resultOfChanse)
            data['speed'] = change_value(data['speed'], 60, 110, 20, resultOfChanse)
            data['altitude'] = change_value(data['altitude'], 10, 300, 3, resultOfChanse)
            data['coordinates'] = change_coordinates(data['coordinates'], data['end'], data['speed'])   

            if data['charge'] <= 0:
                data['accident'] = True
                data['timeOfAc'] = countOfFrame   
    #Если произошла авария, то данные, как скорость становятся нулями  
    else:
        if data['type'] == "car":
            data['Fuel'] = 0
            data['temperature'] = 0
            data['Speed'] = 0

        elif data['type'] == "drn":
            data['charge'] = 0
            data['propeller_rpm'] = 0
            data['speed'] = 0
            data['altitude'] = 0
    #Простое изменение состояний для азс и складов
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

#смотрит для каждого автомобиля, есть ли рядом заправка, и если есть, то машина заправляется 
def azs_and_truks(data):
    for rows1 in data:
        if rows1['type'] == "car":
            for rows2 in data:
                if rows2['type'] == 'gas':
                    #Тут сравниваются координаты по обычной гиперболе
                    if sqrt((rows1['coordinates'][0]-rows2['coordinates'][0])**2 + (rows1['coordinates'][1]-rows2['coordinates'][1])**2) <= 1:
                        rows1['Fuel'] = 100

#Простой вывод данных в консоль с разделителем
def print_data(data):
    for i in data:
            if i['type'] == "car":
                print(str(i['type']) + "_" + str(i['id']) + '#' + str(i['Fuel']) + '#' + str(i['Speed']) + '#' + str(i['coordinates'][0]) + '#' + str(i['coordinates'][1]) + '#' + str(i['start'][0]) + '#' + str(i['start'][1]) + '#' + str(i['end'][0]) + '#' + str(i['end'][1]) + '#' + str(i['name']) + '#' + str(i['description']))
            elif i['type'] == 'gas':
                print(str(i['type']) + "_" + str(i['id']) + '#' + str(i['coordinates'][0]) + '#' + str(i['coordinates'][1]) + '#' + str(i['fuel_level']) + '#' + str(i['fuel_type']) + '#' + str(i['price']) + '#' + str(i['occupancy']) + '#' + str(i['name']) + '#' + str(i['description']))
            elif i['type'] == 'wrh':
                print(str(i['type']) + "_" + str(i['id']) + '#' + str(i['coordinates'][0]) + '#' + str(i['coordinates'][1]) + '#' + str(i['goods_load']) + '#' + str(i['temperature']) + '#' + str(i['humidity']) + '#' + str(i['trucks_loading']) + '#' + str(i['name']) + '#' + str(i['description']))
            else:
                print(str(i['type']) + "_" + str(i['id']) + '#' + str(i['coordinates'][0]) + '#' + str(i['coordinates'][1]) + '#' + str(i['charge']) + '#' + str(i['propeller_rpm']) + '#' + str(i['speed']) + '#' + str(i['altitude']) + '#' + str(i['start'][0]) + '#' + str(i['start'][1]) + '#' + str(i['end'][0]) + '#' + str(i['end'][1]) + '#' + str(i['name']) + '#' + str(i['description']))

#Позволяет выходить из состояния аварии с прошестивем времени, которое у каждого объекта своё, при выходе топливо и заряд полные
def recovery(data):
    global countOfFrame
    for i in data:
        if i['accident']:
            if i['timeOfAc'] + i['recovery'] <= countOfFrame:
                i['accident'] = False
                if i['type'] == "car":
                    i['Fuel'] = 100
                elif i['type'] == "drn":
                    i['charge'] = 100
                elif i['type'] == "gas":
                    i['fuel_level'] = 100

#Главная функция
def main_function():
    with open('data.json', 'r', encoding='utf-8-sig') as f:
        data = json.load(f)

    for row in data:
        change_data(row)

    azs_and_truks(data)

    print_data(data)

    recovery(data)

    with open('data.json', 'w') as f:
        json.dump(data, f)

#Бесконечный цикл с работой раз в frame секунд
if __name__ == "__main__":
    while True:
        countOfFrame+=1
        main_function()
        print("-----")
        time.sleep(frame)