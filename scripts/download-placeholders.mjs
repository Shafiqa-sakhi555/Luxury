import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const outDir = path.join(root, "public", "images", "placeholders");

const urls = [
  "https://images.unsplash.com/photo-1609599006353-e629aaabfeae?w=800&q=80",
  "https://images.unsplash.com/photo-1600166898405-da9535204843?w=800&q=80",
  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1920&q=80",
  "https://images.unsplash.com/photo-1615874959470-dfccc655caeb?w=800&q=80",
  "https://images.unsplash.com/photo-1615971677493-3d975081ea2f?w=800&q=80",
  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800&q=80",
  "https://images.unsplash.com/photo-1506439773649-6e0eb8cfb237?w=800&q=80",
  "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800&q=80",
  "https://images.unsplash.com/photo-1617806118233-18e1de247200?w=800&q=80",
  "https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800&q=80",
  "https://images.unsplash.com/photo-1584100936595-c0654b55a2d2?w=800&q=80",
  "https://images.unsplash.com/photo-1616046229476-9481a218f8b8?w=800&q=80",
  "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=800&q=80",
  "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?w=800&q=80",
  "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  "https://images.unsplash.com/photo-1519681393784-d120267933ba?w=800&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?w=800&q=80",
  "https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=800&q=80",
  "https://images.unsplash.com/photo-1493663284031-b7e3aefcae8e?w=800&q=80",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=800&q=80",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
  "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&q=80",
  "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&q=80",
  "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&q=80",
];

function photoId(url) {
  const match = url.match(/photo-([^?]+)/);
  if (!match) throw new Error(`Invalid Unsplash URL: ${url}`);
  return match[1];
}

async function download(url, dest, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeout);
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(dest, buffer);
      return;
    } catch (error) {
      if (attempt === retries) throw error;
      await new Promise((resolve) => setTimeout(resolve, 2000 * attempt));
    }
  }
}

fs.mkdirSync(outDir, { recursive: true });

let downloaded = 0;
let skipped = 0;
let failed = 0;

for (const url of urls) {
  const id = photoId(url);
  const dest = path.join(outDir, `${id}.jpg`);
  if (fs.existsSync(dest)) {
    skipped++;
    continue;
  }
  try {
    process.stdout.write(`Downloading ${id}... `);
    await download(url, dest);
    downloaded++;
    process.stdout.write("ok\n");
  } catch (error) {
    failed++;
    process.stdout.write(`failed (${error.message})\n`);
  }
}

console.log(`Done: ${downloaded} downloaded, ${skipped} skipped, ${failed} failed.`);
