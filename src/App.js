import ICAL from 'ical.js';
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
  --r:6px; --ff-d:'Playfair Display',serif; --ff-m:'DM Mono',monospace; --ff-s:'Instrument Sans',sans-serif;
}
body{background:var(--bg);color:var(--ink);font-family:var(--ff-s);font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased;}
.shell{display:flex;height:100vh;overflow:hidden;}
.sb{width:240px;border-right:1px solid var(--border);display:flex;flex-direction:column;background:var(--surface);}
.sb-logo{padding:24px;border-bottom:1px solid var(--border);}
.sb-wordmark{font-family:var(--ff-d);font-weight:900;font-size:20px;letter-spacing:-0.5px;}
.sb-nav{padding:12px;flex:1;}
.sb-item{display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:6px;cursor:pointer;color:var(--ink2);transition:0.2s;margin-bottom:2px;}
.sb-item:hover{background:var(--surface2);color:var(--ink);}
.sb-item.on{background:var(--ink);color:var(--surface);}
.main{flex:1;overflow-y:auto;background:var(--bg);padding:40px;}
.page{max-width:900px;margin:0 auto;}
.ph-title{font-family:var(--ff-d);font-size:32px;font-weight:700;}
.card{background:var(--surface);border:1px solid var(--border);border-radius:12px;padding:24px;margin-bottom:24px;}
.fi{width:100%;padding:10px 12px;border-radius:6px;border:1px solid var(--border);font-family:inherit;font-size:14px;margin-bottom:12px;}
.btn{display:inline-flex;align-items:center;gap:8px;padding:10px 16px;border-radius:6px;font-weight:600;cursor:pointer;border:none;transition:0.2s;}
.btn-dark{background:var(--ink);color:var(--surface);}
.spin{animation:spin 1s linear infinite;}
@keyframes spin{from{transform:rotate(0deg);}to{transform:rotate(360deg);}}
`;

/* ── Initial Data ──────────────────────────────────────────── */
const EVENTS_INIT = [
  { id: 1, name: "Math Semester Exam", date: "2026-02-25", priority: "high" },
];

/* ── Main App Component ────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState("home");
  const [events, setEvents] = useState(EVENTS_INIT);
  const [importUrl, setImportUrl] = useState("");
  const [isImporting, setIsImporting] = useState(false);

  // Schoology Sync Logic (Now inside the component)
  const handleSchoologySync = async () => {
    if (!importUrl) return alert("Please paste your Schoology iCal link.");
    setIsImporting(true);

    try {
      const res = await fetch(`/api/schoology?url=${encodeURIComponent(importUrl)}`);
      if (!res.ok) throw new Error("Sync failed. Check your link.");
      const icalText = await res.text();

      const jcalData = ICAL.parse(icalText);
      const vcalendar = new ICAL.Component(jcalData);
      const vevents = vcalendar.getAllSubcomponents('vevent');

      const newEvents = vevents.map(vevent => {
        const event = new ICAL.Event(vevent);
        return {
          id: Math.random().toString(36).substr(2, 9),
          name: event.summary,
          date: event.startDate.toISODateString(),
          priority: event.summary.toLowerCase().includes("test") ? "high" : "med"
        };
      });

      setEvents(prev => [...prev, ...newEvents]);
      alert(`Imported ${newEvents.length} events!`);
      setPage("calendar");
    } catch (err) {
      alert("Error parsing calendar. Ensure /api/schoology.js is deployed and link is valid.");
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
          {page === "home" && <div className="page"><div className="ph-title">Welcome back, Alex</div><p>You have {events.length} items.</p></div>}
          {page === "grades" && <div className="page"><div className="ph-title">Grades</div><p>Current Standing: A-</p></div>}
          {page === "gpa" && <div className="page"><div className="ph-title">GPA Calculator</div><p>Unweighted: 3.85</p></div>}
          {page === "calendar" && <CalendarPage events={events} setEvents={setEvents} />}
          {page === "screentime" && <div className="page"><div className="ph-title">Screen Time</div><p>Today: 2h 15m</p></div>}
          
          {page === "importer" && (
            <div className="page">
              <div className="ph-title">Import Schoology</div>
              <div className="card">
                <input className="fi" value={importUrl} onChange={e => setImportUrl(e.target.value)} placeholder="Schoology iCal Link..." />
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

function CalendarPage({ events, setEvents }) {
  const deleteEvent = (id) => setEvents(events.filter(e => e.id !== id));
  return (
    <div className="page">
      <div className="ph-title">Calendar</div>
      {events.map(e => (
        <div key={e.id} className="card" style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
          <div><strong>{e.name}</strong><br/><small>{e.date}</small></div>
          <button className="btn" onClick={() => deleteEvent(e.id)}><Trash2 size={14} color="red"/></button>
        </div>
      ))}
    </div>
  );
}