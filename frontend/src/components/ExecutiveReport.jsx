import React, { useState, useEffect } from 'react';
import { Printer, ShieldCheck, AlertTriangle, FileSpreadsheet, CheckCircle, Download } from 'lucide-react';

export default function ExecutiveReport({ datasetId }) {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!datasetId) return;
    fetch(`/api/report/${datasetId}`)
      .then(res => res.json())
      .then(data => { setReport(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [datasetId]);

  const downloadTextReport = () => {
    if (!report) return;

    let text = `========================================================================\n`;
    text += `               INFODOC EXECUTIVE DATA ANALYTICS REPORT                 \n`;
    text += `========================================================================\n\n`;
    text += `DATASET FILE NAME  : ${report.dataset_name}\n`;
    text += `REPORT DATE        : ${new Date().toLocaleString()}\n`;
    text += `OVERALL HEALTH     : ${report.data_quality_score} / 100 Index\n`;
    text += `TOTAL RECORDS      : ${report.total_records.toLocaleString()}\n`;
    text += `TOTAL ATTRIBUTES   : ${report.columns_count}\n\n`;

    text += `------------------------------------------------------------------------\n`;
    text += `1. DATA GOVERNANCE & INTEGRITY FINDINGS\n`;
    text += `------------------------------------------------------------------------\n`;
    if (report.alerts && report.alerts.length > 0) {
      report.alerts.forEach((al, i) => {
        text += `  [${al.type}] ${al.title}: ${al.message}\n`;
      });
    } else {
      text += `  - High data cleanliness score. No critical integrity warnings.\n`;
    }
    text += `\n`;

    text += `------------------------------------------------------------------------\n`;
    text += `2. MACHINE LEARNING ISOLATION FOREST ANOMALIES\n`;
    text += `------------------------------------------------------------------------\n`;
    if (report.top_anomalies && report.top_anomalies.length > 0) {
      report.top_anomalies.forEach((anom) => {
        text += `  - Row #${anom.row_index}: ${anom.reason}\n`;
        text += `    Data: ${JSON.stringify(anom.data)}\n`;
      });
    } else {
      text += `  - No multivariate anomalies detected.\n`;
    }
    text += `\n`;

    text += `------------------------------------------------------------------------\n`;
    text += `3. SAMPLE DATASET RECORDS (TOP 5)\n`;
    text += `------------------------------------------------------------------------\n`;
    if (report.sample_records && report.sample_records.length > 0) {
      const keys = Object.keys(report.sample_records[0]);
      text += `  ${keys.join(" | ")}\n`;
      report.sample_records.forEach((row) => {
        const vals = keys.map(k => String(row[k] ?? ''));
        text += `  ${vals.join(" | ")}\n`;
      });
    }
    text += `\n========================================================================\n`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `InfoDoc_Report_${report.dataset_name}.txt`;
    a.click();
  };

  if (loading || !report) {
    return <div className="glass-panel" style={{ padding: '2rem', textAlign: 'center' }}>Generating Executive BI Report...</div>;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {/* Action Bar (Hidden during print) */}
      <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 700 }}>Executive BI Briefing Report</h2>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Automated analytical summary for dataset: <strong>{report.dataset_name}</strong></span>
        </div>
        <div style={{ display: 'flex', gap: '0.6rem' }}>
          <button className="btn-secondary" onClick={downloadTextReport}>
            <Download size={16} /> Export Clean Document (.txt)
          </button>
          <button className="btn-primary" onClick={() => window.print()}>
            <Printer size={16} /> Print Clean PDF Report
          </button>
        </div>
      </div>

      {/* Main Report Container (Formatted for Clean Document Printing) */}
      <div className="glass-panel printable-document" style={{ padding: '2.5rem', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Document Header Banner */}
        <div style={{ borderBottom: '2px solid var(--border-color)', paddingBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 className="gradient-text" style={{ fontSize: '1.8rem', fontWeight: 800 }}>Dataset Audit & Insight Briefing</h1>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Source File: <strong>{report.dataset_name}</strong> | InfoDoc Autonomous Analytics Engine
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '2rem', fontWeight: 800, color: '#10b981' }}>{report.data_quality_score}/100</div>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Overall Health Index</span>
          </div>
        </div>

        {/* Core Metrics Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Observations</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.2rem' }}>{report.total_records.toLocaleString()}</div>
          </div>
          <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Total Attributes</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.2rem' }}>{report.columns_count}</div>
          </div>
          <div className="glass-card" style={{ padding: '1rem', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Flags & Alerts</span>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, marginTop: '0.2rem', color: report.alerts.length > 0 ? '#f59e0b' : '#10b981' }}>
              {report.alerts.length}
            </div>
          </div>
        </div>

        {/* Section 1: Data Integrity & Governance */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck size={20} color="#06b6d4" /> 1. Data Governance & Integrity Findings
          </h3>
          {report.alerts.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {report.alerts.map((al, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '0.8rem 1rem', display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                  <AlertTriangle size={18} color="#f59e0b" />
                  <div style={{ fontSize: '0.85rem' }}>
                    <strong>{al.title}:</strong> {al.message}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="glass-card" style={{ padding: '1rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.85rem' }}>
              <CheckCircle size={18} /> High data cleanliness score. No critical integrity warnings detected.
            </div>
          )}
        </div>

        {/* Section 2: Machine Learning Isolation Forest Anomalies */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertTriangle size={20} color="#f43f5e" /> 2. Machine Learning Anomaly Detection
          </h3>
          {report.top_anomalies && report.top_anomalies.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {report.top_anomalies.map((anom, idx) => (
                <div key={idx} className="glass-card" style={{ padding: '0.8rem', borderLeft: '4px solid #f43f5e' }}>
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f43f5e' }}>Anomalous Row #{anom.row_index}: {anom.reason}</span>
                  <pre className="font-mono" style={{ fontSize: '0.75rem', marginTop: '0.4rem', color: 'var(--text-secondary)' }}>
                    {JSON.stringify(anom.data, null, 2)}
                  </pre>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>No multivariate anomalies detected in sample data points.</p>
          )}
        </div>

        {/* Section 3: Sample Data Snapshot */}
        <div>
          <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FileSpreadsheet size={20} color="#3b82f6" /> 3. Data Sample Snapshot
          </h3>
          {report.sample_records && report.sample_records.length > 0 && (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)' }}>
                    {Object.keys(report.sample_records[0]).map((k, i) => (
                      <th key={i} style={{ padding: '0.5rem' }}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.sample_records.map((row, rI) => (
                    <tr key={rI} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      {Object.keys(row).map((k, cI) => (
                        <td key={cI} style={{ padding: '0.5rem' }}>{String(row[k] ?? '')}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

    </div>
  );
}
