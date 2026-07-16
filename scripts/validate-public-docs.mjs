import { lstat, readFile, readdir } from "node:fs/promises";
import path from "node:path";

export const SOURCE_ALLOWLIST = new Set([
  "README.md",
  "product-guide.md",
  "how-it-works.md",
  "setup.md",
  "faq.md",
  "security-and-privacy.md",
  "roadmap.md",
  "changelog.md",
  "testing.md",
  "CONTRIBUTING.md",
  "CODE_OF_CONDUCT.md",
  "assets/homepage.png",
  ".github/ISSUE_TEMPLATE/bug.yml",
  ".github/ISSUE_TEMPLATE/feature.yml",
  ".github/ISSUE_TEMPLATE/config.yml",
  ".github/workflows/docs.yml",
  ".github/dependabot.yml",
]);

export const TARGET_GENERATED_ALLOWLIST = new Set([
  "scripts/validate-public-docs.mjs",
]);

const DISCLOSURE_PATTERNS = [
  /\b(?:gh[pousr]_[A-Za-z0-9_]{20,}|github_pat_[A-Za-z0-9_]{20,})\b/,
  /https:\/\/(?:canary\.|ptb\.)?discord(?:app)?\.com\/api\/webhooks\//,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\bAIza[0-9A-Za-z_-]{35}\b/,
  /\b(?:DATABASE_URL|FIREBASE_ADMIN_PRIVATE_KEY|CLOUDFLARE_EMAIL_API_TOKEN|TURNSTILE_SECRET_KEY|VERCEL_TOKEN)\s*=/,
];

async function walk(root, current = "") {
  const entries = await readdir(path.join(root, current), { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    if (entry.name === ".git") continue;
    const relative = path.posix.join(current, entry.name);
    if (entry.isDirectory()) files.push(...await walk(root, relative));
    else files.push(relative);
  }
  return files;
}

function pngContainsMetadata(buffer) {
  let offset = 8;
  while (offset + 12 <= buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.subarray(offset + 4, offset + 8).toString("ascii");
    if (["tEXt", "zTXt", "iTXt", "eXIf"].includes(type)) return true;
    offset += 12 + length;
  }
  return false;
}

export async function validatePublicTree(root, { target = false } = {}) {
  const allowlist = new Set([...SOURCE_ALLOWLIST, ...(target ? TARGET_GENERATED_ALLOWLIST : [])]);
  const files = (await walk(root)).sort();
  const errors = [];

  for (const required of SOURCE_ALLOWLIST) {
    if (!files.includes(required)) errors.push(`missing required file: ${required}`);
  }
  for (const file of files) {
    if (!allowlist.has(file)) errors.push(`unexpected file: ${file}`);
    const fullPath = path.join(root, file);
    const stats = await lstat(fullPath);
    if (stats.isSymbolicLink()) errors.push(`symbolic links are forbidden: ${file}`);
    if (stats.size > 5 * 1024 * 1024) errors.push(`file exceeds 5 MiB: ${file}`);
    const buffer = await readFile(fullPath);
    if (file.endsWith(".png")) {
      if (buffer.subarray(1, 4).toString("ascii") !== "PNG") errors.push(`invalid PNG signature: ${file}`);
      if (pngContainsMetadata(buffer)) errors.push(`PNG metadata must be stripped: ${file}`);
      continue;
    }
    const text = buffer.toString("utf8");
    if (text.includes("\0")) errors.push(`binary content is forbidden: ${file}`);
    if (DISCLOSURE_PATTERNS.some((pattern) => pattern.test(text))) errors.push(`potential secret disclosure: ${file}`);
  }

  return { errors, files };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const target = process.argv.includes("--target");
  const rootArg = process.argv.slice(2).find((arg) => !arg.startsWith("--"));
  const root = path.resolve(rootArg || "docs-public");
  const result = await validatePublicTree(root, { target });
  if (result.errors.length) {
    result.errors.forEach((error) => console.error(`- ${error}`));
    process.exitCode = 1;
  } else {
    console.log(`Public docs validation passed for ${result.files.length} files.`);
  }
}
