# Middleware: extrai contexto de auditoria do JWT antes dos handlers.

from __future__ import annotations

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request

from valora_backend.audit_request import try_set_audit_state_from_authorization


class AuditRequestContextMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        try_set_audit_state_from_authorization(request)
        return await call_next(request)
