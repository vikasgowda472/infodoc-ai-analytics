import React from 'react';
import Plot from 'react-plotly.js';
import { Activity, AlertTriangle, ShieldCheck, Hash, Layers, PieChart } from 'lucide-react';

export default function EDADashboard({ edaData }) {
  if (!edaData || !edaData.eda) {
    return <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>Loading automated EDA metrics...</div>;
  }

  const { summary, columns, correlation, anomalies, alerts } = edaData.eda;

  // Correlation heatmap setup
  let correlationPlot = null;
  if (correlation && correlation.columns && correlation.matrix) {
    correlationPlot = {
      data: [{
        z: correlation.matrix,
        x: correlation.columns,
        y: correlation.columns,
        type: 'heatmap',
        colorscale: 'Viridis'
      }],
      layout: {
        title: { text: 'Automated Pearson Correlation Matrix', font: { color: '#f8fafc', size: 14 } },
        paper_bgcolor: 'transparent',
        plot_bgcolor: 'transparent',
        font: { color: '#94a3b8' },
        margin: { l: 80, r: 20, t: 40, b: 80 },
        autosize: true
      }
    };
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Top Overview Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* Health Score Card */}
        <div className="glass-card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Data Quality Score</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: summary.quality_score > 80 ? '#10b981' : '#f59e0b' }}>
              {summary.quality_score} <span style={{ fontSize: '1rem' }}>/ 100</span>
            </div>
          </div>
          <div style={{ background: 'rgba(16, 185, 129, 0.15)', padding: '0.6rem', borderRadius: '12px' }}>
            <ShieldCheck size={28} color="#10b981" />
          </div>
        </div>

        {/* Rows Card */}
        <div className="glass-card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Row Count</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{summary.total_rows.toLocaleString()}</div>
          </div>
          <div style={{ background: 'rgba(6, 182, 212, 0.15)', padding: '0.6rem', borderRadius: '12px' }}>
            <Layers size={28} color="#06b6d4" />
          </div>
        </div>

        {/* Columns Card */}
        <div className="glass-card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Features (Columns)</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 700 }}>{summary.total_cols}</div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{summary.numeric_cols_count} Numeric | {summary.categorical_cols_count} Categorical</span>
          </div>
          <div style={{ background: 'rgba(59, 130, 246, 0.15)', padding: '0.6rem', borderRadius: '12px' }}>
            <Hash size={28} color="#3b82f6" />
          </div>
        </div>

        {/* Missing Cells Card */}
        <div className="glass-card" style={{ padding: '1.2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Missing Data Ratio</span>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: summary.overall_missing_pct > 10 ? '#f43f5e' : 'var(--text-primary)' }}>
              {summary.overall_missing_pct}%
            </div>
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>{summary.missing_cells} empty cell(s)</span>
          </div>
          <div style={{ background: 'rgba(245, 158, 11, 0.15)', padding: '0.6rem', borderRadius: '12px' }}>
            <PieChart size={28} color="#f59e0b" />
          </div>
        </div>

      </div>

      {/* Alerts Section */}
      {alerts && alerts.length > 0 && (
        <div className="glass-panel" style={{ padding: '1.2rem 1.5rem' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="#f59e0b" /> Automated Quality & Anomaly Alerts
          </h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            {alerts.map((al, idx) => (
              <div key={idx} className="glass-card" style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <strong style={{ color: al.type === 'ALERT' ? '#f43f5e' : '#f59e0b', fontSize: '0.85rem' }}>{al.title}: </strong>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)' }}>{al.message}</span>
                </div>
                <span className={al.type === 'ALERT' ? 'badge-alert' : 'badge-info'}>{al.type}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Correlation & Column Profiling Split Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem' }}>
        
        {/* Heatmap Panel */}
        <div className="glass-panel" style={{ padding: '1.5rem', minHeight: '400px' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Activity size={18} color="#06b6d4" /> Feature Correlation Analysis
          </h4>
          {correlationPlot ? (
            <Plot
              data={correlationPlot.data}
              layout={correlationPlot.layout}
              useResizeHandler={true}
              style={{ width: '100%', height: '320px' }}
              config={{ displayModeBar: false }}
            />
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', textAlign: 'center', marginTop: '3rem' }}>
              Insufficient numeric columns to render correlation matrix.
            </p>
          )}
        </div>

        {/* Isolation Forest Anomaly Cards */}
        <div className="glass-panel" style={{ padding: '1.5rem', maxHeight: '450px', overflowY: 'auto' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={18} color="#f43f5e" /> Isolation Forest Ensemble Anomalies ({anomalies ? anomalies.length : 0})
          </h4>
          {anomalies && anomalies.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
              {anomalies.map((anom, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '0.8rem', borderLeft: '4px solid #f43f5e' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f43f5e', marginBottom: '0.3rem' }}>
                    Record #{anom.row_index} - {anom.reason}
                  </div>
                  <pre className="font-mono" style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.2)', padding: '0.5rem', borderRadius: '6px', overflowX: 'auto' }}>
                    {JSON.stringify(anom.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>No statistical anomalies detected by ensemble models.</p>
          )}
        </div>

      </div>

      {/* Feature Profiling Table */}
      <div className="glass-panel" style={{ padding: '1.5rem' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '1rem' }}>Detailed Column Profiling & Statistics</h4>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                <th style={{ padding: '0.6rem 0.8rem' }}>Column Name</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Type</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Missing %</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Unique Values</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Mean / Top</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Median</th>
                <th style={{ padding: '0.6rem 0.8rem' }}>Outliers (IQR)</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((col, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <td style={{ padding: '0.6rem 0.8rem', fontWeight: 600, color: '#06b6d4' }}>{col.name}</td>
                  <td style={{ padding: '0.6rem 0.8rem' }}><span className="font-mono">{col.data_type}</span></td>
                  <td style={{ padding: '0.6rem 0.8rem', color: col.missing_pct > 10 ? '#f43f5e' : '' }}>{col.missing_pct}%</td>
                  <td style={{ padding: '0.6rem 0.8rem' }}>{col.unique_count}</td>
                  <td style={{ padding: '0.6rem 0.8rem' }}>
                    {col.is_numeric ? (col.mean !== null ? col.mean.toFixed(2) : '-') : (col.top_categories?.[0]?.category || '-')}
                  </td>
                  <td style={{ padding: '0.6rem 0.8rem' }}>
                    {col.is_numeric ? (col.median !== null ? col.median.toFixed(2) : '-') : '-'}
                  </td>
                  <td style={{ padding: '0.6rem 0.8rem', color: col.outliers_count > 0 ? '#f59e0b' : '' }}>
                    {col.outliers_count || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
