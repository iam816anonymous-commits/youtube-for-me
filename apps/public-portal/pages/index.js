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
          { id: '1', title: 'Rise and Fall of Ancient Rome', description: 'Exploring socio-economic transitions and general civilizational decay.' }
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
    <div style={{ fontFamily: '"Inter", system-ui, -apple-system, sans-serif', padding: '0', backgroundColor: '#0f172a', minHeight: '100vh', color: '#f1f5f9' }}>

      {/* Premium Header */}
      <header style={{ borderBottom: '1px solid #1e293b', padding: '24px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#1e293b' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '800', letterSpacing: '-0.025em', color: '#38bdf8' }}>
            CIP Audience Portal
          </h1>
          <p style={{ margin: '6px 0 0 0', color: '#94a3b8', fontSize: '13px' }}>Explore research maps, bibliographies, and historical chronicles</p>
        </div>
        <form onSubmit={handleSearch} style={{ display: 'flex', gap: '8px' }}>
          <input
            type="text"
            placeholder="Search chronicles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ padding: '10px 16px', backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', width: '260px', color: '#f8fafc', fontSize: '14px' }}
          />
          <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#38bdf8', color: '#0f172a', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '14px' }}>
            Search
          </button>
        </form>
      </header>

      <div style={{ padding: '40px', maxWidth: '1400px', margin: '0 auto', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
        <div>

          {/* Interactive Knowledge Graph Section */}
          <section style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '32px', borderRadius: '12px', marginBottom: '40px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '18px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.01em' }}>Interactive Public Knowledge Graph</h2>
            <div style={{ border: '1px solid #334155', height: '360px', borderRadius: '8px', position: 'relative', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#0f172a', overflow: 'hidden' }}>

              {/* Graphic connections */}
              <div style={{ position: 'absolute', width: '100%', height: '100%' }}>
                <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
                  <line x1="25%" y1="50%" x2="50%" y2="25%" stroke="#334155" strokeWidth="2" />
                  <line x1="75%" y1="50%" x2="50%" y2="25%" stroke="#334155" strokeWidth="2" />
                  <line x1="50%" y1="75%" x2="50%" y2="25%" stroke="#334155" strokeWidth="2" />
                </svg>
              </div>

              {/* Central root node */}
              <button
                onClick={() => setSelectedNode({ label: 'Roman Empire', type: 'Civilization', properties: 'Spanned three continents, governed over 50 million citizens with high-density road arrays.' })}
                style={{ position: 'absolute', top: '22%', left: '41%', width: '130px', padding: '14px', border: 'none', borderRadius: '30px', backgroundColor: '#38bdf8', color: '#0f172a', fontWeight: '800', cursor: 'pointer', zIndex: 10, boxShadow: '0 4px 12px rgba(56, 189, 248, 0.2)', fontSize: '13px' }}
              >
                Roman Empire
              </button>

              {/* Subnodes */}
              <button
                onClick={() => setSelectedNode({ label: 'Battle of Cannae', type: 'Battle Event', properties: 'Major battle of the Second Punic War (216 BC) where Hannibal annihilated a Roman army.' })}
                style={{ position: 'absolute', bottom: '22%', left: '16%', width: '120px', padding: '12px', border: '1px solid #334155', borderRadius: '6px', backgroundColor: '#1e293b', color: '#f8fafc', fontSize: '11px', cursor: 'pointer', zIndex: 10 }}
              >
                Battle of Cannae
              </button>

              <button
                onClick={() => setSelectedNode({ label: 'Julius Caesar', type: 'Person', properties: 'Roman general and statesman who played a critical role in the demise of the Roman Republic.' })}
                style={{ position: 'absolute', bottom: '22%', left: '43%', width: '120px', padding: '12px', border: '1px solid #334155', borderRadius: '6px', backgroundColor: '#1e293b', color: '#f8fafc', fontSize: '11px', cursor: 'pointer', zIndex: 10 }}
              >
                Julius Caesar
              </button>

              <button
                onClick={() => setSelectedNode({ label: 'Peloponnesian War History', type: 'Reference Book', properties: 'Detailed historical narrative written by Athenian Thucydides.' })}
                style={{ position: 'absolute', bottom: '22%', left: '70%', width: '120px', padding: '12px', border: '1px solid #334155', borderRadius: '6px', backgroundColor: '#1e293b', color: '#f8fafc', fontSize: '11px', cursor: 'pointer', zIndex: 10 }}
              >
                Peloponnesian War
              </button>
            </div>

            {selectedNode ? (
              <div style={{ marginTop: '24px', padding: '20px', backgroundColor: '#1e293b', borderRadius: '8px', borderLeft: '4px solid #38bdf8', border: '1px solid #334155', borderLeftWidth: '4px' }}>
                <h4 style={{ margin: '0 0 6px 0', textTransform: 'uppercase', fontSize: '11px', fontWeight: 'bold', color: '#38bdf8', letterSpacing: '0.05em' }}>{selectedNode.type}</h4>
                <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#f8fafc', fontWeight: 'bold' }}>{selectedNode.label}</h3>
                <p style={{ margin: 0, fontSize: '14px', color: '#cbd5e1', lineHeight: '1.5' }}>{selectedNode.properties}</p>
              </div>
            ) : (
              <p style={{ margin: '20px 0 0 0', color: '#94a3b8', fontSize: '13px', textAlign: 'center' }}>Click any node in the graph above to inspect underlying entities and relationships</p>
            )}
          </section>

          {/* Published Video Lists */}
          <section style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '32px', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '18px', fontWeight: '800', color: '#f8fafc', letterSpacing: '-0.01em' }}>Published Chronicles</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {videos.map(v => (
                <div key={v.id} style={{ border: '1px solid #334155', backgroundColor: '#0f172a', padding: '20px', borderRadius: '8px' }}>
                  <h3 style={{ margin: '0 0 8px 0', fontSize: '16px', fontWeight: 'bold', color: '#f8fafc' }}>{v.title}</h3>
                  <p style={{ margin: 0, color: '#94a3b8', fontSize: '13px', lineHeight: '1.5' }}>{v.description}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Public Bibliography / References Sidebar */}
        <aside style={{ backgroundColor: '#1e293b', border: '1px solid #334155', padding: '28px', borderRadius: '12px', height: 'fit-content', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <h2 style={{ marginTop: 0, marginBottom: '24px', fontSize: '16px', fontWeight: '800', color: '#f8fafc', borderBottom: '1px solid #334155', paddingBottom: '12px', letterSpacing: '-0.01em' }}>Public Bibliography</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {books.map(b => (
              <div key={b.id} style={{ borderBottom: '1px solid #334155', paddingBottom: '16px' }}>
                <h4 style={{ margin: '0 0 6px 0', fontSize: '14px', fontWeight: 'bold', color: '#f8fafc' }}>{b.title}</h4>
                <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>By {b.author}</p>
              </div>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
