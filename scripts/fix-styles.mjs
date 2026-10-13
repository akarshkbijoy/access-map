import fs from 'fs';

const files = ['page', 'add/page', 'location/page', 'admin/page', 'about/page'];
files.forEach(f => {
  const p = `e:/AntiGravity Projects/access-map/app/${f}.tsx`;
  if (fs.existsSync(p)) {
    let c = fs.readFileSync(p, 'utf-8');
    c = c.replace(/style=""/g, '');
    c = c.replace(/style="font-variation-settings:\s*'FILL'\s*1(?:;)?"/g, "style={{ fontVariationSettings: \"'FILL' 1\" }}");
    fs.writeFileSync(p, c);
    console.log("Fixed", p);
  }
});
