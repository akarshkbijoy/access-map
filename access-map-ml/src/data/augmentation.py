"""
AccessMap ML — Data Augmentation Pipeline
===========================================
Configurable augmentation pipelines using Albumentations
for robust accessibility feature detection across varying
lighting conditions, angles, and environments.
"""

from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

import cv2
import numpy as np
import yaml
from loguru import logger

try:
    import albumentations as A
    from albumentations.core.composition import Compose

    ALBUMENTATIONS_AVAILABLE = True
except ImportError:
    ALBUMENTATIONS_AVAILABLE = False
    logger.warning(
        "Albumentations not installed. Install with: pip install albumentations"
    )


class AugmentationPipeline:
    """
    Build and apply augmentation pipelines for accessibility image datasets.

    Provides:
    - Indoor augmentation profile (focus on lighting variations)
    - Outdoor augmentation profile (weather, shadows, scale)
    - Custom pipeline builder from config
    - Offline augmentation for dataset expansion
    """

    def __init__(self, config_path: str = "config/config.yaml"):
        """
        Args:
            config_path: Path to the configuration YAML file.
        """
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)

        self.aug_config = self.config.get("augmentation", {})
        self.alb_config = self.aug_config.get("albumentations", {})

    def build_training_pipeline(self) -> Optional[Any]:
        """
        Build the primary training augmentation pipeline from config.

        Returns:
            An Albumentations Compose pipeline, or None if unavailable.
        """
        if not ALBUMENTATIONS_AVAILABLE:
            logger.warning("Albumentations unavailable; no augmentation applied.")
            return None

        transforms = []

        # --- Geometric Transforms ---
        if self.aug_config.get("horizontal_flip", 0) > 0:
            transforms.append(
                A.HorizontalFlip(p=self.aug_config["horizontal_flip"])
            )

        if self.aug_config.get("vertical_flip", 0) > 0:
            transforms.append(
                A.VerticalFlip(p=self.aug_config["vertical_flip"])
            )

        rotation = self.aug_config.get("rotation_range", 0)
        if rotation > 0:
            transforms.append(
                A.Rotate(limit=rotation, border_mode=cv2.BORDER_CONSTANT, p=0.5)
            )

        scale = self.aug_config.get("scale_range", [1.0, 1.0])
        if scale != [1.0, 1.0]:
            transforms.append(
                A.RandomScale(scale_limit=(scale[0] - 1, scale[1] - 1), p=0.5)
            )

        translate = self.aug_config.get("translate", 0)
        if translate > 0:
            transforms.append(
                A.ShiftScaleRotate(
                    shift_limit=translate,
                    scale_limit=0,
                    rotate_limit=0,
                    border_mode=cv2.BORDER_CONSTANT,
                    p=0.3,
                )
            )

        perspective = self.aug_config.get("perspective", 0)
        if perspective > 0:
            transforms.append(
                A.Perspective(scale=(0, perspective * 200), p=0.2)
            )

        # --- Photometric Transforms ---
        brightness = self.aug_config.get("brightness_range", [1.0, 1.0])
        contrast = self.aug_config.get("contrast_range", [1.0, 1.0])
        if brightness != [1.0, 1.0] or contrast != [1.0, 1.0]:
            transforms.append(
                A.RandomBrightnessContrast(
                    brightness_limit=(brightness[0] - 1, brightness[1] - 1),
                    contrast_limit=(contrast[0] - 1, contrast[1] - 1),
                    p=0.5,
                )
            )

        hsv_h = self.aug_config.get("hsv_h", 0)
        hsv_s = self.aug_config.get("hsv_s", 0)
        hsv_v = self.aug_config.get("hsv_v", 0)
        if any([hsv_h, hsv_s, hsv_v]):
            transforms.append(
                A.HueSaturationValue(
                    hue_shift_limit=int(hsv_h * 180),
                    sat_shift_limit=int(hsv_s * 255),
                    val_shift_limit=int(hsv_v * 255),
                    p=0.5,
                )
            )

        # --- Albumentations Extras ---
        if self.alb_config.get("enabled", False):
            if self.alb_config.get("clahe", 0) > 0:
                transforms.append(
                    A.CLAHE(clip_limit=4.0, p=self.alb_config["clahe"])
                )

            if self.alb_config.get("blur", 0) > 0:
                transforms.append(
                    A.GaussianBlur(
                        blur_limit=(3, 7), p=self.alb_config["blur"]
                    )
                )

            if self.alb_config.get("median_blur", 0) > 0:
                transforms.append(
                    A.MedianBlur(
                        blur_limit=5, p=self.alb_config["median_blur"]
                    )
                )

            if self.alb_config.get("grayscale", 0) > 0:
                transforms.append(
                    A.ToGray(p=self.alb_config["grayscale"])
                )

            # Weather simulation for outdoor robustness
            if self.alb_config.get("rain", 0) > 0:
                transforms.append(
                    A.RandomRain(
                        slant_lower=-10,
                        slant_upper=10,
                        drop_length=20,
                        drop_width=1,
                        drop_color=(200, 200, 200),
                        blur_value=3,
                        brightness_coefficient=0.7,
                        rain_type=None,
                        p=self.alb_config["rain"],
                    )
                )

            if self.alb_config.get("fog", 0) > 0:
                transforms.append(
                    A.RandomFog(
                        fog_coef_lower=0.1,
                        fog_coef_upper=0.3,
                        alpha_coef=0.1,
                        p=self.alb_config["fog"],
                    )
                )

        pipeline = A.Compose(
            transforms,
            bbox_params=A.BboxParams(
                format="yolo",           # YOLO format: x_center, y_center, w, h (normalized)
                label_fields=["class_labels"],
                min_visibility=0.3,      # Drop boxes that become <30% visible
            ),
        )

        logger.info(
            f"Built training augmentation pipeline with {len(transforms)} transforms"
        )
        return pipeline

    def build_indoor_pipeline(self) -> Optional[Any]:
        """
        Build augmentation pipeline optimized for indoor scenes.
        Focus: lighting variations, subtle perspective, reflections.
        """
        if not ALBUMENTATIONS_AVAILABLE:
            return None

        transforms = [
            A.HorizontalFlip(p=0.5),
            A.RandomBrightnessContrast(
                brightness_limit=(-0.3, 0.3),
                contrast_limit=(-0.2, 0.2),
                p=0.6,
            ),
            A.CLAHE(clip_limit=4.0, p=0.2),
            A.HueSaturationValue(
                hue_shift_limit=10,
                sat_shift_limit=30,
                val_shift_limit=30,
                p=0.4,
            ),
            A.Rotate(limit=10, border_mode=cv2.BORDER_CONSTANT, p=0.3),
            A.Perspective(scale=(0, 0.05), p=0.2),
            A.GaussianBlur(blur_limit=(3, 5), p=0.1),
            A.GaussNoise(p=0.1),
        ]

        return A.Compose(
            transforms,
            bbox_params=A.BboxParams(
                format="yolo",
                label_fields=["class_labels"],
                min_visibility=0.3,
            ),
        )

    def build_outdoor_pipeline(self) -> Optional[Any]:
        """
        Build augmentation pipeline optimized for outdoor scenes.
        Focus: weather, shadows, scale variation, sun glare.
        """
        if not ALBUMENTATIONS_AVAILABLE:
            return None

        transforms = [
            A.HorizontalFlip(p=0.5),
            A.RandomBrightnessContrast(
                brightness_limit=(-0.4, 0.4),
                contrast_limit=(-0.3, 0.3),
                p=0.6,
            ),
            A.RandomScale(scale_limit=(-0.3, 0.5), p=0.4),
            A.Rotate(limit=15, border_mode=cv2.BORDER_CONSTANT, p=0.4),
            A.RandomSunFlare(
                flare_roi=(0, 0, 1, 0.5),
                src_radius=200,
                p=0.05,
            ),
            A.RandomShadow(
                shadow_roi=(0, 0.5, 1, 1),
                num_shadows_limit=(1, 3),
                shadow_dimension=5,
                p=0.15,
            ),
            A.RandomRain(
                slant_lower=-10,
                slant_upper=10,
                drop_length=20,
                drop_width=1,
                blur_value=3,
                brightness_coefficient=0.7,
                p=0.05,
            ),
            A.RandomFog(
                fog_coef_lower=0.1,
                fog_coef_upper=0.3,
                alpha_coef=0.1,
                p=0.05,
            ),
        ]

        return A.Compose(
            transforms,
            bbox_params=A.BboxParams(
                format="yolo",
                label_fields=["class_labels"],
                min_visibility=0.3,
            ),
        )

    def augment_image(
        self,
        image: np.ndarray,
        bboxes: List[List[float]],
        class_labels: List[int],
        pipeline: Optional[Any] = None,
    ) -> Tuple[np.ndarray, List[List[float]], List[int]]:
        """
        Apply augmentation to a single image with bounding boxes.

        Args:
            image: BGR numpy array (H, W, C).
            bboxes: List of YOLO-format boxes [x_center, y_center, w, h].
            class_labels: List of class IDs matching each bbox.
            pipeline: Albumentations pipeline. Uses training pipeline if None.

        Returns:
            Tuple of (augmented_image, augmented_bboxes, augmented_labels).
        """
        if pipeline is None:
            pipeline = self.build_training_pipeline()

        if pipeline is None:
            return image, bboxes, class_labels

        result = pipeline(
            image=image,
            bboxes=bboxes,
            class_labels=class_labels,
        )

        return (
            result["image"],
            result["bboxes"],
            result["class_labels"],
        )

    def expand_dataset(
        self,
        image_dir: str,
        label_dir: str,
        output_image_dir: str,
        output_label_dir: str,
        num_augmentations: int = 3,
        pipeline: Optional[Any] = None,
    ) -> int:
        """
        Offline dataset expansion: generate augmented copies of all images.

        Args:
            image_dir: Source image directory.
            label_dir: Source label directory.
            output_image_dir: Output directory for augmented images.
            output_label_dir: Output directory for augmented labels.
            num_augmentations: Number of augmented copies per image.
            pipeline: Augmentation pipeline to use.

        Returns:
            Number of augmented samples generated.
        """
        if pipeline is None:
            pipeline = self.build_training_pipeline()

        if pipeline is None:
            logger.error("No augmentation pipeline available. Aborting expansion.")
            return 0

        image_dir = Path(image_dir)
        label_dir = Path(label_dir)
        out_img = Path(output_image_dir)
        out_lbl = Path(output_label_dir)
        out_img.mkdir(parents=True, exist_ok=True)
        out_lbl.mkdir(parents=True, exist_ok=True)

        generated = 0
        image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

        for img_path in sorted(image_dir.iterdir()):
            if img_path.suffix.lower() not in image_extensions:
                continue

            lbl_path = label_dir / f"{img_path.stem}.txt"
            if not lbl_path.exists():
                continue

            # Read image
            image = cv2.imread(str(img_path))
            if image is None:
                continue

            # Read labels
            bboxes = []
            class_labels = []
            with open(lbl_path, "r") as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) >= 5:
                        class_labels.append(int(parts[0]))
                        bboxes.append([float(x) for x in parts[1:5]])

            if not bboxes:
                continue

            # Generate augmented copies
            for i in range(num_augmentations):
                try:
                    aug_img, aug_bboxes, aug_labels = self.augment_image(
                        image, bboxes, class_labels, pipeline
                    )

                    # Only save if we still have at least one box
                    if not aug_bboxes:
                        continue

                    aug_name = f"{img_path.stem}_aug{i}{img_path.suffix}"
                    cv2.imwrite(str(out_img / aug_name), aug_img)

                    lbl_name = f"{img_path.stem}_aug{i}.txt"
                    with open(out_lbl / lbl_name, "w") as f:
                        for box, cls in zip(aug_bboxes, aug_labels):
                            f.write(
                                f"{cls} {box[0]:.6f} {box[1]:.6f} "
                                f"{box[2]:.6f} {box[3]:.6f}\n"
                            )

                    generated += 1
                except Exception as e:
                    logger.debug(
                        f"Augmentation failed for {img_path.name} (copy {i}): {e}"
                    )

        logger.info(f"Dataset expansion: generated {generated} augmented samples")
        return generated


if __name__ == "__main__":
    aug = AugmentationPipeline()
    pipeline = aug.build_training_pipeline()
    if pipeline:
        print(f"Pipeline built with {len(pipeline.transforms)} transforms")
    else:
        print("Albumentations not available")
