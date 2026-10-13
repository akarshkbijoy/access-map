"""
AccessMap ML — Evaluation Metrics
====================================
Calculate mAP, per-class precision/recall, and F1 scores
for accessibility feature detection models.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional

import numpy as np
import yaml
from loguru import logger


class MetricsCalculator:
    """
    Comprehensive evaluation metrics for object detection.

    Computes:
    - mAP@0.5 and mAP@0.5:0.95
    - Per-class precision, recall, F1
    - Confidence-threshold analysis
    - Speed metrics
    """

    def __init__(self, config_path: str = "config/config.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)

        self.class_names = self.config["classes"]
        self.num_classes = self.config["model"]["num_classes"]

    def evaluate(
        self,
        model_path: str,
        dataset_yaml: str = "data/dataset.yaml",
        split: str = "test",
        conf_threshold: float = 0.25,
        iou_threshold: float = 0.45,
    ) -> Dict:
        """
        Run full evaluation and return comprehensive metrics.

        Args:
            model_path: Path to the trained model.
            dataset_yaml: Path to the dataset YAML file.
            split: Dataset split to evaluate on ('val' or 'test').
            conf_threshold: Confidence threshold for detections.
            iou_threshold: IoU threshold for NMS.

        Returns:
            Dictionary with all evaluation metrics.
        """
        from ultralytics import YOLO

        model = YOLO(model_path)
        imgsz = self.config["model"]["input_size"]

        logger.info(f"Evaluating {model_path} on {split} split...")

        results = model.val(
            data=dataset_yaml,
            split=split,
            imgsz=imgsz,
            conf=conf_threshold,
            iou=iou_threshold,
            plots=True,
            verbose=True,
        )

        # Extract metrics
        metrics = self._extract_metrics(results)

        # Log summary table
        self._log_metrics_table(metrics)

        return metrics

    def _extract_metrics(self, results: Any) -> Dict:
        """
        Extract metrics from Ultralytics validation results.

        Args:
            results: Ultralytics validation results object.

        Returns:
            Structured metrics dictionary.
        """
        box = results.box

        metrics = {
            # Overall metrics
            "mAP50": float(box.map50),
            "mAP50_95": float(box.map),
            "mean_precision": float(box.mp),
            "mean_recall": float(box.mr),

            # Per-class metrics
            "per_class": {},

            # Speed
            "speed": {
                "preprocess_ms": results.speed.get("preprocess", 0),
                "inference_ms": results.speed.get("inference", 0),
                "postprocess_ms": results.speed.get("postprocess", 0),
            },
        }

        # Per-class breakdown
        for i in range(self.num_classes):
            class_name = self.class_names.get(i, f"class_{i}")
            try:
                metrics["per_class"][class_name] = {
                    "precision": float(box.p[i]) if i < len(box.p) else 0.0,
                    "recall": float(box.r[i]) if i < len(box.r) else 0.0,
                    "ap50": float(box.ap50[i]) if i < len(box.ap50) else 0.0,
                    "ap50_95": float(box.ap[i]) if i < len(box.ap) else 0.0,
                    "f1": self._f1_score(
                        float(box.p[i]) if i < len(box.p) else 0.0,
                        float(box.r[i]) if i < len(box.r) else 0.0,
                    ),
                }
            except (IndexError, TypeError):
                metrics["per_class"][class_name] = {
                    "precision": 0.0,
                    "recall": 0.0,
                    "ap50": 0.0,
                    "ap50_95": 0.0,
                    "f1": 0.0,
                }

        return metrics

    @staticmethod
    def _f1_score(precision: float, recall: float) -> float:
        """Calculate F1 score from precision and recall."""
        if precision + recall == 0:
            return 0.0
        return 2 * (precision * recall) / (precision + recall)

    def _log_metrics_table(self, metrics: Dict) -> None:
        """Pretty-print metrics as a table."""
        logger.info("")
        logger.info("=" * 80)
        logger.info("EVALUATION RESULTS")
        logger.info("=" * 80)
        logger.info(f"  mAP@0.5:      {metrics['mAP50']:.4f}")
        logger.info(f"  mAP@0.5:0.95: {metrics['mAP50_95']:.4f}")
        logger.info(f"  Precision:     {metrics['mean_precision']:.4f}")
        logger.info(f"  Recall:        {metrics['mean_recall']:.4f}")
        logger.info("")

        # Per-class table
        header = f"{'Class':<25} {'Prec':>8} {'Recall':>8} {'AP@50':>8} {'AP@50:95':>10} {'F1':>8}"
        logger.info(header)
        logger.info("-" * 75)

        for class_name, class_metrics in metrics["per_class"].items():
            row = (
                f"  {class_name:<23} "
                f"{class_metrics['precision']:>8.4f} "
                f"{class_metrics['recall']:>8.4f} "
                f"{class_metrics['ap50']:>8.4f} "
                f"{class_metrics['ap50_95']:>10.4f} "
                f"{class_metrics['f1']:>8.4f}"
            )
            logger.info(row)

        logger.info("-" * 75)
        logger.info("")

        # Speed info
        speed = metrics["speed"]
        total = sum(speed.values())
        logger.info(f"  Speed: preprocess={speed['preprocess_ms']:.1f}ms, "
                     f"inference={speed['inference_ms']:.1f}ms, "
                     f"postprocess={speed['postprocess_ms']:.1f}ms "
                     f"(total={total:.1f}ms)")
        logger.info("=" * 80)

    def confidence_analysis(
        self,
        model_path: str,
        dataset_yaml: str = "data/dataset.yaml",
        thresholds: Optional[List[float]] = None,
    ) -> Dict:
        """
        Analyze model performance across different confidence thresholds.

        Args:
            model_path: Path to the trained model.
            dataset_yaml: Path to dataset configuration.
            thresholds: List of thresholds to test.

        Returns:
            Dictionary mapping threshold → metrics.
        """
        if thresholds is None:
            thresholds = [0.1, 0.15, 0.2, 0.25, 0.3, 0.4, 0.5, 0.6, 0.7]

        threshold_results = {}
        for thresh in thresholds:
            logger.info(f"Evaluating at confidence threshold = {thresh}")
            metrics = self.evaluate(
                model_path, dataset_yaml, conf_threshold=thresh
            )
            threshold_results[thresh] = {
                "mAP50": metrics["mAP50"],
                "precision": metrics["mean_precision"],
                "recall": metrics["mean_recall"],
            }

        # Find optimal threshold (best F1)
        best_thresh = max(
            threshold_results.items(),
            key=lambda x: self._f1_score(x[1]["precision"], x[1]["recall"]),
        )
        logger.info(
            f"Optimal threshold: {best_thresh[0]} "
            f"(F1={self._f1_score(best_thresh[1]['precision'], best_thresh[1]['recall']):.4f})"
        )

        return threshold_results

    def save_results(
        self,
        metrics: Dict,
        output_path: str = "evaluation_results.yaml",
    ) -> str:
        """
        Save evaluation results to a YAML file.

        Args:
            metrics: Metrics dictionary from evaluate().
            output_path: Output file path.

        Returns:
            Path to the saved file.
        """
        # Convert numpy types to Python types for YAML serialization
        clean_metrics = self._to_python_types(metrics)

        with open(output_path, "w") as f:
            yaml.dump(clean_metrics, f, default_flow_style=False, sort_keys=False)

        logger.info(f"Results saved to: {output_path}")
        return output_path

    def _to_python_types(self, obj):
        """Recursively convert numpy types to Python natives."""
        if isinstance(obj, dict):
            return {k: self._to_python_types(v) for k, v in obj.items()}
        elif isinstance(obj, list):
            return [self._to_python_types(v) for v in obj]
        elif isinstance(obj, (np.integer,)):
            return int(obj)
        elif isinstance(obj, (np.floating,)):
            return float(obj)
        elif isinstance(obj, np.ndarray):
            return obj.tolist()
        return obj


if __name__ == "__main__":
    calc = MetricsCalculator()
    print(f"Classes: {calc.class_names}")
    print("Ready to evaluate. Run: calc.evaluate('models/best.pt')")
