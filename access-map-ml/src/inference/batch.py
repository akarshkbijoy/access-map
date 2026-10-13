"""
AccessMap ML — Batch Processing
===================================
Process multiple images for bulk accessibility analysis.
"""

import json
import time
from concurrent.futures import ThreadPoolExecutor, as_completed
from pathlib import Path
from typing import Dict, List, Optional, Union

import yaml
from loguru import logger

from .detector import AccessibilityDetector


class BatchProcessor:
    """
    Process multiple images for accessibility feature detection.

    Features:
    - Directory-based batch processing
    - Parallel inference with configurable workers
    - Progress tracking and ETA
    - Results export to JSON/CSV
    """

    def __init__(
        self,
        model_path: str = "models/best.pt",
        config_path: str = "config/config.yaml",
    ):
        self.detector = AccessibilityDetector(model_path, config_path)
        self.config_path = config_path

        with open(config_path, "r") as f:
            config = yaml.safe_load(f)

        self.image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

    def process_directory(
        self,
        image_dir: str,
        output_path: Optional[str] = None,
        recursive: bool = False,
        max_images: Optional[int] = None,
    ) -> Dict:
        """
        Process all images in a directory.

        Args:
            image_dir: Directory containing images.
            output_path: Path to save results JSON. None = no save.
            recursive: If True, search subdirectories.
            max_images: Maximum number of images to process.

        Returns:
            Batch results dictionary.
        """
        image_dir = Path(image_dir)
        if not image_dir.exists():
            raise FileNotFoundError(f"Directory not found: {image_dir}")

        # Collect image paths
        if recursive:
            image_paths = []
            for ext in self.image_extensions:
                image_paths.extend(image_dir.rglob(f"*{ext}"))
        else:
            image_paths = [
                f for f in image_dir.iterdir()
                if f.suffix.lower() in self.image_extensions
            ]

        image_paths = sorted(image_paths)

        if max_images:
            image_paths = image_paths[:max_images]

        logger.info(f"Processing {len(image_paths)} images from {image_dir}")

        return self.process_images(
            [str(p) for p in image_paths],
            output_path=output_path,
        )

    def process_images(
        self,
        image_paths: List[str],
        output_path: Optional[str] = None,
    ) -> Dict:
        """
        Process a list of image paths.

        Args:
            image_paths: List of image file paths.
            output_path: Path to save results JSON.

        Returns:
            Batch results dictionary.
        """
        start_time = time.time()
        results = []
        errors = []

        for i, img_path in enumerate(image_paths):
            try:
                result = self.detector.detect(img_path)
                result["image_path"] = img_path
                results.append(result)
            except Exception as e:
                logger.error(f"Error processing {img_path}: {e}")
                errors.append({"image_path": img_path, "error": str(e)})

            # Progress logging
            if (i + 1) % 10 == 0 or (i + 1) == len(image_paths):
                elapsed = time.time() - start_time
                rate = (i + 1) / elapsed
                eta = (len(image_paths) - i - 1) / rate if rate > 0 else 0
                logger.info(
                    f"Progress: {i + 1}/{len(image_paths)} "
                    f"({rate:.1f} img/s, ETA: {eta:.0f}s)"
                )

        total_time = time.time() - start_time

        # Build batch summary
        batch_results = {
            "total_images": len(image_paths),
            "successful": len(results),
            "errors": len(errors),
            "processing_time_seconds": round(total_time, 2),
            "images_per_second": round(len(results) / total_time, 2) if total_time > 0 else 0,
            "results": results,
            "error_details": errors,
            "aggregate_summary": self._aggregate_results(results),
        }

        # Save results
        if output_path:
            with open(output_path, "w") as f:
                json.dump(batch_results, f, indent=2)
            logger.info(f"Batch results saved to: {output_path}")

        return batch_results

    def process_parallel(
        self,
        image_paths: List[str],
        max_workers: int = 4,
        output_path: Optional[str] = None,
    ) -> Dict:
        """
        Process images in parallel using thread pool.

        Note: GPU inference is typically not faster with multi-threading
        due to GIL and GPU serialization. Use for CPU inference or 
        I/O-bound preprocessing scenarios.

        Args:
            image_paths: List of image file paths.
            max_workers: Maximum parallel workers.
            output_path: Path to save results JSON.

        Returns:
            Batch results dictionary.
        """
        start_time = time.time()
        results = []
        errors = []

        def process_single(img_path: str) -> Dict:
            return self.detector.detect(img_path)

        with ThreadPoolExecutor(max_workers=max_workers) as executor:
            future_to_path = {
                executor.submit(process_single, path): path
                for path in image_paths
            }

            for future in as_completed(future_to_path):
                img_path = future_to_path[future]
                try:
                    result = future.result()
                    result["image_path"] = img_path
                    results.append(result)
                except Exception as e:
                    logger.error(f"Error processing {img_path}: {e}")
                    errors.append({"image_path": img_path, "error": str(e)})

        total_time = time.time() - start_time

        batch_results = {
            "total_images": len(image_paths),
            "successful": len(results),
            "errors": len(errors),
            "processing_time_seconds": round(total_time, 2),
            "images_per_second": round(len(results) / total_time, 2) if total_time > 0 else 0,
            "workers": max_workers,
            "results": results,
            "error_details": errors,
            "aggregate_summary": self._aggregate_results(results),
        }

        if output_path:
            with open(output_path, "w") as f:
                json.dump(batch_results, f, indent=2)
            logger.info(f"Batch results saved to: {output_path}")

        return batch_results

    def _aggregate_results(self, results: List[Dict]) -> Dict:
        """
        Aggregate results across all images.

        Args:
            results: List of per-image detection results.

        Returns:
            Aggregated summary.
        """
        all_features = {}
        total_detections = 0
        images_with_aids = 0
        images_with_barriers = 0

        for result in results:
            summary = result.get("summary", {})
            counts = summary.get("feature_counts", {})

            for feature, count in counts.items():
                all_features[feature] = all_features.get(feature, 0) + count
                total_detections += count

            if summary.get("accessibility_aids"):
                images_with_aids += 1
            if summary.get("accessibility_barriers"):
                images_with_barriers += 1

        return {
            "total_detections": total_detections,
            "feature_counts": all_features,
            "images_with_accessibility_aids": images_with_aids,
            "images_with_barriers": images_with_barriers,
            "most_common_feature": max(all_features, key=all_features.get)
            if all_features
            else None,
        }

    def export_csv(self, batch_results: Dict, output_path: str) -> str:
        """
        Export batch results to CSV format.

        Args:
            batch_results: Results from process_images() or process_directory().
            output_path: Output CSV file path.

        Returns:
            Path to the saved CSV file.
        """
        import csv

        with open(output_path, "w", newline="") as f:
            writer = csv.writer(f)

            # Header
            writer.writerow([
                "image", "class", "confidence", "x1", "y1", "x2", "y2",
                "type", "area_percent",
            ])

            # Data rows
            for result in batch_results.get("results", []):
                image_info = result.get("image_info", {})
                filename = image_info.get("filename", "unknown")

                for det in result.get("detections", []):
                    bbox = det.get("bbox", {})
                    writer.writerow([
                        filename,
                        det.get("class_name", ""),
                        det.get("confidence", 0),
                        bbox.get("x1", 0),
                        bbox.get("y1", 0),
                        bbox.get("x2", 0),
                        bbox.get("y2", 0),
                        det.get("type", ""),
                        det.get("area_percent", 0),
                    ])

        logger.info(f"CSV exported to: {output_path}")
        return output_path


if __name__ == "__main__":
    print("BatchProcessor — process multiple images at once")
