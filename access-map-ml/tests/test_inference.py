"""
AccessMap ML — Inference Tests
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.inference.postprocess import PostProcessor
from src.inference.visualizer import DetectionVisualizer


class TestPostProcessor:
    """Tests for the PostProcessor class."""

    @pytest.fixture
    def processor(self):
        return PostProcessor()

    @pytest.fixture
    def sample_detections(self):
        return [
            {
                "id": 0,
                "class_id": 4,
                "class_name": "stairs",
                "display_name": "Stairs/Steps",
                "type": "barrier",
                "confidence": 0.85,
                "bbox": {"x1": 100, "y1": 100, "x2": 300, "y2": 400, "width": 200, "height": 300},
            },
            {
                "id": 1,
                "class_id": 1,
                "class_name": "wheelchair_ramp",
                "display_name": "Wheelchair Ramp",
                "type": "aid",
                "confidence": 0.72,
                "bbox": {"x1": 350, "y1": 200, "x2": 500, "y2": 400, "width": 150, "height": 200},
            },
            {
                "id": 2,
                "class_id": 8,
                "class_name": "doorway",
                "display_name": "Doorway",
                "type": "neutral",
                "confidence": 0.65,
                "bbox": {"x1": 250, "y1": 50, "x2": 350, "y2": 300, "width": 100, "height": 250},
            },
        ]

    def test_severity_classification_low(self, processor):
        severity = processor._classify_step_severity(2)
        assert severity == "low"

    def test_severity_classification_medium(self, processor):
        severity = processor._classify_step_severity(4)
        assert severity == "medium"

    def test_severity_classification_high(self, processor):
        severity = processor._classify_step_severity(8)
        assert severity == "high"

    def test_severity_classification_none(self, processor):
        severity = processor._classify_step_severity(0)
        assert severity == "none"

    def test_bbox_distance(self):
        bbox_a = {"x1": 0, "y1": 0, "x2": 100, "y2": 100}
        bbox_b = {"x1": 200, "y1": 0, "x2": 300, "y2": 100}
        distance = PostProcessor._bbox_distance(bbox_a, bbox_b)
        assert distance == 200.0

    def test_spatial_relationships(self, processor, sample_detections):
        relationships = processor.detect_spatial_relationships(sample_detections)
        # wheelchair_ramp near doorway should be detected
        assert isinstance(relationships, list)

    def test_severity_assessment(self, processor, sample_detections):
        assessment = processor.assess_severity(sample_detections)
        assert "severity" in assessment
        assert "barrier_count" in assessment
        assert assessment["barrier_count"] == 1
        assert assessment["aid_count"] == 1

    def test_process_without_image(self, processor, sample_detections):
        result = processor.process(sample_detections, image=None)
        assert "detections" in result
        assert "spatial_relationships" in result
        assert "severity_assessment" in result


class TestDetectionVisualizer:
    """Tests for the DetectionVisualizer class."""

    @pytest.fixture
    def visualizer(self):
        return DetectionVisualizer()

    @pytest.fixture
    def sample_image(self):
        return np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)

    @pytest.fixture
    def sample_detections(self):
        return [
            {
                "id": 0,
                "class_id": 4,
                "class_name": "stairs",
                "display_name": "Stairs/Steps",
                "type": "barrier",
                "confidence": 0.85,
                "bbox": {"x1": 100, "y1": 100, "x2": 300, "y2": 400},
            },
        ]

    def test_draw_detections(self, visualizer, sample_image, sample_detections):
        result = visualizer.draw_detections(sample_image, sample_detections)
        assert result.shape == sample_image.shape
        # Result should be different from original (annotations were drawn)
        assert not np.array_equal(result, sample_image)

    def test_draw_empty_detections(self, visualizer, sample_image):
        result = visualizer.draw_detections(sample_image, [])
        assert np.array_equal(result, sample_image)

    def test_create_comparison(self, visualizer, sample_image):
        annotated = sample_image.copy()
        comparison = visualizer.create_comparison(sample_image, annotated)
        # Comparison should be wider than original
        assert comparison.shape[1] > sample_image.shape[1]
