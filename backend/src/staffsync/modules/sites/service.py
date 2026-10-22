import hmac
import secrets
import time as _time
from uuid import UUID
from zoneinfo import ZoneInfo, ZoneInfoNotFoundError

from sqlalchemy import func, text
from sqlalchemy.exc import IntegrityError
from sqlmodel import select

from staffsync.common.repository import TenantRepository
from staffsync.common.softdelete import restore, soft_delete
from staffsync.core.audit import audit
from staffsync.core.context import RequestContext
from staffsync.core.errors import BusinessRule, Conflict, NotFound, ValidationFailed
from staffsync.core.outbox import emit
from staffsync.core.security import hmac_sign
from staffsync.modules.auth.models import User
from staffsync.modules.branches.models import Branch
from staffsync.modules.employees.models import Employee, EmployeeSite
from staffsync.modules.sites import geo_queries as geo
from staffsync.modules.sites.models import Site, SiteManager
from staffsync.modules.sites.schemas import CircleIn, SiteCreate, SiteNearby, SiteRead, SiteUpdate


class SiteRepository(TenantRepository[Site]):
    model = Site

    def scope(self, stmt):
        if self.ctx.scope.site_ids is None:
            return stmt
        return stmt.where(Site.id.in_(set(self.ctx.scope.site_ids))) if self.ctx.scope.site_ids else stmt.where(Site.id.is_(None))


def _check_tz(tz: str) -> None:
    try:
        ZoneInfo(tz)
    except ZoneInfoNotFoundError as exc:
        raise ValidationFailed("Unknown timezone") from exc


async def _geometry(ctx: RequestContext, g, center: list[float] | None) -> tuple[str, str, str, float | None]:
    """-> (location_wkt, geofence_wkt, kind, radius)"""
    if isinstance(g, CircleIn):
        lng, lat = g.center
        loc = geo.point_wkt(*(center or g.center))
        return loc, await geo.circle_wkt(ctx.session, lng, lat, g.radius_m), "circle", g.radius_m
    poly_wkt, centroid = geo.polygon_wkt(g.geojson)
    return geo.point_wkt(*(center or centroid)), poly_wkt, "polygon", None


async def _check_branch(ctx: RequestContext, branch_id: UUID) -> Branch:
    branch = (await ctx.session.exec(select(Branch).where(Branch.id == branch_id, Branch.company_id == ctx.company_id))).first()
    if branch is None or not ctx.branch_allowed(branch.id):
        raise NotFound("Branch not found")
    if branch.status != "active":
        raise BusinessRule("Branch is archived")
    return branch


async def set_managers(ctx: RequestContext, site: Site, user_ids: list[UUID]) -> None:
    existing = (await ctx.session.exec(select(SiteManager).where(SiteManager.site_id == site.id))).all()
    for m in existing:
        await ctx.session.delete(m)
    await ctx.session.flush()
    for uid in dict.fromkeys(user_ids):
        user = await ctx.session.get(User, uid)
        if user is None:
            raise ValidationFailed("Unknown manager")
        ctx.session.add(SiteManager(company_id=ctx.company_id, site_id=site.id, user_id=uid))


async def set_employees(ctx: RequestContext, site: Site, employee_ids: list[UUID]) -> None:
    emps = (await ctx.session.exec(select(Employee).where(Employee.id.in_(employee_ids), Employee.company_id == ctx.company_id))).all() if employee_ids else []  # type: ignore[attr-defined]
    if len(emps) != len(set(employee_ids)):
        raise ValidationFailed("Unknown employee in list")
    current = {e.employee_id: e for e in (await ctx.session.exec(select(EmployeeSite).where(EmployeeSite.site_id == site.id))).all()}
    for eid, link in current.items():
        if eid not in employee_ids:
            await ctx.session.delete(link)
    for eid in employee_ids:
        if eid not in current:
            ctx.session.add(EmployeeSite(company_id=ctx.company_id, employee_id=eid, site_id=site.id))


