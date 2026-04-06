const fs = require('fs');
const path = 'c:/Users/joshu/OneDrive/Desktop/Option/option-app/src/App.js';
let content = fs.readFileSync(path, 'utf8');

const utilsCode = `

/* ── UTILS ─────────────────────────────────────────────────── */
function parseICal(text) {
  const events = [];
  const items = text.split("BEGIN:VEVENT");
  for (let i = 1; i < items.length; i++) {
    const it = items[i];
    const sum = it.match(/SUMMARY:(.*)/)?.[1]?.trim() || "Untitled Event";
    let start = it.match(/DTSTART;VALUE=DATE:(.*)/)?.[1] || it.match(/DTSTART:(.*)/)?.[1] || "";
    if (start) {
      start = start.replace(/T\\d+Z$/, "");
      const y = start.substring(0, 4), m = start.substring(4, 6), d = start.substring(6, 8);
      events.push({ name: sum, date: \`\${y}-\${m}-\${d}\`, priority: "med", subject: "" });
    }
  }
  return events;
}

function processAIScan(text) {
  const results = [];
  const lines = text.split("\\n");
  for (const line of lines) {
    if (!line.trim()) continue;
    const dateM = line.match(/(\\d{1,2}\\/\\d{1,2})|(\\d{4}-\\d{2}-\\d{2})/);
    const date = dateM ? (dateM[2] || \`2026-\${dateM[1].split('/')[0].padStart(2,'0')}-\${dateM[1].split('/')[1].padStart(2,'0')}\`) : "2026-04-02";
    let name = line.replace(/(\\d{1,2}\\/\\d{1,2})|(\\d{4}-\\d{2}-\\d{2})/, "").trim();
    name = name.replace(/^[-*•]\\s+/, "");
    if (name) results.push({ name, date, priority: "med", subject: "" });
  }
  return results;
}
`;

// Insert after the icon imports
const splitMatch = content.match(/import\s*{[^}]+}\s*from\s*["']lucide-react["'];/s);
if (splitMatch) {
  const insertPos = splitMatch.index + splitMatch[0].length;
  content = content.slice(0, insertPos) + utilsCode + content.slice(insertPos);
  fs.writeFileSync(path, content);
  console.log('Successfully injected parseICal and processAIScan');
} else {
  console.error('Could not find lucide-react import block');
  process.exit(1);
}
