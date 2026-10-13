"""
AccessMap ML — Pydantic Schemas
===================================
Request and response models for the FastAPI server.
"""

from datetime import datetime
from typing import Any, Dict, List, Optional

from pydantic import BaseModel, Field


# ──────────────────────────────────────────────
# Request Models
# ──────────────────────────────────────────────


class DetectionURLRequest(BaseModel):
    """Request to detect accessibility features from an image URL."""
    url: str = Field(..., description="URL of the image to analyze")
    conf_threshold: Optional[float] = Field(
        None,
        description="Confidence threshold (0-1). Overrides default.",
        ge=0, le=1,
    )
    iou_threshold: Optional[float] = Field(
        None,
        description="IoU threshold for NMS (0-1). Overrides default.",
        ge=0, le=1,
    )


class ThresholdUpdateRequest(BaseModel):
    """Request to update detection thresholds."""
    conf_threshold: Optional[float] = Field(
        None,
        description="New confidence threshold (0-1)",
        ge=0, le=1,
    )
    iou_threshold: Optional[float] = Field(
        None,
        description="New IoU threshold (0-1)",
        ge=0, le=1,
    )


# ──────────────────────────────────────────────
# Response Models
# ──────────────────────────────────────────────


class BoundingBox(BaseModel):
    """Bounding box coordinates in pixels."""
    x1: float
    y1: float
    x2: float
    y2: float
    width: float
    height: float


class NormalizedBBox(BaseModel):
    """Normalized bounding box coordinates (0-1)."""
    x_center: float
    y_center: float
    width: float
    height: float


class StepAnalysis(BaseModel):
    """Step counting analysis for stair detections."""
    step_count: int = Field(..., description="Estimated number of steps")
    severity: str = Field(..., description="Severity level: none, low, medium, high")
    method: str = Field(..., description="Method used for step counting")
    confidence: str = Field(default="estimated", description="Confidence of the estimate")


class Detection(BaseModel):
    """A single object detection result."""
    id: int
    class_id: int
    class_name: str
    display_name: str
    type: str = Field(..., description="Feature type: aid, barrier, or neutral")
    confidence: float
    bbox: BoundingBox
    bbox_normalized: NormalizedBBox
    area_percent: float
    step_analysis: Optional[StepAnalysis] = None


class AccessibilitySummary(BaseModel):
    """Aggregated accessibility analysis summary."""
    feature_counts: Dict[str, int]
    accessibility_aids: List[str]
    accessibility_barriers: List[str]
    total_features: int
    accessibility_score: Optional[int] = Field(
        None,
        description="Accessibility score 0-100 (higher = more accessible)",
    )
    assessment: str


class SpatialRelationship(BaseModel):
    """Spatial relationship between two detected features."""
    feature_a: str
    feature_b: str
    description: str
    proximity: str = Field(..., description="adjacent or nearby")
    distance_pixels: float
    detection_ids: List[int]


class SeverityAssessment(BaseModel):
    """Overall severity assessment of accessibility barriers."""
    severity: str = Field(..., description="none, low, medium, or high")
    description: str
    barrier_count: int
    aid_count: int
    max_step_count: int


class ImageInfo(BaseModel):
    """Metadata about the analyzed image."""
    filename: str
    width: int
    height: int


class DetectionResponse(BaseModel):
    """Complete detection response for a single image."""
    image_info: ImageInfo
    detections: List[Detection]
    detection_count: int
    summary: AccessibilitySummary
    spatial_relationships: Optional[List[SpatialRelationship]] = None
    severity_assessment: Optional[SeverityAssessment] = None
    processing_time_ms: Optional[float] = None


class BatchDetectionResponse(BaseModel):
    """Response for batch image detection."""
    total_images: int
    successful: int
    errors: int
    processing_time_seconds: float
    images_per_second: float
    results: List[DetectionResponse]
    aggregate_summary: Optional[Dict[str, Any]] = None


class HealthResponse(BaseModel):
    """Health check response."""
    status: str = "healthy"
    model_loaded: bool
    model_path: str
    device: str
    num_classes: int
    version: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())


class ConfigResponse(BaseModel):
    """Current configuration response."""
    confidence_threshold: float
    iou_threshold: float
    input_size: int
    max_detections: int
    classes: Dict[int, str]
    device: str


class ErrorResponse(BaseModel):
    """Error response."""
    error: str
    detail: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
