from flask import Flask, request, jsonify
from pydantic import ValidationError
from models import db, Car, GasStation, Warehouse, Drone
from validators import CarSchema, GasStationSchema, WarehouseSchema, DroneSchema

app = Flask(__name__)

# пока что тестовая бдшка
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///telemetry.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Инициализация бд
db.init_app(app)

# Создание таблиц при старте
with app.app_context():
    db.create_all()


# Маршрут для машины
@app.route('/api/telemetry/car', methods=['POST'])
def receive_car():
    # Валидация джейсон файла
    try:
        data = CarSchema(**(request.get_json() or {}))
    except ValidationError as e:
        return jsonify({"status": "error", "errors": e.errors()}), 400

    # Расчёт статуса
    current_status = data.calculate_status()

    # Если такая машина есть в бд - обновляем, есди нет - создаём новую. С остальными будет аналогично
    car = Car.query.get(data.id)
    if not car:
        car = Car(id=data.id)
        db.session.add(car)

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
    car.status = current_status

    db.session.commit() # Сохранение в бд
    return jsonify({"status": "success", "object_status": current_status}), 201

# Маршрут для АЗС
@app.route('/api/telemetry/gas_station', methods=['POST'])
def receive_gas_station():
    try:
        data = GasStationSchema(**(request.get_json() or {}))
    except ValidationError as e:
        return jsonify({"status": "error", "errors": e.errors()}), 400

    current_status = data.calculate_status()

    station = GasStation.query.get(data.id)
    if not station:
        station = GasStation(id=data.id)
        db.session.add(station)

    station.name = data.name
    station.description = data.description
    station.latitude = data.latitude
    station.longitude = data.longitude
    station.fuel_level = data.fuel_level
    station.fuel_type = data.fuel_type
    station.price = data.price
    station.occupancy = data.occupancy
    station.status = current_status

    db.session.commit()
    return jsonify({"status": "success", "object_status": current_status}), 201

# Маршрут для склада
@app.route('/api/telemetry/warehouse', methods=['POST'])
def receive_warehouse():
    try:
        data = WarehouseSchema(**(request.get_json() or {}))
    except ValidationError as e:
        return jsonify({"status": "error", "errors": e.errors()}), 400

    current_status = data.calculate_status()

    warehouse = Warehouse.query.get(data.id)
    if not warehouse:
        warehouse = Warehouse(id=data.id)
        db.session.add(warehouse)

    warehouse.name = data.name
    warehouse.description = data.description
    warehouse.latitude = data.latitude
    warehouse.longitude = data.longitude
    warehouse.capacity_used = data.capacity_used
    warehouse.temperature = data.temperature
    warehouse.humidity = data.humidity
    warehouse.trucks_count = data.trucks_count
    warehouse.status = current_status

    db.session.commit()
    return jsonify({"status": "success", "object_status": current_status}), 201

# Маршрут для дрона
@app.route('/api/telemetry/drone', methods=['POST'])
def receive_drone():
    try:
        data = DroneSchema(**(request.get_json() or {}))
    except ValidationError as e:
        return jsonify({"status": "error", "errors": e.errors()}), 400

    current_status = data.calculate_status()
    
    drone = Drone.query.get(data.id)
    if not drone:
        drone = Drone(id=data.id)
        db.session.add(drone)

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
    drone.status = current_status

    db.session.commit()
    return jsonify({"status": "success", "object_status": current_status}), 201

if __name__ == '__main__':
    app.run(debug=True, port=5000)