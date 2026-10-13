"""
AccessMap ML — API Tests
"""

import sys
from pathlib import Path
from unittest.mock import MagicMock, patch

import pytest
from fastapi.testclient import TestClient

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))


@pytest.fixture
def mock_detector():
    """Create a mock detector for testing without a real model."""
    detector = MagicMock()
    detector.conf_threshold = 0.25
    detector.iou_threshold = 0.45
    detector.input_size = 640
    detector.max_detections = 100
    detector.device = "cpu"
    detector.CLASS_NAMES = {
        0: "wheelchair", 1: "wheelchair_ramp", 2: "elevator",
        3: "lift", 4: "stairs", 5: "accessible_parking",
        6: "accessible_bathroom", 7: "grab_bar", 8: "doorway",
        9: "tactile_paving",
    }
    detector.get_model_info.return_value = {
        "model_path": "models/test.pt",
        "confidence_threshold": 0.25,
        "iou_threshold": 0.45,
        "input_size": 640,
        "num_classes": 10,
        "classes": detector.CLASS_NAMES,
        "device": "cpu",
    }
    detector.detect.return_value = {
        "image_info": {"filename": "test.jpg", "width": 640, "height": 640},
        "detections": [
            {
                "id": 0,
                "class_id": 4,
                "class_name": "stairs",
                "display_name": "Stairs/Steps",
                "type": "barrier",
                "confidence": 0.85,
                "bbox": {"x1": 100, "y1": 100, "x2": 300, "y2": 400, "width": 200, "height": 300},
                "bbox_normalized": {"x_center": 0.3125, "y_center": 0.3906, "width": 0.3125, "height": 0.4688},
                "area_percent": 14.65,
            }
        ],
        "detection_count": 1,
        "summary": {
            "feature_counts": {"stairs": 1},
            "accessibility_aids": [],
            "accessibility_barriers": ["Stairs/Steps"],
            "total_features": 1,
            "accessibility_score": 20,
            "assessment": "Poor — barriers detected with no accessibility aids",
        },
    }
    return detector


@pytest.fixture
def mock_post_processor():
    """Create a mock post-processor."""
    processor = MagicMock()
    processor.process.return_value = {
        "detections": [],
        "step_analysis": [],
        "spatial_relationships": [],
        "severity_assessment": {
            "severity": "medium",
            "description": "Steps detected",
            "barrier_count": 1,
            "aid_count": 0,
            "max_step_count": 4,
        },
    }
    return processor


@pytest.fixture
def client(mock_detector, mock_post_processor):
    """Create a test client with mocked dependencies."""
    import yaml

    with open("config/config.yaml", "r") as f:
        config = yaml.safe_load(f)

    from src.api.routes import set_dependencies
    set_dependencies(mock_detector, mock_post_processor, config)

    from src.api.main import app
    return TestClient(app)


class TestAPI:
    """Tests for the FastAPI endpoints."""

    def test_root(self, client):
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "service" in data
        assert data["service"] == "AccessMap ML API"

    def test_health(self, client):
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert data["model_loaded"] is True
        assert data["num_classes"] == 10

    def test_get_config(self, client):
        response = client.get("/config")
        assert response.status_code == 200
        data = response.json()
        assert "confidence_threshold" in data
        assert "classes" in data

    def test_detect_single(self, client):
        import io
        import numpy as np
        import cv2

        # Create a test image
        img = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
        _, buffer = cv2.imencode(".jpg", img)
        file = io.BytesIO(buffer.tobytes())

        response = client.post(
            "/detect",
            files={"file": ("test.jpg", file, "image/jpeg")},
        )
        assert response.status_code == 200
        data = response.json()
        assert "detections" in data
        assert "summary" in data
        assert data["detection_count"] == 1

    def test_detect_invalid_file_type(self, client):
        import io
        file = io.BytesIO(b"not an image")
        response = client.post(
            "/detect",
            files={"file": ("test.txt", file, "text/plain")},
        )
        assert response.status_code == 400

    def test_detect_from_url(self, client):
        with patch("src.api.routes.http_requests") as mock_requests:
            import numpy as np
            import cv2

            img = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
            _, buffer = cv2.imencode(".jpg", img)

            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.headers = {"content-type": "image/jpeg"}
            mock_response.content = buffer.tobytes()
            mock_response.raise_for_status = MagicMock()
            mock_requests.get.return_value = mock_response

            response = client.post(
                "/detect/url",
                json={"url": "https://example.com/test.jpg"},
            )
            assert response.status_code == 200
