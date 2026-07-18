// Regenerates the PaidPrime favicon/app-icon set from the master logo.
// Source of truth: public/logo.png (1254x1254, solid brand-black background).
// Run with: node scripts/generate-icons.mjs
//
// Outputs (standard favicon-handbook set, see
// https://evilmartians.com/chronicles/how-to-favicon-in-2021-six-files-that-fit-most-needs):
//   app/favicon.ico        - 16/32/48 multi-res, universal fallback
//   app/icon.svg           - vector favicon for modern browsers
//   app/apple-icon.png     - 180x180, iOS/Safari home screen (no alpha)
//   public/icons/manifest-{192,512}.png            - PWA icons, purpose "any" (full-bleed)
//   public/icons/manifest-{192,512}-maskable.png   - PWA icons, purpose "maskable"
//     (logo scaled to ~65% and centered on a --bg-base canvas so Android's
//     adaptive-icon mask has a safe zone and doesn't clip the mark)

import { mkdir, copyFile, rm, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = path.resolve(import.meta.dirname, "..");
const sourcePng = path.join(root, "public/logo.png");
const sourceSvg = path.join(root, "public/logo.svg");
const tmpDir = path.join(root, ".icon-tmp");

async function main() {
  if (!existsSync(sourcePng)) throw new Error(`Missing source: ${sourcePng}`);
  await mkdir(tmpDir, { recursive: true });

  // Favicon.ico source sizes
  const icoSizes = [16, 32, 48];
  const icoFiles = await Promise.all(
    icoSizes.map(async (size) => {
      const file = path.join(tmpDir, `favicon-${size}.png`);
      await sharp(sourcePng).resize(size, size).png().toFile(file);
      return file;
    })
  );
  const icoBuffer = await pngToIco(icoFiles);
  await writeFile(path.join(root, "app/favicon.ico"), icoBuffer);
  console.log("wrote app/favicon.ico");

  // Vector favicon — copy the master SVG as-is (do not reinterpret the mark)
  await copyFile(sourceSvg, path.join(root, "app/icon.svg"));
  console.log("wrote app/icon.svg");

  // Apple touch icon — flattened, no transparency (Apple guidance)
  await sharp(sourcePng)
    .resize(180, 180)
    .flatten({ background: "#040405" })
    .png()
    .toFile(path.join(root, "app/apple-icon.png"));
  console.log("wrote app/apple-icon.png");

  // PWA manifest icons — full-bleed ("any") variant
  await mkdir(path.join(root, "public/icons"), { recursive: true });
  for (const size of [192, 512]) {
    await sharp(sourcePng)
      .resize(size, size)
      .png()
      .toFile(path.join(root, `public/icons/manifest-${size}.png`));
    console.log(`wrote public/icons/manifest-${size}.png`);
  }

  // PWA manifest icons — "maskable" variant, padded to a safe zone
  const BG = "#09090B"; // --bg-base
  for (const size of [192, 512]) {
    const inset = Math.round(size * 0.65);
    const logo = await sharp(sourcePng).resize(inset, inset).toBuffer();
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 3,
        background: BG,
      },
    })
      .composite([{ input: logo, gravity: "center" }])
      .png()
      .toFile(path.join(root, `public/icons/manifest-${size}-maskable.png`));
    console.log(`wrote public/icons/manifest-${size}-maskable.png`);
  }

  await rm(tmpDir, { recursive: true, force: true });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
