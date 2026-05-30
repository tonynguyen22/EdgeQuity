import { rm } from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const dataRoot = path.resolve(root, "public/data/edgequity");

const targets = [
  "raw",
  "stocks",
  "stocks-raw-first",
  "sec",
  "manifest.json",
  "manifest.raw-first.json",
  "universe-500.json",
].map((target) => path.resolve(dataRoot, target));

function assertInsideDataRoot(target: string): void {
  const relative = path.relative(dataRoot, target);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new Error(`Refusing to remove path outside public/data/edgequity: ${target}`);
  }
}

async function main() {
  for (const target of targets) {
    assertInsideDataRoot(target);
    await rm(target, { recursive: true, force: true });
    console.log(`removed ${path.relative(root, target)}`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
