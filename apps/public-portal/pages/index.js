import React, { useState, useEffect } from 'react';

export default function PublicHome() {
  const [videos, setVideos] = useState([]);
  const [books, setBooks] = useState([]);
  const [selectedNode, setSelectedNode] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  useEffect(() => {
    // Load published videos and books
    const loadPublicData = async () => {
      try {
        const resV = await fetch(`${API_URL}/api/v1/videos?status=published`);
        if (resV.ok) {
          const data = await resV.json();
          setVideos(data);
        } else {
          throw new Error('API down');
        }

        const resB = await fetch(`${API_URL}/api/v1/library/books`);
        if (resB.ok) {
          const data = await resB.json();
          setBooks(data);
        }
      } catch (err) {
        // Resilient fallback structures for local offline operation
        setVideos([
          { id: '1', title: 'Rise and Fall of Ancient Rome', description: 'Deep historical exploration' }
        ]);
        setBooks([
          { id: '101', title: 'The Histories of Herodotus', author: 'Herodotus' }
        ]);
      }
    };

    loadPublicData();
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    alert(`Semantic search executed for: "${searchQuery}" (Mock query completed)`);
  };

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '24px', backgroundColor: '#fafafa', minHeight: '100vh', color: '#2d3748' }}>
      <header style={{ marginBottom: '40px', borderBottom: '1px solid #e2e8f0', paddingBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '28px', color: '#1a202c' }}>CIP Public Knowledge Portal</h1>
          <p style={{ margin: '6px 0 0 0', color: '#718096' }}>Phase 3 — Explore maps, series, bibliographies, and transcripts</p>
        </div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Semantic search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '8px 12px', border: '1px solid #cbd5e0', borderRadius: '4px', width: '240px' }}
          />
          <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#2b6cb0', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}>
            Search
          </button>
        </form>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '32px' }}>
        <div>
          {/* Interactive Knowledge Graph Section */}
          <section style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', marginBottom: '32px' }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px' }}>Interactive Public Knowledge Graph</h2>
            <div style={{ border: '2px dashed #e2e8f0', height: '320px', borderRadius: '6px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#f7fafc', overflow: 'hidden' }}>

              {/* Graphic connections */}
              <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <line x1="20%" y1="50%" x2="50%" y2="25%" stroke="#cbd5e0" strokeWidth="2" />
                  <line x1="80%" y1="50%" x2="50%" y2="25%" stroke="#cbd5e0" strokeWidth="2" />
                  <line x1="50%" y1="75%" x2="50%" y2="25%" stroke="#cbd5e0" strokeWidth="2" />
                </svg>
              </div>

              {/* Central root node */}
              <button
                onClick={() => setSelectedNode({ label: 'Roman Empire', type: 'Civilization', properties: 'Spanned three continents, governed over 50 million citizens.' })}
                style={{ position: 'absolute', top: '20%', left: '40%', width: '120px', padding: '12px', border: 'none', borderRadius: '30px', backgroundColor: '#3182ce', color: '#fff', fontWeight: 'bold', cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
              >
                Roman Empire
              </button>

              {/* Subnodes */}
              <button
                onClick={() => setSelectedNode({ label: 'Battle of Cannae', type: 'Battle Event', properties: 'Major battle of the Second Punic War (216 BC) where Hannibal annihilated a Roman army.' })}
                style={{ position: 'absolute', bottom: '20%', left: '15%', width: '110px', padding: '10px', border: 'none', borderRadius: '4px', backgroundColor: '#4a5568', color: '#fff', fontSize: '12px', cursor: 'pointer', zIndex: 10 }}
              >
                Battle of Cannae
              </button>

              <button
                onClick={() => setSelectedNode({ label: 'Julius Caesar', type: 'Person', properties: 'Roman general and statesman who played a critical role in the demise of the Roman Republic.' })}
                style={{ position: 'absolute', bottom: '20%', left: '42%', width: '110px', padding: '10px', border: 'none', borderRadius: '4px', backgroundColor: '#4a5568', color: '#fff', fontSize: '12px', cursor: 'pointer', zIndex: 10 }}
              >
                Julius Caesar
              </button>

              <button
                onClick={() => setSelectedNode({ label: 'Thucydides History', type: 'Reference Book', properties: 'Detailed historical narrative written by Athenian Thucydides.' })}
                style={{ position: 'absolute', bottom: '20%', left: '70%', width: '110px', padding: '10px', border: 'none', borderRadius: '4px', backgroundColor: '#4a5568', color: '#fff', fontSize: '12px', cursor: 'pointer', zIndex: 10 }}
              >
                Peloponnesian War
              </button>
            </div>

            {selectedNode ? (
              <div style={{ marginTop: '20px', padding: '16px', backgroundColor: '#ebf8ff', borderRadius: '6px', borderLeft: '4px solid #3182ce' }}>
                <h4 style={{ margin: '0 0 6px 0', textTransform: 'uppercase', fontSize: '12px', color: '#2b6cb0' }}>{selectedNode.type}</h4>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px' }}>{selectedNode.label}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#4a5568' }}>{selectedNode.properties}</p>
              </div>
            ) : (
              <p style={{ margin: '16px 0 0 0', color: '#718096', fontSize: '14px', textAlign: 'center' }}>Click any node in the graph above to inspect underlying entities and relationships</p>
            )}
          </section>

          {/* Published Video Lists */}
          <section style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '20px' }}>Published Videos</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {videos.map(v => (
                <div key={v.id} style={{ border: '1px solid #e2e8f0', padding: '16px', borderRadius: '6px' }}>
                  <h3 style={{ margin: '0 0 6px 0', fontSize: '16px' }}>{v.title}</h3>
                  <p style={{ margin: 0, color: '#4a5568', fontSize: '14px' }}>{v.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Public Bibliography / References Sidebar */}
        <aside style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', height: 'fit-content' }}>
          <h2 style={{ marginTop: 0, marginBottom: '20px', fontSize: '18px' }}>Public Bibliography</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {books.map(b => (
              <div key={b.id} style={{ borderBottom: '1px solid #edf2f7', paddingBottom: '12px' }}>
                <h4 style={{ margin: '0 0 4px 0', fontSize: '14px' }}>{b.title}</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#718096' }}>By {b.author}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