async def create(ctx: RequestContext, body: SiteCreate) -> Site:
    _check_tz(body.timezone)
    await _check_branch(ctx, body.branch_id)
    loc, fence, kind, radius = await _geometry(ctx, body.geofence, body.center)
    site = Site(
        company_id=ctx.company_id,
        location=loc,
        geofence=fence,
        geofence_kind=kind,
        radius_m=radius,
        qr_secret=secrets.token_urlsafe(32),
        **body.model_dump(exclude={"geofence", "center", "manager_ids", "employee_ids"}),
    )
    ctx.session.add(site)
    try:
        await ctx.session.flush()
    except IntegrityError as exc:
        raise Conflict("A site with this code already exists", code="CODE_TAKEN") from exc
    await set_managers(ctx, site, body.manager_ids)
    await set_employees(ctx, site, body.employee_ids)
    audit(ctx, "site.created", "site", site.id, after={"name": site.name, "code": site.code, "geofence": kind})
    emit(ctx.session, ctx.company_id, "SiteCreated", {"id": str(site.id)})
    return site


async def update(ctx: RequestContext, site: Site, body: SiteUpdate, if_match: int | None) -> Site:
    if if_match is not None and if_match != site.version:
        raise Conflict("The site was changed by someone else", code="VERSION_CONFLICT", version=site.version)
    data = body.model_dump(exclude_unset=True, exclude={"geofence", "center"})
    if "timezone" in data:
        _check_tz(data["timezone"])
    if "branch_id" in data:
        await _check_branch(ctx, data["branch_id"])
    fence_changed = False
    if body.geofence is not None:
        site.location, site.geofence, site.geofence_kind, site.radius_m = await _geometry(ctx, body.geofence, body.center)
        fence_changed = True
    elif body.center is not None:
        site.location = geo.point_wkt(*body.center)
    before = {k: getattr(site, k) for k in data}
    for k, v in data.items():
        setattr(site, k, v)
    site.version += 1
    ctx.session.add(site)
    try:
        await ctx.session.flush()
    except IntegrityError as exc:
        raise Conflict("A site with this code already exists", code="CODE_TAKEN") from exc
    audit(ctx, "site.geofence_changed" if fence_changed else "site.updated", "site", site.id, before=_jsonable(before), after=_jsonable(data))
    return site


def _jsonable(d: dict) -> dict:
    return {k: (v.isoformat() if hasattr(v, "isoformat") else str(v) if isinstance(v, UUID) else v) for k, v in d.items()}


async def to_read(ctx: RequestContext, sites: list[Site]) -> list[SiteRead]:
    ids = [s.id for s in sites]
    geos = await geo.geo_for_sites(ctx.session, ids)
    managers: dict[UUID, list[dict]] = {i: [] for i in ids}
    if ids:
        for sm, u in (await ctx.session.exec(select(SiteManager, User).join(User, User.id == SiteManager.user_id).where(SiteManager.site_id.in_(ids)))).all():  # type: ignore[attr-defined]
            managers[sm.site_id].append({"user_id": u.id, "name": u.full_name, "phone": u.phone})
        counts = dict((await ctx.session.exec(select(EmployeeSite.site_id, func.count()).where(EmployeeSite.site_id.in_(ids)).group_by(EmployeeSite.site_id))).all())  # type: ignore[attr-defined]
    else:
        counts = {}
    out = []
    for s in sites:
        g = geos[s.id]
        out.append(
            SiteRead(
                **s.model_dump(include=set(SiteRead.model_fields) - {"center", "geofence_geojson", "managers", "employees_count", "deleted_at"}),
                center=g["center"],
                geofence_geojson=g["geojson"],
                managers=managers[s.id],
                employees_count=counts.get(s.id, 0),
                deleted_at=s.deleted_at.isoformat() if s.deleted_at else None,
            )
        )
    return out


async def list_sites(ctx: RequestContext, *, branch_id: UUID | None, bbox: str | None, status: str | None, include_deleted: bool, only_deleted: bool) -> list[Site]:
    stmt = SiteRepository(ctx).query(include_deleted=include_deleted, only_deleted=only_deleted).order_by(Site.name)
    if branch_id:
        stmt = stmt.where(Site.branch_id == branch_id)
    if status:
        stmt = stmt.where(Site.status == status)
    if bbox:
        try:
            w, s, e, n = (float(x) for x in bbox.split(","))
        except ValueError as exc:
            raise ValidationFailed("bbox must be west,south,east,north") from exc
        stmt = stmt.where(text("location && ST_MakeEnvelope(:w,:s,:e,:n,4326)::geography").bindparams(w=w, s=s, e=e, n=n))
    return list((await ctx.session.exec(stmt)).all())


