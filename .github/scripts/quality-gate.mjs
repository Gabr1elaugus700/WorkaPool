import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { delimiter, dirname, extname, join, relative, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const packageDefinitions = [
  {
    name: "backend",
    sourceDirectory: "src",
    testDirectory: "test",
    typecheckProject: "tsconfig.json",
  },
  {
    name: "frontend",
    sourceDirectory: "src",
    testDirectory: "src",
    typecheckProject: "tsconfig.app.json",
  },
];
const coverageMetrics = ["lines", "statements", "functions", "branches"];

function argumentValue(name) {
  const index = process.argv.indexOf(name);
  return index === -1 ? undefined : process.argv[index + 1];
}

function collectTestFiles(directory) {
  if (!existsSync(directory)) {
    return [];
  }

  const files = [];
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const entryPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      files.push(...collectTestFiles(entryPath));
      continue;
    }

    if (entry.isFile() && [".ts", ".tsx"].includes(extname(entry.name)) && entry.name.includes(".test.")) {
      files.push(entryPath);
    }
  }

  return files.sort();
}

function executablePath(packageDirectory, executable) {
  const suffix = process.platform === "win32" ? ".cmd" : "";
  const localExecutable = join(packageDirectory, "node_modules", ".bin", `${executable}${suffix}`);
  return existsSync(localExecutable) ? localExecutable : undefined;
}

