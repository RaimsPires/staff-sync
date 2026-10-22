from collections.abc import AsyncIterator
from contextlib import asynccontextmanager
from uuid import UUID

from sqlalchemy import event, text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine
from sqlalchemy.orm import Session, with_loader_criteria
from sqlmodel import SQLModel
from sqlmodel.ext.asyncio.session import AsyncSession

from staffsync.common.models import SoftDeleteMixin
from staffsync.core.config import get_settings

engine = create_async_engine(get_settings().database_url, pool_pre_ping=True, pool_size=10, max_overflow=10)
SessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)


_soft_delete_classes: list[type] | None = None


def _soft_classes() -> list[type]:
    global _soft_delete_classes
    if _soft_delete_classes is None:
        import staffsync.models  # noqa: F401  (make sure every table is mapped)

        _soft_delete_classes = [m.class_ for m in SQLModel._sa_registry.mappers if issubclass(m.class_, SoftDeleteMixin)]
    return _soft_delete_classes


@event.listens_for(Session, "do_orm_execute")
def _hide_soft_deleted(state):
    """Every ORM SELECT skips soft-deleted rows unless `execution_options(include_deleted=True)`."""
    if state.is_select and not state.is_column_load and not state.is_relationship_load:
        if not state.execution_options.get("include_deleted", False):
            state.statement = state.statement.options(
                *[with_loader_criteria(cls, lambda c: c.deleted_at.is_(None), include_aliases=True) for cls in _soft_classes()]
            )


async def set_tenant(session: AsyncSession, company_id: UUID | None, *, bypass: bool = False) -> None:
    """Scope the current transaction for Row-Level Security (policies read these settings)."""
    await session.exec(text("SELECT set_config('app.company_id', :cid, true), set_config('app.bypass_rls', :b, true)").bindparams(  # type: ignore[call-overload]
        cid=str(company_id) if company_id else "", b="on" if bypass else "off"
    ))


@asynccontextmanager
async def session_scope(company_id: UUID | None = None, *, bypass: bool = False) -> AsyncIterator[AsyncSession]:
    """One transaction: commit on success, roll back on error. Used by deps, workers and tests."""
    async with SessionLocal() as session:
        async with session.begin():
            await set_tenant(session, company_id, bypass=bypass)
            yield session
