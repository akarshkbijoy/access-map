"""
AccessMap ML — API Middleware
================================
CORS, rate limiting, and request validation middleware.
"""

import time
from collections import defaultdict
from typing import Callable

from fastapi import FastAPI, Request, Response
from fastapi.middleware.cors import CORSMiddleware
from loguru import logger


def setup_cors(app: FastAPI, origins: list) -> None:
    """
    Configure CORS middleware.

    Args:
        app: FastAPI application instance.
        origins: List of allowed origins.
    """
    app.add_middleware(
        CORSMiddleware,
        allow_origins=origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    logger.info(f"CORS configured for origins: {origins}")


class RateLimiter:
    """
    Simple in-memory rate limiter.
    
    Uses a sliding window approach to limit requests per minute.
    For production, consider using Redis-backed rate limiting.
    """

    def __init__(self, requests_per_minute: int = 60):
        self.requests_per_minute = requests_per_minute
        self.window_seconds = 60
        self.requests = defaultdict(list)  # IP → list of timestamps

    def is_allowed(self, client_ip: str) -> bool:
        """Check if a request from this IP is allowed."""
        now = time.time()
        window_start = now - self.window_seconds

        # Clean old entries
        self.requests[client_ip] = [
            ts for ts in self.requests[client_ip] if ts > window_start
        ]

        if len(self.requests[client_ip]) >= self.requests_per_minute:
            return False

        self.requests[client_ip].append(now)
        return True

    def get_remaining(self, client_ip: str) -> int:
        """Get remaining requests for this IP in current window."""
        now = time.time()
        window_start = now - self.window_seconds
        recent = [
            ts for ts in self.requests[client_ip] if ts > window_start
        ]
        return max(0, self.requests_per_minute - len(recent))


def setup_request_logging(app: FastAPI) -> None:
    """
    Add request/response logging middleware.

    Args:
        app: FastAPI application instance.
    """

    @app.middleware("http")
    async def log_requests(request: Request, call_next: Callable) -> Response:
        start_time = time.time()

        # Log request
        logger.info(
            f"→ {request.method} {request.url.path} "
            f"[{request.client.host if request.client else 'unknown'}]"
        )

        response = await call_next(request)

        # Log response
        duration = (time.time() - start_time) * 1000
        logger.info(
            f"← {request.method} {request.url.path} "
            f"[{response.status_code}] {duration:.1f}ms"
        )

        # Add timing header
        response.headers["X-Process-Time-Ms"] = f"{duration:.1f}"

        return response


def setup_rate_limiting(
    app: FastAPI, rate_limiter: RateLimiter
) -> None:
    """
    Add rate limiting middleware.

    Args:
        app: FastAPI application instance.
        rate_limiter: RateLimiter instance.
    """

    @app.middleware("http")
    async def rate_limit_middleware(
        request: Request, call_next: Callable
    ) -> Response:
        client_ip = request.client.host if request.client else "unknown"

        if not rate_limiter.is_allowed(client_ip):
            from fastapi.responses import JSONResponse

            remaining = rate_limiter.get_remaining(client_ip)
            logger.warning(f"Rate limit exceeded for {client_ip}")
            return JSONResponse(
                status_code=429,
                content={
                    "error": "Rate limit exceeded",
                    "detail": f"Maximum {rate_limiter.requests_per_minute} "
                              f"requests per minute. Remaining: {remaining}",
                },
                headers={
                    "X-RateLimit-Limit": str(rate_limiter.requests_per_minute),
                    "X-RateLimit-Remaining": str(remaining),
                    "Retry-After": "60",
                },
            )

        response = await call_next(request)

        # Add rate limit headers
        remaining = rate_limiter.get_remaining(client_ip)
        response.headers["X-RateLimit-Limit"] = str(
            rate_limiter.requests_per_minute
        )
        response.headers["X-RateLimit-Remaining"] = str(remaining)

        return response
