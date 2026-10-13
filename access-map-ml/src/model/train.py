"""
AccessMap ML — Training Pipeline
===================================
Complete training loop using the Ultralytics YOLOv8 API
with callbacks, logging, and checkpoint management.
"""

import os
import time
from datetime import datetime
from pathlib import Path
from typing import Any, Dict, Optional

import yaml
from loguru import logger

from .architecture import ModelBuilder


class Trainer:
    """
    Train a YOLOv8 model for accessibility feature detection.

    Features:
    - Full Ultralytics training API integration
    - Configurable hyperparameters from YAML
    - Automatic checkpoint saving (best + last)
    - TensorBoard logging
    - Early stopping
    - Resume from checkpoint
    """

    def __init__(self, config_path: str = "config/config.yaml"):
        """
        Args:
            config_path: Path to the YAML configuration file.
        """
        self.config_path = config_path

        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)

        self.model_config = self.config["model"]
        self.train_config = self.config["training"]
        self.aug_config = self.config["augmentation"]
        self.paths = self.config["paths"]

        # Create output directories
        self.runs_dir = Path(self.paths["runs_dir"])
        self.models_dir = Path(self.paths["models_dir"])
        self.runs_dir.mkdir(parents=True, exist_ok=True)
        self.models_dir.mkdir(parents=True, exist_ok=True)

    def train(
        self,
        dataset_yaml: str = "data/dataset.yaml",
        model_weights: Optional[str] = None,
        resume: bool = False,
        experiment_name: Optional[str] = None,
        **overrides,
    ) -> Any:
        """
        Run the full training pipeline.

        Args:
            dataset_yaml: Path to the YOLOv8 dataset.yaml file.
            model_weights: Path to initial weights. None = use config default.
            resume: If True, resume training from the last checkpoint.
            experiment_name: Custom name for this training run.
            **overrides: Additional training parameter overrides.

        Returns:
            Training results from ultralytics.
        """
        # Generate experiment name
        if experiment_name is None:
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            experiment_name = f"accessmap_{self.model_config['architecture']}_{timestamp}"

        logger.info("=" * 60)
        logger.info(f"TRAINING: {experiment_name}")
        logger.info("=" * 60)

        # Build model
        builder = ModelBuilder(self.config_path)

        if resume:
            # Resume from last checkpoint
            last_checkpoint = self.runs_dir / "detect" / "train" / "weights" / "last.pt"
            if last_checkpoint.exists():
                model = builder.build_from_checkpoint(str(last_checkpoint))
                logger.info(f"Resuming from: {last_checkpoint}")
            else:
                logger.warning(
                    "No checkpoint found for resume. Starting fresh training."
                )
                model = builder.build(model_weights)
        else:
            model = builder.build(model_weights)

        # Prepare training arguments
        train_args = self._build_train_args(
            dataset_yaml, experiment_name, **overrides
        )

        # Log configuration
        logger.info("Training configuration:")
        for key, value in train_args.items():
            logger.info(f"  {key}: {value}")

        # Start training
        start_time = time.time()
        results = model.train(**train_args)
        duration = time.time() - start_time

        logger.info("=" * 60)
        logger.info(f"Training complete in {duration / 60:.1f} minutes")
        logger.info("=" * 60)

        # Copy best model to models directory
        self._save_best_model(results, experiment_name)

        return results

    def _build_train_args(
        self,
        dataset_yaml: str,
        experiment_name: str,
        **overrides,
    ) -> Dict:
        """
        Build the training arguments dictionary from config.

        Args:
            dataset_yaml: Path to dataset YAML file.
            experiment_name: Name for this experiment.
            **overrides: Override specific parameters.

        Returns:
            Dictionary of training arguments for model.train().
        """
        args = {
            # Dataset
            "data": dataset_yaml,
            "imgsz": self.model_config["input_size"],

            # Training schedule
            "epochs": self.train_config["epochs"],
            "batch": self.train_config["batch_size"],
            "patience": self.train_config["patience"],
            "warmup_epochs": self.train_config.get("warmup_epochs", 3),

            # Optimizer
            "optimizer": self.train_config["optimizer"],
            "lr0": self.train_config["learning_rate"],
            "weight_decay": self.train_config["weight_decay"],
            "cos_lr": self.train_config.get("cos_lr", True),
            "label_smoothing": self.train_config.get("label_smoothing", 0.0),

            # Backbone freezing
            "freeze": self.train_config.get("freeze_backbone", None),

            # Augmentation (built-in Ultralytics)
            "flipud": self.aug_config.get("vertical_flip", 0.0),
            "fliplr": self.aug_config.get("horizontal_flip", 0.5),
            "degrees": self.aug_config.get("rotation_range", 0.0),
            "translate": self.aug_config.get("translate", 0.1),
            "scale": (self.aug_config.get("scale_range", [0.5, 1.5])[1] - 1),
            "shear": self.aug_config.get("shear", 0.0),
            "perspective": self.aug_config.get("perspective", 0.0),
            "mosaic": self.aug_config.get("mosaic", 1.0),
            "mixup": self.aug_config.get("mixup", 0.0),
            "copy_paste": self.aug_config.get("copy_paste", 0.0),
            "hsv_h": self.aug_config.get("hsv_h", 0.015),
            "hsv_s": self.aug_config.get("hsv_s", 0.7),
            "hsv_v": self.aug_config.get("hsv_v", 0.4),

            # Output
            "project": str(self.runs_dir),
            "name": experiment_name,
            "exist_ok": True,

            # Logging
            "verbose": True,
            "plots": True,   # Generate training plots

            # Seed
            "seed": self.train_config.get("seed", 42),

            # Device (auto-detect GPU/CPU)
            "device": self.config.get("inference", {}).get("device", "auto"),

            # Save
            "save": True,
            "save_period": -1,  # Save only best + last

            # Workers
            "workers": 8,
        }

        # Apply any overrides
        args.update(overrides)

        return args

    def _save_best_model(self, results: Any, experiment_name: str) -> None:
        """
        Copy the best model checkpoint to the models directory.
        """
        import shutil

        best_path = self.runs_dir / experiment_name / "weights" / "best.pt"

        if best_path.exists():
            dest = self.models_dir / f"{experiment_name}_best.pt"
            shutil.copy2(best_path, dest)
            logger.info(f"Best model saved to: {dest}")

            # Also save as 'best.pt' for easy reference
            latest_best = self.models_dir / "best.pt"
            shutil.copy2(best_path, latest_best)
            logger.info(f"Latest best model: {latest_best}")
        else:
            logger.warning(f"Best weights not found at: {best_path}")

    def validate(
        self,
        model_path: str = "models/best.pt",
        dataset_yaml: str = "data/dataset.yaml",
        split: str = "test",
    ) -> Any:
        """
        Run validation/evaluation on the test set.

        Args:
            model_path: Path to the trained model weights.
            dataset_yaml: Path to the dataset YAML file.
            split: Which split to evaluate ('val' or 'test').

        Returns:
            Validation results.
        """
        from ultralytics import YOLO

        model = YOLO(model_path)

        logger.info(f"Validating {model_path} on {split} split")

        results = model.val(
            data=dataset_yaml,
            split=split,
            imgsz=self.model_config["input_size"],
            batch=self.train_config["batch_size"],
            plots=True,
            verbose=True,
        )

        return results

    def hyperparameter_search(
        self,
        dataset_yaml: str = "data/dataset.yaml",
        iterations: int = 10,
    ) -> Dict:
        """
        Run automated hyperparameter tuning using Ultralytics Ray Tune.

        Args:
            dataset_yaml: Path to the dataset YAML file.
            iterations: Number of tuning iterations.

        Returns:
            Best hyperparameters found.
        """
        builder = ModelBuilder(self.config_path)
        model = builder.build()

        logger.info(f"Starting hyperparameter search ({iterations} iterations)")

        results = model.tune(
            data=dataset_yaml,
            epochs=30,  # Shorter epochs for tuning
            iterations=iterations,
            imgsz=self.model_config["input_size"],
            plots=True,
        )

        return results


if __name__ == "__main__":
    trainer = Trainer()
    print(f"Architecture: {trainer.model_config['architecture']}")
    print(f"Epochs: {trainer.train_config['epochs']}")
    print(f"Batch size: {trainer.train_config['batch_size']}")
    print(f"Learning rate: {trainer.train_config['learning_rate']}")
