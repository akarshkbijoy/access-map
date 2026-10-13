#!/usr/bin/env python3
"""
AccessMap ML — Training Script
==================================
Train YOLOv8 model for accessibility feature detection.

Usage:
    # Train with defaults
    python scripts/train.py

    # Custom dataset and epochs
    python scripts/train.py --dataset data/dataset.yaml --epochs 100

    # Resume training
    python scripts/train.py --resume

    # Custom experiment name
    python scripts/train.py --name my_experiment --batch-size 8
"""

import argparse
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from loguru import logger
from src.model.train import Trainer


def main():
    parser = argparse.ArgumentParser(
        description="Train YOLOv8 for accessibility feature detection"
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
        "--weights",
        default=None,
        help="Path to initial weights (default: from config)",
    )
    parser.add_argument(
        "--epochs",
        type=int,
        default=None,
        help="Number of training epochs (overrides config)",
    )
    parser.add_argument(
        "--batch-size",
        type=int,
        default=None,
        help="Batch size (overrides config)",
    )
    parser.add_argument(
        "--lr",
        type=float,
        default=None,
        help="Learning rate (overrides config)",
    )
    parser.add_argument(
        "--device",
        default=None,
        help="Device: cpu, cuda:0, auto",
    )
    parser.add_argument(
        "--name",
        default=None,
        help="Experiment name",
    )
    parser.add_argument(
        "--resume",
        action="store_true",
        help="Resume training from last checkpoint",
    )
    parser.add_argument(
        "--validate",
        action="store_true",
        help="Run validation after training",
    )

    args = parser.parse_args()

    # Verify dataset exists
    if not Path(args.dataset).exists():
        logger.error(f"Dataset config not found: {args.dataset}")
        logger.info("Run 'python scripts/prepare_data.py' first to prepare the dataset.")
        sys.exit(1)

    # Build overrides from CLI args
    overrides = {}
    if args.epochs:
        overrides["epochs"] = args.epochs
    if args.batch_size:
        overrides["batch"] = args.batch_size
    if args.lr:
        overrides["lr0"] = args.lr
    if args.device:
        overrides["device"] = args.device

    # Train
    trainer = Trainer(config_path=args.config)
    results = trainer.train(
        dataset_yaml=args.dataset,
        model_weights=args.weights,
        resume=args.resume,
        experiment_name=args.name,
        **overrides,
    )

    # Validate on test set
    if args.validate:
        logger.info("\nRunning validation on test set...")
        trainer.validate(
            model_path="models/best.pt",
            dataset_yaml=args.dataset,
            split="test",
        )

    logger.info("\nTraining complete!")
    logger.info("Next steps:")
    logger.info("  1. Evaluate:  python scripts/evaluate.py")
    logger.info("  2. Export:    python scripts/export_model.py")
    logger.info("  3. Serve:    uvicorn src.api.main:app --host 0.0.0.0 --port 8000")


if __name__ == "__main__":
    main()
