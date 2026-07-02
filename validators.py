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

    def calculate_status(self) -> str:
        if (self.fuel_level < 5 or self.engine_temp <= 40 or self.engine_temp >= 160 or self.speed <= 10 or self.speed >= 160):
            return "danger"
        if (self.fuel_level < 10 or self.engine_temp < 90 or self.engine_temp > 110 or self.speed < 60 or self.speed > 110):
            return "warning"
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
    occupancy: int = Field(..., ge=0)

    def calculate_status(self) -> str:
        if self.fuel_level < 10:
            return "danger"
        if self.fuel_level < 20:
            return "warning"
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

    def calculate_status(self) -> str:
        if (self.capacity_used >= 95 or self.temperature <= 5 or self.temperature >= 30 or self.humidity <= 20 or self.humidity >= 80 or self.trucks_count >= 45):
            return "danger"
        if (self.capacity_used >= 80 or self.temperature < 10 or self.temperature > 25 or self.humidity < 30 or self.humidity > 70 or self.trucks_count > 40):
            return "warning"
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

    def calculate_status(self) -> str:
        if (self.battery < 15 or self.propeller_rpm <= 1500 or self.propeller_rpm >= 9500 or self.speed <= 10 or self.speed >= 160):
            return "danger"
        if (self.battery < 30 or self.propeller_rpm < 3000 or self.propeller_rpm > 8000 or self.speed < 60 or self.speed > 110):
            return "warning"
        return "normal"