from flask_sqlalchemy import SQLAlchemy
from datetime import datetime

db = SQLAlchemy()

class Car(db.Model):
    __tablename__ = 'cars'
    
    id = db.Column(db.Integer, primary_key=True)
    
    name = db.Column(db.String(100), nullable=False, default='Неизвестная машина')
    description = db.Column(db.Text, nullable=True, default='') 
    
    fuel_level = db.Column(db.Integer, nullable=False)
    engine_temp = db.Column(db.Integer, nullable=False)
    speed = db.Column(db.Integer, nullable=False)
    
    latitude = db.Column(db.Numeric(10, 6), nullable=False)
    longitude = db.Column(db.Numeric(10, 6), nullable=False)
    
    start_lat = db.Column(db.Numeric(10, 6), nullable=False)
    start_lon = db.Column(db.Numeric(10, 6), nullable=False)
    end_lat = db.Column(db.Numeric(10, 6), nullable=False)
    end_lon = db.Column(db.Numeric(10, 6), nullable=False)
    
    status = db.Column(db.String(20), nullable=False, default='normal')
    last_update = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': 'car',
            'name': self.name,
            'description': self.description,
            'fuel_level': self.fuel_level,
            'engine_temp': self.engine_temp,
            'speed': self.speed,
            'latitude': float(self.latitude),
            'longitude': float(self.longitude),
            'start_lat': float(self.start_lat),
            'start_lon': float(self.start_lon),
            'end_lat': float(self.end_lat),
            'end_lon': float(self.end_lon),
            'status': self.status,
            'last_update': self.last_update.isoformat() if self.last_update else None
        }

class GasStation(db.Model):
    __tablename__ = 'gas_stations'
    
    id = db.Column(db.Integer, primary_key=True)
    
    name = db.Column(db.String(100), nullable=False, default='Неизвестная АЗС')
    description = db.Column(db.Text, nullable=True, default='')
    
    latitude = db.Column(db.Numeric(10, 6), nullable=False)
    longitude = db.Column(db.Numeric(10, 6), nullable=False)
    
    fuel_level = db.Column(db.Integer, nullable=False)
    fuel_type = db.Column(db.String(10), nullable=False)
    price = db.Column(db.Numeric(4, 2), nullable=False)
    occupancy = db.Column(db.Integer, nullable=False)
    status = db.Column(db.String(20), nullable=False, default='normal')
    last_update = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': 'gas_station',
            'name': self.name,
            'description': self.description,
            'latitude': float(self.latitude),
            'longitude': float(self.longitude),
            'fuel_level': self.fuel_level,
            'fuel_type': self.fuel_type,
            'price': float(self.price),
            'occupancy': self.occupancy,
            'status': self.status,
            'last_update': self.last_update.isoformat() if self.last_update else None
        }

class Warehouse(db.Model):
    __tablename__ = 'warehouses'
    
    id = db.Column(db.Integer, primary_key=True)
    
    name = db.Column(db.String(100), nullable=False, default='Неизвестный склад')
    description = db.Column(db.Text, nullable=True, default='')
    
    latitude = db.Column(db.Numeric(10, 6), nullable=False)
    longitude = db.Column(db.Numeric(10, 6), nullable=False)
    
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
            'name': self.name,
            'description': self.description,
            'latitude': float(self.latitude),
            'longitude': float(self.longitude),
            'capacity_used': self.capacity_used,
            'temperature': self.temperature,
            'humidity': self.humidity,
            'trucks_count': self.trucks_count,
            'status': self.status,
            'last_update': self.last_update.isoformat() if self.last_update else None
        }

class Drone(db.Model):
    __tablename__ = 'drones'
    
    id = db.Column(db.Integer, primary_key=True)
    
    name = db.Column(db.String(100), nullable=False, default='Неизвестный дрон')
    description = db.Column(db.Text, nullable=True, default='')
    
    battery = db.Column(db.Integer, nullable=False)
    propeller_rpm = db.Column(db.Integer, nullable=False)
    speed = db.Column(db.Integer, nullable=False)
    altitude = db.Column(db.Integer, nullable=False)
    
    latitude = db.Column(db.Numeric(10, 6), nullable=False)
    longitude = db.Column(db.Numeric(10, 6), nullable=False)
    
    start_lat = db.Column(db.Numeric(10, 6), nullable=False)
    start_lon = db.Column(db.Numeric(10, 6), nullable=False)
    end_lat = db.Column(db.Numeric(10, 6), nullable=False)
    end_lon = db.Column(db.Numeric(10, 6), nullable=False)
    
    status = db.Column(db.String(20), nullable=False, default='normal')
    last_update = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'type': 'drone',
            'name': self.name,
            'description': self.description,
            'battery': self.battery,
            'propeller_rpm': self.propeller_rpm,
            'speed': self.speed,
            'altitude': self.altitude,
            'latitude': float(self.latitude),
            'longitude': float(self.longitude),
            'start_lat': float(self.start_lat),
            'start_lon': float(self.start_lon),
            'end_lat': float(self.end_lat),
            'end_lon': float(self.end_lon),
            'status': self.status,
            'last_update': self.last_update.isoformat() if self.last_update else None
        }
