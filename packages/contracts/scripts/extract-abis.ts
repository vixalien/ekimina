import { readFileSync, writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

const artifactsDir = resolve(root, "artifacts");
const outDir = resolve(root, "src/abi");

const contractArtifacts = [
  "contracts/Ikimina.sol/Ikimina.json",
  "contracts/Ikimina.sol/IkiminaFactory.json",
  "contracts/MockUSDm.sol/MockUSDm.json",
];

mkdirSync(outDir, { recursive: true });

for (const relPath of contractArtifacts) {
  const src = resolve(artifactsDir, relPath);
  const artifact = JSON.parse(readFileSync(src, "utf-8"));
  const out = resolve(outDir, relPath.split("/").pop()!.replace(".json", ".ts"));

  const content = `export default ${JSON.stringify(artifact.abi, null, 2)} as const;\n`;
  writeFileSync(out, content);
  console.log(`  ✓ ${relPath.split("/").pop()}`);
}

console.log(`\nABIs extracted to ${outDir}`);
