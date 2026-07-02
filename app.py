import threading
import requests
import queue
import json
from flask import Flask, request, jsonify, Response
from pydantic import ValidationError
from models import db, Car, GasStation, Warehouse, Drone
from validators import CarSchema, GasStationSchema, WarehouseSchema, DroneSchema
from datetime import datetime, timezone
from flask_cors import CORS

telemetry_data = {
    "cars": {},
    "gas_stations": {},
    "warehouses": {},
    "drones": {}
}

app = Flask(__name__)
CORS(app)

# Пока что тестовая бдшка
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///telemetry.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Инициализация бд
db.init_app(app)

# Создание таблиц при старте
with app.app_context():
    db.create_all()

# Ссылка по которой будет происходить соединение с ботом
bot_url = "http://127.0.0.1:5001/notify"

# Перевод статусов для отправки боту
status_translated = {
    "warning": "Предупреждение",
    "danger" : "Критический",
}

# Список подключенных вкладок фронтенда
sse_clients = []

# Перевод статуса системы к тому который у фронта
def map_status(status):
    if status == "danger":
        return "alert"
    if status not in ["normal", "warning", "alert", "nodata"]:
        return "normal"
    return status

# Считывание прогресса датчика и сборка параметра телеметрии для фронта
def format_telemetry_item(key, label, unit, value, min_val=0, max_val=100, status="normal"):
    range_val = max_val - min_val
    progress = int(((value - min_val) / range_val) * 100) if range_val > 0 else 0
    progress = max(0, min(100, progress))
    
    return {
        "key": key,
        "label": label,
        "progress": progress,
        "value": f"{value} {unit}".strip(),
        "status": map_status(status)
    }

# Функция отправки события всем подключенным вкладкам фронта
def broadcast_sse_event(event_type, object_id, patch_data):
    event_payload = {
        "type": event_type,
        "objectId": str(object_id),
        "patch": patch_data
    }
    # Формирование сырой sse-строки
    sse_message = f"data: {json.dumps(event_payload)}\n\n"
    # Рассылка по очередям всех клиентов
    for client_queue in sse_clients[:]:
        try:
            client_queue.put_nowait(sse_message)
        except queue.Full:
            sse_clients.remove(client_queue)

# Функция для отправкии уведомления боту в фоновом режиме
def send_to_bot_background(endpoint, payload):
    # Функция для http-запроса к боту
    def worker():
        try:
            requests.post(f"{bot_url}/{endpoint}", json=payload, timeout=5)
        except Exception as e:
            print(f"Не удалось отправить уведомление боту: {e}")

    # Создание отдельного независимого потока
    threading.Thread(target=worker, daemon=True).start()

# Сериализаторы к необходимому стандарту
# Сериализатор машины
def serialize_car(car):
    return {
        "id": str(car.id),
        "type": "car",
        "name": car.name,
        "description": car.description,
        "status": map_status(car.calculate_status()),
        "coordinates": f"{car.latitude}, {car.longitude}",
        "updatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "static": [
            { "label": "Точка начала", "value": f"{car.start_lat}, {car.start_lon}" },
            { "label": "Точка прибытия", "value": f"{car.end_lat}, {car.end_lon}" }
        ],
        "telemetry": [
            format_telemetry_item("fuel", "Топливо", "%", car.fuel_level, status=car.calculate_status()),
            format_telemetry_item("speed", "Скорость", "км/ч", car.speed, 0, 170, status=car.calculate_status()),
            format_telemetry_item("engineTemp", "Мотор", "°C", car.engine_temp, 0, 200, status=car.calculate_status())
        ]
    }

# Сериализатор АЗС
def serialize_gas_station(station):
    return {
        "id": str(station.id),
        "type": "fuel-station",
        "name": station.name,
        "description": station.description,
        "status": map_status(station.calculate_status()),
        "coordinates": f"{station.latitude}, {station.longitude}",
        "updatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "static": [
            { "label": "Тип топлива", "value": station.fuel_type },
        ],
        "telemetry": [
            format_telemetry_item("fuelLevel", "Запас топлива", "%", station.fuel_level, status=station.calculate_status()),
            format_telemetry_item("occupancy", "Нагрузка АЗС", "%", station.occupancy, 0, 100, status=station.calculate_status()),
            format_telemetry_item("price", "Цена топлива", "₽", float(station.price), 0, 200)
        ]
    }

# Сериализатор склада
def serialize_warehouse(wh):
    return {
        "id": str(wh.id),
        "type": "warehouse",
        "name": wh.name,
        "description": wh.description,
        "status": map_status(wh.calculate_status()),
        "coordinates": f"{wh.latitude}, {wh.longitude}",
        "updatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "static": [],
        "telemetry": [
            format_telemetry_item("capacity", "Заполнено", "%", wh.capacity_used, 0, 100, status=wh.calculate_status()),
            format_telemetry_item("temperature", "Температура склада", "°C", wh.temperature, -5, 40, status=wh.calculate_status()),
            format_telemetry_item("humidity", "Влажность", "%", wh.humidity, 0, 100, status=wh.calculate_status()),
            format_telemetry_item("trucks_count", "Грузовиков на погрузке", "", wh.trucks_count, 0, 50, status=wh.calculate_status())
        ]
    }

