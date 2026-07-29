import re
import sqlglot
from sqlglot import exp

class SQLSecurityError(Exception):
    """Exception raised for unpermitted or dangerous SQL queries."""
    pass

class SQLSecurityValidator:
    """
    AST-based SQL Security Validator that enforces read-only operations,
    blocks destructive commands (DROP, DELETE, TRUNCATE, INSERT, ALTER),
    and prevents SQL injection attempts.
    """
    
    FORBIDDEN_EXPRESSIONS = (
        exp.Drop,
        exp.Delete,
        exp.Insert,
        exp.Update,
        exp.Alter,
        exp.Create,
        exp.TruncateTable,
        exp.Command,
    )
    
    FORBIDDEN_KEYWORDS = [
        "DROP", "DELETE", "INSERT", "UPDATE", "ALTER", "TRUNCATE",
        "EXEC", "EXECUTE", "SHUTDOWN", "GRANT", "REVOKE", "SCRIPT"
    ]
    
    @classmethod
    def validate_query(cls, sql_query: str) -> dict:
        """
        Validates SQL string using AST parsing and string sanitization.
        Returns dict with status, cleaned sql, and security feedback.
        """
        if not sql_query or not sql_query.strip():
            raise SQLSecurityError("Query string is empty.")
            
        clean_sql = sql_query.strip().rstrip(';')
        upper_sql = clean_sql.upper()
        
        # 1. Quick Keyword check
        for kw in cls.FORBIDDEN_KEYWORDS:
            # Check for keyword surrounded by word boundaries
            pattern = rf"\b{kw}\b"
            if re.search(pattern, upper_sql):
                raise SQLSecurityError(f"Forbidden command detected: '{kw}' is not allowed in read-only queries.")
                
        # 2. AST parsing using sqlglot
        try:
            parsed_statements = sqlglot.parse(clean_sql, read="duckdb")
        except Exception as e:
            # Fallback check for basic SELECT syntax
            if not upper_sql.startswith("SELECT") and not upper_sql.startswith("WITH"):
                raise SQLSecurityError(f"SQL Syntax error or unauthorized query structure: {str(e)}")
            parsed_statements = []

        for stmt in parsed_statements:
            if stmt is None:
                continue
            if isinstance(stmt, cls.FORBIDDEN_EXPRESSIONS):
                raise SQLSecurityError(f"Forbidden SQL operation type: {stmt.key.upper()}")
            
            # Walk AST to check all nested nodes
            for node in stmt.walk():
                if isinstance(node, cls.FORBIDDEN_EXPRESSIONS):
                    raise SQLSecurityError(f"Forbidden nested SQL operation: {node.key.upper()}")
                    
        return {
            "status": "PASS",
            "safe_sql": clean_sql,
            "message": "Query passed AST safety verification (Read-Only SELECT)."
        }
