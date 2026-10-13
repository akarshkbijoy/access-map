import fs from 'fs';
import path from 'path';

const LOGS_DIR = "C:/Users/LENOVO/.gemini/antigravity/brain/7aa2c1e6-29c5-47a6-9feb-9c49364ac9c5/.system_generated/steps";
const PROJECT_DIR = "e:/AntiGravity Projects/access-map";

const mapping = {
    "334/output.txt": "add/page.tsx",
    "335/output.txt": "location/page.tsx",
    "339/output.txt": "admin/page.tsx",
    "340/output.txt": "profile/page.tsx",
    "341/output.txt": "about/page.tsx"
};

const screensToDownload = [];

function extractUrl(data) {
    for (const comp of data.outputComponents || []) {
        if (comp.design && comp.design.screens) {
            for (const screen of comp.design.screens) {
                if (screen.htmlCode && screen.htmlCode.downloadUrl) {
                    return screen.htmlCode.downloadUrl;
                }
            }
        }
    }
    return null;
}

// Fetch new 5 screens
for (const [logFile, tsxPath] of Object.entries(mapping)) {
    try {
        const fullPath = path.join(LOGS_DIR, logFile);
        const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
        const url = extractUrl(data);
        if (url) {
            screensToDownload.push({ url, tsxPath });
        } else {
            console.log(`URL not found in ${logFile}`);
        }
    } catch (e) {
        console.log(`Failed to read ${logFile}: ${e.message}`);
    }
}

// Fetch Home Screen
try {
    const fullPath = path.join(LOGS_DIR, "345/output.txt");
    const data = JSON.parse(fs.readFileSync(fullPath, 'utf8'));
    for (const screen of data.screens || []) {
        if (screen.name.endsWith("1e20e4e0a3d8471280ddc42aa8f0f110")) {
            screensToDownload.push({ url: screen.htmlCode.downloadUrl, tsxPath: "page.tsx" });
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
    
    // Close tags
    jsx = jsx.replace(/<img([^>]*[^\/])>/gi, '<img$1 />');
    jsx = jsx.replace(/<input([^>]*[^\/])>/gi, '<input$1 />');
    jsx = jsx.replace(/<hr([^>]*[^\/])>/gi, '<hr$1 />');
    jsx = jsx.replace(/<br([^>]*[^\/])>/gi, '<br$1 />');
    
    // HTML comments
    jsx = jsx.replace(/<!--([\s\S]*?)-->/g, '{/*$1*/}');

    // Style cleanup
    jsx = jsx.replace(/style=""/g, '');
    jsx = jsx.replace(/style="font-variation-settings:\s*'FILL'\s*1;?"/g, "style={{ fontVariationSettings: \"'FILL' 1\" }}");
    jsx = jsx.replace(/style="([^"]*)"/g, "style={{ $1 }}");

    // Remove any leftover invalid inline styles like style={{ font-variation-settings:... }} which isn't valid React
    // But earlier I specifically replaced the FILL 1 variation correctly. For others we strip them to avoid Next.js build errors.
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
    for (const item of screensToDownload) {
        console.log(`Downloading ${item.tsxPath}...`);
        try {
            const res = await fetch(item.url, { signal: AbortSignal.timeout(10000) });
            const html = await res.text();
            
            const jsxContent = convertToJSX(html);
            
            let customStyles = "";
            const styleMatch = html.match(/<style>([\s\S]*?)<\/style>/i);
            if (styleMatch) {
                customStyles = styleMatch[1].replace(/\s+/g, ' ');
            }
            
            let compName = "HomePage";
            if (item.tsxPath !== "page.tsx") {
                const base = item.tsxPath.split('/')[0];
                compName = base.charAt(0).toUpperCase() + base.slice(1) + "Page";
            }
            
            const componentStr = `import React from 'react';\nimport Link from 'next/link';\nimport Image from 'next/image';\n\nexport default function ${compName}() {\n  return (\n    <>\n      <style dangerouslySetInnerHTML={{__html: \`${customStyles}\`}} />\n      ${jsxContent}\n    </>\n  );\n}\n`;
            
            const outPath = path.join(PROJECT_DIR, "app", item.tsxPath);
            fs.mkdirSync(path.dirname(outPath), { recursive: true });
            fs.writeFileSync(outPath, componentStr);
            console.log(`Saved ${outPath}`);
            
            Object.assign(colorsDict, extractColors(html));
        } catch(e) {
            console.error(`Failed to process ${item.tsxPath}:`, e.message);
        }
    }

    const globalsPath = path.join(PROJECT_DIR, "app/globals.css");
    let globalsCss = fs.readFileSync(globalsPath, 'utf8');
    
    let themeStr = "\n@theme {\n";
    for (const [k, v] of Object.entries(colorsDict)) {
        themeStr += `  --color-${k}: ${v};\n`;
    }
    themeStr += "}\n";
    
    globalsCss += themeStr;
    fs.writeFileSync(globalsPath, globalsCss);
    console.log("Updated globals.css");
}

run();
