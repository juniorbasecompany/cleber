import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const sourceRoot = path.resolve(scriptDirectory, "../src");
const allowedExtensionSet = new Set([".js", ".jsx", ".ts", ".tsx"]);
const structuralPatternList = [
  { label: "rounded-[", regex: /rounded-\[/g },
  { label: "shadow-[", regex: /shadow-\[/g },
  { label: "border-[", regex: /border-\[/g },
  { label: "bg-[", regex: /bg-\[/g }
];

async function walk(directoryPath) {
  const entryList = await readdir(directoryPath, { withFileTypes: true });
  const resultList = [];

  for (const entry of entryList) {
    const entryPath = path.join(directoryPath, entry.name);

    if (entry.isDirectory()) {
      resultList.push(...(await walk(entryPath)));
      continue;
    }

    if (allowedExtensionSet.has(path.extname(entry.name))) {
      resultList.push(entryPath);
    }
  }

  return resultList;
}

function collectFindingList(filePath, source) {
  const lineList = source.split(/\r?\n/);
  const findingList = [];

  lineList.forEach((line, index) => {
    for (const pattern of structuralPatternList) {
      if (pattern.regex.test(line)) {
        findingList.push({
          filePath,
          lineNumber: index + 1,
          label: pattern.label,
          line: line.trim()
        });
      }
      pattern.regex.lastIndex = 0;
    }
  });

  return findingList;
}

async function main() {
  const filePathList = await walk(sourceRoot);
  const findingList = [];

  for (const filePath of filePathList) {
    const source = await readFile(filePath, "utf8");
    findingList.push(...collectFindingList(filePath, source));
  }

  if (findingList.length === 0) {
    console.log("Semantic UI check passed.");
    return;
  }

  console.error("Semantic UI check failed. Move structural styling into globals.css primitives/components.");

  for (const finding of findingList) {
    const relativePath = path.relative(path.resolve(scriptDirectory, ".."), finding.filePath);
    console.error(`- ${relativePath}:${finding.lineNumber} uses ${finding.label}`);
    console.error(`  ${finding.line}`);
  }

  process.exitCode = 1;
}

await main();
