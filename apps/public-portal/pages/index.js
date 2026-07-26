import React, { useState, useEffect, useRef } from 'react';

// Pre-seeded high-quality videos representing the Content Intelligence Platform's premium library.
const INITIAL_VIDEOS = [
  {
    id: 'yt-1',
    youtubeId: 'b9SbyPZfF-E', // Interactive YouTube Embed fallback
    title: 'The Great Crisis of the Third Century',
    description: 'An in-depth analysis of how economic collapse, constant civil conflicts, and external barbarian invasions nearly destroyed the Roman Empire. This chronicle details hyperinflation, monetary debasement, and Aurelian’s rapid reunification efforts.',
    category: 'Ancient Rome',
    tags: ['Crisis', 'Economy', 'Rome', 'Military'],
    duration: '42:15',
    views: '124,592',
    publishedAt: '2026-04-12',
    linkedBookIds: ['101', '103'],
    researchNotes: 'Key takeaway: Monetary debasement (silver purity falling below 2%) was the primary catalyst of urban flight and structural economic regression.'
  },
  {
    id: 'yt-2',
    youtubeId: 'tO13uXz-X-k',
    title: 'Byzantine Siege Engines & Firepower',
    description: 'Exploring the advanced engineering of medieval Constantinople. Unveiling the chemical mystery behind Greek Fire, defensive double-walls, and the mechanical superiorities of traction counterweight trebuchets.',
    category: 'Byzantine Empire',
    tags: ['Byzantium', 'Engineering', 'Military', 'Greek Fire'],
    duration: '31:40',
    views: '89,412',
    publishedAt: '2026-05-02',
    linkedBookIds: ['102'],
    researchNotes: 'Greek Fire was an early naval incendiary weapon. The precise pressurized siphon mechanism remains a closely guarded historical secret.'
  },
  {
    id: 'yt-3',
    youtubeId: 'L_W-YfC0VIs',
    title: 'The Silencing of the Libraries: Late Antiquity Paradigm Shifts',
    description: 'Tracing the transition of knowledge networks from pagan academies to monastic scriptoriums. How scrolls were systematically copied, stored, or lost during the turbulent centuries of intellectual reconstruction.',
    category: 'Late Antiquity',
    tags: ['Libraries', 'History', 'Knowledge', 'Culture'],
    duration: '28:10',
    views: '45,391',
    publishedAt: '2026-06-18',
    linkedBookIds: ['104', '101'],
    researchNotes: 'Monastic transcription preservation rates varied heavily depending on parchment availability and the localized political stability of monastic networks.'
  },
  {
    id: 'yt-4',
    youtubeId: 'U_g6b8g_L_8',
    title: 'Socio-Political Decay Trends in Hegemonic Empires',
    description: 'A mathematical and systemic modeling approach to civilizational collapse. Examining Peter Turchin’s cliodynamics, elite overproduction, fiscal distress, and popular immiseration across dynasties.',
    category: 'Cliodynamics',
    tags: ['Cliodynamics', 'Economy', 'Decline', 'System Dynamics'],
    duration: '54:30',
    views: '210,883',
    publishedAt: '2026-07-10',
    linkedBookIds: ['103', '104'],
    researchNotes: 'Elite overproduction consistently triggers intra-elite conflict, which fragments central administration during structural crises.'
  }
];

const INITIAL_BOOKS = [
  { id: '101', title: 'The Histories of Herodotus', author: 'Herodotus', description: 'The founding chronicle of Western historical narrative, exploring the origins of Greco-Persian Wars.' },
  { id: '102', title: 'De Administrando Imperio', author: 'Constantine VII Porphyrogenitus', description: 'A diplomatic and tactical manual compiled by the Byzantine Emperor for political stewardship.' },
  { id: '103', title: 'Secular Cycles', author: 'Peter Turchin & Sergey Nefedov', description: 'An empirical application of demographic-structural theory to historical long-term cycles.' },
  { id: '104', title: 'The Library of Alexandria: Centre of Learning', author: 'Roy MacLeod', description: 'A thorough study of the mythical library as the ancient hub of global scientific synergy.' }
];

const CATEGORIES = ['All Topics', 'Ancient Rome', 'Byzantine Empire', 'Late Antiquity', 'Cliodynamics'];

