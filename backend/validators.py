from pydantic import BaseModel, Field
from typing import Literal
from decimal import Decimal

# 1. Машина
class CarSchema(BaseModel):
    id: int = Field(..., ge=1)
    name: str = Field(..., max_length=100)
    description: str = Field(..., max_length=500)
    fuel_level: int = Field(..., ge=0, le=100)
    engine_temp: int = Field(..., ge=0, le=200)
    speed: int = Field(..., ge=0, le=170)
    latitude: Decimal = Field(..., ge=-90, le=90, max_digits=10, decimal_places=6)
    longitude: Decimal = Field(..., ge=-180, le=180, max_digits=10, decimal_places=6)
    start_lat: Decimal = Field(..., ge=-90, le=90, max_digits=10, decimal_places=6)
    start_lon: Decimal = Field(..., ge=-180, le=180, max_digits=10, decimal_places=6)
    end_lat: Decimal = Field(..., ge=-90, le=90, max_digits=10, decimal_places=6)
    end_lon: Decimal = Field(..., ge=-180, le=180, max_digits=10, decimal_places=6)

    # Индивидуальные статусы для датчиков
    def get_fuel_status(self) -> str:
        if self.fuel_level < 5: return "danger"
        if self.fuel_level < 10: return "warning"
        return "normal"

    def get_engine_status(self) -> str:
        if self.engine_temp <= 40 or self.engine_temp >= 160: return "danger"
        if self.engine_temp < 90 or self.engine_temp > 110: return "warning"
        return "normal"

    def get_speed_status(self) -> str:
        if self.speed <= 10 or self.speed >= 160: return "danger"
        if self.speed < 60 or self.speed > 110: return "warning"
        return "normal"

    # Общий статус объекта
    def calculate_status(self) -> str:
        statuses = [self.get_fuel_status(), self.get_engine_status(), self.get_speed_status()]
        if "danger" in statuses: return "danger"
        if "warning" in statuses: return "warning"
        return "normal"


# 2. АЗС
class GasStationSchema(BaseModel):
    id: int = Field(..., ge=1)
    name: str = Field(..., max_length=100)
    description: str = Field(..., max_length=500)
    latitude: Decimal = Field(..., ge=-90, le=90, max_digits=10, decimal_places=6)
    longitude: Decimal = Field(..., ge=-180, le=180, max_digits=10, decimal_places=6)
    fuel_level: int = Field(..., ge=0, le=100)
    fuel_type: Literal["AI-92", "AI-95", "AI-98", "AI-100", "DT"]
    price: Decimal = Field(..., gt=0, max_digits=4, decimal_places=2)
    occupancy: int = Field(..., ge=0, le=100)

    def get_occupancy_status(self) -> str:
        if self.occupancy > 80: return "warning"
        if self.occupancy > 90: return "danger"
        return "normal"

    def get_fuel_status(self) -> str:
        if self.fuel_level < 10: return "danger"
        if self.fuel_level < 20: return "warning"
        return "normal"

    def calculate_status(self) -> str:
        statuses = [self.get_occupancy_status(), self.get_fuel_status]
        if "danger" in statuses: return "danger"
        if "warning" in statuses: return "warning"
        return "normal"


# 3. Склад
class WarehouseSchema(BaseModel):
    id: int = Field(..., ge=1)
    name: str = Field(..., max_length=100)
    description: str = Field(..., max_length=500)
    capacity_used: int = Field(..., ge=0, le=100) 
    temperature: int = Field(..., ge=-5, le=40)
    humidity: int = Field(..., ge=0, le=100)
    trucks_count: int = Field(..., ge=0, le=50)
    latitude: Decimal = Field(..., ge=-90, le=90, max_digits=10, decimal_places=6)
    longitude: Decimal = Field(..., ge=-180, le=180, max_digits=10, decimal_places=6)

    def get_capacity_status(self) -> str:
        if self.capacity_used >= 95: return "danger"
        if self.capacity_used >= 80: return "warning"
        return "normal"

    def get_temperature_status(self) -> str:
        if self.temperature <= 5 or self.temperature >= 30: return "danger"
        if self.temperature < 10 or self.temperature > 25: return "warning"
        return "normal"

    def get_humidity_status(self) -> str:
        if self.humidity <= 20 or self.humidity >= 80: return "danger"
        if self.humidity < 30 or self.humidity > 70: return "warning"
        return "normal"

    def get_trucks_status(self) -> str:
        if self.trucks_count >= 45: return "danger"
        if self.trucks_count > 40: return "warning"
        return "normal"

    def calculate_status(self) -> str:
        statuses = [
            self.get_capacity_status(), 
            self.get_temperature_status(), 
            self.get_humidity_status(), 
            self.get_trucks_status()
        ]
        if "danger" in statuses: return "danger"
        if "warning" in statuses: return "warning"
        return "normal"


# 4. Дрон
class DroneSchema(BaseModel):
    id: int = Field(..., ge=1)
    name: str = Field(..., max_length=100)
    description: str = Field(..., max_length=500)
    battery: int = Field(..., ge=0, le=100)
    propeller_rpm: int = Field(..., ge=0, le=11000)
    speed: int = Field(..., ge=0, le=140)
    altitude: int = Field(..., ge=0, le=150)
    latitude: Decimal = Field(..., ge=-90, le=90, max_digits=10, decimal_places=6)
    longitude: Decimal = Field(..., ge=-180, le=180, max_digits=10, decimal_places=6)
    start_lat: Decimal = Field(..., ge=-90, le=90, max_digits=10, decimal_places=6)
    start_lon: Decimal = Field(..., ge=-180, le=180, max_digits=10, decimal_places=6)
    end_lat: Decimal = Field(..., ge=-90, le=90, max_digits=10, decimal_places=6)
    end_lon: Decimal = Field(..., ge=-180, le=180, max_digits=10, decimal_places=6)

    def get_battery_status(self) -> str:
        if self.battery < 15: return "danger"
        if self.battery < 30: return "warning"
        return "normal"

    def get_rpm_status(self) -> str:
        if self.propeller_rpm <= 1500 or self.propeller_rpm >= 9500: return "danger"
        if self.propeller_rpm < 3000 or self.propeller_rpm > 8000: return "warning"
        return "normal"

    def get_speed_status(self) -> str:
        if self.speed <= 10 or self.speed >= 160: return "danger"
        if self.speed < 60 or self.speed > 110: return "warning"
        return "normal"
    
    def get_altitude_status(self) -> str:
        if self.altitude >= 140: return "danger"
        if self.altitude > 120: return "warning"

    def calculate_status(self) -> str:
        statuses = [self.get_battery_status(), self.get_rpm_status(), self.get_speed_status(), self.get_altitude_status()]
        if "danger" in statuses: return "danger"
        if "warning" in statuses: return "warning"
        return "normal"