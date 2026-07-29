import duckdb
import pandas as pd
import numpy as np
import time
import uuid
from security import SQLSecurityValidator, SQLSecurityError
from eda_engine import EDAEngine

class DatasetManager:
    """
    Manages in-memory DuckDB dataset instances and query execution sessions.
    """
    def __init__(self):
        self.conn = duckdb.connect(database=":memory:")
        self.datasets = {} # dataset_id -> { "name": str, "table_name": str, "df": pd.DataFrame, "eda": dict }

    def register_dataset(self, name: str, df: pd.DataFrame) -> str:
        """
        Registers a Pandas DataFrame into DuckDB as a table.
        Generates a unique dataset_id.
        """
        dataset_id = str(uuid.uuid4())[:8]
        # Clean column names to be SQL compliant (replace spaces/special chars with underscores)
        clean_cols = [c.strip().replace(" ", "_").replace("-", "_").replace(".", "_") for c in df.columns]
        df.columns = clean_cols
        
        table_name = f"dataset_{dataset_id}"
        self.conn.register(table_name, df)
        
        # Run EDA engine on dataset
        eda_summary = EDAEngine.generate_eda(df)
        
        self.datasets[dataset_id] = {
            "dataset_id": dataset_id,
            "name": name,
            "table_name": table_name,
            "df": df,
            "schema": [{"name": c, "type": str(df[c].dtype)} for c in df.columns],
            "eda": eda_summary
        }
        return dataset_id

    def get_dataset(self, dataset_id: str):
        if dataset_id not in self.datasets:
            raise KeyError(f"Dataset '{dataset_id}' not found.")
        return self.datasets[dataset_id]

    def execute_query(self, dataset_id: str, sql_query: str) -> dict:
        """
        Executes a SQL query after enforcing AST safety validation.
        Returns execution timing, status, columns, rows, and AST status.
        """
        ds = self.get_dataset(dataset_id)
        table_name = ds["table_name"]
        
        # 1. Substitute place-holder or generic table names if user referenced 'df' or 'dataset'
        clean_sql = sql_query
        clean_sql = re_replace_table(clean_sql, table_name)
        
        # 2. Security validation
        sec_result = SQLSecurityValidator.validate_query(clean_sql)
        
        start_time = time.time()
        try:
            rel = self.conn.sql(sec_result["safe_sql"])
            res_df = rel.df()
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            
            # Sanitize output values for JSON
            res_df = res_df.replace({np.nan: None})
            
            columns = res_df.columns.tolist()
            rows = res_df.to_dict(orient="records")
            
            return {
                "status": "SUCCESS",
                "ast_status": sec_result["status"],
                "security_message": sec_result["message"],
                "sql_executed": sec_result["safe_sql"],
                "execution_time_ms": elapsed_ms,
                "row_count": len(rows),
                "columns": columns,
                "data": rows
            }
        except Exception as e:
            elapsed_ms = round((time.time() - start_time) * 1000, 2)
            return {
                "status": "ERROR",
                "ast_status": "FAILED",
                "error_message": str(e),
                "sql_executed": clean_sql,
                "execution_time_ms": elapsed_ms,
                "row_count": 0,
                "columns": [],
                "data": []
            }

def re_replace_table(sql: str, actual_table: str) -> str:
    """Helper to replace table names like 'dataset', 'df', 'data', 'table' with actual DuckDB table name."""
    import re
    # Replace occurrences of FROM dataset, FROM df, FROM data (case insensitive)
    pattern = r'\bFROM\s+([a-zA-Z0-9_]+)\b'
    def sub_fn(match):
        tbl = match.group(1).lower()
        if tbl in ['dataset', 'df', 'data', 'table', 'my_table']:
            return f"FROM {actual_table}"
        return match.group(0)
    
    modified = re.sub(pattern, sub_fn, sql, flags=re.IGNORECASE)
    # If no table was specified in sql, append FROM actual_table
    if "FROM" not in modified.upper():
        modified = f"{modified} FROM {actual_table}"
    return modified
