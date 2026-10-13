"""
AccessMap ML — Confusion Matrix Visualization
================================================
Generate and visualize confusion matrices for
accessibility feature detection evaluation.
"""

from pathlib import Path
from typing import Dict, List, Optional

import numpy as np
import yaml
from loguru import logger


class ConfusionMatrixVisualizer:
    """
    Generate confusion matrix visualizations for object detection.

    Features:
    - Normalized and raw confusion matrices
    - Per-class heatmaps
    - Publication-quality PNG output
    """

    def __init__(self, config_path: str = "config/config.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)

        self.class_names = list(self.config["classes"].values())
        self.num_classes = self.config["model"]["num_classes"]

    def generate_from_results(
        self,
        results,
        output_path: str = "confusion_matrix.png",
        normalized: bool = True,
        figsize: tuple = (12, 10),
    ) -> str:
        """
        Generate a confusion matrix from Ultralytics validation results.

        The Ultralytics validator automatically generates confusion matrices
        in the run directory. This method creates a customized version.

        Args:
            results: Ultralytics validation results (from model.val()).
            output_path: Path to save the confusion matrix image.
            normalized: If True, normalize the matrix.
            figsize: Figure size (width, height) in inches.

        Returns:
            Path to the saved image file.
        """
        import matplotlib.pyplot as plt
        import seaborn as sns

        # Extract confusion matrix from results
        if hasattr(results, "confusion_matrix"):
            cm = results.confusion_matrix
            if hasattr(cm, "matrix"):
                matrix = cm.matrix.copy()
            else:
                logger.warning("Confusion matrix data not available in results")
                return ""
        else:
            logger.warning("No confusion matrix in results; run model.val() first")
            return ""

        # Normalize if requested
        if normalized:
            row_sums = matrix.sum(axis=1, keepdims=True)
            row_sums[row_sums == 0] = 1  # Avoid division by zero
            matrix = matrix / row_sums

        # Create figure
        fig, ax = plt.subplots(figsize=figsize)

        # Create labels (include 'background' class if matrix is larger)
        labels = self.class_names.copy()
        if matrix.shape[0] > len(labels):
            labels.append("background")

        # Trim labels/matrix to match
        n = min(len(labels), matrix.shape[0])
        matrix = matrix[:n, :n]
        labels = labels[:n]

        # Plot heatmap
        fmt = ".2f" if normalized else "g"
        sns.heatmap(
            matrix,
            annot=True,
            fmt=fmt,
            cmap="Blues",
            xticklabels=labels,
            yticklabels=labels,
            square=True,
            ax=ax,
            vmin=0,
            vmax=1.0 if normalized else None,
            linewidths=0.5,
            linecolor="gray",
            cbar_kws={"shrink": 0.8},
        )

        ax.set_xlabel("Predicted", fontsize=12, fontweight="bold")
        ax.set_ylabel("True", fontsize=12, fontweight="bold")
        title = "Confusion Matrix"
        if normalized:
            title += " (Normalized)"
        ax.set_title(title, fontsize=14, fontweight="bold", pad=20)

        # Rotate tick labels
        plt.xticks(rotation=45, ha="right", fontsize=9)
        plt.yticks(rotation=0, fontsize=9)

        plt.tight_layout()
        plt.savefig(output_path, dpi=150, bbox_inches="tight")
        plt.close()

        logger.info(f"Confusion matrix saved to: {output_path}")
        return output_path

    def generate_from_predictions(
        self,
        true_labels: List[int],
        pred_labels: List[int],
        output_path: str = "confusion_matrix.png",
        normalized: bool = True,
        figsize: tuple = (12, 10),
    ) -> str:
        """
        Generate confusion matrix from raw prediction lists.

        Args:
            true_labels: List of ground truth class IDs.
            pred_labels: List of predicted class IDs.
            output_path: Path to save the image.
            normalized: If True, normalize the matrix.
            figsize: Figure size.

        Returns:
            Path to the saved image.
        """
        import matplotlib.pyplot as plt
        import seaborn as sns
        from sklearn.metrics import confusion_matrix

        cm = confusion_matrix(
            true_labels,
            pred_labels,
            labels=list(range(self.num_classes)),
        )

        if normalized:
            row_sums = cm.sum(axis=1, keepdims=True)
            row_sums[row_sums == 0] = 1
            cm = cm.astype(float) / row_sums

        fig, ax = plt.subplots(figsize=figsize)

        fmt = ".2f" if normalized else "d"
        sns.heatmap(
            cm,
            annot=True,
            fmt=fmt,
            cmap="Blues",
            xticklabels=self.class_names,
            yticklabels=self.class_names,
            square=True,
            ax=ax,
            linewidths=0.5,
            linecolor="gray",
        )

        ax.set_xlabel("Predicted", fontsize=12, fontweight="bold")
        ax.set_ylabel("True", fontsize=12, fontweight="bold")
        title = "Confusion Matrix"
        if normalized:
            title += " (Normalized)"
        ax.set_title(title, fontsize=14, fontweight="bold", pad=20)

        plt.xticks(rotation=45, ha="right", fontsize=9)
        plt.yticks(rotation=0, fontsize=9)

        plt.tight_layout()
        plt.savefig(output_path, dpi=150, bbox_inches="tight")
        plt.close()

        logger.info(f"Confusion matrix saved to: {output_path}")
        return output_path

    def per_class_summary(
        self,
        true_labels: List[int],
        pred_labels: List[int],
    ) -> Dict:
        """
        Generate per-class precision, recall, and F1 from predictions.

        Args:
            true_labels: Ground truth class IDs.
            pred_labels: Predicted class IDs.

        Returns:
            Dictionary with per-class metrics.
        """
        from sklearn.metrics import classification_report

        report = classification_report(
            true_labels,
            pred_labels,
            labels=list(range(self.num_classes)),
            target_names=self.class_names,
            output_dict=True,
            zero_division=0,
        )

        return report


if __name__ == "__main__":
    viz = ConfusionMatrixVisualizer()
    print(f"Classes: {viz.class_names}")
