import random
import json
from math import sqrt
import time

frame = 10

def accident_probability(data):
        if random.randrange(0,100) > data['chance']:
            data['chance'] += random.randrange(2,8)
            return 0
        else:
            data['chance'] -= 30
            if data['chance'] < 0:
                data['chance'] = 0
            return 1

def change_value(value, minVal, maxVal, changeInterval, resChanse):
    if value is None:
        value = (minVal + maxVal) // 2
    value = int(value)
    minVal = int(minVal)
    maxVal = int(maxVal)

    if resChanse == 0:
        change = random.randrange(-changeInterval, changeInterval)
        new_value = value + change
        # Ограничиваем в нормальном режиме
        return max(minVal, min(maxVal, new_value))
    else:  # авария – выход за границы разрешён
        change = random.randrange(0, changeInterval * 3)
        if value - minVal >= maxVal - value:
            return maxVal + change
        else:
            return minVal - change

def minuend_value(value, changeInterval):
    changeOfValue = random.randrange(0, changeInterval)
    if value  - changeOfValue >= 0:
        return value - changeOfValue
    else:
        return 0

def change_coordinates(coord, startcoord, endcoord, speed):
    global frame
    if speed is None:
        return coord
    step = speed / 3600 * frame
    dx = endcoord[0] - coord[0]
    dy = endcoord[1] - coord[1]
    dist = sqrt(dx**2 + dy**2)
    if dist <= step:
        coord[0], coord[1] = endcoord[0], endcoord[1]
    else:
        coord[0] += step * dx / dist
        coord[1] += step * dy / dist
    return coord

def change_data(data):
    resultOfChanse = accident_probability(data)
    if data['type'] == "car":
        data['Fuel'] = minuend_value(data['Fuel'], 4)
        data['Speed'] = change_value(data['Speed'], 40, 130, 10, resultOfChanse)
        data['coordinates'] = change_coordinates(data['coordinates'], data['start'], data['end'], data['Speed'])
    elif data['type'] == 'azs':
        data['fuel_level'] = minuend_value(data['fuel_level'], 2)
        data['occupancy'] = change_value(data['occupancy'], 0, 85, 5, resultOfChanse)
    elif data['type'] == 'sklad':
        data['goods_load'] = change_value(data['goods_load'], 0, 85, 5, resultOfChanse)

        temper = data.get('temperature')
        if temper is None:
            temper = 0
        else:
            temper = int(temper)
        data['temperature'] = change_value(temper, 0, 30, 10, resultOfChanse)

        humidity = data.get('humidity')
        if humidity is None:
            humidity = 50
        else:
            humidity = int(humidity)
        data['humidity'] = change_value(humidity, 30, 80, 10, resultOfChanse)
        data['trucks_loading'] = change_value(data['trucks_loading'], 3, 50, 1, resultOfChanse)
    else:
        data['charge'] = minuend_value(data['charge'], 4)
        data['propeller_rpm'] = change_value(data['propeller_rpm'], 3500, 8000, 100, resultOfChanse)
        data['speed'] = change_value(data['speed'], 30, 130, 10, resultOfChanse)
        data['altitude'] = change_value(data['altitude'], 10, 300, 3, resultOfChanse)
        data['coordinates'] = change_coordinates(data['coordinates'], data['start'], data['end'], data['speed'])

def azs_and_truks(data):
    for rows1 in data:
        if rows1['type'] == "car":
            for rows2 in data:
                if rows2['type'] == 'azs':
                    if sqrt((rows1['coordinates'][0]-rows2['coordinates'][0])**2 + (rows1['coordinates'][1]-rows2['coordinates'][1])**2) <= 1:
                        rows1['Fuel'] = 100

def print_data(data):
    for i in data:
            if i['type'] == "car":
                print(str(i['id']) + '#' + str(i['type']) + '#' + str(i['Fuel']) + '#' + str(i['Speed']) + '#' + str(i['coordinates'][0]) + '#' + str(i['coordinates'][1]) + '#' + str(i['start'][0]) + '#' + str(i['start'][1]) + '#' + str(i['end'][0]) + '#' + str(i['end'][1]))
            elif i['type'] == 'azs':
                print(str(i['id']) + '#' + str(i['type']) + '#' + str(i['coordinates'][0]) + '#' + str(i['coordinates'][1]) + '#' + str(i['fuel_level']) + '#' + str(i['fuel_type']) + '#' + str(i['price']) + '#' + str(i['occupancy']))
            elif i['type'] == 'sklad':
                print(str(i['id']) + '#' + str(i['type']) + '#' + str(i['coordinates'][0]) + '#' + str(i['coordinates'][1]) + '#' + str(i['goods_load']) + '#' + str(i['temperature']) + '#' + str(i['humidity']) + '#' + str(i['trucks_loading']))
            else:
                print(str(i['id']) + '#' + str(i['type']) + '#' + str(i['coordinates'][0]) + '#' + str(i['coordinates'][1]) + '#' + str(i['charge']) + '#' + str(i['propeller_rpm']) + '#' + str(i['speed']) + '#' + str(i['altitude']) + '#' + str(i['start'][0]) + '#' + str(i['start'][1]) + '#' + str(i['end'][0]) + '#' + str(i['end'][1]))

def main_function():
    with open('data.json', 'r') as f:
        data = json.load(f)

    for row in data:
        change_data(row)

    azs_and_truks(data)

    print_data(data)

    with open('data.json', 'w') as f:
        json.dump(data, f)

if __name__ == "__main__":
    while True:
        main_function()
        print("-----")
        time.sleep(frame)