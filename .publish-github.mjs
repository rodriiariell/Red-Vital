import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const root = process.cwd();
const repo = "repos/rodriiariell/Red-Vital";
const gh = (args, input) => JSON.parse(execFileSync("gh", ["api", ...args], { cwd: root, input, encoding: "utf8", maxBuffer: 20 * 1024 * 1024 }));
const parent = gh([`${repo}/git/ref/heads/main`]).object.sha;
const files = [];
const blockedDirs = new Set([".git", "node_modules", "dist", "build", "coverage", ".cache", ".vite", ".turbo", "__pycache__"]);
for (const item of fs.readdirSync(root, { recursive: true, withFileTypes: true })) {
  if (!item.isFile()) continue;
  const full = path.join(item.parentPath ?? item.path, item.name);
  const rel = path.relative(root, full).replaceAll(path.sep, "/");
  const parts = rel.split("/");
  if (parts.some((part) => blockedDirs.has(part))) continue;
  if (/^\.env(?:\..*)?$/i.test(item.name) && item.name !== ".env.example") continue;
  if (/^dev\.db(?:-(?:journal|shm|wal))?$/i.test(item.name)) continue;
  if (/\.(?:log|tmp|temp|bak)$/i.test(item.name)) continue;
  files.push({ full, rel });
}
const entries = [];
for (const file of files) {
  const content = fs.readFileSync(file.full).toString("base64");
  const blob = gh([`${repo}/git/blobs`, "--input", "-"], JSON.stringify({ content, encoding: "base64" }));
  entries.push({ path: file.rel, mode: "100644", type: "blob", sha: blob.sha });
}
const tree = gh([`${repo}/git/trees`, "--input", "-"], JSON.stringify({ base_tree: (gh([`${repo}/git/commits/${parent}`])).tree.sha, tree: entries }));
const commit = gh([`${repo}/git/commits`, "--input", "-"], JSON.stringify({ message: "feat: sync complete RedVital project", tree: tree.sha, parents: [parent] }));
const updated = gh([`${repo}/git/refs/heads/main`, "--method", "PATCH", "--input", "-"], JSON.stringify({ sha: commit.sha, force: false }));
console.log(JSON.stringify({ parent, files: files.length, blobs: entries.length, tree: tree.sha, commit: commit.sha, ref: updated.object.sha }));
