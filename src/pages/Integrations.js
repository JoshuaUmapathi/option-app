import React, { useState, useEffect } from 'react';
import { Calendar, Book, List, Loader, Monitor, PenTool, Layers, Globe, Video, Github, Plus, Check, Settings } from 'lucide-react';

export default function IntegrationsPage({ setPage }) {
  const [status, setStatus] = useState({ gcal: false, notion: false, schoology: false });
  const [loading, setLoading] = useState(null);
  const [activeModal, setActiveModal] = useState(null); // stores the integration object being configured
  const [creds, setCreds] = useState({ username: "", password: "" });

  useEffect(() => {
    try {
      const saved = localStorage.getItem('integrations');
      if (saved) setStatus(JSON.parse(saved));
    } catch {}
  }, []);

  const handleConnectClick = (int) => {
    if (int.id === 'schoology') {
      if (setPage) setPage('importer');
      return;
    }

    if (status[int.id]) {
      // Disconnect
      const updated = { ...status, [int.id]: false };
      setStatus(updated);
      localStorage.setItem('integrations', JSON.stringify(updated));
    } else {
      // Open Modal to connect
      setCreds({ username: "", password: "" });
      setActiveModal(int);
    }
  };

  const submitModal = () => {
    if (!activeModal) return;
    const id = activeModal.id;
    setActiveModal(null);
    setLoading(id);
    
    // Simulate connection delay
    setTimeout(() => {
      const updated = { ...status, [id]: true };
      setStatus(updated);
      localStorage.setItem('integrations', JSON.stringify(updated));
      setLoading(null);
    }, 1500);
  };

  const integrations = [
    { id: 'gcal', name: 'Google Calendar', description: 'Sync your assignments and events instantly.', icon: <Calendar size={22} color="#fff" />, color: "#4285F4" },
    { id: 'notion', name: 'Notion', description: 'Link your workspace to log automated study notes.', icon: <List size={22} color="#fff" />, color: "#000000" },
    { id: 'schoology', name: 'Schoology', description: 'Import active courses, deadlines, and gradebook items.', icon: <Book size={22} color="#fff" />, color: "#0A4E8B" },
    { id: 'canvas', name: 'Canvas LMS', description: 'Automatically import your syllabus and modules.', icon: <Monitor size={22} color="#fff" />, color: "#E72429" },
    { id: 'blackboard', name: 'Blackboard', description: 'Sync university assignments and announcements.', icon: <PenTool size={22} color="#fff" />, color: "#2E2E38" },
    { id: 'quizlet', name: 'Quizlet', description: 'Import custom flashcard sets into your planner.', icon: <Layers size={22} color="#fff" />, color: "#4255FF" },
    { id: 'duolingo', name: 'Duolingo', description: 'Track your language learning streaks globally.', icon: <Globe size={22} color="#fff" />, color: "#58CC02" },
    { id: 'khan', name: 'Khan Academy', description: 'Integrate your math course mastery targets.', icon: <Video size={22} color="#fff" />, color: "#14BF96" },
    { id: 'github', name: 'GitHub', description: 'Sync commits and project issues to your tasks.', icon: <Github size={22} color="#fff" />, color: "#24292E" }
  ];

  return (
    <div className="page fu">
      <div className="page-container" style={{maxWidth: 1400}}>
        <div className="ph" style={{padding: "24px 0 32px"}}>
          <div className="ph-title" style={{fontSize: 28, fontWeight: 800, color: "#fff", marginBottom: 6}}>Integrations</div>
          <div style={{fontSize: 14, color: "rgba(255,255,255,0.6)"}}>Connect your exterior accounts to empower your intelligent planner.</div>
        </div>

        <div className="g3">
          {integrations.map(int => (
            <div key={int.id} className="stat-card" style={{display: "flex", flexDirection: "column"}}>
              <div style={{display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16}}>
                <div style={{width: 44, height: 44, background: int.color, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center"}}>
                  {int.icon}
                </div>
                <div style={{display: "flex", alignItems: "center", gap: 12}}>
                  {status[int.id] && <div style={{width: 8, height: 8, background: "var(--green)", borderRadius: 10, boxShadow: "0 0 8px rgba(74,222,128,0.4)"}} />}
                  <button 
                    className={`btn ${status[int.id] ? "btn-out" : "btn-dark"}`} 
                    style={{padding: 8, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", width: 34, height: 34}}
                    onClick={() => handleConnectClick(int)}
                    disabled={loading === int.id}
                  >
                     {loading === int.id ? <Loader size={16} className="spin" /> : 
                      status[int.id] ? (int.id === 'schoology' ? <Settings size={16} /> : <Check size={16} />) : 
                      <Plus size={18} />}
                  </button>
                </div>
              </div>
              <div style={{fontSize: 16, fontWeight: 700, color: "#fff", marginBottom: 8}}>{int.name}</div>
              <div style={{fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.5, flex: 1}}>
                {int.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      {activeModal && (
        <div className="ov" onClick={(e) => e.target === e.currentTarget && setActiveModal(null)} style={{backdropFilter: "blur(8px)"}}>
          <div className="modal sd" style={{background: "rgba(26,26,42,0.95)", border: "1px solid var(--border)", padding: 24, borderRadius: 20, width: 400}}>
            <div className="mt" style={{fontSize: 20, marginBottom: 8}}>Connect {activeModal.name}</div>
            <div style={{fontSize: 13, color: "rgba(255,255,255,0.5)", marginBottom: 20}}>
              Enter your credentials to allow Option to sync data from {activeModal.name}.
            </div>
            <div className="fg">
              <label className="fl">Username / Email</label>
              <input 
                className="fi" 
                value={creds.username} 
                onChange={e => setCreds({...creds, username: e.target.value})} 
                placeholder={`Your ${activeModal.name} username`} 
              />
            </div>
            <div className="fg">
              <label className="fl">Password / API Token</label>
              <input 
                className="fi" 
                type="password"
                value={creds.password} 
                onChange={e => setCreds({...creds, password: e.target.value})} 
                placeholder="Secure credential" 
              />
            </div>
            <div className="btn-row" style={{marginTop: 24}}>
              <button className="btn btn-dark" style={{flex: 1, justifyContent: "center"}} onClick={submitModal} disabled={!creds.username || !creds.password}>
                Authorize App
              </button>
              <button className="btn btn-out" onClick={() => setActiveModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
