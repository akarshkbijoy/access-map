"""
AccessMap ML — Dataset Loader
==============================
Handles loading images and labels from various sources,
applying train/val/test splits, and generating the
YOLOv8-compatible dataset.yaml configuration file.
"""

import os
import random
import shutil
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import yaml
from loguru import logger


class DatasetLoader:
    """
    Load and organize image datasets for YOLOv8 training.
    
    Supports:
    - Loading from a flat directory of images + labels
    - Stratified train/val/test splitting
    - Generation of YOLOv8 dataset.yaml
    - Multiple dataset merging
    """

    # Class mapping for the AccessMap accessibility detection domain
    CLASS_NAMES = {
        0: "wheelchair",
        1: "wheelchair_ramp",
        2: "elevator",
        3: "lift",
        4: "stairs",
        5: "accessible_parking",
        6: "accessible_bathroom",
        7: "grab_bar",
        8: "doorway",
        9: "tactile_paving",
    }

    # Supported image extensions
    IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".webp", ".tiff"}

    def __init__(self, config_path: str = "config/config.yaml"):
        """
        Initialize the dataset loader with configuration.

        Args:
            config_path: Path to the YAML configuration file.
        """
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)

        self.split_ratio = self.config["training"]["split_ratio"]
        self.seed = self.config["training"].get("seed", 42)
        self.data_dir = Path(self.config["paths"]["data_dir"])
        self.raw_dir = Path(self.config["paths"]["raw_data"])
        self.processed_dir = Path(self.config["paths"]["processed_data"])

    def find_image_label_pairs(
        self, image_dir: str, label_dir: str
    ) -> List[Tuple[Path, Path]]:
        """
        Find matching image-label file pairs in directories.

        Args:
            image_dir: Directory containing images.
            label_dir: Directory containing YOLO-format label .txt files.

        Returns:
            List of (image_path, label_path) tuples.
        """
        image_dir = Path(image_dir)
        label_dir = Path(label_dir)
        pairs = []

        for img_path in sorted(image_dir.iterdir()):
            if img_path.suffix.lower() not in self.IMAGE_EXTENSIONS:
                continue

            # Look for matching label file (same stem, .txt extension)
            label_path = label_dir / f"{img_path.stem}.txt"
            if label_path.exists():
                pairs.append((img_path, label_path))
            else:
                logger.warning(f"No label found for image: {img_path.name}")

        logger.info(f"Found {len(pairs)} image-label pairs in {image_dir}")
        return pairs

    def get_class_distribution(
        self, pairs: List[Tuple[Path, Path]]
    ) -> Dict[int, int]:
        """
        Count the number of instances per class across all label files.

        Args:
            pairs: List of (image_path, label_path) tuples.

        Returns:
            Dictionary mapping class_id → instance count.
        """
        distribution = {i: 0 for i in range(self.config["model"]["num_classes"])}

        for _, label_path in pairs:
            with open(label_path, "r") as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        class_id = int(parts[0])
                        if class_id in distribution:
                            distribution[class_id] += 1

        return distribution

    def split_dataset(
        self,
        pairs: List[Tuple[Path, Path]],
        stratify: bool = True,
    ) -> Dict[str, List[Tuple[Path, Path]]]:
        """
        Split the dataset into train, validation, and test sets.

        Args:
            pairs: List of (image_path, label_path) tuples.
            stratify: If True, attempt stratified split by primary class.

        Returns:
            Dictionary with 'train', 'val', 'test' keys, each containing
            a list of (image_path, label_path) tuples.
        """
        random.seed(self.seed)

        if stratify:
            # Group by primary class (first annotation in each label file)
            class_groups: Dict[int, List[Tuple[Path, Path]]] = {}
            for img_path, label_path in pairs:
                with open(label_path, "r") as f:
                    first_line = f.readline().strip()
                    if first_line:
                        primary_class = int(first_line.split()[0])
                    else:
                        primary_class = -1  # Empty label
                class_groups.setdefault(primary_class, []).append(
                    (img_path, label_path)
                )

            train, val, test = [], [], []
            for class_id, group in class_groups.items():
                random.shuffle(group)
                n = len(group)
                n_train = int(n * self.split_ratio["train"])
                n_val = int(n * self.split_ratio["val"])

                train.extend(group[:n_train])
                val.extend(group[n_train : n_train + n_val])
                test.extend(group[n_train + n_val :])

            random.shuffle(train)
            random.shuffle(val)
            random.shuffle(test)
        else:
            shuffled = list(pairs)
            random.shuffle(shuffled)
            n = len(shuffled)
            n_train = int(n * self.split_ratio["train"])
            n_val = int(n * self.split_ratio["val"])

            train = shuffled[:n_train]
            val = shuffled[n_train : n_train + n_val]
            test = shuffled[n_train + n_val :]

        logger.info(
            f"Split: train={len(train)}, val={len(val)}, test={len(test)} "
            f"(total={len(pairs)})"
        )
        return {"train": train, "val": val, "test": test}

    def organize_split(
        self,
        splits: Dict[str, List[Tuple[Path, Path]]],
        output_dir: Optional[str] = None,
        copy: bool = True,
    ) -> Path:
        """
        Organize split data into the YOLOv8 directory structure:
            output_dir/
                images/train/  images/val/  images/test/
                labels/train/  labels/val/  labels/test/

        Args:
            splits: Output from split_dataset().
            output_dir: Root output directory. Defaults to self.processed_dir.
            copy: If True, copy files. If False, create symlinks.

        Returns:
            Path to the output directory.
        """
        output_dir = Path(output_dir) if output_dir else self.processed_dir

        for split_name, pairs in splits.items():
            img_dir = output_dir / "images" / split_name
            lbl_dir = output_dir / "labels" / split_name
            img_dir.mkdir(parents=True, exist_ok=True)
            lbl_dir.mkdir(parents=True, exist_ok=True)

            for img_path, label_path in pairs:
                dst_img = img_dir / img_path.name
                dst_lbl = lbl_dir / label_path.name

                if copy:
                    shutil.copy2(img_path, dst_img)
                    shutil.copy2(label_path, dst_lbl)
                else:
                    # Create symlinks (saves disk space)
                    if not dst_img.exists():
                        os.symlink(img_path.resolve(), dst_img)
                    if not dst_lbl.exists():
                        os.symlink(label_path.resolve(), dst_lbl)

            logger.info(
                f"Organized {len(pairs)} pairs into {split_name}/ "
                f"at {output_dir}"
            )

        return output_dir

    def generate_dataset_yaml(
        self,
        output_dir: Optional[str] = None,
        yaml_path: Optional[str] = None,
    ) -> str:
        """
        Generate the dataset.yaml file required by YOLOv8.

        Args:
            output_dir: Root data directory containing images/ and labels/.
            yaml_path: Path to save the YAML file.

        Returns:
            Path to the generated dataset.yaml file.
        """
        output_dir = Path(output_dir) if output_dir else self.processed_dir
        yaml_path = yaml_path or str(self.data_dir / "dataset.yaml")

        dataset_config = {
            "path": str(output_dir.resolve()),
            "train": "images/train",
            "val": "images/val",
            "test": "images/test",
            "nc": self.config["model"]["num_classes"],
            "names": self.CLASS_NAMES,
        }

        with open(yaml_path, "w") as f:
            yaml.dump(dataset_config, f, default_flow_style=False, sort_keys=False)

        logger.info(f"Generated dataset config at: {yaml_path}")
        return yaml_path

    def merge_datasets(
        self,
        source_dirs: List[Dict[str, str]],
        output_dir: Optional[str] = None,
        class_remap: Optional[Dict[str, Dict[int, int]]] = None,
    ) -> Path:
        """
        Merge multiple datasets into a single unified dataset.

        Each source directory is expected to contain 'images/' and 'labels/'
        subdirectories with YOLO-format annotations.

        Args:
            source_dirs: List of dicts with 'images' and 'labels' keys.
            output_dir: Output directory for merged data.
            class_remap: Optional per-source class ID remapping.
                         Keys are source indices, values are {old_id: new_id} dicts.

        Returns:
            Path to the merged output directory.
        """
        output_dir = Path(output_dir) if output_dir else self.processed_dir / "merged"
        merged_img_dir = output_dir / "images"
        merged_lbl_dir = output_dir / "labels"
        merged_img_dir.mkdir(parents=True, exist_ok=True)
        merged_lbl_dir.mkdir(parents=True, exist_ok=True)

        total_copied = 0

        for idx, source in enumerate(source_dirs):
            src_img_dir = Path(source["images"])
            src_lbl_dir = Path(source["labels"])
            remap = class_remap.get(str(idx), {}) if class_remap else {}

            for img_path in sorted(src_img_dir.iterdir()):
                if img_path.suffix.lower() not in self.IMAGE_EXTENSIONS:
                    continue

                label_path = src_lbl_dir / f"{img_path.stem}.txt"
                if not label_path.exists():
                    continue

                # Prefix with source index to avoid name collisions
                new_name = f"src{idx}_{img_path.name}"
                dst_img = merged_img_dir / new_name
                dst_lbl = merged_lbl_dir / f"src{idx}_{img_path.stem}.txt"

                shutil.copy2(img_path, dst_img)

                # Apply class remapping if needed
                if remap:
                    with open(label_path, "r") as f_in:
                        lines = f_in.readlines()
                    with open(dst_lbl, "w") as f_out:
                        for line in lines:
                            parts = line.strip().split()
                            if len(parts) >= 5:
                                old_class = int(parts[0])
                                new_class = remap.get(old_class, old_class)
                                parts[0] = str(new_class)
                                f_out.write(" ".join(parts) + "\n")
                else:
                    shutil.copy2(label_path, dst_lbl)

                total_copied += 1

        logger.info(
            f"Merged {len(source_dirs)} datasets → {total_copied} pairs "
            f"in {output_dir}"
        )
        return output_dir

    def load_and_prepare(
        self,
        image_dir: str,
        label_dir: str,
        stratify: bool = True,
    ) -> str:
        """
        Full pipeline: find pairs → split → organize → generate YAML.

        Args:
            image_dir: Directory containing images.
            label_dir: Directory containing YOLO-format labels.
            stratify: Whether to use stratified splitting.

        Returns:
            Path to the generated dataset.yaml file.
        """
        logger.info("=" * 60)
        logger.info("Starting dataset preparation pipeline")
        logger.info("=" * 60)

        # Step 1: Find pairs
        pairs = self.find_image_label_pairs(image_dir, label_dir)
        if not pairs:
            raise ValueError(
                f"No image-label pairs found in {image_dir} / {label_dir}"
            )

        # Step 2: Show class distribution
        dist = self.get_class_distribution(pairs)
        logger.info("Class distribution:")
        for class_id, count in dist.items():
            name = self.CLASS_NAMES.get(class_id, f"class_{class_id}")
            logger.info(f"  {class_id}: {name} = {count} instances")

        # Step 3: Split
        splits = self.split_dataset(pairs, stratify=stratify)

        # Step 4: Organize into YOLO directory structure
        self.organize_split(splits)

        # Step 5: Generate dataset.yaml
        yaml_path = self.generate_dataset_yaml()

        logger.info("=" * 60)
        logger.info(f"Dataset preparation complete! Config: {yaml_path}")
        logger.info("=" * 60)

        return yaml_path


if __name__ == "__main__":
    # Quick test — run directly to verify the loader works
    loader = DatasetLoader()
    print(f"Classes: {loader.CLASS_NAMES}")
    print(f"Split ratio: {loader.split_ratio}")
    print(f"Processed dir: {loader.processed_dir}")
