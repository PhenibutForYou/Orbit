import json
import time
import requests
import os

emulator_path = os.path.join('emulator', 'data.json')
server_url = "http://127.0.0.1:5000/api/telemetry"

def parse_and_send():
    # Чтение сырых данных из эмулятора
    try:
        with open(emulator_path, 'r', encoding='utf-8-sig') as f:
            raw_data = json.load(f)
    except Exception:
        print(f"Ошибка чтения data.json")
        return
    
    # Парсинг и отправление каждого объекта
    for item in raw_data:
        try:
            if item['type'] == "car":
                parsed_data = {
                    "id": item['id'],
                    "name": item['name'],
                    "description": item['description'],
                    "fuel_level": item['Fuel'],
                    "engine_temp": item['temperature'],
                    "speed": item['Speed'],
                    "latitude": item['coordinates'][0],
                    "longitude": item['coordinates'][1],
                    "start_lat": item['start'][0],
                    "start_lon": item['start'][1],
                    "end_lat": item['end'][0],
                    "end_lon": item['end'][1]
                }
                endpoint = f"{server_url}/car"
            
            elif item['type'] == "gas":
                parsed_data = {
                    "id": item['id'],
                    "name": item['name'],
                    "description": item['description'],
                    "latitude": item['coordinates'][0],
                    "longitude": item['coordinates'][1],
                    "fuel_level": item['fuel_level'],
                    "fuel_type": item['fuel_type'],
                    "price": item['price'],
                    "occupancy": item['occupancy']
                }
                endpoint = f"{server_url}/gas_station"
            
            elif item['type'] == "wrh":
                parsed_data = {
                    "id": item['id'],
                    "name": item['name'],
                    "description": item['description'],
                    "capacity_used": item['goods_load'],
                    "temperature": item['temperature'],
                    "humidity": item['humidity'],
                    "trucks_count": item['trucks_loading'],
                    "latitude": item['coordinates'][0],
                    "longitude": item['coordinates'][1]
                }
                endpoint = f"{server_url}/warehouse"
            
            elif item['type'] == "drn":
                parsed_data = {
                    "id": item['id'],
                    "name": item['name'],
                    "description": item['description'],
                    "battery": item['charge'],
                    "propeller_rpm": item['propeller_rpm'],
                    "speed": item['speed'],
                    "altitude": item['altitude'],
                    "latitude": item['coordinates'][0],
                    "longitude": item['coordinates'][1],
                    "start_lat": item['start'][0],
                    "start_lon": item['start'][1],
                    "end_lat": item['end'][0],
                    "end_lon": item['end'][1]
                }
                endpoint = f"{server_url}/drone"
            else:
                # Скип, если тип объекта неизвестен
                continue
            
            # Итоговый пакет отправляется на серв
            res = requests.post(endpoint, json=parsed_data)

            if res.status_code not in [200, 201]:
                print(f"Ошибка валидации {item['type']} {item['id']}")
        
        except Exception:
            print(f"Ошибка при обработке объекта {item.get('id')}")

    print(time.strftime('%H:%M:%S'))

if __name__ == "__main__":
    while True:
        parse_and_send()
        time.sleep(10) # должен быть аналогичен frame из эмулятора, но если надо прям чтобы соответствовало эмулю, то можно сделать