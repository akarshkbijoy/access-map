"""
AccessMap ML — FastAPI Application
======================================
Main entry point for the accessibility detection API server.

Usage:
    # Development
    uvicorn src.api.main:app --reload --host 0.0.0.0 --port 8000

    # Production
    uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --workers 1
"""

import os
from contextlib import asynccontextmanager
from pathlib import Path

import yaml
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from loguru import logger

from .middleware import (
    RateLimiter,
    setup_cors,
    setup_rate_limiting,
    setup_request_logging,
)
from .routes import router, set_dependencies


# ──────────────────────────────────────────────
# Application Lifespan (startup / shutdown)
# ──────────────────────────────────────────────


@asynccontextmanager
async def lifespan(app: FastAPI):
    """
    Application lifespan handler.
    
    Loads the ML model on startup, releases resources on shutdown.
    """
    # ── STARTUP ──
    logger.info("=" * 60)
    logger.info("AccessMap ML API — Starting up")
    logger.info("=" * 60)

    # Load configuration
    config_path = os.environ.get("CONFIG_PATH", "config/config.yaml")
    if not Path(config_path).exists():
        logger.error(f"Config file not found: {config_path}")
        raise FileNotFoundError(f"Config file not found: {config_path}")

    with open(config_path, "r") as f:
        config = yaml.safe_load(f)

    # Determine model path (env var overrides config)
    model_path = os.environ.get(
        "MODEL_PATH",
        config.get("inference", {}).get("model_path", "models/best.pt"),
    )

    # Load model
    try:
        from src.inference.detector import AccessibilityDetector
        from src.inference.postprocess import PostProcessor

        device = os.environ.get("DEVICE", config.get("inference", {}).get("device", "auto"))

        detector = AccessibilityDetector(
            model_path=model_path,
            config_path=config_path,
            device=device,
        )
        post_processor = PostProcessor(config_path=config_path)

        # Inject into routes
        set_dependencies(detector, post_processor, config)

        logger.info(f"Model loaded successfully: {model_path}")
        logger.info(f"Device: {device}")

    except FileNotFoundError:
        logger.warning(
            f"Model not found at {model_path}. "
            f"API will start but detection endpoints will fail. "
            f"Train a model first or provide the correct MODEL_PATH."
        )
        set_dependencies(None, None, config)
    except Exception as e:
        logger.error(f"Failed to load model: {e}")
        set_dependencies(None, None, config)

    logger.info("API ready!")
    logger.info("=" * 60)

    yield  # ── App is running ──

    # ── SHUTDOWN ──
    logger.info("AccessMap ML API — Shutting down")


# ──────────────────────────────────────────────
# FastAPI Application Instance
# ──────────────────────────────────────────────

app = FastAPI(
    title="AccessMap ML API",
    description=(
        "Accessibility Feature Detection API\n\n"
        "Detect wheelchair ramps, elevators, stairs, grab bars, "
        "accessible parking, and other accessibility features in images.\n\n"
        "**Endpoints:**\n"
        "- `POST /detect` — Single image detection\n"
        "- `POST /detect/batch` — Batch image detection\n"
        "- `POST /detect/url` — Detection from image URL\n"
        "- `GET /health` — Health check\n"
        "- `GET /config` — Current settings\n"
        "- `PUT /config` — Update thresholds\n"
    ),
    version="0.1.0",
    contact={
        "name": "AccessMap Team",
    },
    license_info={
        "name": "MIT",
    },
    lifespan=lifespan,
)


# ──────────────────────────────────────────────
# Middleware Setup
# ──────────────────────────────────────────────

# Load config for middleware setup
_config_path = os.environ.get("CONFIG_PATH", "config/config.yaml")
if Path(_config_path).exists():
    with open(_config_path, "r") as _f:
        _config = yaml.safe_load(_f)
else:
    _config = {"api": {"cors_origins": ["*"], "rate_limit": 60}}

# CORS
cors_origins = os.environ.get(
    "CORS_ORIGINS",
    ",".join(_config.get("api", {}).get("cors_origins", ["*"])),
).split(",")
setup_cors(app, cors_origins)

# Rate limiting
rate_limit = int(
    os.environ.get(
        "RATE_LIMIT_PER_MINUTE",
        _config.get("api", {}).get("rate_limit", 60),
    )
)
rate_limiter = RateLimiter(requests_per_minute=rate_limit)
setup_rate_limiting(app, rate_limiter)

# Request logging
setup_request_logging(app)


# ──────────────────────────────────────────────
# Include Routes
# ──────────────────────────────────────────────

app.include_router(router, prefix="", tags=["AccessMap ML"])


# ──────────────────────────────────────────────
# Root Endpoint
# ──────────────────────────────────────────────

@app.get("/", include_in_schema=False)
async def root():
    """API root — redirect to docs."""
    return JSONResponse({
        "service": "AccessMap ML API",
        "version": "0.1.0",
        "docs": "/docs",
        "health": "/health",
    })


# ──────────────────────────────────────────────
# CLI Entry Point
# ──────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn

    host = os.environ.get("API_HOST", _config.get("api", {}).get("host", "0.0.0.0"))
    port = int(os.environ.get("API_PORT", _config.get("api", {}).get("port", 8000)))
    workers = int(_config.get("api", {}).get("workers", 1))

    uvicorn.run(
        "src.api.main:app",
        host=host,
        port=port,
        workers=workers,
        reload=False,
        log_level="info",
    )
