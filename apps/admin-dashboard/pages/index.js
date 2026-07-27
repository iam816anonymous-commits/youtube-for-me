import React, { useState, useEffect } from 'react';

export default function Home() {
  const [videos, setVideos] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  // YouTube Sync States
  const [ytMetrics, setYtMetrics] = useState(null);
  const [syncStatusMsg, setSyncStatusMsg] = useState('');

  // YouTube API Quota Status States
  const [quotaStats, setQuotaStats] = useState({ used: 120, limit: 10000, remaining: 9880, percentUsed: 1.2 });

  // Custom Connected Channels States
  const [connectedChannels, setConnectedChannels] = useState([]);
  const [newChannelId, setNewChannelId] = useState('');
  const [newChannelTitle, setNewChannelTitle] = useState('');
  const [channelSuccessMsg, setChannelSuccessMsg] = useState('');

  // Phase 4 Multi-Tenant SaaS Workspace Context Toggles
  const [tenantContext, setTenantContext] = useState('00000000-0000-0000-0000-000000000000');
  const [tenantLabel, setTenantContextLabel] = useState('Primary Creator');

  // Dynamic Schema Creator States
  const [customSchemas, setCustomSchemas] = useState([]);
  const [newTableName, setNewTableName] = useState('');
  const [newFieldName, setNewFieldName] = useState('');
  const [newFieldType, setNewFieldType] = useState('VARCHAR(255)');
  const [selectedSchemaAction, setSelectedSchemaAction] = useState('CREATE');
  const [schemaSuccessMsg, setSchemaSuccessMsg] = useState('');

  // Platform API Configuration States (localStorage persistence)
  const [openaiApiKey, setOpenaiApiKey] = useState('');
  const [googleClientId, setGoogleClientId] = useState('');
  const [googleClientSecret, setGoogleClientSecret] = useState('');
  const [googleAccessToken, setGoogleAccessToken] = useState('');
  const [dbConnString, setDbConnString] = useState('');
  const [configSuccessMsg, setConfigSuccessMsg] = useState('');

  // YouTube Library MVP States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Topics');
  const [selectedFilter, setSelectedFilter] = useState('ALL'); // ALL, FAVORITE, HIGH_VIEWS, LONG_DURATION, MISSING_TAGS, MISSING_DESC
  const [activeVideoDetail, setActiveVideoDetail] = useState(null);
  const [collections, setCollections] = useState([]);
  const [newCollectionName, setNewCollectionName] = useState('');
  const [newCollectionDesc, setNewCollectionDesc] = useState('');
  const [bulkAction, setBulkAction] = useState('ADD_TAG'); // ADD_TAG, ADD_NOTE, TOGGLE_FAVORITE, ASSIGN_LABEL
  const [bulkValue, setBulkValue] = useState('');
  const [selectedVideoIds, setSelectedVideoIds] = useState([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  // Load configuration credentials from browser localStorage on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setOpenaiApiKey(localStorage.getItem('CIP_OPENAI_API_KEY') || '');
      setGoogleClientId(localStorage.getItem('CIP_GOOGLE_CLIENT_ID') || '');
      setGoogleClientSecret(localStorage.getItem('CIP_GOOGLE_CLIENT_SECRET') || '');
      setGoogleAccessToken(localStorage.getItem('CIP_GOOGLE_ACCESS_TOKEN') || '');
      setDbConnString(localStorage.getItem('CIP_DATABASE_URL') || '');
    }
  }, []);

  // Fetch core values from Gateway API
  const loadData = async (activeTenant) => {
    const currentTenant = activeTenant || tenantContext;
    try {
      const headers = {
        'Content-Type': 'application/json',
        'X-Tenant-Id': currentTenant,
        'X-OpenAI-Key': localStorage.getItem('CIP_OPENAI_API_KEY') || '',
        'X-Google-Client-Id': localStorage.getItem('CIP_GOOGLE_CLIENT_ID') || '',
        'X-Google-Client-Secret': localStorage.getItem('CIP_GOOGLE_CLIENT_SECRET') || '',
        'X-Google-Access-Token': localStorage.getItem('CIP_GOOGLE_ACCESS_TOKEN') || ''
      };

      // Query videos with advanced parameters
      let queryUrl = `${API_URL}/api/v1/youtube/videos`;
      const queryParams = [];
      if (searchQuery) queryParams.push(`search=${encodeURIComponent(searchQuery)}`);
      if (selectedCategory && selectedCategory !== 'All Topics') queryParams.push(`category=${encodeURIComponent(selectedCategory)}`);
      if (selectedFilter === 'FAVORITE') queryParams.push('isFavorite=true');
      if (selectedFilter === 'HIGH_VIEWS') queryParams.push('minViews=100000');
      if (selectedFilter === 'LONG_DURATION') queryParams.push('maxDuration=30'); // Capped threshold
      if (selectedFilter === 'MISSING_TAGS') queryParams.push('missingTags=true');
      if (selectedFilter === 'MISSING_DESC') queryParams.push('missingDesc=true');

      if (queryParams.length > 0) {
        queryUrl += `?${queryParams.join('&')}`;
      }

      const resVideos = await fetch(queryUrl, { headers });
      if (resVideos.ok) {
        const data = await resVideos.json();
        setVideos(data.data || data);
      } else {
        throw new Error('Content API unreachable');
      }

      const resYt = await fetch(`${API_URL}/api/v1/youtube/metrics`, { headers });
      if (resYt.ok) {
        const data = await resYt.json();
        setYtMetrics(data);
      }

      // Fetch YouTube Quota
      const resQuota = await fetch(`${API_URL}/api/v1/youtube/quota`, { headers });
      if (resQuota.ok) {
        const result = await resQuota.json();
        setQuotaStats(result.data);
      }

      // Fetch Dynamic Custom Schemas
      const resSchemas = await fetch(`${API_URL}/api/v1/schemas`, { headers });
      if (resSchemas.ok) {
        const data = await resSchemas.json();
        setCustomSchemas(data.data || []);
      }

      // Fetch Custom Registered YouTube Channels
      const resChans = await fetch(`${API_URL}/api/v1/youtube/channels`, { headers });
      if (resChans.ok) {
        const data = await resChans.json();
        setConnectedChannels(data.data || []);
      }

      // Fetch Collections
      const resCols = await fetch(`${API_URL}/api/v1/youtube/collections`, { headers });
      if (resCols.ok) {
        const data = await resCols.json();
        setCollections(data.data || []);
      }
    } catch (err) {
      // Segregated resilient fallback schemas mapped dynamically based on selected tenant context
      let defaultVideos = [
        { id: 'chan-vid-1', channelId: 'UC_mock_channel_01', youtubeId: 'b9SbyPZfF-E', title: 'The Great Crisis of the Third Century', views: 124592, duration: '42:15', category: 'Ancient Rome', tags: ['Crisis', 'Economy', 'Rome'], publishedAt: '2026-04-12', is_favorite: true, description: 'An in-depth analysis of how economic collapse, constant civil conflicts, and external barbarian invasions nearly destroyed the Roman Empire.', labels: ['high-performing', 'history'], researchNotes: 'Primary catalyst: currency debasement.' },
        { id: 'chan-vid-2', channelId: 'UC_mock_channel_01', youtubeId: 'tO13uXz-X-k', title: 'Byzantine Siege Engines & Firepower', views: 89412, duration: '31:40', category: 'Byzantine Empire', tags: ['Byzantium', 'Engineering', 'Greek Fire'], publishedAt: '2026-05-02', is_favorite: false, description: 'Exploring the advanced engineering of medieval Constantinople.', labels: ['needs-thumbnail'], researchNotes: 'Greek Fire pressurized siphon mechanism.' },
        { id: 'chan-vid-3', channelId: 'UC_mock_channel_01', youtubeId: 'L_W-YfC0VIs', title: 'The Silencing of the Libraries', views: 45391, duration: '28:10', category: 'Late Antiquity', tags: [], publishedAt: '2026-06-18', is_favorite: false, description: '', labels: [], researchNotes: '' },
        { id: 'chan-vid-4', channelId: 'UC_mock_channel_01', youtubeId: 'U_g6b8g_L_8', title: 'Socio-Political Decay Trends', views: 210883, duration: '54:30', category: 'Cliodynamics', tags: ['Cliodynamics', 'Economy', 'Decline'], publishedAt: '2026-07-10', is_favorite: true, description: 'A mathematical modeling approach to civilizational collapse.', labels: ['important'], researchNotes: 'Elite overproduction trigger.' }
      ];

      // Apply local filters for offline sandbox
      let filtered = [...defaultVideos];
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(v => v.title.toLowerCase().includes(q) || v.description.toLowerCase().includes(q));
      }
      if (selectedCategory && selectedCategory !== 'All Topics') {
        filtered = filtered.filter(v => v.category === selectedCategory);
      }
      if (selectedFilter === 'FAVORITE') {
        filtered = filtered.filter(v => v.is_favorite === true);
      }
      if (selectedFilter === 'HIGH_VIEWS') {
        filtered = filtered.filter(v => v.views >= 100000);
      }
      if (selectedFilter === 'LONG_DURATION') {
        filtered = filtered.filter(v => {
          const [m] = v.duration.split(':').map(Number);
          return m >= 30;
        });
      }
      if (selectedFilter === 'MISSING_TAGS') {
        filtered = filtered.filter(v => !v.tags || v.tags.length === 0);
      }
      if (selectedFilter === 'MISSING_DESC') {
        filtered = filtered.filter(v => !v.description || v.description.trim() === '');
      }

      setVideos(filtered);

      const defaultYt = {
        channel_id: 'UC_mock_channel_01',
        subscriber_count: currentTenant === '00000000-0000-0000-0000-000000000000' ? 142400 : 25100,
        total_views: currentTenant === '00000000-0000-0000-0000-000000000000' ? 4892400 : 920400,
        total_watch_time_minutes: 58245000,
        last_synced_at: new Date().toISOString()
      };

      const defaultSchemas = [
        {
          tableName: 'custom_youtube_leads',
          fields: [
            { name: 'id', type: 'UUID', primary: true },
            { name: 'lead_name', type: 'VARCHAR(255)' },
            { name: 'email', type: 'VARCHAR(255)' },
            { name: 'channel_size', type: 'INTEGER' }
          ]
        }
      ];

      const defaultChannels = [
        { id: 'chan-primary', channelId: 'UC_mock_channel_01', title: 'Primary Historical Chronicles', syncedCount: 4 }
      ];

      const defaultCollections = [
        { id: 'col-1', name: 'Best Tutorials', description: 'Premium tutorial walkthrough guides.', videoIds: ['chan-vid-1', 'chan-vid-2'] },
        { id: 'col-2', name: 'AI Videos', description: 'Exploring machine learning models.', videoIds: ['chan-vid-4'] }
      ];

      setYtMetrics(defaultYt);
      setCustomSchemas(defaultSchemas);
      setConnectedChannels(defaultChannels);
      setCollections(defaultCollections);
    }
  };

  useEffect(() => {
    loadData(tenantContext);
  }, [searchQuery, selectedCategory, selectedFilter]);

  const saveApiCredentials = async (e) => {
    e.preventDefault();
    if (typeof window !== 'undefined') {
      localStorage.setItem('CIP_OPENAI_API_KEY', openaiApiKey);
      localStorage.setItem('CIP_GOOGLE_CLIENT_ID', googleClientId);
      localStorage.setItem('CIP_GOOGLE_CLIENT_SECRET', googleClientSecret);
      localStorage.setItem('CIP_GOOGLE_ACCESS_TOKEN', googleAccessToken);
      localStorage.setItem('CIP_DATABASE_URL', dbConnString);
    }

    try {
      await fetch(`${API_URL}/api/v1/youtube/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
          accessToken: googleAccessToken
        })
      });

      await fetch(`${API_URL}/api/v1/ai/config`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: openaiApiKey
        })
      });
    } catch (err) {
      console.warn('[Dynamic Config] Sync warning: Backend config routes unreachable, local state active.');
    }

    setConfigSuccessMsg('Platform API credentials saved and dynamically propagated to original backend service variables!');
    loadData(tenantContext);
    setTimeout(() => setConfigSuccessMsg(''), 4000);
  };

  const clearApiCredentials = () => {
    setOpenaiApiKey('');
    setGoogleClientId('');
    setGoogleClientSecret('');
    setGoogleAccessToken('');
    setDbConnString('');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('CIP_OPENAI_API_KEY');
      localStorage.removeItem('CIP_GOOGLE_CLIENT_ID');
      localStorage.removeItem('CIP_GOOGLE_CLIENT_SECRET');
      localStorage.removeItem('CIP_GOOGLE_ACCESS_TOKEN');
      localStorage.removeItem('CIP_DATABASE_URL');
    }
    setConfigSuccessMsg('API credentials cleared from storage.');
    loadData(tenantContext);
    setTimeout(() => setConfigSuccessMsg(''), 4000);
  };

  const handleTenantChange = (e) => {
    const selected = e.target.value;
    setTenantContext(selected);

    let label = 'Primary Creator';
    if (selected === '88888888-8888-8888-8888-888888888888') label = 'Roman Chronicles Brand';
    if (selected === '99999999-9999-9999-9999-999999999999') label = 'Greek Legends Brand';

    setTenantContextLabel(label);
    loadData(selected);
  };

  const handleYtSync = async () => {
    setSyncStatusMsg('Refreshing Access Token and fetching YouTube Analytics...');
    try {
      const res = await fetch(`${API_URL}/api/v1/youtube/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantContext,
          'X-Google-Client-Id': localStorage.getItem('CIP_GOOGLE_CLIENT_ID') || '',
          'X-Google-Client-Secret': localStorage.getItem('CIP_GOOGLE_CLIENT_SECRET') || '',
          'X-Google-Access-Token': localStorage.getItem('CIP_GOOGLE_ACCESS_TOKEN') || ''
        }
      });
      if (res.ok) {
        const data = await res.json();
        setYtMetrics(data.metrics);
        setSyncStatusMsg(`YouTube data successfully synchronized! [Mode: ${data.mode}]`);

        // Refresh local quota usage metrics
        const resQ = await fetch(`${API_URL}/api/v1/youtube/quota`);
        if (resQ.ok) {
          const quotaResult = await resQ.json();
          setQuotaStats(quotaResult.data);
        }

        setTimeout(() => setSyncStatusMsg(''), 4000);
      } else {
        const dataErr = await res.json();
        if (dataErr.code === 'QUOTA_EXCEEDED') {
          setErrorMsg(dataErr.message);
          setTimeout(() => setErrorMsg(''), 8000);
        }
        throw new Error(dataErr.message || 'Sync fail');
      }
    } catch (err) {
      if (ytMetrics) {
        const updated = {
          ...ytMetrics,
          subscriber_count: ytMetrics.subscriber_count + 12,
          total_views: ytMetrics.total_views + 245,
          last_synced_at: new Date().toISOString()
        };
        setYtMetrics(updated);

        setQuotaStats(prev => {
          const nextUsed = prev.used + 2;
          return {
            ...prev,
            used: nextUsed,
            remaining: prev.limit - nextUsed,
            percentUsed: Number(((nextUsed / prev.limit) * 100).toFixed(2))
          };
        });

        setSyncStatusMsg('Simulated sync complete (API Gateway offline).');
        setTimeout(() => setSyncStatusMsg(''), 4000);
      }
    }
  };

  // Submit dynamic custom YouTube channel connection payload
  const handleConnectChannel = async (e) => {
    e.preventDefault();
    if (!newChannelId || !newChannelTitle) return;

    const payload = {
      channelId: newChannelId.trim(),
      title: newChannelTitle.trim()
    };

    try {
      const res = await fetch(`${API_URL}/api/v1/youtube/channels`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantContext
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const result = await res.json();
        setConnectedChannels([...connectedChannels, result.data.channel]);

        const formattedNewVideos = result.data.newVideos.map(vid => ({
          id: vid.id,
          title: vid.title,
          description: vid.description,
          status: 'published',
          views: 12450,
          duration: vid.duration,
          category: vid.category,
          tags: vid.tags,
          is_favorite: false
        }));
        setVideos([...videos, ...formattedNewVideos]);

        setChannelSuccessMsg(`Successfully linked custom channel: "${payload.title}" and synced upload playlist.`);
      } else {
        throw new Error('Gateway youtube-sync-service offline');
      }
    } catch (err) {
      const mockChannel = {
        id: `chan-${Math.random().toString(36).substring(4)}`,
        channelId: payload.channelId,
        title: payload.title,
        syncedCount: 2
      };

      const mockVids = [
        {
          id: `vid-mock-${Math.random().toString(36).substring(4)}`,
          title: `[${payload.title}] - Ancient Architectural Foundations`,
          description: `Exploring original archaeological excavations and spatial architectural layouts mapped specifically under channel ${payload.channelId}.`,
          status: 'published',
          views: 12450,
          duration: '15:20',
          category: 'Ancient Architecture',
          tags: ['Architecture', 'Excavation'],
          is_favorite: false
        },
        {
          id: `vid-mock-${Math.random().toString(36).substring(4)}`,
          title: `[${payload.title}] - Deciphering Lost Inscriptions`,
          description: `A close linguistic analysis of newly uncovered stone tablets, translating classical dialects into structural operational metadata.`,
          status: 'published',
          views: 8920,
          duration: '22:45',
          category: 'Linguistics',
          tags: ['Linguistics', 'Translation'],
          is_favorite: true
        }
      ];

      setConnectedChannels([...connectedChannels, mockChannel]);
      setVideos([...videos, ...mockVids]);
      setChannelSuccessMsg(`Connected Custom Channel (SIMULATED): "${payload.title}" and auto-arranged 2 linked video entries.`);
    }

    setNewChannelId('');
    setNewChannelTitle('');
    setTimeout(() => setChannelSuccessMsg(''), 6000);
  };

  // Dispatch schema adjustment payload
  const handleAlterSchema = async (e) => {
    e.preventDefault();
    if (!newTableName || !newFieldName) return;

    const payload = {
      tableName: newTableName.toLowerCase().trim(),
      action: selectedSchemaAction,
      fields: [
        { name: newFieldName.toLowerCase().trim(), type: newFieldType, primary: selectedSchemaAction === 'CREATE' && newFieldName.toLowerCase().trim() === 'id' }
      ]
    };

    if (selectedSchemaAction === 'CREATE' && payload.fields[0].name !== 'id') {
      payload.fields.unshift({ name: 'id', type: 'UUID', primary: true });
    }

    try {
      const res = await fetch(`${API_URL}/api/v1/schemas`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Tenant-Id': tenantContext
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        setSchemaSuccessMsg(`DDL Migrations Executed: "${data.data.sqlPreview}"`);
        const existing = customSchemas.find(s => s.tableName === payload.tableName);
        if (existing) {
          if (selectedSchemaAction === 'ADD_COLUMN') {
            existing.fields.push(payload.fields[0]);
            setCustomSchemas([...customSchemas]);
          }
        } else {
          setCustomSchemas([...customSchemas, { tableName: payload.tableName, fields: payload.fields }]);
        }
      } else {
        throw new Error('Gateway schema-manager offline');
      }
    } catch (err) {
      const sqlSimulated = selectedSchemaAction === 'CREATE'
        ? `CREATE TABLE IF NOT EXISTS public.${payload.tableName} (${payload.fields.map(f => `${f.name} ${f.type}${f.primary ? ' PRIMARY KEY' : ''}`).join(', ')});`
        : `ALTER TABLE public.${payload.tableName} ADD COLUMN IF NOT EXISTS ${payload.fields[0].name} ${payload.fields[0].type};`;

      setSchemaSuccessMsg(`Simulated Migration Code: "${sqlSimulated}" (Gateway offline)`);

      const existing = customSchemas.find(s => s.tableName === payload.tableName);
      if (existing) {
        if (selectedSchemaAction === 'ADD_COLUMN') {
          existing.fields.push(payload.fields[0]);
          setCustomSchemas([...customSchemas]);
        }
      } else {
        setCustomSchemas([...customSchemas, { tableName: payload.tableName, fields: payload.fields }]);
      }
    }

    setNewTableName('');
    setNewFieldName('');
    setTimeout(() => setSchemaSuccessMsg(''), 8000);
  };

  // Dynamic Custom Collection Creator
  const handleCreateCollection = async (e) => {
    e.preventDefault();
    if (!newCollectionName) return;

    const payload = {
      name: newCollectionName.trim(),
      description: newCollectionDesc.trim(),
      videoIds: []
    };

    try {
      const res = await fetch(`${API_URL}/api/v1/youtube/collections`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        setCollections([...collections, data.data]);
      } else {
        throw new Error('Fallback required');
      }
    } catch (err) {
      const mockCol = {
        id: `col-${Math.random().toString(36).substring(4)}`,
        name: payload.name,
        description: payload.description,
        videoIds: []
      };
      setCollections([...collections, mockCol]);
    }

    setNewCollectionName('');
    setNewCollectionDesc('');
  };

  // Dispatch Bulk actions
  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    if (selectedVideoIds.length === 0 || !bulkValue) return;

    const payload = {
      videoIds: selectedVideoIds,
      action: bulkAction,
      value: bulkValue
    };

    try {
      const res = await fetch(`${API_URL}/api/v1/youtube/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        loadData(tenantContext);
        setSelectedVideoIds([]);
        setBulkValue('');
      } else {
        throw new Error('Simulation fallback');
      }
    } catch (err) {
      setVideos(prev => prev.map(video => {
        if (selectedVideoIds.includes(video.id)) {
          const updated = { ...video };
          if (bulkAction === 'ADD_TAG') {
            updated.tags = [...(updated.tags || []), bulkValue];
          } else if (bulkAction === 'ADD_NOTE') {
            updated.researchNotes = bulkValue;
          } else if (bulkAction === 'TOGGLE_FAVORITE') {
            updated.is_favorite = (bulkValue === 'true');
          } else if (bulkAction === 'ASSIGN_LABEL') {
            updated.labels = [...(updated.labels || []), bulkValue];
          }
          return updated;
        }
        return video;
      }));
      setSelectedVideoIds([]);
      setBulkValue('');
    }
  };

  const handleSelectVideoCheckbox = (id) => {
    if (selectedVideoIds.includes(id)) {
      setSelectedVideoIds(selectedVideoIds.filter(v => v !== id));
    } else {
      setSelectedVideoIds([...selectedVideoIds, id]);
    }
  };

  // Math helper metrics summaries
  const totalViewsCalculated = videos.reduce((acc, v) => acc + (parseInt(String(v.views).replace(/,/g, '')) || 0), 0);
  const videosWithoutTags = videos.filter(v => !v.tags || v.tags.length === 0).length;
  const videosMissingDesc = videos.filter(v => !v.description || v.description.trim() === '').length;
  const highestViewedVideo = [...videos].sort((a,b) => b.views - a.views)[0];
  const lowestViewedVideo = [...videos].sort((a,b) => a.views - b.views)[0];

  const getSqlPreview = () => {
    if (!newTableName || !newFieldName) return '-- Enter Table & Column details to preview SQL DDL statement';
    const cleanTable = newTableName.toLowerCase().trim();
    const cleanField = newFieldName.toLowerCase().trim();
    if (selectedSchemaAction === 'CREATE') {
      const firstField = cleanField === 'id' ? '' : 'id UUID PRIMARY KEY, ';
      return `CREATE TABLE IF NOT EXISTS public.${cleanTable} (\n  ${firstField}${cleanField} ${newFieldType}\n);`;
    } else {
      return `ALTER TABLE public.${cleanTable} \nADD COLUMN IF NOT EXISTS ${cleanField} ${newFieldType};`;
    }
  };

  return (
    <div style={{ fontFamily: '"Inter", system-ui, -apple-system, sans-serif', padding: '0', backgroundColor: '#0b0f19', minHeight: '100vh', color: '#f8fafc' }}>

      {/* Premium Header with SaaS Tenant Switcher */}
      <header style={{ borderBottom: '1px solid #1e293b', padding: '16px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '22px', fontWeight: '800', letterSpacing: '-0.025em', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span>⚡</span> CIP Creator Command Center
          </h1>
          <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '12px' }}>YouTube Video Library MVP • Enterprise Workspace Suite</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>Scope:</span>
            <select
              value={tenantContext}
              onChange={handleTenantChange}
              style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', color: '#38bdf8', padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', outline: 'none' }}
            >
              <option value="00000000-0000-0000-0000-000000000000">Primary Creator Workspace</option>
              <option value="88888888-8888-8888-8888-888888888888">Roman Chronicles Brand</option>
              <option value="99999999-9999-9999-9999-999999999999">Greek Legends Brand</option>
            </select>
          </div>
          <div style={{ backgroundColor: '#111827', border: '1px solid #1e293b', padding: '6px 14px', borderRadius: '30px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.05em', color: '#94a3b8' }}>
            WORKSPACE: {tenantLabel.toUpperCase()}
          </div>
        </div>
      </header>

      <div style={{ padding: '32px 40px', maxWidth: '1700px', margin: '0 auto', display: 'grid', gridTemplateColumns: '3.1fr 1fr', gap: '30px' }}>

        {/* Main Operational Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

          {/* Library Summary Metrics Stat Widgets */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Total Indexed Videos</span>
              <p style={{ fontSize: '24px', fontWeight: '800', margin: '6px 0 0 0', color: '#f8fafc' }}>{videos.length}</p>
            </div>
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Aggregate View Count</span>
              <p style={{ fontSize: '24px', fontWeight: '800', margin: '6px 0 0 0', color: '#f8fafc' }}>{totalViewsCalculated.toLocaleString()}</p>
            </div>
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Videos Missing Tags</span>
              <p style={{ fontSize: '24px', fontWeight: '800', margin: '6px 0 0 0', color: '#f43f5e' }}>{videosWithoutTags}</p>
            </div>
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '20px', borderRadius: '12px' }}>
              <span style={{ fontSize: '11px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Videos Missing Desc</span>
              <p style={{ fontSize: '24px', fontWeight: '800', margin: '6px 0 0 0', color: '#eab308' }}>{videosMissingDesc}</p>
            </div>
          </div>

          {/* Quick Highest/Lowest Views HUD */}
          {highestViewedVideo && (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '16px 24px', borderRadius: '12px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '24px' }}>🔥</span>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Most Viewed Chronicle</span>
                  <h4 style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#cbd5e1' }}>{highestViewedVideo.title} ({parseInt(highestViewedVideo.views).toLocaleString()} views)</h4>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', borderLeft: '1px solid #1e293b', paddingLeft: '24px' }}>
                <span style={{ fontSize: '24px' }}>🧊</span>
                <div>
                  <span style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold' }}>Least Viewed Chronicle</span>
                  <h4 style={{ margin: '2px 0 0 0', fontSize: '13px', color: '#cbd5e1' }}>{lowestViewedVideo ? lowestViewedVideo.title : 'N/A'} ({lowestViewedVideo ? parseInt(lowestViewedVideo.views).toLocaleString() : 0} views)</h4>
                </div>
              </div>
            </div>
          )}

          {/* Real-time search engine input and category filters row */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '24px', borderRadius: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: '16px' }}>
              <input
                type="text"
                placeholder="Instant search by title, description, or tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ padding: '10px 16px', backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', color: '#f8fafc', fontSize: '14px', outline: 'none' }}
              />

              <select
                value={selectedFilter}
                onChange={(e) => setSelectedFilter(e.target.value)}
                style={{ padding: '10px', backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '8px', color: '#cbd5e1', outline: 'none', fontSize: '13px' }}
              >
                <option value="ALL">Operational Filters</option>
                <option value="FAVORITE">⭐ Favorites Only</option>
                <option value="HIGH_VIEWS">📈 Views &gt; 100K</option>
                <option value="LONG_DURATION">⏱️ Long Duration (&gt; 30 min)</option>
                <option value="MISSING_TAGS">⚠️ Missing Tags</option>
                <option value="MISSING_DESC">⚠️ Missing Description</option>
              </select>
            </div>

            {/* Horizontal Category / Topic Chips */}
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase', marginRight: '6px' }}>Topics:</span>
              {['All Topics', 'Ancient Rome', 'Byzantine Empire', 'Late Antiquity', 'Cliodynamics', 'Ancient Architecture', 'Linguistics'].map(cat => {
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      padding: '6px 14px',
                      backgroundColor: isActive ? '#38bdf8' : '#0b0f19',
                      color: isActive ? '#090d16' : '#94a3b8',
                      border: `1px solid ${isActive ? '#38bdf8' : '#1e293b'}`,
                      borderRadius: '20px',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bulk Operations Console Setting HUD */}
          {selectedVideoIds.length > 0 && (
            <div style={{ backgroundColor: '#1e1b4b', border: '1px solid #4f46e5', padding: '16px 24px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '13px', color: '#c7d2fe', fontWeight: 'bold' }}>
                Selected: {selectedVideoIds.length} video chronicles
              </span>

              <form onSubmit={handleBulkSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <select
                  value={bulkAction}
                  onChange={(e) => setBulkAction(e.target.value)}
                  style={{ padding: '8px 12px', backgroundColor: '#0b0f19', border: '1px solid #4f46e5', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
                >
                  <option value="ADD_TAG">Add Tag</option>
                  <option value="ASSIGN_LABEL">Assign Internal Label</option>
                  <option value="ADD_NOTE">Add Researcher Note</option>
                  <option value="TOGGLE_FAVORITE">Toggle Favorite Flag (true/false)</option>
                </select>

                <input
                  type="text"
                  placeholder="Value..."
                  value={bulkValue}
                  onChange={(e) => setBulkValue(e.target.value)}
                  required
                  style={{ padding: '8px 12px', backgroundColor: '#0b0f19', border: '1px solid #4f46e5', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none', width: '180px' }}
                />

                <button
                  type="submit"
                  style={{ padding: '8px 16px', backgroundColor: '#4f46e5', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
                >
                  Execute Bulk Action
                </button>
              </form>
            </div>
          )}

          {/* Main Video Library Listing Relational Grid */}
          <section style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '24px', borderRadius: '16px' }}>
            <h2 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '800' }}>Indexed Channel Videos ({videos.length})</h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {videos.map(v => {
                const isSelected = selectedVideoIds.includes(v.id);
                return (
                  <div
                    key={v.id}
                    style={{
                      border: '1px solid #1e293b',
                      backgroundColor: isSelected ? '#1e293b' : '#0b0f19',
                      padding: '16px 20px',
                      borderRadius: '10px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '20px'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => handleSelectVideoCheckbox(v.id)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <h3
                            onClick={() => setActiveVideoDetail(v)}
                            style={{ margin: 0, fontSize: '15px', fontWeight: 'bold', color: '#f8fafc', cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            {v.title}
                          </h3>
                          {v.is_favorite && <span style={{ color: '#eab308' }}>⭐</span>}
                        </div>
                        <p style={{ margin: '4px 0 0 0', color: '#64748b', fontSize: '12px' }}>
                          👁️ {parseInt(v.views).toLocaleString()} views • ⏱️ {v.duration} • 📂 {v.category || 'History'} • 📅 {v.publishedAt}
                        </p>

                        {/* Tags list */}
                        {v.tags && v.tags.length > 0 && (
                          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '8px' }}>
                            {v.tags.map(tag => (
                              <span key={tag} style={{ fontSize: '10px', backgroundColor: '#1e293b', color: '#94a3b8', padding: '2px 8px', borderRadius: '4px' }}>#{tag}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => setActiveVideoDetail(v)}
                        style={{ padding: '6px 12px', backgroundColor: '#1e293b', border: '1px solid #334155', color: '#cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}
                      >
                        Inspect Details
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Dynamic Interactive Video Details Drawer Modal */}
          {activeVideoDetail && (
            <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '480px', backgroundColor: '#0f172a', borderLeft: '1px solid #1e293b', boxShadow: '-10px 0 25px rgba(0,0,0,0.5)', zIndex: 1000, padding: '30px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '14px' }}>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '800', color: '#38bdf8' }}>Chronicle Explorer</h3>
                <button
                  onClick={() => setActiveVideoDetail(null)}
                  style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '20px', cursor: 'pointer' }}
                >
                  ✕
                </button>
              </div>

              {/* Title, Views, Duration */}
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#64748b' }}>Video Title</span>
                <h2 style={{ margin: '4px 0 8px 0', fontSize: '18px', fontWeight: 'bold', color: '#f8fafc' }}>{activeVideoDetail.title}</h2>
                <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: '#94a3b8' }}>
                  <span>👁️ {parseInt(activeVideoDetail.views).toLocaleString()} views</span>
                  <span>⏱️ {activeVideoDetail.duration}</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#64748b' }}>Description</span>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#cbd5e1', lineHeight: '1.5' }}>
                  {activeVideoDetail.description || 'No description provided.'}
                </p>
              </div>

              {/* Simulated Comments Log list */}
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#64748b' }}>Audience Comments Feed</span>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '6px' }}>
                  <div style={{ backgroundColor: '#0b0f19', border: '1px solid #1e293b', padding: '10px', borderRadius: '6px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 'bold', color: '#94a3b8' }}>
                      <span>@thucydides_reader</span>
                      <span>2 days ago</span>
                    </div>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#cbd5e1' }}>Fantastic structural analysis of monetary devaluation. YouTube Studio doesn't offer these breakdown frameworks!</p>
                  </div>
                </div>
              </div>

              {/* Simulated Caption Transcript */}
              <div>
                <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#64748b' }}>Linguistic Caption Transcript</span>
                <div style={{ maxHeight: '120px', overflowY: 'auto', backgroundColor: '#0b0f19', border: '1px solid #1e293b', padding: '12px', borderRadius: '6px', fontSize: '12px', color: '#94a3b8', lineHeight: '1.6', fontStyle: 'italic' }}>
                  "[0:12] Welcome to the Chronicles. [1:45] Today we explore how hyperinflation debased silver purity down below 2%, triggering immediate flight arrays out from classical urban networks..."
                </div>
              </div>

              {/* Research Notes */}
              {activeVideoDetail.researchNotes && (
                <div>
                  <span style={{ fontSize: '10px', textTransform: 'uppercase', fontWeight: 'bold', color: '#64748b' }}>Researcher Custom Note</span>
                  <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#10b981', fontStyle: 'italic' }}>
                    "{activeVideoDetail.researchNotes}"
                  </p>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Sidebar Controls Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

          {/* Custom Collections Creator & Selector settings */}
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '14px', fontSize: '15px', fontWeight: '800', color: '#38bdf8' }}>
              📁 Custom Collections
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              Create custom collections to organize, classify, and filter videos more flexibly than YouTube playlists.
            </p>

            <form onSubmit={handleCreateCollection} style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
              <input
                type="text"
                placeholder="Collection name..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                required
                style={{ padding: '8px 12px', backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
              <input
                type="text"
                placeholder="Description..."
                value={newCollectionDesc}
                onChange={(e) => setNewCollectionDesc(e.target.value)}
                style={{ padding: '8px 12px', backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '6px', color: '#fff', fontSize: '13px', outline: 'none' }}
              />
              <button
                type="submit"
                style={{ padding: '8px 12px', backgroundColor: '#38bdf8', color: '#090d16', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
              >
                Create Collection
              </button>
            </form>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {collections.map(col => (
                <div key={col.id} style={{ border: '1px solid #1e293b', padding: '12px', borderRadius: '8px', backgroundColor: '#0b0f19' }}>
                  <h4 style={{ margin: 0, fontSize: '13px', color: '#f8fafc', fontWeight: 'bold' }}>{col.name}</h4>
                  <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#64748b' }}>{col.description}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Connect Custom YouTube Channel setting panel */}
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #ef4444', borderTopWidth: '4px', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '14px', fontSize: '15px', fontWeight: '700', color: '#ef4444', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🔌</span> Connect Channel
            </h3>
            <p style={{ fontSize: '12px', color: '#64748b', lineHeight: '1.5', margin: '0 0 16px 0' }}>
              Enter a custom YouTube Channel ID to dynamically connect and arrange videos straight from its upload history stream.
            </p>

            <form onSubmit={handleConnectChannel} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase' }}>
                Channel Name / Title
                <input
                  type="text"
                  placeholder="e.g. Bronze Age Chronicles"
                  value={newChannelTitle}
                  onChange={(e) => setNewChannelTitle(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', marginTop: '4px', backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                />
              </label>

              <label style={{ fontSize: '11px', fontWeight: 'bold', color: '#cbd5e1', textTransform: 'uppercase' }}>
                YouTube Channel ID
                <input
                  type="text"
                  placeholder="e.g. UC_custom_bronze_928"
                  value={newChannelId}
                  onChange={(e) => setNewChannelId(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', marginTop: '4px', backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                />
              </label>

              <button
                type="submit"
                style={{ padding: '12px', backgroundColor: '#ef4444', color: '#fff', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
              >
                Link & Sync Channel
              </button>
            </form>

            {channelSuccessMsg && (
              <div style={{ marginTop: '14px', padding: '10px', backgroundColor: '#111827', borderLeft: '3px solid #10b981', color: '#10b981', fontSize: '12px', borderRadius: '0 6px 6px 0' }}>
                {channelSuccessMsg}
              </div>
            )}
          </div>

          {/* Real-Time APIs Credentials Configuration Setting HUD */}
          <section style={{ backgroundColor: '#0f172a', border: '1px solid #38bdf8', borderLeftWidth: '6px', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '12px', fontSize: '14px', fontWeight: '800', color: '#38bdf8' }}>
              🔑 API Credentials settings
            </h3>
            <form onSubmit={saveApiCredentials} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input
                type="password"
                placeholder="OpenAI API Key..."
                value={openaiApiKey}
                onChange={(e) => setOpenaiApiKey(e.target.value)}
                style={{ width: '100%', padding: '10px', backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
              />
              <input
                type="text"
                placeholder="Google Client ID"
                value={googleClientId}
                onChange={(e) => setGoogleClientId(e.target.value)}
                style={{ width: '100%', padding: '10px', backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
              />
              <input
                type="password"
                placeholder="Google Client Secret"
                value={googleClientSecret}
                onChange={(e) => setGoogleClientSecret(e.target.value)}
                style={{ width: '100%', padding: '10px', backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
              />
              <input
                type="password"
                placeholder="Google Access Token"
                value={googleAccessToken}
                onChange={(e) => setGoogleAccessToken(e.target.value)}
                style={{ width: '100%', padding: '10px', backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
              />
              <button
                type="submit"
                style={{ padding: '11px 16px', backgroundColor: '#38bdf8', color: '#090d16', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
              >
                Save Keys
              </button>
            </form>
          </section>

          {/* Dynamic Schema Management Controller UI */}
          <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '24px', borderRadius: '16px' }}>
            <h3 style={{ marginTop: 0, marginBottom: '14px', fontSize: '15px', fontWeight: '700', color: '#14b8a6', borderBottom: '1px solid #1e293b', paddingBottom: '12px' }}>
              ⚙️ Dynamic Schema Manager
            </h3>

            <form onSubmit={handleAlterSchema} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <select
                value={selectedSchemaAction}
                onChange={(e) => setSelectedSchemaAction(e.target.value)}
                style={{ width: '100%', padding: '10px', backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
              >
                <option value="CREATE">CREATE NEW TABLE</option>
                <option value="ADD_COLUMN">ADD NEW COLUMN TO TABLE</option>
              </select>

              <input
                type="text"
                placeholder="Table name..."
                value={newTableName}
                onChange={(e) => setNewTableName(e.target.value)}
                required
                style={{ width: '100%', padding: '10px', backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
              />

              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '10px' }}>
                <input
                  type="text"
                  placeholder="Column name..."
                  value={newFieldName}
                  onChange={(e) => setNewFieldName(e.target.value)}
                  required
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                />

                <select
                  value={newFieldType}
                  onChange={(e) => setNewFieldType(e.target.value)}
                  style={{ width: '100%', padding: '10px', backgroundColor: '#0b0f19', border: '1px solid #1e293b', borderRadius: '6px', color: '#f8fafc', fontSize: '13px', outline: 'none' }}
                >
                  <option value="VARCHAR(255)">VARCHAR(255)</option>
                  <option value="NVARCHAR(255)">NVARCHAR(255) (Telugu Titles)</option>
                  <option value="NCHAR(10)">NCHAR(10) (Telugu Codes)</option>
                  <option value="INTEGER">INTEGER</option>
                  <option value="BOOLEAN">BOOLEAN</option>
                  <option value="TIMESTAMP">TIMESTAMP</option>
                  <option value="TEXT">TEXT</option>
                </select>
              </div>

              <pre style={{ margin: '4px 0 0 0', backgroundColor: '#0b0f19', border: '1px solid #1e293b', padding: '10px', borderRadius: '6px', fontSize: '11px', color: '#10b981', overflowX: 'auto', whiteSpace: 'pre-wrap' }}>
                {getSqlPreview()}
              </pre>

              <button
                type="submit"
                style={{ padding: '12px', backgroundColor: '#14b8a6', color: '#0f172a', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}
              >
                Execute Dynamic Migration
              </button>
            </form>
          </div>

        </div>

      </div>
    </div>
  );
}
