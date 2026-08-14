import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { basename, extname, join, resolve } from "node:path";
import sharp from "sharp";

const inputDirectory = resolve(process.cwd(), "public/images");
const outputDirectory = resolve(process.cwd(), "public/_astro/media");
const manifestPath = resolve(process.cwd(), "src/data/responsive-images.generated.json");
const targetWidths = [320, 640, 960, 1280];
await rm(outputDirectory, { recursive: true, force: true });
await mkdir(outputDirectory, { recursive: true });

const files = (await readdir(inputDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && [".jpg", ".jpeg", ".png", ".webp"].includes(extname(entry.name).toLowerCase()));

let generated = 0;
const manifest = {};
for (const file of files) {
  const input = join(inputDirectory, file.name);
  const sourceBytes = await readFile(input);
  const contentHash = createHash("sha256").update(sourceBytes).digest("hex").slice(0, 10);
  const metadata = await sharp(input).metadata();
  const stem = basename(file.name, extname(file.name));
  const variants = [];
  for (const width of targetWidths.filter((candidate) => candidate < (metadata.width || 0))) {
    const outputName = `${stem}-${contentHash}-${width}.webp`;
    await sharp(input)
      .rotate()
      .resize({ width, withoutEnlargement: true })
      .webp({ quality: 78, effort: 5, smartSubsample: true })
      .toFile(join(outputDirectory, outputName));
    variants.push({ width, src: `/_astro/media/${outputName}` });
    generated += 1;
  }
  manifest[`/images/${file.name}`] = { width: metadata.width, height: metadata.height, variants };
}

await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
console.log(`Generated ${generated} responsive WebP assets in ${outputDirectory}`);
