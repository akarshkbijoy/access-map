# AccessMap

> **AI-Powered Urban Accessibility Mapping & Barrier Detection Platform**

AccessMap is an interactive map and navigation platform designed to empower individuals with mobility needs. By combining **MapLibre GL** for responsive spatial navigation with **YOLOv8** computer vision models, AccessMap identifies accessibility aids (ramps, elevators, tactile paving, grab bars) and highlights physical barriers (stairs, steps, obstacles) across urban environments.

---

## 🏗️ Repository Architecture

This repository is structured as a monorepo containing both the web application and the machine learning inference microservice:

```
access-map/
├── app/                  # Next.js 16 App Router (pages & API routes)
├── components/           # Reusable UI components & map widgets
├── lib/                  # Utilities, database clients, and helpers
├── prisma/               # Database schema & migrations
├── public/               # Static assets & map markers
├── access-map-ml/        # 🤖 Machine learning pipeline & FastAPI microservice
│   ├── config/           # Training & model configuration
│   ├── data/             # Dataset configurations & annotation guides
│   ├── notebooks/        # Jupyter / Google Colab training notebooks
│   ├── scripts/          # Data preparation, training, and export scripts
│   ├── src/              # FastAPI server, detection & evaluation code
│   └── README.md         # Dedicated ML service documentation & class definitions
└── README.md             # Project overview & application setup (this file)
```

---

## 🛠️ Tech Stack

- **Frontend & Web Core**: [Next.js](https://nextjs.org/) (App Router), [React 19](https://react.dev/), Tailwind CSS
- **Interactive Mapping**: [MapLibre GL](https://maplibre.org/)
- **Database & Auth**: [Prisma ORM](https://www.prisma.io/), [Supabase](https://supabase.com/)
- **ML / Computer Vision**: [FastAPI](https://fastapi.tiangolo.com/), [Ultralytics YOLOv8](https://github.com/ultralytics/ultralytics), PyTorch, OpenCV

---

## 🚀 Getting Started

### 1. Web Application (Next.js)

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
npx prisma db push

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 2. Machine Learning Service (FastAPI + YOLOv8)

For comprehensive details on training datasets, detected classes, and API specifications, refer to the [ML Service Documentation](access-map-ml/README.md).

```bash
cd access-map-ml

# Set up virtual environment
python -m venv venv
venv\Scripts\activate      # On Windows
# source venv/bin/activate # On Linux/macOS

# Install dependencies
pip install -r requirements.txt

# Start the ML API server
uvicorn src.api.main:app --host 0.0.0.0 --port 8000 --reload
```

Interactive Swagger API docs will be available at [http://localhost:8000/docs](http://localhost:8000/docs).

---

## 📦 Model Weights & Data Handling

To maintain repository performance and avoid GitHub's 100 MB file limit:
- Model weights (`.pt`, `.onnx`) and raw training datasets (`data/raw/`, `data/processed/`) are **excluded from Git tracking**.
- Download pretrained weights using the script provided in `access-map-ml/scripts/` or check the repository [Releases](https://github.com/akarshkbijoy/access-map/releases) page.

---

## 📄 License

This project is open-source and available under the [MIT License](LICENSE).
