"""Report builder over attendance_records. One query shape, many presets (timesheet, lateness, absences, ...)."""

import json
from datetime import date
from uuid import UUID, uuid4

from sqlalchemy import text

from staffsync.core.context import RequestContext
from staffsync.core.errors import NotFound, ValidationFailed
from staffsync.core.redis import get_redis

TYPES = {
    "timesheet": {"columns": ["records", "hours", "overtime_hours"], "where": "r.check_in_at IS NOT NULL"},
    "hours_worked": {"columns": ["hours"], "where": "r.check_in_at IS NOT NULL"},
    "lateness": {"columns": ["late_count", "late_minutes"], "where": "r.status = 'late'"},
    "absences": {"columns": ["absent"], "where": "r.status = 'absent'"},
    "overtime": {"columns": ["overtime_hours"], "where": "r.overtime_min > 0"},
    "flagged": {"columns": ["flagged"], "where": "jsonb_array_length(r.flags) > 0"},
    "proxy": {"columns": ["proxy"], "where": "r.method IN ('proxy','admin')"},
    "site_summary": {"columns": ["records", "hours", "late_count", "absent", "flagged"], "where": "TRUE"},
}
GROUPS = {"employee": ("r.employee_id", "u.full_name"), "site": ("r.site_id", "s.name"), "branch": ("s.branch_id", "b.name"), "day": ("(r.occurred_at AT TIME ZONE s.timezone)::date", "(r.occurred_at AT TIME ZONE s.timezone)::date::text")}
EXPR = {
    "records": "count(*)", "hours": "round(coalesce(sum(r.worked_min),0)/60.0, 2)", "overtime_hours": "round(coalesce(sum(r.overtime_min),0)/60.0, 2)",
    "late_count": "count(*) FILTER (WHERE r.status='late')", "late_minutes": "coalesce(sum(r.late_min),0)", "absent": "count(*) FILTER (WHERE r.status='absent')",
    "flagged": "count(*) FILTER (WHERE jsonb_array_length(r.flags) > 0)", "proxy": "count(*) FILTER (WHERE r.method IN ('proxy','admin'))",
}


async def build(ctx: RequestContext, rtype: str, date_from: date, date_to: date, group_by: str, site_ids: list[UUID] | None, columns: list[str] | None) -> dict:
    if rtype not in TYPES or group_by not in GROUPS:
        raise ValidationFailed("Unknown report type or grouping")
    if (date_to - date_from).days > 366:
        raise ValidationFailed("Range too large")
    cols = [c for c in (columns or TYPES[rtype]["columns"]) if c in EXPR]
    key, label = GROUPS[group_by]
    allowed = ctx.scope.site_ids
    sites = [s for s in (site_ids or []) if allowed is None or s in allowed] if site_ids else (None if allowed is None else list(allowed))
    sql = (f"SELECT {key} AS key, {label} AS label, " + ", ".join(f"{EXPR[c]} AS {c}" for c in cols) +
           " FROM attendance_records r JOIN sites s ON s.id=r.site_id JOIN branches b ON b.id=s.branch_id JOIN employees e ON e.id=r.employee_id JOIN users u ON u.id=e.user_id "
           f"WHERE r.company_id=:cid AND r.deleted_at IS NULL AND {TYPES[rtype]['where']} AND (r.occurred_at AT TIME ZONE s.timezone)::date BETWEEN :d1 AND :d2 "
           + ("AND r.site_id = ANY(:sites) " if sites is not None else "") + "GROUP BY 1, 2 ORDER BY 2")
    params: dict = {"cid": ctx.company_id, "d1": date_from, "d2": date_to}
    if sites is not None:
        params["sites"] = sites or [UUID(int=0)]
    rows = [dict(r._mapping) for r in (await ctx.session.execute(text(sql), params)).all()]
    for r in rows:
        r["key"] = str(r["key"])
        for c in cols:
            r[c] = float(r[c]) if r[c] is not None else 0
    totals = {c: round(sum(r[c] for r in rows), 2) for c in cols}
    return {"type": rtype, "group_by": group_by, "columns": cols, "rows": rows, "totals": totals}


async def export(ctx: RequestContext, report: dict, fmt: str) -> str:
    from staffsync.modules.attendance.admin import to_csv, to_xlsx

    flat = [{"group": r["label"], **{c: r[c] for c in report["columns"]}} for r in report["rows"]] or [{"group": ""}]
    if fmt == "pdf":
        raise ValidationFailed("PDF export is not available on this server", code="PDF_UNAVAILABLE")
    data = to_xlsx(flat) if fmt == "xlsx" else to_csv(flat)
    eid = uuid4().hex
    await get_redis().set(f"export:{ctx.company_id}:{eid}", json.dumps({"fmt": fmt}), ex=7 * 86400)
    import base64

    await get_redis().set(f"export:data:{ctx.company_id}:{eid}", base64.b64encode(data).decode(), ex=7 * 86400)
    return eid


async def fetch_export(ctx: RequestContext, eid: str) -> tuple[bytes, str]:
    import base64

    meta = await get_redis().get(f"export:{ctx.company_id}:{eid}")
    raw = await get_redis().get(f"export:data:{ctx.company_id}:{eid}")
    if not meta or not raw:
        raise NotFound("Export expired or not found")
    return base64.b64decode(raw), json.loads(meta)["fmt"]