function runCommand(packageDirectory, executable, args, extraEnvironment = {}) {
  const localExecutable = executablePath(packageDirectory, executable);
  const command = localExecutable ?? (process.platform === "win32" ? "npx.cmd" : "npx");
  const commandArgs = localExecutable ? args : ["--yes", executable, ...args];
  const binDirectory = join(packageDirectory, "node_modules", ".bin");
  const environment = {
    ...process.env,
    ...extraEnvironment,
    PATH: `${binDirectory}${delimiter}${process.env.PATH ?? ""}`,
  };
  const result = spawnSync(command, commandArgs, {
    cwd: packageDirectory,
    encoding: "utf8",
    env: environment,
    shell: false,
  });

  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

function parseTestCounts(output) {
  const readCount = (label) => Number(output.match(new RegExp(`# ${label} (\\d+)`))?.[1] ?? 0);
  return {
    total: readCount("tests"),
    passed: readCount("pass"),
    failed: readCount("fail"),
    skipped: readCount("skipped"),
    todo: readCount("todo"),
  };
}

function parseJsonOutput(output) {
  const firstObject = output.indexOf("{");
  const firstArray = output.indexOf("[");
  const firstJson = [firstObject, firstArray].filter((index) => index !== -1).sort((left, right) => left - right)[0];
  const lastObject = output.lastIndexOf("}");
  const lastArray = output.lastIndexOf("]");
  const lastJson = Math.max(lastObject, lastArray);
  if (firstJson === undefined || lastJson <= firstJson) {
    return undefined;
  }

  try {
    return JSON.parse(output.slice(firstJson, lastJson + 1));
  } catch {
    return undefined;
  }
}

function runCoverage(packageDefinition) {
  const packageDirectory = join(root, packageDefinition.name);
  const testFiles = collectTestFiles(join(packageDirectory, packageDefinition.testDirectory));
  const reportDirectory = mkdtempSync(join(tmpdir(), `quality-gate-${packageDefinition.name}-`));
  const relativeTestFiles = testFiles.map((file) => relative(packageDirectory, file));
  const hasLocalTsx = executablePath(packageDirectory, "tsx") !== undefined;
  const testRunnerArguments = hasLocalTsx
    ? ["tsx", "--test", ...relativeTestFiles]
    : ["npx", "--yes", "tsx", "--test", ...relativeTestFiles];
  const coverageArguments = [
    "--all",
    "--src",
    packageDefinition.sourceDirectory,
    "--exclude",
    "**/*.test.*",
    "--reporter",
    "json-summary",
    "--report-dir",
    reportDirectory,
    ...testRunnerArguments,
  ];
  const result = runCommand(packageDirectory, "c8", coverageArguments, {
    NODE_ENV: "test",
  });
  const summaryPath = join(reportDirectory, "coverage-summary.json");
  const summary = existsSync(summaryPath)
    ? JSON.parse(readFileSync(summaryPath, "utf8"))
    : undefined;

  return {
    commandStatus: result.status,
    tests: parseTestCounts(result.output),
    testFiles: relativeTestFiles,
    output: result.output,
    coverageAvailable: summary?.total !== undefined,
    coverage: summary?.total ?? undefined,
  };
}

function runLint() {
  const packageDirectory = join(root, "frontend");
  const result = runCommand(packageDirectory, "eslint", [".", "--format", "json"]);
  const report = parseJsonOutput(result.stdout) ?? [];
  return {
    status: result.status,
    errors: report.reduce((total, file) => total + Number(file.errorCount ?? 0), 0),
    warnings: report.reduce((total, file) => total + Number(file.warningCount ?? 0), 0),
  };
}

function runTypecheck(packageDefinition) {
  const packageDirectory = join(root, packageDefinition.name);
  const result = runCommand(packageDirectory, "tsc", [
    "--noEmit",
    "--project",
    packageDefinition.typecheckProject,
  ]);
  return {
    status: result.status,
    output: result.output,
  };
}

function runAuditCommand(packageDirectoryName) {
  const packageDirectory = join(root, packageDirectoryName);
  const command = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(command, ["audit", "--json"], {
    cwd: packageDirectory,
    encoding: "utf8",
    env: process.env,
    shell: false,
  });
  return {
    status: result.status ?? 1,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    output: `${result.stdout ?? ""}${result.stderr ?? ""}`,
  };
}

function collectAudit(packageDirectoryName) {
  const result = runAuditCommand(packageDirectoryName);
  const report = parseJsonOutput(result.stdout);
  const vulnerabilities = report?.metadata?.vulnerabilities ?? report?.vulnerabilities ?? {};
  return {
    status: result.status,
    available: report !== undefined,
    low: Number(vulnerabilities.low ?? 0),
    moderate: Number(vulnerabilities.moderate ?? 0),
    high: Number(vulnerabilities.high ?? 0),
    critical: Number(vulnerabilities.critical ?? 0),
  };
}

function collectResults() {
  const packages = Object.fromEntries(
    packageDefinitions.map((packageDefinition) => [
      packageDefinition.name,
      {
        coverage: runCoverage(packageDefinition),
        typecheck: runTypecheck(packageDefinition),
      },
    ]),
  );

  return {
    commit: process.env.GITHUB_SHA ?? "local",
    generatedAt: new Date().toISOString(),
    packages,
    lint: runLint(),
    audit: {
      root: collectAudit("."),
      backend: collectAudit("backend"),
      frontend: collectAudit("frontend"),
    },
  };
}

function percentage(value) {
  return Number(value ?? 0);
}

function formatPercentage(value) {
  return `${percentage(value).toFixed(1)}%`;
}

function formatDelta(before, after) {
  const delta = percentage(after) - percentage(before);
  const sign = delta > 0 ? "+" : "";
  return `${formatPercentage(before)} → ${formatPercentage(after)} (${sign}${delta.toFixed(1)} pp)`;
}

function compareResults(base, head) {
  const findings = [];
  const rows = [];

  for (const packageDefinition of packageDefinitions) {
    const packageName = packageDefinition.name;
    const basePackage = base.packages[packageName];
    const headPackage = head.packages[packageName];
    rows.push(`### ${packageName}`);
    rows.push("");
    rows.push("| Índice | Base | PR | Variação |");
    rows.push("| --- | ---: | ---: | ---: |");

    for (const metric of coverageMetrics) {
      const before = percentage(basePackage.coverage?.coverage?.[metric]?.pct);
      const after = percentage(headPackage.coverage?.coverage?.[metric]?.pct);
      const delta = after - before;
      rows.push(`| Cobertura ${metric} | ${formatPercentage(before)} | ${formatPercentage(after)} | ${delta > 0 ? "+" : ""}${delta.toFixed(1)} pp |`);
      if (headPackage.coverage?.coverage?.[metric] && delta < -0.001) {
        findings.push({
          key: `coverage-${packageName}-${metric}`,
          title: `Regressão de cobertura em ${packageName}`,
          detail: `A cobertura de ${metric} caiu: ${formatDelta(before, after)}.`,
        });
      }
    }
    if (!headPackage.coverage?.coverageAvailable) {
      findings.push({
        key: `coverage-unavailable-${packageName}`,
        title: `Cobertura indisponível em ${packageName}`,
        detail: `Não foi possível gerar o relatório de cobertura do ${packageName}.`,
      });
    }

    const baseTests = basePackage.coverage?.tests ?? {};
    const headTests = headPackage.coverage?.tests ?? {};
    const passedDelta = (headTests.passed ?? 0) - (baseTests.passed ?? 0);
    const failedDelta = (headTests.failed ?? 0) - (baseTests.failed ?? 0);
    rows.push(`| Testes | ${baseTests.passed ?? 0}/${baseTests.total ?? 0} aprovados | ${headTests.passed ?? 0}/${headTests.total ?? 0} aprovados | aprovados ${passedDelta >= 0 ? "+" : ""}${passedDelta}; falhas ${failedDelta >= 0 ? "+" : ""}${failedDelta} |`);
    if (headPackage.coverage?.commandStatus !== 0 || (headTests.failed ?? 0) > 0) {
      findings.push({
        key: `tests-${packageName}`,
        title: `Testes falhando em ${packageName}`,
        detail: `A suíte de testes do ${packageName} terminou com status ${headPackage.coverage?.commandStatus ?? "desconhecido"} e ${headTests.failed ?? 0} falha(s).`,
      });
    }

    rows.push(`| TypeScript | ${basePackage.typecheck.status === 0 ? "OK" : "falhou"} | ${headPackage.typecheck.status === 0 ? "OK" : "falhou"} | — |`);
    if (headPackage.typecheck.status !== 0) {
      findings.push({
        key: `typecheck-${packageName}`,
        title: `TypeScript falhando em ${packageName}`,
        detail: "A verificação TypeScript terminou com erro.",
      });
    }
    rows.push("");
  }

  rows.push("### Qualidade e segurança");
  rows.push("");
  rows.push("| Índice | Base | PR | Variação |");
  rows.push("| --- | ---: | ---: | ---: |");
  rows.push(`| ESLint — erros | ${base.lint.errors} | ${head.lint.errors} | ${head.lint.errors - base.lint.errors} |`);
  rows.push(`| ESLint — avisos | ${base.lint.warnings} | ${head.lint.warnings} | ${head.lint.warnings - base.lint.warnings} |`);

  if (head.lint.errors > base.lint.errors) {
    findings.push({
      key: "eslint-errors",
      title: "Novos erros de ESLint",
      detail: `Os erros de ESLint aumentaram de ${base.lint.errors} para ${head.lint.errors}.`,
    });
  }
  if (head.lint.warnings > base.lint.warnings) {
    findings.push({
      key: "eslint-warnings",
      title: "Novos avisos de ESLint",
      detail: `Os avisos de ESLint aumentaram de ${base.lint.warnings} para ${head.lint.warnings}.`,
    });
  }

  for (const packageName of ["root", "backend", "frontend"]) {
    const baseAudit = base.audit[packageName];
    const headAudit = head.audit[packageName];
    const baseSevere = baseAudit.high + baseAudit.critical;
    const headSevere = headAudit.high + headAudit.critical;
    rows.push(`| npm audit ${packageName} — alta/crítica | ${baseSevere} | ${headSevere} | ${headSevere - baseSevere} |`);
    if (!headAudit.available) {
      findings.push({
        key: `audit-unavailable-${packageName}`,
        title: `npm audit indisponível em ${packageName}`,
        detail: `Não foi possível obter o relatório npm audit do ${packageName}.`,
      });
    }
    if (headSevere > baseSevere) {
      findings.push({
        key: `audit-${packageName}`,
        title: `Novas vulnerabilidades altas/críticas em ${packageName}`,
        detail: `Vulnerabilidades altas/críticas aumentaram de ${baseSevere} para ${headSevere}.`,
      });
    }
  }

  const report = [
    "# Quality Gate",
    "",
    `Comparação entre \`${base.commit}\` (base) e \`${head.commit}\` (PR).`,
    "",
    ...rows,
    "### Resultado",
    "",
    findings.length === 0 ? "PASS — nenhum índice regrediu." : `FAIL — ${findings.length} achado(s) bloqueiam o PR.`,
    "",
  ].join("\n");

  return {
    passed: findings.length === 0,
    findings,
    report,
  };
}

async function createIssue(repo, token, finding) {
  const pullRequestNumber = process.env.GITHUB_EVENT_NUMBER ?? "unknown";
  const marker = `quality-gate:${pullRequestNumber}:${createHash("sha256").update(finding.key).digest("hex").slice(0, 12)}`;
  const apiBase = `https://api.github.com/repos/${repo}`;
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${token}`,
    "X-GitHub-Api-Version": "2022-11-28",
  };
  const searchUrl = `https://api.github.com/search/issues?q=${encodeURIComponent(`repo:${repo} is:issue "${marker}"`)}`;
  const existingResponse = await fetch(searchUrl, { headers });
  if (!existingResponse.ok) {
    throw new Error(`não foi possível pesquisar Issues (${existingResponse.status})`);
  }
  const existing = await existingResponse.json();
  if (existing.total_count > 0) {
    return;
  }

  const body = [
    `<!-- ${marker} -->`,
    `O Quality Gate identificou um achado no PR #${pullRequestNumber}.`,
    "",
    `**Achado:** ${finding.detail}`,
    "",
    "O relatório completo está disponível no Summary e nos artifacts da execução do GitHub Actions.",
    "",
    `- Commit analisado: \`${process.env.GITHUB_SHA ?? "desconhecido"}\``,
    `- Execução: ${process.env.GITHUB_SERVER_URL ?? "https://github.com"}/${repo}/actions/runs/${process.env.GITHUB_RUN_ID ?? ""}`,
    "",
    "Este registro foi criado automaticamente e é deduplicado por PR e categoria.",
  ].join("\n");
  const response = await fetch(`${apiBase}/issues`, {
    method: "POST",
    headers: {
      ...headers,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      title: `[Quality Gate] ${finding.title}`,
      body,
    }),
  });
  if (!response.ok) {
    throw new Error(`não foi possível criar a Issue (${response.status})`);
  }
}

