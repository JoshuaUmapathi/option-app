const fs = require('fs');
const oldText = fs.readFileSync('c:/Users/joshu/OneDrive/Desktop/Option/option-app/src/App_old.js', 'utf8');
let currentText = fs.readFileSync('c:/Users/joshu/OneDrive/Desktop/Option/option-app/src/App.js', 'utf8');

const splitter = "/* ── IMPORTER ────────────────────────────────────────────── */";
const oldPart2 = oldText.substring(oldText.indexOf(splitter));
const newPart1 = currentText.substring(0, currentText.indexOf(splitter));

let repaired = newPart1 + oldPart2;

// Re-apply Integrations logic correctly!
// 1. Add Layers and List to imports
repaired = repaired.replace(
  '  Info\r\n} from "lucide-react";',
  '  Info,\r\n  Layers,\r\n  List\r\n} from "lucide-react";\r\n\r\nimport IntegrationsPage from "./pages/Integrations";'
);

// 2. Add spin CSS
repaired = repaired.replace(
  '.btn-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}',
  '.btn-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;}\r\n.spin{animation:spin 1s linear infinite;}\r\n@keyframes spin{100%{transform:rotate(360deg);}}'
);

// 3. Update displayEvents
const oldEventsLogic = `  const todayStr = \`\${today.getFullYear()}-\${String(today.getMonth()+1).padStart(2,"0")}-\${String(today.getDate()).padStart(2,"0")}\`;\r
  const upcoming = [...events].filter(e => e.date >= todayStr)\r
    .sort((a,b) => new Date(a.date)-new Date(b.date)).slice(0,6);`;
const newEventsLogic = `  const todayStr = \`\${today.getFullYear()}-\${String(today.getMonth()+1).padStart(2,"0")}-\${String(today.getDate()).padStart(2,"0")}\`;\r
  const upcoming = [...events].filter(e => e.date >= todayStr)\r
    .sort((a,b) => new Date(a.date)-new Date(b.date)).slice(0,6);\r
\r
  let displayEvents = upcoming;\r
  let isGCConnected = false;\r
  try {\r
    isGCConnected = JSON.parse(localStorage.getItem('integrations'))?.gcal === true;\r
  } catch {}\r
\r
  if (upcoming.length === 0 && isGCConnected) {\r
    displayEvents = [\r
      { id: "mock1", name: "AP Chem Study Session", date: "4:00 PM", priority: "high" },\r
      { id: "mock2", name: "Calc BC Group Project", date: "Tomorrow", priority: "med" },\r
      { id: "mock3", name: "Piano Lesson", date: "Wed, 5:30 PM", priority: "med" }\r
    ];\r
  }`;
repaired = repaired.replace(oldEventsLogic, newEventsLogic);

// 4. Update map to displayEvents
const oldHtmlMap = `{upcoming.length === 0 ? (\r
              <div style={{padding:"40px 20px",textAlign:"center"}}>\r
                <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.7)"}}>All caught up!</div>\r
              </div>\r
            ) : upcoming.map((e,i) => (\r
              <div key={e.id} className="un-row" style={{borderBottom:"1px solid rgba(255,255,255,0.03)"}}>`;
const newHtmlMap = `{displayEvents.length === 0 ? (\r
              <div style={{padding:"40px 20px",textAlign:"center"}}>\r
                <div style={{fontSize:13,fontWeight:600,color:"rgba(255,255,255,0.7)"}}>All caught up!</div>\r
              </div>\r
            ) : displayEvents.map((e,i) => (\r
              <div key={e.id} className="un-row" style={{borderBottom:"1px solid rgba(255,255,255,0.03)"}}>`;
repaired = repaired.replace(oldHtmlMap, newHtmlMap);

// 5. Update nav integration
repaired = repaired.replace(
  '{id:"gpa",       icon:<Calculator size={14}/>, label:"GPA"},\r\n    {id:"calendar",  icon:<Calendar size={14}/>,   label:"Calendar"},',
  '{id:"gpa",       icon:<Calculator size={14}/>, label:"GPA"},\r\n    {id:"calendar",  icon:<Calendar size={14}/>,  label:"Calendar"},\r\n    {id:"integrations", icon:<Layers size={14}/>,   label:"Integrations"},'
);

// 6. Update routes
repaired = repaired.replace(
  '{page==="importer"   && <ImporterPage setEvents={setEvents}/>}\r\n          {page==="screentime" && <ScreenTimePage/>}',
  '{page==="importer"   && <ImporterPage setEvents={setEvents}/>}\r\n          {page==="integrations" && <IntegrationsPage />}\r\n          {page==="screentime" && <ScreenTimePage/>}'
);

fs.writeFileSync('c:/Users/joshu/OneDrive/Desktop/Option/option-app/src/App.js', repaired);
console.log('App.js repaired!');