# Сериализатор дрона
def serialize_drone(drone):
    return {
        "id": str(drone.id),
        "type": "drone",
        "name": drone.name,
        "description": drone.description,
        "status": map_status(drone.calculate_status()),
        "coordinates": f"{drone.latitude}, {drone.longitude}",
        "updatedAt": datetime.now(timezone.utc).isoformat().replace("+00:00", "Z"),
        "static": [
            { "label": "Точка начала", "value": f"{drone.start_lat}, {drone.start_lon}" },
            { "label": "Точка прибытия", "value": f"{drone.end_lat}, {drone.end_lon}" }
        ],
        "telemetry": [
            format_telemetry_item("battery", "Заряд", "%", drone.battery, status=drone.calculate_status()),
            format_telemetry_item("speed", "Скорость", "км/ч", drone.speed, 0, 140, status=drone.calculate_status()),
            format_telemetry_item("altitude", "Высота", "м", drone.altitude, 0, 150),
            format_telemetry_item("propellerRpm", "Обороты двигателя", "об/мин", drone.propeller_rpm, 0, 11000, status=drone.calculate_status())
        ]
    }

# Маршрут для машины
@app.route('/api/telemetry/car', methods=['POST'])
def receive_car():
    # Валидация джейсон файла
    try:
        data = CarSchema(**(request.get_json() or {}))
    except ValidationError as e:
        return jsonify({"status": "error", "errors": e.errors()}), 400

    # Расчёт статуса
    new_status = data.calculate_status()

    # Если такая машина есть в бд - обновляем, есди нет - создаём новую. С остальными будет аналогично
    car = Car.query.get(data.id)
    if not car:
        car = Car(id=data.id)
        db.session.add(car)
        old_status = "normal" # Пусть у новой машины прошлый статус был ок
    else:
        old_status = car.status or "normal" # Тут запоминается старый статус до обновления

    if old_status == "normal" and new_status in ["warning", "danger"]:
        ttime = datetime.now().strftime('%d.%m.%Y %H:%M:%S')
        payload = {
            "obj_id": data.id,
            "car_name": data.name,
            "fuel_level": data.fuel_level,
            "temperature": data.engine_temp,
            "speed": data.speed,
            "car_latitude": float(data.latitude),
            "car_longitude": float(data.longitude),
            "start_latitude": float(data.start_lat),
            "start_longitude": float(data.start_lon),
            "end_latitude": float(data.end_lat),
            "end_longitude": float(data.end_lon),
            "status": status_translated.get(new_status, new_status),
            "date": ttime
        }
        send_to_bot_background("car", payload)

    car.name = data.name
    car.description = data.description
    car.fuel_level = data.fuel_level
    car.engine_temp = data.engine_temp
    car.speed = data.speed
    car.latitude = data.latitude
    car.longitude = data.longitude
    car.start_lat = data.start_lat
    car.start_lon = data.start_lon
    car.end_lat = data.end_lat
    car.end_lon = data.end_lon
    car.status = new_status

    telemetry_data["cars"][data.id] = data

    db.session.commit() # Сохранение в бд
    
    # Вызов функции для отправки события
    broadcast_sse_event("updated", data.id, serialize_car(data))
    return jsonify({"status": "success", "object_status": new_status}), 201

# Маршрут для АЗС
@app.route('/api/telemetry/gas_station', methods=['POST'])
def receive_gas_station():
    try:
        data = GasStationSchema(**(request.get_json() or {}))
    except ValidationError as e:
        return jsonify({"status": "error", "errors": e.errors()}), 400

    new_status = data.calculate_status()

    station = GasStation.query.get(data.id)
    if not station:
        station = GasStation(id=data.id)
        db.session.add(station)
        old_status = "normal"
    else:
        old_status = station.status or "normal"

    if old_status == "normal" and new_status in ["warning", "danger"]:
        ttime = datetime.now().strftime('%d.%m.%Y %H:%M:%S')
        payload = {
            "obj_id": data.id,
            "name": data.name,
            "latitude": float(data.latitude),
            "longitude": float(data.longitude),
            "fuel_level": data.fuel_level,
            "fuel_type": data.fuel_type,
            "price": float(data.price),
            "workload": data.occupancy,
            "status": status_translated.get(new_status, new_status),
            "date": ttime
        }
        send_to_bot_background("gas_station", payload)

    station.name = data.name
    station.description = data.description
    station.latitude = data.latitude
    station.longitude = data.longitude
    station.fuel_level = data.fuel_level
    station.fuel_type = data.fuel_type
    station.price = data.price
    station.occupancy = data.occupancy
    station.status = new_status

    telemetry_data["gas_stations"][data.id] = data

    db.session.commit()

    broadcast_sse_event("updated", data.id, serialize_gas_station(data))
    return jsonify({"status": "success", "object_status": new_status}), 201

