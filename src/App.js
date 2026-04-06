import { useState, useEffect, useRef } from "react";
import {
  Home,
  BookOpen,
  Calculator,
  Calendar,
  Clock,
  ChevronLeft,
  ChevronRight,
  Plus,
  Upload,
  Link,
  Image,
  FileText,
  AlertTriangle,
  Lock,
  Loader,
  Sparkles,
  ArrowRight,
  Play,
  Pause,
  Square,
  Info,
  Layers,
  List,
  TrendingDown,
  TrendingUp,
  Lightbulb
} from "lucide-react";

import IntegrationsPage from "./pages/Integrations";

/* ── UTILS ─────────────────────────────────────────────────── */
function parseICal(text) {
  const events = [];
  const items = text.split("BEGIN:VEVENT");
  for (let i = 1; i < items.length; i++) {
    const it = items[i];
    const sum = it.match(/SUMMARY:(.*)/)?.[1]?.trim() || "Untitled Event";
    let start = it.match(/DTSTART;VALUE=DATE:(.*)/)?.[1] || it.match(/DTSTART:(.*)/)?.[1] || "";
    if (start) {
      start = start.replace(/T\d+Z$/, "");
      const y = start.substring(0, 4), m = start.substring(4, 6), d = start.substring(6, 8);
      events.push({ name: sum, date: `${y}-${m}-${d}`, priority: "med", subject: "" });
    }
  }
  return events;
}

function processAIScan(text) {
  const results = [];
  const lines = text.split("\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const dateM = line.match(/(\d{1,2}\/\d{1,2})|(\d{4}-\d{2}-\d{2})/);
    const date = dateM ? (dateM[2] || `2026-${dateM[1].split('/')[0].padStart(2,'0')}-${dateM[1].split('/')[1].padStart(2,'0')}`) : "2026-04-02";
    let name = line.replace(/(\d{1,2}\/\d{1,2})|(\d{4}-\d{2}-\d{2})/, "").trim();
    name = name.replace(/^[-*•]\s+/, "");
    if (name) results.push({ name, date, priority: "med", subject: "" });
  }
  return results;
}


/* ── Fonts ─────────────────────────────────────────────────── */
const FONT = `@import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap');`;

