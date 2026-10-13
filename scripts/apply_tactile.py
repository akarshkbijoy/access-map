import json
import urllib.request
import os
import re

LOGS_DIR = r"C:\Users\LENOVO\.gemini\antigravity\brain\7aa2c1e6-29c5-47a6-9feb-9c49364ac9c5\.system_generated\steps"
PROJECT_DIR = r"e:\AntiGravity Projects\access-map"

mapping = {
    "334/output.txt": "add/page.tsx",
    "335/output.txt": "location/page.tsx",
    "339/output.txt": "admin/page.tsx",
    "340/output.txt": "profile/page.tsx",
    "341/output.txt": "about/page.tsx"
}

screens_to_download = []

def extract_url_from_components(data):
    for comp in data.get("outputComponents", []):
        if "design" in comp and "screens" in comp["design"]:
            for screen in comp["design"]["screens"]:
                if "htmlCode" in screen and "downloadUrl" in screen["htmlCode"]:
                    return screen["htmlCode"]["downloadUrl"]
    return None

# Fetch new 5 screens
for log_file, tsx_path in mapping.items():
    try:
        path = os.path.join(LOGS_DIR, log_file)
        with open(path, "r", encoding="utf-8") as f:
            data = json.load(f)
            url = extract_url_from_components(data)
            if url:
                screens_to_download.append((url, tsx_path, True))
            else:
                print(f"URL not found in {log_file}")
    except Exception as e:
        print(f"Failed to read {log_file}: {e}")

# Fetch edited Home Screen
try:
    path = os.path.join(LOGS_DIR, r"345\output.txt")
    with open(path, "r", encoding="utf-8") as f:
        data = json.load(f)
        for screen in data["screens"]:
            if screen["name"].endswith("1e20e4e0a3d8471280ddc42aa8f0f110"):
                url = screen["htmlCode"]["downloadUrl"]
                screens_to_download.append((url, "page.tsx", False))
                break
except Exception as e:
    print(f"Failed to fetch home screen info: {e}")

def convert_to_jsx(html):
    # Extract body content
    body_match = re.search(r'<body[^>]*>([\s\S]*?)</body>', html, re.IGNORECASE)
    body_classes = ""
    body_tag_match = re.search(r'<body([^>]*)>', html, re.IGNORECASE)
    if body_tag_match:
        class_match = re.search(r'class="([^"]*)"', body_tag_match.group(1))
        if class_match:
            body_classes = class_match.group(1)
            
    jsx = body_match.group(1) if body_match else html

    # Replace class with className
    jsx = jsx.replace('class=', 'className=')
    jsx = jsx.replace('for=', 'htmlFor=')
    
    # Close tags
    jsx = re.sub(r'<img([^>]*[^\/])>', r'<img\1 />', jsx)
    jsx = re.sub(r'<input([^>]*[^\/])>', r'<input\1 />', jsx)
    jsx = re.sub(r'<hr([^>]*[^\/])>', r'<hr\1 />', jsx)
    jsx = re.sub(r'<br([^>]*[^\/])>', r'<br\1 />', jsx)
    
    # HTML comments -> JSX comments
    jsx = re.sub(r'<!--([\s\S]*?)-->', r'{/*\1*/}', jsx)

    # Convert style strings to objects properly
    jsx = jsx.replace('style=""', '')
    jsx = re.sub(r'style="font-variation-settings:\s*\'FILL\'\s*1;?"', 'style={{ fontVariationSettings: "\\\'FILL\\\' 1" }}', jsx)
    
    # Clean any other problematic unclosed styles
    jsx = re.sub(r'style="([^"]*)"', r'style={{ \1 }}', jsx)
    # The last regex might be unsafe if it hits real style strings, but in our design it's mostly font-variation-settings.
    # To be safer:
    jsx = jsx.replace('style={{  }}', '')

    return f'<div className="{body_classes}">\n{jsx}\n</div>'

colors_dict = {}

def extract_colors(html):
    match = re.search(r'tailwind\.config\s*=\s*({[\s\S]*?});', html)
    if match:
        config_str = match.group(1)
        config_str = re.sub(r'([a-zA-Z0-9_-]+):', r'"\1":', config_str)
        config_str = config_str.replace("'", '"')
        config_str = re.sub(r',(\s*})', r'\1', config_str)
        try:
            config = json.loads(config_str)
            return config.get("theme", {}).get("extend", {}).get("colors", {})
        except json.JSONDecodeError as e:
            color_matches = re.finditer(r'"([a-zA-Z0-9_-]+)"\s*:\s*"([^"]+)"', config_str)
            colors = {}
            for m in color_matches:
                colors[m.group(1)] = m.group(2)
            return colors
    return {}

for url, tsx_path, is_subpage in screens_to_download:
    print(f"Downloading {tsx_path}...")
    req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
    html = urllib.request.urlopen(req).read().decode('utf-8')
    
    jsx_content = convert_to_jsx(html)
    
    # Extract Custom Styles
    custom_styles = ""
    style_match = re.search(r'<style>([\s\S]*?)</style>', html, re.IGNORECASE)
    if style_match:
        custom_styles = re.sub(r'\s+', ' ', style_match.group(1))
        
    component_name = "HomePage" if tsx_path == "page.tsx" else tsx_path.split('/')[0].capitalize() + "Page"
    
    component_str = f"""import React from 'react';\nimport Link from 'next/link';\nimport Image from 'next/image';\n\nexport default function {component_name}() {{\n  return (\n    <>\n      <style dangerouslySetInnerHTML={{{{__html: `{custom_styles}`}}}} />\n      {jsx_content}\n    </>\n  );\n}}\n"""
    
    out_path = os.path.join(PROJECT_DIR, "app", tsx_path)
    os.makedirs(os.path.dirname(out_path), exist_ok=True)
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(component_str)
        
    print(f"Saved {out_path}")
    
    # Store colors
    colors_dict.update(extract_colors(html))

# Write to globals.css
globals_path = os.path.join(PROJECT_DIR, "app", "globals.css")
with open(globals_path, "r", encoding="utf-8") as f:
    globals_css = f.read()

# Append to globals css
theme_str = "\n@theme {\n"
for k, v in colors_dict.items():
    theme_str += f"  --color-{k}: {v};\n"
theme_str += "}\n"

globals_css += theme_str

with open(globals_path, "w", encoding="utf-8") as f:
    f.write(globals_css)
    
print("Updated globals.css")
