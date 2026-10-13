#!/usr/bin/env python3
"""
AccessMap ML — Evaluation Script
====================================
Evaluate trained model and generate detailed reports.

Usage:
    python scripts/evaluate.py
    python scripts/evaluate.py --model models/best.pt --split test
    python scripts/evaluate.py --analyze --output analysis/
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from loguru import logger
from src.evaluation.metrics import MetricsCalculator
from src.evaluation.confusion import ConfusionMatrixVisualizer
from src.evaluation.analysis import DetectionAnalyzer


def main():
    parser = argparse.ArgumentParser(
        description="Evaluate AccessMap ML model"
    )
    parser.add_argument(
        "--model",
        default="models/best.pt",
        help="Path to trained model",
    )
    parser.add_argument(
        "--dataset",
        default="data/dataset.yaml",
        help="Path to dataset.yaml",
    )
    parser.add_argument(
        "--config",
        default="config/config.yaml",
        help="Path to config.yaml",
    )
    parser.add_argument(
        "--split",
        default="test",
        choices=["val", "test"],
        help="Dataset split to evaluate",
    )
    parser.add_argument(
        "--output",
        default="evaluation",
        help="Output directory for results",
    )
    parser.add_argument(
        "--analyze",
        action="store_true",
        help="Run detailed FP/FN analysis",
    )
    parser.add_argument(
        "--confidence-sweep",
        action="store_true",
        help="Analyze performance across confidence thresholds",
    )

    args = parser.parse_args()
    output_dir = Path(args.output)
    output_dir.mkdir(parents=True, exist_ok=True)

    if not Path(args.model).exists():
        logger.error(f"Model not found: {args.model}")
        sys.exit(1)

    # ── Standard Evaluation ──
    logger.info("Running standard evaluation...")
    calc = MetricsCalculator(config_path=args.config)
    metrics = calc.evaluate(
        model_path=args.model,
        dataset_yaml=args.dataset,
        split=args.split,
    )
    calc.save_results(metrics, str(output_dir / "metrics.yaml"))

    # ── Confusion Matrix ──
    logger.info("Generating confusion matrix...")
    # Note: Ultralytics generates confusion matrix during val()
    # The matrix is saved in the runs directory automatically
    logger.info("Check the runs/ directory for the auto-generated confusion matrix")

    # ── Confidence Sweep ──
    if args.confidence_sweep:
        logger.info("Running confidence threshold analysis...")
        threshold_results = calc.confidence_analysis(
            model_path=args.model,
            dataset_yaml=args.dataset,
        )
        calc.save_results(
            threshold_results,
            str(output_dir / "confidence_analysis.yaml"),
        )

    # ── Detailed Analysis ──
    if args.analyze:
        logger.info("Running detailed FP/FN analysis...")

        # Determine test image/label directories from dataset.yaml
        import yaml
        with open(args.dataset, "r") as f:
            dataset_config = yaml.safe_load(f)

        data_path = Path(dataset_config["path"])
        test_images = str(data_path / dataset_config.get("test", "images/test"))
        test_labels = str(data_path / "labels" / "test")

        if Path(test_images).exists() and Path(test_labels).exists():
            analyzer = DetectionAnalyzer(config_path=args.config)
            analyzer.analyze_predictions(
                model_path=args.model,
                image_dir=test_images,
                label_dir=test_labels,
                output_dir=str(output_dir / "analysis"),
            )
        else:
            logger.warning(
                f"Test directories not found: {test_images}, {test_labels}"
            )

    logger.info(f"\nResults saved to: {output_dir}/")
    logger.info("Done!")


if __name__ == "__main__":
    main()
