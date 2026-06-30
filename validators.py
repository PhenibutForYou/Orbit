from pydantic import BaseModel, Field
from typing import Literal

# 1. Машина
class CarSchema(BaseModel):
    id: str = Field(..., max_length=10)
    fuel_level: int = Field(..., ge=0, le=100)
    engine_temp: int = Field(..., ge=0, le=150)
    speed: int = Field(..., ge=0, le=60)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    start_lat: float = Field(..., ge=-90, le=90)
    start_lon: float = Field(..., ge=-180, le=180)
    end_lat: float = Field(..., ge=-90, le=90)
    end_lon: float = Field(..., ge=-180, le=180)

    def calculate_status(self) -> str:
        if self.fuel_level < 5 or self.engine_temp >= 120:
            return "danger"
        if self.fuel_level < 10 or self.engine_temp >= 110:
            return "warning"
        return "normal"

# 2. АЗС
class GasStationSchema(BaseModel):
    id: str = Field(..., max_length=10)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    fuel_level: int = Field(..., ge=0, le=100)
    fuel_type: Literal["АИ-95", "АИ-98", "АИ-100", "Дизель"]
    price: float = Field(..., gt=0)
    occupancy: int = Field(..., ge=0)

    def calculate_status(self) -> str:
        if self.fuel_level < 10:
            return "danger"
        if self.fuel_level < 20:
            return "warning"
        return "normal"

# 3. Склад
class WarehouseSchema(BaseModel):
    id: str = Field(..., max_length=10)
    capacity_used: int = Field(..., ge=0, le=100) 
    temperature: int = Field(..., ge=0, le=40)
    humidity: int = Field(..., ge=0, le=100)
    trucks_count: int = Field(..., ge=0, le=50)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)

    def calculate_status(self) -> str:
        if self.capacity_used >= 95 or self.temperature <= 5 or self.temperature >= 30 or self.humidity <= 20 or self.humidity >= 80:
            return "danger"
        if self.capacity_used >= 80 or self.temperature <= 10 or self.temperature >= 25 or self.humidity <= 30 or self.humidity >= 60:
            return "warning"
        return "normal"

# 4. Дрон
class DroneSchema(BaseModel):
    id: str = Field(..., max_length=10)
    battery: int = Field(..., ge=0, le=100)
    propeller_rpm: int = Field(..., ge=0, le=20000)
    speed: int = Field(..., ge=0, le=60)
    altitude: int = Field(..., ge=0)
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    start_lat: float = Field(..., ge=-90, le=90)
    start_lon: float = Field(..., ge=-180, le=180)
    end_lat: float = Field(..., ge=-90, le=90)
    end_lon: float = Field(..., ge=-180, le=180)

    def calculate_status(self) -> str:
        if self.battery < 15 or self.propeller_rpm <= 1500 or self.propeller_rpm >= 10000:
            return "danger"
        if self.battery < 30 or self.propeller_rpm <= 3000 or self.propeller_rpm >= 8000:
            return "warning"
        return "normal"