async def set_status(ctx: RequestContext, site: Site, status: str) -> Site:
    site.status = status
    ctx.session.add(site)
    audit(ctx, f"site.{'deactivated' if status == 'inactive' else 'activated'}", "site", site.id)
    return site


async def delete(ctx: RequestContext, site: Site, reason: str) -> None:
    if site.status != "inactive":
        raise Conflict("Deactivate the site first", code="NOT_DEACTIVATED")
    site.qr_secret = secrets.token_urlsafe(32)  # invalidate printed QR codes
    soft_delete(ctx, site, reason, entity="site")


async def restore_site(ctx: RequestContext, site: Site) -> Site:
    clash = (await ctx.session.exec(select(Site).where(Site.company_id == ctx.company_id, Site.code == site.code, Site.id != site.id))).first()
    if clash:
        raise Conflict("Site code has been reused; change it before restoring", code="CODE_TAKEN")
    restore(ctx, site, entity="site")
    return site


# --- QR codes -----------------------------------------------------------------------------------------


def qr_payload(site: Site, window_s: int = 0) -> str:
    """Static (window_s=0) or time-windowed payload, HMAC-signed with the site secret."""
    w = int(_time.time() // window_s) if window_s else 0
    body = f"ss1.{site.id}.{site.qr_version}.{w}"
    return f"{body}.{hmac_sign(site.qr_secret, body)[:32]}"


def verify_qr(site: Site, payload: str | None, window_s: int = 300) -> bool:
    try:
        prefix, sid, ver, w, sig = (payload or "").split(".")
    except ValueError:
        return False
    body = f"{prefix}.{sid}.{ver}.{w}"
    if prefix != "ss1" or sid != str(site.id) or not ver.isdigit() or int(ver) != site.qr_version:
        return False
    if not hmac.compare_digest(hmac_sign(site.qr_secret, body)[:32], sig):
        return False
    if w.isdigit() and int(w) != 0:
        return abs(int(_time.time() // window_s) - int(w)) <= 1
    return True


async def rotate_qr(ctx: RequestContext, site: Site) -> Site:
    site.qr_secret = secrets.token_urlsafe(32)
    site.qr_version += 1
    ctx.session.add(site)
    audit(ctx, "site.qr_rotated", "site", site.id)
    return site


async def nearby(ctx: RequestContext, lat: float, lng: float) -> list[SiteNearby]:
    emp_id = ctx.require_employee()
    rows = (
        await ctx.session.execute(
            text(
                "SELECT s.id, ST_Distance(s.location, ST_GeogFromText(:p)) AS dist, ST_Covers(s.geofence, ST_GeogFromText(:p)) AS inside "
                "FROM sites s JOIN employee_sites es ON es.site_id = s.id "
                "WHERE es.employee_id = :e AND s.deleted_at IS NULL AND s.status = 'active' ORDER BY dist"
            ),
            {"p": f"SRID=4326;POINT({lng} {lat})", "e": emp_id},
        )
    ).all()
    sites = {s.id: s for s in (await ctx.session.exec(select(Site).where(Site.id.in_([r.id for r in rows])))).all()} if rows else {}  # type: ignore[attr-defined]
    geos = await geo.geo_for_sites(ctx.session, list(sites))
    out = []
    for r in rows:
        s = sites[r.id]
        mgr = (await ctx.session.exec(select(User).join(SiteManager, SiteManager.user_id == User.id).where(SiteManager.site_id == s.id))).first()
        out.append(
            SiteNearby(
                id=s.id, name=s.name, address=s.address, center=geos[s.id]["center"], geofence_geojson=geos[s.id]["geojson"],
                min_accuracy_m=s.min_accuracy_m, require_selfie=s.require_selfie, require_qr=s.require_qr,
                distance_m=float(r.dist), inside=bool(r.inside), manager_name=mgr.full_name if mgr else None, manager_phone=mgr.phone if mgr else None,
            )
        )
    return out
