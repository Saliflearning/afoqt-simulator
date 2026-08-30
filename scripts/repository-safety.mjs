import { execFileSync } from "node:child_process";
import fs from "node:fs";

const mode = process.argv[2] ?? "--current";
const maxBlobBytes = 2 * 1024 * 1024;
const scannerPath = "scripts/repository-safety.mjs";

const ownerFingerprints = [
  ["sa", "lif"].join(""),
  ["guin", "gani"].join(""),
  ["bu", "su", " ", "gan"].join(""),
];

const checks = [
  {
    category: "owner-identity",
    test: (text) => ownerFingerprints.some((value) => new RegExp(`\\b${value}\\b`, "i").test(text)),
  },
  {
    category: "private-path",
    test: (text) => /[A-Za-z]:\\Users\\|\/Users\/|\/home\//i.test(text),
  },
  {
    category: "email",
    test: (text, path) => path !== "package-lock.json" && /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(text),
  },
  {
    category: "phone",
    test: (text) => /(?<!\d)(?:\+?1[ .-]?)?\(?\d{3}\)?[ .-]\d{3}[ .-]\d{4}(?!\d)/.test(text),
  },
  {
    category: "credential-shape",
    test: (text) =>
      /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/.test(text) ||
      /\bAKIA[0-9A-Z]{16}\b/.test(text) ||
      /\bgh[pousr]_[A-Za-z0-9_]{20,}\b/.test(text) ||
      /(?:api[_-]?key|secret|token|password)\s*[:=]\s*["'][^"']{8,}["']/i.test(text),
  },
];

const internalPath = /(^|\/)(?:AGENTS\.md|CLAUDE\.md|\.agents|\.claude|\.specify|graphify-out|\.vercel)(?:\/|$)/i;

function git(...args) {
  return execFileSync("git", args, { encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
}

function scanText(text, path, includePathPolicy) {
  const findings = [];
  if (path === scannerPath) return findings;
  if (includePathPolicy && internalPath.test(path)) findings.push(`internal-artifact:${path}`);
  for (const check of checks) {
    if (check.test(text, path)) findings.push(`${check.category}:${path}`);
  }
  return findings;
}

function scanCurrent() {
  const findings = [];
  const files = git("ls-files", "-z").split("\0").filter(Boolean);
  for (const path of files) {
    let handle;
    let data;
    try {
      handle = fs.openSync(path, "r");
      if (fs.fstatSync(handle).size > maxBlobBytes) continue;
      data = fs.readFileSync(handle);
    } catch (error) {
      if (error?.code === "ENOENT") continue;
      throw error;
    } finally {
      if (handle !== undefined) fs.closeSync(handle);
    }
    if (data.includes(0)) continue;
    findings.push(...scanText(data.toString("utf8"), path, true));
  }
  return findings;
}

function scanHistory() {
  const findings = [];
  const seen = new Set();
  const objects = git("rev-list", "--objects", "--all").split(/\r?\n/).filter(Boolean);
  for (const entry of objects) {
    const [oid, ...pathParts] = entry.split(" ");
    const path = pathParts.join(" ") || "<historical-blob>";
    if (seen.has(oid)) continue;
    seen.add(oid);
    if (git("cat-file", "-t", oid).trim() !== "blob") continue;
    if (Number(git("cat-file", "-s", oid).trim()) > maxBlobBytes) continue;
    const data = execFileSync("git", ["cat-file", "blob", oid], { maxBuffer: maxBlobBytes + 1024 });
    if (data.includes(0)) continue;
    findings.push(...scanText(data.toString("utf8"), path, false));
  }
  return findings;
}

function selfTest() {
  const cases = [
    [["sa", "lif"].join(""), "owner-identity"],
    [["C:", "\\Users\\demo\\file"].join(""), "private-path"],
    [["person", "@", "example.com"].join(""), "email"],
    [["317", "-", "555", "-", "0123"].join(""), "phone"],
    [["api_key", "=", "\"", "example-secret-value", "\""].join(""), "credential-shape"],
  ];
  for (const [sample, expected] of cases) {
    const findings = scanText(sample, "fixture.txt", false);
    if (!findings.some((finding) => finding.startsWith(`${expected}:`))) {
      throw new Error(`Safety self-test failed for ${expected}`);
    }
  }
  if (!scanText("safe synthetic content", "fixture.txt", false).length) return;
  throw new Error("Safety self-test produced a false positive for safe content");
}

let findings;
if (mode === "--self-test") {
  selfTest();
  findings = [];
} else if (mode === "--current") {
  findings = scanCurrent();
} else if (mode === "--history") {
  findings = scanHistory();
} else {
  throw new Error(`Unknown mode: ${mode}`);
}

const unique = [...new Set(findings)].sort();
if (unique.length) {
  console.error(`Repository safety gate failed (${mode}) with ${unique.length} redacted finding(s):`);
  for (const finding of unique) console.error(`- ${finding}`);
  process.exitCode = 1;
} else {
  console.log(`Repository safety gate passed (${mode}).`);
}
