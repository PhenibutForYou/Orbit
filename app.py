import threading
import requests
from flask import Flask, request, jsonify
from pydantic import ValidationError
from models import db, Car, GasStation, Warehouse, Drone
from validators import CarSchema, GasStationSchema, WarehouseSchema, DroneSchema
from datetime import datetime

app = Flask(__name__)

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

    db.session.commit() # Сохранение в бд
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

    db.session.commit()
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

    db.session.commit()
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

    db.session.commit()
    return jsonify({"status": "success", "object_status": new_status}), 201

if __name__ == '__main__':
    app.run(debug=True, port=5000)