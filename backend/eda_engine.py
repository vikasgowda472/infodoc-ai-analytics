import pandas as pd
import numpy as np
from sklearn.ensemble import IsolationForest
import math

class EDAEngine:
    """
    Automated Exploratory Data Analysis (EDA) Engine.
    Provides statistical profiling, correlation heatmaps, anomaly detection,
    and dataset quality health scores.
    """

    @staticmethod
    def _sanitize_float(val):
        """Converts NaN, Inf, and numpy numbers into JSON-serializable float or None."""
        if pd.isna(val) or math.isnan(val) or math.isinf(val):
            return None
        return float(val)

    @classmethod
    def generate_eda(cls, df: pd.DataFrame) -> dict:
        """
        Executes full automated EDA on the provided DataFrame.
        """
        total_rows = len(df)
        total_cols = len(df.columns)
        
        if total_rows == 0:
            return {"error": "Dataset is empty."}
            
        duplicate_rows = int(df.duplicated().sum())
        missing_cells = int(df.isna().sum().sum())
        total_cells = total_rows * total_cols
        overall_missing_pct = round((missing_cells / total_cells) * 100, 2) if total_cells > 0 else 0.0

        # Categorize columns
        numeric_cols = df.select_dtypes(include=[np.number]).columns.tolist()
        categorical_cols = df.select_dtypes(include=['object', 'category', 'string']).columns.tolist()
        datetime_cols = df.select_dtypes(include=['datetime', 'datetime64']).columns.tolist()

        # 1. Column Profiles
        columns_profile = []
        for col in df.columns:
            series = df[col]
            missing_cnt = int(series.isna().sum())
            missing_pct = round((missing_cnt / total_rows) * 100, 2)
            unique_cnt = int(series.nunique(dropna=True))

            profile = {
                "name": col,
                "data_type": str(series.dtype),
                "missing_count": missing_cnt,
                "missing_pct": missing_pct,
                "unique_count": unique_cnt,
                "sample_values": [str(v) for v in series.dropna().unique()[:5]]
            }

            # Numeric specifics
            if col in numeric_cols:
                valid_num = series.dropna()
                if len(valid_num) > 0:
                    q1 = float(valid_num.quantile(0.25))
                    q3 = float(valid_num.quantile(0.75))
                    iqr = q3 - q1
                    lower_bound = q1 - 1.5 * iqr
                    upper_bound = q3 + 1.5 * iqr
                    outliers_cnt = int(((valid_num < lower_bound) | (valid_num > upper_bound)).sum())
                    
                    profile.update({
                        "is_numeric": True,
                        "mean": cls._sanitize_float(valid_num.mean()),
                        "std": cls._sanitize_float(valid_num.std()),
                        "min": cls._sanitize_float(valid_num.min()),
                        "q25": cls._sanitize_float(q1),
                        "median": cls._sanitize_float(valid_num.median()),
                        "q75": cls._sanitize_float(q3),
                        "max": cls._sanitize_float(valid_num.max()),
                        "skewness": cls._sanitize_float(valid_num.skew()),
                        "outliers_count": outliers_cnt
                    })
                else:
                    profile.update({"is_numeric": True, "outliers_count": 0})
            else:
                profile.update({"is_numeric": False})
                # Top value frequency
                val_counts = series.value_counts().head(5)
                profile["top_categories"] = [
                    {"category": str(k), "count": int(v)} for k, v in val_counts.items()
                ]

            columns_profile.append(profile)

        # 2. Correlation Matrix
        correlation_matrix = {}
        if len(numeric_cols) > 1:
            corr_df = df[numeric_cols].corr().fillna(0)
            correlation_matrix = {
                "columns": numeric_cols,
                "matrix": corr_df.round(3).values.tolist()
            }

        # 3. Anomaly Detection via Isolation Forest & Z-Score (Optimized for speed)
        anomalies = []
        if len(numeric_cols) >= 1 and total_rows >= 10:
            try:
                num_df = df[numeric_cols].fillna(df[numeric_cols].median())
                max_s = min(250, len(num_df))
                iso = IsolationForest(n_estimators=20, max_samples=max_s, contamination=0.05, random_state=42)
                preds = iso.fit_predict(num_df)
                anomaly_indices = np.where(preds == -1)[0]

                for idx in anomaly_indices[:10]: # Top 10 anomalies
                    row_dict = df.iloc[idx].to_dict()
                    # Sanitize dictionary values
                    clean_row = {k: (cls._sanitize_float(v) if isinstance(v, (int, float, np.number)) else str(v)) for k, v in row_dict.items()}
                    anomalies.append({
                        "row_index": int(idx),
                        "data": clean_row,
                        "reason": "Flagged as statistical outlier by Isolation Forest ensemble."
                    })
            except Exception as e:
                anomalies = []

        # 4. Data Quality Score (0-100)
        completeness_score = max(0, 100 - overall_missing_pct * 2)
        duplicate_pct = (duplicate_rows / total_rows) * 100 if total_rows > 0 else 0
        uniqueness_score = max(0, 100 - duplicate_pct * 5)
        quality_score = round((completeness_score * 0.7) + (uniqueness_score * 0.3), 1)

        # 5. Automated Data Quality Alerts
        alerts = []
        if overall_missing_pct > 15:
            alerts.append({"type": "WARNING", "title": "High Missing Data", "message": f"{overall_missing_pct}% of total cells contain missing/NaN values."})
        if duplicate_rows > 0:
            alerts.append({"type": "INFO", "title": "Duplicate Rows Detected", "message": f"{duplicate_rows} duplicate row(s) found in dataset."})
        if len(anomalies) > 0:
            alerts.append({"type": "ALERT", "title": "Anomalies Identified", "message": f"Isolation Forest flagged {len(anomalies)} anomalous records for review."})

        return {
            "summary": {
                "total_rows": total_rows,
                "total_cols": total_cols,
                "duplicate_rows": duplicate_rows,
                "missing_cells": missing_cells,
                "overall_missing_pct": overall_missing_pct,
                "numeric_cols_count": len(numeric_cols),
                "categorical_cols_count": len(categorical_cols),
                "quality_score": quality_score
            },
            "columns": columns_profile,
            "correlation": correlation_matrix,
            "anomalies": anomalies,
            "alerts": alerts
        }
