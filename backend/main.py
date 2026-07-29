from fastapi import FastAPI, UploadFile, File, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import io
import json

from sql_engine import DatasetManager
from nl_query_engine import NLQueryEngine

app = FastAPI(
    title="InfoDoc AI Data Intelligence API",
    version="1.0.0",
    description="Backend API for Natural Language Data Analytics, Automated EDA, AST-validated SQL, and Executive BI Reports."
)

# CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global dataset manager instance
db_manager = DatasetManager()

# Helper function to generate mock synthetic datasets for instant out-of-the-box demo
def init_sample_datasets():
    np.random.seed(42)
    
    # 1. Retail E-Commerce Sales (500 rows)
    dates = pd.date_range(start="2023-01-01", periods=100, freq="D").strftime('%Y-%m-%d').tolist()
    regions = ["North America", "Europe", "Asia-Pacific", "Latin America"]
    categories = ["Electronics", "Apparel", "Home & Kitchen", "Books", "Beauty"]
    
    retail_data = {
        "Order_ID": [f"ORD-{1000+i}" for i in range(300)],
        "Order_Date": np.random.choice(dates, 300),
        "Region": np.random.choice(regions, 300, p=[0.4, 0.3, 0.2, 0.1]),
        "Category": np.random.choice(categories, 300),
        "Sales_Amount": np.round(np.random.exponential(scale=150, size=300) + 20, 2),
        "Quantity": np.random.randint(1, 10, size=300),
        "Discount_Pct": np.round(np.random.choice([0, 0.05, 0.1, 0.15, 0.2], size=300), 2),
        "Customer_Rating": np.round(np.random.normal(loc=4.2, scale=0.6, size=300).clip(1, 5), 1)
    }
    retail_df = pd.DataFrame(retail_data)
    retail_df["Profit"] = np.round(retail_df["Sales_Amount"] * (0.3 - retail_df["Discount_Pct"]), 2)
    db_manager.register_dataset("Retail_Sales_2023.csv", retail_df)

    # 2. SaaS Customer Churn Analytics (200 rows)
    plans = ["Basic", "Pro", "Enterprise"]
    churn_data = {
        "Customer_ID": [f"CUST-{5000+i}" for i in range(200)],
        "Plan_Tier": np.random.choice(plans, 200, p=[0.5, 0.35, 0.15]),
        "Monthly_Charges": np.round(np.random.uniform(29, 299, size=200), 2),
        "Tenure_Months": np.random.randint(1, 48, size=200),
        "Support_Tickets": np.random.poisson(lam=2, size=200),
        "Churned": np.random.choice(["Yes", "No"], 200, p=[0.22, 0.78])
    }
    churn_df = pd.DataFrame(churn_data)
    db_manager.register_dataset("SaaS_Customer_Churn.csv", churn_df)

# Initialize sample datasets on startup
init_sample_datasets()

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "InfoDoc AI Data Intelligence API"}

@app.get("/api/datasets")
def list_datasets():
    """Returns list of currently loaded datasets."""
    datasets_info = []
    for ds_id, info in db_manager.datasets.items():
        datasets_info.append({
            "dataset_id": ds_id,
            "name": info["name"],
            "rows_count": info["eda"]["summary"]["total_rows"],
            "cols_count": info["eda"]["summary"]["total_cols"],
            "quality_score": info["eda"]["summary"]["quality_score"]
        })
    return {"status": "SUCCESS", "datasets": datasets_info}

@app.post("/api/upload")
async def upload_file(file: UploadFile = File(...)):
    """Uploads a CSV or Excel file and registers it in DuckDB."""
    contents = await file.read()
    filename = file.filename
    
    try:
        if filename.endswith(".csv"):
            df = pd.read_csv(io.BytesIO(contents))
        elif filename.endswith((".xls", ".xlsx")):
            df = pd.read_excel(io.BytesIO(contents))
        elif filename.endswith(".json"):
            df = pd.read_json(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported file format. Please upload CSV, Excel, or JSON.")
            
        ds_id = db_manager.register_dataset(filename, df)
        return {
            "status": "SUCCESS",
            "message": f"Successfully registered '{filename}'",
            "dataset_id": ds_id
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

@app.get("/api/eda/{dataset_id}")
def get_eda(dataset_id: str):
    """Fetches automated EDA findings and health score for a dataset."""
    try:
        ds = db_manager.get_dataset(dataset_id)
        return {
            "status": "SUCCESS",
            "dataset_name": ds["name"],
            "schema": ds["schema"],
            "eda": ds["eda"]
        }
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

@app.post("/api/query")
def execute_nl_or_sql_query(payload: dict):
    """
    Handles natural language query or raw SQL query execution.
    Input payload: { "dataset_id": str, "query": str, "is_raw_sql": bool }
    """
    dataset_id = payload.get("dataset_id")
    query_text = payload.get("query", "").strip()
    is_raw_sql = payload.get("is_raw_sql", False)

    if not dataset_id or not query_text:
        raise HTTPException(status_code=400, detail="dataset_id and query are required.")

    try:
        ds = db_manager.get_dataset(dataset_id)
        table_name = ds["table_name"]
        
        if is_raw_sql:
            sql = query_text
            explanation = "Executed custom SQL query."
        else:
            translation = NLQueryEngine.translate_nl_to_sql(query_text, ds["schema"], table_name)
            sql = translation["sql"]
            explanation = translation["explained"]

        # Execute query with AST security validation
        res = db_manager.execute_query(dataset_id, sql)

        if res["status"] == "SUCCESS":
            # Recommend chart and generate insight bullets
            chart_spec = NLQueryEngine.recommend_chart_spec(res["columns"], res["data"])
            insights = NLQueryEngine.generate_insight_summary(query_text, sql, res["columns"], res["data"])
            res["explanation"] = explanation
            res["chart_spec"] = chart_spec
            res["insights"] = insights
            
        return res

    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/report/{dataset_id}")
def generate_report(dataset_id: str):
    """Generates executive BI summary report payload."""
    try:
        ds = db_manager.get_dataset(dataset_id)
        eda = ds["eda"]
        
        # Run top 2 automated queries for highlights
        q1 = db_manager.execute_query(dataset_id, f"SELECT * FROM {ds['table_name']} LIMIT 5")
        
        return {
            "status": "SUCCESS",
            "dataset_name": ds["name"],
            "total_records": eda["summary"]["total_rows"],
            "data_quality_score": eda["summary"]["quality_score"],
            "columns_count": eda["summary"]["total_cols"],
            "alerts": eda["alerts"],
            "sample_records": q1.get("data", []),
            "top_anomalies": eda["anomalies"][:3]
        }
    except KeyError as e:
        raise HTTPException(status_code=404, detail=str(e))

# Mount Built React Frontend Static Files (for Render / Production Deployment)
from fastapi.staticfiles import StaticFiles
import os

frontend_dist = os.path.abspath(os.path.join(os.path.dirname(__file__), "../frontend/dist"))
if os.path.exists(frontend_dist):
    app.mount("/", StaticFiles(directory=frontend_dist, html=True), name="static")
