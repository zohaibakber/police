import { execSync } from "node:child_process";
import { readFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

function run(command) {
  return execSync(command, { encoding: "utf-8" }).trim();
}

function canRun(command) {
  try {
    execSync(command, { stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
}

const packageJsonPath = path.resolve(process.cwd(), "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
const version = String(packageJson.version ?? "0.0.0");
const tagName = `v${version}`;

if (!canRun("gh --version")) {
  console.log("Skipping GitHub release: GitHub CLI (gh) is not installed.");
  process.exit(0);
}

if (!canRun("gh auth status")) {
  console.log("Skipping GitHub release: gh is not authenticated.");
  process.exit(0);
}

const releaseExists = run(
  `gh release list --limit 200 --json tagName --jq '.[] | select(.tagName == "${tagName}") | .tagName'`
);
if (releaseExists === tagName) {
  console.log(`GitHub release for ${tagName} already exists.`);
  process.exit(0);
}

execSync(`gh release create ${tagName} --verify-tag --generate-notes --title \"Release ${tagName}\"`, {
  stdio: "inherit",
});
console.log(`Published GitHub release ${tagName}`);
