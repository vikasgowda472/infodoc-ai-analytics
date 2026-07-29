import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import DatasetSelector from './components/DatasetSelector';
import PowerBIDashboard from './components/PowerBIDashboard';
import EDADashboard from './components/EDADashboard';
import QueryStudio from './components/QueryStudio';
import ExecutiveReport from './components/ExecutiveReport';

export default function App() {
  const [activeTab, setActiveTab] = useState('powerbi'); // 'powerbi' | 'eda' | 'query' | 'report'
  const [datasets, setDatasets] = useState([]);
  const [activeDatasetId, setActiveDatasetId] = useState(null);
  const [edaData, setEdaData] = useState(null);
  const [theme, setTheme] = useState('dark');

  // Fetch dataset list on load
  const fetchDatasets = async () => {
    try {
      const res = await fetch('/api/datasets');
      const data = await res.json();
      if (data.status === 'SUCCESS' && data.datasets.length > 0) {
        setDatasets(data.datasets);
        if (!activeDatasetId) {
          setActiveDatasetId(data.datasets[0].dataset_id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch datasets:', err);
    }
  };

  // Fetch EDA for selected dataset
  const fetchEDA = async (datasetId) => {
    if (!datasetId) return;
    try {
      const res = await fetch(`/api/eda/${datasetId}`);
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        setEdaData(data);
      }
    } catch (err) {
      console.error('Failed to fetch EDA:', err);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  useEffect(() => {
    if (activeDatasetId) {
      fetchEDA(activeDatasetId);
    }
  }, [activeDatasetId]);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.setAttribute('data-theme', nextTheme);
  };

  const activeDataset = datasets.find(d => d.dataset_id === activeDatasetId);

  return (
    <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '1.5rem 1rem 3rem 1rem' }}>
      
      {/* Header Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        activeDataset={activeDataset}
        theme={theme}
        toggleTheme={toggleTheme}
      />

      {/* Dataset Selection Bar */}
      <DatasetSelector
        datasets={datasets}
        activeDatasetId={activeDatasetId}
        onSelectDataset={(id) => setActiveDatasetId(id)}
        onUploadSuccess={(id) => {
          fetchDatasets();
          setActiveDatasetId(id);
        }}
      />

      {/* View Tabs Content */}
      <main>
        {activeTab === 'powerbi' && activeDatasetId && (
          <PowerBIDashboard datasetId={activeDatasetId} edaData={edaData} />
        )}

        {activeTab === 'eda' && (
          <EDADashboard edaData={edaData} />
        )}

        {activeTab === 'query' && activeDatasetId && (
          <QueryStudio datasetId={activeDatasetId} schema={edaData?.schema || []} />
        )}

        {activeTab === 'report' && activeDatasetId && (
          <ExecutiveReport datasetId={activeDatasetId} />
        )}
      </main>

    </div>
  );
}
