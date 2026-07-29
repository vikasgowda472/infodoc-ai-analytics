import React from 'react';
import { BarChart3, LayoutGrid, Database, Search, FileText, Sun, Moon, ShieldCheck } from 'lucide-react';

export default function Navbar({ activeTab, setActiveTab, activeDataset, theme, toggleTheme }) {
  return (
    <header className="glass-panel" style={{ padding: '0.8rem 1.5rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
        <div style={{ background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', padding: '0.5rem', borderRadius: '10px', display: 'flex' }}>
          <BarChart3 size={24} color="#ffffff" />
        </div>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '1.25rem', fontWeight: 700, lineHeight: 1.2 }}>InfoDoc</h1>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Autonomous AI Data Intelligence & Power BI Studio</span>
        </div>
      </div>

      <nav style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <button
          className={`btn-secondary ${activeTab === 'powerbi' ? 'active' : ''}`}
          style={{ background: activeTab === 'powerbi' ? 'rgba(6, 182, 212, 0.15)' : '', borderColor: activeTab === 'powerbi' ? '#06b6d4' : '', color: activeTab === 'powerbi' ? '#06b6d4' : '' }}
          onClick={() => setActiveTab('powerbi')}
        >
          <LayoutGrid size={16} /> Power BI Overview
        </button>

        <button
          className={`btn-secondary ${activeTab === 'eda' ? 'active' : ''}`}
          style={{ background: activeTab === 'eda' ? 'rgba(6, 182, 212, 0.15)' : '', borderColor: activeTab === 'eda' ? '#06b6d4' : '' }}
          onClick={() => setActiveTab('eda')}
        >
          <Database size={16} /> Automated EDA
        </button>

        <button
          className={`btn-secondary ${activeTab === 'query' ? 'active' : ''}`}
          style={{ background: activeTab === 'query' ? 'rgba(6, 182, 212, 0.15)' : '', borderColor: activeTab === 'query' ? '#06b6d4' : '' }}
          onClick={() => setActiveTab('query')}
        >
          <Search size={16} /> NL Query & BI Studio
        </button>

        <button
          className={`btn-secondary ${activeTab === 'report' ? 'active' : ''}`}
          style={{ background: activeTab === 'report' ? 'rgba(6, 182, 212, 0.15)' : '', borderColor: activeTab === 'report' ? '#06b6d4' : '' }}
          onClick={() => setActiveTab('report')}
        >
          <FileText size={16} /> Executive Report
        </button>
      </nav>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        {activeDataset && (
          <div className="badge-pass" style={{ padding: '0.35rem 0.75rem' }}>
            <ShieldCheck size={14} /> Active: <strong>{activeDataset.name}</strong>
          </div>
        )}

        <button className="btn-secondary" onClick={toggleTheme} title="Toggle Dark/Light Mode">
          {theme === 'dark' ? <Sun size={18} color="#f59e0b" /> : <Moon size={18} color="#3b82f6" />}
        </button>
      </div>
    </header>
  );
}
