import { useState, useEffect, useRef } from "react";
import {
  Home, BookOpen, Calculator, Calendar, Clock, ChevronLeft,
  ChevronRight, Plus, Upload, Link, Image, FileText,
  AlertTriangle, Lock, Loader, Sparkles, ArrowRight, Trash2
} from "lucide-react";

/* ── Fonts & CSS ───────────────────────────────────────────── */
const FONT = `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,600;0,700;0,900;1,400;1,700&family=DM+Mono:wght@300;400;500&family=Instrument+Sans:wght@300;400;500;600&display=swap');`;

const CSS = `
${FONT}
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg:#f5f4f1; --surface:#ffffff; --surface2:#eeecea;
  --border:#e2dfda; --border2:#ccc9c1; --ink:#0d0c0a;
  --ink2:#4e4c47; --ink3:#908d86; --ink4:#cac7c0;
  --red:#b83232; --orange:#c45e1a; --green:#1a6e40; --blue:#1b4a91;
}
body{background:var(--bg);color:var(--ink);font-family:'Instrument Sans',sans-serif;font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased;}
.shell{display:flex;height:100vh;overflow:hidden;}
.sb{width:240px;border-right:1px solid var(--border);display:flex;flex-direction:column;background:var(--surface);}
.sb-logo{padding:24px;border-bottom:1px solid var(--border);}
.sb-wordmark{font-family:'Playfair Display',serif;font-weight:900;font-size:20px;letter-spacing:-0.5px;}
.sb-tagline{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--ink3);margin-top:2px;}
.sb-nav{padding:12px;flex:1;}
.sb-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:6px;cursor:pointer;color:var(--ink2);transition:0.2s;margin-bottom:2px;}
.sb-item:hover{background:var(--surface2);color:var(--ink);}
.sb-item.on{background:var(--ink);color:var(--surface);}
.main{flex:1;overflow-y:auto;background:var(--bg);padding:40px;}
.page{max-width:900px;margin:0 auto;}
.ph{margin-bottom:32px;}
.ph-title{font-family:'Playfair Display',serif;font-size:32px;font-weight:700;}
.ph-sub{color:var(--ink3);margin-top:4px;}
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:24px;}
.fg{margin-bottom:16px;}
.fl{display:block;font-size:12px;font-weight:600;margin-bottom:6px;color:var(--ink2);}
.fi{width:100%;padding:10px 12px;border-radius:6px;border:1px solid var(--border);font-family:inherit;font-size:14px;}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:6px;font-weight:600;cursor:pointer;border:none;font-family:inherit;transition:0.2s;}
.btn-dark{background:var(--ink);color:var(--surface);}
.spin{animation:spin 1s linear infinite;}
@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
`;

/* ── Initial Data ──────────────────────────────────────────── */
const EVENTS_INIT = [
  { id: 1, name: "Project Alpha Due", date: "2026-02-25", priority: "high" },
];