/* ── CSS ───────────────────────────────────────────────────── */
const CSS = `
${FONT}
*{box-sizing:border-box;margin:0;padding:0;}
:root{
  --bg: #111116;
  --surface: #15151b;
  --surface2: #1c1c24;
  --surface3: #22222d;
  --border: rgba(255,255,255,0.03);
  --border2: rgba(255,255,255,0.08);
  --ink: #ffffff;
  --ink2: rgba(255,255,255,0.7);
  --ink3: rgba(255,255,255,0.5);
  --ink4: rgba(255,255,255,0.3);
  --red: #ef4444;
  --orange: #f97316;
  --green: #22c55e;
  --blue: #3b82f6;
  --purple: #8b5cf6;
  --r: 10px;
  --ff-d: 'Plus Jakarta Sans', sans-serif;
  --ff-m: 'JetBrains Mono', monospace;
  --ff-s: 'Inter', sans-serif;
}
body{font-family:var(--ff-s);background:var(--bg);color:var(--ink);-webkit-font-smoothing:antialiased;}
button,input,select,textarea{font-family:var(--ff-s);}

.shell{display:flex;height:100vh;overflow:hidden;}

/* ── Sidebar ─── */
.sb{width:240px;min-width:240px;background:var(--surface);border-right:1px solid var(--border);display:flex;flex-direction:column;}
.sb-logo{padding:24px 20px 20px;display:flex;align-items:center;gap:12px;}
.sb-logo-icon{width:24px;height:24px;background:#ffffff;border-radius:6px;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:800;color:var(--bg);flex-shrink:0;}
.sb-wordmark{font-family:var(--ff-d);font-size:18px;font-weight:800;color:var(--ink);letter-spacing:0.5px;}
.sb-nav{flex:1;padding:8px 12px;overflow-y:auto;}
.sb-item{
  display:flex;align-items:center;gap:12px;padding:10px 14px;
  border-radius:10px;cursor:pointer;font-size:14px;font-weight:500;
  color:#ffffff;transition:all 0.15s ease;margin-bottom:2px;
}
.sb-item:hover{background:rgba(255,255,255,0.03);color:var(--ink2);}
.sb-item.on{background:rgba(139,92,246,0.13);color:#c4b5fd;}
.sb-item.on svg{color:#c4b5fd;}
.sb-item svg{width:15px;height:15px;flex-shrink:0;color:var(--ink3);transition:color 0.15s;}
.sb-foot{padding:12px 10px;border-top:1px solid var(--border);}
.sb-user{font-size:11px;color:var(--green);font-family:var(--ff-m);padding:8px 12px;font-weight:600;}

/* ── Main ─── */
.main{flex:1;overflow-y:auto;background:var(--bg);display:flex;flex-direction:column;}
.page{padding:60px;width:100%;display:flex;flex-direction:column;align-items:center;}
.page-container{max-width:1400px;width:100%;margin:0 auto;}
.cal-page-wrap{flex:1;overflow:hidden;display:flex;flex-direction:column;}

/* ── Cards ─── */
.card{
  background:rgba(26,26,42,0.6);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border:1px solid var(--border);
  border-radius:14px;
  padding:20px 24px;
  transition:all 0.2s ease;
  box-shadow: 0 4px 20px rgba(0,0,0,0.15);
}
.card:hover{border-color:var(--border2); transform: translateY(-1px); box-shadow: 0 8px 30px rgba(0,0,0,0.25);}
.ch{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;}
.ct{font-family:var(--ff-d);font-size:16px;font-weight:700;color:var(--ink);}

/* ── Grid ─── */
.g2{display:grid;grid-template-columns:1fr 1fr;gap:24px;}
.g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:24px;}
.g4{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;}

/* ── Buttons ─── */
.btn{
  display:inline-flex;align-items:center;gap:7px;padding:9px 16px;
  border-radius:10px;border:none;cursor:pointer;font-size:13px;font-weight:600;
  transition:all 0.15s ease;font-family:var(--ff-s);white-space:nowrap;
}
.btn svg{width:13px;height:13px;flex-shrink:0;}
.btn-dark{background:var(--blue);color:#fff;}
.btn-dark:hover{opacity:0.9;transform:translateY(-1px);}
.btn-out{background:transparent;border:1px solid var(--border2);color:var(--ink);}
.btn-out:hover{border-color:var(--blue);color:var(--blue);}
.btn-ghost{background:transparent;color:var(--ink3);border:none;}
.btn-ghost:hover{background:var(--surface2);color:var(--ink);}
.btn-red{background:var(--red);color:#fff;}
.btn-red:hover{opacity:0.9;}
.btn-sm{padding:5px 11px;font-size:12px;border-radius:8px;}
.btn-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}
.spin{animation:spin 1s linear infinite;}
@keyframes spin{100%{transform:rotate(360deg);}}
.spin{animation:spin 1s linear infinite;}
@keyframes spin{100%{transform:rotate(360deg);}}

/* ── Priority colors ─── */
.p-high{color:var(--red);}
.p-med{color:var(--orange);}
.p-low{color:var(--green);}
.p-test{color:var(--blue);}
.bg-high{background:rgba(239,68,68,0.08);border-left:3px solid var(--red);}
.bg-med{background:rgba(249,115,22,0.08);border-left:3px solid var(--orange);}
.bg-low{background:rgba(74,222,128,0.08);border-left:3px solid var(--green);}
.bg-test{background:rgba(139,92,246,0.08);border-left:3px solid var(--blue);}

/* ── Tags ─── */
.tag{display:inline-block;padding:3px 8px;border-radius:5px;font-size:10px;font-weight:700;font-family:var(--ff-m);letter-spacing:0.5px;text-transform:uppercase;}
.t-high{background:rgba(239,68,68,0.15);color:#fca5a5;}
.t-med{background:rgba(249,115,22,0.15);color:#fdba74;}
.t-low{background:rgba(74,222,128,0.15);color:#86efac;}
.t-test{background:rgba(139,92,246,0.15);color:#c4b5fd;}
.t-ap{background:rgba(255,255,255,0.12);color:#fff;}
.t-hn{background:rgba(255,255,255,0.08);color:var(--ink2);}
.t-reg{background:var(--surface2);color:var(--ink3);}

/* ── Forms ─── */
.fl{display:block;font-size:13px;font-weight:600;color:var(--ink2);margin-bottom:7px;font-family:var(--ff-s);}
.fi{width:100%;background:rgba(0,0,0,0.25);border:1px solid var(--border);border-radius:9px;padding:11px 14px;font-size:13px;color:var(--ink);outline:none;transition:border 0.2s;}
.fi:focus{border-color:var(--blue);}
.fs{width:100%;background:rgba(0,0,0,0.25);border:1px solid var(--border);border-radius:9px;padding:11px 14px;font-size:13px;color:var(--ink);outline:none;appearance:none;cursor:pointer;}
.fg{margin-bottom:14px;}

/* ── Progress ─── */
.pb{height:5px;background:var(--surface2);border-radius:3px;overflow:hidden;}
.pf{height:100%;border-radius:3px;transition:width 0.5s ease;background:var(--blue);}

/* ── Toggle ─── */
.tog{position:relative;width:40px;height:22px;flex-shrink:0;}
.tog input{opacity:0;width:0;height:0;}
.tog-t{position:absolute;cursor:pointer;inset:0;background:rgba(255,255,255,0.1);border:1px solid var(--border);border-radius:22px;transition:.25s;}
.tog input:checked+.tog-t{background:var(--blue);border-color:var(--blue);}
.tog-t::before{content:'';position:absolute;width:16px;height:16px;left:2px;top:2px;background:#fff;border-radius:50%;transition:.25s;box-shadow:0 1px 3px rgba(0,0,0,0.3);}
.tog input:checked+.tog-t::before{transform:translateX(18px);}

/* ── Divider ─── */
.dv{height:1px;background:var(--border);margin:20px 0;}

/* ── Modal ─── */
.ov{position:fixed;inset:0;background:rgba(0,0,0,0.65);display:flex;align-items:center;justify-content:center;z-index:1000;backdrop-filter:blur(10px);}
.modal{background:var(--surface);border:1px solid var(--border2);border-radius:14px;padding:28px;width:500px;max-width:95vw;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,0.5);}
.mt{font-family:var(--ff-d);font-size:22px;font-weight:700;margin-bottom:20px;color:var(--ink);}

/* ── Asgn row ─── */
.ar{display:flex;align-items:center;gap:12px;padding:12px 16px;border-radius:10px;margin-bottom:6px;border:1px solid transparent;background:var(--surface);}
.an{font-size:14px;font-weight:600;flex:1;min-width:0;color:var(--ink);}
.am{font-family:var(--ff-m);font-size:11px;color:var(--ink3);margin-top:2px;}

/* ── Scrollbar ─── */
::-webkit-scrollbar{width:5px;}
::-webkit-scrollbar-track{background:transparent;}
::-webkit-scrollbar-thumb{background:var(--border2);border-radius:3px;}

/* ── Animations ─── */
@keyframes fu{from{opacity:0;transform:translateY(10px);}to{opacity:1;transform:translateY(0);}}
.fu{animation:fu 0.3s ease both;}
@keyframes sd{from{opacity:0;transform:translateY(-6px);}to{opacity:1;transform:translateY(0);}}
.sd{animation:sd 0.25s ease both;}
@keyframes spin{to{transform:rotate(360deg);}}
.spin{animation:spin 0.9s linear infinite;}

/* ── Calendar ─── */
.cal-page{display:flex;flex-direction:column;flex:1;padding:0;overflow:hidden;min-height:0;width:100%;}
.cal-wrap{display:flex;gap:0;flex:1;min-height:0;}
.cal-main{flex:1;min-width:0;display:flex;flex-direction:column;padding:16px 20px 12px;}
.cal-hd{display:grid;grid-template-columns:repeat(7,1fr);gap:1px;margin-bottom:1px;flex-shrink:0;}
.cal-dow{text-align:center;font-family:var(--ff-m);font-size:10px;letter-spacing:1.5px;text-transform:uppercase;color:rgba(255,255,255,0.8);padding:6px 0;}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);grid-auto-rows:1fr;gap:1px;flex:1;min-height:0;background:var(--border);}
.cal-cell{background:var(--bg);padding:8px;cursor:pointer;transition:background 0.15s;overflow:hidden;display:flex;flex-direction:column;}
.cal-cell:hover{background:var(--surface);}
.cal-cell.today{background:rgba(99,102,241,0.1);}
.cal-cell.selected{background:rgba(139,92,246,0.18);}
.cal-cell.other{opacity:0.25;}
.cal-num{font-size:13px;font-weight:600;margin-bottom:4px;color:var(--ink2);line-height:1;}
.cal-cell.today .cal-num{color:var(--blue);font-weight:800;}
.cal-cell.selected .cal-num{color:var(--blue);}
.cal-ev{font-size:10px;padding:2px 6px;border-radius:4px;margin-bottom:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;flex-shrink:0;line-height:1.6;}
.cal-ev.high{background:rgba(239,68,68,0.2);color:#fca5a5;}
.cal-ev.med{background:rgba(249,115,22,0.2);color:#fdba74;}
.cal-ev.low{background:rgba(74,222,128,0.2);color:#86efac;}
.cal-ev.test{background:rgba(139,92,246,0.2);color:#c4b5fd;}
.cal-more{font-size:10px;color:var(--ink3);font-family:var(--ff-m);padding:0 2px;line-height:1.4;flex-shrink:0;}
.cal-key{display:flex;flex-wrap:wrap;gap:14px;align-items:center;padding:10px 20px;background:var(--surface);border-bottom:1px solid var(--border);flex-shrink:0;}
.ck-item{display:flex;align-items:center;gap:6px;font-size:11px;font-family:var(--ff-s);color:var(--ink2);font-weight:500;}
.ck-swatch{width:10px;height:10px;border-radius:3px;flex-shrink:0;}

/* Day sidebar */
.day-sb{width:220px;min-width:220px;background:var(--surface);border-left:1px solid var(--border);display:flex;flex-direction:column;overflow:hidden;}
.day-sb-hd{padding:16px 18px 14px;border-bottom:1px solid var(--border);flex-shrink:0;}
.day-sb-date{font-family:var(--ff-d);font-size:17px;font-weight:700;color:var(--ink);}
.day-sb-sub{font-size:11px;color:rgba(255,255,255,0.75);margin-top:3px;font-family:var(--ff-m);}
.day-sb-body{flex:1;overflow-y:auto;padding:10px;}
.day-sb-empty{padding:32px 16px;text-align:center;color:var(--ink4);font-size:12px;}
.day-ev-row{display:flex;align-items:flex-start;gap:8px;padding:9px 11px;border-radius:8px;border:1px solid var(--border);margin-bottom:6px;cursor:pointer;transition:all 0.15s;background:rgba(0,0,0,0.1);}
.day-ev-row:hover{border-color:var(--border2);}
.day-ev-row.sel{background:rgba(139,92,246,0.1);border-color:var(--blue);}
.day-ev-check{width:17px;height:17px;border:1px solid var(--border2);border-radius:4px;flex-shrink:0;margin-top:1px;display:flex;align-items:center;justify-content:center;font-size:10px;background:rgba(0,0,0,0.2);}
.day-ev-check.on{background:var(--blue);border-color:var(--blue);color:#fff;}
.day-sb-ft{padding:10px;border-top:1px solid var(--border);flex-shrink:0;}

/* ── Grades ─── */
.class-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;}
.cc{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:20px 22px;cursor:pointer;transition:all 0.2s;position:relative;overflow:hidden;}
.cc::before{content:'';position:absolute;left:0;top:0;bottom:0;width:3px;}
.cc.A::before,.cc.Ap::before{background:var(--green);}
.cc.B::before{background:var(--blue);}
.cc.C::before{background:var(--orange);}
.cc.D::before,.cc.F::before{background:var(--red);}
.cc:hover{border-color:var(--border2);transform:translateY(-1px);}
.cc-code{font-family:var(--ff-m);font-size:10px;letter-spacing:1px;color:var(--ink3);margin-bottom:4px;text-transform:uppercase;}
.cc-name{font-size:14px;font-weight:600;margin-bottom:12px;line-height:1.3;color:var(--ink);}
.cc-letter{font-family:var(--ff-d);font-size:44px;font-weight:900;letter-spacing:-1px;line-height:1;}
.cc-pct{font-size:14px;color:var(--ink2);margin-top:3px;font-weight:600;}
.cc-gp{font-family:var(--ff-m);font-size:10px;color:var(--ink3);margin-top:2px;}

/* Grade detail */
.gd-top{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:28px;margin-bottom:16px;display:flex;gap:24px;align-items:center;}
.gd-letter{font-family:var(--ff-d);font-size:88px;font-weight:900;letter-spacing:-2px;line-height:1;flex-shrink:0;}
.gd-nm{font-family:var(--ff-d);font-size:28px;font-weight:700;margin-bottom:4px;}
.gd-row{display:flex;align-items:center;gap:14px;padding:12px 16px;background:rgba(0,0,0,0.18);border:1px solid var(--border);border-radius:10px;margin-bottom:4px;}
.gd-n{flex:1;font-size:14px;font-weight:500;color:var(--ink);}
.gd-d{font-family:var(--ff-m);font-size:11px;color:var(--ink3);}
.gd-s{font-family:var(--ff-m);font-size:12px;font-weight:600;}
.gd-pct{font-size:12px;color:var(--ink3);width:42px;text-align:right;font-weight:600;}
.sec-label{font-family:var(--ff-m);font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--ink3);padding:14px 0 6px;border-bottom:1px solid var(--border);margin-bottom:8px;}

/* ── GPA ─── */
.gpa-card{background:var(--surface);border:1px solid var(--border);border-radius:14px;padding:28px;}
.gpa-lbl{font-family:var(--ff-m);font-size:10px;letter-spacing:2px;text-transform:uppercase;color:var(--ink3);margin-bottom:10px;}
.gpa-num{font-family:var(--ff-d);font-size:64px;font-weight:900;letter-spacing:-2px;line-height:1;color:var(--ink);}
.gpa-sub{font-size:13px;color:var(--ink3);margin-top:6px;}
.drag-row{display:flex;align-items:center;gap:12px;padding:11px 14px;background:rgba(239,68,68,0.08);border-radius:10px;margin-bottom:5px;border-left:3px solid var(--red);}
.cls-row{display:flex;align-items:center;gap:10px;padding:12px 14px;background:var(--surface);border:1px solid var(--border);border-radius:10px;margin-bottom:5px;}
.what-result{background:var(--blue);color:#fff;border-radius:14px;padding:28px;margin-bottom:16px;text-align:center;}
.wr-lbl{font-family:var(--ff-m);font-size:10px;letter-spacing:3px;text-transform:uppercase;color:rgba(255,255,255,0.6);margin-bottom:6px;}
.wr-num{font-family:var(--ff-d);font-size:80px;font-weight:900;letter-spacing:-3px;line-height:1;color:#fff;}
.wr-sub{font-size:13px;color:rgba(255,255,255,0.85);margin-top:8px;font-weight:500;}

/* ── Screen Time ─── */
.opal{background:var(--surface);border:1px solid var(--border);border-radius:16px;padding:36px;margin-bottom:20px;display:flex;flex-direction:column;align-items:center;text-align:center;}
.opal-title{font-family:var(--ff-d);font-size:44px;font-weight:900;letter-spacing:-1px;color:var(--ink);margin-bottom:6px;}
.opal-time{font-family:var(--ff-m);font-size:14px;color:var(--ink2);margin-bottom:22px;}
.app-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-top:14px;}
.app-tile{background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:11px;padding:14px;text-align:center;cursor:pointer;transition:all 0.15s;user-select:none;}
.app-tile.on{background:var(--blue);border-color:var(--blue);}
.app-tile:hover:not(.on){border-color:var(--border2);}
.app-icon{font-size:26px;margin-bottom:5px;display:flex;align-items:center;justify-content:center;}
.app-nm{font-size:11px;font-family:var(--ff-m);color:var(--ink3);font-weight:500;}
.app-tile.on .app-nm{color:rgba(255,255,255,0.8);}
.dur-btn{padding:11px;background:rgba(0,0,0,0.2);border:1px solid var(--border);border-radius:9px;text-align:center;cursor:pointer;font-size:13px;font-weight:600;transition:all 0.15s;}
.dur-btn.on{background:var(--blue);border-color:var(--blue);color:#fff;}
.pomo-opt{padding:14px;background:rgba(255,255,255,0.03);border:1px solid var(--border);border-radius:11px;cursor:pointer;transition:all 0.15s;margin-bottom:8px;}
.pomo-opt.on{background:rgba(139,92,246,0.1);border-color:var(--blue);}
.pomo-opt-t{font-size:14px;font-weight:600;color:var(--ink);}
.pomo-opt-s{font-size:12px;color:rgba(255,255,255,0.6);margin-top:3px;}

/* ── Importer ─── */
.dz{border:2px dashed var(--border2);border-radius:14px;padding:44px 32px;text-align:center;cursor:pointer;transition:all 0.2s;background:rgba(0,0,0,0.1);}
.dz:hover{border-color:var(--blue);background:rgba(139,92,246,0.05);}
.imp-tab{display:flex;background:rgba(0,0,0,0.25);border:1px solid var(--border);border-radius:11px;padding:3px;margin-bottom:20px;gap:3px;}
.imp-t{flex:1;padding:9px;border-radius:8px;text-align:center;font-size:12px;font-weight:600;cursor:pointer;color:var(--ink3);transition:all 0.15s;display:flex;align-items:center;justify-content:center;gap:5px;}
.imp-t svg{width:13px;height:13px;}
.imp-t.on{background:var(--surface);color:var(--ink);}
.ev-extracted{padding:12px 14px;background:rgba(0,0,0,0.18);border:1px solid var(--border);border-radius:10px;margin-bottom:7px;display:flex;align-items:center;gap:10px;}
.ee-check{width:19px;height:19px;border:1px solid var(--border2);border-radius:5px;flex-shrink:0;cursor:pointer;display:flex;align-items:center;justify-content:center;font-size:11px;background:rgba(0,0,0,0.2);}
.ee-check.checked{background:var(--blue);border-color:var(--blue);color:#fff;}
.ai-thinking{display:flex;align-items:center;gap:12px;padding:16px 20px;background:rgba(139,92,246,0.08);border:1px solid rgba(139,92,246,0.2);border-radius:10px;margin-top:12px;}
.ai-t{font-size:14px;font-weight:600;color:var(--blue);}
.ai-sub{font-size:12px;color:var(--ink3);margin-top:2px;font-family:var(--ff-m);}

/* ── Page header ─── */
.ph{margin-bottom:24px;}
.ph-row{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;}
.ph-title{font-family:var(--ff-d);font-size:28px;font-weight:700;letter-spacing:-0.5px;line-height:1.1;color:var(--ink);}

/* ── Pulsating danger border ─── */
@keyframes pulse-danger {
  0%   { box-shadow: 0 0 0 0 rgba(239,68,68,0.5); }
  70%  { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
  100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
}
.danger-pulse {
  border:1px solid #EF4444 !important;
  animation: pulse-danger 2s infinite;
}

/* ── GPA Glassmorphism cards ─── */
.gpa-card {
  background: rgba(26,26,42,0.7) !important;
  backdrop-filter: blur(16px) !important;
  -webkit-backdrop-filter: blur(16px) !important;
  border: 1px solid rgba(255,255,255,0.12) !important;
  box-shadow: 0 8px 32px rgba(0,0,0,0.3) !important;
}

/* ── Grade card glow bars ─── */
.cc .grade-bar-track { height:6px; background:rgba(255,255,255,0.08); border-radius:4px; margin-top:12px; overflow:visible; }
.cc .grade-bar-fill  { height:100%; border-radius:4px; transition: width 0.6s cubic-bezier(0.4,0,0.2,1); }
.cc.A  .grade-bar-fill, .cc.Ap .grade-bar-fill { background:linear-gradient(90deg,#4ade80,#22c55e); box-shadow:0 0 8px rgba(74,222,128,0.6); }
.cc.B  .grade-bar-fill { background:linear-gradient(90deg,#8b5cf6,#7c3aed); box-shadow:0 0 8px rgba(139,92,246,0.6); }
.cc.C  .grade-bar-fill { background:linear-gradient(90deg,#f97316,#ea580c); box-shadow:0 0 8px rgba(249,115,22,0.6); }
.cc.D  .grade-bar-fill, .cc.F .grade-bar-fill { background:linear-gradient(90deg,#ef4444,#dc2626); box-shadow:0 0 8px rgba(239,68,68,0.6); }

/* ── Sidebar hover left indicator ─── */
.sb-item { position: relative; }
.sb-item::before {
  content:''; position:absolute; left:-10px; top:50%; transform:translateY(-50%);
  width:2px; height:0; background:var(--blue); border-radius:1px;
  transition: height 0.2s ease;
}
.sb-item:hover::before { height:60%; }
.sb-item.on::before   { height:70%; }

/* ── Pill tag (top-right on grade cards) ─── */
.cc-pill {
  position: absolute; top:12px; right:12px;
  background: rgba(255,255,255,0.08);
  border: 1px solid rgba(255,255,255,0.14);
  border-radius: 20px; padding: 3px 9px;
  font-size: 10px; font-weight: 700;
  font-family: var(--ff-m); letter-spacing:0.5px;
  backdrop-filter: blur(4px);
  color: var(--ink2);
}
.cc { position: relative; }

/* ── Stat cards (flat dark) ─── */
.stat-card {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 12px;
  padding: 24px 28px;
  transition: transform 0.2s ease, background 0.2s ease;
}
.stat-card:hover {
  transform: translateY(-2px);
}
.stat-card .sc-label {
  font-family: var(--ff-m); font-size: 10px; letter-spacing: 1.5px;
  text-transform: uppercase; color: var(--ink3); margin-bottom: 16px;
}
.stat-card .sc-value {
  font-family: var(--ff-d); font-size: 32px; font-weight: 800;
  letter-spacing: -0.5px; color: #fff; line-height: 1;
}
.stat-card .sc-accent {
  width: 20px; height: 2px; border-radius: 1px; margin-top: 14px;
  background: var(--ink3);
}

/* ── Focus score badge (pill) ─── */
.focus-badge {
  background: var(--surface2);
  border: 1px solid var(--border);
  border-radius: 12px; padding: 6px 18px 6px 6px; 
  display: flex; align-items: center; gap: 12px; cursor: pointer;
  transition: transform 0.2s;
}
.focus-badge:hover { transform: translateY(-1px); border-color: var(--border2); }
.focus-badge .fb-left {
  width: 32px; height: 32px; background: rgba(255,255,255,0.05); border-radius: 50%;
  display: flex; align-items: center; justify-content: center;
  font-family: var(--ff-d); font-weight: 700; font-size: 14px; color: #fff;
}
.focus-badge .fb-right {
  display: flex; flex-direction: column; align-items: flex-start; justify-content: center; gap: 2px;
}
.focus-badge .fb-label {
  font-family: var(--ff-m); font-size: 8px; letter-spacing: 1px;
  text-transform: uppercase; color: var(--ink3); line-height: 1;
}
.focus-badge .fb-status {
  font-family: var(--ff-s); font-size: 11px; font-weight: 600; color: var(--green); line-height: 1;
}

/* ── Insight card (flat) ─── */
.insight-card {
  background: var(--surface2); border: 1px solid var(--border);
  border-radius: 12px; overflow: hidden;
}
.insight-row {
  display: flex; align-items: center; gap: 14px;
  padding: 18px 24px; cursor: pointer; transition: background 0.15s;
  border-bottom: 1px solid var(--border);
}
.insight-row:last-child { border-bottom: none; }
.insight-row:hover { background: rgba(255,255,255,0.02); }
.insight-icon {
  width: 38px; height: 38px; border-radius: 50%;
  background: var(--surface3); display: flex;
  align-items: center; justify-content: center;
  font-size: 16px; flex-shrink: 0; color: #fff;
}
.insight-title { font-size: 14px; font-weight: 700; color: #fff; margin-bottom: 4px; }
.insight-sub   { font-size: 12px; color: var(--ink3); }
.insight-arrow { color: var(--ink3); font-size: 18px; flex-shrink: 0; margin-left: auto; }

/* ── Section heading ─── */
.sec-head {
  font-size: 16px; font-weight: 700; color: #fff;
  margin-bottom: 16px; letter-spacing: -0.3px;
  display: flex; align-items: center; gap: 10px;
}
.sec-head-right {
  margin-left: auto; font-size: 12px; color: var(--ink3);
  font-weight: 500; cursor: pointer; letter-spacing: 0.3px;
}
.sec-head-right:hover { color: #fff; }

/* ── Up Next list ─── */
.un-row {
  padding: 16px 24px; display: flex; align-items: center; gap: 12px;
  border-bottom: 1px solid var(--border);
}
.un-row:last-child { border-bottom: none; }
.un-dot { width: 8px; height: 8px; border-radius: 2px; flex-shrink: 0; }
.un-name { flex: 1; font-size: 14px; font-weight: 600; color: #fff; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.un-date { font-family: var(--ff-m); font-size: 11px; color: var(--ink3); flex-shrink: 0; }

/* ── Attention card ─── */
.att-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 12px; padding: 16px; margin-bottom: 12px;
}
.att-item {
  display: flex; align-items: center; gap: 10px;
  padding: 11px 13px; border-radius: 10px;
  background: rgba(239,68,68,0.07); margin-bottom: 8px;
  border: 1px solid rgba(239,68,68,0.25);
  animation: pulse-danger 2.4s ease infinite;
  box-shadow: 0 0 0 0 rgba(239,68,68,0.3);
}
.att-item:last-child { margin-bottom: 0; }
@keyframes att-glow {
  0%,100% { box-shadow: 0 0 0 0 rgba(239,68,68,0.2), 0 0 8px rgba(239,68,68,0.1); }
  50% { box-shadow: 0 0 0 4px rgba(239,68,68,0.05), 0 0 16px rgba(239,68,68,0.2); }
}
.att-item { animation: att-glow 2.4s ease infinite; }
.att-ok {
  padding: 16px; text-align: center;
}

/* ── Overview mini bar ─── */
.ov-bar {
  display: flex; gap: 2px; height: 6px; border-radius: 4px;
  overflow: hidden; margin-bottom: 8px;
}
`;

