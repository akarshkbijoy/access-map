"""
AccessMap ML — API Routes
============================
FastAPI endpoint definitions for the accessibility
detection REST API.
"""

import io
import time
import tempfile
from pathlib import Path
from typing import List, Optional

import cv2
import numpy as np
import requests as http_requests
from fastapi import APIRouter, File, HTTPException, UploadFile
from loguru import logger

from .schemas import (
    BatchDetectionResponse,
    ConfigResponse,
    DetectionResponse,
    DetectionURLRequest,
    ErrorResponse,
    HealthResponse,
    ThresholdUpdateRequest,
)

# Router instance — will be connected to the app in main.py
router = APIRouter()

# These will be set by main.py during app startup
_detector = None
_post_processor = None
_config = None


def set_dependencies(detector, post_processor, config):
    """Set shared dependencies (called from main.py at startup)."""
    global _detector, _post_processor, _config
    _detector = detector
    _post_processor = post_processor
    _config = config


# ──────────────────────────────────────────────
# Health & Configuration Endpoints
# ──────────────────────────────────────────────


@router.get(
    "/health",
    response_model=HealthResponse,
    summary="Health check",
    description="Check API health and model status.",
    tags=["System"],
)
async def health_check():
    """Return API health status and model information."""
    from src import __version__

    model_info = _detector.get_model_info() if _detector else {}

    return HealthResponse(
        status="healthy" if _detector else "model_not_loaded",
        model_loaded=_detector is not None,
        model_path=model_info.get("model_path", "N/A"),
        device=model_info.get("device", "N/A"),
        num_classes=model_info.get("num_classes", 0),
        version=__version__,
    )


@router.get(
    "/config",
    response_model=ConfigResponse,
    summary="Get current configuration",
    description="Get the current detection thresholds and settings.",
    tags=["System"],
)
async def get_config():
    """Return current detection configuration."""
    model_info = _detector.get_model_info()

    return ConfigResponse(
        confidence_threshold=_detector.conf_threshold,
        iou_threshold=_detector.iou_threshold,
        input_size=_detector.input_size,
        max_detections=_detector.max_detections,
        classes=_detector.CLASS_NAMES,
        device=str(_detector.device),
    )


@router.put(
    "/config",
    response_model=ConfigResponse,
    summary="Update detection thresholds",
    description="Dynamically update confidence and IoU thresholds.",
    tags=["System"],
)
async def update_config(request: ThresholdUpdateRequest):
    """Update detection thresholds at runtime."""
    _detector.update_thresholds(
        conf_threshold=request.conf_threshold,
        iou_threshold=request.iou_threshold,
    )

    return await get_config()


# ──────────────────────────────────────────────
# Detection Endpoints
# ──────────────────────────────────────────────


