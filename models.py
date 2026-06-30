from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Car(db.Model):
    __tablename__ = 'cars'
    
    id = db.Column(db.String(50), primary_key=True)
    fuel_level = db.Column(db.Integer, nullable=False)
    engine_temp = db.Column(db.Integer, nullable=False)
    speed = db.Column(db.Integer, nullable=False)
    coordinates = db.Column(db.String(100), nullable=False)
    start_point = db.Column(db.String(100), nullable=False)
    end_point = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='normal')
    last_update = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': 'car',
            'fuel_level': self.fuel_level,
            'engine_temp': self.engine_temp,
            'speed': self.speed,
            'coordinates': self.coordinates,
            'start_point': self.start_point,
            'end_point': self.end_point,
            'status': self.status,
            'last_update': self.last_update.isoformat() if self.last_update else None
        }

class GasStation(db.Model):
    __tablename__ = 'gas_stations'
    
    id = db.Column(db.String(50), primary_key=True)
    coordinates = db.Column(db.String(100), nullable=False)
    fuel_level = db.Column(db.Integer, nullable=False)
    fuel_type = db.Column(db.String(10), nullable=False)
    price = db.Column(db.Numeric(6, 2), nullable=False)
    occupancy = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='normal')
    last_update = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': 'gas_station',
            'coordinates': self.coordinates,
            'fuel_level': self.fuel_level,
            'fuel_type': self.fuel_type,
            'price': float(self.price),
            'occupancy': self.occupancy,
            'status': self.status,
            'last_update': self.last_update.isoformat() if self.last_update else None
        }

class Warehouse(db.Model):
    __tablename__ = 'warehouses'
    
    id = db.Column(db.String(50), primary_key=True)
    coordinates = db.Column(db.String(100), nullable=False)
    capacity_used = db.Column(db.Integer, nullable=False)
    temperature = db.Column(db.Integer, nullable=False)
    humidity = db.Column(db.Integer, nullable=False)
    trucks_count = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='normal')
    last_update = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': 'warehouse',
            'coordinates': self.coordinates,
            'capacity_used': self.capacity_used,
            'temperature': self.temperature,
            'humidity': self.humidity,
            'trucks_count': self.trucks_count,
            'status': self.status,
            'last_update': self.last_update.isoformat() if self.last_update else None
        }

class Drone(db.Model):
    __tablename__ = 'drones'
    
    id = db.Column(db.String(50), primary_key=True)
    battery = db.Column(db.Integer, nullable=False)
    propeller_rpm = db.Column(db.Integer, nullable=False)
    speed = db.Column(db.Integer, nullable=False)
    coordinates = db.Column(db.String(100), nullable=False)
    altitude = db.Column(db.Integer, nullable=False)
    start_point = db.Column(db.String(100), nullable=False)
    end_point = db.Column(db.String(100), nullable=False)
    status = db.Column(db.String(20), nullable=False, default='normal')
    last_update = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': 'drone',
            'battery': self.battery,
            'propeller_rpm': self.propeller_rpm,
            'speed': self.speed,
            'coordinates': self.coordinates,
            'altitude': self.altitude,
            'start_point': self.start_point,
            'end_point': self.end_point,
            'status': self.status,
            'last_update': self.last_update.isoformat() if self.last_update else None
        }
