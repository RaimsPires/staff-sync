from datetime import time
from uuid import UUID

from geoalchemy2 import Geography
from sqlalchemy import Index, text
from sqlmodel import Column, Field, SQLModel

from staffsync.common.models import IdMixin, SoftDeleteMixin, TenantMixin, TimestampMixin, VersionMixin


class Site(IdMixin, TimestampMixin, SoftDeleteMixin, VersionMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "sites"
    __table_args__ = (
        Index("uq_site_code_live", "company_id", "code", unique=True, postgresql_where=text("deleted_at IS NULL")),
        Index("ix_sites_geofence", "geofence", postgresql_using="gist"),
    )

    branch_id: UUID = Field(foreign_key="branches.id", index=True)
    name: str
    code: str
    address: str | None = None
    location: str = Field(sa_column=Column(Geography("POINT", srid=4326, spatial_index=False), nullable=False))
    geofence: str = Field(sa_column=Column(Geography("POLYGON", srid=4326, spatial_index=False), nullable=False))
    geofence_kind: str = "circle"  # circle | polygon
    radius_m: float | None = None
    timezone: str = "Africa/Douala"
    require_selfie: bool = False
    require_qr: bool = False
    device_binding: bool = True
    allow_offline: bool = True
    min_accuracy_m: int = 50
    qr_secret: str
    qr_version: int = 1
    default_start: time | None = None
    default_end: time | None = None
    status: str = "active"  # active | inactive


class SiteManager(IdMixin, TenantMixin, SQLModel, table=True):
    __tablename__ = "site_managers"
    __table_args__ = (Index("uq_site_manager", "site_id", "user_id", unique=True),)

    user_id: UUID = Field(foreign_key="users.id", index=True)
    site_id: UUID = Field(foreign_key="sites.id", index=True)
