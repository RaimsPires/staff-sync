from typing import Annotated
from uuid import UUID

from fastapi import APIRouter, Depends, Header, Query, Response

from staffsync.common.enums import Perm
from staffsync.common.schemas import Deletion, ReasonIn, deleted_flags
from staffsync.core.deps import require
from staffsync.core.errors import ValidationFailed
from staffsync.modules.sites import geo_queries, service
from staffsync.modules.sites.schemas import IdsIn, SiteCreate, SiteNearby, SiteRead, SiteUpdate

router = APIRouter(tags=["sites"])


def _etag(site) -> dict:
    return {"ETag": f'"{site.version}"'}


def _version(if_match: str | None) -> int | None:
    if if_match is None:
        return None
    try:
        return int(if_match.strip('"'))
    except ValueError as exc:
        raise ValidationFailed("Invalid If-Match header") from exc


@router.get("/sites", response_model=list[SiteRead])
async def list_sites(
    flags: Annotated[Deletion, Depends(deleted_flags)],
    branch_id: UUID | None = None,
    bbox: str | None = None,
    status: str | None = None,
    ctx=require(Perm.SITES_VIEW),
):
    if (flags.include_deleted or flags.only_deleted) and not ctx.has(Perm.SITES_MANAGE):
        flags = Deletion()
    sites = await service.list_sites(ctx, branch_id=branch_id, bbox=bbox, status=status, include_deleted=flags.include_deleted, only_deleted=flags.only_deleted)
    return await service.to_read(ctx, sites)


@router.post("/sites", response_model=SiteRead, status_code=201)
async def create_site(body: SiteCreate, response: Response, ctx=require(Perm.SITES_MANAGE)):
    site = await service.create(ctx, body)
    response.headers.update(_etag(site))
    return (await service.to_read(ctx, [site]))[0]


@router.get("/me/sites/nearby", response_model=list[SiteNearby])
async def my_sites_nearby(lat: Annotated[float, Query(ge=-90, le=90)], lng: Annotated[float, Query(ge=-180, le=180)], ctx=require(employee=True)):
    return await service.nearby(ctx, lat, lng)


@router.get("/sites/{site_id}", response_model=SiteRead)
async def get_site(site_id: UUID, response: Response, ctx=require(Perm.SITES_VIEW)):
    site = await service.SiteRepository(ctx).get(site_id)
    response.headers.update(_etag(site))
    return (await service.to_read(ctx, [site]))[0]


@router.patch("/sites/{site_id}", response_model=SiteRead)
async def patch_site(site_id: UUID, body: SiteUpdate, response: Response, if_match: Annotated[str | None, Header()] = None, ctx=require(Perm.SITES_MANAGE)):
    site = await service.SiteRepository(ctx).get(site_id)
    site = await service.update(ctx, site, body, _version(if_match))
    response.headers.update(_etag(site))
    return (await service.to_read(ctx, [site]))[0]


@router.post("/sites/{site_id}/deactivate", response_model=SiteRead)
async def deactivate(site_id: UUID, ctx=require(Perm.SITES_MANAGE)):
    site = await service.set_status(ctx, await service.SiteRepository(ctx).get(site_id), "inactive")
    return (await service.to_read(ctx, [site]))[0]


@router.post("/sites/{site_id}/activate", response_model=SiteRead)
async def activate(site_id: UUID, ctx=require(Perm.SITES_MANAGE)):
    site = await service.set_status(ctx, await service.SiteRepository(ctx).get(site_id), "active")
    return (await service.to_read(ctx, [site]))[0]


@router.delete("/sites/{site_id}", status_code=204)
async def delete_site(site_id: UUID, body: ReasonIn, ctx=require(Perm.SITES_MANAGE)):
    await service.delete(ctx, await service.SiteRepository(ctx).get(site_id), body.reason)


@router.post("/sites/{site_id}/restore", response_model=SiteRead)
async def restore_site(site_id: UUID, ctx=require(Perm.SITES_MANAGE)):
    site = await service.SiteRepository(ctx).get(site_id, include_deleted=True)
    return (await service.to_read(ctx, [await service.restore_site(ctx, site)]))[0]


@router.get("/sites/{site_id}/qr")
async def site_qr(site_id: UUID, format: str = "json", window_s: Annotated[int, Query(ge=0, le=3600)] = 0, ctx=require(Perm.SITES_MANAGE)):
    import segno

    site = await service.SiteRepository(ctx).get(site_id)
    payload = service.qr_payload(site, window_s)
    qr = segno.make(payload, error="m")
    if format == "svg":
        import io

        buf = io.BytesIO()
        qr.save(buf, kind="svg", scale=6, border=2)
        return Response(buf.getvalue(), media_type="image/svg+xml")
    if format == "pdf":
        try:
            from weasyprint import HTML
        except Exception as exc:  # system libs (pango) missing
            raise ValidationFailed("PDF rendering is unavailable on this server", code="PDF_UNAVAILABLE") from exc
        html = f"<h1 style='font-family:sans-serif'>{site.name}</h1><p>Scan to check in</p>{qr.svg_inline(scale=8)}"
        return Response(HTML(string=html).write_pdf(), media_type="application/pdf")
    return {"payload": payload, "version": site.qr_version, "window_s": window_s}


@router.post("/sites/{site_id}/qr/rotate")
async def rotate_qr(site_id: UUID, ctx=require(Perm.SITES_MANAGE)):
    site = await service.rotate_qr(ctx, await service.SiteRepository(ctx).get(site_id))
    return {"version": site.qr_version, "payload": service.qr_payload(site)}


@router.put("/sites/{site_id}/managers", response_model=SiteRead)
async def put_managers(site_id: UUID, body: IdsIn, ctx=require(Perm.SITES_MANAGE)):
    site = await service.SiteRepository(ctx).get(site_id)
    await service.set_managers(ctx, site, body.ids)
    from staffsync.core.audit import audit

    audit(ctx, "site.managers_changed", "site", site.id, after={"managers": [str(i) for i in body.ids]})
    await ctx.session.flush()
    return (await service.to_read(ctx, [site]))[0]


@router.put("/sites/{site_id}/employees", response_model=SiteRead)
async def put_employees(site_id: UUID, body: IdsIn, ctx=require(Perm.SITES_MANAGE)):
    site = await service.SiteRepository(ctx).get(site_id)
    await service.set_employees(ctx, site, body.ids)
    await ctx.session.flush()
    return (await service.to_read(ctx, [site]))[0]


@router.get("/sites/{site_id}/overlaps")
async def overlaps(site_id: UUID, ctx=require(Perm.SITES_MANAGE)):
    site = await service.SiteRepository(ctx).get(site_id)
    ids = await geo_queries.overlaps(ctx.session, site.id, ctx.company_id)
    return {"site_ids": ids}