/* ── Data ─────────────────────────────────────────────────── */
const CLASSES = [
  { id:1, code:"MTH-701", name:"AP Calculus BC", type:"AP", pct:94.2, letter:"A", wGP:5.0, uGP:4.0,
    assignments:[
      {name:"Problem Set 6",type:"Formative",score:46,total:50,date:"Feb 19"},
      {name:"Problem Set 5",type:"Formative",score:48,total:50,date:"Feb 12"},
      {name:"Chapter 5 Test",type:"Summative",score:91,total:100,date:"Feb 7"},
      {name:"Midterm",type:"Final",score:188,total:200,date:"Jan 28"},
    ]},
  { id:2, code:"BIO-701", name:"AP Biology", type:"AP", pct:88.4, letter:"B+", wGP:4.5, uGP:3.5,
    assignments:[
      {name:"Lab Report 3",type:"Summative",score:88,total:100,date:"Feb 18"},
      {name:"Reading Quiz 7",type:"Formative",score:18,total:20,date:"Feb 14"},
      {name:"Chapter 9 Test",type:"Summative",score:85,total:100,date:"Feb 6"},
    ]},
  { id:3, code:"ENG-701", name:"AP English Literature", type:"AP", pct:91.1, letter:"A-", wGP:4.7, uGP:3.7,
    assignments:[
      {name:"Essay 3 — Hamlet",type:"Summative",score:92,total:100,date:"Feb 17"},
      {name:"Reading Journal",type:"Formative",score:28,total:30,date:"Feb 11"},
      {name:"Midterm Essay",type:"Final",score:178,total:200,date:"Jan 29"},
    ]},
  { id:4, code:"HIS-701", name:"AP US History", type:"AP", pct:85.0, letter:"B", wGP:4.0, uGP:3.0,
    assignments:[
      {name:"DBQ Practice",type:"Summative",score:83,total:100,date:"Feb 20"},
      {name:"Chapter 14 Quiz",type:"Formative",score:17,total:20,date:"Feb 13"},
      {name:"Unit 4 Test",type:"Summative",score:86,total:100,date:"Feb 5"},
    ]},
  { id:5, code:"CHE-701", name:"AP Chemistry", type:"AP", pct:79.3, letter:"C+", wGP:3.3, uGP:2.3,
    assignments:[
      {name:"Lab Report 5",type:"Summative",score:78,total:100,date:"Feb 18"},
      {name:"Quiz 8",type:"Formative",score:15,total:20,date:"Feb 15"},
      {name:"Chapter 12 Test",type:"Summative",score:80,total:100,date:"Feb 4"},
    ]},
  { id:6, code:"HNR-601", name:"Honors English 11", type:"HN", pct:93.5, letter:"A", wGP:4.5, uGP:4.0,
    assignments:[
      {name:"Socratic Seminar",type:"Summative",score:95,total:100,date:"Feb 16"},
      {name:"Vocab Quiz 9",type:"Formative",score:28,total:30,date:"Feb 10"},
    ]},
];

const EVENTS_INIT = [
  {id:1,name:"Calc Problem Set 7",date:"2026-02-24",priority:"med",blockScreen:false},
  {id:2,name:"Biology Lab Report",date:"2026-02-25",priority:"high",blockScreen:true},
  {id:3,name:"Study Session",date:"2026-02-26",priority:"low",blockScreen:true},
  {id:4,name:"AP Chem Test",date:"2026-03-01",priority:"test",blockScreen:false},
  {id:5,name:"English Essay Due",date:"2026-02-27",priority:"med",blockScreen:false},
  {id:6,name:"APUSH DBQ",date:"2026-03-03",priority:"high",blockScreen:false},
  {id:7,name:"Chem Study Block",date:"2026-03-01",priority:"low",blockScreen:true},
  {id:8,name:"AP Bio Test",date:"2026-03-10",priority:"test",blockScreen:false},
  {id:9,name:"Essay Outline",date:"2026-02-24",priority:"low",blockScreen:false},
  {id:10,name:"Physics Quiz",date:"2026-02-24",priority:"test",blockScreen:false},
];

