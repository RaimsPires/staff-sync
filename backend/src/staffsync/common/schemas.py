from typing import Annotated

from fastapi import Query
from pydantic import BaseModel, Field


class ReasonIn(BaseModel):
    reason: str = Field(min_length=3, max_length=500)


class Deletion(BaseModel):
    include_deleted: bool = False
    only_deleted: bool = False


def deleted_flags(include_deleted: Annotated[bool, Query()] = False, only_deleted: Annotated[bool, Query()] = False) -> Deletion:
    return Deletion(include_deleted=include_deleted, only_deleted=only_deleted)
