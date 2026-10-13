import fs from 'fs';
import path from 'path';

const LOGS_DIR = "C:/Users/LENOVO/.gemini/antigravity/brain/7aa2c1e6-29c5-47a6-9feb-9c49364ac9c5/.system_generated/steps";
const PROJECT_DIR = "e:/AntiGravity Projects/access-map";

let targetUrl = "";

try {
    const fullPath = path.join(LOGS_DIR, "345/output.txt");
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    for (const screen of data.screens || []) {
        if (screen.title === "AccessMap Homepage - Tactile Style" || screen.name.includes("72b681d3c2bb4ceaa3b1d69652818b7c")) {
            targetUrl = screen.htmlCode.downloadUrl;
            break;
        }
    }
} catch (e) {
    console.log(`Failed to fetch home screen info: ${e.message}`);
}

function convertToJSX(html) {
    let jsx = html;
    let bodyClasses = "";
    const bodyTagMatch = jsx.match(/<body([^>]*)>/i);
    if (bodyTagMatch) {
       const classMatch = bodyTagMatch[1].match(/class="([^"]*)"/i);
       if (classMatch) bodyClasses = classMatch[1];
    }
    
    const bodyMatch = jsx.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
    if (bodyMatch) jsx = bodyMatch[1];

    jsx = jsx.replace(/class=/g, 'className=');
    jsx = jsx.replace(/for=/g, 'htmlFor=');
    
    jsx = jsx.replace(/<img([^>]*[^\/])>/gi, '<img$1 />');
    jsx = jsx.replace(/<input([^>]*[^\/])>/gi, '<input$1 />');
    jsx = jsx.replace(/<hr([^>]*[^\/])>/gi, '<hr$1 />');
    jsx = jsx.replace(/<br([^>]*[^\/])>/gi, '<br$1 />');
    
    jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

    jsx = jsx.replace(/style=""/g, '');
    jsx = jsx.replace(/style="font-variation-settings:\s*'FILL'\s*1;?"/g, "style={{ fontVariationSettings: \"'FILL' 1\" }}");
    jsx = jsx.replace(/style="([^"]*)"/g, "style={{ $1 }}");

    jsx = jsx.replace(/style={{([^}]*)}}/g, (match, inner) => {
        if (inner.includes("fontVariationSettings")) return match;
        return "";
    });

    return `<div className="${bodyClasses}">\n${jsx}\n</div>`;
}

let colorsDict = {};
function extractColors(html) {
    const match = html.match(/tailwind\.config\s*=\s*({[\s\S]*?});/);
    if (!match) return {};
    try {
        let configStr = match[1];
        configStr = configStr.replace(/([a-zA-Z0-9_-]+):/g, '"$1":').replace(/'/g, '"').replace(/,(\s*})/g, '$1');
        const config = JSON.parse(configStr);
        return config.theme?.extend?.colors || {};
    } catch(e) {
        return {};
    }
}

async function run() {
    if (!targetUrl) {
        console.error("Could not find Target URL for 'AccessMap Homepage - Tactile Style'");
        return;
    }
    
    console.log(`Downloading target screen...`);
    try {
        const res = await fetch(targetUrl, { signal: AbortSignal.timeout(10000) });
        const html = await res.text();
        
        const jsxContent = convertToJSX(html);
        
        let customStyles = "";
        const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
        if (styleMatch) {
            customStyles = styleMatch[1].replace(/\s+/g, ' ');
        }
        
        const componentStr = `import React from 'react';\nimport Link from 'next/link';\nimport Image from 'next/image';\n\nexport default function HomePage() {\n  return (\n    <>\n      <style dangerouslySetInnerHTML={{__html: \`${customStyles}\`}} />\n      ${jsxContent}\n    </>\n  );\n}\n`;
        
        const outPath = path.join(PROJECT_DIR, "app/page.tsx");
        fs.writeFileSync(outPath, componentStr);
        console.log(`Saved exact template to ${outPath}`);
        
        Object.assign(colorsDict, extractColors(html));
        
        const globalsPath = path.join(PROJECT_DIR, "app/globals.css");
        let globalsCss = fs.readFileSync(globalsPath, 'utf8');
        
        let themeStr = "\n@theme {\n";
        for (const [k, v] of Object.entries(colorsDict)) {
            themeStr += `  --color-${k}: ${v};\n`;
        }
        themeStr += "}\n";
        
        globalsCss += themeStr;
        fs.writeFileSync(globalsPath, globalsCss);
        console.log("Updated globals.css with exact template colors.");
        
    } catch(e) {
        console.error("Failed to process:", e.message);
    }
}

run();
