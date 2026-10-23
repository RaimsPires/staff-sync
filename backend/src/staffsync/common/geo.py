"""Geofence helpers: validation with Shapely, circle/polygon normalisation, haversine."""

import math
from typing import Any

from shapely import wkt
from shapely.geometry import Point, Polygon, shape
from shapely.validation import explain_validity

from staffsync.core.errors import ValidationFailed
from staffsync.core.logging import get_logger

MIN_AREA_M2 = 10
MAX_AREA_M2 = 5_000_000
EARTH_R = 6_371_008.8


def haversine_m(lat1: float, lng1: float, lat2: float, lng2: float) -> float:
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = p2 - p1, math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * EARTH_R * math.asin(math.sqrt(a))


def _area_m2(poly: Polygon) -> float:
    """Approximate area using a local equirectangular projection (fine for site-sized shapes)."""
    lat0 = math.radians(poly.centroid.y)
    kx, ky = math.cos(lat0) * math.pi / 180 * EARTH_R, math.pi / 180 * EARTH_R
    coords = [((x) * kx, y * ky) for x, y in poly.exterior.coords]
    return Polygon(coords).area


def validate_polygon(geojson: dict[str, Any]) -> Polygon:
    try:
        poly = shape(geojson)
    except Exception as exc:
        raise ValidationFailed("Invalid GeoJSON polygon") from exc
    if not isinstance(poly, Polygon):
        raise ValidationFailed("Geofence must be a Polygon")
    if len(poly.exterior.coords) < 4:
        raise ValidationFailed("A polygon needs at least 3 points")
    if not poly.is_valid:
        get_logger().info("invalid_polygon", reason=explain_validity(poly))
        raise ValidationFailed("The drawn area is not valid. Make sure its edges do not cross.", code="INVALID_POLYGON")
    for x, y in poly.exterior.coords:
        if not (-180 <= x <= 180 and -90 <= y <= 90):
            raise ValidationFailed("Coordinates out of range (expected [lng, lat])")
    area = _area_m2(poly)
    if not (MIN_AREA_M2 <= area <= MAX_AREA_M2):
        raise ValidationFailed(
            f"Geofence area must be between {MIN_AREA_M2} m² and {MAX_AREA_M2 // 1_000_000} km²",
            code="AREA_OUT_OF_RANGE",
            min_m2=MIN_AREA_M2,
            max_km2=MAX_AREA_M2 // 1_000_000,
        )
    return poly


def circle_polygon(lng: float, lat: float, radius_m: float, segments: int = 64) -> Polygon:
    """Approximate circle as a polygon (the DB also does this with ST_Buffer; this keeps unit tests DB-free)."""
    if not (1 <= radius_m <= 2000):
        raise ValidationFailed("Radius must be between 1 and 2000 m")
    dlat = radius_m / (math.pi / 180 * EARTH_R)
    dlng = dlat / max(math.cos(math.radians(lat)), 1e-6)
    pts = [
        (lng + dlng * math.cos(2 * math.pi * i / segments), lat + dlat * math.sin(2 * math.pi * i / segments))
        for i in range(segments)
    ]
    return Polygon(pts)


def check_point(lat: float, lng: float) -> Point:
    if not (-90 <= lat <= 90 and -180 <= lng <= 180):
        raise ValidationFailed("Coordinates out of range")
    return Point(lng, lat)


def to_wkt(geom) -> str:
    return f"SRID=4326;{geom.wkt}"


def from_wkt(value: str):
    return wkt.loads(value.split(";", 1)[-1])
