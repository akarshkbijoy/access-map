# AccessMap ML — Accessibility Feature Detection

> A production-ready YOLOv8-based object detection system for identifying accessibility features in images. Part of the [AccessMap](../access-map/) platform.

## 🎯 What It Detects

| Class | Feature | Type |
|-------|---------|------|
| 0 | Wheelchair (manual & powered) | Neutral |
| 1 | Wheelchair Ramp (permanent & portable) | ♿ Aid |
| 2 | Elevator (exterior & interior) | ♿ Aid |
| 3 | Lift (platform, stair) | ♿ Aid |
| 4 | Stairs / Steps | ⚠️ Barrier |
| 5 | Accessible Parking | ♿ Aid |
| 6 | Accessible Bathroom | ♿ Aid |
| 7 | Grab Bar / Handrail | ♿ Aid |
| 8 | Doorway | Neutral |
| 9 | Tactile Paving | ♿ Aid |

## 🚀 Quick Start

### Prerequisites
- Python 3.11+
- pip

### Installation

```bash
# Clone and enter the project
cd access-map-ml

# Create virtual environment
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # Linux/Mac

# Install dependencies
pip install -r requirements.txt
```

### Run the API Server

```bash
# Start with a trained model
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload

# Open API docs
# http://localhost:8000/docs
```

### Quick Detection

```bash
# Single image
curl -X POST http://localhost:8000/detect \
  -F "file=@my_image.jpg"

# From URL
curl -X POST http://localhost:8000/detect/url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com/photo.jpg"}'
```

## 📁 Project Structure

```
access-map-ml/
├── config/config.yaml           # Hyperparameters & settings
├── data/
│   ├── dataset.yaml             # YOLOv8 dataset config
│   └── annotation_guide.md      # How to annotate images
├── src/
│   ├── data/                    # Data loading & conversion
│   ├── model/                   # Architecture, training, export
│   ├── evaluation/              # Metrics, confusion matrix
│   ├── inference/               # Detection, batch, post-processing
│   └── api/                     # FastAPI server
├── scripts/                     # CLI tools
├── notebooks/                   # Jupyter & Colab notebooks
├── tests/                       # pytest test suite
├── models/                      # Saved model weights
├── Dockerfile                   # Container definition
└── docker-compose.yml           # Service orchestration
```

## 🏋️ Training Pipeline

### 1. Prepare Data

```bash
# Create sample dataset for testing
python scripts/download_datasets.py --source sample --output data/raw/sample

# Prepare from YOLO-format data
python scripts/prepare_data.py \
  --images data/raw/images \
  --labels data/raw/labels \
  --output data/processed

# Prepare from COCO format
python scripts/prepare_data.py \
  --images data/raw/images \
  --annotations data/raw/annotations.json \
  --format coco \
  --augment
```

### 2. Train (Local GPU)

```bash
python scripts/train.py --epochs 150 --batch-size 16

# With custom settings
python scripts/train.py \
  --dataset data/dataset.yaml \
  --epochs 100 \
  --batch-size 8 \
  --lr 0.001 \
  --device cuda:0

# Resume training
python scripts/train.py --resume
```

### 3. Train (Google Colab)

Open `notebooks/train_colab.ipynb` in Google Colab:
1. Set runtime to GPU (T4)
2. Upload your dataset to Google Drive
3. Run all cells
4. Download the trained model

### 4. Evaluate

```bash
python scripts/evaluate.py --model models/best.pt --split test

# Detailed analysis
python scripts/evaluate.py --model models/best.pt --analyze --confidence-sweep
```

### 5. Export

```bash
# Export to ONNX and TFLite
python scripts/export_model.py --formats onnx tflite --benchmark
```

## 🌐 API Reference

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check & model info |
| `/detect` | POST | Detect features in uploaded image |
| `/detect/batch` | POST | Batch detection (up to 20 images) |
| `/detect/url` | POST | Detect from remote image URL |
| `/config` | GET | Current threshold settings |
| `/config` | PUT | Update thresholds at runtime |

### Example Response

```json
{
  "image_info": {"filename": "entrance.jpg", "width": 1920, "height": 1080},
  "detection_count": 3,
  "detections": [
    {
      "class_name": "wheelchair_ramp",
      "display_name": "Wheelchair Ramp",
      "type": "aid",
      "confidence": 0.87,
      "bbox": {"x1": 200, "y1": 400, "x2": 600, "y2": 700}
    },
    {
      "class_name": "stairs",
      "display_name": "Stairs/Steps",
      "type": "barrier",
      "confidence": 0.92,
      "bbox": {"x1": 700, "y1": 300, "x2": 1100, "y2": 800},
      "step_analysis": {"step_count": 5, "severity": "medium"}
    }
  ],
  "summary": {
    "accessibility_aids": ["Wheelchair Ramp"],
    "accessibility_barriers": ["Stairs/Steps"],
    "accessibility_score": 50,
    "assessment": "Fair — some aids and barriers present"
  },
  "severity_assessment": {
    "severity": "medium",
    "description": "Barriers present with limited accessibility aids"
  }
}
```

## 🐳 Docker

```bash
# Build and run
docker compose up -d

# With GPU support (uncomment gpu service in docker-compose.yml)
docker compose up -d accessmap-ml-gpu
```

## 🧪 Testing

```bash
pytest tests/ -v
```

## 📊 Datasets

| Source | Classes | Images | Link |
|--------|---------|--------|------|
| Zenodo Barriers | stairs, ramps, grab bars | 5,538 | [zenodo.org/records/6382025](https://zenodo.org/records/6382025) |
| Roboflow Universe | Various | Varies | [universe.roboflow.com](https://universe.roboflow.com) |

See `data/annotation_guide.md` for custom annotation instructions.

## 🔧 Configuration

All settings are in `config/config.yaml`:
- Model architecture and input size
- Training hyperparameters (epochs, LR, augmentation)
- Inference thresholds
- API settings (CORS, rate limiting)
- Export formats

## 📝 Integration with AccessMap Frontend

The ML API is designed to integrate with the AccessMap Next.js frontend:

```javascript
// In your Next.js API route
const formData = new FormData();
formData.append('file', imageFile);

const response = await fetch('http://localhost:8000/detect', {
  method: 'POST',
  body: formData,
});

const detections = await response.json();
// Store detections in database, display on map
```

## License

MIT
