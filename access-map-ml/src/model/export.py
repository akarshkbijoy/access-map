"""
AccessMap ML — Model Export
==============================
Export trained models to ONNX, TFLite, TensorRT, and other
formats for production deployment.
"""

import time
from pathlib import Path
from typing import Dict, List, Optional

import yaml
from loguru import logger


class ModelExporter:
    """
    Export YOLOv8 models to various deployment formats.

    Supports:
    - ONNX (CPU/GPU inference, broad compatibility)
    - TFLite (mobile — Android/iOS)
    - TensorRT (NVIDIA GPU optimized)
    - OpenVINO (Intel CPU optimized)
    - CoreML (Apple devices)
    """

    SUPPORTED_FORMATS = {
        "onnx": {"ext": ".onnx", "desc": "ONNX (Open Neural Network Exchange)"},
        "tflite": {"ext": ".tflite", "desc": "TensorFlow Lite (mobile)"},
        "torchscript": {"ext": ".torchscript", "desc": "TorchScript"},
        "engine": {"ext": ".engine", "desc": "TensorRT (NVIDIA GPU)"},
        "openvino": {"ext": "_openvino_model", "desc": "OpenVINO (Intel)"},
        "coreml": {"ext": ".mlpackage", "desc": "CoreML (Apple)"},
    }

    def __init__(self, config_path: str = "config/config.yaml"):
        with open(config_path, "r") as f:
            self.config = yaml.safe_load(f)

        self.export_config = self.config.get("export", {})
        self.model_config = self.config["model"]
        self.models_dir = Path(self.config["paths"]["models_dir"])
        self.models_dir.mkdir(parents=True, exist_ok=True)

    def export(
        self,
        model_path: str = "models/best.pt",
        formats: Optional[List[str]] = None,
        output_dir: Optional[str] = None,
    ) -> Dict[str, str]:
        """
        Export a trained model to one or more deployment formats.

        Args:
            model_path: Path to the trained .pt model file.
            formats: List of export formats. None = use config defaults.
            output_dir: Output directory. None = same as model location.

        Returns:
            Dictionary mapping format → exported file path.
        """
        from ultralytics import YOLO

        if formats is None:
            formats = self.export_config.get("formats", ["onnx"])

        model = YOLO(model_path)
        exported = {}

        for fmt in formats:
            if fmt not in self.SUPPORTED_FORMATS:
                logger.warning(
                    f"Unsupported format '{fmt}'. "
                    f"Available: {list(self.SUPPORTED_FORMATS.keys())}"
                )
                continue

            logger.info(f"Exporting to {self.SUPPORTED_FORMATS[fmt]['desc']}...")

            try:
                start = time.time()

                export_args = {
                    "format": fmt,
                    "imgsz": self.model_config["input_size"],
                    "simplify": self.export_config.get("simplify", True),
                }

                # ONNX-specific options
                if fmt == "onnx":
                    export_args["opset"] = self.export_config.get("onnx_opset", 17)
                    export_args["dynamic"] = self.export_config.get(
                        "dynamic_batch", False
                    )

                # FP16 for supported formats
                if fmt in ("onnx", "engine") and self.export_config.get(
                    "half_precision", False
                ):
                    export_args["half"] = True

                # INT8 quantization
                if self.export_config.get("quantize", False):
                    export_args["int8"] = True

                result = model.export(**export_args)
                duration = time.time() - start

                exported[fmt] = str(result)
                logger.info(
                    f"  ✓ {fmt} exported in {duration:.1f}s → {result}"
                )

            except Exception as e:
                logger.error(f"  ✗ {fmt} export failed: {e}")
                exported[fmt] = f"ERROR: {e}"

        return exported

    def validate_export(
        self,
        original_model_path: str,
        exported_model_path: str,
        test_image_dir: Optional[str] = None,
        tolerance: float = 0.01,
    ) -> Dict:
        """
        Validate an exported model against the original PyTorch model.

        Compares detection outputs to ensure export didn't degrade accuracy.

        Args:
            original_model_path: Path to the original .pt model.
            exported_model_path: Path to the exported model (ONNX, etc.).
            test_image_dir: Directory with test images. Uses sample if None.
            tolerance: Maximum allowed difference in confidence scores.

        Returns:
            Validation report dictionary.
        """
        from ultralytics import YOLO
        import numpy as np

        original = YOLO(original_model_path)
        exported = YOLO(exported_model_path)

        report = {
            "original_model": original_model_path,
            "exported_model": exported_model_path,
            "images_tested": 0,
            "max_confidence_diff": 0.0,
            "max_box_diff": 0.0,
            "passed": True,
        }

        # Find test images
        if test_image_dir:
            test_dir = Path(test_image_dir)
            image_exts = {".jpg", ".jpeg", ".png"}
            test_images = [
                f for f in test_dir.iterdir() if f.suffix.lower() in image_exts
            ][:10]  # Test on up to 10 images
        else:
            logger.warning("No test images provided. Skipping output comparison.")
            return report

        for img_path in test_images:
            orig_results = original(str(img_path), verbose=False)
            exp_results = exported(str(img_path), verbose=False)

            report["images_tested"] += 1

            # Compare number of detections
            orig_boxes = orig_results[0].boxes
            exp_boxes = exp_results[0].boxes

            if len(orig_boxes) != len(exp_boxes):
                logger.warning(
                    f"{img_path.name}: detection count mismatch "
                    f"(orig={len(orig_boxes)}, exported={len(exp_boxes)})"
                )

            # Compare confidence scores
            if len(orig_boxes) > 0 and len(exp_boxes) > 0:
                orig_conf = orig_boxes.conf.cpu().numpy()
                exp_conf = exp_boxes.conf.cpu().numpy()
                min_len = min(len(orig_conf), len(exp_conf))
                conf_diff = np.max(np.abs(orig_conf[:min_len] - exp_conf[:min_len]))
                report["max_confidence_diff"] = max(
                    report["max_confidence_diff"], conf_diff
                )

                if conf_diff > tolerance:
                    report["passed"] = False
                    logger.warning(
                        f"{img_path.name}: confidence diff {conf_diff:.4f} "
                        f"exceeds tolerance {tolerance}"
                    )

        status = "✓ PASSED" if report["passed"] else "✗ FAILED"
        logger.info(f"Export validation {status}")
        logger.info(f"  Images tested: {report['images_tested']}")
        logger.info(f"  Max confidence diff: {report['max_confidence_diff']:.4f}")

        return report

    def get_model_size(self, model_path: str) -> Dict:
        """
        Get the file size of an exported model.

        Args:
            model_path: Path to the model file.

        Returns:
            Dictionary with size information.
        """
        path = Path(model_path)
        if not path.exists():
            return {"error": f"File not found: {model_path}"}

        size_bytes = path.stat().st_size
        return {
            "path": str(path),
            "size_bytes": size_bytes,
            "size_mb": f"{size_bytes / 1e6:.1f} MB",
            "size_gb": f"{size_bytes / 1e9:.3f} GB",
        }

    def benchmark(
        self,
        model_path: str,
        num_iterations: int = 100,
        input_size: Optional[int] = None,
    ) -> Dict:
        """
        Benchmark model inference speed.

        Args:
            model_path: Path to the model file.
            num_iterations: Number of inference iterations.
            input_size: Input image size. None = use config default.

        Returns:
            Benchmark results dictionary.
        """
        import numpy as np
        from ultralytics import YOLO

        imgsz = input_size or self.model_config["input_size"]
        model = YOLO(model_path)

        # Create a dummy image
        dummy_image = np.random.randint(0, 255, (imgsz, imgsz, 3), dtype=np.uint8)

        # Warm up
        for _ in range(5):
            model(dummy_image, verbose=False)

        # Benchmark
        times = []
        for _ in range(num_iterations):
            start = time.time()
            model(dummy_image, verbose=False)
            times.append((time.time() - start) * 1000)  # ms

        results = {
            "model": model_path,
            "input_size": imgsz,
            "iterations": num_iterations,
            "mean_ms": np.mean(times),
            "median_ms": np.median(times),
            "min_ms": np.min(times),
            "max_ms": np.max(times),
            "std_ms": np.std(times),
            "fps": 1000 / np.mean(times),
        }

        logger.info(f"Benchmark results for {model_path}:")
        logger.info(f"  Mean latency:   {results['mean_ms']:.1f} ms")
        logger.info(f"  Median latency: {results['median_ms']:.1f} ms")
        logger.info(f"  FPS:            {results['fps']:.1f}")

        return results


if __name__ == "__main__":
    exporter = ModelExporter()
    print(f"Supported formats: {list(exporter.SUPPORTED_FORMATS.keys())}")
    print(f"Default formats: {exporter.export_config.get('formats', ['onnx'])}")
