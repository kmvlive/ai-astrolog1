from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from kerykeion import AstrologicalSubject, KerykeionChartSVG
import redis
import json
import hashlib
from datetime import datetime
import os

app = FastAPI(
    title="AI Astrolog1 - Natal Chart Service",
    description="Микросервис для расчёта натальных карт с использованием kerykeion и Swiss Ephemeris",
    version="1.0.0"
)

# Redis connection for caching
REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)


class NatalChartRequest(BaseModel):
    """Запрос на расчёт натальной карты"""
    name: str = Field(..., description="Имя пользователя (для идентификации)")
    birth_date: str = Field(..., description="Дата рождения в формате YYYY-MM-DD")
    birth_time: str = Field(..., description="Время рождения в формате HH:MM")
    birth_city: str = Field(..., description="Город рождения")
    latitude: float = Field(..., description="Широта места рождения")
    longitude: float = Field(..., description="Долгота места рождения")
    timezone: str = Field(default="UTC", description="Часовой пояс")


class NatalChartResponse(BaseModel):
    """Ответ с данными натальной карты"""
    sun_sign: str
    moon_sign: str
    ascendant: str
    planets: Dict[str, Dict[str, Any]]
    houses: Dict[str, Dict[str, Any]]
    aspects: list[Dict[str, Any]]
    raw_data: Dict[str, Any]


def generate_cache_key(data: NatalChartRequest) -> str:
    """Генерирует уникальный ключ для кэширования"""
    key_string = f"{data.birth_date}:{data.birth_time}:{data.latitude}:{data.longitude}"
    return f"natal_chart:{hashlib.md5(key_string.encode()).hexdigest()}"


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        redis_client.ping()
        redis_status = "connected"
    except Exception:
        redis_status = "disconnected"
    
    return {
        "status": "healthy",
        "service": "astro-service",
        "timestamp": datetime.utcnow().isoformat(),
        "redis": redis_status
    }


@app.post("/natal-chart", response_model=NatalChartResponse)
async def calculate_natal_chart(request: NatalChartRequest):
    """
    Рассчитывает натальную карту по заданным параметрам.
    
    Использует библиотеку kerykeion с Swiss Ephemeris для точных расчётов.
    Результаты кэшируются в Redis на 24 часа.
    """
    # Проверка кэша
    cache_key = generate_cache_key(request)
    cached_result = redis_client.get(cache_key)
    
    if cached_result:
        return NatalChartResponse(**json.loads(cached_result))
    
    try:
        # Парсинг даты и времени
        year, month, day = map(int, request.birth_date.split('-'))
        hour, minute = map(int, request.birth_time.split(':'))
        
        # Создание объекта натальной карты через kerykeion
        subject = AstrologicalSubject(
            name=request.name,
            year=year,
            month=month,
            day=day,
            hour=hour,
            minute=minute,
            lat=request.latitude,
            lon=request.longitude,
            tz_str=request.timezone,
            language="ru"
        )
        
        # Извлечение данных о планетах
        planets_data = {}
        planet_names = ["Sun", "Moon", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]
        
        for planet_name in planet_names:
            planet = getattr(subject, f"{planet_name.lower()}_place", None)
            if planet:
                planets_data[planet_name] = {
                    "sign": planet.sign,
                    "degree": round(planet.abs_pos, 2),
                    "retrograde": planet.retrograde if hasattr(planet, 'retrograde') else False
                }
        
        # Данные о домах
        houses_data = {}
        if hasattr(subject, 'houses_list') and subject.houses_list:
            for i, house in enumerate(subject.houses_list, 1):
                houses_data[str(i)] = {
                    "sign": house.get('sign', 'Unknown'),
                    "degree": house.get('abs_pos', 0)
                }
        
        # Аспекты (упрощённо)
        aspects_data = []
        if hasattr(subject, 'aspects_list') and subject.aspects_list:
            for aspect in subject.aspects_list[:20]:  # Ограничим первыми 20 аспектами
                aspects_data.append({
                    "planet1": aspect.get('planet1', ''),
                    "planet2": aspect.get('planet2', ''),
                    "aspect_type": aspect.get('aspect', ''),
                    "orbit": aspect.get('orbit', 0)
                })
        
        # Формирование ответа
        response_data = {
            "sun_sign": planets_data.get("Sun", {}).get("sign", "Unknown"),
            "moon_sign": planets_data.get("Moon", {}).get("sign", "Unknown"),
            "ascendant": houses_data.get("1", {}).get("sign", "Unknown"),
            "planets": planets_data,
            "houses": houses_data,
            "aspects": aspects_data,
            "raw_data": {
                "subject": request.name,
                "birth_date": request.birth_date,
                "birth_time": request.birth_time,
                "location": {
                    "city": request.birth_city,
                    "latitude": request.latitude,
                    "longitude": request.longitude,
                    "timezone": request.timezone
                }
            }
        }
        
        # Кэширование результата на 24 часа
        redis_client.setex(
            cache_key,
            86400,  # 24 часа в секундах
            json.dumps(response_data)
        )
        
        return NatalChartResponse(**response_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=400,
            detail=f"Ошибка при расчёте натальной карты: {str(e)}"
        )


@app.get("/")
async def root():
    """Корневой endpoint с информацией о сервисе"""
    return {
        "service": "AI Astrolog1 - Natal Chart Service",
        "version": "1.0.0",
        "description": "Микросервис для расчёта натальных карт",
        "docs": "/docs",
        "health": "/health"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8001)