# Маршрут для склада
@app.route('/api/telemetry/warehouse', methods=['POST'])
def receive_warehouse():
    try:
        data = WarehouseSchema(**(request.get_json() or {}))
    except ValidationError as e:
        return jsonify({"status": "error", "errors": e.errors()}), 400

    new_status = data.calculate_status()

    warehouse = Warehouse.query.get(data.id)
    if not warehouse:
        warehouse = Warehouse(id=data.id)
        db.session.add(warehouse)
        old_status = "normal"
    else:
        old_status = warehouse.status or "normal"

    if old_status == "normal" and new_status in ["warning", "danger"]:
        ttime = datetime.now().strftime('%d.%m.%Y %H:%M:%S')
        payload = {
            "obj_id": data.id,
            "name": data.name,
            "latitude": float(data.latitude),
            "longitude": float(data.longitude),
            "workload": data.capacity_used,
            "temperature": data.temperature,
            "humidity": data.humidity,
            "quantity_of_truck": data.trucks_count,
            "status": status_translated.get(new_status, new_status),
            "date": ttime
        }
        send_to_bot_background("warehouse", payload)

    warehouse.name = data.name
    warehouse.description = data.description
    warehouse.latitude = data.latitude
    warehouse.longitude = data.longitude
    warehouse.capacity_used = data.capacity_used
    warehouse.temperature = data.temperature
    warehouse.humidity = data.humidity
    warehouse.trucks_count = data.trucks_count
    warehouse.status = new_status

    telemetry_data["warehouses"][data.id] = data

    db.session.commit()

    broadcast_sse_event("updated", data.id, serialize_warehouse(data))
    return jsonify({"status": "success", "object_status": new_status}), 201

# Маршрут для дрона
@app.route('/api/telemetry/drone', methods=['POST'])
def receive_drone():
    try:
        data = DroneSchema(**(request.get_json() or {}))
    except ValidationError as e:
        return jsonify({"status": "error", "errors": e.errors()}), 400

    new_status = data.calculate_status()
    
    drone = Drone.query.get(data.id)
    if not drone:
        drone = Drone(id=data.id)
        db.session.add(drone)
        old_status = "normal"
    else:
        old_status = drone.status or "normal"

    if old_status == "normal" and new_status in ["warning", "danger"]:
        ttime = datetime.now().strftime('%d.%m.%Y %H:%M:%S')
        payload = {
            "obj_id": data.id,
            "name": data.name,
            "drone_latitude": float(data.latitude),
            "drone_longitude": float(data.longitude),
            "charge": data.battery,
            "altitude": data.altitude,
            "propeller_speed_pm": data.propeller_rpm,
            "speed": data.speed,
            "start_latitude": float(data.start_lat),
            "start_longitude": float(data.start_lon),
            "end_latitude": float(data.end_lat),
            "end_longitude": float(data.end_lon),
            "status": status_translated.get(new_status, new_status),
            "date": ttime
        }
        send_to_bot_background("drone", payload)

    drone.name = data.name
    drone.description = data.description
    drone.battery = data.battery
    drone.propeller_rpm = data.propeller_rpm
    drone.speed = data.speed
    drone.altitude = data.altitude
    drone.latitude = data.latitude
    drone.longitude = data.longitude
    drone.start_lat = data.start_lat
    drone.start_lon = data.start_lon
    drone.end_lat = data.end_lat
    drone.end_lon = data.end_lon
    drone.status = new_status

    telemetry_data["drones"][data.id] = data

    db.session.commit()

    broadcast_sse_event("updated", data.id, serialize_drone(data))
    return jsonify({"status": "success", "object_status": new_status}), 201

# Маршрут для чтения данных
@app.route('/api/objects', methods=['GET'])
def get_infrastructure():
    all_objects = []
    
    # Берем провалидированные Pydantic-объекты из кэша оперативной памяти
    all_objects.extend([serialize_car(c) for c in telemetry_data["cars"].values()])
    all_objects.extend([serialize_drone(d) for d in telemetry_data["drones"].values()])
    all_objects.extend([serialize_gas_station(s) for s in telemetry_data["gas_stations"].values()])
    all_objects.extend([serialize_warehouse(w) for w in telemetry_data["warehouses"].values()])
    
    return jsonify({
        "objects": all_objects,
        "maxObjects": 15 # Если поставить больше - будет лагать
    })

# Стрим событий для фронтенда по SSE
@app.route('/api/objects/events', methods=['GET'])
def events_stream():
    def event_generator():
        client_queue = queue.Queue(maxsize=100)
        sse_clients.append(client_queue)
        
        # Сигнал фронту, что соединение успешно открыто
        yield "compile: success\n\n"
        
        try:
            while True:
                # Ждем новое событие из очереди
                msg = client_queue.get()
                yield msg
        except GeneratorExit:
            # Клиент закрыл вкладку или обновил страницу
            sse_clients.remove(client_queue)

    return Response(event_generator(), mimetype='text/event-stream')

if __name__ == '__main__':
    app.run(debug=True, port=5000)