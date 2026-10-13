import fs from 'fs';

let html = fs.readFileSync('app/page.tsx', 'utf8');

// Match the tailwind config object
const match = html.match(/(?:tailwind\.config\s*=\s*)?({[\s\S]*?theme:\s*{[\s\S]*?extend:\s*{[\s\S]*?colors:\s*{[\s\S]*?}}[\s\S]*?})/);
let colors = {};

if (match) {
    try {
        let cStr = match[1].replace(/([a-zA-Z0-9_-]+):/g, '"$1":').replace(/'/g, '"').replace(/,(\s*})/g, '$1');
        colors = JSON.parse(cStr).theme.extend.colors;
    } catch(e) {
        console.error("JSON parse failed");
    }
}

if (Object.keys(colors).length === 0) {
    const cmatch = html.matchAll(/"([a-zA-Z0-9_]+)"\s*:\s*"(#?[0-9a-fA-F]+)"/g);
    for (const m of cmatch) {
        colors[m[1]] = m[2];
    }
}

let css = `@import "tailwindcss";

@theme {
  --font-sans: var(--font-plus-jakarta), ui-sans-serif, system-ui, sans-serif;
  --font-serif: var(--font-instrument-serif), ui-serif, Georgia, serif;
  --font-script: var(--font-parisienne), cursive;
  
  --font-plus-jakarta: 'Plus Jakarta Sans', sans-serif;
  --font-headline: 'Plus Jakarta Sans', sans-serif;
  --font-body: 'Plus Jakarta Sans', sans-serif;
  --font-label: 'Plus Jakarta Sans', sans-serif;
`;

for (let [k, v] of Object.entries(colors)) {
    if (k === 'background' || k === 'foreground') continue;
    let key = k.replace(/_/g, '-');
    css += `  --color-${key}: ${v};\n`;
}

css += `}

:root {
  --background: #fef6e7;
  --foreground: #322e25;
}

@media (prefers-color-scheme: dark) {
  :root {
    --background: #110e06;
    --foreground: #fef6e7;
  }
}

body {
  background: var(--background);
  color: var(--foreground);
  font-family: var(--font-sans), Arial, Helvetica, sans-serif;
}
`;

fs.writeFileSync('app/globals.css', css);
console.log('Successfully updated globals.css');