@router.post(
    "/detect",
    response_model=DetectionResponse,
    summary="Detect accessibility features",
    description=(
        "Upload an image and detect accessibility features. "
        "Supports JPEG, PNG, BMP, and WebP formats."
    ),
    tags=["Detection"],
    responses={
        400: {"model": ErrorResponse, "description": "Invalid image"},
        413: {"model": ErrorResponse, "description": "Image too large"},
    },
)
async def detect_single(
    file: UploadFile = File(..., description="Image file to analyze"),
    conf_threshold: Optional[float] = None,
    iou_threshold: Optional[float] = None,
):
    """
    Detect accessibility features in a single uploaded image.

    Returns bounding boxes, class labels, confidence scores,
    step analysis, spatial relationships, and an accessibility summary.
    """
    start_time = time.time()

    # Validate file type
    allowed_types = {"image/jpeg", "image/png", "image/bmp", "image/webp"}
    if file.content_type and file.content_type not in allowed_types:
        raise HTTPException(
            status_code=400,
            detail=f"Unsupported file type: {file.content_type}. "
                   f"Allowed: {allowed_types}",
        )

    # Read and validate image
    try:
        contents = await file.read()
        max_size = _config.get("api", {}).get("max_upload_size_mb", 10) * 1024 * 1024
        if len(contents) > max_size:
            raise HTTPException(
                status_code=413,
                detail=f"Image too large. Max size: "
                       f"{_config['api']['max_upload_size_mb']} MB",
            )

        # Decode image
        nparr = np.frombuffer(contents, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(
                status_code=400,
                detail="Failed to decode image. Ensure it is a valid image file.",
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Error reading image: {str(e)}")

    # Run detection
    try:
        result = _detector.detect(
            image,
            conf_threshold=conf_threshold,
            iou_threshold=iou_threshold,
        )

        # Update filename from upload
        result["image_info"]["filename"] = file.filename or "uploaded_image"

        # Post-processing (step counting, spatial analysis)
        post_result = _post_processor.process(result["detections"], image)

        # Build response
        processing_time = (time.time() - start_time) * 1000

        response = DetectionResponse(
            image_info=result["image_info"],
            detections=result["detections"],
            detection_count=result["detection_count"],
            summary=result["summary"],
            spatial_relationships=post_result.get("spatial_relationships"),
            severity_assessment=post_result.get("severity_assessment"),
            processing_time_ms=round(processing_time, 1),
        )

        logger.info(
            f"Detected {result['detection_count']} features in "
            f"{file.filename} ({processing_time:.0f}ms)"
        )

        return response

    except Exception as e:
        logger.error(f"Detection failed: {e}")
        raise HTTPException(
            status_code=500,
            detail=f"Detection failed: {str(e)}",
        )


@router.post(
    "/detect/batch",
    response_model=BatchDetectionResponse,
    summary="Batch detect accessibility features",
    description="Upload multiple images for batch processing.",
    tags=["Detection"],
)
async def detect_batch(
    files: List[UploadFile] = File(..., description="Multiple image files"),
    conf_threshold: Optional[float] = None,
):
    """
    Detect accessibility features in multiple images.

    Upload up to 20 images at once for batch processing.
    """
    max_batch = 20
    if len(files) > max_batch:
        raise HTTPException(
            status_code=400,
            detail=f"Maximum {max_batch} images per batch. Got {len(files)}.",
        )

    start_time = time.time()
    results = []
    errors = 0

    for file in files:
        try:
            contents = await file.read()
            nparr = np.frombuffer(contents, np.uint8)
            image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if image is None:
                errors += 1
                continue

            result = _detector.detect(
                image,
                conf_threshold=conf_threshold,
            )
            result["image_info"]["filename"] = file.filename or "unknown"

            # Post-processing
            post_result = _post_processor.process(result["detections"], image)

            response = DetectionResponse(
                image_info=result["image_info"],
                detections=result["detections"],
                detection_count=result["detection_count"],
                summary=result["summary"],
                spatial_relationships=post_result.get("spatial_relationships"),
                severity_assessment=post_result.get("severity_assessment"),
            )
            results.append(response)

        except Exception as e:
            logger.error(f"Error processing {file.filename}: {e}")
            errors += 1

    total_time = time.time() - start_time

    return BatchDetectionResponse(
        total_images=len(files),
        successful=len(results),
        errors=errors,
        processing_time_seconds=round(total_time, 2),
        images_per_second=round(len(results) / total_time, 2) if total_time > 0 else 0,
        results=results,
    )


@router.post(
    "/detect/url",
    response_model=DetectionResponse,
    summary="Detect from image URL",
    description="Detect accessibility features from a remote image URL.",
    tags=["Detection"],
)
async def detect_from_url(request: DetectionURLRequest):
    """
    Download an image from a URL and run accessibility detection.
    """
    start_time = time.time()

    try:
        # Download image
        response = http_requests.get(request.url, timeout=10, stream=True)
        response.raise_for_status()

        # Check content type
        content_type = response.headers.get("content-type", "")
        if "image" not in content_type:
            raise HTTPException(
                status_code=400,
                detail=f"URL does not point to an image (content-type: {content_type})",
            )

        # Decode image
        nparr = np.frombuffer(response.content, np.uint8)
        image = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

        if image is None:
            raise HTTPException(status_code=400, detail="Failed to decode image from URL")

    except http_requests.RequestException as e:
        raise HTTPException(status_code=400, detail=f"Failed to download image: {str(e)}")

    # Run detection
    result = _detector.detect(
        image,
        conf_threshold=request.conf_threshold,
        iou_threshold=request.iou_threshold,
    )

    # Extract filename from URL
    url_path = request.url.split("?")[0]
    filename = url_path.split("/")[-1] or "remote_image"
    result["image_info"]["filename"] = filename

    # Post-processing
    post_result = _post_processor.process(result["detections"], image)

    processing_time = (time.time() - start_time) * 1000

    return DetectionResponse(
        image_info=result["image_info"],
        detections=result["detections"],
        detection_count=result["detection_count"],
        summary=result["summary"],
        spatial_relationships=post_result.get("spatial_relationships"),
        severity_assessment=post_result.get("severity_assessment"),
        processing_time_ms=round(processing_time, 1),
    )
