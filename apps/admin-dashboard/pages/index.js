import React, { useState, useEffect } from 'react';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [roadmaps, setRoadmaps] = useState([]);
  const [activeTab, setActiveTab] = useState('videos');
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // YouTube Sync States
  const [ytMetrics, setYtMetrics] = useState(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // Phase 4 Multi-Tenant SaaS Workspace Context Toggles
  const [tenantContext, setTenantContext] = useState('00000000-0000-0000-0000-000000000000');
  const [tenantLabel, setTenantContextLabel] = useState('Primary Creator');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Fetch core values from Gateway API
  const loadData = async (activeTenant) => {
    const currentTenant = activeTenant || tenantContext;
    try {
      // Pass the active tenant context using a secure Custom Header
      const headers = {
        'Content-Type': 'application/json',
        'X-Tenant-Id': currentTenant
      };

      const resVideos = await fetch(`${API_URL}/api/v1/videos`, { headers });
      if (resVideos.ok) {
        const data = await resVideos.json();
        setVideos(data);
      } else {
        throw new Error('Content API unreachable');
      }

      const resRoadmaps = await fetch(`${API_URL}/api/v1/roadmaps`, { headers });
      if (resRoadmaps.ok) {
        const data = await resRoadmaps.json();
        setRoadmaps(data);
      }

      const resYt = await fetch(`${API_URL}/api/v1/youtube/metrics`, { headers });
      if (resYt.ok) {
        const data = await resYt.json();
        setYtMetrics(data);
      }
    } catch (err) {
      // Segregated resilient fallback schemas mapped dynamically based on selected tenant context
      let defaultVideos = [];
      let defaultRoadmaps = [];

      if (currentTenant === '00000000-0000-0000-0000-000000000000') {
        defaultVideos = [
          { id: '1a9bc245-c800-4752-bd88-0214a19bc32a', title: 'Rise and Fall of Ancient Rome', status: 'published', description: 'Exploring Roman History and the socio-economic transitions.' },
          { id: '28bc514d-91b3-4fec-88c9-021bc2498712', title: 'Secrets of Sparta Mythologies', status: 'research', description: 'Spartan militaristic and cultural values vs modern perception.' }
        ];
        defaultRoadmaps = [
          { id: '34bc98e1-da81-42ab-bd99-0129bc4897bc', title: 'Historical Dynasties series', description: 'Analyze major world civilisations chronologically.' }
        ];
      } else if (currentTenant === '88888888-8888-8888-8888-888888888888') {
        defaultVideos = [
          { id: 'r1', title: 'Julius Caesar crossing Rubicon', status: 'scripting', description: 'The absolute transition of the Roman republic context.' }
        ];
        defaultRoadmaps = [
          { id: 'r101', title: 'Roman Chronicles Enterprise', description: 'The complete rise of the Caesars.' }
        ];
      } else {
        defaultVideos = [
          { id: 'g1', title: 'Myth of the Minotaur Labyrinth', status: 'ideation', description: 'Exploring Minoan civilisations and subterranean structures.' }
        ];
        defaultRoadmaps = [
          { id: 'g101', title: 'Greek Legends Enterprise', description: 'An ordered investigation into Aegean mythologies.' }
        ];
      }

      const defaultYt = {
        channel_id: 'UC_mock_channel_01',
        subscriber_count: currentTenant === '00000000-0000-0000-0000-000000000000' ? 142400 : 25100,
        total_views: currentTenant === '00000000-0000-0000-0000-000000000000' ? 4892400 : 920400,
        total_watch_time_minutes: 58245000,
        last_synced_at: new Date().toISOString()
      };

      setVideos(defaultVideos);
      setRoadmaps(defaultRoadmaps);
      setYtMetrics(defaultYt);
    }
  };

  useEffect(() => {
    loadData(tenantContext);
  }, []);

  const handleTenantChange = (e) => {
    const selected = e.target.value;
    setTenantContext(selected);

    let label = 'Primary Creator';
    if (selected === '88888888-8888-8888-8888-888888888888') label = 'Roman Chronicles Brand';
    if (selected === '99999999-9999-9999-9999-999999999999') label = 'Greek Legends Brand';

    setTenantContextLabel(label);
    loadData(selected);
  };

  const handleAddVideo = async (e) => {
    e.preventDefault();
    if (!newTitle) return;

    try {
      const res = await fetch(`${API_URL}/api/v1/videos`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantContext
        },
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
        tenant_id: tenantContext,
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

  const handleYtSync = async () => {
    setSyncStatusMsg('Refreshing Access Token and fetching YouTube Analytics...');
    try {
      const res = await fetch(`${API_URL}/api/v1/youtube/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantContext
        }
      });
      if (res.ok) {
        const data = await res.json();
        setYtMetrics(data.metrics);
        setSyncStatusMsg('YouTube data successfully synchronized!');
        setTimeout(() => setSyncStatusMsg(''), 4000);
      } else {
        throw new Error('Sync fail');
      }
    } catch (err) {
      // Simulated fallback sync update
      if (ytMetrics) {
        const updated = {
          ...ytMetrics,
          subscriber_count: ytMetrics.subscriber_count + 12,
          total_views: ytMetrics.total_views + 245,
          last_synced_at: new Date().toISOString()
        };
        setYtMetrics(updated);
        setSyncStatusMsg('Simulated sync complete (API Gateway offline).');
        setTimeout(() => setSyncStatusMsg(''), 4000);
      }
    }
  };

  return (
    <div style={{ fontFamily: '"Inter", system-ui, -apple-system, sans-serif', padding: '0', backgroundColor: '#0f172a', minHeight: '100vh', color: '#f8fafc' }}>

      {/* Premium Header with SaaS Tenant Switcher */}
      <header style={{ borderBottom: '1px solid #1e293b', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.025em', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>⚡</span> CIP Admin Command Center
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>Content Intelligence Platform • Phase 4 SaaS Workspace Suite</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: 'bold', textTransform: 'uppercase' }}>Scope:</span>
            <select
              value={tenantContext}
              onChange={handleTenantChange}
              style={{ backgroundColor: '#0f172a', border: '1px solid #334155', color: '#38bdf8', padding: '8px 16px', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer' }}
            >
              <option value="00000000-0000-0000-0000-000000000000">Primary Creator Workspace</option>
              <option value="88888888-8888-8888-8888-888888888888">Roman Chronicles Brand</option>
              <option value="99999999-9999-9999-9999-999999999999">Greek Legends Brand</option>
            </select>
          </div>
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #334155', padding: '8px 16px', borderRadius: '30px', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.05em', color: '#e2e8f0' }}>
            ACTIVE BRAND: {tenantLabel.toUpperCase()}
          </div>
        </div>
      </header>

      <div style={{ padding: '32px 40px', maxWidth: '1440px', margin: '0 auto' }}>

        {/* YouTube Analytics Real-Time Stats Card */}
        {ytMetrics && (
          <div style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '24px', borderRadius: '12px', marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div>
              <h3 style={{ marginTop: 0, marginBottom: '16px', fontSize: '14px', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ width: '8px', height: '8px', backgroundColor: '#ef4444', borderRadius: '50%', display: 'inline-block' }}></span>
                YouTube Analytics Feed
              </h3>
              <div style={{ display: 'flex', gap: '48px' }}>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>Subscribers</span>
                  <p style={{ fontSize: '28px', fontWeight: '800', margin: '6px 0 0 0', color: '#f8fafc', letterSpacing: '-0.025em' }}>{ytMetrics.subscriber_count.toLocaleString()}</p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>Lifetime Views</span>
                  <p style={{ fontSize: '28px', fontWeight: '800', margin: '6px 0 0 0', color: '#f8fafc', letterSpacing: '-0.025em' }}>{ytMetrics.total_views.toLocaleString()}</p>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>Watch Time (Mins)</span>
                  <p style={{ fontSize: '28px', fontWeight: '800', margin: '6px 0 0 0', color: '#f8fafc', letterSpacing: '-0.025em' }}>{ytMetrics.total_watch_time_minutes.toLocaleString()}</p>
                </div>
              </div>
              <p style={{ margin: '16px 0 0 0', fontSize: '11px', color: '#64748b' }}>LAST DATA REFRESH SNAPSHOT: {new Date(ytMetrics.last_synced_at).toLocaleString()}</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <button
                onClick={handleYtSync}
                style={{ padding: '12px 24px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.2)' }}
              >
                Sync YouTube Data
              </button>
              {syncStatusMsg && <p style={{ margin: '12px 0 0 0', fontSize: '12px', color: '#ef4444', fontWeight: 'bold' }}>{syncStatusMsg}</p>}
            </div>
          </div>
        )}

        {/* Intelligence Decision Engine Panel */}
        <div style={{ backgroundColor: '#0f172a', border: '1px solid #14b8a6', padding: '24px', borderRadius: '12px', marginBottom: '32px', borderLeft: '6px solid #14b8a6', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.3)' }}>
          <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: '800', color: '#14b8a6', display: 'flex', alignItems: 'center', gap: '10px', letterSpacing: '-0.01em' }}>
            <span>🧠</span> Intelligence Decision Engine Pipeline
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>
            <div>
              <h4 style={{ margin: '0 0 16px 0', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Content Gap Analysis</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                    <span style={{ color: '#cbd5e1' }}>Temple Heritage Pillar</span>
                    <span style={{ color: '#10b981' }}>{tenantContext === '00000000-0000-0000-0000-000000000000' ? '82%' : '44%'} Covered</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: tenantContext === '00000000-0000-0000-0000-000000000000' ? '82%' : '44%', height: '100%', backgroundColor: '#10b981' }}></div>
                  </div>
                </div>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: 'bold', marginBottom: '6px' }}>
                    <span style={{ color: '#cbd5e1' }}>Ancient Wisdom Pillar</span>
                    <span style={{ color: '#f43f5e' }}>{tenantContext === '00000000-0000-0000-0000-000000000000' ? '11%' : '90%'} Covered</span>
                  </div>
                  <div style={{ height: '8px', backgroundColor: '#1e293b', borderRadius: '4px', overflow: 'hidden' }}>
                    <div style={{ width: tenantContext === '00000000-0000-0000-0000-000000000000' ? '11%' : '90%', height: '100%', backgroundColor: '#f43f5e' }}></div>
                  </div>
                </div>
              </div>
            </div>
            <div style={{ borderLeft: '1px solid #334155', paddingLeft: '32px' }}>
              <h4 style={{ margin: '0 0 12px 0', fontSize: '12px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Content Opportunity Recommendation</h4>
              <div style={{ backgroundColor: '#022c22', border: '1px solid #065f46', padding: '16px', borderRadius: '8px', color: '#a7f3d0', lineHeight: '1.5' }}>
                <p style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ color: '#34d399' }}>💡</span> Strategic Advice:
                </p>
                <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>
                  {tenantContext === '00000000-0000-0000-0000-000000000000' ? (
                    "Your Ancient Wisdom roadmap track is falling behind schedule. Delay the Temple Heritage draft and outline an Ancient Wisdom script concept immediately."
                  ) : (
                    "Your brand engagement indicators are highly strong! Greek and Roman entity mappings are completely balanced across active drafts."
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#7f1d1d', border: '1px solid #f87171', padding: '14px 20px', borderRadius: '8px', color: '#fca5a5', marginBottom: '24px', fontSize: '14px', fontWeight: 'bold' }}>
            ⚠️ {errorMsg}
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 2.5fr', gap: '32px' }}>

          {/* Creator Inputs Sidebar */}
          <aside style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '24px', borderRadius: '12px', height: 'fit-content', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0, marginBottom: '20px', fontSize: '16px', fontWeight: '700', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '12px' }}>Add Video Idea</h3>
            <form onSubmit={handleAddVideo} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Video Title
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', marginTop: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '14px' }}
                />
              </label>
              <label style={{ fontSize: '12px', fontWeight: 'bold', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Description / Context
                <textarea
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  style={{ width: '100%', padding: '10px', marginTop: '6px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '6px', color: '#f8fafc', fontSize: '14px', height: '100px', resize: 'none' }}
                />
              </label>
              <button
                type="submit"
                style={{ padding: '12px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', transition: 'all 0.2s', fontSize: '14px' }}
              >
                Save Concept
              </button>
            </form>
          </aside>

          {/* Main Content Workspace tabs */}
          <main style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '28px', borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
              <button
                onClick={() => setActiveTab('videos')}
                style={{ padding: '10px 20px', backgroundColor: activeTab === 'videos' ? '#38bdf8' : 'transparent', color: activeTab === 'videos' ? '#0f172a' : '#94a3b8', border: activeTab === 'videos' ? 'none' : '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', fontSize: '14px' }}
              >
                Videos / Backlog
              </button>
              <button
                onClick={() => setActiveTab('roadmaps')}
                style={{ padding: '10px 20px', backgroundColor: activeTab === 'roadmaps' ? '#38bdf8' : 'transparent', color: activeTab === 'roadmaps' ? '#0f172a' : '#94a3b8', border: activeTab === 'roadmaps' ? 'none' : '1px solid #334155', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', transition: 'all 0.2s', fontSize: '14px' }}
              >
                Roadmaps / Goals
              </button>
            </div>

            {activeTab === 'videos' ? (
              <div>
                <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.01em', color: '#f8fafc' }}>Active Content Backlog</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {videos.map(v => (
                    <div key={v.id} style={{ border: '1px solid #334155', backgroundColor: '#0f172a', padding: '20px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>{v.title}</h3>
                        <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', lineHeight: '1.4' }}>{v.description}</p>
                      </div>
                      <span style={{ backgroundColor: '#1e293b', border: '1px solid #334155', color: '#38bdf8', padding: '6px 12px', borderRadius: '20px', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.05em' }}>{v.status || 'ideation'}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div>
                <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px', fontWeight: '800', letterSpacing: '-0.01em', color: '#f8fafc' }}>Active Roadmaps</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {roadmaps.map(r => (
                    <div key={r.id} style={{ border: '1px solid #334155', backgroundColor: '#0f172a', padding: '20px', borderRadius: '8px' }}>
                      <h3 style={{ margin: '0 0 6px 0', fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>{r.title}</h3>
                      <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', lineHeight: '1.4' }}>{r.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
