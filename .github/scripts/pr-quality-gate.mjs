#!/usr/bin/env node
/**
 * Gates simples para PRs:
 * - barra se o PR adiciona mais de MAX_ADDED_LINES linhas (testes e .md excluídos)
 * - barra se a quantidade de testes (chamadas test/it) diminuiu vs a base
 * - reporta cobertura se coverage-summary.json existir
 */
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const MAX_ADDED_LINES = 300;
const root = process.cwd();
const baseSha = process.env.BASE_SHA;
const headSha = process.env.HEAD_SHA ?? "HEAD";

if (!baseSha) {
  console.error("BASE_SHA é obrigatório.");
  process.exit(1);
}

function runGit(args, { allowFailure = false } = {}) {
  const result = spawnSync("git", args, {
    cwd: root,
    encoding: "utf8",
    shell: false,
  });
  if (result.status !== 0 && !allowFailure) {
    throw new Error(`git ${args.join(" ")} falhou:\n${result.stderr || result.stdout}`);
  }
  return (result.stdout ?? "").trim();
}

function isTestPath(filePath) {
  const normalized = filePath.replaceAll("\\", "/");
  if (/(^|\/)(__tests__|tests?)(\/|$)/i.test(normalized)) {
    return true;
  }
  return /\.(test|spec)\.[cm]?[jt]sx?$/i.test(normalized);
}

function isMarkdownPath(filePath) {
  return /\.md$/i.test(filePath.replaceAll("\\", "/"));
}

function isExcludedFromSizeGate(filePath) {
  // Testes e Markdown ficam de fora do limite de 300 linhas.
  return isTestPath(filePath) || isMarkdownPath(filePath);
}

function countAddedNonTestLines() {
  const output = runGit(["diff", "--numstat", `${baseSha}...${headSha}`]);
  if (!output) {
    return { added: 0, files: [] };
  }

  let added = 0;
  const files = [];
  for (const line of output.split("\n")) {
    if (!line.trim()) {
      continue;
    }
    const [addedRaw, , ...pathParts] = line.split("\t");
    const filePath = pathParts.join("\t");
    if (addedRaw === "-" || !filePath || isExcludedFromSizeGate(filePath)) {
      continue;
    }
    const fileAdded = Number(addedRaw);
    if (Number.isNaN(fileAdded)) {
      continue;
    }
    added += fileAdded;
    if (fileAdded > 0) {
      files.push({ filePath, added: fileAdded });
    }
  }

  return { added, files };
}

function countTestsAt(ref) {
  // git grep retorna exit 1 quando não há match
  const output = runGit(
    [
      "grep",
      "-E",
      String.raw`^\s*(test|it)\s*\(`,
      ref,
      "--",
      "*.test.ts",
      "*.test.tsx",
      "*.test.js",
      "*.test.jsx",
      "*.spec.ts",
      "*.spec.tsx",
    ],
    { allowFailure: true },
  );

  if (!output) {
    return 0;
  }

  return output.split("\n").filter(Boolean).length;
}

function readCoverage(packageName) {
  const summaryPath = join(root, packageName, "coverage", "coverage-summary.json");
  if (!existsSync(summaryPath)) {
    return undefined;
  }
  const summary = JSON.parse(readFileSync(summaryPath, "utf8"));
  const total = summary.total;
  if (!total) {
    return undefined;
  }
  return {
    lines: Number(total.lines?.pct ?? 0),
    statements: Number(total.statements?.pct ?? 0),
    functions: Number(total.functions?.pct ?? 0),
    branches: Number(total.branches?.pct ?? 0),
  };
}

function formatPct(value) {
  return `${value.toFixed(1)}%`;
}

const size = countAddedNonTestLines();
const baseTests = countTestsAt(baseSha);
const headTests = countTestsAt(headSha);
const backendCoverage = readCoverage("backend");
const frontendCoverage = readCoverage("frontend");

const lines = [
  "## PR quality gate",
  "",
  `| Métrica | Base | PR |`,
  `| --- | ---: | ---: |`,
  `| Testes (test/it) | ${baseTests} | ${headTests} |`,
  `| Linhas adicionadas (sem testes/md) | — | ${size.added} / ${MAX_ADDED_LINES} |`,
];

if (backendCoverage) {
  lines.push(
    `| Cobertura backend (lines) | — | ${formatPct(backendCoverage.lines)} |`,
  );
}
if (frontendCoverage) {
  lines.push(
    `| Cobertura frontend (lines) | — | ${formatPct(frontendCoverage.lines)} |`,
  );
}

lines.push("");

if (size.files.length > 0) {
  lines.push("<details><summary>Arquivos que contam no tamanho</summary>", "");
  for (const file of size.files.sort((a, b) => b.added - a.added).slice(0, 30)) {
    lines.push(`- \`${file.filePath}\`: +${file.added}`);
  }
  lines.push("", "</details>", "");
}

const findings = [];

if (size.added > MAX_ADDED_LINES) {
  findings.push(
    `PR com ${size.added} linhas adicionadas fora de testes/Markdown (limite ${MAX_ADDED_LINES}).`,
  );
}

if (headTests < baseTests) {
  findings.push(
    `Quantidade de testes caiu: ${baseTests} → ${headTests} (−${baseTests - headTests}).`,
  );
}

if (findings.length > 0) {
  lines.push("### Reprovado", "");
  for (const finding of findings) {
    lines.push(`- ${finding}`);
  }
} else {
  lines.push("### Aprovado", "");
  lines.push("- Tamanho do PR e quantidade de testes dentro da política.");
}

const report = `${lines.join("\n")}\n`;
process.stdout.write(report);

if (process.env.GITHUB_STEP_SUMMARY) {
  appendFileSync(process.env.GITHUB_STEP_SUMMARY, report);
}

if (findings.length > 0) {
  process.exit(1);
}
