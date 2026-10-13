"""
AccessMap ML — Annotation Format Converter
============================================
Converts annotations between common formats:
  - COCO JSON → YOLO TXT
  - Pascal VOC XML → YOLO TXT
  - CVAT XML → YOLO TXT (for the Zenodo accessibility dataset)

All conversions normalize bounding boxes to YOLO format:
  class_id x_center y_center width height (all values 0-1 normalized)
"""

import json
import os
import xml.etree.ElementTree as ET
from pathlib import Path
from typing import Dict, List, Optional, Tuple

from loguru import logger


class AnnotationConverter:
    """
    Convert between annotation formats with class ID remapping support.

    Usage:
        converter = AnnotationConverter(class_remap={1: 4, 2: 7})
        converter.coco_to_yolo("annotations.json", "images/", "labels/")
    """

    def __init__(self, class_remap: Optional[Dict[int, int]] = None):
        """
        Args:
            class_remap: Optional mapping of source class IDs to target class IDs.
                         E.g., {0: 4} remaps source class 0 → AccessMap class 4 (stairs).
        """
        self.class_remap = class_remap or {}

    def _remap_class(self, class_id: int) -> int:
        """Apply class remapping if configured."""
        return self.class_remap.get(class_id, class_id)

    # ─────────────────────────────────────────────
    # COCO JSON → YOLO TXT
    # ─────────────────────────────────────────────

    def coco_to_yolo(
        self,
        coco_json_path: str,
        output_label_dir: str,
        category_remap: Optional[Dict[int, int]] = None,
    ) -> int:
        """
        Convert COCO-format annotations to YOLO-format label files.

        COCO format (per annotation):
            bbox: [x_min, y_min, width, height] in absolute pixels
            category_id: integer class ID

        YOLO format (per line in .txt):
            class_id x_center y_center width height (normalized 0-1)

        Args:
            coco_json_path: Path to the COCO annotations JSON file.
            output_label_dir: Directory to write YOLO .txt label files.
            category_remap: Optional COCO category_id → YOLO class_id mapping.
                           If not provided, uses sequential IDs.

        Returns:
            Number of images with annotations converted.
        """
        output_dir = Path(output_label_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        with open(coco_json_path, "r") as f:
            coco_data = json.load(f)

        # Build image ID → image info lookup
        images = {img["id"]: img for img in coco_data["images"]}

        # Build category mapping if not provided
        if category_remap is None:
            categories = coco_data.get("categories", [])
            category_remap = {cat["id"]: idx for idx, cat in enumerate(categories)}

        # Group annotations by image
        img_annotations: Dict[int, List] = {}
        for ann in coco_data["annotations"]:
            img_id = ann["image_id"]
            img_annotations.setdefault(img_id, []).append(ann)

        converted = 0
        for img_id, anns in img_annotations.items():
            img_info = images.get(img_id)
            if img_info is None:
                continue

            img_w = img_info["width"]
            img_h = img_info["height"]
            filename_stem = Path(img_info["file_name"]).stem
            label_path = output_dir / f"{filename_stem}.txt"

            lines = []
            for ann in anns:
                # COCO bbox: [x_min, y_min, bbox_width, bbox_height]
                x_min, y_min, bbox_w, bbox_h = ann["bbox"]

                # Convert to YOLO format: center x, center y, width, height (normalized)
                x_center = (x_min + bbox_w / 2) / img_w
                y_center = (y_min + bbox_h / 2) / img_h
                w_norm = bbox_w / img_w
                h_norm = bbox_h / img_h

                # Clamp to [0, 1]
                x_center = max(0.0, min(1.0, x_center))
                y_center = max(0.0, min(1.0, y_center))
                w_norm = max(0.0, min(1.0, w_norm))
                h_norm = max(0.0, min(1.0, h_norm))

                # Map category ID
                coco_cat = ann["category_id"]
                yolo_class = category_remap.get(coco_cat, coco_cat)
                yolo_class = self._remap_class(yolo_class)

                lines.append(
                    f"{yolo_class} {x_center:.6f} {y_center:.6f} "
                    f"{w_norm:.6f} {h_norm:.6f}"
                )

            with open(label_path, "w") as f:
                f.write("\n".join(lines) + "\n" if lines else "")

            converted += 1

        logger.info(
            f"COCO → YOLO: Converted {converted} images "
            f"from {coco_json_path} → {output_dir}"
        )
        return converted

    # ─────────────────────────────────────────────
    # Pascal VOC XML → YOLO TXT
    # ─────────────────────────────────────────────

    def voc_to_yolo(
        self,
        voc_dir: str,
        output_label_dir: str,
        class_name_to_id: Optional[Dict[str, int]] = None,
    ) -> int:
        """
        Convert Pascal VOC XML annotations to YOLO-format label files.

        VOC format (per <object> in XML):
            <bndbox> with <xmin>, <ymin>, <xmax>, <ymax> in absolute pixels

        Args:
            voc_dir: Directory containing VOC .xml annotation files.
            output_label_dir: Directory to write YOLO .txt label files.
            class_name_to_id: Mapping of VOC class names → YOLO class IDs.

        Returns:
            Number of XML files converted.
        """
        # Default class name mapping for AccessMap domain
        if class_name_to_id is None:
            class_name_to_id = {
                "wheelchair": 0,
                "wheelchair_ramp": 1, "ramp": 1,
                "elevator": 2,
                "lift": 3,
                "stairs": 4, "steps": 4, "staircase": 4,
                "accessible_parking": 5, "parking": 5,
                "accessible_bathroom": 6, "bathroom": 6,
                "grab_bar": 7, "handrail": 7, "grab_bars": 7,
                "doorway": 8, "door": 8,
                "tactile_paving": 9, "tactile": 9,
            }

        voc_dir = Path(voc_dir)
        output_dir = Path(output_label_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        converted = 0
        for xml_path in sorted(voc_dir.glob("*.xml")):
            tree = ET.parse(xml_path)
            root = tree.getroot()

            # Get image dimensions
            size = root.find("size")
            if size is None:
                logger.warning(f"No <size> element in {xml_path.name}, skipping")
                continue

            img_w = int(size.findtext("width", "0"))
            img_h = int(size.findtext("height", "0"))

            if img_w == 0 or img_h == 0:
                logger.warning(f"Invalid dimensions in {xml_path.name}, skipping")
                continue

            lines = []
            for obj in root.findall("object"):
                class_name = obj.findtext("name", "").strip().lower()

                if class_name not in class_name_to_id:
                    logger.debug(
                        f"Unknown class '{class_name}' in {xml_path.name}, skipping"
                    )
                    continue

                class_id = class_name_to_id[class_name]
                class_id = self._remap_class(class_id)

                bndbox = obj.find("bndbox")
                if bndbox is None:
                    continue

                xmin = float(bndbox.findtext("xmin", "0"))
                ymin = float(bndbox.findtext("ymin", "0"))
                xmax = float(bndbox.findtext("xmax", "0"))
                ymax = float(bndbox.findtext("ymax", "0"))

                # Convert to YOLO format
                x_center = ((xmin + xmax) / 2) / img_w
                y_center = ((ymin + ymax) / 2) / img_h
                w_norm = (xmax - xmin) / img_w
                h_norm = (ymax - ymin) / img_h

                # Clamp
                x_center = max(0.0, min(1.0, x_center))
                y_center = max(0.0, min(1.0, y_center))
                w_norm = max(0.0, min(1.0, w_norm))
                h_norm = max(0.0, min(1.0, h_norm))

                lines.append(
                    f"{class_id} {x_center:.6f} {y_center:.6f} "
                    f"{w_norm:.6f} {h_norm:.6f}"
                )

            label_path = output_dir / f"{xml_path.stem}.txt"
            with open(label_path, "w") as f:
                f.write("\n".join(lines) + "\n" if lines else "")

            converted += 1

        logger.info(
            f"VOC → YOLO: Converted {converted} files "
            f"from {voc_dir} → {output_dir}"
        )
        return converted

    # ─────────────────────────────────────────────
    # CVAT XML → YOLO TXT
    # ─────────────────────────────────────────────

    def cvat_to_yolo(
        self,
        cvat_xml_path: str,
        output_label_dir: str,
        class_name_to_id: Optional[Dict[str, int]] = None,
    ) -> int:
        """
        Convert CVAT XML annotations to YOLO-format label files.
        
        This is specifically useful for the Zenodo Accessibility Barriers
        dataset which uses CVAT XML format.

        Args:
            cvat_xml_path: Path to a CVAT-exported XML file.
            output_label_dir: Directory to write YOLO .txt label files.
            class_name_to_id: Mapping of CVAT label names → YOLO class IDs.

        Returns:
            Number of images with annotations converted.
        """
        if class_name_to_id is None:
            class_name_to_id = {
                "step": 4, "steps": 4,
                "stairs": 4, "staircase": 4,
                "ramp": 1,
                "grab_bar": 7, "grab_bars": 7, "handrail": 7,
            }

        output_dir = Path(output_label_dir)
        output_dir.mkdir(parents=True, exist_ok=True)

        tree = ET.parse(cvat_xml_path)
        root = tree.getroot()

        converted = 0
        for image_elem in root.findall(".//image"):
            img_name = image_elem.get("name", "")
            img_w = int(image_elem.get("width", "0"))
            img_h = int(image_elem.get("height", "0"))

            if img_w == 0 or img_h == 0:
                continue

            lines = []
            for box in image_elem.findall("box"):
                label = box.get("label", "").strip().lower()

                if label not in class_name_to_id:
                    continue

                class_id = class_name_to_id[label]
                class_id = self._remap_class(class_id)

                xtl = float(box.get("xtl", "0"))
                ytl = float(box.get("ytl", "0"))
                xbr = float(box.get("xbr", "0"))
                ybr = float(box.get("ybr", "0"))

                x_center = ((xtl + xbr) / 2) / img_w
                y_center = ((ytl + ybr) / 2) / img_h
                w_norm = (xbr - xtl) / img_w
                h_norm = (ybr - ytl) / img_h

                x_center = max(0.0, min(1.0, x_center))
                y_center = max(0.0, min(1.0, y_center))
                w_norm = max(0.0, min(1.0, w_norm))
                h_norm = max(0.0, min(1.0, h_norm))

                lines.append(
                    f"{class_id} {x_center:.6f} {y_center:.6f} "
                    f"{w_norm:.6f} {h_norm:.6f}"
                )

            filename_stem = Path(img_name).stem
            label_path = output_dir / f"{filename_stem}.txt"
            with open(label_path, "w") as f:
                f.write("\n".join(lines) + "\n" if lines else "")

            converted += 1

        logger.info(
            f"CVAT → YOLO: Converted {converted} images "
            f"from {cvat_xml_path} → {output_dir}"
        )
        return converted

    # ─────────────────────────────────────────────
    # YOLO → COCO JSON (for evaluation tools)
    # ─────────────────────────────────────────────

    def yolo_to_coco(
        self,
        image_dir: str,
        label_dir: str,
        output_json_path: str,
        class_names: Optional[Dict[int, str]] = None,
    ) -> str:
        """
        Convert YOLO-format annotations back to COCO JSON.
        Useful for evaluation tools that require COCO format.

        Args:
            image_dir: Directory containing images.
            label_dir: Directory containing YOLO .txt label files.
            output_json_path: Path to write the COCO JSON file.
            class_names: Mapping of class IDs → names.

        Returns:
            Path to the generated COCO JSON file.
        """
        from PIL import Image

        if class_names is None:
            from .loader import DatasetLoader
            class_names = DatasetLoader.CLASS_NAMES

        coco = {
            "images": [],
            "annotations": [],
            "categories": [
                {"id": k, "name": v} for k, v in class_names.items()
            ],
        }

        image_dir = Path(image_dir)
        label_dir = Path(label_dir)
        ann_id = 1

        image_extensions = {".jpg", ".jpeg", ".png", ".bmp", ".webp"}

        for img_id, img_path in enumerate(sorted(image_dir.iterdir()), start=1):
            if img_path.suffix.lower() not in image_extensions:
                continue

            img = Image.open(img_path)
            img_w, img_h = img.size

            coco["images"].append({
                "id": img_id,
                "file_name": img_path.name,
                "width": img_w,
                "height": img_h,
            })

            label_path = label_dir / f"{img_path.stem}.txt"
            if not label_path.exists():
                continue

            with open(label_path, "r") as f:
                for line in f:
                    parts = line.strip().split()
                    if len(parts) < 5:
                        continue

                    class_id = int(parts[0])
                    x_center = float(parts[1]) * img_w
                    y_center = float(parts[2]) * img_h
                    bbox_w = float(parts[3]) * img_w
                    bbox_h = float(parts[4]) * img_h

                    x_min = x_center - bbox_w / 2
                    y_min = y_center - bbox_h / 2

                    coco["annotations"].append({
                        "id": ann_id,
                        "image_id": img_id,
                        "category_id": class_id,
                        "bbox": [x_min, y_min, bbox_w, bbox_h],
                        "area": bbox_w * bbox_h,
                        "iscrowd": 0,
                    })
                    ann_id += 1

        with open(output_json_path, "w") as f:
            json.dump(coco, f, indent=2)

        logger.info(
            f"YOLO → COCO: Wrote {len(coco['annotations'])} annotations "
            f"across {len(coco['images'])} images → {output_json_path}"
        )
        return output_json_path


if __name__ == "__main__":
    # Quick test — show converter capabilities
    converter = AnnotationConverter()
    print("Supported conversions: COCO→YOLO, VOC→YOLO, CVAT→YOLO, YOLO→COCO")
