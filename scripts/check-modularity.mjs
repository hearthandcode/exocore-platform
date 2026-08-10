#!/usr/bin/env node

import { readFileSync, readdirSync } from "node:fs";
import { basename, extname, isAbsolute, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const DEFAULT_POLICY = "config/modularity-policy.json";

function parseArgs(argv) {
  const options = { root: process.cwd(), policy: DEFAULT_POLICY, today: new Date().toISOString().slice(0, 10) };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    if (!["--root", "--policy", "--today"].includes(flag) || !argv[index + 1]) {
      throw new Error(`Unknown or incomplete argument: ${flag}`);
    }
    options[flag.slice(2)] = argv[index + 1];
    index += 1;
  }
  return options;
}

function repositoryPath(root, path) {
  return relative(root, path).split(sep).join("/");
}

function assertPolicy(policy) {
  const positiveIntegers = ["preferredMaxLines", "boundaryMaxLines"];
  if (policy.policy !== "exocore.modularity-policy.v1" || policy.version !== 1) {
    throw new Error("Unsupported modularity policy identity or version");
  }
  for (const key of positiveIntegers) {
    if (!Number.isInteger(policy[key]) || policy[key] < 1) throw new Error(`${key} must be a positive integer`);
  }
  for (const key of ["sourceExtensions", "excludedDirectories", "boundaryFiles", "exceptions"]) {
    if (!Array.isArray(policy[key])) throw new Error(`${key} must be an array`);
  }
  const paths = new Set();
  for (const exception of policy.exceptions) {
    for (const key of ["path", "owner", "reason", "splitPlan", "reviewBy"]) {
      if (typeof exception[key] !== "string" || exception[key].trim() === "") {
        throw new Error(`Exception ${exception.path ?? "<unknown>"} needs ${key}`);
      }
    }
    if (paths.has(exception.path)) throw new Error(`Duplicate exception: ${exception.path}`);
    paths.add(exception.path);
  }
}

function collectSourceFiles(root, policy) {
  const files = [];
  const excluded = new Set(policy.excludedDirectories);
  const extensions = new Set(policy.sourceExtensions);
  function walk(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
      if (entry.isDirectory() && excluded.has(entry.name)) continue;
      const path = join(directory, entry.name);
      if (entry.isDirectory()) walk(path);
      else if (entry.isFile() && extensions.has(extname(entry.name))) files.push(path);
    }
  }
  walk(root);
  return files.sort();
}

function lineCount(path) {
  const text = readFileSync(path, "utf8");
  if (text === "") return 0;
  const lines = text.split(/\r?\n/);
  return lines.at(-1) === "" ? lines.length - 1 : lines.length;
}

export function evaluateModularity({ root, policy, today }) {
  assertPolicy(policy);
  const exceptions = new Map(policy.exceptions.map((entry) => [entry.path, entry]));
  const boundaryFiles = new Set(policy.boundaryFiles);
  const warnings = [];
  const violations = [];
  const files = collectSourceFiles(root, policy);
  const observed = new Set();

  for (const path of files) {
    const relativePath = repositoryPath(root, path);
    const lines = lineCount(path);
    const boundary = boundaryFiles.has(basename(path));
    const limit = boundary ? policy.boundaryMaxLines : policy.preferredMaxLines;
    const exception = exceptions.get(relativePath);
    if (exception) observed.add(relativePath);

    if (lines <= limit) {
      if (exception) warnings.push(`${relativePath}: exception is no longer needed (${lines}/${limit} lines)`);
      continue;
    }
    if (!exception) {
      violations.push(`${relativePath}: ${lines} lines exceeds ${boundary ? "boundary" : "source"} threshold ${limit}; split by responsibility or add a reviewed exception`);
      continue;
    }
    if (exception.reviewBy < today) {
      violations.push(`${relativePath}: exception expired ${exception.reviewBy}; owner ${exception.owner} must split or renew review`);
      continue;
    }
    warnings.push(`${relativePath}: approved debt ${lines}/${limit} lines; owner=${exception.owner}; reviewBy=${exception.reviewBy}`);
  }

  for (const exception of policy.exceptions) {
    if (!observed.has(exception.path)) violations.push(`${exception.path}: exception path does not exist or is not a scanned source file`);
  }
  return { filesChecked: files.length, warnings, violations };
}

export function run(argv = process.argv.slice(2)) {
  try {
    const options = parseArgs(argv);
    const root = resolve(options.root);
    const policyPath = isAbsolute(options.policy) ? options.policy : resolve(root, options.policy);
    const policy = JSON.parse(readFileSync(policyPath, "utf8"));
    const result = evaluateModularity({ root, policy, today: options.today });
    for (const warning of result.warnings) process.stderr.write(`WARN ${warning}\n`);
    for (const violation of result.violations) process.stderr.write(`FAIL ${violation}\n`);
    process.stdout.write(`Modularity check: ${result.filesChecked} files, ${result.warnings.length} visible debt item(s), ${result.violations.length} violation(s)\n`);
    return result.violations.length === 0 ? 0 : 1;
  } catch (error) {
    process.stderr.write(`FAIL ${error instanceof Error ? error.message : String(error)}\n`);
    return 1;
  }
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  process.exitCode = run();
}
