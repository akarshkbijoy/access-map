"""
AccessMap ML — Detection Visualizer
=======================================
Draw bounding boxes, labels, and annotations
on images for visualization and debugging.
"""

from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np
from loguru import logger


class DetectionVisualizer:
    """
    Visualize detection results on images.

    Features:
    - Color-coded bounding boxes by class
    - Confidence score labels
    - Severity annotations for stairs
    - Spatial relationship indicators
    - Side-by-side comparison views
    """

    # Distinct colors for each class (BGR format)
    CLASS_COLORS = {
        0: (255, 100, 0),    # wheelchair — blue
        1: (0, 200, 0),      # wheelchair_ramp — green
        2: (0, 200, 255),    # elevator — yellow
        3: (200, 100, 255),  # lift — pink
        4: (0, 0, 255),      # stairs — red (barrier)
        5: (255, 200, 0),    # accessible_parking — cyan
        6: (200, 255, 0),    # accessible_bathroom — lime
        7: (100, 150, 255),  # grab_bar — salmon
        8: (180, 180, 180),  # doorway — gray
        9: (0, 255, 255),    # tactile_paving — yellow
    }

    def __init__(self):
        self.font = cv2.FONT_HERSHEY_SIMPLEX
        self.font_scale = 0.5
        self.thickness = 2
        self.label_bg_alpha = 0.7

    def draw_detections(
        self,
        image: np.ndarray,
        detections: List[Dict],
        show_confidence: bool = True,
        show_class: bool = True,
        show_severity: bool = True,
        min_confidence: float = 0.0,
    ) -> np.ndarray:
        """
        Draw all detections on an image.

        Args:
            image: BGR numpy array.
            detections: List of detection dicts from AccessibilityDetector.
            show_confidence: Show confidence scores.
            show_class: Show class names.
            show_severity: Show severity annotations for stairs.
            min_confidence: Minimum confidence to display.

        Returns:
            Annotated image (BGR numpy array).
        """
        annotated = image.copy()

        for det in detections:
            if det["confidence"] < min_confidence:
                continue

            bbox = det["bbox"]
            class_id = det["class_id"]
            color = self.CLASS_COLORS.get(class_id, (255, 255, 255))

            # Draw bounding box
            x1, y1 = int(bbox["x1"]), int(bbox["y1"])
            x2, y2 = int(bbox["x2"]), int(bbox["y2"])
            cv2.rectangle(annotated, (x1, y1), (x2, y2), color, self.thickness)

            # Build label text
            parts = []
            if show_class:
                parts.append(det["display_name"])
            if show_confidence:
                parts.append(f"{det['confidence']:.0%}")
            if show_severity and det.get("step_analysis"):
                step_info = det["step_analysis"]
                parts.append(
                    f"{step_info['step_count']} steps ({step_info['severity']})"
                )

            label = " | ".join(parts)

            if label:
                self._draw_label(annotated, label, (x1, y1), color)

            # Draw type indicator (aid = green dot, barrier = red dot)
            indicator_color = (
                (0, 200, 0) if det.get("type") == "aid"
                else (0, 0, 255) if det.get("type") == "barrier"
                else (180, 180, 180)
            )
            cv2.circle(annotated, (x2 - 8, y1 + 8), 5, indicator_color, -1)

        return annotated

    def _draw_label(
        self,
        image: np.ndarray,
        text: str,
        position: Tuple[int, int],
        color: Tuple[int, int, int],
    ) -> None:
        """
        Draw a label with background rectangle.

        Args:
            image: Image to draw on (modified in place).
            text: Label text.
            position: Top-left corner (x, y).
            color: Label background color (BGR).
        """
        x, y = position
        (tw, th), baseline = cv2.getTextSize(
            text, self.font, self.font_scale, 1
        )

        # Background rectangle
        pad = 4
        cv2.rectangle(
            image,
            (x, y - th - 2 * pad),
            (x + tw + 2 * pad, y),
            color,
            -1,  # Filled
        )

        # Text (white for dark backgrounds, black for light)
        brightness = sum(color) / 3
        text_color = (0, 0, 0) if brightness > 128 else (255, 255, 255)

        cv2.putText(
            image,
            text,
            (x + pad, y - pad),
            self.font,
            self.font_scale,
            text_color,
            1,
            cv2.LINE_AA,
        )

    def draw_spatial_relationships(
        self,
        image: np.ndarray,
        detections: List[Dict],
        relationships: List[Dict],
    ) -> np.ndarray:
        """
        Draw lines and labels showing spatial relationships.

        Args:
            image: BGR numpy array.
            detections: Detection list (for bounding box info).
            relationships: Spatial relationships from PostProcessor.

        Returns:
            Annotated image.
        """
        annotated = image.copy()

        # Build detection ID → bbox center lookup
        det_centers = {}
        for det in detections:
            bbox = det["bbox"]
            cx = int((bbox["x1"] + bbox["x2"]) / 2)
            cy = int((bbox["y1"] + bbox["y2"]) / 2)
            det_centers[det["id"]] = (cx, cy)

        for rel in relationships:
            ids = rel.get("detection_ids", [])
            if len(ids) < 2:
                continue

            center_a = det_centers.get(ids[0])
            center_b = det_centers.get(ids[1])

            if center_a and center_b:
                # Draw dashed line
                color = (0, 255, 200) if rel["proximity"] == "adjacent" else (200, 200, 0)
                cv2.line(annotated, center_a, center_b, color, 1, cv2.LINE_AA)

                # Label at midpoint
                mid_x = (center_a[0] + center_b[0]) // 2
                mid_y = (center_a[1] + center_b[1]) // 2
                label = f"{rel['proximity']} ({rel['distance_pixels']:.0f}px)"
                cv2.putText(
                    annotated, label,
                    (mid_x - 50, mid_y - 5),
                    self.font, 0.4, color, 1, cv2.LINE_AA,
                )

        return annotated

    def create_comparison(
        self,
        original: np.ndarray,
        annotated: np.ndarray,
        title_original: str = "Original",
        title_annotated: str = "Detections",
    ) -> np.ndarray:
        """
        Create a side-by-side comparison image.

        Args:
            original: Original image.
            annotated: Annotated image.
            title_original: Title for the original image.
            title_annotated: Title for the annotated image.

        Returns:
            Side-by-side comparison image.
        """
        # Resize to same height
        h1, w1 = original.shape[:2]
        h2, w2 = annotated.shape[:2]
        target_h = max(h1, h2)

        if h1 != target_h:
            scale = target_h / h1
            original = cv2.resize(original, (int(w1 * scale), target_h))
        if h2 != target_h:
            scale = target_h / h2
            annotated = cv2.resize(annotated, (int(w2 * scale), target_h))

        # Add titles
        title_h = 40
        orig_with_title = np.zeros(
            (original.shape[0] + title_h, original.shape[1], 3), dtype=np.uint8
        )
        orig_with_title[title_h:] = original
        cv2.putText(
            orig_with_title, title_original,
            (10, 28), self.font, 0.8, (255, 255, 255), 2, cv2.LINE_AA,
        )

        ann_with_title = np.zeros(
            (annotated.shape[0] + title_h, annotated.shape[1], 3), dtype=np.uint8
        )
        ann_with_title[title_h:] = annotated
        cv2.putText(
            ann_with_title, title_annotated,
            (10, 28), self.font, 0.8, (255, 255, 255), 2, cv2.LINE_AA,
        )

        # Separator
        sep = np.ones((orig_with_title.shape[0], 4, 3), dtype=np.uint8) * 128

        return np.hstack([orig_with_title, sep, ann_with_title])

    def save_annotated(
        self,
        image: np.ndarray,
        detections: List[Dict],
        output_path: str,
        spatial_relationships: Optional[List[Dict]] = None,
    ) -> str:
        """
        Draw detections and save the annotated image.

        Args:
            image: Original BGR image.
            detections: Detection list.
            output_path: Path to save the annotated image.
            spatial_relationships: Optional spatial relationships to draw.

        Returns:
            Path to saved image.
        """
        annotated = self.draw_detections(image, detections)

        if spatial_relationships:
            annotated = self.draw_spatial_relationships(
                annotated, detections, spatial_relationships
            )

        cv2.imwrite(output_path, annotated)
        logger.info(f"Annotated image saved to: {output_path}")
        return output_path


if __name__ == "__main__":
    viz = DetectionVisualizer()
    print(f"Class colors: {viz.CLASS_COLORS}")
