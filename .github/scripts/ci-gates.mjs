import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { resolve } from "node:path";

const packages = ["backend", "frontend"];
const coverageMetrics = ["lines", "statements", "functions", "branches"];

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function isTestPath(filePath) {
  const normalized = filePath.replaceAll("\\", "/");
  return (
    /\.test\.(ts|tsx|js|jsx)$/.test(normalized) ||
    /(^|\/)test\//.test(normalized) ||
    /(^|\/)__tests__\//.test(normalized)
  );
}

function isExcludedFromSizeGate(filePath) {
  const normalized = filePath.replaceAll("\\", "/");
  return isTestPath(normalized) || normalized.startsWith(".github/");
}

function runGit(args) {
  const result = spawnSync("git", args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`git ${args.join(" ")} failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

function enforcePrSize() {
  const max = Number(argumentValue("--max") ?? 300);
  const base = argumentValue("--base");
  const head = argumentValue("--head");
  if (!base || !head) {
    throw new Error("pr-size requires --base and --head");
  }

  const output = runGit(["diff", "--numstat", `${base}...${head}`]);
  let additions = 0;
  const counted = [];
  const skipped = [];

  for (const line of output.split("\n")) {
    if (!line.trim()) {
      continue;
    }
    const [addedRaw, , ...pathParts] = line.split("\t");
    const filePath = pathParts.join("\t");
    if (addedRaw === "-" || !filePath) {
      continue;
    }
    const added = Number(addedRaw);
    if (Number.isNaN(added)) {
      continue;
    }
    if (isExcludedFromSizeGate(filePath)) {
      skipped.push({ filePath, added });
      continue;
    }
    additions += added;
    counted.push({ filePath, added });
  }

  const report = [
    "# PR size gate",
    "",
    `Base \`${base}\` → head \`${head}\``,
    "",
    `- Linhas adicionadas (sem testes): **${additions}**`,
    `- Limite: **${max}**`,
    `- Arquivos contados: ${counted.length}`,
    `- Arquivos de teste / .github ignorados: ${skipped.length}`,
    "",
    additions > max
      ? `FAIL — o PR adiciona ${additions} linhas fora de testes (limite ${max}).`
      : `PASS — tamanho dentro do limite.`,
    "",
  ].join("\n");

  process.stdout.write(report);
  if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, report, { flag: "a" });
  }
  process.exitCode = additions > max ? 1 : 0;
}

function readJson(path) {
  return JSON.parse(readFileSync(resolve(path), "utf8"));
}

function compareTests() {
  const basePath = argumentValue("--base-json");
  const headPath = argumentValue("--head-json");
  if (!basePath || !headPath) {
    throw new Error("compare-tests requires --base-json and --head-json");
  }

  const base = readJson(basePath);
  const head = readJson(headPath);
  const findings = [];
  const rows = ["# Comparação de testes", "", "| Pacote | Base | PR | Δ |", "| --- | ---: | ---: | ---: |"];

  for (const packageName of packages) {
    const before = Number(base[packageName]?.total ?? 0);
    const after = Number(head[packageName]?.total ?? 0);
    const delta = after - before;
    rows.push(`| ${packageName} | ${before} | ${after} | ${delta >= 0 ? "+" : ""}${delta} |`);
    if (after < before) {
      findings.push(
        `${packageName}: quantidade de testes caiu de ${before} para ${after}.`,
      );
    }
  }

  rows.push("", findings.length === 0 ? "PASS — nenhum pacote perdeu testes." : `FAIL — ${findings.join(" ")}`, "");
  const report = rows.join("\n");
  process.stdout.write(report);
  if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, report, { flag: "a" });
  }
  process.exitCode = findings.length === 0 ? 0 : 1;
}

function formatPct(value) {
  return `${Number(value ?? 0).toFixed(1)}%`;
}

function coverageSummary() {
  const rows = ["# Cobertura (PR)", "", "| Pacote | lines | statements | functions | branches |", "| --- | ---: | ---: | ---: | ---: |"];

  for (const packageName of packages) {
    const summaryPath = resolve(packageName, "coverage", "coverage-summary.json");
    if (!existsSync(summaryPath)) {
      rows.push(`| ${packageName} | indisponível | — | — | — |`);
      continue;
    }
    const total = readJson(summaryPath).total ?? {};
    rows.push(
      `| ${packageName} | ${coverageMetrics.map((metric) => formatPct(total[metric]?.pct)).join(" | ")} |`,
    );
  }

  rows.push("");
  const report = rows.join("\n");
  process.stdout.write(report);
  if (process.env.GITHUB_STEP_SUMMARY) {
    writeFileSync(process.env.GITHUB_STEP_SUMMARY, report, { flag: "a" });
  }
}

function parseTestCounts(output) {
  const readCount = (label) => Number(output.match(new RegExp(`# ${label} (\\d+)`))?.[1] ?? 0);
  return {
    total: readCount("tests"),
    passed: readCount("pass"),
    failed: readCount("fail"),
    skipped: readCount("skipped"),
  };
}

function collectTestCounts() {
  const outputPath = argumentValue("--output");
  if (!outputPath) {
    throw new Error("collect-tests requires --output");
  }

  const results = {};
  for (const packageName of packages) {
    const command = process.platform === "win32" ? "npm.cmd" : "npm";
    const result = spawnSync(command, ["test"], {
      cwd: resolve(packageName),
      encoding: "utf8",
      env: { ...process.env, NODE_ENV: "test" },
      shell: false,
    });
    const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
    results[packageName] = {
      ...parseTestCounts(output),
      status: result.status ?? 1,
    };
    if ((result.status ?? 1) !== 0) {
      process.stderr.write(`Testes falharam em ${packageName}:\n${output}\n`);
      process.exitCode = 1;
    }
  }

  writeFileSync(resolve(outputPath), JSON.stringify(results, null, 2));
  if (process.exitCode === 1) {
    return;
  }
  process.exitCode = 0;
}

function parseTestsFromLogs() {
  const outputPath = argumentValue("--output");
  if (!outputPath) {
    throw new Error("parse-tests requires --output");
  }

  const results = {};
  for (const packageName of packages) {
    const logPath = argumentValue(`--${packageName}-log`);
    if (!logPath || !existsSync(resolve(logPath))) {
      throw new Error(`parse-tests requires --${packageName}-log pointing to an existing file`);
    }
    const output = readFileSync(resolve(logPath), "utf8");
    results[packageName] = parseTestCounts(output);
  }

  writeFileSync(resolve(outputPath), JSON.stringify(results, null, 2));
}

const command = process.argv[2];
switch (command) {
  case "pr-size":
    enforcePrSize();
    break;
  case "compare-tests":
    compareTests();
    break;
  case "coverage-summary":
    coverageSummary();
    break;
  case "collect-tests":
    collectTestCounts();
    break;
  case "parse-tests":
    parseTestsFromLogs();
    break;
  default:
    throw new Error(
      "Usage: ci-gates.mjs <pr-size|compare-tests|coverage-summary|collect-tests|parse-tests> ...",
    );
}
