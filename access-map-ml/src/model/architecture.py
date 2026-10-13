"""
AccessMap ML — Model Architecture
====================================
YOLOv8 model configuration and initialization for
accessibility feature detection.
"""

from pathlib import Path
from typing import Optional

import yaml
from loguru import logger


class ModelBuilder:
    """
    Configure and build a YOLOv8 model for accessibility feature detection.

    Supports:
    - Loading pre-trained weights (COCO)
    - Custom class head configuration
    - Backbone freezing for transfer learning
    - Model info and summary
    """

    # Map of architecture name → pretrained weight file
    ARCHITECTURE_MAP = {
        "yolov8n": "yolov8n.pt",
        "yolov8s": "yolov8s.pt",
        "yolov8m": "yolov8m.pt",
        "yolov8l": "yolov8l.pt",
        "yolov8x": "yolov8x.pt",
    }

    def __init__(self, config_path: str = "config/config.yaml"):
        """
        Args:
            config_path: Path to the YAML configuration file.
        """
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)

        self.model_config = self.config["model"]
        self.training_config = self.config["training"]
        self.architecture = self.model_config["architecture"]
        self.num_classes = self.model_config["num_classes"]
        self.input_size = self.model_config["input_size"]

    def build(self, weights: Optional[str] = None):
        """
        Build and return a YOLOv8 model.

        Args:
            weights: Path to weights file. If None, uses config default.
                     Pass 'scratch' to initialize without pre-trained weights.

        Returns:
            An ultralytics.YOLO model instance.
        """
        from ultralytics import YOLO

        if weights == "scratch":
            # Build from YAML config (no pre-trained weights)
            model_yaml = f"{self.architecture}.yaml"
            model = YOLO(model_yaml)
            logger.info(
                f"Built {self.architecture} from scratch (no pre-trained weights)"
            )
        else:
            # Load pre-trained weights
            weight_file = weights or self.model_config.get(
                "weights", self.ARCHITECTURE_MAP.get(self.architecture)
            )
            model = YOLO(weight_file)
            logger.info(f"Loaded {self.architecture} with weights: {weight_file}")

        return model

    def build_from_checkpoint(self, checkpoint_path: str):
        """
        Load a model from a training checkpoint.

        Args:
            checkpoint_path: Path to the .pt checkpoint file.

        Returns:
            An ultralytics.YOLO model instance.
        """
        from ultralytics import YOLO

        if not Path(checkpoint_path).exists():
            raise FileNotFoundError(f"Checkpoint not found: {checkpoint_path}")

        model = YOLO(checkpoint_path)
        logger.info(f"Loaded model from checkpoint: {checkpoint_path}")
        return model

    def get_model_info(self, model=None) -> dict:
        """
        Get detailed model information.

        Args:
            model: YOLO model instance. If None, builds a new one.

        Returns:
            Dictionary with model details.
        """
        if model is None:
            model = self.build()

        # Get parameter count
        total_params = sum(p.numel() for p in model.model.parameters())
        trainable_params = sum(
            p.numel() for p in model.model.parameters() if p.requires_grad
        )

        info = {
            "architecture": self.architecture,
            "num_classes": self.num_classes,
            "input_size": self.input_size,
            "total_parameters": total_params,
            "trainable_parameters": trainable_params,
            "total_parameters_M": f"{total_params / 1e6:.1f}M",
            "model_type": model.type,
        }

        logger.info(f"Model: {self.architecture}")
        logger.info(f"  Parameters: {info['total_parameters_M']}")
        logger.info(f"  Trainable:  {trainable_params / 1e6:.1f}M")
        logger.info(f"  Input size: {self.input_size}x{self.input_size}")

        return info

    def freeze_backbone(self, model, num_layers: Optional[int] = None):
        """
        Freeze backbone layers for transfer learning.

        When fine-tuning on a small dataset, freezing early layers
        prevents the pre-trained feature extractors from being
        overwritten, improving convergence.

        Args:
            model: YOLO model instance.
            num_layers: Number of layers to freeze. Defaults to config value.

        Returns:
            The model with frozen layers.
        """
        if num_layers is None:
            num_layers = self.training_config.get("freeze_backbone", 10)

        frozen = 0
        for i, (name, param) in enumerate(model.model.named_parameters()):
            if i < num_layers:
                param.requires_grad = False
                frozen += 1

        logger.info(
            f"Frozen {frozen} parameters in the first {num_layers} layers"
        )
        return model

    def get_recommended_batch_size(self, device: str = "auto") -> int:
        """
        Recommend batch size based on available GPU memory.

        Args:
            device: Device string ('auto', 'cpu', 'cuda:0').

        Returns:
            Recommended batch size.
        """
        import torch

        if device == "auto":
            device = "cuda" if torch.cuda.is_available() else "cpu"

        if "cuda" in device:
            try:
                gpu_mem = torch.cuda.get_device_properties(0).total_mem / 1e9
                if gpu_mem >= 16:
                    return 32
                elif gpu_mem >= 8:
                    return 16
                elif gpu_mem >= 4:
                    return 8
                else:
                    return 4
            except Exception:
                return 8
        else:
            return 4  # CPU training — keep batch small

    def validate_config(self) -> bool:
        """
        Validate the model configuration.

        Returns:
            True if configuration is valid.
        """
        valid = True

        if self.architecture not in self.ARCHITECTURE_MAP:
            logger.error(
                f"Unknown architecture: {self.architecture}. "
                f"Valid options: {list(self.ARCHITECTURE_MAP.keys())}"
            )
            valid = False

        if self.num_classes < 1:
            logger.error(f"Invalid num_classes: {self.num_classes}")
            valid = False

        if self.input_size not in [320, 416, 480, 640, 1280]:
            logger.warning(
                f"Unusual input_size: {self.input_size}. "
                f"Common values: 320, 416, 640, 1280"
            )

        return valid


if __name__ == "__main__":
    builder = ModelBuilder()
    builder.validate_config()
    print(f"Architecture: {builder.architecture}")
    print(f"Classes: {builder.num_classes}")
    print(f"Input size: {builder.input_size}")
