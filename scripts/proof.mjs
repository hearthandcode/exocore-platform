import { spawnSync } from "node:child_process";

const quick = process.argv.includes("--quick");
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const cargo = process.platform === "win32" ? "cargo.exe" : "cargo";
const python = process.platform === "win32" ? "python" : "python3";

const checks = [
  ["format", npm, ["run", "format:check"]],
  ["lint", npm, ["run", "lint"]],
  ["types", npm, ["run", "check"]],
  ["tests", npm, ["test"]],
  ["boundaries", npm, ["run", "check:boundaries"]],
  ["language-persistence", npm, ["run", "validate:language-persistence"]],
  ["intake-projection", npm, ["run", "validate:intake-registry"]],
  ["artifact-projection", npm, ["run", "validate:artifact-surface"]],
  ["web-build", npm, ["run", "build"]],
];

if (!quick) {
  checks.push(
    [
      "rust-format",
      cargo,
      ["fmt", "--manifest-path", "src-tauri/Cargo.toml", "--", "--check"],
    ],
    [
      "rust-check",
      cargo,
      ["check", "--manifest-path", "src-tauri/Cargo.toml", "--offline"],
    ],
    [
      "rust-clippy",
      cargo,
      [
        "clippy",
        "--manifest-path",
        "src-tauri/Cargo.toml",
        "--all-targets",
        "--offline",
        "--",
        "-D",
        "warnings",
      ],
    ],
    [
      "rust-tests",
      cargo,
      ["test", "--manifest-path", "src-tauri/Cargo.toml", "--offline"],
    ],
    [
      "python-tests",
      python,
      [
        "-m",
        "unittest",
        "discover",
        "-s",
        "workers/profile-evaluation-python/tests",
        "-v",
      ],
    ],
    [
      "python-compile",
      python,
      [
        "-m",
        "compileall",
        "-q",
        "workers/profile-evaluation-python/src",
        "workers/profile-evaluation-python/tests",
      ],
    ],
    ["audit", npm, ["audit", "--audit-level=low"]],
    [
      "tauri-build",
      npm,
      ["run", "tauri", "build", "--", "--debug", "--no-bundle"],
    ],
  );
}

let passed = 0;
for (const [id, command, args] of checks) {
  console.log(`\nPROOF check=${id} command=${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: "utf8",
    stdio: "inherit",
    env: { ...process.env, NO_COLOR: "1" },
  });
  if (result.error || result.status !== 0) {
    console.error(
      `PROOF_SUMMARY schema=exocore.local-proof.v1 mode=${quick ? "quick" : "full"} passed=${passed} failed=1 failed_check=${id}`,
    );
    process.exit(result.status ?? 1);
  }
  passed += 1;
}

console.log(
  `\nPROOF_SUMMARY schema=exocore.local-proof.v1 mode=${quick ? "quick" : "full"} passed=${passed} failed=0 boundary=local-synthetic-default-off`,
);
