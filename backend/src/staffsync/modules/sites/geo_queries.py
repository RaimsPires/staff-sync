"""PostGIS queries for sites. Everything geographic is evaluated in the database (geography type, meters)."""

import json
from uuid import UUID

from sqlalchemy import text
from sqlmodel.ext.asyncio.session import AsyncSession

from staffsync.common.geo import check_point, circle_polygon, validate_polygon


async def circle_wkt(session: AsyncSession, lng: float, lat: float, radius_m: float) -> str:
    check_point(lat, lng)
    row = (
        await session.execute(
            text("SELECT ST_AsText(ST_Buffer(ST_GeogFromText(:p), :r)::geometry)"), {"p": f"SRID=4326;POINT({lng} {lat})", "r": radius_m}
        )
    ).scalar_one()
    # validate through Shapely as well (area limits, validity)
    circle_polygon(lng, lat, radius_m)
    return f"SRID=4326;{row}"


def point_wkt(lng: float, lat: float) -> str:
    check_point(lat, lng)
    return f"SRID=4326;POINT({lng} {lat})"


def polygon_wkt(geojson: dict) -> tuple[str, tuple[float, float]]:
    poly = validate_polygon(geojson)
    c = poly.centroid
    return f"SRID=4326;{poly.wkt}", (c.x, c.y)


async def geo_for_sites(session: AsyncSession, ids: list[UUID]) -> dict[UUID, dict]:
    if not ids:
        return {}
    rows = (
        await session.execute(
            text(
                "SELECT id, ST_X(location::geometry) AS lng, ST_Y(location::geometry) AS lat, "
                "ST_AsGeoJSON(geofence::geometry) AS gj FROM sites WHERE id = ANY(:ids)"
            ),
            {"ids": ids},
        )
    ).all()
    return {r.id: {"center": [r.lng, r.lat], "geojson": json.loads(r.gj)} for r in rows}


async def probe(session: AsyncSession, site_id: UUID, lat: float, lng: float) -> tuple[bool, float]:
    """(inside geofence, distance in meters to the boundary — 0 when inside)."""
    row = (
        await session.execute(
            text(
                "SELECT ST_Covers(geofence, ST_GeogFromText(:p)) AS inside, ST_Distance(geofence, ST_GeogFromText(:p)) AS dist "
                "FROM sites WHERE id = :id"
            ),
            {"p": f"SRID=4326;POINT({lng} {lat})", "id": site_id},
        )
    ).one()
    return bool(row.inside), float(row.dist)


async def overlaps(session: AsyncSession, site_id: UUID, company_id: UUID) -> list[UUID]:
    rows = (
        await session.execute(
            text(
                "SELECT b.id FROM sites a JOIN sites b ON ST_Intersects(a.geofence, b.geofence) "
                "WHERE a.id = :id AND b.id <> a.id AND b.company_id = :cid AND b.deleted_at IS NULL"
            ),
            {"id": site_id, "cid": company_id},
        )
    ).all()
    return [r.id for r in rows]
