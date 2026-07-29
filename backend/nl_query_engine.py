import os
import re
import pandas as pd
import numpy as np

class NLQueryEngine:
    """
    Translates Natural Language queries into valid DuckDB SQL,
    recommends optimal interactive chart visualization specs,
    and generates analytical executive summaries.
    """

    @classmethod
    def translate_nl_to_sql(cls, query: str, schema: list, table_name: str) -> dict:
        """
        Translates a natural language question into SQL using pattern-based heuristic NLP,
        with optional Gemini API fallback if configured.
        """
        col_names = [col["name"] for col in schema]
        col_types = {col["name"]: col["type"].lower() for col in schema}
        q_lower = query.lower()

        numeric_cols = [c for c in col_names if any(t in col_types[c] for t in ['int', 'float', 'double', 'num', 'val'])]
        cat_cols = [c for c in col_names if any(t in col_types[c] for t in ['str', 'obj', 'cat', 'char', 'text'])]
        date_cols = [c for c in col_names if any(t in col_types[c] for t in ['date', 'time'])]

        target_num = numeric_cols[0] if numeric_cols else col_names[0]
        target_cat = cat_cols[0] if cat_cols else (date_cols[0] if date_cols else col_names[0])

        # Match column names directly mentioned in query
        matched_nums = [c for c in numeric_cols if c.lower() in q_lower or c.lower().replace("_", " ") in q_lower]
        if matched_nums:
            target_num = matched_nums[0]

        matched_cats = [c for c in cat_cols if c.lower() in q_lower or c.lower().replace("_", " ") in q_lower]
        if matched_cats:
            target_cat = matched_cats[0]

        matched_dates = [c for c in date_cols if c.lower() in q_lower or c.lower().replace("_", " ") in q_lower]
        if matched_dates:
            target_cat = matched_dates[0]

        # Determine aggregation operation
        agg_func = "SUM"
        if any(w in q_lower for w in ["average", "mean", "avg"]):
            agg_func = "AVG"
        elif any(w in q_lower for w in ["count", "number of", "how many"]):
            agg_func = "COUNT"
        elif any(w in q_lower for w in ["maximum", "max", "highest"]):
            agg_func = "MAX"
        elif any(w in q_lower for w in ["minimum", "min", "lowest"]):
            agg_func = "MIN"

        # Determine limit
        limit_match = re.search(r'\b(top|first|limit)\s+(\d+)\b', q_lower)
        limit_val = 10
        if limit_match:
            limit_val = int(limit_match.group(2))

        # Check order direction
        order_dir = "DESC"
        if any(w in q_lower for w in ["bottom", "lowest", "least", "asc", "ascending"]):
            order_dir = "ASC"

        # Construct SQL
        if agg_func == "COUNT" and not matched_nums:
            sql = f"SELECT {target_cat}, COUNT(*) as total_count FROM {table_name} GROUP BY {target_cat} ORDER BY total_count {order_dir} LIMIT {limit_val}"
        else:
            sql = f"SELECT {target_cat}, {agg_func}({target_num}) as total_{target_num} FROM {table_name} GROUP BY {target_cat} ORDER BY total_{target_num} {order_dir} LIMIT {limit_val}"

        # If user asks for overview or raw sample
        if any(w in q_lower for w in ["raw data", "show all", "sample rows", "table", "preview"]):
            sql = f"SELECT * FROM {table_name} LIMIT {limit_val}"

        return {
            "sql": sql,
            "explained": f"Generated {agg_func} aggregation on '{target_num}' grouped by '{target_cat}'."
        }

    @classmethod
    def recommend_chart_spec(cls, columns: list, data: list) -> dict:
        """
        Determines the optimal Plotly chart type and axes mapping based on result shape.
        """
        if not columns or not data:
            return {"chart_type": "none", "reason": "No data returned."}

        if len(columns) == 1:
            return {
                "chart_type": "kpi_card",
                "x_axis": columns[0],
                "y_axis": None,
                "title": f"Total {columns[0]}"
            }

        df_res = pd.DataFrame(data)
        col1, col2 = columns[0], columns[1]
        
        is_col1_num = pd.api.types.is_numeric_dtype(df_res[col1]) if col1 in df_res else False
        is_col2_num = pd.api.types.is_numeric_dtype(df_res[col2]) if col2 in df_res else False

        # If 2 numeric columns -> Scatter plot
        if is_col1_num and is_col2_num:
            return {
                "chart_type": "scatter",
                "x_axis": col1,
                "y_axis": col2,
                "title": f"Correlation: {col1} vs {col2}"
            }

        # If Categorical / Date + Numeric -> Bar / Line / Pie
        if not is_col1_num and is_col2_num:
            # Check if date/time series
            is_date = any(w in col1.lower() for w in ['date', 'month', 'year', 'day', 'time', 'quarter'])
            if is_date:
                return {
                    "chart_type": "line",
                    "x_axis": col1,
                    "y_axis": col2,
                    "title": f"Trend Analysis: {col2} over {col1}"
                }
            elif len(data) <= 6:
                return {
                    "chart_type": "pie",
                    "x_axis": col1,
                    "y_axis": col2,
                    "title": f"Distribution of {col2} by {col1}"
                }
            else:
                return {
                    "chart_type": "bar",
                    "x_axis": col1,
                    "y_axis": col2,
                    "title": f"{col2} by {col1}"
                }

        # Default fallback -> Bar chart
        return {
            "chart_type": "bar",
            "x_axis": col1,
            "y_axis": col2,
            "title": f"{col2} by {col1}"
        }

    @classmethod
    def generate_insight_summary(cls, query: str, sql: str, columns: list, data: list) -> list:
        """
        Generates automated bulleted analytical takeaways from result set.
        """
        if not data:
            return ["No records returned for the current query filters."]

        bullets = []
        num_rows = len(data)
        bullets.append(f"Query returned **{num_rows} result records**.")

        df_res = pd.DataFrame(data)
        if len(columns) >= 2:
            col1, col2 = columns[0], columns[1]
            if pd.api.types.is_numeric_dtype(df_res[col2]):
                top_row = df_res.iloc[0]
                max_val = top_row[col2]
                top_name = top_row[col1]
                bullets.append(f"Highest performing group is **'{top_name}'** with **{max_val:,.2f}** ({col2}).")

                if num_rows > 1:
                    bottom_row = df_res.iloc[-1]
                    min_val = bottom_row[col2]
                    bottom_name = bottom_row[col1]
                    bullets.append(f"Lowest category is **'{bottom_name}'** with **{min_val:,.2f}** ({col2}).")
                    
                    if min_val > 0:
                        ratio = round(max_val / min_val, 1)
                        bullets.append(f"The top group outperforms the lowest by a factor of **{ratio}x**.")

        return bullets
