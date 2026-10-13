"""
AccessMap ML — Dataset Validator
==================================
Validates dataset integrity before training:
  - Orphaned images/labels detection
  - Bounding box coordinate validation
  - Class distribution analysis & imbalance warnings
  - Image corruption checks
"""

from collections import Counter
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import yaml
from loguru import logger


class DatasetValidator:
    """
    Comprehensive dataset quality checks for YOLO-format datasets.
    """

    IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff"}

    def __init__(self, config_path: str = "config/config.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)

        self.num_classes = self.config["model"]["num_classes"]
        self.class_names = self.config["classes"]

    def validate_dataset(
        self,
        image_dir: str,
        label_dir: str,
        strict: bool = False,
    ) -> Dict:
        """
        Run all validation checks on a dataset.

        Args:
            image_dir: Directory containing images.
            label_dir: Directory containing YOLO .txt label files.
            strict: If True, raise exceptions on critical errors.

        Returns:
            Validation report dictionary.
        """
        image_dir = Path(image_dir)
        label_dir = Path(label_dir)

        report = {
            "total_images": 0,
            "total_labels": 0,
            "matched_pairs": 0,
            "orphaned_images": [],
            "orphaned_labels": [],
            "empty_labels": [],
            "invalid_boxes": [],
            "corrupt_images": [],
            "class_distribution": Counter(),
            "total_annotations": 0,
            "issues": [],
        }

        # Collect file stems
        image_files = {
            f.stem: f
            for f in image_dir.iterdir()
            if f.suffix.lower() in self.IMAGE_EXTENSIONS
        }
        label_files = {
            f.stem: f for f in label_dir.iterdir() if f.suffix == ".txt"
        }

        report["total_images"] = len(image_files)
        report["total_labels"] = len(label_files)

        # Check for orphans
        image_stems = set(image_files.keys())
        label_stems = set(label_files.keys())

        orphaned_images = image_stems - label_stems
        orphaned_labels = label_stems - image_stems
        matched = image_stems & label_stems

        report["orphaned_images"] = sorted(orphaned_images)
        report["orphaned_labels"] = sorted(orphaned_labels)
        report["matched_pairs"] = len(matched)

        if orphaned_images:
            report["issues"].append(
                f"{len(orphaned_images)} images have no matching label file"
            )
        if orphaned_labels:
            report["issues"].append(
                f"{len(orphaned_labels)} labels have no matching image file"
            )

        # Validate each matched pair
        for stem in sorted(matched):
            img_path = image_files[stem]
            lbl_path = label_files[stem]

            # Check image readability
            img = cv2.imread(str(img_path))
            if img is None:
                report["corrupt_images"].append(str(img_path))
                report["issues"].append(f"Corrupt/unreadable image: {img_path.name}")
                continue

            img_h, img_w = img.shape[:2]

            # Validate label file
            with open(lbl_path, "r") as f:
                lines = f.readlines()

            if not lines or all(line.strip() == "" for line in lines):
                report["empty_labels"].append(str(lbl_path))
                continue

            for line_num, line in enumerate(lines, 1):
                parts = line.strip().split()
                if not parts:
                    continue

                if len(parts) < 5:
                    report["invalid_boxes"].append(
                        f"{lbl_path.name}:{line_num} — insufficient fields ({len(parts)})"
                    )
                    continue

                try:
                    class_id = int(parts[0])
                    x_center = float(parts[1])
                    y_center = float(parts[2])
                    width = float(parts[3])
                    height = float(parts[4])
                except ValueError:
                    report["invalid_boxes"].append(
                        f"{lbl_path.name}:{line_num} — non-numeric values"
                    )
                    continue

                # Validate class ID
                if class_id < 0 or class_id >= self.num_classes:
                    report["invalid_boxes"].append(
                        f"{lbl_path.name}:{line_num} — invalid class_id={class_id}"
                    )
                    continue

                # Validate coordinates are normalized [0, 1]
                for val, name in [
                    (x_center, "x_center"),
                    (y_center, "y_center"),
                    (width, "width"),
                    (height, "height"),
                ]:
                    if val < 0 or val > 1:
                        report["invalid_boxes"].append(
                            f"{lbl_path.name}:{line_num} — {name}={val:.4f} "
                            f"out of [0,1] range"
                        )

                # Validate positive area
                if width <= 0 or height <= 0:
                    report["invalid_boxes"].append(
                        f"{lbl_path.name}:{line_num} — zero/negative area"
                    )
                    continue

                # Validate box doesn't extend beyond image
                x_min = x_center - width / 2
                y_min = y_center - height / 2
                x_max = x_center + width / 2
                y_max = y_center + height / 2

                if x_min < -0.01 or y_min < -0.01 or x_max > 1.01 or y_max > 1.01:
                    report["invalid_boxes"].append(
                        f"{lbl_path.name}:{line_num} — box extends beyond image bounds"
                    )

                report["class_distribution"][class_id] += 1
                report["total_annotations"] += 1

        # Check class imbalance
        if report["class_distribution"]:
            counts = list(report["class_distribution"].values())
            max_count = max(counts) if counts else 0
            min_count = min(counts) if counts else 0

            # Warn if imbalance ratio > 10:1
            if min_count > 0 and max_count / min_count > 10:
                report["issues"].append(
                    f"Severe class imbalance: max/min ratio = "
                    f"{max_count / min_count:.1f}:1"
                )

            # Warn about missing classes
            for class_id in range(self.num_classes):
                if class_id not in report["class_distribution"]:
                    name = self.class_names.get(class_id, f"class_{class_id}")
                    report["issues"].append(
                        f"Missing class {class_id} ({name}) — no annotations found"
                    )

        # Log summary
        self._log_report(report)

        if strict and report["issues"]:
            raise ValueError(
                f"Dataset validation found {len(report['issues'])} issues: "
                f"{'; '.join(report['issues'][:5])}"
            )

        return report

    def _log_report(self, report: Dict) -> None:
        """Pretty-print the validation report."""
        logger.info("=" * 60)
        logger.info("DATASET VALIDATION REPORT")
        logger.info("=" * 60)
        logger.info(f"  Total images:     {report['total_images']}")
        logger.info(f"  Total labels:     {report['total_labels']}")
        logger.info(f"  Matched pairs:    {report['matched_pairs']}")
        logger.info(f"  Total annotations:{report['total_annotations']}")
        logger.info(f"  Orphaned images:  {len(report['orphaned_images'])}")
        logger.info(f"  Orphaned labels:  {len(report['orphaned_labels'])}")
        logger.info(f"  Empty labels:     {len(report['empty_labels'])}")
        logger.info(f"  Invalid boxes:    {len(report['invalid_boxes'])}")
        logger.info(f"  Corrupt images:   {len(report['corrupt_images'])}")

        if report["class_distribution"]:
            logger.info("")
            logger.info("  Class Distribution:")
            for class_id in range(self.num_classes):
                count = report["class_distribution"].get(class_id, 0)
                name = self.class_names.get(class_id, f"class_{class_id}")
                bar = "█" * min(50, count // max(1, max(report["class_distribution"].values()) // 50))
                logger.info(f"    {class_id:>2}: {name:<25} {count:>6}  {bar}")

        if report["issues"]:
            logger.warning("")
            logger.warning(f"  ⚠ {len(report['issues'])} issues found:")
            for issue in report["issues"]:
                logger.warning(f"    • {issue}")
        else:
            logger.info("")
            logger.info("  ✓ No issues found!")

        logger.info("=" * 60)

    def fix_common_issues(
        self,
        image_dir: str,
        label_dir: str,
        remove_orphans: bool = False,
        clamp_boxes: bool = True,
    ) -> Dict:
        """
        Automatically fix common dataset issues.

        Args:
            image_dir: Directory containing images.
            label_dir: Directory containing YOLO label files.
            remove_orphans: If True, delete orphaned files.
            clamp_boxes: If True, clamp out-of-bound boxes to [0, 1].

        Returns:
            Summary of fixes applied.
        """
        fixes = {"clamped_boxes": 0, "removed_orphans": 0, "fixed_labels": 0}

        label_dir = Path(label_dir)

        if clamp_boxes:
            for lbl_path in label_dir.glob("*.txt"):
                modified = False
                new_lines = []

                with open(lbl_path, "r") as f:
                    for line in f:
                        parts = line.strip().split()
                        if len(parts) < 5:
                            new_lines.append(line.strip())
                            continue

                        class_id = parts[0]
                        values = [float(x) for x in parts[1:5]]
                        clamped = [max(0.0, min(1.0, v)) for v in values]

                        if values != clamped:
                            modified = True
                            fixes["clamped_boxes"] += 1

                        new_lines.append(
                            f"{class_id} {clamped[0]:.6f} {clamped[1]:.6f} "
                            f"{clamped[2]:.6f} {clamped[3]:.6f}"
                        )

                if modified:
                    with open(lbl_path, "w") as f:
                        f.write("\n".join(new_lines) + "\n")
                    fixes["fixed_labels"] += 1

        logger.info(
            f"Fixes applied: {fixes['clamped_boxes']} boxes clamped, "
            f"{fixes['fixed_labels']} label files updated"
        )
        return fixes


if __name__ == "__main__":
    validator = DatasetValidator()
    print(f"Validating for {validator.num_classes} classes")
    print(f"Classes: {validator.class_names}")
