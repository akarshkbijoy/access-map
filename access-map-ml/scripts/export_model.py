#!/usr/bin/env python3
"""
AccessMap ML — Model Export Script
=====================================
Export trained model to ONNX, TFLite, etc.

Usage:
    python scripts/export_model.py
    python scripts/export_model.py --model models/best.pt --formats onnx tflite
    python scripts/export_model.py --benchmark
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from loguru import logger
from src.model.export import ModelExporter


def main():
    parser = argparse.ArgumentParser(
        description="Export AccessMap ML model to deployment formats"
    )
    parser.add_argument(
        "--model",
        default="models/best.pt",
        help="Path to trained model (.pt)",
    )
    parser.add_argument(
        "--config",
        default="config/config.yaml",
        help="Config file path",
    )
    parser.add_argument(
        "--formats",
        nargs="+",
        default=None,
        choices=["onnx", "tflite", "torchscript", "engine", "openvino", "coreml"],
        help="Export formats (default: from config)",
    )
    parser.add_argument(
        "--benchmark",
        action="store_true",
        help="Run inference benchmark after export",
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Validate exported model against original",
    )
    parser.add_argument(
        "--test-images",
        default=None,
        help="Directory with test images for validation",
    )

    args = parser.parse_args()

    if not Path(args.model).exists():
        logger.error(f"Model not found: {args.model}")
        sys.exit(1)

    exporter = ModelExporter(config_path=args.config)

    # ── Export ──
    logger.info("Exporting model...")
    exported = exporter.export(
        model_path=args.model,
        formats=args.formats,
    )

    # Show model sizes
    for fmt, path in exported.items():
        if not path.startswith("ERROR"):
            size = exporter.get_model_size(path)
            logger.info(f"  {fmt}: {size.get('size_mb', 'N/A')}")

    # ── Validate ──
    if args.validate:
        for fmt, path in exported.items():
            if path.startswith("ERROR"):
                continue
            logger.info(f"\nValidating {fmt} export...")
            exporter.validate_export(
                args.model,
                path,
                test_image_dir=args.test_images,
            )

    # ── Benchmark ──
    if args.benchmark:
        logger.info("\nBenchmarking original model...")
        exporter.benchmark(args.model)

        for fmt, path in exported.items():
            if path.startswith("ERROR"):
                continue
            logger.info(f"\nBenchmarking {fmt} model...")
            exporter.benchmark(path)

    logger.info("\nExport complete!")
    logger.info("Start the API server with:")
    logger.info("  uvicorn src.api.main:app --host 0.0.0.0 --port 8000")


if __name__ == "__main__":
    main()
