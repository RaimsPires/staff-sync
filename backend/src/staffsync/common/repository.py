"""Base repository: every query is filtered by tenant; subclasses add the data-scope filter."""

from typing import Any
from uuid import UUID

from sqlmodel import SQLModel, select

from staffsync.core.context import RequestContext
from staffsync.core.errors import NotFound


class TenantRepository[M: SQLModel]:
    model: type[M]

    def __init__(self, ctx: RequestContext):
        self.ctx = ctx
        self.session = ctx.session

    def scope(self, stmt):
        """Override to restrict by the user's branches/sites. Default: whole company."""
        return stmt

    def query(self, *, include_deleted: bool = False, only_deleted: bool = False):
        stmt: Any = select(self.model).where(self.model.company_id == self.ctx.company_id)  # type: ignore[attr-defined]
        if only_deleted:
            stmt = stmt.where(self.model.deleted_at.is_not(None)).execution_options(include_deleted=True)  # type: ignore[attr-defined]
        elif include_deleted:
            stmt = stmt.execution_options(include_deleted=True)
        return self.scope(stmt)

    async def find(self, id: UUID, *, include_deleted: bool = False) -> M | None:
        stmt = self.query(include_deleted=include_deleted).where(self.model.id == id)  # type: ignore[attr-defined]
        return (await self.session.exec(stmt)).first()

    async def get(self, id: UUID, *, include_deleted: bool = False) -> M:
        obj = await self.find(id, include_deleted=include_deleted)
        if obj is None:
            raise NotFound()  # out-of-scope and missing look the same
        return obj

    def add(self, obj: M) -> M:
        self.session.add(obj)
        return obj
