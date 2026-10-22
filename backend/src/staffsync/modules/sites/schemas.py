from datetime import time
from typing import Annotated, Any, Literal
from uuid import UUID

from pydantic import BaseModel, Field


class CircleIn(BaseModel):
    type: Literal["circle"]
    center: Annotated[list[float], Field(min_length=2, max_length=2)]  # [lng, lat]
    radius_m: float = Field(gt=0, le=2000)


class PolygonIn(BaseModel):
    type: Literal["polygon"]
    geojson: dict[str, Any]  # GeoJSON Polygon, [lng, lat]


Geofence = Annotated[CircleIn | PolygonIn, Field(discriminator="type")]


class SiteBase(BaseModel):
    name: str = Field(min_length=2, max_length=120)
    code: str = Field(min_length=1, max_length=20, pattern=r"^[A-Za-z0-9_-]+$")
    address: str | None = None
    timezone: str = "Africa/Douala"
    require_selfie: bool = False
    require_qr: bool = False
    device_binding: bool = True
    allow_offline: bool = True
    min_accuracy_m: int = Field(default=50, ge=5, le=500)
    default_start: time | None = None
    default_end: time | None = None


class SiteCreate(SiteBase):
    branch_id: UUID
    geofence: Geofence
    center: Annotated[list[float], Field(min_length=2, max_length=2)] | None = None  # [lng, lat]; defaults to circle center / polygon centroid
    manager_ids: list[UUID] = []
    employee_ids: list[UUID] = []


class SiteUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=120)
    code: str | None = Field(default=None, min_length=1, max_length=20, pattern=r"^[A-Za-z0-9_-]+$")
    branch_id: UUID | None = None
    address: str | None = None
    timezone: str | None = None
    require_selfie: bool | None = None
    require_qr: bool | None = None
    device_binding: bool | None = None
    allow_offline: bool | None = None
    min_accuracy_m: int | None = Field(default=None, ge=5, le=500)
    default_start: time | None = None
    default_end: time | None = None
    geofence: Geofence | None = None
    center: Annotated[list[float], Field(min_length=2, max_length=2)] | None = None


class SiteRead(SiteBase):
    id: UUID
    branch_id: UUID
    status: str
    version: int
    geofence_kind: str
    radius_m: float | None
    center: list[float]  # [lng, lat]
    geofence_geojson: dict[str, Any]
    managers: list[dict] = []
    employees_count: int = 0
    deleted_at: str | None = None


class SiteNearby(BaseModel):
    id: UUID
    name: str
    address: str | None
    center: list[float]
    geofence_geojson: dict[str, Any]
    min_accuracy_m: int
    require_selfie: bool
    require_qr: bool
    distance_m: float
    inside: bool
    manager_name: str | None = None
    manager_phone: str | None = None


class IdsIn(BaseModel):
    ids: list[UUID]