export default function PublicHome() {
  const [videos, setVideos] = useState([]);
  const [books, setBooks] = useState(INITIAL_BOOKS);
  const [activeVideo, setActiveVideo] = useState(INITIAL_VIDEOS[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Topics');

  // Custom video player state simulations (high fidelity)
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [theaterMode, setTheaterMode] = useState(false);

  const timerRef = useRef(null);

  // Load videos
  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    const loadPublicData = async () => {
      try {
        const resV = await fetch(`${API_URL}/api/v1/videos?status=published`);
        if (resV.ok) {
          const data = await resV.json();
          // Merge API results with rich mock attributes to ensure a stellar portal UI
          const merged = INITIAL_VIDEOS.map(v => {
            const apiMatch = data.find(item => item.title.toLowerCase() === v.title.toLowerCase());
            return apiMatch ? { ...v, ...apiMatch } : v;
          });
          setVideos(merged);
        } else {
          setVideos(INITIAL_VIDEOS);
        }

        const resB = await fetch(`${API_URL}/api/v1/library/books`);
        if (resB.ok) {
          const data = await resB.json();
          const mergedBooks = INITIAL_BOOKS.map(b => {
            const apiMatch = data.find(item => item.title.toLowerCase() === b.title.toLowerCase());
            return apiMatch ? { ...b, ...apiMatch } : b;
          });
          setBooks(mergedBooks);
        }
      } catch (err) {
        setVideos(INITIAL_VIDEOS);
        setBooks(INITIAL_BOOKS);
      }
    };

    loadPublicData();
  }, []);

  // Sync simulator timer when video is playing
  useEffect(() => {
    if (isPlaying) {
      timerRef.current = setInterval(() => {
        setCurrentTime(prev => {
          const [min, sec] = activeVideo.duration.split(':').map(Number);
          const totalSec = min * 60 + sec;
          if (prev >= totalSec) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 1 * playbackSpeed;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
    }

    return () => clearInterval(timerRef.current);
  }, [isPlaying, activeVideo, playbackSpeed]);

  // Handle playing video
  const handleSelectVideo = (video) => {
    setActiveVideo(video);
    setCurrentTime(0);
    setIsPlaying(true);
  };

  // Convert progress seconds to format
  const formatTime = (secs) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Calculate percentage of video watched
  const getProgressPercent = () => {
    if (!activeVideo) return 0;
    const [min, sec] = activeVideo.duration.split(':').map(Number);
    const totalSec = min * 60 + sec;
    return (currentTime / totalSec) * 100;
  };

  const handleProgressBarClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const ratio = clickX / width;

    const [min, sec] = activeVideo.duration.split(':').map(Number);
    const totalSec = min * 60 + sec;
    setCurrentTime(Math.floor(totalSec * ratio));
  };

  // Dynamic filter lists
  const filteredVideos = videos.filter(v => {
    const matchesSearch = v.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          v.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesCategory = selectedCategory === 'All Topics' || v.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div style={{ fontFamily: '"Inter", system-ui, -apple-system, sans-serif', padding: '0', backgroundColor: '#090d16', minHeight: '100vh', color: '#f1f5f9' }}>

      {/* Premium Header */}
      <header style={{ borderBottom: '1px solid #1e293b', padding: '20px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#0f172a', position: 'sticky', top: 0, zIndex: 100 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ backgroundColor: '#38bdf8', color: '#090d16', padding: '6px 12px', borderRadius: '6px', fontWeight: '900', fontSize: '18px' }}>CIP</div>
          <div>
            <h1 style={{ margin: 0, fontSize: '20px', fontWeight: '800', letterSpacing: '-0.025em', color: '#f8fafc' }}>
              Content Intelligence Portal
            </h1>
            <p style={{ margin: '2px 0 0 0', color: '#64748b', fontSize: '12px' }}>Enterprise Library & Historical Analytics Engine</p>
          </div>
        </div>

        {/* Real-time search engine input */}
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '400px' }}>
          <div style={{ position: 'relative', width: '100%' }}>
            <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#475569', fontSize: '16px' }}>🔍</span>
            <input
              type="text"
              placeholder="Search chronicles, categories, or keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                padding: '10px 16px 10px 42px',
                backgroundColor: '#111827',
                border: '1px solid #1f2937',
                borderRadius: '8px',
                width: '100%',
                color: '#f8fafc',
                fontSize: '14px',
                outline: 'none',
                transition: 'border-color 0.2s',
              }}
              onFocus={(e) => e.target.style.borderColor = '#38bdf8'}
              onBlur={(e) => e.target.style.borderColor = '#1f2937'}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: '#64748b', cursor: 'pointer', fontSize: '14px' }}
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <div style={{
        maxWidth: '1600px',
        margin: '0 auto',
        padding: '30px 40px',
        display: 'grid',
        gridTemplateColumns: theaterMode ? '1fr' : '3fr 1.1fr',
        gap: '30px',
        transition: 'all 0.3s'
      }}>

        {/* Main Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>

          {/* Active Player Deck */}
          {activeVideo && (
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)' }}>

              {/* Screen Container */}
              <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#000' }}>

                {/* Embed / Simulator Selector */}
                <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}>

                  {/* YouTube Interactive Playback Mode */}
                  {activeVideo.youtubeId ? (
                    <iframe
                      width="100%"
                      height="100%"
                      src={`https://www.youtube.com/embed/${activeVideo.youtubeId}?autoplay=${isPlaying ? 1 : 0}&enablejsapi=1`}
                      title={activeVideo.title}
                      frameBorder="0"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      allowFullScreen
                      style={{ position: 'absolute', top: 0, left: 0 }}
                    ></iframe>
                  ) : (
                    // Premium Custom Visual HTML5 Player Frame
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', backgroundImage: 'radial-gradient(circle, #1e293b 0%, #020617 100%)' }}>
                      <div style={{ textAlign: 'center', padding: '0 40px' }}>
                        <div style={{ color: '#38bdf8', fontSize: '48px', marginBottom: '16px' }}>📽️</div>
                        <h2 style={{ fontSize: '24px', fontWeight: '800', marginBottom: '8px' }}>{activeVideo.title}</h2>
                        <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '500px', margin: '0 auto' }}>{activeVideo.description.slice(0, 150)}...</p>
                      </div>

                      {/* Custom Screen HUD */}
                      {isPlaying && (
                        <div style={{ position: 'absolute', top: '20px', left: '20px', backgroundColor: 'rgba(0,0,0,0.6)', padding: '6px 12px', borderRadius: '4px', fontSize: '11px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', animation: 'pulse 1.5s infinite' }}></span>
                          PLAYBACK LIVE (SIMULATION MODE)
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Cover Overlay Control HUD (Only displayed if using simulation) */}
                {!activeVideo.youtubeId && (
                  <div style={{
                    position: 'absolute',
                    bottom: 0,
                    left: 0,
                    right: 0,
                    background: 'linear-gradient(transparent, rgba(0,0,0,0.9))',
                    padding: '20px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px'
                  }}>
                    {/* Progress slider bar */}
                    <div
                      onClick={handleProgressBarClick}
                      style={{ height: '6px', width: '100%', backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: '3px', position: 'relative', cursor: 'pointer' }}
                    >
                      <div style={{ height: '100%', width: `${getProgressPercent()}%`, backgroundColor: '#38bdf8', borderRadius: '3px', transition: 'width 0.1s linear' }} />
                    </div>

                    {/* Controller Options Panel */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                        <button
                          onClick={() => setIsPlaying(!isPlaying)}
                          style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', fontSize: '18px' }}
                        >
                          {isPlaying ? '⏸️ Pause' : '▶️ Play'}
                        </button>
                        <span style={{ fontSize: '13px', color: '#cbd5e1' }}>
                          {formatTime(currentTime)} / {activeVideo.duration}
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
                        {/* Speed Adjuster */}
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center', fontSize: '12px', color: '#94a3b8' }}>
                          <span>Speed:</span>
                          {[0.5, 1.0, 1.5, 2.0].map(s => (
                            <button
                              key={s}
                              onClick={() => setPlaybackSpeed(s)}
                              style={{
                                padding: '2px 6px',
                                background: playbackSpeed === s ? '#38bdf8' : '#1e293b',
                                color: playbackSpeed === s ? '#090d16' : '#cbd5e1',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '11px',
                                fontWeight: 'bold'
                              }}
                            >
                              {s}x
                            </button>
                          ))}
                        </div>

                        {/* Mute and volume */}
                        <button
                          onClick={() => setIsMuted(!isMuted)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#fff' }}
                        >
                          {isMuted ? '🔇' : '🔊'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Video Title Card / Metrics */}
              <div style={{ padding: '30px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  <div>
                    <span style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '4px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                      {activeVideo.category}
                    </span>
                    <h2 style={{ fontSize: '24px', fontWeight: '800', marginTop: '12px', marginBottom: '8px', color: '#f8fafc' }}>
                      {activeVideo.title}
                    </h2>
                    <div style={{ display: 'flex', gap: '16px', color: '#64748b', fontSize: '13px', marginBottom: '16px' }}>
                      <span>👁️ {activeVideo.views} views</span>
                      <span>⏱️ Duration: {activeVideo.duration}</span>
                      <span>📅 Published: {activeVideo.publishedAt}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={() => setTheaterMode(!theaterMode)}
                      style={{ padding: '8px 16px', backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '8px', color: '#f8fafc', fontSize: '13px', cursor: 'pointer' }}
                    >
                      {theaterMode ? 'Standard Layout' : 'Theater Layout'}
                    </button>
                  </div>
                </div>

                <p style={{ color: '#cbd5e1', fontSize: '15px', lineHeight: '1.7', margin: '0 0 24px 0' }}>
                  {activeVideo.description}
                </p>

                {/* Custom Research takeaway block */}
                {activeVideo.researchNotes && (
                  <div style={{ padding: '20px', backgroundColor: '#0b1329', borderLeft: '4px solid #38bdf8', borderRadius: '0 8px 8px 0', border: '1px solid #1f2937', borderLeftWidth: '4px' }}>
                    <h4 style={{ margin: '0 0 6px 0', fontSize: '13px', fontWeight: 'bold', color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Strategic Takeaway / Researcher Notes
                    </h4>
                    <p style={{ margin: 0, fontSize: '14px', color: '#94a3b8', lineHeight: '1.5', fontStyle: 'italic' }}>
                      "{activeVideo.researchNotes}"
                    </p>
                  </div>
                )}

                {/* Tag pill layout */}
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '20px' }}>
                  {activeVideo.tags.map(tag => (
                    <span
                      key={tag}
                      onClick={() => setSearchQuery(tag)}
                      style={{ padding: '4px 12px', backgroundColor: '#111827', border: '1px solid #1f2937', borderRadius: '30px', fontSize: '12px', color: '#94a3b8', cursor: 'pointer' }}
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Interactive filter chip navigation row */}
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ color: '#64748b', fontSize: '14px', marginRight: '8px', fontWeight: 'bold' }}>Topics:</span>
            {CATEGORIES.map(category => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  padding: '8px 16px',
                  backgroundColor: selectedCategory === category ? '#38bdf8' : '#0f172a',
                  color: selectedCategory === category ? '#090d16' : '#cbd5e1',
                  border: '1px solid #1e293b',
                  borderRadius: '30px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '13px',
                  transition: 'all 0.2s'
                }}
              >
                {category}
              </button>
            ))}
          </div>

          {/* Real Video Grid library list */}
          <section style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '30px', borderRadius: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: '#f8fafc' }}>
                Video Archive ({filteredVideos.length} chronicles found)
              </h2>
            </div>

            {filteredVideos.length === 0 ? (
              <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b' }}>
                <p style={{ fontSize: '28px', margin: '0 0 10px 0' }}>📂</p>
                <p style={{ fontSize: '15px' }}>No chronicles matched your filters or search keywords.</p>
                <button
                  onClick={() => { setSearchQuery(''); setSelectedCategory('All Topics'); }}
                  style={{ marginTop: '14px', padding: '8px 16px', backgroundColor: '#1e293b', border: 'none', color: '#38bdf8', borderRadius: '6px', cursor: 'pointer' }}
                >
                  Reset all filters
                </button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
                {filteredVideos.map(v => {
                  const isActive = activeVideo && activeVideo.id === v.id;
                  return (
                    <div
                      key={v.id}
                      onClick={() => handleSelectVideo(v)}
                      style={{
                        border: '1px solid #1e293b',
                        backgroundColor: isActive ? '#1e293b' : '#090d16',
                        borderRadius: '12px',
                        overflow: 'hidden',
                        cursor: 'pointer',
                        transition: 'transform 0.2s, border-color 0.2s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.transform = 'translateY(-4px)';
                        e.currentTarget.style.borderColor = '#38bdf8';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.borderColor = '#1e293b';
                      }}
                    >
                      {/* Video Thumbnail Frame */}
                      <div style={{ position: 'relative', width: '100%', paddingTop: '56.25%', backgroundColor: '#020617', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundImage: 'radial-gradient(circle, #1e293b, #090d16)' }}>
                          <span style={{ fontSize: '32px' }}>📹</span>
                        </div>
                        <span style={{ position: 'absolute', bottom: '8px', right: '8px', backgroundColor: 'rgba(0,0,0,0.8)', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#f8fafc', fontWeight: 'bold' }}>
                          {v.duration}
                        </span>
                        {isActive && (
                          <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(56, 189, 248, 0.15)', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                            <span style={{ fontSize: '14px', fontWeight: 'bold', color: '#38bdf8', backgroundColor: '#090d16', padding: '6px 12px', borderRadius: '30px', border: '1px solid #38bdf8' }}>
                              ⚡ NOW PLAYING
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Content details */}
                      <div style={{ padding: '16px' }}>
                        <span style={{ color: '#38bdf8', fontSize: '11px', fontWeight: 'bold', textTransform: 'uppercase' }}>
                          {v.category}
                        </span>
                        <h3 style={{ margin: '6px 0 8px 0', fontSize: '14px', fontWeight: 'bold', color: '#f8fafc', lineHeight: '1.4' }}>
                          {v.title}
                        </h3>
                        <p style={{ margin: 0, color: '#64748b', fontSize: '12px', lineBreak: 'anywhere' }}>
                          👁️ {v.views} views • {v.publishedAt}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>

        {/* Bibliography Sidebar - prioritized based on active video selection */}
        {!theaterMode && (
          <aside style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '24px', borderRadius: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #1e293b', paddingBottom: '14px', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.01em' }}>
                  Public Bibliography
                </h3>
                <span style={{ backgroundColor: '#1e293b', color: '#38bdf8', padding: '2px 8px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>
                  References
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {books.map(b => {
                  const isLinkedToActive = activeVideo && activeVideo.linkedBookIds.includes(b.id);
                  return (
                    <div
                      key={b.id}
                      style={{
                        border: '1px solid #1e293b',
                        padding: '16px',
                        borderRadius: '12px',
                        backgroundColor: isLinkedToActive ? '#0e1e38' : '#090d16',
                        borderColor: isLinkedToActive ? '#38bdf8' : '#1e293b',
                        transition: 'all 0.3s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                        <h4 style={{ margin: 0, fontSize: '13px', fontWeight: 'bold', color: isLinkedToActive ? '#38bdf8' : '#f8fafc' }}>
                          {b.title}
                        </h4>
                        {isLinkedToActive && (
                          <span style={{ fontSize: '10px', fontWeight: 'bold', color: '#38bdf8', backgroundColor: 'rgba(56, 189, 248, 0.1)', padding: '2px 6px', borderRadius: '4px', textTransform: 'uppercase' }}>
                            Linked Reference
                          </span>
                        )}
                      </div>
                      <p style={{ margin: '0 0 10px 0', fontSize: '12px', color: '#64748b' }}>By {b.author}</p>
                      <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8', lineHeight: '1.4' }}>{b.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Custom Interactive Knowledge Graph Sidebar Panel */}
            <div style={{ backgroundColor: '#0f172a', border: '1px solid #1e293b', padding: '24px', borderRadius: '16px' }}>
              <h3 style={{ margin: '0 0 10px 0', fontSize: '14px', fontWeight: '800', color: '#f8fafc' }}>Platform Integration</h3>
              <p style={{ margin: 0, fontSize: '13px', color: '#64748b', lineHeight: '1.5' }}>
                All videos are fully cataloged, indexed using semantically linked graphs, and bound to raw research entities automatically by our backend intelligence pipeline.
              </p>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
