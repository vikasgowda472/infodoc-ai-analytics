import React, { useState } from 'react';
import Plot from 'react-plotly.js';
import { Search, Code2, ShieldCheck, Download, Sparkles, BarChart2, LineChart, PieChart } from 'lucide-react';

export default function QueryStudio({ datasetId, schema }) {
  const [queryText, setQueryText] = useState('What are the top 5 sales categories by total revenue?');
  const [isRawSql, setIsRawSql] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [overrideChartType, setOverrideChartType] = useState(null);

  const sampleQuestions = [
    "What are the top sales categories by total revenue?",
    "Show sales trend over time",
    "Compare average order value by region",
    "Which customer segment has the highest discount percentage?",
    "Show monthly charges distribution by plan tier"
  ];

  const handleExecuteQuery = async (queryToRun = queryText) => {
    if (!queryToRun.trim()) return;
    setIsLoading(true);

    try {
      const res = await fetch('/api/query', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataset_id: datasetId,
          query: queryToRun,
          is_raw_sql: isRawSql
        })
      });
      const data = await res.json();
      setResult(data);
      setOverrideChartType(null);
    } catch (err) {
      alert('Error executing query: ' + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const exportCSV = () => {
    if (!result || !result.data || result.data.length === 0) return;
    const keys = Object.keys(result.data[0]);
    const csvRows = [keys.join(',')];
    result.data.forEach(row => {
      const vals = keys.map(k => JSON.stringify(row[k] ?? ''));
      csvRows.push(vals.join(','));
    });
    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `query_result_${datasetId}.csv`;
    a.click();
  };

  // Build Plotly visual spec dynamically
  let plotlyPlot = null;
  if (result && result.status === 'SUCCESS' && result.data && result.data.length > 0) {
    const chartSpec = result.chart_spec || {};
    const chartType = overrideChartType || chartSpec.chart_type || 'bar';
    const xAxis = chartSpec.x_axis || result.columns[0];
    const yAxis = chartSpec.y_axis || result.columns[1] || result.columns[0];

    const xVals = result.data.map(d => d[xAxis]);
    const yVals = result.data.map(d => d[yAxis]);

    let trace = {
      x: xVals,
      y: yVals,
      type: chartType === 'pie' ? 'pie' : (chartType === 'line' ? 'scatter' : chartType),
      mode: chartType === 'line' ? 'lines+markers' : undefined,
      labels: chartType === 'pie' ? xVals : undefined,
      values: chartType === 'pie' ? yVals : undefined,
      marker: {
        color: ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1']
      }
    };

    plotlyPlot = {
      data: [trace],
      layout: {
        title: { text: chartSpec.title || `${yAxis} by ${xAxis}`, font: { color: '#f8fafc', size: 15 } },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { color: '#94a3b8' },
        margin: { l: 60, r: 20, t: 50, b: 60 },
        autosize: true
      }
    };
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Search Input Box */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Sparkles size={18} color="#06b6d4" /> Ask Anything in Natural Language
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className={`btn-secondary ${isRawSql ? 'active' : ''}`}
              style={{ fontSize: '0.75rem', background: isRawSql ? 'rgba(6, 182, 212, 0.2)' : '' }}
              onClick={() => setIsRawSql(!isRawSql)}
            >
              <Code2 size={14} /> {isRawSql ? 'Raw SQL Mode ON' : 'Natural Language Mode'}
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <input
            type="text"
            value={queryText}
            onChange={(e) => setQueryText(e.target.value)}
            placeholder={isRawSql ? "Enter SQL e.g., SELECT category, SUM(sales_amount) FROM dataset GROUP BY category" : "e.g., What are top 5 regions by profit?"}
            onKeyDown={(e) => e.key === 'Enter' && handleExecuteQuery()}
            style={{
              flex: 1,
              background: 'var(--bg-secondary)',
              border: '1px solid var(--border-color)',
              color: 'var(--text-primary)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.95rem',
              outline: 'none'
            }}
          />
          <button className="btn-primary" onClick={() => handleExecuteQuery()} disabled={isLoading}>
            <Search size={16} /> {isLoading ? 'Analyzing...' : 'Run Query'}
          </button>
        </div>

        {/* Suggested Question Chips */}
        {!isRawSql && (
          <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Try asking:</span>
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => { setQueryText(q); handleExecuteQuery(q); }}
                style={{
                  background: 'rgba(255, 255, 255, 0.04)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-secondary)',
                  borderRadius: '999px',
                  padding: '0.25rem 0.65rem',
                  fontSize: '0.75rem',
                  cursor: 'pointer'
                }}
              >
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Query Results Section */}
      {result && (
        <>
          {/* SQL & Security AST Bar */}
          <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
              <span className="badge-pass">
                <ShieldCheck size={14} /> AST Security: {result.ast_status || 'PASS'}
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                Latency: <strong>{result.execution_time_ms} ms</strong> | Rows: <strong>{result.row_count}</strong>
              </span>
            </div>
            
            <div className="font-mono" style={{ fontSize: '0.8rem', background: 'rgba(0,0,0,0.3)', padding: '0.4rem 0.8rem', borderRadius: '6px', color: '#38bdf8' }}>
              {result.sql_executed}
            </div>
          </div>

          {/* Visualization + AI Takeaways Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
            
            {/* Plotly Chart Card */}
            <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '380px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Interactive Analytics Visualizer</h4>
                <div style={{ display: 'flex', gap: '0.3rem' }}>
                  <button className="btn-secondary" style={{ padding: '0.3rem 0.5rem' }} onClick={() => setOverrideChartType('bar')} title="Bar Chart">
                    <BarChart2 size={14} />
                  </button>
                  <button className="btn-secondary" style={{ padding: '0.3rem 0.5rem' }} onClick={() => setOverrideChartType('line')} title="Line Chart">
                    <LineChart size={14} />
                  </button>
                  <button className="btn-secondary" style={{ padding: '0.3rem 0.5rem' }} onClick={() => setOverrideChartType('pie')} title="Pie Chart">
                    <PieChart size={14} />
                  </button>
                </div>
              </div>

              {plotlyPlot ? (
                <Plot
                  data={plotlyPlot.data}
                  layout={plotlyPlot.layout}
                  useResizeHandler={true}
                  style={{ width: '100%', height: '300px' }}
                  config={{ displayModeBar: false }}
                />
              ) : (
                <p style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '3rem' }}>No visual data available.</p>
              )}
            </div>

            {/* AI Takeaway Insights Bullet List */}
            <div className="glass-panel" style={{ padding: '1.5rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Sparkles size={18} color="#8b5cf6" /> Automated AI Key Takeaways
              </h4>
              {result.insights && result.insights.length > 0 ? (
                <ul style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', paddingLeft: '1.2rem', fontSize: '0.85rem', color: 'var(--text-primary)' }}>
                  {result.insights.map((bullet, idx) => (
                    <li key={idx} dangerouslySetInnerHTML={{ __html: bullet.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#06b6d4">$1</strong>') }} />
                  ))}
                </ul>
              ) : (
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No automated takeaways generated for this query shape.</p>
              )}
            </div>

          </div>

          {/* Results Tabular Data Grid */}
          <div className="glass-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600 }}>Query Result Tabular Data</h4>
              <button className="btn-secondary" onClick={exportCSV} style={{ fontSize: '0.8rem' }}>
                <Download size={14} /> Export CSV
              </button>
            </div>

            <div style={{ overflowX: 'auto', maxHeight: '300px' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', position: 'sticky', top: 0, background: 'var(--bg-secondary)' }}>
                    {result.columns.map((col, idx) => (
                      <th key={idx} style={{ padding: '0.6rem 0.8rem' }}>{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {result.data.map((row, rIdx) => (
                    <tr key={rIdx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      {result.columns.map((col, cIdx) => (
                        <td key={cIdx} style={{ padding: '0.6rem 0.8rem' }}>
                          {row[col] !== null ? String(row[col]) : <span style={{ color: 'var(--text-secondary)' }}>NULL</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </>
      )}

    </div>
  );
}
