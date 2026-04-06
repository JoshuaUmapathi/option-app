const fs = require('fs');
const path = 'c:/Users/joshu/OneDrive/Desktop/Option/option-app/src/App.js';
let content = fs.readFileSync(path, 'utf8');

const iconsToAdd = ['Play', 'Pause', 'Square', 'Info'];

content = content.replace(/import\s*{([^}]+)}\s*from\s*["']lucide-react["'];/s, (match, icons) => {
  const existing = icons.split(',').map(s => s.trim()).filter(s => s);
  const combined = [...new Set([...existing, ...iconsToAdd])];
  return `import {
  ${combined.join(',\n  ')}
} from "lucide-react";`;
});

fs.writeFileSync(path, content);
console.log('Successfully updated lucide-react imports in App.js');