/* ── Main App Component ────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState("home");
  const [events, setEvents] = useState(EVENTS_INIT);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Schoology Sync Logic
  const handleSchoologySync = async () => {
    if (!importUrl) return alert("Please paste your Schoology iCal link.");
    setIsImporting(true);

    try {
      const res = await fetch(`/api/schoology?url=${encodeURIComponent(importUrl)}`);
      if (!res.ok) throw new Error("Sync failed. Check your link.");
      const icalText = await res.text();

      const vevents = icalText.split("BEGIN:VEVENT");
      vevents.shift(); 

      const newEvents = vevents.map(block => {
        const summary = block.match(/SUMMARY:(.*)/)?.[1] || "Untitled Event";
        const dtstart = block.match(/DTSTART(?:;VALUE=DATE|;VALUE=DATE-TIME)?:(.*)/)?.[1];
        const dateStr = dtstart 
          ? `${dtstart.slice(0,4)}-${dtstart.slice(4,6)}-${dtstart.slice(6,8)}` 
          : new Date().toISOString().split('T')[0];

        return {
          id: Math.random().toString(36).substr(2, 9),
          name: summary.trim().replace(/\\r|\\n/g, ""),
          date: dateStr,
          priority: summary.toLowerCase().includes("holiday") ? "low" : "med"
        };
      });

      setEvents(prev => [...prev, ...newEvents]);
      alert(`Imported ${newEvents.length} events!`);
      setPage("calendar");
    } catch (err) {
      alert("Error: Ensure your iCal link is correct and /api/schoology.js is deployed.");
    } finally {
      setIsImporting(false);
    }
  };

  const nav = [
    {id:"home", icon:<Home size={14}/>, label:"Home"},
    {id:"grades", icon:<BookOpen size={14}/>, label:"Grades"},
    {id:"gpa", icon:<Calculator size={14}/>, label:"GPA"},
    {id:"calendar", icon:<Calendar size={14}/>, label:"Calendar"},
    {id:"importer", icon:<Sparkles size={14}/>, label:"Import"},
    {id:"screentime", icon:<Clock size={14}/>, label:"Screen Time"},
  ];

  return (
    <>
      <style>{CSS}</style>
      <div className="shell">
        <div className="sb">
          <div className="sb-logo">
            <div className="sb-wordmark">Option</div>
            <div className="sb-tagline">Student OS</div>
          </div>
          <div className="sb-nav">
            {nav.map(item => (
              <div key={item.id} className={`sb-item ${page === item.id ? "on" : ""}`} onClick={() => setPage(item.id)}>
                {item.icon}{item.label}
              </div>
            ))}
          </div>
        </div>

        <div className="main">
          {page === "home" && <HomePage events={events} />}
          {page === "grades" && <div className="page"><div className="ph-title">Grades</div><p>Grade tracking active.</p></div>}
          {page === "gpa" && <div className="page"><div className="ph-title">GPA Calculator</div><p>Calculate your standing.</p></div>}
          {page === "calendar" && <CalendarPage events={events} setEvents={setEvents} />}
          {page === "screentime" && <div className="page"><div className="ph-title">Screen Time</div><p>Usage stats.</p></div>}
          
          {page === "importer" && (
            <div className="page">
              <div className="ph">
                <div className="ph-title">Import Data</div>
                <div className="ph-sub">Sync with Schoology iCal</div>
              </div>
              <div className="card">
                <div className="fg">
                  <label className="fl">Schoology iCal Link</label>
                  <input 
                    className="fi" 
                    value={importUrl} 
                    onChange={e => setImportUrl(e.target.value)} 
                    placeholder="https://schoology.com/calendar/feed/..." 
                  />
                </div>
                <button className="btn btn-dark" onClick={handleSchoologySync} disabled={isImporting}>
                  {isImporting ? <Loader className="spin" size={14}/> : <Sparkles size={14}/>}
                  {isImporting ? "Syncing..." : "Sync Calendar"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Sub-Pages ─────────────────────────────────────────────── */
function HomePage({ events }) {
  return (
    <div className="page">
      <div className="ph">
        <div className="ph-title">Good Evening, Alex</div>
        <div className="ph-sub">You have {events.length} upcoming items.</div>
      </div>
      <div className="card">
        <h3>Overview</h3>
        <p>Keep pushing toward your goals.</p>
      </div>
    </div>
  );
}

function CalendarPage({ events, setEvents }) {
  const deleteEvent = (id) => setEvents(events.filter(e => e.id !== id));

  return (
    <div className="page">
      <div className="ph">
        <div className="ph-title">Calendar</div>
        <div className="ph-sub">Manage your academic schedule</div>
      </div>
      {events.length === 0 ? <p>No events scheduled.</p> : events.map(e => (
        <div key={e.id} className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px', marginBottom:'12px'}}>
          <div>
            <div style={{fontWeight:'600'}}>{e.name}</div>
            <div style={{fontSize:'12px', color:'var(--ink3)'}}>{e.date}</div>
          </div>
          <button className="btn" onClick={() => deleteEvent(e.id)} style={{color:'var(--red)'}}>
            <Trash2 size={14}/>
          </button>
        </div>
      ))}
    </div>
  );
}