const APPS = [
  {name:"Instagram",icon:<img src="https://cdn.simpleicons.org/instagram/white" width="22" height="22" alt="Instagram" style={{opacity:0.9, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.3))"}}/>},
  {name:"TikTok",icon:<img src="https://cdn.simpleicons.org/tiktok/white" width="22" height="22" alt="TikTok" style={{opacity:0.9, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.3))"}}/>},
  {name:"YouTube",icon:<img src="https://cdn.simpleicons.org/youtube/white" width="22" height="22" alt="YouTube" style={{opacity:0.9, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.3))"}}/>},
  {name:"X",icon:<img src="https://cdn.simpleicons.org/x/white" width="22" height="22" alt="X" style={{opacity:0.9, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.3))"}}/>},
  {name:"Snapchat",icon:<img src="https://cdn.simpleicons.org/snapchat/white" width="22" height="22" alt="Snapchat" style={{opacity:0.9, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.3))"}}/>},
  {name:"Discord",icon:<img src="https://cdn.simpleicons.org/discord/white" width="22" height="22" alt="Discord" style={{opacity:0.9, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.3))"}}/>},
  {name:"Reddit",icon:<img src="https://cdn.simpleicons.org/reddit/white" width="22" height="22" alt="Reddit" style={{opacity:0.9, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.3))"}}/>},
  {name:"Netflix",icon:<img src="https://cdn.simpleicons.org/netflix/white" width="22" height="22" alt="Netflix" style={{opacity:0.9, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.3))"}}/>},
  {name:"Twitch",icon:<img src="https://cdn.simpleicons.org/twitch/white" width="22" height="22" alt="Twitch" style={{opacity:0.9, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.3))"}}/>},
  {name:"BeReal",icon:<img src="https://cdn.simpleicons.org/bereal/white" width="22" height="22" alt="BeReal" style={{opacity:0.9, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.3))"}}/>},
  {name:"Pinterest",icon:<img src="https://cdn.simpleicons.org/pinterest/white" width="22" height="22" alt="Pinterest" style={{opacity:0.9, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.3))"}}/>},
  {name:"Spotify",icon:<img src="https://cdn.simpleicons.org/spotify/white" width="22" height="22" alt="Spotify" style={{opacity:0.9, filter:"drop-shadow(0 2px 4px rgba(0,0,0,0.3))"}}/>},
];

/* ── Helpers ─────────────────────────────────────────────── */
const lColor = l => l.startsWith("A")?"var(--green)":l.startsWith("B")?"var(--blue)":l.startsWith("C")?"var(--orange)":"var(--red)";
const lClass = l => l.startsWith("A")?"A":l.startsWith("B")?"B":l.startsWith("C")?"C":"D";
const pColor = p => p>=90?"var(--green)":p>=80?"var(--blue)":p>=70?"var(--orange)":"var(--red)";
const fmtT = s => {
  const h=Math.floor(s/3600),m=Math.floor((s%3600)/60),sec=s%60;
  return h>0?`${h}:${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`:`${String(m).padStart(2,"0")}:${String(sec).padStart(2,"0")}`;
};
const calcW = cls => {
  const bonus={AP:1,HN:0.5,REG:0};
  const pts = cls.reduce((s,c)=>{
    const b=c.pct>=93?4:c.pct>=90?3.7:c.pct>=87?3.3:c.pct>=83?3:c.pct>=80?2.7:c.pct>=77?2.3:c.pct>=73?2:c.pct>=70?1.7:1;
    return s+b+(bonus[c.type]||0);
  },0);
  return (pts/cls.length).toFixed(2);
};
const calcU = cls => {
  const pts = cls.reduce((s,c)=>{
    return s+(c.pct>=93?4:c.pct>=90?3.7:c.pct>=87?3.3:c.pct>=83?3:c.pct>=80?2.7:c.pct>=77?2.3:c.pct>=73?2:c.pct>=70?1.7:1);
  },0);
  return (pts/cls.length).toFixed(2);
};

/* ── HOME ────────────────────────────────────────────────── */
function HomePage({ events, classes, syncStatus }) {
  const today = new Date();
  const hour  = today.getHours();
  const greeting = hour < 12 ? "Good morning," : hour < 18 ? "Good afternoon," : "Good evening,";
  const name  = "Joshua";

  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
  const upcoming = [...events].filter(e => e.date >= todayStr)
    .sort((a,b) => new Date(a.date)-new Date(b.date)).slice(0,6);

  let displayEvents = upcoming;
  let isGCConnected = false;
  let isNotionConnected = false;
  try {
    const ints = JSON.parse(localStorage.getItem('integrations'));
    isGCConnected = ints?.gcal === true;
    isNotionConnected = ints?.notion === true;
  } catch {}

  if (upcoming.length === 0 && isGCConnected) {
    displayEvents = [
      { id: "mock1", name: "AP Chem Study Session", date: "4:00 PM", priority: "high" },
      { id: "mock2", name: "Calc BC Group Project", date: "Tomorrow", priority: "med" },
      { id: "mock3", name: "Piano Lesson", date: "Wed, 5:30 PM", priority: "med" }
    ];
  }

  const wgpa      = classes && classes.length > 0 ? calcW(classes) : null;
  const ugpa      = classes && classes.length > 0 ? calcU(classes) : null;
  const attention = classes ? classes.filter(c => c.pct < 80)           : [];
  const aGrades   = classes ? classes.filter(c => c.pct >= 90).length   : 0;
  const bGrades   = classes ? classes.filter(c => c.pct >= 80 && c.pct < 90).length : 0;
  const belowB    = classes ? classes.filter(c => c.pct < 80).length    : 0;

  const pDot = p => p==="test"?"var(--blue)":p==="high"?"var(--red)":p==="med"?"var(--orange)":"var(--green)";

  return (
    <div className="page fu" style={{maxWidth:1400, width:"100%", margin:"auto", padding:60}}>

      {/* ── Header row ── */}
      <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:40}}>
        <div>
          <div style={{fontSize:11,color:"var(--ink3)",marginBottom:5,fontWeight:600,letterSpacing:"0.5px",textTransform:"uppercase"}}>{greeting}</div>
          <div style={{fontSize:40,fontWeight:900,letterSpacing:"-1.5px",fontFamily:"var(--ff-d)",lineHeight:1,color:"#fff"}}>{name}</div>
        </div>
        <div className="focus-badge">
          <div className="fb-left">33</div>
          <div className="fb-right">
            <div className="fb-label">Focus Score</div>
            <div className="fb-status">Needs Work</div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div className="g3" style={{marginBottom:40}}>
        {[
          {label:"WEIGHTED GPA",  value: wgpa},
          {label:"UNWEIGHTED",    value: ugpa},
          {label:"PERIOD",        value: "Q3"},
        ].map(s => (
          <div key={s.label} className="stat-card" style={{padding: "24px", height: "100%", display: "flex", flexDirection: "column"}}>
            <div className="sc-label" style={{marginBottom: 16}}>{s.label}</div>
            <div className="sc-value" style={{marginTop: "auto"}}>
              {s.value || (
                <div style={{display: "flex", flexDirection: "column", gap: 6, paddingTop: 4}}>
                  <div style={{width: 24, height: 2, background: "#fff"}} />
                  <div style={{width: 24, height: 2, background: "#fff"}} />
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* ── Two-column grid ── */}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:28,marginBottom:40,alignItems:"stretch"}}>

        {/* LEFT — Up Next & Notion */}
        <div style={{display:"flex",flexDirection:"column",gap:40}}>
          <div style={{display: "flex", flexDirection: "column", height: "100%"}}>
            <div className="sec-head">
              <Calendar size={18} strokeWidth={2.5} />
              Up Next
              <span className="sec-head-right">See Calendar</span>
            </div>
            <div className="insight-card" style={{flex: 1, display: "flex", flexDirection: "column"}}>
              {displayEvents.length === 0 ? (
                <div style={{flex: 1, display: "flex", alignItems: "center", justifyContent: "center", minHeight: 180}}>
                  <div style={{fontSize:13,fontWeight:600,color:"var(--ink3)"}}>All caught up!</div>
                </div>
              ) : displayEvents.map((e,i) => (
                <div key={e.id} className="un-row" style={{borderBottom:"1px solid var(--border)"}}>
                  <div className="un-dot" style={{background:pDot(e.priority)}}/>
                  <div className="un-name">{e.name}</div>
                  <div className="un-date">{e.date}</div>
                </div>
              ))}
            </div>
          </div>

          {isNotionConnected && (
            <div>
              <div className="sec-head">
                <Layers size={18} strokeWidth={2.5} />
                Notion Workspace
              </div>
              <div className="insight-card">
                {[
                  { title: "AP Chem Unit 5 Readings", tag: "High Yield" },
                  { title: "Calculus Limits Cheat Sheet", tag: "Reference" },
                  { title: "English Essay Outline", tag: "Draft" }
                ].map((note, i) => (
                  <div key={i} className="un-row" style={{borderBottom:"1px solid rgba(255,255,255,0.03)"}}>
                    <div style={{width: 32, height: 32, background: "rgba(255,255,255,0.05)", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0}}>
                       <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                    </div>
                    <div className="un-name" style={{fontSize: 13, fontWeight: 600, color: "#fff", marginLeft: 8}}>{note.title}</div>
                    <div className="tag t-reg" style={{background: "rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.8)", fontSize: 9, letterSpacing: 0.5}}>{note.tag}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* RIGHT — Attention + Grade Overview stacked */}
        <div style={{display:"flex",flexDirection:"column",gap:40}}>

          {/* Attention */}
          <div>
            <div className="sec-head">
              <TrendingDown size={18} strokeWidth={2.5} color="#EF4444" />
              Attention
            </div>
            <div className="insight-card">
              {attention.length === 0 ? (
                  <div style={{padding:"40px 20px",textAlign:"center"}}>
                    <TrendingUp size={20} strokeWidth={2.5} color="var(--green)" style={{margin:"0 auto 8px",display:"block"}} />
                    <div style={{fontSize:12,fontWeight:500,color:"var(--ink3)"}}>All your classes are in great shape.</div>
                  </div>
              ) : attention.map(c => (
                <div key={c.id} className="att-item" style={{margin:"12px", background:"rgba(239,68,68,0.06)", border:"1px solid rgba(239,68,68,0.15)", borderRadius:"8px"}}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#EF4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{flexShrink:0}}>
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
                  </svg>
                  <div style={{flex:1,fontSize:12,fontWeight:600,color:"#fff"}}>{c.name}</div>
                  <div style={{fontFamily:"var(--ff-m)",fontSize:11,fontWeight:700,color:"#EF4444",background:"rgba(239,68,68,0.12)",padding:"2px 7px",borderRadius:5}}>{c.pct}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Grade Overview */}
          <div>
            <div className="sec-head" style={{marginBottom: 12}}>
              Overview
            </div>
            <div style={{height: 48, borderRadius: 24, background: "var(--surface2)", border: "1px solid var(--border)", width: "100%"}}>
              {/* Empty Pill as defined in mockup */}
            </div>
          </div>
        </div>
      </div>

      {/* ── Smart Nudges ── */}
      <div style={{marginBottom:40, width: "100%"}}>
        <div className="sec-head">
          <Lightbulb size={18} strokeWidth={2.5} />
          Smart Nudges
        </div>
        <div style={{display: "flex", flexDirection: "column", gap: 12}}>
          <div className="insight-card">
            <div className="insight-row" style={{borderBottom: "none"}}>
              <div className="insight-icon">
                <Lightbulb size={16} strokeWidth={2.5} color="var(--ink2)" />
              </div>
              <div style={{flex:1}}>
                <div className="insight-title">Focus Time Running Low</div>
                <div className="insight-sub">You've only logged 0 min this week (0% of your 600 min goal). Start a focus session to get back on track!</div>
              </div>
              <div className="insight-arrow">›</div>
            </div>
          </div>
          <div className="insight-card">
            <div className="insight-row" style={{borderBottom: "none"}}>
              <div className="insight-icon">
                <Lightbulb size={16} strokeWidth={2.5} color="var(--ink2)" />
              </div>
              <div style={{flex:1}}>
                <div className="insight-title">Weekly Review Time</div>
                <div className="insight-sub">It's Sunday! Take a few minutes to review your progress this week and plan for the next one.</div>
              </div>
              <div className="insight-arrow">›</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Grade Trends ── */}
      <div style={{marginBottom:40, width: "100%"}}>
        <div className="sec-head">
          <TrendingUp size={18} strokeWidth={2.5} />
          Grade Trends
        </div>
        <div className="insight-card">
          <div className="insight-row" style={{borderBottom:"none", cursor:"default"}}>
            <div style={{flex:1}}>
              <div className="insight-title" style={{fontSize: 15, marginBottom: 4}}>Grade Trends</div>
              <div className="insight-sub" style={{color: "var(--ink3)"}}>
                {syncStatus === "done" ? "Grade history loaded from StudentVUE." : "No grade history yet. Sync your grades to start tracking trends."}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

/* ── CALENDAR ────────────────────────────────────────────── */
function CalendarPage({ events, setEvents }) {
  const _now = new Date();
  const [month, setMonth] = useState(_now.getMonth());
  const [year, setYear] = useState(_now.getFullYear());
  const [selDay, setSelDay] = useState(null); // {d, dateStr}
  const [selEvIds, setSelEvIds] = useState(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [newEv, setNewEv] = useState({name:"",date:"",priority:"med",blockScreen:false});
  const MN = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const SHORT_MN = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
  const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

  const first = new Date(year,month,1).getDay();
  const dim = new Date(year,month+1,0).getDate();
  const cells = [];
  for(let i=0;i<first;i++) cells.push({d:null,other:true});
  for(let i=1;i<=dim;i++) cells.push({d:i,other:false});
  while(cells.length%7!==0) cells.push({d:null,other:true});

  const dateStr = d => d ? `${year}-${String(month+1).padStart(2,"0")}-${String(d).padStart(2,"0")}` : "";
  const getEvts = d => events.filter(e=>e.date===dateStr(d));

  const selDayEvts = selDay ? getEvts(selDay.d) : [];
  const selDayObj = selDay ? new Date(year, month, selDay.d) : null;

  const toggleEvSel = id => {
    setSelEvIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const removeSelected = () => {
    setEvents(prev => prev.filter(e => !selEvIds.has(e.id)));
    setSelEvIds(new Set());
  };

  const addEvent = () => {
    const conflict = events.find(e=>e.date===newEv.date);
    if(conflict) {
      if(!window.confirm(`⚠️ "${conflict.name}" is already on this date. Add anyway?`)) return;
    }
    setEvents(prev=>[...prev,{...newEv,id:Date.now()}]);
    setShowAdd(false);
    setNewEv({name:"",date:"",priority:"med",blockScreen:false});
  };

  const pColor = p => p==="high"?"var(--red)":p==="med"?"var(--orange)":p==="low"?"var(--green)":"var(--blue)";

  return (
    <div className="cal-page fu">
      <div className="page-container">
        {/* Header */}
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"24px 0 16px",flexShrink:0}}>
          <div>
            <div className="ph-title">Calendar</div>
            <div style={{fontFamily:"var(--ff-m)",fontSize:10,letterSpacing:"1.5px",textTransform:"uppercase",color:"rgba(255,255,255,0.6)",marginTop:6}}>{MN[month]} {year} · {events.length} tasks</div>
          </div>
          <div className="btn-row">
            <button className="btn btn-out btn-sm"><Sparkles size={12}/>Auto-Schedule</button>
            <button className="btn btn-dark btn-sm" onClick={()=>setShowAdd(true)}><Plus size={12}/>Add Event</button>
          </div>
        </div>

        {/* Key */}
        <div className="cal-key" style={{background:"transparent", borderBottom:"1px solid var(--border)", padding:"12px 0"}}>
          <span style={{fontFamily:"var(--ff-m)",fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.5)"}}>KEY</span>
          {[["high","Do First","rgba(239,68,68,0.1)","#ef4444"],["med","Schedule","rgba(249,115,22,0.1)","#f97316"],["low","Delegate","rgba(74,222,128,0.1)","#4ade80"],["test","Eliminate","rgba(139,92,246,0.1)","#8b5cf6"]].map(([k,l,bg,c])=>(
            <div key={k} className="ck-item"><div className="ck-swatch" style={{background:bg,border:`1px solid ${c}`}}/>{l}</div>
          ))}
        </div>

        {/* Month nav */}
        <div style={{display:"flex",alignItems:"center",gap:12,padding:"16px 0",flexShrink:0}}>
          <button className="btn btn-ghost btn-sm" style={{padding:"6px 10px",border:"1px solid var(--border)", background:"rgba(255,255,255,0.03)"}} onClick={()=>{
                  setMonth(m => { const nm = m === 0 ? 11 : m - 1; if (m === 0) setYear(y => y - 1); return nm; });
                  setSelDay(null); setSelEvIds(new Set());
                }}><ChevronLeft size={14}/></button>
          <div style={{fontFamily:"var(--ff-d)",fontSize:18,fontWeight:800,letterSpacing:"-0.5px",minWidth:140,color:"var(--ink)",textAlign:"center"}}>{MN[month]} {year}</div>
          <button className="btn btn-ghost btn-sm" style={{padding:"6px 10px",border:"1px solid var(--border)", background:"rgba(255,255,255,0.03)"}} onClick={()=>{
                  setMonth(m => { const nm = m === 11 ? 0 : m + 1; if (m === 11) setYear(y => y + 1); return nm; });
                  setSelDay(null); setSelEvIds(new Set());
                }}><ChevronRight size={14}/></button>
        </div>

        {/* Calendar + sidebar */}
        <div className="cal-wrap" style={{border:"1px solid var(--border)", borderRadius:14, overflow:"hidden", background:"rgba(26,26,42,0.4)", backdropFilter:"blur(12px)", marginBottom:32}}>
          <div className="cal-main" style={{padding:0, display:"flex", flexDirection:"column"}}>
            <div className="cal-hd" style={{background:"rgba(255,255,255,0.02)", borderBottom:"1px solid var(--border)"}}>
              {["Su","Mo","Tu","We","Th","Fr","Sa"].map(d=><div key={d} className="cal-dow">{d}</div>)}
            </div>
            <div className="cal-grid" style={{background:"rgba(255,255,255,0.05)", flex:1}}>
              {cells.map((c,i)=>{
                const evts = getEvts(c.d);
                const _today = new Date();
                const isToday = c.d===_today.getDate() && month===_today.getMonth() && year===_today.getFullYear();
                const isSel = selDay?.d===c.d;
                const visible = evts.slice(0,3);
                const overflow = evts.length-3;
                return (
                  <div
                    key={i}
                    className={`cal-cell ${isToday?"today":""} ${c.other?"other":""} ${isSel&&!c.other?"selected":""}`}
                    style={{minHeight:100}}
                    onClick={()=>{
                      if(!c.d||c.other) return;
                      setSelDay(isSel?null:{d:c.d,dateStr:dateStr(c.d)});
                      setSelEvIds(new Set());
                    }}
                  >
                    {c.d && <div className="cal-num">{c.d}</div>}
                    {visible.map(e=>(
                      <div key={e.id} className={`cal-ev ${e.priority}`}>
                        {e.blockScreen&&<Lock size={6}/>}
                        <span style={{overflow:"hidden",textOverflow:"ellipsis"}}>{e.name}</span>
                      </div>
                    ))}
                    {overflow>0 && <div className="cal-more">+{overflow}</div>}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="day-sb" style={{background:"transparent", borderLeft:"1px solid var(--border)", width:240, minWidth:240}}>
            {!selDay ? (
              <div style={{padding:"48px 24px",textAlign:"center"}}>
                <svg width="60" height="60" viewBox="0 0 80 80" fill="none" style={{display:"block",margin:"0 auto 16px", opacity:0.6}}>
                  <circle cx="40" cy="40" r="30" stroke="rgba(255,255,255,0.1)" strokeWidth="1.5"/>
                  <path d="M40 25v15l8 8" stroke="rgba(255,255,255,0.2)" strokeWidth="2" strokeLinecap="round"/>
                </svg>
                <div style={{fontSize:18,fontWeight:800,fontFamily:"var(--ff-d)",color:"#fff",marginBottom:6}}>
                  {new Date().toLocaleDateString('en-US',{weekday:'short', month:'short', day:'numeric'})}
                </div>
                <div style={{fontSize:12,color:"rgba(255,255,255,0.5)", lineHeight:1.4}}>Select a date to view<br/>or add events.</div>
              </div>
            ) : (
              <>
                <div className="day-sb-hd" style={{background:"rgba(255,255,255,0.03)", padding:16, borderBottom:"1px solid var(--border)"}}>
                  <div className="day-sb-date" style={{fontSize:16, fontWeight:700, color:"#fff"}}>{selDayObj && DAYS[selDayObj.getDay()]}, {SHORT_MN[month]} {selDay.d}</div>
                  <div className="day-sb-sub" style={{color:"rgba(255,255,255,0.5)", fontSize:11, marginTop:4}}>{selDayEvts.length} event{selDayEvts.length!==1?"s":""}</div>
                </div>
                <div className="day-sb-body" style={{padding:12}}>
                  {selDayEvts.length===0 ? (
                    <div className="day-sb-empty" style={{padding:"40px 10px", textAlign:"center"}}>
                      <div style={{fontSize:24,marginBottom:10, opacity:0.4}}>✨</div>
                      <div style={{fontSize:12,color:"rgba(255,255,255,0.4)", fontWeight:500}}>Nothing planned yet</div>
                    </div>
                  ) : selDayEvts.map(e=>(
                    <div
                      key={e.id}
                      className={`day-ev-row ${selEvIds.has(e.id)?"sel":""}`}
                      style={{background:"rgba(255,255,255,0.03)", border:"1px solid var(--border)", marginBottom:8, padding:10, borderRadius:10, cursor:"pointer", display:"flex", alignItems:"center", gap:10}}
                      onClick={()=>toggleEvSel(e.id)}
                    >
                      <div className={`day-ev-check ${selEvIds.has(e.id)?"on":""}`} style={{width:18, height:18, border:"1px solid var(--border2)", borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center", fontSize:11}}>
                        {selEvIds.has(e.id)&&"✓"}
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:12,fontWeight:600,lineHeight:1.3,color:"#fff",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{e.name}</div>
                        <div style={{display:"flex",alignItems:"center",gap:5,marginTop:4}}>
                          <span style={{width:5,height:5,borderRadius:1,background:pColor(e.priority),flexShrink:0}}/>
                          <span style={{fontFamily:"var(--ff-m)",fontSize:9,color:"rgba(255,255,255,0.5)",textTransform:"uppercase",letterSpacing:0.5}}>{e.priority}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {selEvIds.size>0 && (
                  <div className="day-sb-ft" style={{padding:12, borderTop:"1px solid var(--border)"}}>
                    <button
                      className="btn btn-red"
                      style={{width:"100%",justifyContent:"center",fontSize:12, borderRadius:10, padding:"10px"}}
                      onClick={removeSelected}
                    >
                      Remove {selEvIds.size} event{selEvIds.size!==1?"s":""}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Add event modal */}
      {showAdd && (
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)}>
          <div className="modal sd">
            <div className="mt">Add Event</div>
            <div className="fg"><label className="fl">Name</label><input className="fi" value={newEv.name} onChange={e=>setNewEv({...newEv,name:e.target.value})} placeholder="e.g. Chemistry Test"/></div>
            <div className="g2">
              <div className="fg"><label className="fl">Date</label><input type="date" className="fi" value={newEv.date} onChange={e=>setNewEv({...newEv,date:e.target.value})}/></div>
              <div className="fg">
                <label className="fl">Priority</label>
                <select className="fs" value={newEv.priority} onChange={e=>setNewEv({...newEv,priority:e.target.value})}>
                  <option value="test">Test / Exam</option>
                  <option value="high">High Priority</option>
                  <option value="med">Medium Priority</option>
                  <option value="low">Low Priority</option>
                </select>
              </div>
            </div>
            <div className="btn-row" style={{marginTop:24}}>
              <button
                className="btn btn-dark"
                style={{flex:1, justifyContent:"center"}}
                onClick={()=>{
                  if(!newEv.name || !newEv.date) return;
                  setEvents([...events, { ...newEv, id: Date.now() }]);
                  setShowAdd(false);
                  setNewEv({ name:"", date: selDay?.iso || "", priority:"med" });
                }}
              >Add to Schedule</button>
              <button className="btn btn-out" onClick={()=>setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function GradesPage({ classes, syncStatus, syncError, lastSynced, onSync, onDismiss, syncPeriod }) {
  const [sel, setSel] = useState(null);
  const cls = classes.find(c => c.id === sel);

  // ── Detail view ──────────────────────────────────────────
  if (cls) {
    const categoryGroups = {};
    for (const a of cls.assignments) {
      const key = a.category || a.type || "Other";
      if (!categoryGroups[key]) categoryGroups[key] = [];
      categoryGroups[key].push(a);
    }
    const categories = Object.keys(categoryGroups).sort();

    const catAvg = (items) => {
      const scored = items.filter(a => a.score !== undefined && a.total > 0);
      if (!scored.length) return null;
      const pts   = scored.reduce((s,a) => s + a.score, 0);
      const total = scored.reduce((s,a) => s + a.total, 0);
      return (pts / total) * 100;
    };

    return (
      <div className="page fu">
        <div className="page-container">
          <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:20,cursor:"pointer",color:"rgba(255,255,255,0.6)",fontSize:12,fontFamily:"var(--ff-m)"}} onClick={()=>setSel(null)}>
            <ChevronLeft size={13}/>Back to Gradebook
          </div>

          <div className="card" style={{background:"rgba(26,26,42,0.4)", backdropFilter:"blur(12px)", padding:24, marginBottom:24}}>
            <div className="gd-top" style={{display:"flex", alignItems:"center", gap:20}}>
              <div className="gd-letter" style={{fontSize:52, fontWeight:900, fontFamily:"var(--ff-d)", color:lColor(cls.letter), lineHeight:1}}>{cls.letter}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:24, fontWeight:800, color:"#fff", fontFamily:"var(--ff-d)", marginBottom:4}}>{cls.name}</div>
                <div style={{fontSize:14, color:"rgba(255,255,255,0.7)", marginBottom:10}}>
                  {cls.pct}%{cls.teacher ? ` · ${cls.teacher}` : ""}{cls.room ? ` · Room ${cls.room}` : ""}
                </div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <span className={`tag t-${cls.type==="AP"?"ap":cls.type==="HN"?"hn":"reg"}`}>{cls.type}</span>
                  <span className="tag t-reg" style={{background:"rgba(255,255,255,0.05)", color:"#fff"}}>GPA: {cls.wGP}</span>
                  {cls.period && <span className="tag t-reg" style={{background:"rgba(255,255,255,0.05)", color:"#fff"}}>Period {cls.period}</span>}
                </div>
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontFamily:"var(--ff-d)",fontSize:48,fontWeight:900,color:lColor(cls.letter),lineHeight:1}}>{cls.pct}%</div>
                <div className="pb" style={{width:120, height:8, marginTop:10, background:"rgba(255,255,255,0.1)"}}>
                  <div className="pf" style={{width:`${cls.pct}%`, background:pColor(cls.pct)}}/>
                </div>
              </div>
            </div>
          </div>

          {cls.assignments.length === 0 && (
            <div style={{textAlign:"center",padding:"60px 32px",color:"rgba(255,255,255,0.4)",background:"rgba(26,26,42,0.4)", backdropFilter:"blur(12px)",border:"1px solid var(--border)",borderRadius:16}}>
              No assignments recorded yet.
            </div>
          )}

          {categories.map(cat => {
            const items = categoryGroups[cat];
            const avg = catAvg(items);
            return (
              <div key={cat} style={{marginBottom:32}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",paddingBottom:12,borderBottom:"1px solid var(--border)",marginBottom:12}}>
                  <div style={{fontFamily:"var(--ff-m)",fontSize:10,letterSpacing:2,textTransform:"uppercase",color:"rgba(255,255,255,0.4)"}}>{cat}</div>
                  {avg !== null && (
                    <div style={{fontFamily:"var(--ff-m)",fontSize:11,color:pColor(avg),fontWeight:700}}>{avg.toFixed(1)}% Average</div>
                  )}
                </div>
                {items.map((a, i) => {
                  const hasPts = a.score !== undefined && a.total !== undefined && a.total > 0;
                  const apt    = hasPts ? (a.score / a.total) * 100 : null;
                  const isExc  = a.rawScore && /exc|excused/i.test(a.rawScore);
                  const isMiss = a.rawScore && /miss|incomplete|ng/i.test(a.rawScore);
                  return (
                    <div key={i} className="gd-row" style={{
                      background:"rgba(255,255,255,0.02)", 
                      border:"1px solid var(--border)", 
                      marginBottom:8, 
                      padding:12, 
                      borderRadius:10, 
                      display:"flex", 
                      alignItems:"center", 
                      gap:16,
                      borderLeft: apt !== null ? `4px solid ${pColor(apt)}` : "4px solid var(--border)"
                    }}>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{fontSize:13, fontWeight:600, color:"#fff", overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap"}}>{a.name}</div>
                        {a.notes && <div style={{fontSize:10,color:"rgba(255,255,255,0.4)",marginTop:2}}>{a.notes}</div>}
                      </div>
                      <div style={{fontSize:11, color:"rgba(255,255,255,0.3)", fontFamily:"var(--ff-m)"}}>{a.date}</div>
                      {hasPts ? (
                        <div style={{textAlign:"right", minWidth:80}}>
                          <div style={{fontSize:13, color:"#fff", fontWeight:700}}>{a.score}/{a.total}</div>
                          <div style={{fontSize:10, color:pColor(apt), fontWeight:600}}>{Math.round(apt)}%</div>
                        </div>
                      ) : (
                        <div style={{fontSize:11, color:isExc?"var(--blue)":isMiss?"var(--red)":"rgba(255,255,255,0.3)", fontWeight:600, minWidth:80, textAlign:"right"}}>
                          {isExc ? "Excused" : isMiss ? "Missing" : "Not Graded"}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── Grid view ────────────────────────────────────────────
  return (
    <div className="page fu">
      <div className="page-container">
        <div className="ph" style={{padding:"24px 0 16px"}}>
          <div className="ph-row" style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <div>
              <div className="ph-title">Gradebook</div>
              <div style={{fontFamily:"var(--ff-m)", fontSize:10, letterSpacing:1.5, textTransform:"uppercase", color:"rgba(255,255,255,0.5)", marginTop:6}}>
                {classes.length} active courses
              </div>
            </div>
            <div className="btn-row">
              <button className={`btn ${syncStatus==="loading"?"btn-out":"btn-dark"} btn-sm`} onClick={onSync} disabled={syncStatus==="loading"}>
                {syncStatus==="loading" ? <><Loader size={12} className="spin"/>Syncing…</> : <><Sparkles size={12}/>Sync StudentVUE</>}
              </button>
            </div>
          </div>
        </div>

        {syncStatus==="error" && (
          <div className="card" style={{background:"rgba(239,68,68,0.1)", border:"1px solid rgba(239,68,68,0.2)", padding:16, marginBottom:20, borderRadius:12}}>
            <div style={{display:"flex", alignItems:"center", gap:10}}>
              <AlertTriangle size={16} style={{color:"var(--red)"}}/>
              <div style={{fontSize:13, fontWeight:600, color:"var(--red)"}}>Sync Error: {syncError}</div>
            </div>
            <button className="btn btn-out btn-sm" style={{marginTop:12}} onClick={onDismiss}>Dismiss Error</button>
          </div>
        )}

        {syncStatus==="nocreds" && (
          <div className="card" style={{background:"rgba(249,115,22,0.1)", border:"1px solid rgba(249,115,22,0.2)", padding:16, marginBottom:20, borderRadius:12}}>
            <div style={{fontSize:13, fontWeight:600, color:"var(--orange)", marginBottom:4}}>StudentVUE connection missing</div>
            <div style={{fontSize:12, color:"rgba(255,255,255,0.7)"}}>Please authenticate in your StudentVUE settings to load live grades.</div>
          </div>
        )}

        <div className="class-grid" style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(280px, 1fr))", gap:28, paddingBottom:40}}>
          {classes.map(c=>(
            <div key={c.id} className="card" style={{
              background:"rgba(26,26,42,0.4)", 
              backdropFilter:"blur(12px)", 
              border:"1px solid var(--border)", 
              padding:20, 
              borderRadius:16, 
              cursor:"pointer",
              transition:"transform 0.2s, background 0.2s"
            }} onClick={()=>setSel(c.id)}>
              <div style={{display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12}}>
                <span className="tag" style={{background:"rgba(255,255,255,0.05)", color:"#fff", border:"1px solid var(--border)"}}>{c.type}</span>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:24, fontWeight:900, color:lColor(c.letter), fontFamily:"var(--ff-d)", lineHeight:1}}>{c.letter}</div>
                  <div style={{fontSize:12, fontWeight:700, color:"#fff", marginTop:2}}>{c.pct}%</div>
                </div>
              </div>
              
              <div style={{marginBottom:16}}>
                <div style={{fontSize:12, color:"rgba(255,255,255,0.4)", fontWeight:600, fontFamily:"var(--ff-m)", marginBottom:2}}>{c.period?`PERIOD ${c.period}`:c.code}</div>
                <div style={{fontSize:16, fontWeight:800, color:"#fff", fontFamily:"var(--ff-d)", lineHeight:1.2}}>{c.name}</div>
              </div>

              <div className="pb" style={{height:6, background:"rgba(255,255,255,0.05)", marginBottom:10}}>
                <div className="pf" style={{width:`${Math.min(c.pct,100)}%`, background:pColor(c.pct)}}/>
              </div>

              {c.teacher && (
                <div style={{fontSize:10, color:"rgba(255,255,255,0.4)", fontWeight:500}}>{c.teacher}</div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
/* ── GPA ─────────────────────────────────────────────────── */
function GPAPage({ sharedClasses }) {
  const [localClasses, setLocalClasses] = useState(CLASSES);
  const classes = sharedClasses && sharedClasses.length > 0 ? sharedClasses : localClasses;
  const [showAdd, setShowAdd] = useState(false);
  const [showWI, setShowWI] = useState(false);
  const [nc, setNc] = useState({name:"",type:"AP",pct:90});
  const [wiCid, setWiCid] = useState(CLASSES[0].id);
  const [wiAsgn, setWiAsgn] = useState("");
  const [wiType, setWiType] = useState("Summative");
  const [wiTotal, setWiTotal] = useState(100);
  const [wiTarget, setWiTarget] = useState(90);

  const wgpa = calcW(classes);
  const ugpa = calcU(classes);
  const drag = classes.filter(c=>c.pct<85).sort((a,b)=>a.pct-b.pct);

  const addCls = () => {
    const l = nc.pct>=93?"A":nc.pct>=90?"A-":nc.pct>=87?"B+":nc.pct>=83?"B":nc.pct>=80?"B-":"C+";
    const bonus={AP:1,HN:0.5,REG:0};
    const base=nc.pct>=93?4:nc.pct>=90?3.7:nc.pct>=87?3.3:nc.pct>=83?3:nc.pct>=80?2.7:2.3;
    setLocalClasses(prev=>[...prev,{...nc,id:Date.now(),letter:l,code:"NEW",wGP:base+(bonus[nc.type]||0),uGP:base,assignments:[]}]);
    setShowAdd(false); setNc({name:"",type:"AP",pct:90});
  };

  const wiCls = classes.find(c=>c.id===wiCid);
  const weights = {Final:0.4,Summative:0.45,Formative:0.15};
  const avgOf = type => {
    const items = wiCls?.assignments.filter(a=>a.type===type)||[];
    return items.length ? items.reduce((s,a)=>s+(a.score/a.total)*100,0)/items.length : 0;
  };
  let otherScore = 0;
  if(wiType==="Formative") otherScore = avgOf("Summative")*0.45+avgOf("Final")*0.40;
  if(wiType==="Summative") otherScore = avgOf("Formative")*0.15+avgOf("Final")*0.40;
  if(wiType==="Final") otherScore = avgOf("Formative")*0.15+avgOf("Summative")*0.45;
  const needed = Math.max(0,Math.min(100,((wiTarget-otherScore)/(weights[wiType]||0.45)).toFixed(1)));
  const neededPts = ((needed/100)*wiTotal).toFixed(1);

  return (
    <div className="page fu">
      <div className="page-container">
        <div className="ph" style={{padding:"24px 0 16px"}}>
          <div className="ph-row" style={{display:"flex", alignItems:"center", justifyContent:"space-between"}}>
            <div>
              <div className="ph-title">GPA Calculator</div>
              <div style={{fontFamily:"var(--ff-m)", fontSize:10, letterSpacing:1.5, textTransform:"uppercase", color:"rgba(255,255,255,0.5)", marginTop:6}}>
                Academic performance tracking
              </div>
            </div>
            <div className="btn-row">
              <button className="btn btn-out btn-sm" onClick={()=>setShowWI(true)}>What do I need?</button>
              <button className="btn btn-dark btn-sm" onClick={()=>setShowAdd(true)}><Plus size={12}/>Add Class</button>
            </div>
          </div>
        </div>

        <div className="g2" style={{marginBottom:32, display:"grid", gridTemplateColumns:"repeat(2, 1fr)", gap:28}}>
          <div className="card" style={{background:"rgba(26,26,42,0.4)", backdropFilter:"blur(12px)", padding:24, borderRadius:16, border:"1px solid var(--border)"}}>
            <div style={{fontFamily:"var(--ff-m)", fontSize:10, letterSpacing:1.5, textTransform:"uppercase", color:"rgba(255,255,255,0.4)", marginBottom:8}}>Weighted GPA</div>
            <div style={{fontFamily:"var(--ff-d)", fontSize:42, fontWeight:900, color:"#fff", lineHeight:1}}>{wgpa}</div>
            <div style={{fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:4}}>Scale adjusted for course rigor</div>
            <div style={{marginTop:20, height:12, background:"rgba(255,255,255,0.05)", borderRadius:6, overflow:"hidden"}}>
              <div style={{height:"100%", width:`${(parseFloat(wgpa)/5)*100}%`, background:"linear-gradient(90deg, #10B981, #059669)", borderRadius:6, transition:"width 1s cubic-bezier(0.34, 1.56, 0.64, 1)"}}/>
            </div>
          </div>
          <div className="card" style={{background:"rgba(26,26,42,0.4)", backdropFilter:"blur(12px)", padding:24, borderRadius:16, border:"1px solid var(--border)"}}>
            <div style={{fontFamily:"var(--ff-m)", fontSize:10, letterSpacing:1.5, textTransform:"uppercase", color:"rgba(255,255,255,0.4)", marginBottom:8}}>Unweighted GPA</div>
            <div style={{fontFamily:"var(--ff-d)", fontSize:42, fontWeight:900, color:"#fff", lineHeight:1}}>{ugpa}</div>
            <div style={{fontSize:11, color:"rgba(255,255,255,0.5)", marginTop:4}}>Baseline 4.0 academic standard</div>
            <div style={{marginTop:20, height:12, background:"rgba(255,255,255,0.05)", borderRadius:6, overflow:"hidden"}}>
              <div style={{height:"100%", width:`${(parseFloat(ugpa)/4)*100}%`, background:"linear-gradient(90deg, #10B981, #059669)", borderRadius:6, transition:"width 1s cubic-bezier(0.34, 1.56, 0.64, 1)"}}/>
            </div>
          </div>
        </div>

        {drag.length>0 && (
          <div className="card" style={{background:"rgba(239,68,68,0.05)", border:"1px solid rgba(239,68,68,0.2)", borderRadius:16, padding:20, marginBottom:24}}>
            <div style={{display:"flex", alignItems:"center", gap:10, marginBottom:16}}>
              <AlertTriangle size={16} style={{color:"var(--red)"}}/>
              <div style={{fontSize:14, fontWeight:700, color:"#fff"}}>GPA Impact Alerts</div>
            </div>
            {drag.map(c=>(
              <div key={c.id} style={{display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"rgba(255,255,255,0.03)", borderRadius:10, marginBottom:8}}>
                <div style={{fontSize:13, fontWeight:600, color:"#fff"}}>{c.name}</div>
                <div style={{display:"flex", alignItems:"center", gap:8}}>
                  <span style={{fontSize:12, fontWeight:700, color:"var(--red)"}}>{c.pct}%</span>
                  <span style={{fontSize:10, background:"rgba(239,68,68,0.2)", color:"var(--red)", padding:"2px 6px", borderRadius:4}}>{c.letter}</span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{background:"rgba(26,26,42,0.4)", backdropFilter:"blur(12px)", border:"1px solid var(--border)", borderRadius:16, padding:20}}>
          <div style={{fontSize:14, fontWeight:700, color:"#fff", marginBottom:16}}>Course Overview</div>
          <div style={{display:"flex", flexDirection:"column", gap:2}}>
            {classes.map(c=>(
              <div key={c.id} style={{display:"flex", alignItems:"center", gap:16, padding:12, borderRadius:10, transition:"background 0.2s"}} className="cls-row-hover">
                <div style={{flex:1}}>
                  <div style={{fontSize:13, fontWeight:700, color:"#fff"}}>{c.name}</div>
                  <div style={{fontSize:10, color:"rgba(255,255,255,0.4)", fontFamily:"var(--ff-m)", marginTop:2}}>{c.code}</div>
                </div>
                <span className="tag" style={{background:"rgba(255,255,255,0.05)", color:"#fff", border:"1px solid var(--border)"}}>{c.type}</span>
                <div style={{textAlign:"right", minWidth:60}}>
                  <div style={{fontSize:16, fontWeight:900, color:lColor(c.letter), fontFamily:"var(--ff-d)", lineHeight:1}}>{c.letter}</div>
                  <div style={{fontSize:10, color:"rgba(255,255,255,0.5)", fontWeight:600, marginTop:2}}>{c.pct}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Class Modal */}
      {showAdd && (
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setShowAdd(false)} style={{backdropFilter:"blur(8px)"}}>
          <div className="modal" style={{background:"rgba(26,26,42,0.95)", border:"1px solid var(--border)", padding:24, borderRadius:20}}>
            <div className="ph-title" style={{fontSize:20, marginBottom:20}}>Add Course</div>
            <div className="fg"><label className="fl">Course Name</label><input className="fi" value={nc.name} onChange={e=>setNc({...nc,name:e.target.value})} placeholder="e.g. AP World History"/></div>
            <div className="g2">
              <div className="fg"><label className="fl">Level</label><select className="fi" value={nc.type} onChange={e=>setNc({...nc,type:e.target.value})}><option value="AP">AP (+1.0)</option><option value="HN">Honors (+0.5)</option><option value="REG">Regular</option></select></div>
              <div className="fg"><label className="fl">Current %</label><input type="number" className="fi" value={nc.pct} onChange={e=>setNc({...nc,pct:parseFloat(e.target.value)||0})}/></div>
            </div>
            <div className="btn-row" style={{marginTop:24}}>
              <button className="btn btn-dark" style={{flex:1}} onClick={addCls} disabled={!nc.name}>Add to Record</button>
              <button className="btn btn-out" onClick={()=>setShowAdd(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* What Do I Need Modal */}
      {showWI && (
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setShowWI(false)} style={{backdropFilter:"blur(8px)"}}>
          <div className="modal" style={{background:"rgba(26,26,42,0.95)", border:"1px solid var(--border)", padding:24, borderRadius:20, maxWidth:400}}>
            <div className="ph-title" style={{fontSize:20, marginBottom:20}}>Grade Projection</div>
            <div className="fg"><label className="fl">Select Course</label><select className="fi" value={wiCid} onChange={e=>setWiCid(parseInt(e.target.value))}>{classes.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
            <div className="g2">
              <div className="fg"><label className="fl">Assignment</label><input className="fi" value={wiAsgn} onChange={e=>setWiAsgn(e.target.value)} placeholder="Upcoming Task"/></div>
              <div className="fg"><label className="fl">Grade Type</label><select className="fi" value={wiType} onChange={e=>setWiType(e.target.value)}><option>Formative</option><option>Summative</option><option>Final</option></select></div>
            </div>
            <div className="fg"><label className="fl">Target Final Grade %</label><input type="number" className="fi" value={wiTarget} onChange={e=>setWiTarget(parseInt(e.target.value)||0)}/></div>
            
            <div style={{background:"rgba(16,185,129,0.05)", border:"1px solid rgba(16,185,129,0.2)", borderRadius:14, padding:20, marginTop:20, textAlign:"center"}}>
              <div style={{fontSize:11, color:"rgba(16,185,129,0.7)", fontWeight:700, letterSpacing:1, textTransform:"uppercase"}}>Required Score</div>
              <div style={{fontSize:42, fontWeight:900, color:"#fff", fontFamily:"var(--ff-d)", margin:"8px 0"}}>{needed}%</div>
              <div style={{fontSize:12, color:"rgba(255,255,255,0.5)"}}>{neededPts} / {wiTotal} points needed</div>
            </div>

            <button className="btn btn-out" style={{width:"100%", marginTop:20, justifyContent:"center"}} onClick={()=>setShowWI(false)}>Close Calculator</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── SCREEN TIME ─────────────────────────────────────────── */
function ScreenTimePage() {
  const [blocked, setBlocked] = useState(["Instagram","TikTok","YouTube"]);
  const [active, setActive] = useState(false);
  const [onBreak, setOnBreak] = useState(false);
  const [secs, setSecs] = useState(0);
  const [totalSecs, setTotalSecs] = useState(0);
  const [showStart, setShowStart] = useState(false);
  const [showAddT, setShowAddT] = useState(false);
  const [addMins, setAddMins] = useState(15);
  const [selDur, setSelDur] = useState(50);
  const [isPomo, setIsPomo] = useState(false);
  const [pomoWork, setPomoWork] = useState(25);
  const [pomoBrk, setPomoBrk] = useState(5);
  const [pomoPhase, setPomoPhase] = useState("work");
  const [pomoSecs, setPomoSecs] = useState(25*60);
  const [customH, setCustomH] = useState(1);
  const [customM, setCustomM] = useState(0);
  const ref = useRef(null);

  useEffect(()=>{
    if(active&&!onBreak){
      ref.current=setInterval(()=>{
        setSecs(s=>s+1);
        if(isPomo) setPomoSecs(ps=>{ if(ps<=1){setPomoPhase(p=>{ const np=p==="work"?"break":"work"; setPomoSecs(np==="work"?pomoWork*60:pomoBrk*60); return np; }); return ps;} return ps-1; });
      },1000);
    } else clearInterval(ref.current);
    return()=>clearInterval(ref.current);
  },[active,onBreak,isPomo,pomoWork,pomoBrk]);

  const timeLeft = Math.max(0,totalSecs-secs);
  const pct = totalSecs>0?Math.min(100,(secs/totalSecs)*100):0;

  const start = () => {
    const dur = selDur==="custom"?(customH*60+customM)*60:selDur*60;
    setTotalSecs(dur); setSecs(0); setPomoSecs(pomoWork*60); setPomoPhase("work");
    setActive(true); setOnBreak(false); setShowStart(false);
  };

  const end = () => { setActive(false); setSecs(0); setTotalSecs(0); };

  return (
    <div className="page fu">
      <div className="page-container">
        <div className="ph" style={{padding:"24px 0 16px"}}>
          <div className="ph-title">Deep Focus</div>
          <div style={{fontFamily:"var(--ff-m)", fontSize:10, letterSpacing:1.5, textTransform:"uppercase", color:"rgba(255,255,255,0.5)", marginTop:6}}>
            Minimize distractions during study blocks
          </div>
        </div>

        {active ? (
          <div className="card" style={{background:"rgba(26,26,42,0.4)", backdropFilter:"blur(20px)", border:"1px solid rgba(255,255,255,0.1)", padding:40, borderRadius:24, textAlign:"center", marginBottom:32}}>
            <div style={{fontSize:14, fontWeight:700, color:"rgba(255,255,255,0.6)", textTransform:"uppercase", letterSpacing:2, marginBottom:16}}>
              {onBreak ? "Resting Period" : isPomo && pomoPhase === "break" ? "Take a Breath" : "Focusing Mode"}
            </div>
            <div style={{fontFamily:"var(--ff-d)", fontSize:84, fontWeight:900, color:"#fff", letterSpacing:"-4px", lineHeight:1, marginBottom:12}}>
              {isPomo ? fmtT(pomoSecs) : fmtT(timeLeft)}
            </div>
            <div style={{fontSize:14, color:"rgba(255,255,255,0.4)", marginBottom:32}}>
              {isPomo ? `${pomoPhase === "work" ? "Until Break" : "Until Focus"} · ${fmtT(secs)} total session` : `${fmtT(secs)} elapsed total`}
            </div>
            
            <div className="pb" style={{height:4, background:"rgba(255,255,255,0.05)", borderRadius:2, width:240, margin:"0 auto 32px"}}>
              <div className="pf" style={{width:`${pct}%`, background:"#fff", boxShadow:"0 0 15px rgba(255,255,255,0.3)"}}/>
            </div>

            <div className="btn-row" style={{justifyContent:"center", gap:16}}>
              {onBreak ? (
                <button className="btn btn-dark" style={{background:"#fff", color:"#000", padding:"12px 32px"}} onClick={()=>setOnBreak(false)}><Play size={16}/> Resume</button>
              ) : (
                <button className="btn btn-out" style={{padding:"12px 32px"}} onClick={()=>setOnBreak(true)}><Pause size={16}/> Pause</button>
              )}
              <button className="btn btn-out" style={{padding:"12px 24px"}} onClick={()=>setShowAddT(true)}><Plus size={16}/> Add Time</button>
              <button className="btn btn-red" style={{padding:"12px 24px"}} onClick={end}><Square size={16}/> End Session</button>
            </div>
          </div>
        ) : (
          <div className="card" style={{background:"rgba(26,26,42,0.4)", backdropFilter:"blur(12px)", border:"1px solid var(--border)", padding:48, borderRadius:24, textAlign:"center", marginBottom:32}}>
            <div style={{fontSize:48, marginBottom:20}}>🎯</div>
            <div style={{fontFamily:"var(--ff-d)", fontSize:32, fontWeight:800, color:"#fff", marginBottom:12}}>Flow state starts here.</div>
            <div style={{fontSize:14, color:"rgba(255,255,255,0.5)", marginBottom:32}}>
              Click below to block {blocked.length} distracting apps and start your study block.
            </div>
            <button className="btn btn-dark" style={{padding:"14px 32px", fontSize:16, margin:"0 auto"}} onClick={()=>setShowStart(true)}>
              Initialize Focus Block <ChevronRight size={18}/>
            </button>
          </div>
        )}

        <div className="card" style={{background:"rgba(26,26,42,0.4)", backdropFilter:"blur(12px)", border:"1px solid var(--border)", borderRadius:16, padding:24}}>
          <div style={{display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:20}}>
            <div style={{fontSize:14, fontWeight:700, color:"#fff"}}>App Blocking List</div>
            <div style={{fontSize:10, fontFamily:"var(--ff-m)", color:"rgba(255,255,255,0.4)", letterSpacing:1}}>{blocked.length} APPS SELECTED</div>
          </div>
          <div className="app-grid" style={{display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(100px, 1fr))", gap:12}}>
            {APPS.map(a=>(
              <div key={a.name} className={`app-tile ${blocked.includes(a.name)?"on":""}`} style={{
                background: blocked.includes(a.name) ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.02)",
                border: blocked.includes(a.name) ? "1px solid rgba(255,255,255,0.2)" : "1px solid rgba(255,255,255,0.05)",
                padding: 16,
                borderRadius: 12,
                cursor: "pointer",
                textAlign: "center",
                transition: "all 0.2s"
              }} onClick={()=>setBlocked(p=>p.includes(a.name)?p.filter(x=>x!==a.name):[...p,a.name])}>
                <div style={{fontSize:24, marginBottom:8}}>{a.icon}</div>
                <div style={{fontSize:11, fontWeight:600, color: blocked.includes(a.name) ? "#fff" : "rgba(255,255,255,0.4)"}}>{a.name}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Start Session Modal */}
      {showStart && (
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setShowStart(false)} style={{backdropFilter:"blur(12px)"}}>
          <div className="modal" style={{background:"rgba(26,26,42,0.95)", border:"1px solid var(--border)", padding:24, borderRadius:20, width:400}}>
            <div className="ph-title" style={{fontSize:20, marginBottom:24}}>Focus Parameters</div>
            
            <div style={{fontFamily:"var(--ff-m)", fontSize:9, letterSpacing:2, textTransform:"uppercase", color:"rgba(255,255,255,0.4)", marginBottom:10}}>Duration</div>
            <div className="g4" style={{display:"grid", gridTemplateColumns:"repeat(4, 1fr)", gap:8, marginBottom:20}}>
              {[25,50,90,"custom"].map(d=>(
                <div key={d} className={`dur-btn ${selDur===d?"on":""}`} style={{
                  padding: "10px 0", textAlign: "center", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", border: "1px solid var(--border)",
                  background: selDur===d ? "rgba(255,255,255,0.1)" : "transparent",
                  color: selDur===d ? "#fff" : "rgba(255,255,255,0.4)"
                }} onClick={()=>setSelDur(d)}>
                  {d==="custom"?"Custom":`${d}m`}
                </div>
              ))}
            </div>

            {selDur==="custom" && (
              <div className="g2" style={{marginBottom:20}}>
                <div className="fg"><label className="fl">Hours</label><input type="number" className="fi" value={customH} onChange={e=>setCustomH(parseInt(e.target.value)||0)} min={0} max={8}/></div>
                <div className="fg"><label className="fl">Minutes</label><input type="number" className="fi" value={customM} onChange={e=>setCustomM(parseInt(e.target.value)||0)} min={0} max={59}/></div>
              </div>
            )}

            <div style={{fontFamily:"var(--ff-m)", fontSize:9, letterSpacing:2, textTransform:"uppercase", color:"rgba(255,255,255,0.4)", marginBottom:10, marginTop:10}}>Mode Selection</div>
            <div style={{display:"flex", flexDirection:"column", gap:8, marginBottom:24}}>
              <div className={`pomo-opt ${!isPomo?"on":""}`} style={{
                padding: 14, borderRadius: 12, cursor: "pointer", border: "1px solid var(--border)",
                background: !isPomo ? "rgba(255,255,255,0.05)" : "transparent"
              }} onClick={()=>setIsPomo(false)}>
                <div style={{fontSize:13, fontWeight:700, color: !isPomo?"#fff":"rgba(255,255,255,0.4)"}}>Standard Interval</div>
                <div style={{fontSize:11, color: "rgba(255,255,255,0.3)", marginTop:2}}>Uninterrupted focus block</div>
              </div>
              <div className={`pomo-opt ${isPomo?"on":""}`} style={{
                padding: 14, borderRadius: 12, cursor: "pointer", border: "1px solid var(--border)",
                background: isPomo ? "rgba(255,255,255,0.05)" : "transparent"
              }} onClick={()=>setIsPomo(true)}>
                <div style={{fontSize:13, fontWeight:700, color: isPomo?"#fff":"rgba(255,255,255,0.4)"}}>🍅 Pomodoro Technique</div>
                <div style={{fontSize:11, color: "rgba(255,255,255,0.3)", marginTop:2}}>{pomoWork}m work · {pomoBrk}m break intervals</div>
              </div>
            </div>

            {isPomo && (
              <div className="g2" style={{marginBottom:24}}>
                <div className="fg"><label className="fl">Work Span</label><input type="number" className="fi" value={pomoWork} onChange={e=>setPomoWork(parseInt(e.target.value)||25)}/></div>
                <div className="fg"><label className="fl">Break Span</label><input type="number" className="fi" value={pomoBrk} onChange={e=>setPomoBrk(parseInt(e.target.value)||5)}/></div>
              </div>
            )}

            <div className="btn-row">
              <button className="btn btn-dark" style={{flex:1, justifyContent:"center"}} onClick={start}>Initialize Session</button>
              <button className="btn btn-out" onClick={()=>setShowStart(false)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {showAddT && (
        <div className="ov" onClick={e=>e.target===e.currentTarget&&setShowAddT(false)} style={{backdropFilter:"blur(8px)"}}>
          <div className="modal" style={{background:"rgba(26,26,42,0.95)", border:"1px solid var(--border)", padding:24, borderRadius:20, width:320}}>
            <div className="ph-title" style={{fontSize:18, marginBottom:20}}>Extend Session</div>
            <div style={{display:"flex", gap:8, marginBottom:20}}>
              {[5,15,30].map(m=><div key={m} className={`dur-btn ${addMins===m?"on":""}`} style={{
                flex:1, textAlign:"center", padding:"10px 0", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", border:"1px solid var(--border)",
                background: addMins===m?"rgba(255,255,255,0.1)":"transparent",
                color: addMins===m?"#fff":"rgba(255,255,255,0.4)"
              }} onClick={()=>setAddMins(m)}>{m}m</div>)}
            </div>
            <div className="btn-row">
              <button className="btn btn-dark" style={{flex:1, justifyContent:"center"}} onClick={()=>{setTotalSecs(t=>t+addMins*60);setShowAddT(false);}}>Confirm +{addMins}m</button>
              <button className="btn btn-out" onClick={()=>setShowAddT(false)}>Discard</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── IMPORTER ────────────────────────────────────────────── */
function ImporterPage({ setEvents }) {
  const [tab, setTab] = useState(0);
  // Schoology tab
  const [schoUrl, setSchoUrl] = useState("");
  const [schoStatus, setSchoStatus] = useState("idle"); // idle, loading, done, error
  const [schoError, setSchoError] = useState("");
  const [schoResult, setSchoResult] = useState([]);
  const [schoChecked, setSchoChecked] = useState({});
  // Text tab
  const [pastedText, setPastedText] = useState("");
  const [textStatus, setTextStatus] = useState("idle");
  const [textResult, setTextResult] = useState([]);
  // PDF tab
  const [pdfFile, setPdfFile] = useState(null);
  const [pdfStatus, setPdfStatus] = useState("idle");
  const [pdfResult, setPdfResult] = useState([]);
  // Image tab
  const [imgFile, setImgFile] = useState(null);
  const [imgStatus, setImgStatus] = useState("idle");
  const [imgResult, setImgResult] = useState([]);
  // Checkbox selections
  const [checked, setChecked] = useState({});

  const tabs = [
    {label:"Schoology",icon:<Link size={12}/>},
    {label:"Paste Text",icon:<FileText size={12}/>},
    {label:"Upload Doc",icon:<Upload size={12}/>},
    {label:"Photo",icon:<Image size={12}/>},
  ];

  const callClaude = async (prompt) => {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body: JSON.stringify({
        model:"claude-sonnet-4-20250514",
        max_tokens:1000,
        messages:[{role:"user",content:prompt}]
      })
    });
    const data = await res.json();
    const text = data.content?.map(b=>b.text||"").join("") || "";
    const clean = text.replace(/```json|```/g,"").trim();
    return JSON.parse(clean);
  };

  const analyzeText = async (text) => {
    return callClaude(`You are a school assignment extractor. Given the following text from a teacher's agenda or assignment description, extract all assignments, tests, and important events.

Return ONLY a valid JSON array with no other text. Each item should have:
- "name": string (assignment or event name)
- "date": string (e.g. "Feb 28" or "Mar 3" — use 2026 context, current month is February 2026)
- "priority": "high" | "med" | "low" | "test"
- "subject": string (inferred subject if possible)

Text to analyze:
"""
${text}
"""

Return only the JSON array, nothing else.`);
  };

  const handleTextAnalyze = async () => {
    if(!pastedText.trim()) return;
    setTextStatus("loading");
    try {
      const result = await analyzeText(pastedText);
      setTextResult(result);
      setChecked(Object.fromEntries(result.map((_,i)=>[i,true])));
      setTextStatus("done");
    } catch(e) {
      setTextStatus("error");
    }
  };

  const handlePdfUpload = async (file) => {
    if(!file) return;
    setPdfFile(file);
    setPdfStatus("loading");
    try {
      const b64 = await new Promise((res,rej)=>{
        const r = new FileReader();
        r.onload=()=>res(r.result.split(",")[1]);
        r.onerror=()=>rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });
      const response = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{role:"user",content:[
            {type:"document",source:{type:"base64",media_type:"application/pdf",data:b64}},
            {type:"text",text:`Extract all assignments, tests, and events from this document. Return ONLY a valid JSON array. Each item: {"name":"...","date":"...","priority":"high|med|low|test","subject":"..."}. Use Feb 2026 context for relative dates. No other text.`}
          ]}]
        })
      });
      const data = await response.json();
      const text = data.content?.map(b=>b.text||"").join("")||"";
      const result = JSON.parse(text.replace(/```json|```/g,"").trim());
      setPdfResult(result);
      setChecked(Object.fromEntries(result.map((_,i)=>[i,true])));
      setPdfStatus("done");
    } catch(e) {
      setPdfStatus("error");
    }
  };

  const handleImgUpload = async (file) => {
    if(!file) return;
    setImgFile(file);
    setImgStatus("loading");
    try {
      const b64 = await new Promise((res,rej)=>{
        const r = new FileReader();
        r.onload=()=>res(r.result.split(",")[1]);
        r.onerror=()=>rej(new Error("Read failed"));
        r.readAsDataURL(file);
      });
      const mt = file.type || "image/jpeg";
      const response = await fetch("https://api.anthropic.com/v1/messages",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          model:"claude-sonnet-4-20250514",
          max_tokens:1000,
          messages:[{role:"user",content:[
            {type:"image",source:{type:"base64",media_type:mt,data:b64}},
            {type:"text",text:`Read this photo of a whiteboard or assignment sheet. Extract all visible assignments, tests, and deadlines. Return ONLY a valid JSON array. Each item: {"name":"...","date":"...","priority":"high|med|low|test","subject":"..."}. Use Feb 2026 context for relative dates. No other text.`}
          ]}]
        })
      });
      const data = await response.json();
      const text = data.content?.map(b=>b.text||"").join("")||"";
      const result = JSON.parse(text.replace(/```json|```/g,"").trim());
      setImgResult(result);
      setChecked(Object.fromEntries(result.map((_,i)=>[i,true])));
      setImgStatus("done");
    } catch(e) {
      setImgStatus("error");
    }
  };

  // ── Pure JS iCal parser (no dependencies needed) ──────────
  const parseICal = (raw) => {
    const events = [];
    // Split into VEVENT blocks
    const blocks = raw.split("BEGIN:VEVENT").slice(1);

    blocks.forEach(block => {
      const get = (key) => {
        // Handles folded lines (iCal wraps long lines with \r\n + space)
        const unfolded = block.replace(/\r\n[ \t]/g, "").replace(/\n[ \t]/g, "");
        const match = unfolded.match(new RegExp(`${key}[^:]*:([^\r\n]+)`));
        return match ? match[1].trim() : "";
      };

      const summary = get("SUMMARY")
        .replace(/\\,/g, ",")
        .replace(/\\n/g, " ")
        .replace(/\\;/g, ";")
        .trim();

      const dtstart = get("DTSTART");
      const description = get("DESCRIPTION").replace(/\\n/g, " ").replace(/\\,/g, ",");

      if (!summary || !dtstart) return;

      // Parse date from YYYYMMDD or YYYYMMDDTHHMMSS or YYYYMMDDTHHMMSSZ
      const dateStr = dtstart.replace(/T.*/, "");
      const year = dateStr.slice(0, 4);
      const month = dateStr.slice(4, 6);
      const day = dateStr.slice(6, 8);
      const isoDate = `${year}-${month}-${day}`;

      // Infer priority from keywords in summary/description
      const combined = (summary + " " + description).toLowerCase();
      let priority = "med";
      if (/\btest\b|\bexam\b|\bquiz\b|\bmidterm\b|\bfinal\b/.test(combined)) priority = "test";
      else if (/\burgent\b|\bdue today\b|\boverdue\b/.test(combined)) priority = "high";
      else if (/\breadings?\b|\bnotes?\b|\boptional\b/.test(combined)) priority = "low";

      // Infer subject from summary
      const subjectMap = {
        "calc|math|algebra|geometry|statistics": "Math",
        "bio|biology|science|lab|chemistry|chem|physics": "Science",
        "english|essay|writing|lit|literature|reading": "English",
        "history|social|apush|gov|economics|econ": "History",
        "spanish|french|latin|language|chinese": "Language",
        "art|music|pe|health|gym": "Elective",
      };
      let subject = "";
      for (const [pattern, label] of Object.entries(subjectMap)) {
        if (new RegExp(pattern).test(combined)) { subject = label; break; }
      }

      events.push({ name: summary, date: isoDate, priority, subject, description });
    });

    // Sort by date ascending
    return events.sort((a, b) => new Date(a.date) - new Date(b.date));
  };

  const handleSchoConnect = async () => {
    if (!schoUrl.trim()) return;
    setSchoStatus("loading");
    setSchoError("");
    setSchoResult([]);
    try {
      // Call our Vercel proxy instead of Schoology directly
      const proxyUrl = `/api/schoology?url=${encodeURIComponent(schoUrl.trim())}`;
      const res = await fetch(proxyUrl);

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Unknown error" }));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const icalText = await res.text();
      const parsed = parseICal(icalText);

      if (parsed.length === 0) {
        throw new Error("No events found in this calendar. It may be empty or the format is unsupported.");
      }

      setSchoResult(parsed);
      setSchoChecked(Object.fromEntries(parsed.map((_, i) => [i, true])));
      setSchoStatus("done");
    } catch (e) {
      setSchoError(e.message || "Something went wrong. Check the URL and try again.");
      setSchoStatus("error");
    }
  };

  const addSchoToCalendar = () => {
    const toAdd = schoResult
      .filter((_, i) => schoChecked[i] !== false)
      .map(r => ({
        id: Date.now() + Math.random(),
        name: r.name,
        date: r.date,
        priority: r.priority,
        blockScreen: false,
      }));
    setEvents(prev => [...prev, ...toAdd]);
    alert(`✓ Added ${toAdd.length} Schoology events to your calendar!`);
  };

  const addSelectedToCalendar = (results) => {
    const toAdd = results.filter((_,i)=>checked[i]!==false).map(r=>({
      id:Date.now()+Math.random(),
      name:r.name,
      date:`2026-${r.date?.includes("Mar")?"03":"02"}-${String(parseInt(r.date)||15).padStart(2,"0")}`,
      priority:r.priority||"med",
      blockScreen:false
    }));
    setEvents(prev=>[...prev,...toAdd]);
    alert(`✓ Added ${toAdd.length} events to your calendar!`);
  };

  const ResultList = ({results, status, onAdd}) => {
    if(status==="loading") return (
      <div className="ai-thinking sd">
        <Loader size={16} className="spin" style={{color:"var(--ink2)",flexShrink:0}}/>
        <div><div className="ai-t">AI is reading your content…</div><div className="ai-sub">Extracting assignments & dates</div></div>
      </div>
    );
    if(status==="error") return <div style={{color:"var(--red)",fontSize:13,padding:12,background:"#fdf0f0",borderRadius:"var(--r)",border:"1px solid #fbd0d0"}}>Failed to analyze. Check the content and try again.</div>;
    if(status!=="done") return null;
    return (
      <div className="sd">
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
          <div style={{fontFamily:"var(--ff-m)",fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"var(--ink3)"}}>{results.length} events found</div>
          <button className="btn btn-sm btn-ghost" onClick={()=>setChecked(Object.fromEntries(results.map((_,i)=>[i,!Object.values(checked).every(v=>v)])))}>Toggle All</button>
        </div>
        {results.map((r,i)=>(
          <div key={i} className="ev-extracted">
            <div className={`ee-check ${checked[i]!==false?"checked":""}`} onClick={()=>setChecked(p=>({...p,[i]:!p[i]}))}>
              {checked[i]!==false&&"✓"}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:500}}>{r.name}</div>
              <div style={{fontFamily:"var(--ff-m)",fontSize:10,color:"var(--ink3)",marginTop:1}}>{r.subject&&`${r.subject} · `}{r.date}</div>
            </div>
            <span className={`tag t-${r.priority}`}>{r.priority==="test"?"TEST":r.priority?.toUpperCase()}</span>
          </div>
        ))}
        <div style={{marginTop:10}} className="btn-row">
          <button className="btn btn-dark" style={{flex:1}} onClick={()=>onAdd(results)}>
            <Sparkles size={12}/>Add {Object.values(checked).filter(v=>v!==false).length} to Calendar
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="page fu">
      <div className="ph">
        <div className="ph-title">Calendar Importer</div>
        <div className="ph-sub">Import assignments from Schoology, documents, or photos</div>
      </div>

      <div className="imp-tab">
        {tabs.map((t,i)=>(
          <div key={i} className={`imp-t ${tab===i?"on":""}`} onClick={()=>setTab(i)}>
            {t.icon}{t.label}
          </div>
        ))}
      </div>

      {tab===0 && (
        <div className="card">
          <div className="ch"><div className="ct">Schoology iCal Sync</div></div>
          <div style={{fontSize:13,color:"var(--ink2)",marginBottom:16,lineHeight:1.6}}>
            In Schoology: go to <strong>Calendar → Export</strong>, copy the iCal URL, and paste it below. Option will import all your assignments and due dates automatically.
          </div>

          <div className="fg">
            <label className="fl">Schoology iCal URL</label>
            <input
              className="fi"
              value={schoUrl}
              onChange={e=>{ setSchoUrl(e.target.value); setSchoStatus("idle"); setSchoError(""); }}
              placeholder="https://app.schoology.com/ical/..."
            />
          </div>

          {schoStatus==="idle" && (
            <button className="btn btn-dark" disabled={!schoUrl.trim()} onClick={handleSchoConnect}>
              <Link size={12}/>Connect & Import →
            </button>
          )}

          {schoStatus==="loading" && (
            <div className="ai-thinking">
              <Loader size={15} className="spin" style={{color:"var(--ink2)",flexShrink:0}}/>
              <div>
                <div className="ai-t">Connecting to Schoology…</div>
                <div className="ai-sub">Fetching and parsing your calendar</div>
              </div>
            </div>
          )}

          {schoStatus==="error" && (
            <div style={{background:"#fdf0f0",border:"1px solid #f0b8b8",borderRadius:"var(--r)",padding:"12px 14px"}}>
              <div style={{fontSize:13,fontWeight:600,color:"var(--red)",marginBottom:4}}>⚠ Could not connect</div>
              <div style={{fontSize:12,color:"var(--red)"}}>{schoError}</div>
              <button className="btn btn-out btn-sm" style={{marginTop:10}} onClick={()=>setSchoStatus("idle")}>Try Again</button>
            </div>
          )}

          {schoStatus==="done" && schoResult.length>0 && (
            <div className="sd">
              <div style={{background:"#eef7f2",border:"1px solid #b0dcc2",borderRadius:"var(--r)",padding:"10px 14px",marginBottom:14,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
                <div style={{fontSize:13,fontWeight:600,color:"var(--green)"}}> ✓ {schoResult.length} events found</div>
                <button className="btn btn-ghost btn-sm" onClick={()=>setSchoStatus("idle")}>Change URL</button>
              </div>

              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
                <div style={{fontFamily:"var(--ff-m)",fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"var(--ink3)"}}>Select events to import</div>
                <button className="btn btn-ghost btn-sm" onClick={()=>setSchoChecked(Object.fromEntries(schoResult.map((_,i)=>[i,!Object.values(schoChecked).every(v=>v)])))}>Toggle All</button>
              </div>

              <div style={{maxHeight:320,overflowY:"auto",marginBottom:12}}>
                {schoResult.map((r,i)=>(
                  <div key={i} className="ev-extracted">
                    <div className={`ee-check ${schoChecked[i]!==false?"checked":""}`} onClick={()=>setSchoChecked(p=>({...p,[i]:!p[i]}))}>
                      {schoChecked[i]!==false&&"✓"}
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{fontSize:13,fontWeight:500,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                      <div style={{fontFamily:"var(--ff-m)",fontSize:10,color:"var(--ink3)",marginTop:1}}>
                        {r.subject&&`${r.subject} · `}{r.date}
                      </div>
                    </div>
                    <span className={`tag t-${r.priority}`}>{r.priority==="test"?"TEST":r.priority.toUpperCase()}</span>
                  </div>
                ))}
              </div>

              <button className="btn btn-dark" style={{width:"100%"}} onClick={addSchoToCalendar}>
                <Sparkles size={12}/>
                Add {Object.values(schoChecked).filter(v=>v!==false).length} events to Calendar
              </button>
            </div>
          )}

          <div className="dv"/>
          <div style={{fontFamily:"var(--ff-m)",fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"var(--ink3)",marginBottom:8}}>How to find your iCal URL in Schoology</div>
          {[
            "Log in to Schoology and click Calendar in the left sidebar.",
            "In the top-right corner of the Calendar view, click the gear ⚙ icon.",
            "Select Export Calendar from the dropdown menu.",
            "Copy the full iCal URL that appears and paste it above.",
          ].map((s,i)=>(
            <div key={i} style={{display:"flex",gap:10,marginBottom:7,fontSize:12,color:"var(--ink2)"}}>
              <span style={{fontFamily:"var(--ff-m)",color:"var(--ink4)",flexShrink:0,minWidth:14}}>{i+1}.</span>
              <span>{s}</span>
            </div>
          ))}
        </div>
      )}

      {tab===1 && (
        <div className="card">
          <div className="ch"><div className="ct">Paste Agenda Text</div></div>
          <div style={{fontSize:13,color:"var(--ink2)",marginBottom:14,lineHeight:1.6}}>
            Paste any text — a teacher's email, a copied agenda, or a list of assignments. The AI will extract dates, priorities, and create calendar events.
          </div>
          <div className="fg">
            <label className="fl">Paste text here</label>
            <textarea className="fi" value={pastedText} onChange={e=>setPastedText(e.target.value)}
              placeholder={"e.g.\nRead chapter 5-6 by Thursday\nQuiz on Friday covering unit 3\nLab report due next Monday..."}
              style={{minHeight:120,resize:"vertical",lineHeight:1.6}}/>
          </div>
          <button className="btn btn-dark" disabled={!pastedText.trim()||textStatus==="loading"} onClick={handleTextAnalyze}>
            {textStatus==="loading"?<><Loader size={12} className="spin"/>Analyzing…</>:<><Sparkles size={12}/>Analyze with AI</>}
          </button>
          {textStatus!=="idle" && <div style={{marginTop:14}}><ResultList results={textResult} status={textStatus} onAdd={addSelectedToCalendar}/></div>}
        </div>
      )}

      {tab===2 && (
        <div className="card">
          <div className="ch"><div className="ct">Upload PDF or Document</div></div>
          <div style={{fontSize:13,color:"var(--ink2)",marginBottom:14,lineHeight:1.6}}>
            Upload a teacher's syllabus, quarterly agenda, or assignment sheet. AI will read the document and extract all assignments.
          </div>
          <div className="dz" onClick={()=>document.getElementById("pdf-in").click()}>
            <input id="pdf-in" type="file" accept=".pdf,image/*" style={{display:"none"}} onChange={e=>handlePdfUpload(e.target.files[0])}/>
            <Upload size={28} style={{color:"var(--ink3)",margin:"0 auto 10px"}}/>
            <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>{pdfFile?pdfFile.name:"Drop PDF or image here"}</div>
            <div style={{fontSize:12,color:"var(--ink3)"}}>PDF, JPG, PNG · click to browse</div>
          </div>
          {pdfStatus!=="idle" && <div style={{marginTop:14}}><ResultList results={pdfResult} status={pdfStatus} onAdd={addSelectedToCalendar}/></div>}
        </div>
      )}

      {tab===3 && (
        <div className="card">
          <div className="ch"><div className="ct">Photo of Whiteboard / Board</div></div>
          <div style={{fontSize:13,color:"var(--ink2)",marginBottom:14,lineHeight:1.6}}>
            Take a photo of assignments written on the board and upload it. AI will read the text and create calendar events from what it sees.
          </div>
          <div className="dz" onClick={()=>document.getElementById("img-in").click()}>
            <input id="img-in" type="file" accept="image/*" style={{display:"none"}} onChange={e=>handleImgUpload(e.target.files[0])}/>
            <Image size={28} style={{color:"var(--ink3)",margin:"0 auto 10px"}}/>
            <div style={{fontSize:14,fontWeight:500,marginBottom:4}}>{imgFile?imgFile.name:"Upload a board photo"}</div>
            <div style={{fontSize:12,color:"var(--ink3)"}}>JPG, PNG, HEIC · click to browse or drop</div>
          </div>
          {imgStatus!=="idle" && <div style={{marginTop:14}}><ResultList results={imgResult} status={imgStatus} onAdd={addSelectedToCalendar}/></div>}
        </div>
      )}
    </div>
  );
}

/* ── SETTINGS ────────────────────────────────────────────── */
function SettingsPage({ svCreds, onSave }) {
  const [form, setForm] = useState({
    username: svCreds?.username || "",
    password: svCreds?.password || "",
    districtUrl: svCreds?.districtUrl || "",
  });
  const [saved, setSaved] = useState(false);
  const [showPass, setShowPass] = useState(false);

  const save = () => {
    onSave(form);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const clear = () => {
    const empty = { username:"", password:"", districtUrl:"" };
    setForm(empty);
    onSave(empty);
  };

  return (
    <div className="page fu">
      <div className="ph">
        <div className="ph-title">Settings</div>
        <div className="ph-sub">Account & integrations</div>
      </div>

      <div className="card" style={{maxWidth:520,marginBottom:14}}>
        <div className="ch">
          <div className="ct">StudentVUE Login</div>
          {svCreds?.username && (
            <span style={{fontFamily:"var(--ff-m)",fontSize:10,color:"var(--green)"}}>✓ Connected</span>
          )}
        </div>
        <div style={{fontSize:13,color:"var(--ink2)",marginBottom:16,lineHeight:1.6}}>
          Enter your StudentVUE credentials. These are stored only in your browser and never sent anywhere except directly to your school's StudentVUE server.
        </div>

        <div className="fg">
          <label className="fl">District URL</label>
          <input
            className="fi"
            value={form.districtUrl}
            onChange={e => setForm({...form, districtUrl: e.target.value})}
            placeholder="https://studentvue.yourdistrict.com"
          />
          <div style={{fontSize:11,color:"var(--ink3)",marginTop:4}}>
            Find this by going to StudentVUE, copying the URL from your browser, and keeping just the domain part (e.g. https://studentvue.lausd.net).
          </div>
        </div>

        <div className="fg">
          <label className="fl">Username</label>
          <input
            className="fi"
            value={form.username}
            onChange={e => setForm({...form, username: e.target.value})}
            placeholder="Your StudentVUE username"
            autoComplete="username"
          />
        </div>

        <div className="fg">
          <label className="fl">Password</label>
          <div style={{position:"relative"}}>
            <input
              className="fi"
              type={showPass ? "text" : "password"}
              value={form.password}
              onChange={e => setForm({...form, password: e.target.value})}
              placeholder="Your StudentVUE password"
              autoComplete="current-password"
              style={{paddingRight:60}}
            />
            <button
              className="btn btn-ghost btn-sm"
              style={{position:"absolute",right:4,top:"50%",transform:"translateY(-50%)",fontSize:11}}
              onClick={() => setShowPass(s => !s)}
            >
              {showPass ? "Hide" : "Show"}
            </button>
          </div>
        </div>

        <div className="btn-row">
          <button
            className="btn btn-dark"
            onClick={save}
            disabled={!form.username || !form.password || !form.districtUrl}
          >
            {saved ? "✓ Saved — syncing grades…" : "Save & Sync Grades"}
          </button>
          {svCreds?.username && (
            <button className="btn btn-out" onClick={clear}>Clear</button>
          )}
        </div>
      </div>

      <div className="card" style={{maxWidth:520}}>
        <div className="ch"><div className="ct">How grade sync works</div></div>
        <div style={{fontSize:13,color:"var(--ink2)",lineHeight:1.7}}>
          When you click <strong>Sync StudentVUE</strong> on the Grades page, Option sends your credentials to a private server-side function (not to any third party) which contacts your school's StudentVUE server directly. Your password is never stored on any server — it goes straight from your browser to your school and nowhere else. The grades are then parsed and displayed here.
        </div>
        <div className="dv"/>
        <div style={{fontFamily:"var(--ff-m)",fontSize:9,letterSpacing:2,textTransform:"uppercase",color:"var(--ink3)",marginBottom:8}}>Finding your district URL</div>
        {[
          "Open StudentVUE in your browser and log in.",
          "Look at the URL bar — copy everything up to and including .com, .net, or .org.",
          'Example: if the URL is "https://sis.pausd.org/PXP2_Login.aspx", your district URL is "https://sis.pausd.org".',
          "Paste that into the District URL field above.",
        ].map((s,i) => (
          <div key={i} style={{display:"flex",gap:10,marginBottom:7,fontSize:12,color:"var(--ink2)"}}>
            <span style={{fontFamily:"var(--ff-m)",color:"var(--ink4)",flexShrink:0,minWidth:14}}>{i+1}.</span>
            <span>{s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── SHELL ───────────────────────────────────────────────── */
export default function App() {
  const [page, setPage] = useState("home");
  const [events, setEvents] = useState(EVENTS_INIT);

  // ── Shared grade state (lifted so Grades + GPA stay in sync) ──
  const [sharedClasses, setSharedClasses] = useState(CLASSES);
  const [syncStatus, setSyncStatus] = useState("idle");
  const [syncError, setSyncError]   = useState("");
  const [lastSynced, setLastSynced] = useState(null);
  const [syncPeriod, setSyncPeriod] = useState("");

  // ── StudentVUE credentials (persisted to localStorage) ────────
  const [svCreds, setSvCreds] = useState(() => {
    try {
      const saved = localStorage.getItem("sv_creds");
      return saved ? JSON.parse(saved) : { username:"", password:"", districtUrl:"" };
    } catch { return { username:"", password:"", districtUrl:"" }; }
  });

  // ── Core sync function shared by Grades page + auto-trigger ───
  const syncGrades = async (creds) => {
    const c = creds || svCreds;
    if (!c?.username || !c?.password || !c?.districtUrl) {
      setSyncStatus("nocreds");
      return;
    }
    setSyncStatus("loading");
    setSyncError("");
    try {
      const res = await fetch("/api/studentvue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username:c.username, password:c.password, districtUrl:c.districtUrl }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Sync failed");
      if (!data.grades || data.grades.length === 0) throw new Error("No grades found. Your gradebook may be empty.");
      setSharedClasses(data.grades);
      setLastSynced(new Date());
      if (data.period) setSyncPeriod(data.period);
      setSyncStatus("done");
    } catch (e) {
      setSyncError(e.message);
      setSyncStatus("error");
    }
  };

  // ── When Settings saves creds, immediately trigger a sync ─────
  const handleSaveCreds = (newCreds) => {
    setSvCreds(newCreds);
    try { localStorage.setItem("sv_creds", JSON.stringify(newCreds)); } catch {}
    // Auto-sync right away so Grades + GPA update instantly
    syncGrades(newCreds);
  };

  const nav = [
    {id:"home",         icon:<Home size={14}/>,       label:"Dashboard"},
    {id:"calendar",     icon:<Calendar size={14}/>,    label:"Calendar"},
    {id:"grades",       icon:<BookOpen size={14}/>,    label:"Gradebook"},
    {id:"gpa",          icon:<Calculator size={14}/>,  label:"GPA"},
    {id:"integrations", icon:<Layers size={14}/>,      label:"Integrations"},
    {id:"screentime",   icon:<Clock size={14}/>,       label:"Focus"},
    {id:"importer",     icon:<Sparkles size={14}/>,    label:"Import"},
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
            {nav.map(item=>(
              <div key={item.id} className={`sb-item ${page===item.id?"on":""}`} onClick={()=>setPage(item.id)}>
                {item.icon}{item.label}
              </div>
            ))}
          </div>
          <div className="sb-foot">
            <div
              className={`sb-item ${page==="settings"?"on":""}`}
              style={{marginBottom:0,padding:"7px 10px"}}
              onClick={()=>setPage("settings")}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14"/></svg>
              Settings
            </div>
            <div className="sb-user" style={{marginTop:8}}>
              {svCreds?.username
                ? <span style={{color:"#3a7a3a"}}>✓ {svCreds.username}</span>
                : "Not connected"}
            </div>
          </div>
        </div>
        <div className="main">
          {page==="home"         && <HomePage events={events} classes={sharedClasses} syncStatus={syncStatus}/>}
          {page==="grades"       && <GradesPage classes={sharedClasses} syncStatus={syncStatus} syncError={syncError} lastSynced={lastSynced} syncPeriod={syncPeriod} onSync={()=>syncGrades()} onDismiss={()=>setSyncStatus("idle")}/>}
          {page==="gpa"          && <GPAPage sharedClasses={sharedClasses}/>}
          {page==="calendar"     && <div className="cal-page-wrap"><CalendarPage events={events} setEvents={setEvents}/></div>}
          {page==="integrations" && <IntegrationsPage setPage={setPage} />}
          {page==="importer"     && <ImporterPage setEvents={setEvents}/>}
          {page==="screentime"   && <ScreenTimePage/>}
          {page==="settings"     && <SettingsPage svCreds={svCreds} onSave={handleSaveCreds}/>}
        </div>
      </div>
    </>
  );
}