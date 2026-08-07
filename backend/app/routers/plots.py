from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import ApiError
from app.database import get_db
from app.deps import require_user_id
from app.models.plot import Plot
from app.models.timeline import Timeline
from app.schemas.plot import CreatePlotBody, UpdatePlotBody
from app.serializers import plot_dict

router = APIRouter(prefix="/api/plots", tags=["plots"])


def _to_float(value):
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


@router.post("/", status_code=201)
async def create_plot(
    body: CreatePlotBody, user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)
):
    if not body.timelineId or not body.name or body.start is None or body.end is None:
        raise ApiError(400, "Todos los campos son requeridos")

    if body.start > body.end:
        raise ApiError(400, "El inicio no puede ser mayor que el final")

    if body.start < 1:
        raise ApiError(400, "El inicio debe ser al menos 1")

    result = await db.execute(
        select(Timeline).options(selectinload(Timeline.story)).where(Timeline.id == body.timelineId)
    )
    timeline = result.scalar_one_or_none()
    if not timeline:
        raise ApiError(404, "Línea temporal no encontrada")
    if timeline.story.authorId != user_id:
        raise ApiError(403, "No tienes permiso para añadir tramas a esta línea temporal")

    plot = Plot(
        name=body.name,
        description=str(body.description) if body.description not in (None, "") else None,
        start=_to_float(body.start),
        end=_to_float(body.end),
        color=str(body.color) if body.color not in (None, "") else None,
        timelineId=body.timelineId,
    )
    db.add(plot)
    await db.commit()
    await db.refresh(plot)

    return {"plot": plot_dict(plot)}


async def _get_plot_or_404(db: AsyncSession, plot_id: str) -> Plot:
    result = await db.execute(
        select(Plot).options(selectinload(Plot.timeline).selectinload(Timeline.story)).where(Plot.id == plot_id)
    )
    plot = result.scalar_one_or_none()
    if not plot:
        raise ApiError(404, "Trama no encontrada")
    return plot


@router.put("/{plot_id}")
async def update_plot(
    plot_id: str, body: UpdatePlotBody, user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)
):
    plot = await _get_plot_or_404(db, plot_id)
    if plot.timeline.story.authorId != user_id:
        raise ApiError(403, "No tienes permiso para editar esta trama")

    new_start = plot.start
    new_end = plot.end

    if body.name is not None:
        plot.name = body.name
    if body.description is not None:
        plot.description = None if body.description == "" else body.description
    if body.start is not None:
        new_start = _to_float(body.start)
        plot.start = new_start
    if body.end is not None:
        new_end = _to_float(body.end)
        plot.end = new_end
    if body.color is not None:
        plot.color = None if body.color == "" else body.color

    if body.start is not None and body.end is not None and new_start and new_end and new_start > new_end:
        raise ApiError(400, "El inicio no puede ser mayor que el final")

    await db.commit()
    await db.refresh(plot)

    return {"plot": plot_dict(plot)}


@router.delete("/{plot_id}")
async def delete_plot(plot_id: str, user_id: str = Depends(require_user_id), db: AsyncSession = Depends(get_db)):
    plot = await _get_plot_or_404(db, plot_id)
    if plot.timeline.story.authorId != user_id:
        raise ApiError(403, "No tienes permiso para eliminar esta trama")

    await db.delete(plot)
    await db.commit()

    return {"message": "Trama eliminada exitosamente"}
