import React, { useState } from 'react';
import { UploadCloud, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

export default function DatasetSelector({ datasets, activeDatasetId, onSelectDataset, onUploadSuccess }) {
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (data.status === 'SUCCESS') {
        onUploadSuccess(data.dataset_id);
      } else {
        alert(data.detail || 'Upload failed');
      }
    } catch (err) {
      alert('Error uploading file: ' + err.message);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="glass-panel no-print" style={{ padding: '1.2rem 1.5rem', marginBottom: '1.5rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
            <FileSpreadsheet size={18} color="#06b6d4" /> Selected Dataset Workspace
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Select a sample dataset below or upload your own custom CSV/Excel dataset.</p>
        </div>

        {/* Dataset Quick Selection Chips */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', flexWrap: 'wrap' }}>
          {datasets.map((ds) => {
            const isSelected = ds.dataset_id === activeDatasetId;
            return (
              <button
                key={ds.dataset_id}
                onClick={() => onSelectDataset(ds.dataset_id)}
                className="btn-secondary"
                style={{
                  background: isSelected ? 'rgba(6, 182, 212, 0.2)' : '',
                  borderColor: isSelected ? '#06b6d4' : '',
                  color: isSelected ? '#06b6d4' : '',
                  fontSize: '0.85rem'
                }}
              >
                {isSelected && <CheckCircle2 size={14} color="#06b6d4" />}
                {ds.name} ({ds.rows_count} rows)
              </button>
            );
          })}
        </div>

        {/* File Upload Button */}
        <div>
          <label className="btn-primary" style={{ cursor: 'pointer', fontSize: '0.85rem' }}>
            <UploadCloud size={16} /> {isUploading ? 'Processing...' : 'Upload CSV / Excel'}
            <input type="file" accept=".csv,.xlsx,.xls,.json" onChange={handleFileUpload} style={{ display: 'none' }} />
          </label>
        </div>

      </div>
    </div>
  );
}
