import { execSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import process from "node:process";

function parseSemver(value) {
	const match = String(value).match(/^(\d+)\.(\d+)\.(\d+)$/);
	if (!match) return null;
	return {
		major: Number(match[1]),
		minor: Number(match[2]),
		patch: Number(match[3]),
	};
}

function compareSemver(a, b) {
	if (a.major !== b.major) return a.major - b.major;
	if (a.minor !== b.minor) return a.minor - b.minor;
	return a.patch - b.patch;
}

function findHighestTaggedVersion() {
	try {
		// Keep local tags in sync so version decisions include already-pushed tags.
		execSync("git fetch --tags --quiet", { stdio: "ignore" });
	} catch {
		// If fetch fails (offline, no remote), continue with local tags only.
	}

	let tagList = "";
	try {
		tagList = execSync("git tag -l 'v*.*.*'", { encoding: "utf-8" });
	} catch {
		return null;
	}

	const versions = tagList
		.split("\n")
		.map((tag) => tag.trim())
		.filter(Boolean)
		.map((tag) => tag.replace(/^v/, ""))
		.map(parseSemver)
		.filter(Boolean);

	if (versions.length === 0) return null;

	return versions.reduce((highest, current) => {
		if (!highest) return current;
		return compareSemver(current, highest) > 0 ? current : highest;
	}, null);
}

const packageJsonPath = path.resolve(process.cwd(), "package.json");
const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));

const currentVersion = String(packageJson.version ?? "0.0.0");
const packageSemver = parseSemver(currentVersion) ?? { major: 0, minor: 0, patch: 0 };
const highestTagSemver = findHighestTaggedVersion();
const baseSemver =
	highestTagSemver && compareSemver(highestTagSemver, packageSemver) > 0
		? highestTagSemver
		: packageSemver;

const nextVersion = `${baseSemver.major}.${baseSemver.minor}.${baseSemver.patch + 1}`;

packageJson.version = nextVersion;
writeFileSync(packageJsonPath, `${JSON.stringify(packageJson, null, 2)}\n`, "utf-8");

console.log(`Version bumped: ${currentVersion} -> ${nextVersion}`);
