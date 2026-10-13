import fs from 'fs';
import path from 'path';

function convertToJSX(html) {
    let jsx = html;
    // Extract body content carefully
    const bodyMatch = jsx.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    let bodyClasses = "";
    const bodyTagMatch = jsx.match(/<body([^>]*)>/i);
    if (bodyTagMatch) {
       const classMatch = bodyTagMatch[1].match(/class="([^"]*)"/);
       if (classMatch) bodyClasses = classMatch[1];
    }
    
    if (bodyMatch) {
        jsx = bodyMatch[1];
    }

    // Basic HTML to JSX conversions
    jsx = jsx.replace(/class=/g, 'className=');
    jsx = jsx.replace(/for=/g, 'htmlFor=');
    
    // Close unclosed tags
    jsx = jsx.replace(/<img([^>]*[^\/])>/g, '<img$1 />');
    jsx = jsx.replace(/<input([^>]*[^\/])>/g, '<input$1 />');
    jsx = jsx.replace(/<hr([^>]*[^\/])>/g, '<hr$1 />');
    jsx = jsx.replace(/<br([^>]*[^\/])>/g, '<br$1 />');
    
    // Replace HTML comments
    jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

    return `<div className="${bodyClasses}">\n${jsx}\n</div>`;
}

const files = ['home', 'add', 'location', 'admin', 'about'];
files.forEach(name => {
    const htmlPath = `e:/AntiGravity Projects/access-map/tmp-designs/${name}.html`;
    if (!fs.existsSync(htmlPath)) return;
    
    const html = fs.readFileSync(htmlPath, 'utf-8');
    const jsxContent = convertToJSX(html);
    
    // Extract custom styles
    let customStyles = "";
    const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
    if (styleMatch) {
        customStyles = styleMatch[1].replace(/\s+/g, ' '); // simple minify
    }

    const componentStr = `
import React from 'react';
import Link from 'next/link';
import Image from 'next/image';

export default function ${name.charAt(0).toUpperCase() + name.slice(1)}Page() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: \`${customStyles}\`}} />
      ${jsxContent}
    </>
  );
}
`;
    
    const outPath = name === 'home' 
        ? 'e:/AntiGravity Projects/access-map/app/page.tsx' 
        : `e:/AntiGravity Projects/access-map/app/${name}/page.tsx`;
    
    const dir = path.dirname(outPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    
    fs.writeFileSync(outPath, componentStr);
    console.log(`Converted ${name} to ${outPath}`);
});

// Extract tailwind colors from home.html and about.html for globals.css
const homeHtml = fs.readFileSync('e:/AntiGravity Projects/access-map/tmp-designs/home.html', 'utf-8');
const aboutHtml = fs.readFileSync('e:/AntiGravity Projects/access-map/tmp-designs/about.html', 'utf-8');

function extractColors(html) {
    const scriptMatch = html.match(/tailwind\.config\s*=\s*({[\s\S]*?});/);
    if (!scriptMatch) return {};
    try {
        // Very hacky JSON parse of the JS object
        const configStr = scriptMatch[1]
            .replace(/([a-zA-Z0-9_-]+):/g, '"$1":')
            .replace(/'/g, '"')
            .replace(/,(\s*})/g, '$1');
        const config = JSON.parse(configStr);
        return config.theme.extend.colors || {};
    } catch(e) {
        console.error("Failed to parse tailwind config", e);
        return {};
    }
}

const homeColors = extractColors(homeHtml);
const aboutColors = extractColors(aboutHtml);

let themeCss = "\n\n@theme {\n";
// Add colors as CSS vars
Object.entries(homeColors).forEach(([key, val]) => {
    themeCss += `  --color-${key}: ${val};\n`;
});
// Let aboutColors override or supplement
Object.entries(aboutColors).forEach(([key, val]) => {
    themeCss += `  --color-${key}: ${val};\n`;
});
themeCss += "}\n";

let globalsPath = 'e:/AntiGravity Projects/access-map/app/globals.css';
let globalsCss = fs.readFileSync(globalsPath, 'utf-8');
globalsCss += themeCss;
fs.writeFileSync(globalsPath, globalsCss);
console.log('Updated globals.css with extracted tailwind colors.');