async function publishIssues(findings) {
  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPOSITORY;
  const headRepository = process.env.GITHUB_HEAD_REPOSITORY;
  if (
    !token ||
    !repo ||
    process.env.GITHUB_EVENT_NAME !== "pull_request" ||
    headRepository !== repo
  ) {
    return;
  }

  for (const finding of findings) {
    try {
      await createIssue(repo, token, finding);
    } catch (error) {
      console.warn(`Aviso: falha ao criar Issue para ${finding.key}: ${error.message}`);
    }
  }
}

async function main() {
  const outputPath = argumentValue("--output");
  const reportPath = argumentValue("--report");
  const compareBasePath = argumentValue("--compare-base");
  const compareHeadPath = argumentValue("--compare-head");

  if (compareBasePath && compareHeadPath) {
    const base = JSON.parse(readFileSync(resolve(compareBasePath), "utf8"));
    const head = JSON.parse(readFileSync(resolve(compareHeadPath), "utf8"));
    const result = compareResults(base, head);
    if (reportPath) {
      writeFileSync(resolve(reportPath), result.report);
    }
    if (outputPath) {
      writeFileSync(resolve(outputPath), JSON.stringify(result, null, 2));
    }
    await publishIssues(result.findings);
    process.stdout.write(result.report);
    process.exitCode = result.passed ? 0 : 1;
    return;
  }

  const results = collectResults();
  if (!outputPath) {
    throw new Error("Informe --output ao coletar os resultados.");
  }
  mkdirSync(dirname(resolve(outputPath)), { recursive: true });
  writeFileSync(resolve(outputPath), JSON.stringify(results, null, 2));
}

await main();
