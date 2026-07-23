import React, { useState, useEffect } from 'react';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeTab, setActiveTab] = useState('videos');

  // Load core values
  useEffect(() => {
    // In dev, pull from fallback or mocked local proxy routes
    const defaultVideos = [
      { id: '1', title: 'Rise and Fall of Ancient Rome', status: 'published', description: 'Exploring Roman History' },
      { id: '2', title: 'Secrets of Sparta Mythologies', status: 'research', description: 'Spartan values' }
    ];
    const defaultRoadmaps = [
      { id: '101', title: 'Ancient Civilizations Series', description: 'Releasing Q3 2024' }
    ];

    setVideos(defaultVideos);
    setRoadmaps(defaultRoadmaps);
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '24px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: '#111' }}>CIP Admin Command Center</h1>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>Phase 1 — Single Admin Portal</p>
        </div>
        <div style={{ backgroundColor: '#e2e8f0', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
          Tenant: Default (00000000)
        </div>
      </header>

      <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('videos')}
          style={{ padding: '8px 16px', backgroundColor: activeTab === 'videos' ? '#3182ce' : '#fff', color: activeTab === 'videos' ? '#fff' : '#4a5568', border: '1px solid #cbd5e0', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Videos / Backlog
        </button>
        <button
          onClick={() => setActiveTab('roadmaps')}
          style={{ padding: '8px 16px', backgroundColor: activeTab === 'roadmaps' ? '#3182ce' : '#fff', color: activeTab === 'roadmaps' ? '#fff' : '#4a5568', border: '1px solid #cbd5e0', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          Roadmaps / Goals
        </button>
      </div>

      <main style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
        {activeTab === 'videos' ? (
          <div>
            <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Active Content Backlog</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {videos.map(v => (
                <div key={v.id} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '6px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: '0 0 4px 0' }}>{v.title}</h3>
                    <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{v.description}</p>
                  </div>
                  <span style={{ backgroundColor: '#edf2f7', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>{v.status}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div>
            <h2 style={{ marginTop: 0, marginBottom: '16px' }}>Active Roadmaps</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {roadmaps.map(r => (
                <div key={r.id} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '6px' }}>
                  <h3 style={{ margin: '0 0 4px 0' }}>{r.title}</h3>
                  <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>{r.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
