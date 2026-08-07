"""Custom API error type + handlers so error responses keep the same
`{ "error": "...", "code"?: "..." }` shape the Express backend used, instead of
FastAPI's default `{"detail": ...}` shape."""

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from starlette.responses import JSONResponse

logger = logging.getLogger("app")


class ApiError(Exception):
    def __init__(self, status_code: int, error: str, code: str | None = None, **extra):
        self.status_code = status_code
        self.error = error
        self.code = code
        self.extra = extra
        super().__init__(error)

    def to_body(self) -> dict:
        body: dict = {"error": self.error}
        if self.code:
            body["code"] = self.code
        body.update(self.extra)
        return body


def register_exception_handlers(app: FastAPI) -> None:
    @app.exception_handler(ApiError)
    async def api_error_handler(_request: Request, exc: ApiError) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content=exc.to_body())

    @app.exception_handler(RequestValidationError)
    async def validation_error_handler(_request: Request, exc: RequestValidationError) -> JSONResponse:
        return JSONResponse(status_code=400, content={"error": "Datos de entrada inválidos"})

    @app.exception_handler(Exception)
    async def generic_error_handler(_request: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error")
        return JSONResponse(
            status_code=500,
            content={"error": "Something went wrong!", "message": str(exc)},
        )
