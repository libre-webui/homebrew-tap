import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

const args = process.argv.slice(2);

function getArg(name) {
  const index = args.indexOf(name);
  return index === -1 ? undefined : args[index + 1];
}

function hasArg(name) {
  return args.includes(name);
}

export function normalizeVersion(value) {
  const version = value?.trim().replace(/^v/, "");
  if (!/^\d+\.\d+\.\d+$/.test(version ?? "")) {
    throw new Error(`Expected a stable semantic version, received: ${value}`);
  }
  return version;
}

export function updateFormula(content, version, sha256) {
  const releaseBlock =
    /url "https:\/\/registry\.npmjs\.org\/libre-webui\/-\/libre-webui-[^"]+\.tgz"\n  sha256 "[a-f0-9]{64}"/;

  if (!releaseBlock.test(content)) {
    throw new Error("Could not locate the formula release URL and checksum");
  }

  return content.replace(
    releaseBlock,
    `url "https://registry.npmjs.org/libre-webui/-/libre-webui-${version}.tgz"\n  sha256 "${sha256}"`,
  );
}

export function updateCask(content, version, sha256, assetWord = "Frontend") {
  const releaseBlock = /version "[^"]+"\n  sha256 "[a-f0-9]{64}"/;

  if (!releaseBlock.test(content)) {
    throw new Error("Could not locate the cask version and checksum");
  }

  return content
    .replace(releaseBlock, `version "${version}"\n  sha256 "${sha256}"`)
    .replace(
      /Libre-WebUI-(?:Frontend|Desktop)-#\{version\}-mac-arm64\.dmg/,
      `Libre-WebUI-${assetWord}-#{version}-mac-arm64.dmg`,
    )
    .replace(
      /app "Libre WebUI (?:Frontend|Desktop)\.app"/,
      `app "Libre WebUI ${assetWord}.app"`,
    );
}

function sha256(buffer) {
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function fetchResponse(url, options = {}) {
  let lastError;

  for (let attempt = 1; attempt <= 6; attempt += 1) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      }
      lastError = new Error(`${url} returned HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }

    if (attempt < 6) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 5000));
    }
  }

  throw lastError;
}

async function resolveLatestVersion() {
  const response = await fetchResponse(
    "https://registry.npmjs.org/libre-webui/latest",
  );
  const metadata = await response.json();
  return normalizeVersion(metadata.version);
}

async function resolveDmgSha(version) {
  const headers = {
    Accept: "application/vnd.github+json",
    "User-Agent": "libre-webui-homebrew-updater",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const response = await fetchResponse(
    `https://api.github.com/repos/libre-webui/libre-webui/releases/tags/v${version}`,
    { headers },
  );
  const release = await response.json();
  // The app was renamed from "Libre WebUI Frontend" to "Libre WebUI Desktop";
  // accept either asset name so older releases keep resolving.
  const candidateNames = [
    `Libre-WebUI-Desktop-${version}-mac-arm64.dmg`,
    `Libre-WebUI-Frontend-${version}-mac-arm64.dmg`,
  ];
  const asset = release.assets?.find((candidate) =>
    candidateNames.includes(candidate.name),
  );

  if (!asset) {
    throw new Error(
      `Release v${version} does not contain ${candidateNames.join(" or ")}`,
    );
  }

  const assetWord = asset.name.includes("-Desktop-") ? "Desktop" : "Frontend";
  const digest = asset.digest?.match(/^sha256:([a-f0-9]{64})$/i)?.[1];
  if (digest) {
    return { sha: digest.toLowerCase(), assetWord };
  }

  const dmgResponse = await fetchResponse(asset.browser_download_url);
  return {
    sha: sha256(Buffer.from(await dmgResponse.arrayBuffer())),
    assetWord,
  };
}

async function main() {
  const requestedVersion = getArg("--version");
  const version = requestedVersion
    ? normalizeVersion(requestedVersion)
    : await resolveLatestVersion();

  const formulaPath = path.join(repoRoot, "Formula/libre-webui.rb");
  const caskPath = path.join(repoRoot, "Casks/libre-webui-desktop.rb");
  const formula = fs.readFileSync(formulaPath, "utf8");
  const cask = fs.readFileSync(caskPath, "utf8");
  const currentVersion = cask.match(/version "([^"]+)"/)?.[1];

  if (currentVersion === version && !hasArg("--force")) {
    console.log(`Homebrew packages are already current at v${version}`);
    return;
  }

  const npmUrl = `https://registry.npmjs.org/libre-webui/-/libre-webui-${version}.tgz`;
  const npmResponse = await fetchResponse(npmUrl);
  const npmSha = sha256(Buffer.from(await npmResponse.arrayBuffer()));
  const dmg = await resolveDmgSha(version);

  fs.writeFileSync(formulaPath, updateFormula(formula, version, npmSha));
  fs.writeFileSync(
    caskPath,
    updateCask(cask, version, dmg.sha, dmg.assetWord),
  );

  const summaryPath = path.join(os.tmpdir(), "libre-webui-homebrew-version");
  fs.writeFileSync(summaryPath, `${version}\n`);
  console.log(`Updated Homebrew packages to v${version}`);
  console.log(`npm SHA256: ${npmSha}`);
  console.log(`DMG SHA256: ${dmg.sha}`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
