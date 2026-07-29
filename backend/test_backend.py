import pytest
import pandas as pd
import numpy as np
from security import SQLSecurityValidator, SQLSecurityError
from eda_engine import EDAEngine
from sql_engine import DatasetManager
from nl_query_engine import NLQueryEngine

def test_sql_security_validator_pass():
    res = SQLSecurityValidator.validate_query("SELECT region, SUM(sales_amount) FROM dataset_123 GROUP BY region")
    assert res["status"] == "PASS"

def test_sql_security_validator_block_drop():
    with pytest.raises(SQLSecurityError):
        SQLSecurityValidator.validate_query("DROP TABLE dataset_123;")

def test_sql_security_validator_block_delete():
    with pytest.raises(SQLSecurityError):
        SQLSecurityValidator.validate_query("DELETE FROM dataset_123 WHERE id = 1;")

def test_eda_engine_calculation():
    df = pd.DataFrame({
        "sales": [100, 200, 300, 400, 1000],
        "category": ["A", "B", "A", "B", "A"]
    })
    eda = EDAEngine.generate_eda(df)
    assert eda["summary"]["total_rows"] == 5
    assert eda["summary"]["total_cols"] == 2
    assert eda["summary"]["quality_score"] > 80.0

def test_dataset_manager_query_execution():
    dm = DatasetManager()
    df = pd.DataFrame({
        "Region": ["North", "South", "East", "West"],
        "Revenue": [500, 300, 450, 200]
    })
    ds_id = dm.register_dataset("Test_Sales.csv", df)
    res = dm.execute_query(ds_id, "SELECT Region, Revenue FROM dataset ORDER BY Revenue DESC")
    assert res["status"] == "SUCCESS"
    assert res["row_count"] == 4
    assert res["columns"] == ["Region", "Revenue"]
    assert res["data"][0]["Region"] == "North"

def test_nl_query_engine():
    schema = [{"name": "Region", "type": "str"}, {"name": "Sales", "type": "float"}]
    translated = NLQueryEngine.translate_nl_to_sql("What are the top regions by sales?", schema, "my_table")
    assert "SELECT Region, SUM(Sales)" in translated["sql"]
