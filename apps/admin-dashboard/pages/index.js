import React, { useState, useEffect } from 'react';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeTab, setActiveTab] = useState('videos');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Fetch core values from Gateway API
  const loadData = async () => {
    try {
      const resVideos = await fetch(`${API_URL}/api/v1/videos`);
      if (resVideos.ok) {
        const data = await resVideos.json();
        setVideos(data);
      } else {
        throw new Error('Content API unreachable');
      }

      const resRoadmaps = await fetch(`${API_URL}/api/v1/roadmaps`);
      if (resRoadmaps.ok) {
        const data = await resRoadmaps.json();
        setRoadmaps(data);
      }
    } catch (err) {
      // Fallback states for resilient operation when API gateway is booting up
      const defaultVideos = [
        { id: '1a9bc245-c800-4752-bd88-0214a19bc32a', title: 'Rise and Fall of Ancient Rome', status: 'published', description: 'Exploring Roman History' },
        { id: '28bc514d-91b3-4fec-88c9-021bc2498712', title: 'Secrets of Sparta Mythologies', status: 'research', description: 'Spartan values' }
      ];
      const defaultRoadmaps = [
        { id: '34bc98e1-da81-42ab-bd99-0129bc4897bc', title: 'Historical Dynasties series', description: 'Analyze major world civilisations' }
      ];
      setVideos(defaultVideos);
      setRoadmaps(defaultRoadmaps);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (!newTitle) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/videos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, description: newDesc })
      });

      if (res.ok) {
        const data = await res.json();
        setVideos([...videos, data]);
        setNewTitle('');
        setNewDesc('');
        setErrorMsg('');
      } else {
        throw new Error('Failed to save to backend API');
      }
    } catch (err) {
      // Local addition fallback
      const mockNewVideo = {
        id: Math.random().toString(),
        title: newTitle,
        description: newDesc,
        status: 'ideation'
      };
      setVideos([...videos, mockNewVideo]);
      setNewTitle('');
      setNewDesc('');
      setErrorMsg('Operation simulated locally (API Gateway offline).');
    }
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '24px', backgroundColor: '#f9f9f9', minHeight: '100vh' }}>
      <header style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, color: '#111' }}>CIP Admin Command Center</h1>
          <p style={{ margin: '4px 0 0 0', color: '#666' }}>Phase 1 & 2 — Content Intelligence Platform</p>
        </div>
        <div style={{ backgroundColor: '#e2e8f0', padding: '8px 16px', borderRadius: '20px', fontSize: '14px', fontWeight: 'bold' }}>
          Tenant: Default (00000000)
        </div>
      </header>

      {errorMsg && (
        <div style={{ backgroundColor: '#fffaf0', border: '1px solid #fbd38d', padding: '12px', borderRadius: '6px', color: '#dd6b20', marginBottom: '20px', fontSize: '14px' }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px' }}>
        <aside style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', height: 'fit-content' }}>
          <h3 style={{ marginTop: 0, marginBottom: '16px' }}>Add Video Idea</h3>
          <form onSubmit={handleAddVideo} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#4a5568' }}>
              Title:
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                required
                style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #cbd5e0', borderRadius: '4px' }}
              />
            </label>
            <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#4a5568' }}>
              Description:
              <textarea
                value={newDesc}
                onChange={(e) => setNewDesc(e.target.value)}
                style={{ width: '100%', padding: '8px', marginTop: '4px', border: '1px solid #cbd5e0', borderRadius: '4px', height: '80px' }}
              />
            </label>
            <button
              type="submit"
              style={{ padding: '10px', backgroundColor: '#3182ce', color: '#fff', border: 'none', borderRadius: '4px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              Save Concept
            </button>
          </form>
        </aside>

        <main style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
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
                    <span style={{ backgroundColor: '#edf2f7', padding: '4px 8px', borderRadius: '4px', fontSize: '12px', textTransform: 'uppercase', fontWeight: 'bold' }}>{v.status || 'ideation'}</span>
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
    </div>
  );
}
