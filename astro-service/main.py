from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from kerykeion import AstrologicalSubject
import redis
import json
import hashlib
from datetime import datetime
import os

app = FastAPI(
    title="AI Astrolog1 - Natal Chart Service",
    version="1.0.0"
)

REDIS_HOST = os.getenv("REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("REDIS_PORT", 6379))
redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)


class NatalChartRequest(BaseModel):
    name: str
    birth_date: str
    birth_time: str
    birth_city: str
    latitude: float
    longitude: float
    timezone: str = "UTC"


class NatalChartResponse(BaseModel):
    sun_sign: str
    moon_sign: str
    ascendant: str
    planets: Dict[str, Dict[str, Any]]
    houses: Dict[str, Dict[str, Any]]
    aspects: list
    raw_data: Dict[str, Any]


def generate_cache_key(data: NatalChartRequest) -> str:
    key_string = f"{data.birth_date}:{data.birth_time}:{data.latitude}:{data.longitude}"
    return f"natal_chart:{hashlib.md5(key_string.encode()).hexdigest()}"


@app.get("/health")
async def health_check():
    try:
        redis_client.ping()
        redis_status = "connected"
    except Exception:
        redis_status = "disconnected"
    return {"status": "healthy", "redis": redis_status}


@app.post("/natal-chart", response_model=NatalChartResponse)
async def calculate_natal_chart(request: NatalChartRequest):
    cache_key = generate_cache_key(request)
    cached_result = redis_client.get(cache_key)
    if cached_result:
        return NatalChartResponse(**json.loads(cached_result))

    try:
        year, month, day = map(int, request.birth_date.split('-'))
        hour, minute = map(int, request.birth_time.split(':'))

        subject = AstrologicalSubject(
            name=request.name,
            year=year,
            month=month,
            day=day,
            hour=hour,
            minute=minute,
            lat=request.latitude,
            lng=request.longitude,
            tz_str=request.timezone,
        )

        # Планеты - берём атрибуты напрямую (sun, moon, mercury...)
        planets_data = {}
        planet_names = ["Sun", "Moon", "Mercury", "Venus", "Mars",
                        "Jupiter", "Saturn", "Uranus", "Neptune", "Pluto"]

        for planet_name in planet_names:
            planet = getattr(subject, planet_name.lower(), None)
            if planet is None:
                continue
            # В kerykeion планета - это dict-like объект
            sign = planet.get('sign', 'Unknown') if isinstance(planet, dict) else getattr(planet, 'sign', 'Unknown')
            abs_pos = planet.get('abs_pos', 0) if isinstance(planet, dict) else getattr(planet, 'abs_pos', 0)
            retro = planet.get('retrograde', False) if isinstance(planet, dict) else getattr(planet, 'retrograde', False)
            house = planet.get('house', '') if isinstance(planet, dict) else getattr(planet, 'house', '')

            planets_data[planet_name] = {
                "sign": sign,
                "degree": round(float(abs_pos), 2),
                "retrograde": bool(retro),
                "house": house
            }

        # Дома
        houses_data = {}
        if hasattr(subject, 'houses_list') and subject.houses_list:
            for i, house in enumerate(subject.houses_list, 1):
                if isinstance(house, dict):
                    houses_data[str(i)] = {
                        "sign": house.get('sign', 'Unknown'),
                        "degree": house.get('abs_pos', 0),
                        "name": house.get('name', '')
                    }
                else:
                    houses_data[str(i)] = {
                        "sign": getattr(house, 'sign', 'Unknown'),
                        "degree": getattr(house, 'abs_pos', 0),
                        "name": getattr(house, 'name', '')
                    }

        # Аспекты
        aspects_data = []
        if hasattr(subject, 'aspects_list') and subject.aspects_list:
            for aspect in subject.aspects_list[:20]:
                if isinstance(aspect, dict):
                    aspects_data.append({
                        "planet1": aspect.get('p1_name', ''),
                        "planet2": aspect.get('p2_name', ''),
                        "aspect_type": aspect.get('aspect', ''),
                        "orbit": aspect.get('orbit', 0)
                    })
                else:
                    aspects_data.append({
                        "planet1": getattr(aspect, 'p1_name', ''),
                        "planet2": getattr(aspect, 'p2_name', ''),
                        "aspect_type": getattr(aspect, 'aspect', ''),
                        "orbit": getattr(aspect, 'orbit', 0)
                    })

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

        redis_client.setex(cache_key, 86400, json.dumps(response_data))
        return NatalChartResponse(**response_data)

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка расчёта: {str(e)}")



@app.get("/natal-chart/svg")
async def get_natal_chart_svg(
    name: str = "User",
    birth_date: str = "1990-01-01",
    birth_time: str = "12:00",
    latitude: float = 55.7558,
    longitude: float = 37.6173,
    timezone: str = "Europe/Moscow"
):
    """Генерирует SVG-колесо натальной карты"""
    from fastapi.responses import Response
    from kerykeion.charts.kerykeion_chart_svg import KerykeionChartSVG
    
    cache_key = f"natal_svg:{hashlib.md5(f'{birth_date}:{birth_time}:{latitude}:{longitude}'.encode()).hexdigest()}"
    cached_svg = redis_client.get(cache_key)
    if cached_svg:
        return Response(content=cached_svg, media_type="image/svg+xml")
    
    try:
        year, month, day = map(int, birth_date.split('-'))
        hour, minute = map(int, birth_time.split(':'))
        
        subject = AstrologicalSubject(
            name=name,
            year=year, month=month, day=day,
            hour=hour, minute=minute,
            lat=latitude, lng=longitude,
            tz_str=timezone,
        )
        
        chart = KerykeionChartSVG(subject)
        svg_string = chart.makeTemplate()
        
        if not svg_string:
            raise HTTPException(status_code=500, detail="Не удалось сгенерировать SVG")
        
        # Кэшируем на 24 часа
        redis_client.setex(cache_key, 86400, svg_string)
        
        return Response(content=svg_string, media_type="image/svg+xml")
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Ошибка генерации SVG: {str(e)}")


@app.get("/")
async def root():
    return {"service": "astro-service", "status": "ok"}
