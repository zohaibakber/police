import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const packageJsonPath = path.resolve(process.cwd(), "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const version = String(packageJson.version ?? "0.0.0");
const tagName = `v${version}`;

const currentBranch = execSync("git rev-parse --abbrev-ref HEAD", { encoding: "utf-8" }).trim();
if (currentBranch === "HEAD") {
  console.log("Skipping tag creation in detached HEAD state.");
  process.exit(0);
}

const tagExists = execSync(`git tag -l ${tagName}`, { encoding: "utf-8" }).trim();
if (tagExists) {
  console.log(`Tag ${tagName} already exists.`);
  process.exit(0);
}

execSync(`git tag -a ${tagName} -m \"Release ${tagName}\"`, { stdio: "inherit" });
console.log(`Created release tag ${tagName}`);
