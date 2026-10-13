#!/usr/bin/env python3
"""
AccessMap ML — Data Preparation Pipeline
============================================
Run the complete data preparation pipeline:
  1. Convert annotations to YOLO format
  2. Validate dataset integrity
  3. Split into train/val/test
  4. Generate dataset.yaml
  5. (Optional) Expand with augmentation

Usage:
    python scripts/prepare_data.py --images data/raw/images --labels data/raw/labels
    python scripts/prepare_data.py --images data/raw/images --annotations data/raw/annotations.json --format coco
    python scripts/prepare_data.py --images data/raw/images --annotations data/raw/annotations/ --format voc
"""

import argparse
import sys
from pathlib import Path

# Add project root to path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from loguru import logger
from src.data.converter import AnnotationConverter
from src.data.loader import DatasetLoader
from src.data.validator import DatasetValidator
from src.data.augmentation import AugmentationPipeline


def main():
    parser = argparse.ArgumentParser(
        description="Prepare dataset for AccessMap ML training"
    )
    parser.add_argument(
        "--images", required=True, help="Path to image directory"
    )
    parser.add_argument(
        "--labels",
        help="Path to YOLO-format labels directory (if already in YOLO format)",
    )
    parser.add_argument(
        "--annotations",
        help="Path to annotation file/directory (COCO JSON, VOC XML dir, or CVAT XML)",
    )
    parser.add_argument(
        "--format",
        choices=["yolo", "coco", "voc", "cvat"],
        default="yolo",
        help="Annotation format (default: yolo)",
    )
    parser.add_argument(
        "--output", default="data/processed", help="Output directory"
    )
    parser.add_argument(
        "--config", default="config/config.yaml", help="Config file path"
    )
    parser.add_argument(
        "--augment",
        action="store_true",
        help="Expand dataset with augmentation",
    )
    parser.add_argument(
        "--aug-copies",
        type=int,
        default=3,
        help="Number of augmented copies per image",
    )
    parser.add_argument(
        "--validate-only",
        action="store_true",
        help="Only run validation, no splitting",
    )
    parser.add_argument(
        "--fix-issues",
        action="store_true",
        help="Auto-fix common label issues",
    )

    args = parser.parse_args()

    logger.info("=" * 60)
    logger.info("AccessMap ML — Data Preparation Pipeline")
    logger.info("=" * 60)

    # ── Step 1: Convert annotations if needed ──
    label_dir = args.labels

    if args.format != "yolo" and args.annotations:
        logger.info(f"\nStep 1: Converting {args.format.upper()} → YOLO format")
        converter = AnnotationConverter()
        label_dir = str(Path(args.output) / "labels_converted")

        if args.format == "coco":
            converter.coco_to_yolo(args.annotations, label_dir)
        elif args.format == "voc":
            converter.voc_to_yolo(args.annotations, label_dir)
        elif args.format == "cvat":
            converter.cvat_to_yolo(args.annotations, label_dir)

        logger.info(f"Converted labels saved to: {label_dir}")
    elif not label_dir:
        logger.error("Either --labels or --annotations must be provided")
        sys.exit(1)

    # ── Step 2: Validate dataset ──
    logger.info("\nStep 2: Validating dataset")
    validator = DatasetValidator(config_path=args.config)
    report = validator.validate_dataset(args.images, label_dir)

    if args.fix_issues:
        logger.info("\nFixing common issues...")
        validator.fix_common_issues(args.images, label_dir, clamp_boxes=True)

    if args.validate_only:
        logger.info("Validation-only mode. Done!")
        return

    if report["matched_pairs"] == 0:
        logger.error("No valid image-label pairs found. Aborting.")
        sys.exit(1)

    # ── Step 3: Split and organize ──
    logger.info("\nStep 3: Splitting dataset (train/val/test)")
    loader = DatasetLoader(config_path=args.config)
    yaml_path = loader.load_and_prepare(args.images, label_dir)

    # ── Step 4: Augmentation (optional) ──
    if args.augment:
        logger.info(f"\nStep 4: Augmenting training data ({args.aug_copies} copies/image)")
        aug = AugmentationPipeline(config_path=args.config)

        train_img_dir = str(Path(args.output) / "images" / "train")
        train_lbl_dir = str(Path(args.output) / "labels" / "train")
        aug_img_dir = str(Path(args.output) / "images" / "train")  # Same dir
        aug_lbl_dir = str(Path(args.output) / "labels" / "train")

        generated = aug.expand_dataset(
            train_img_dir,
            train_lbl_dir,
            aug_img_dir,
            aug_lbl_dir,
            num_augmentations=args.aug_copies,
        )
        logger.info(f"Generated {generated} augmented training samples")

    # ── Done ──
    logger.info("")
    logger.info("=" * 60)
    logger.info("Data preparation complete!")
    logger.info(f"  Dataset config: {yaml_path}")
    logger.info(f"  Output dir:     {args.output}")
    logger.info("")
    logger.info("Next step: python scripts/train.py")
    logger.info("=" * 60)


if __name__ == "__main__":
    main()
