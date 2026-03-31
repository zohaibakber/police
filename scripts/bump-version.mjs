import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

const packageJsonPath = path.resolve(process.cwd(), "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

const currentVersion = String(packageJson.version ?? "0.0.0");
const [major, minor, patch] = currentVersion.split(".").map((part) => Number(part) || 0);
const nextVersion = `${major}.${minor}.${patch + 1}`;

packageJson.version = nextVersion;
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf-8");

console.log(`Version bumped: ${currentVersion} -> ${nextVersion}`);
