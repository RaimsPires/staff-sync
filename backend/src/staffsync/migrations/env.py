import asyncio
import logging.config

from alembic import context
from geoalchemy2 import alembic_helpers
from sqlalchemy.ext.asyncio import create_async_engine
from sqlmodel import SQLModel

import staffsync.models  # noqa: F401  (registers all tables)
from staffsync.core.config import get_settings

config = context.config
if config.config_file_name:
    logging.config.fileConfig(config.config_file_name, disable_existing_loggers=False)

target_metadata = SQLModel.metadata
url = get_settings().migration_database_url

def include_object(obj, name, type_, reflected, compare_to):
    # Ignore tables owned by PostGIS extensions (tiger geocoder, topology, spatial_ref_sys) that we do not model.
    if type_ == "table" and reflected and compare_to is None:
        return False
    return alembic_helpers.include_object(obj, name, type_, reflected, compare_to)


OPTS = dict(
    target_metadata=target_metadata,
    compare_type=True,
    include_object=include_object,
    process_revision_directives=alembic_helpers.writer,
    render_item=alembic_helpers.render_item,
)


def run_migrations_offline() -> None:
    context.configure(url=url, literal_binds=True, **OPTS)
    with context.begin_transaction():
        context.run_migrations()


def _do_run(connection) -> None:
    context.configure(connection=connection, **OPTS)
    with context.begin_transaction():
        context.run_migrations()


async def run_migrations_online() -> None:
    engine = create_async_engine(url)
    async with engine.connect() as conn:
        await conn.run_sync(_do_run)
    await engine.dispose()


if context.is_offline_mode():
    run_migrations_offline()
else:
    asyncio.run(run_migrations_online())
