"""
AccessMap ML — Post-Processing
==================================
Advanced post-processing for detected accessibility features:
  - Step/stair counting using edge detection
  - Severity classification for barriers
  - Spatial relationship detection between features
  - Multi-label aggregation
"""

import math
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
import yaml
from loguru import logger


class PostProcessor:
    """
    Post-process detection results to extract higher-level
    accessibility information beyond raw bounding boxes.
    """

    def __init__(self, config_path: str = "config/config.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)

        self.severity_config = self.config.get("severity", {})
        self.step_ranges = self.severity_config.get("step_count_ranges", {
            "low": [1, 2],
            "medium": [3, 5],
            "high": [6, 999],
        })
        self.spatial_config = self.severity_config.get("spatial", {
            "near_threshold": 200,
            "proximity_threshold": 500,
        })

    def process(
        self,
        detections: List[Dict],
        image: Optional[np.ndarray] = None,
    ) -> Dict:
        """
        Apply all post-processing to a set of detections.

        Args:
            detections: List of detection dicts from AccessibilityDetector.
            image: Original image (BGR numpy array) for step counting.

        Returns:
            Enhanced detection results with:
            - step_analysis: step counting and severity for stair detections
            - spatial_relationships: proximity between features
            - severity_assessment: overall barrier severity
        """
        result = {
            "detections": detections,
            "step_analysis": [],
            "spatial_relationships": [],
            "severity_assessment": None,
        }

        # --- Step/Stair Analysis ---
        stair_detections = [
            d for d in detections if d["class_name"] == "stairs"
        ]

        if stair_detections and image is not None:
            for det in stair_detections:
                step_info = self.count_steps(image, det["bbox"])
                det["step_analysis"] = step_info
                result["step_analysis"].append({
                    "detection_id": det["id"],
                    **step_info,
                })

        # --- Spatial Relationships ---
        if len(detections) >= 2:
            result["spatial_relationships"] = self.detect_spatial_relationships(
                detections
            )

        # --- Severity Assessment ---
        result["severity_assessment"] = self.assess_severity(detections)

        return result

    def count_steps(
        self,
        image: np.ndarray,
        bbox: Dict,
        debug: bool = False,
    ) -> Dict:
        """
        Estimate the number of steps in a stair region.

        Uses horizontal edge detection (Canny + Hough lines) to count
        the number of horizontal edges, which correspond to step edges.

        Args:
            image: Full image (BGR numpy array).
            bbox: Bounding box dict with x1, y1, x2, y2 keys.
            debug: If True, save debug visualization.

        Returns:
            Dictionary with step count and severity.
        """
        # Extract ROI
        x1 = max(0, int(bbox["x1"]))
        y1 = max(0, int(bbox["y1"]))
        x2 = min(image.shape[1], int(bbox["x2"]))
        y2 = min(image.shape[0], int(bbox["y2"]))

        roi = image[y1:y2, x1:x2]

        if roi.size == 0:
            return {"step_count": 0, "severity": "unknown", "method": "region_empty"}

        # Convert to grayscale
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)

        # Apply Gaussian blur to reduce noise
        blurred = cv2.GaussianBlur(gray, (5, 5), 0)

        # Edge detection
        edges = cv2.Canny(blurred, 50, 150)

        # Apply horizontal kernel to emphasize horizontal edges (step edges)
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (roi.shape[1] // 3, 1))
        horizontal = cv2.morphologyEx(edges, cv2.MORPH_OPEN, kernel)

        # Detect horizontal lines using Hough transform
        lines = cv2.HoughLinesP(
            horizontal,
            rho=1,
            theta=np.pi / 180,
            threshold=roi.shape[1] // 4,  # Min votes proportional to width
            minLineLength=roi.shape[1] // 3,  # Min line length
            maxLineGap=20,
        )

        if lines is None:
            # Fallback: count horizontal edge rows
            row_sums = np.sum(edges, axis=1)
            threshold = np.max(row_sums) * 0.3 if np.max(row_sums) > 0 else 0
            significant_rows = row_sums > threshold

            # Group consecutive rows into steps
            step_count = 0
            in_step = False
            for is_edge in significant_rows:
                if is_edge and not in_step:
                    step_count += 1
                    in_step = True
                elif not is_edge:
                    in_step = False

            method = "edge_row_grouping"
        else:
            # Group lines by y-coordinate (merge lines on the same step)
            line_ys = []
            for line in lines:
                x1_l, y1_l, x2_l, y2_l = line[0]
                avg_y = (y1_l + y2_l) / 2
                line_ys.append(avg_y)

            line_ys.sort()

            # Merge lines within 10% of ROI height
            merge_distance = max(roi.shape[0] * 0.08, 5)
            step_count = 1 if line_ys else 0
            for i in range(1, len(line_ys)):
                if line_ys[i] - line_ys[i - 1] > merge_distance:
                    step_count += 1

            method = "hough_lines"

        # Classify severity
        severity = self._classify_step_severity(step_count)

        return {
            "step_count": step_count,
            "severity": severity,
            "method": method,
            "confidence": "estimated",
        }

    def _classify_step_severity(self, step_count: int) -> str:
        """
        Classify step count into severity levels.

        Args:
            step_count: Estimated number of steps.

        Returns:
            Severity string: 'low', 'medium', 'high', or 'none'.
        """
        if step_count == 0:
            return "none"

        for severity, (low, high) in self.step_ranges.items():
            if low <= step_count <= high:
                return severity

        return "high"  # Default for very high counts

    def detect_spatial_relationships(
        self, detections: List[Dict]
    ) -> List[Dict]:
        """
        Detect spatial relationships between accessibility features.

        Examples:
        - "Wheelchair ramp near entrance (doorway)"
        - "Elevator in proximity to stairs"
        - "Grab bar near accessible bathroom"

        Args:
            detections: List of detection dictionaries.

        Returns:
            List of spatial relationship descriptions.
        """
        relationships = []
        near_threshold = self.spatial_config.get("near_threshold", 200)
        proximity_threshold = self.spatial_config.get("proximity_threshold", 500)

        # Interesting relationship pairs
        relationship_pairs = [
            ("wheelchair_ramp", "doorway", "Wheelchair ramp near entrance"),
            ("elevator", "stairs", "Elevator available near stairs"),
            ("grab_bar", "accessible_bathroom", "Grab bar in bathroom area"),
            ("grab_bar", "stairs", "Handrail at stairway"),
            ("tactile_paving", "doorway", "Tactile paving near entrance"),
            ("accessible_parking", "wheelchair_ramp", "Accessible parking with ramp access"),
            ("lift", "stairs", "Lift alternative to stairs"),
        ]

        for class_a, class_b, description in relationship_pairs:
            dets_a = [d for d in detections if d["class_name"] == class_a]
            dets_b = [d for d in detections if d["class_name"] == class_b]

            for da in dets_a:
                for db in dets_b:
                    distance = self._bbox_distance(da["bbox"], db["bbox"])

                    if distance < near_threshold:
                        proximity = "adjacent"
                    elif distance < proximity_threshold:
                        proximity = "nearby"
                    else:
                        continue  # Too far apart

                    relationships.append({
                        "feature_a": da["display_name"],
                        "feature_b": db["display_name"],
                        "description": description,
                        "proximity": proximity,
                        "distance_pixels": round(distance, 1),
                        "detection_ids": [da["id"], db["id"]],
                    })

        return relationships

    @staticmethod
    def _bbox_distance(bbox_a: Dict, bbox_b: Dict) -> float:
        """
        Calculate the distance between the centers of two bounding boxes.

        Args:
            bbox_a: First bounding box dict with x1, y1, x2, y2.
            bbox_b: Second bounding box dict with x1, y1, x2, y2.

        Returns:
            Euclidean distance in pixels.
        """
        cx_a = (bbox_a["x1"] + bbox_a["x2"]) / 2
        cy_a = (bbox_a["y1"] + bbox_a["y2"]) / 2
        cx_b = (bbox_b["x1"] + bbox_b["x2"]) / 2
        cy_b = (bbox_b["y1"] + bbox_b["y2"]) / 2

        return math.sqrt((cx_a - cx_b) ** 2 + (cy_a - cy_b) ** 2)

    def assess_severity(self, detections: List[Dict]) -> Dict:
        """
        Provide an overall severity assessment based on all detections.

        Args:
            detections: List of detection dictionaries.

        Returns:
            Severity assessment dictionary.
        """
        barriers = [d for d in detections if d.get("type") == "barrier"]
        aids = [d for d in detections if d.get("type") == "aid"]

        # Check for step analysis
        max_steps = 0
        for det in detections:
            step_info = det.get("step_analysis", {})
            if step_info:
                max_steps = max(max_steps, step_info.get("step_count", 0))

        # Determine overall severity
        if not barriers:
            severity = "none"
            description = "No accessibility barriers detected"
        elif max_steps > 5:
            severity = "high"
            description = f"Significant barrier: {max_steps} steps detected"
        elif len(barriers) > 2:
            severity = "high"
            description = f"Multiple barriers ({len(barriers)}) detected"
        elif aids and len(aids) >= len(barriers):
            severity = "low"
            description = "Barriers present but accessibility aids available"
        else:
            severity = "medium"
            description = "Barriers present with limited accessibility aids"

        return {
            "severity": severity,
            "description": description,
            "barrier_count": len(barriers),
            "aid_count": len(aids),
            "max_step_count": max_steps,
        }


if __name__ == "__main__":
    pp = PostProcessor()
    print(f"Step severity ranges: {pp.step_ranges}")
    print(f"Spatial thresholds: {pp.spatial_config}")
