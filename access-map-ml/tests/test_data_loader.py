"""
AccessMap ML — Data Loader Tests
"""

import os
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np
import pytest

sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from src.data.loader import DatasetLoader
from src.data.converter import AnnotationConverter
from src.data.validator import DatasetValidator


@pytest.fixture
def temp_dataset():
    """Create a temporary dataset for testing."""
    with tempfile.TemporaryDirectory() as tmpdir:
        img_dir = Path(tmpdir) / "images"
        lbl_dir = Path(tmpdir) / "labels"
        img_dir.mkdir()
        lbl_dir.mkdir()

        # Create 20 sample image-label pairs
        for i in range(20):
            # Create a random image
            img = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
            cv2.imwrite(str(img_dir / f"img_{i:03d}.jpg"), img)

            # Create a label with random annotations
            class_id = i % 10  # Cycle through classes
            with open(lbl_dir / f"img_{i:03d}.txt", "w") as f:
                f.write(f"{class_id} 0.5 0.5 0.3 0.3\n")

        yield tmpdir, str(img_dir), str(lbl_dir)


@pytest.fixture
def config_path():
    """Return the path to the test config."""
    return "config/config.yaml"


class TestDatasetLoader:
    """Tests for the DatasetLoader class."""

    def test_find_image_label_pairs(self, temp_dataset, config_path):
        tmpdir, img_dir, lbl_dir = temp_dataset
        loader = DatasetLoader(config_path)
        pairs = loader.find_image_label_pairs(img_dir, lbl_dir)
        assert len(pairs) == 20

    def test_find_pairs_handles_orphans(self, temp_dataset, config_path):
        tmpdir, img_dir, lbl_dir = temp_dataset

        # Add an image without a label
        extra_img = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
        cv2.imwrite(str(Path(img_dir) / "orphan.jpg"), extra_img)

        loader = DatasetLoader(config_path)
        pairs = loader.find_image_label_pairs(img_dir, lbl_dir)
        assert len(pairs) == 20  # Orphan should not be included

    def test_split_dataset(self, temp_dataset, config_path):
        tmpdir, img_dir, lbl_dir = temp_dataset
        loader = DatasetLoader(config_path)
        pairs = loader.find_image_label_pairs(img_dir, lbl_dir)
        splits = loader.split_dataset(pairs, stratify=False)

        assert "train" in splits
        assert "val" in splits
        assert "test" in splits
        assert len(splits["train"]) + len(splits["val"]) + len(splits["test"]) == 20

    def test_get_class_distribution(self, temp_dataset, config_path):
        tmpdir, img_dir, lbl_dir = temp_dataset
        loader = DatasetLoader(config_path)
        pairs = loader.find_image_label_pairs(img_dir, lbl_dir)
        dist = loader.get_class_distribution(pairs)

        assert isinstance(dist, dict)
        assert sum(dist.values()) == 20  # 20 total annotations


class TestAnnotationConverter:
    """Tests for the AnnotationConverter class."""

    def test_class_remap(self):
        converter = AnnotationConverter(class_remap={0: 4, 1: 7})
        assert converter._remap_class(0) == 4
        assert converter._remap_class(1) == 7
        assert converter._remap_class(2) == 2  # Unmapped = passthrough

    def test_coco_to_yolo(self):
        import json
        with tempfile.TemporaryDirectory() as tmpdir:
            # Create minimal COCO JSON
            coco = {
                "images": [
                    {"id": 1, "file_name": "test.jpg", "width": 640, "height": 480}
                ],
                "annotations": [
                    {
                        "id": 1,
                        "image_id": 1,
                        "category_id": 0,
                        "bbox": [100, 100, 200, 150],  # x, y, w, h
                    }
                ],
                "categories": [{"id": 0, "name": "stairs"}],
            }

            coco_path = Path(tmpdir) / "annotations.json"
            with open(coco_path, "w") as f:
                json.dump(coco, f)

            output_dir = Path(tmpdir) / "labels"
            converter = AnnotationConverter()
            count = converter.coco_to_yolo(str(coco_path), str(output_dir))

            assert count == 1
            assert (output_dir / "test.txt").exists()

            # Verify YOLO format
            with open(output_dir / "test.txt") as f:
                line = f.readline().strip().split()
                assert len(line) == 5
                assert float(line[1]) > 0 and float(line[1]) < 1  # Normalized


class TestDatasetValidator:
    """Tests for the DatasetValidator class."""

    def test_validate_good_dataset(self, temp_dataset, config_path):
        tmpdir, img_dir, lbl_dir = temp_dataset
        validator = DatasetValidator(config_path)
        report = validator.validate_dataset(img_dir, lbl_dir)

        assert report["matched_pairs"] == 20
        assert len(report["orphaned_images"]) == 0
        assert len(report["invalid_boxes"]) == 0

    def test_validate_detects_orphans(self, temp_dataset, config_path):
        tmpdir, img_dir, lbl_dir = temp_dataset

        # Add orphan image
        extra_img = np.random.randint(0, 255, (640, 640, 3), dtype=np.uint8)
        cv2.imwrite(str(Path(img_dir) / "orphan.jpg"), extra_img)

        validator = DatasetValidator(config_path)
        report = validator.validate_dataset(img_dir, lbl_dir)

        assert "orphan" in report["orphaned_images"]

    def test_validate_detects_invalid_boxes(self, temp_dataset, config_path):
        tmpdir, img_dir, lbl_dir = temp_dataset

        # Write an invalid label (coordinates > 1)
        with open(Path(lbl_dir) / "img_000.txt", "w") as f:
            f.write("0 1.5 0.5 0.3 0.3\n")  # x_center > 1 = invalid

        validator = DatasetValidator(config_path)
        report = validator.validate_dataset(img_dir, lbl_dir)

        assert len(report["invalid_boxes"]) > 0
