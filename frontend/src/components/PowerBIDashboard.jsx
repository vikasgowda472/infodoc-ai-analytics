import React, { useState, useEffect } from 'react';
import Plot from 'react-plotly.js';
import { LayoutGrid, Filter, TrendingUp, DollarSign, ShoppingBag, Award, Sparkles, AlertCircle } from 'lucide-react';

export default function PowerBIDashboard({ datasetId, edaData }) {
  const [loading, setLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [primaryQueryRes, setPrimaryQueryRes] = useState(null);
  const [trendQueryRes, setTrendQueryRes] = useState(null);
  const [breakdownQueryRes, setBreakdownQueryRes] = useState(null);

  // Fetch Power BI dataset aggregated metrics on dataset load or filter change
  useEffect(() => {
    if (!datasetId || !edaData) return;
    loadDashboardData();
  }, [datasetId, edaData, categoryFilter]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Find numeric and categorical columns from schema
      const schema = edaData?.schema || [];
      const colNames = schema.map(c => c.name);
      const colTypes = {};
      schema.forEach(c => { colTypes[c.name] = String(c.type || '').toLowerCase(); });

      const numCols = colNames.filter(c => anyType(colTypes[c], ['int', 'float', 'double', 'num', 'val', 'price', 'sales', 'amount', 'profit']));
      const catCols = colNames.filter(c => anyType(colTypes[c], ['str', 'obj', 'cat', 'char', 'text', 'region', 'category', 'plan', 'tier']));
      const dateCols = colNames.filter(c => anyType(colTypes[c], ['date', 'time', 'year', 'month', 'day']));

      const mainNum = numCols[0] || colNames[0];
      const mainCat = catCols[0] || colNames[0];
      const secondCat = catCols[1] || dateCols[0] || mainCat;

      let whereClause = "";
      if (categoryFilter !== 'ALL' && mainCat) {
        whereClause = `WHERE ${mainCat} = '${categoryFilter}'`;
      }

      // Query 1: Main Category Breakdown (Bar Chart)
      const q1 = `SELECT ${mainCat}, SUM(${mainNum}) as total_val, COUNT(*) as record_count FROM dataset ${whereClause} GROUP BY ${mainCat} ORDER BY total_val DESC LIMIT 8`;
      const res1 = await runSql(q1);
      setPrimaryQueryRes(res1);

      // Query 2: Secondary Dimension Breakdown (Donut Chart)
      const q2 = `SELECT ${secondCat}, SUM(${mainNum}) as total_val FROM dataset ${whereClause} GROUP BY ${secondCat} ORDER BY total_val DESC LIMIT 5`;
      const res2 = await runSql(q2);
      setBreakdownQueryRes(res2);

      // Query 3: Time Series / Trend if date column exists, else secondary metric
      let q3 = `SELECT ${secondCat}, AVG(${mainNum}) as avg_val FROM dataset ${whereClause} GROUP BY ${secondCat} LIMIT 10`;
      if (dateCols.length > 0) {
        q3 = `SELECT ${dateCols[0]}, SUM(${mainNum}) as total_val FROM dataset ${whereClause} GROUP BY ${dateCols[0]} ORDER BY ${dateCols[0]} ASC LIMIT 15`;
      }
      const res3 = await runSql(q3);
      setTrendQueryRes(res3);

    } catch (err) {
      console.error("Error loading Power BI dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  const anyType = (typeStr, keywords) => keywords.some(k => typeStr.includes(k));

  const runSql = async (sql) => {
    const res = await fetch('/api/query', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ dataset_id: datasetId, query: sql, is_raw_sql: true })
    });
    return res.json();
  };

  if (!edaData || loading) {
    return <div className="glass-panel" style={{ padding: '3rem', textAlign: 'center' }}>Rendering Power BI Analytics Dashboard...</div>;
  }

  const summary = edaData.eda?.summary || {};
  const columns = edaData.eda?.columns || [];
  
  // Extract distinct category values for the slicer dropdown
  const firstCatCol = columns.find(c => !c.is_numeric);
  const filterOptions = firstCatCol?.top_categories?.map(tc => tc.category) || [];

  // Calculate high-level Executive Scorecard KPIs
  let totalMetricVal = 0;
  let topLeaderName = "N/A";
  let topLeaderVal = 0;

  if (primaryQueryRes && primaryQueryRes.data && primaryQueryRes.data.length > 0) {
    const keys = primaryQueryRes.columns;
    const numKey = keys[1] || keys[0];
    const catKey = keys[0];

    totalMetricVal = primaryQueryRes.data.reduce((acc, r) => acc + Number(r[numKey] || 0), 0);
    topLeaderName = primaryQueryRes.data[0][catKey];
    topLeaderVal = Number(primaryQueryRes.data[0][numKey] || 0);
  }

  const avgValPerRecord = summary.total_rows > 0 ? (totalMetricVal / summary.total_rows) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      
      {/* Power BI Top Bar: Slicer Controls & Title */}
      <div className="glass-panel" style={{ padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <div style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899)', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
            <LayoutGrid size={20} color="#ffffff" />
          </div>
          <div>
            <h2 style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>Power BI Analytics Canvas</h2>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Executive Visual Slicers & Dynamic Metric Cards</span>
          </div>
        </div>

        {/* Power BI Slicer Filter Control */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
          <Filter size={16} color="#06b6d4" />
          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>Slicer ({firstCatCol?.name || 'Category'}):</span>
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1px solid var(--border-color)',
              padding: '0.4rem 0.8rem',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.85rem',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            <option value="ALL">All Categories ({summary.total_rows?.toLocaleString()} rows)</option>
            {filterOptions.map((opt, idx) => (
              <option key={idx} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Power BI Scorecard KPIs (4 Cards Grid) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
        
        {/* KPI 1: Primary Value */}
        <div className="glass-card" style={{ padding: '1.2rem', borderTop: '4px solid #06b6d4' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total Metric Volume</span>
            <DollarSign size={18} color="#06b6d4" />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            {totalMetricVal > 1000 ? totalMetricVal.toLocaleString(undefined, { maximumFractionDigits: 1 }) : totalMetricVal.toFixed(2)}
          </div>
          <span style={{ fontSize: '0.7rem', color: '#10b981', display: 'inline-flex', alignItems: 'center', gap: '0.2rem', marginTop: '0.3rem' }}>
            <TrendingUp size={12} /> Live Aggregated Sum
          </span>
        </div>

        {/* KPI 2: Total Transactions / Records */}
        <div className="glass-card" style={{ padding: '1.2rem', borderTop: '4px solid #3b82f6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Record Volume</span>
            <ShoppingBag size={18} color="#3b82f6" />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800 }}>
            {summary.total_rows?.toLocaleString()}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Filtered observations</span>
        </div>

        {/* KPI 3: Top Performer Leader */}
        <div className="glass-card" style={{ padding: '1.2rem', borderTop: '4px solid #8b5cf6' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Top Segment Leader</span>
            <Award size={18} color="#8b5cf6" />
          </div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#8b5cf6', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {topLeaderName}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
            Contrib: <strong>{totalMetricVal > 0 ? ((topLeaderVal / totalMetricVal) * 100).toFixed(1) : 0}%</strong> of total
          </span>
        </div>

        {/* KPI 4: Average Unit Value */}
        <div className="glass-card" style={{ padding: '1.2rem', borderTop: '4px solid #10b981' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Average Per Unit</span>
            <Sparkles size={18} color="#10b981" />
          </div>
          <div style={{ fontSize: '1.7rem', fontWeight: 800 }}>
            {avgValPerRecord.toFixed(2)}
          </div>
          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Mean value per row</span>
        </div>

      </div>

      {/* Power BI Main Dashboard Visual Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(420px, 1fr))', gap: '1.25rem' }}>
        
        {/* Visual 1: Clustered Column Bar Visual */}
        <div className="glass-panel" style={{ padding: '1.25rem', minHeight: '360px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.8rem', color: 'var(--text-primary)' }}>
            📊 Primary Metric by {primaryQueryRes?.columns?.[0] || 'Category'}
          </h4>
          {primaryQueryRes?.data && primaryQueryRes.data.length > 0 ? (
            <Plot
              data={[{
                x: primaryQueryRes.data.map(d => d[primaryQueryRes.columns[0]]),
                y: primaryQueryRes.data.map(d => d[primaryQueryRes.columns[1]]),
                type: 'bar',
                marker: {
                  color: ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ec4899', '#6366f1', '#14b8a6'],
                  borderRadius: 6
                }
              }]}
              layout={{
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: { color: '#94a3b8', size: 11 },
                margin: { l: 50, r: 20, t: 20, b: 60 },
                autosize: true,
                xaxis: { tickangle: -25 }
              }}
              useResizeHandler={true}
              style={{ width: '100%', height: '280px' }}
              config={{ displayModeBar: false }}
            />
          ) : (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem' }}>No visual data returned.</div>
          )}
        </div>

        {/* Visual 2: Donut Composition Visual */}
        <div className="glass-panel" style={{ padding: '1.25rem', minHeight: '360px' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700, marginBottom: '0.8rem', color: 'var(--text-primary)' }}>
            🍩 Share of Total by {breakdownQueryRes?.columns?.[0] || 'Segment'}
          </h4>
          {breakdownQueryRes?.data && breakdownQueryRes.data.length > 0 ? (
            <Plot
              data={[{
                labels: breakdownQueryRes.data.map(d => d[breakdownQueryRes.columns[0]]),
                values: breakdownQueryRes.data.map(d => d[breakdownQueryRes.columns[1]]),
                type: 'pie',
                hole: 0.55,
                marker: {
                  colors: ['#06b6d4', '#3b82f6', '#8b5cf6', '#10b981', '#f59e0b']
                },
                textinfo: 'label+percent',
                insidetextorientation: 'radial'
              }]}
              layout={{
                paper_bgcolor: 'transparent',
                plot_bgcolor: 'transparent',
                font: { color: '#94a3b8', size: 11 },
                margin: { l: 20, r: 20, t: 20, b: 20 },
                showlegend: false,
                autosize: true
              }}
              useResizeHandler={true}
              style={{ width: '100%', height: '280px' }}
              config={{ displayModeBar: false }}
            />
          ) : (
            <div style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '3rem' }}>No visual data returned.</div>
          )}
        </div>

      </div>

      {/* Power BI Data Matrix Table with Data Bars (Data Visualization Rule) */}
      <div className="glass-panel" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.8rem' }}>
          <h4 style={{ fontSize: '0.9rem', fontWeight: 700 }}>📋 Performance Matrix Table (With In-Line Data Bars)</h4>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Power BI Style Data Bar Visual Rule</span>
        </div>

        {primaryQueryRes?.data && primaryQueryRes.data.length > 0 && (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--border-color)', color: 'var(--text-secondary)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Dimension</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Total Volume</th>
                  <th style={{ padding: '0.6rem 0.8rem' }}>Record Count</th>
                  <th style={{ padding: '0.6rem 0.8rem', width: '35%' }}>Visual Data Bar (Relative Weight)</th>
                </tr>
              </thead>
              <tbody>
                {primaryQueryRes.data.map((row, idx) => {
                  const cat = row[primaryQueryRes.columns[0]];
                  const val = Number(row[primaryQueryRes.columns[1]] || 0);
                  const cnt = row[primaryQueryRes.columns[2]] || '-';
                  const pct = totalMetricVal > 0 ? (val / topLeaderVal) * 100 : 0;

                  return (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '0.6rem 0.8rem', fontWeight: 600, color: '#06b6d4' }}>{cat}</td>
                      <td style={{ padding: '0.6rem 0.8rem', fontWeight: 600 }}>{val.toLocaleString(undefined, { maximumFractionDigits: 2 })}</td>
                      <td style={{ padding: '0.6rem 0.8rem', color: 'var(--text-secondary)' }}>{cnt}</td>
                      <td style={{ padding: '0.6rem 0.8rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <div style={{ flex: 1, background: 'rgba(255, 255, 255, 0.05)', borderRadius: '999px', height: '8px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                background: 'linear-gradient(90deg, #06b6d4 0%, #3b82f6 100%)',
                                borderRadius: '999px'
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', minWidth: '35px' }}>{pct.toFixed(0)}%</span>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
