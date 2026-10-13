#!/usr/bin/env python3
"""
AccessMap ML — Dataset Download & Preparation
================================================
Download publicly available accessibility datasets and
prepare them for training.

Usage:
    python scripts/download_datasets.py --source zenodo --output data/raw
    python scripts/download_datasets.py --source roboflow --api-key YOUR_KEY
"""

import argparse
import os
import shutil
import zipfile
from pathlib import Path

import requests
from loguru import logger


# ──────────────────────────────────────────────
# Known Accessibility Datasets
# ──────────────────────────────────────────────

DATASETS = {
    "zenodo_accessibility": {
        "description": "Image Dataset of Accessibility Barriers (Zenodo)",
        "url": "https://zenodo.org/api/records/6382025/files-archive",
        "classes": ["steps", "stairs", "ramp", "grab_bar"],
        "format": "cvat_xml",
        "size_mb": "~800",
        "images": 5538,
    },
}


def download_file(url: str, output_path: str, chunk_size: int = 8192) -> str:
    """
    Download a file with progress reporting.

    Args:
        url: URL to download.
        output_path: Local path to save the file.
        chunk_size: Download chunk size in bytes.

    Returns:
        Path to the downloaded file.
    """
    output_path = Path(output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)

    logger.info(f"Downloading: {url}")
    logger.info(f"Saving to:   {output_path}")

    response = requests.get(url, stream=True, timeout=30)
    response.raise_for_status()

    total_size = int(response.headers.get("content-length", 0))
    downloaded = 0

    with open(output_path, "wb") as f:
        for chunk in response.iter_content(chunk_size=chunk_size):
            f.write(chunk)
            downloaded += len(chunk)

            if total_size > 0:
                progress = downloaded / total_size * 100
                if downloaded % (chunk_size * 100) == 0:
                    logger.info(
                        f"  Progress: {downloaded / 1e6:.1f} MB / "
                        f"{total_size / 1e6:.1f} MB ({progress:.1f}%)"
                    )

    logger.info(f"Download complete: {output_path} ({downloaded / 1e6:.1f} MB)")
    return str(output_path)


def extract_archive(archive_path: str, output_dir: str) -> str:
    """
    Extract a zip archive.

    Args:
        archive_path: Path to the archive file.
        output_dir: Directory to extract to.

    Returns:
        Path to the extraction directory.
    """
    output_dir = Path(output_dir)
    output_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Extracting: {archive_path} → {output_dir}")

    if archive_path.endswith(".zip"):
        with zipfile.ZipFile(archive_path, "r") as zf:
            zf.extractall(output_dir)
    else:
        logger.warning(f"Unknown archive format: {archive_path}")
        return str(output_dir)

    logger.info(f"Extraction complete: {output_dir}")
    return str(output_dir)


def download_zenodo_dataset(output_dir: str) -> str:
    """Download the Zenodo Accessibility Barriers dataset."""
    info = DATASETS["zenodo_accessibility"]

    logger.info("=" * 60)
    logger.info(f"Dataset: {info['description']}")
    logger.info(f"Classes: {info['classes']}")
    logger.info(f"Images:  {info['images']}")
    logger.info(f"Size:    {info['size_mb']}")
    logger.info("=" * 60)

    archive_path = os.path.join(output_dir, "zenodo_accessibility.zip")

    # Download
    download_file(info["url"], archive_path)

    # Extract
    extract_dir = os.path.join(output_dir, "zenodo_accessibility")
    extract_archive(archive_path, extract_dir)

    logger.info(f"Zenodo dataset ready at: {extract_dir}")
    return extract_dir


def create_sample_dataset(output_dir: str, num_samples: int = 10) -> str:
    """
    Create a minimal sample dataset for testing the pipeline.

    This generates placeholder images and labels to verify
    the training pipeline works before using real data.

    Args:
        output_dir: Output directory.
        num_samples: Number of sample images to create.

    Returns:
        Path to the sample dataset directory.
    """
    import numpy as np

    output_dir = Path(output_dir)
    img_dir = output_dir / "images"
    lbl_dir = output_dir / "labels"
    img_dir.mkdir(parents=True, exist_ok=True)
    lbl_dir.mkdir(parents=True, exist_ok=True)

    logger.info(f"Creating sample dataset with {num_samples} images")

    for i in range(num_samples):
        # Create random image (640x640)
        img = np.random.randint(50, 200, (640, 640, 3), dtype=np.uint8)

        # Add a rectangle to simulate an object
        x1 = np.random.randint(50, 400)
        y1 = np.random.randint(50, 400)
        x2 = x1 + np.random.randint(50, 200)
        y2 = y1 + np.random.randint(50, 200)
        import cv2
        cv2.rectangle(img, (x1, y1), (x2, y2), (0, 255, 0), -1)

        # Save image
        img_path = img_dir / f"sample_{i:04d}.jpg"
        cv2.imwrite(str(img_path), img)

        # Create label (random class, normalized coordinates)
        class_id = np.random.randint(0, 10)
        xc = ((x1 + x2) / 2) / 640
        yc = ((y1 + y2) / 2) / 640
        w = (x2 - x1) / 640
        h = (y2 - y1) / 640

        lbl_path = lbl_dir / f"sample_{i:04d}.txt"
        with open(lbl_path, "w") as f:
            f.write(f"{class_id} {xc:.6f} {yc:.6f} {w:.6f} {h:.6f}\n")

    logger.info(f"Sample dataset created at: {output_dir}")
    return str(output_dir)


def main():
    parser = argparse.ArgumentParser(
        description="Download accessibility datasets for training"
    )
    parser.add_argument(
        "--source",
        choices=["zenodo", "sample", "list"],
        default="list",
        help="Dataset source to download",
    )
    parser.add_argument(
        "--output",
        default="data/raw",
        help="Output directory for downloaded data",
    )
    parser.add_argument(
        "--samples",
        type=int,
        default=10,
        help="Number of samples for sample dataset",
    )

    args = parser.parse_args()

    if args.source == "list":
        print("\nAvailable datasets:")
        print("=" * 60)
        for name, info in DATASETS.items():
            print(f"\n  {name}:")
            print(f"    Description: {info['description']}")
            print(f"    Classes:     {info['classes']}")
            print(f"    Images:      {info['images']}")
            print(f"    Size:        {info['size_mb']}")
        print("\n" + "=" * 60)
        print("\nUsage: python scripts/download_datasets.py --source zenodo --output data/raw")
        print("       python scripts/download_datasets.py --source sample --output data/raw/sample")

    elif args.source == "zenodo":
        download_zenodo_dataset(args.output)

    elif args.source == "sample":
        create_sample_dataset(args.output, args.samples)


if __name__ == "__main__":
    main()
