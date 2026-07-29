# InfoDoc — Autonomous AI Data Intelligence & Power BI Studio

![InfoDoc Banner](https://img.shields.io/badge/InfoDoc-AI%20Data%20Analytics-06b6d4?style=for-the-badge&logo=react)
![Python](https://img.shields.io/badge/Python-3.11-blue?style=for-the-badge&logo=python)
![FastAPI](https://img.shields.io/badge/FastAPI-0.110-009688?style=for-the-badge&logo=fastapi)
![DuckDB](https://img.shields.io/badge/DuckDB-1.0-fff000?style=for-the-badge&logo=duckdb)
![React](https://img.shields.io/badge/React-18-61dafb?style=for-the-badge&logo=react)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

> An enterprise-grade, autonomous Data Analytics and Business Intelligence (BI) platform. **InfoDoc** enables users to upload structured datasets (CSV, Excel, JSON), performs automated Exploratory Data Analysis (EDA), detects multivariate machine learning anomalies using Isolation Forest, translates natural language into AST-validated SQL, and renders interactive Power BI-style dashboards with executive PDF report exports.

---

## 🌟 Key Features

### 📊 1. Power BI Analytics Overview Canvas
- **Executive KPI Scorecards:** Real-time metrics for total volume, transaction counts, segment leaders, and per-unit averages.
- **Interactive Visual Slicers:** Dynamic multi-category filter bar updating all visuals instantaneously.
- **Gestalt Visualization Layout:** Clustered column bar charts, donut market-share visuals, and time-trend line plots.
- **Matrix Performance Table with Data Bars:** Implements Power BI data bar visual rules for relative volume weighting.

### 🔬 2. Automated Exploratory Data Analysis (EDA)
- **Data Health Score Index (0–100):** Evaluates dataset completeness, row uniqueness, and missing value ratios.
- **Feature Correlation Matrix:** Automated Pearson correlation heatmap highlighting inter-feature dependencies.
- **Machine Learning Anomaly Detection:** Scikit-learn **Isolation Forest ensemble model** flagging multivariate statistical outliers.
- **Column Profiling:** Outlier counts (IQR), skewness, missing value ratios, and distribution metrics.

### 💬 3. Natural Language Query & AST SQL Guardrails
- **Text-to-SQL Engine:** Translates plain English business questions into optimized DuckDB SQL queries.
- **AST Security Validator:** Uses `sqlglot` to parse AST syntax and strictly block non-read-only operations (`DROP`, `DELETE`, `TRUNCATE`, `ALTER`).
- **AI Analytical Takeaways:** Automated bulleted narrative summaries generated for query output shapes.

### 📄 4. Executive BI Briefing & Clean PDF Export
- **Print-Optimized PDF Export:** `@media print` rules strip web app chrome (navigation bars, workspace panels) to output a clean, paper-formatted executive PDF document.
- **Clean Document Export (.txt):** Standalone text report generation summarizing governance findings and anomaly logs.

---

## 🏗️ System Architecture

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                        React 18 + Vite Frontend                        │
 │ ┌──────────────────┐  ┌───────────────────┐  ┌───────────────────────┐ │
 │ │  Dataset Workspace│ │  NL Query Studio  │  │   Power BI Dashboard  │ │
 │ │ (CSV/Excel/JSON) │  │  + AST Validator  │  │ (Plotly / ECharts)    │ │
 │ └─────────┬────────┘  └─────────┬─────────┘  └───────────▲───────────┘ │
 └───────────┼─────────────────────┼────────────────────────┼─────────────┘
             │ HTTP REST (/api)    │ HTTP                   │
 ┌───────────▼─────────────────────▼────────────────────────┴─────────────┐
 │                         FastAPI Backend Engine                         │
 │ ┌──────────────────┐  ┌───────────────────┐  ┌───────────────────────┐ │
 │ │  DuckDB Storage  │  │  EDA & Statistics │  │ NL-to-SQL + AST Guard │ │
 │ │  & Query Engine  │  │ (IsolationForest) │  │ (Read-Only SELECT)    │ │
 │ └──────────────────┘  └───────────────────┘  └───────────────────────┘ │
 └────────────────────────────────────────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

| Layer | Technologies Used |
| :--- | :--- |
| **Frontend** | React 18, Vite, Plotly.js, Lucide Icons, Vanilla CSS (Glassmorphism design system) |
| **Backend API** | Python 3.11, FastAPI, Uvicorn, Python-Multipart |
| **Data & Query Engine**| DuckDB (In-Memory SQL), Pandas, NumPy, OpenPyXL |
| **Machine Learning** | Scikit-Learn (Isolation Forest Ensemble Outlier Detection) |
| **Security & Parsing**| SQLGlot (AST Syntax Validation & Security Sanitization) |
| **Deployment** | Render (Unified Single-Service Python & Static Build Deployment) |

---

## 🚀 Local Installation & Setup

### Prerequisites
- Python 3.10+
- Node.js 18+ and npm

### 1. Clone Repository
```bash
git clone https://github.com/vikasgowda472/infodoc-ai-analytics.git
cd infodoc-ai-analytics
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
# On Windows:
.\venv\Scripts\Activate.ps1
# On macOS/Linux:
source venv/bin/activate

pip install -r requirements.txt
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```
*Backend runs at:* `http://127.0.0.1:8000`

### 3. Frontend Setup
```bash
cd ../frontend
npm install
npm run dev
```
*Frontend runs at:* `http://localhost:3000`

---

## 🌐 Production Deployment (Render)

This repository is pre-configured with a **`render.yaml`** blueprint for single-service deployment on Render.

1. Push code to your GitHub repository.
2. Go to **[Render Dashboard](https://dashboard.render.com/)** -> **New + Web Service**.
3. Connect your repository.
4. Set Build Command:
   ```bash
   pip install -r backend/requirements.txt && cd frontend && npm install && npm run build
   ```
5. Set Start Command:
   ```bash
   cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

---

## 📝 License

Distributed under the **MIT License**. See `LICENSE` for more information.

---

### 👨‍💻 Author
Developed by **Vikas Gowda**  
* GitHub: [@vikasgowda472](https://github.com/vikasgowda472)
