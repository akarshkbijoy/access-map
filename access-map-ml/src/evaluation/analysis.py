"""
AccessMap ML — Detection Analysis
====================================
False positive/negative analysis, small object analysis,
and detailed error breakdowns for model debugging.
"""

import json
from pathlib import Path
from typing import Any, Dict, List, Optional

import cv2
import numpy as np
import yaml
from loguru import logger


class DetectionAnalyzer:
    """
    Analyze detection errors to identify model weaknesses.

    Features:
    - False positive analysis with visualizations
    - False negative (missed detection) analysis
    - Small object performance analysis
    - Error pattern identification
    """

    def __init__(self, config_path: str = "config/config.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)

        self.class_names = self.config["classes"]
        self.num_classes = self.config["model"]["num_classes"]

    def analyze_predictions(
        self,
        model_path: str,
        image_dir: str,
        label_dir: str,
        output_dir: str = "analysis",
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.5,
        max_samples: int = 50,
    ) -> Dict:
        """
        Run comprehensive prediction analysis.

        Args:
            model_path: Path to the trained model.
            image_dir: Directory of test images.
            label_dir: Directory of ground truth labels (YOLO format).
            output_dir: Directory to save analysis outputs.
            conf_threshold: Confidence threshold.
            iou_threshold: IoU threshold for matching predictions to ground truth.
            max_samples: Maximum number of error samples to save.

        Returns:
            Analysis report dictionary.
        """
        from ultralytics import YOLO

        model = YOLO(model_path)
        image_dir = Path(image_dir)
        label_dir = Path(label_dir)
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)

        # Subdirectories for error visualization
        fp_dir = output_path / "false_positives"
        fn_dir = output_path / "false_negatives"
        fp_dir.mkdir(exist_ok=True)
        fn_dir.mkdir(exist_ok=True)

        report = {
            "total_images": 0,
            "total_gt_objects": 0,
            "total_predictions": 0,
            "true_positives": 0,
            "false_positives": 0,
            "false_negatives": 0,
            "per_class_errors": {
                name: {"fp": 0, "fn": 0, "tp": 0}
                for name in self.class_names.values()
            },
            "fp_samples": [],
            "fn_samples": [],
            "size_analysis": {"small": 0, "medium": 0, "large": 0},
        }

        image_exts = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}
        fp_count = 0
        fn_count = 0

        for img_path in sorted(image_dir.iterdir()):
            if img_path.suffix.lower() not in image_exts:
                continue

            report["total_images"] += 1

            # Run inference
            results = model(str(img_path), conf=conf_threshold, verbose=False)
            pred_boxes = results[0].boxes

            # Load ground truth
            lbl_path = label_dir / f"{img_path.stem}.txt"
            gt_boxes = self._load_yolo_labels(lbl_path)

            report["total_gt_objects"] += len(gt_boxes)
            report["total_predictions"] += len(pred_boxes)

            # Read image for visualization
            img = cv2.imread(str(img_path))
            if img is None:
                continue
            img_h, img_w = img.shape[:2]

            # Match predictions to ground truth
            matched_gt = set()
            matched_pred = set()

            if len(pred_boxes) > 0 and len(gt_boxes) > 0:
                pred_xyxy = pred_boxes.xyxy.cpu().numpy()
                pred_cls = pred_boxes.cls.cpu().numpy().astype(int)
                pred_conf = pred_boxes.conf.cpu().numpy()

                for pi in range(len(pred_boxes)):
                    best_iou = 0
                    best_gi = -1

                    for gi, gt in enumerate(gt_boxes):
                        if gi in matched_gt:
                            continue

                        # Convert GT from YOLO normalized to xyxy
                        gt_class, xc, yc, w, h = gt
                        x1 = (xc - w / 2) * img_w
                        y1 = (yc - h / 2) * img_h
                        x2 = (xc + w / 2) * img_w
                        y2 = (yc + h / 2) * img_h

                        iou = self._calculate_iou(
                            pred_xyxy[pi], [x1, y1, x2, y2]
                        )

                        if iou > best_iou and pred_cls[pi] == gt_class:
                            best_iou = iou
                            best_gi = gi

                    if best_iou >= iou_threshold:
                        matched_pred.add(pi)
                        matched_gt.add(best_gi)
                        report["true_positives"] += 1
                        class_name = self.class_names.get(
                            pred_cls[pi], f"class_{pred_cls[pi]}"
                        )
                        report["per_class_errors"][class_name]["tp"] += 1

                # False positives: predictions not matched
                for pi in range(len(pred_boxes)):
                    if pi not in matched_pred:
                        report["false_positives"] += 1
                        class_name = self.class_names.get(
                            pred_cls[pi], f"class_{pred_cls[pi]}"
                        )
                        report["per_class_errors"][class_name]["fp"] += 1

                        # Save FP visualization
                        if fp_count < max_samples:
                            fp_img = img.copy()
                            bx = pred_xyxy[pi].astype(int)
                            cv2.rectangle(fp_img, (bx[0], bx[1]), (bx[2], bx[3]),
                                        (0, 0, 255), 2)
                            cv2.putText(
                                fp_img,
                                f"FP: {class_name} ({pred_conf[pi]:.2f})",
                                (bx[0], bx[1] - 10),
                                cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 0, 255), 2,
                            )
                            cv2.imwrite(
                                str(fp_dir / f"fp_{fp_count}_{img_path.name}"),
                                fp_img,
                            )
                            report["fp_samples"].append({
                                "image": img_path.name,
                                "class": class_name,
                                "confidence": float(pred_conf[pi]),
                            })
                            fp_count += 1

            # False negatives: GT objects not matched
            for gi, gt in enumerate(gt_boxes):
                if gi not in matched_gt:
                    report["false_negatives"] += 1
                    gt_class = int(gt[0])
                    class_name = self.class_names.get(gt_class, f"class_{gt_class}")
                    report["per_class_errors"][class_name]["fn"] += 1

                    # Size analysis
                    area = gt[3] * gt[4]  # normalized area
                    if area < 0.01:
                        report["size_analysis"]["small"] += 1
                    elif area < 0.05:
                        report["size_analysis"]["medium"] += 1
                    else:
                        report["size_analysis"]["large"] += 1

                    # Save FN visualization
                    if fn_count < max_samples:
                        fn_img = img.copy()
                        xc, yc, w, h = gt[1], gt[2], gt[3], gt[4]
                        x1 = int((xc - w / 2) * img_w)
                        y1 = int((yc - h / 2) * img_h)
                        x2 = int((xc + w / 2) * img_w)
                        y2 = int((yc + h / 2) * img_h)
                        cv2.rectangle(fn_img, (x1, y1), (x2, y2), (0, 255, 255), 2)
                        cv2.putText(
                            fn_img,
                            f"MISSED: {class_name}",
                            (x1, y1 - 10),
                            cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 255, 255), 2,
                        )
                        cv2.imwrite(
                            str(fn_dir / f"fn_{fn_count}_{img_path.name}"),
                            fn_img,
                        )
                        report["fn_samples"].append({
                            "image": img_path.name,
                            "class": class_name,
                        })
                        fn_count += 1

        # Save report
        report_path = output_path / "analysis_report.json"
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)

        self._log_analysis(report)
        logger.info(f"Analysis saved to: {output_path}")

        return report

    def _load_yolo_labels(self, label_path: Path) -> List:
        """Load YOLO-format labels from a .txt file."""
        if not label_path.exists():
            return []

        labels = []
        with open(label_path, "r") as f:
            for line in f:
                parts = line.strip().split()
                if len(parts) >= 5:
                    labels.append([
                        int(parts[0]),
                        float(parts[1]),
                        float(parts[2]),
                        float(parts[3]),
                        float(parts[4]),
                    ])
        return labels

    @staticmethod
    def _calculate_iou(box1, box2) -> float:
        """
        Calculate IoU between two boxes in xyxy format.

        Args:
            box1: [x1, y1, x2, y2]
            box2: [x1, y1, x2, y2]

        Returns:
            IoU value (0-1).
        """
        x1 = max(box1[0], box2[0])
        y1 = max(box1[1], box2[1])
        x2 = min(box1[2], box2[2])
        y2 = min(box1[3], box2[3])

        intersection = max(0, x2 - x1) * max(0, y2 - y1)

        area1 = (box1[2] - box1[0]) * (box1[3] - box1[1])
        area2 = (box2[2] - box2[0]) * (box2[3] - box2[1])
        union = area1 + area2 - intersection

        if union == 0:
            return 0.0
        return intersection / union

    def _log_analysis(self, report: Dict) -> None:
        """Log the analysis report."""
        logger.info("=" * 60)
        logger.info("DETECTION ANALYSIS REPORT")
        logger.info("=" * 60)
        logger.info(f"  Images analyzed:     {report['total_images']}")
        logger.info(f"  Ground truth objects: {report['total_gt_objects']}")
        logger.info(f"  Total predictions:   {report['total_predictions']}")
        logger.info(f"  True positives:      {report['true_positives']}")
        logger.info(f"  False positives:     {report['false_positives']}")
        logger.info(f"  False negatives:     {report['false_negatives']}")
        logger.info("")
        logger.info("  Per-class errors:")
        for class_name, errors in report["per_class_errors"].items():
            if errors["tp"] + errors["fp"] + errors["fn"] > 0:
                logger.info(
                    f"    {class_name:<25} TP={errors['tp']:>4}  "
                    f"FP={errors['fp']:>4}  FN={errors['fn']:>4}"
                )
        logger.info("")
        logger.info(
            f"  Missed detections by size: "
            f"small={report['size_analysis']['small']}, "
            f"medium={report['size_analysis']['medium']}, "
            f"large={report['size_analysis']['large']}"
        )
        logger.info("=" * 60)


if __name__ == "__main__":
    analyzer = DetectionAnalyzer()
    print(f"Classes: {analyzer.class_names}")
