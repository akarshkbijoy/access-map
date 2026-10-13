"""
AccessMap ML — Accessibility Detector
=========================================
Core inference engine for detecting accessibility
features in single images.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Union

import cv2
import numpy as np
import yaml
from loguru import logger


class AccessibilityDetector:
    """
    Detect accessibility features in images using YOLOv8.

    Supports:
    - PyTorch (.pt) models
    - ONNX (.onnx) models
    - Single image inference
    - Configurable confidence thresholds
    - Structured detection output
    """

    # ── Current model: stairs only (nc=1, class 0 = "stairs")
    # These will be overridden by whatever the loaded model reports.
    CLASS_NAMES = {
        0: "stairs",
    }

    CLASS_DISPLAY_NAMES = {
        0: "Stairs/Steps",
    }

    CLASS_TYPES = {
        0: "barrier",       # Stairs — potential barrier
    }

    def __init__(
        self,
        model_path: str = "models/best.pt",
        config_path: str = "config/config.yaml",
        device: Optional[str] = None,
    ):
        """
        Initialize the detector.

        Args:
            model_path: Path to the trained model file (.pt or .onnx).
            config_path: Path to the configuration file.
            device: Inference device ('cpu', 'cuda:0', 'auto').
        """
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)

        self.inference_config = self.config.get("inference", {})
        self.conf_threshold = self.inference_config.get("confidence_threshold", 0.25)
        self.iou_threshold = self.inference_config.get("iou_threshold", 0.45)
        self.max_detections = self.inference_config.get("max_detections", 100)
        self.input_size = self.config["model"]["input_size"]

        # Device selection
        self.device = device or self.inference_config.get("device", "auto")

        # Load model
        self.model = self._load_model(model_path)
        self.model_path = model_path

        logger.info(
            f"Detector initialized: {model_path} "
            f"(conf={self.conf_threshold}, iou={self.iou_threshold})"
        )

    def _load_model(self, model_path: str):
        """Load the YOLO model."""
        from ultralytics import YOLO

        model = YOLO(model_path)
        logger.info(f"Loaded model: {model_path}")
        return model

    def detect(
        self,
        image: Union[str, np.ndarray],
        conf_threshold: Optional[float] = None,
        iou_threshold: Optional[float] = None,
    ) -> Dict:
        """
        Run detection on a single image.

        Args:
            image: Image path (str) or numpy array (BGR).
            conf_threshold: Override confidence threshold.
            iou_threshold: Override IoU threshold.

        Returns:
            Detection results dictionary with:
            - detections: list of individual detections
            - summary: aggregated accessibility summary
            - image_info: image metadata
        """
        conf = conf_threshold or self.conf_threshold
        iou = iou_threshold or self.iou_threshold

        # Load image if path given
        if isinstance(image, str):
            img_path = Path(image)
            if not img_path.exists():
                raise FileNotFoundError(f"Image not found: {image}")
            img_array = cv2.imread(str(image))
            image_name = img_path.name
        else:
            img_array = image
            image_name = "uploaded_image"

        if img_array is None:
            raise ValueError("Failed to load image")

        img_h, img_w = img_array.shape[:2]

        # Run inference
        results = self.model(
            img_array,
            conf=conf,
            iou=iou,
            imgsz=self.input_size,
            max_det=self.max_detections,
            verbose=False,
            device=self.device if self.device != "auto" else None,
        )

        # Parse results
        detections = self._parse_results(results[0], img_w, img_h)

        # Build response
        response = {
            "image_info": {
                "filename": image_name,
                "width": img_w,
                "height": img_h,
            },
            "detections": detections,
            "detection_count": len(detections),
            "summary": self._build_summary(detections),
        }

        return response

    def _parse_results(
        self, result: Any, img_w: int, img_h: int
    ) -> List[Dict]:
        """
        Parse YOLO results into structured detection list.

        Args:
            result: Single YOLO result object.
            img_w: Image width.
            img_h: Image height.

        Returns:
            List of detection dictionaries.
        """
        detections = []
        boxes = result.boxes

        if boxes is None or len(boxes) == 0:
            return detections

        xyxy = boxes.xyxy.cpu().numpy()
        confs = boxes.conf.cpu().numpy()
        classes = boxes.cls.cpu().numpy().astype(int)

        for i in range(len(boxes)):
            x1, y1, x2, y2 = xyxy[i]
            class_id = int(classes[i])
            confidence = float(confs[i])

            detection = {
                "id": i,
                "class_id": class_id,
                "class_name": self.CLASS_NAMES.get(class_id, f"class_{class_id}"),
                "display_name": self.CLASS_DISPLAY_NAMES.get(
                    class_id, f"Class {class_id}"
                ),
                "type": self.CLASS_TYPES.get(class_id, "unknown"),
                "confidence": round(confidence, 4),
                "bbox": {
                    "x1": round(float(x1), 1),
                    "y1": round(float(y1), 1),
                    "x2": round(float(x2), 1),
                    "y2": round(float(y2), 1),
                    "width": round(float(x2 - x1), 1),
                    "height": round(float(y2 - y1), 1),
                },
                "bbox_normalized": {
                    "x_center": round(float((x1 + x2) / 2 / img_w), 4),
                    "y_center": round(float((y1 + y2) / 2 / img_h), 4),
                    "width": round(float((x2 - x1) / img_w), 4),
                    "height": round(float((y2 - y1) / img_h), 4),
                },
                "area_percent": round(
                    float((x2 - x1) * (y2 - y1) / (img_w * img_h) * 100), 2
                ),
            }

            detections.append(detection)

        return detections

    def _build_summary(self, detections: List[Dict]) -> Dict:
        """
        Build an accessibility summary from detections.

        Args:
            detections: List of detection dictionaries.

        Returns:
            Summary dictionary with feature counts and assessment.
        """
        feature_counts = {}
        aids_found = []
        barriers_found = []

        for det in detections:
            name = det["class_name"]
            feature_counts[name] = feature_counts.get(name, 0) + 1

            if det["type"] == "aid":
                aids_found.append(det["display_name"])
            elif det["type"] == "barrier":
                barriers_found.append(det["display_name"])

        # Unique features
        aids_found = list(set(aids_found))
        barriers_found = list(set(barriers_found))

        # Accessibility score (basic heuristic)
        aid_count = sum(1 for d in detections if d["type"] == "aid")
        barrier_count = sum(1 for d in detections if d["type"] == "barrier")

        if aid_count + barrier_count == 0:
            score = None
            assessment = "No accessibility features detected"
        elif barrier_count == 0:
            score = 100
            assessment = "Excellent — accessibility aids present, no barriers detected"
        elif aid_count == 0:
            score = 20
            assessment = "Poor — barriers detected with no accessibility aids"
        else:
            score = round(aid_count / (aid_count + barrier_count) * 100)
            if score >= 70:
                assessment = "Good — aids outnumber barriers"
            elif score >= 40:
                assessment = "Fair — some aids and barriers present"
            else:
                assessment = "Poor — barriers outnumber aids"

        return {
            "feature_counts": feature_counts,
            "accessibility_aids": aids_found,
            "accessibility_barriers": barriers_found,
            "total_features": len(detections),
            "accessibility_score": score,
            "assessment": assessment,
        }

    def update_thresholds(
        self,
        conf_threshold: Optional[float] = None,
        iou_threshold: Optional[float] = None,
    ) -> None:
        """
        Update detection thresholds at runtime.

        Args:
            conf_threshold: New confidence threshold (0-1).
            iou_threshold: New IoU threshold (0-1).
        """
        if conf_threshold is not None:
            if 0 <= conf_threshold <= 1:
                self.conf_threshold = conf_threshold
                logger.info(f"Confidence threshold updated: {conf_threshold}")
            else:
                raise ValueError("conf_threshold must be between 0 and 1")

        if iou_threshold is not None:
            if 0 <= iou_threshold <= 1:
                self.iou_threshold = iou_threshold
                logger.info(f"IoU threshold updated: {iou_threshold}")
            else:
                raise ValueError("iou_threshold must be between 0 and 1")

    def get_model_info(self) -> Dict:
        """Get information about the loaded model."""
        return {
            "model_path": self.model_path,
            "confidence_threshold": self.conf_threshold,
            "iou_threshold": self.iou_threshold,
            "input_size": self.input_size,
            "num_classes": len(self.CLASS_NAMES),
            "classes": self.CLASS_NAMES,
            "device": str(self.device),
        }


if __name__ == "__main__":
    print("AccessibilityDetector")
    print(f"Classes: {AccessibilityDetector.CLASS_NAMES}")
    print(f"Types: {AccessibilityDetector.CLASS_TYPES}")
