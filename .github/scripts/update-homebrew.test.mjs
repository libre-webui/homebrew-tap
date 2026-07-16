import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import {
  normalizeVersion,
  updateCask,
  updateFormula,
} from "./update-homebrew.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "../..");

test("normalizes stable release versions", () => {
  assert.equal(normalizeVersion("v0.14.1"), "0.14.1");
  assert.equal(normalizeVersion("1.2.3"), "1.2.3");
  assert.throws(() => normalizeVersion("1.2.3-beta.1"));
  assert.throws(() => normalizeVersion("latest"));
});

test("updates only the formula release URL and checksum", () => {
  const formula = `class LibreWebui < Formula
  url "https://registry.npmjs.org/libre-webui/-/libre-webui-0.14.1.tgz"
  sha256 "${"a".repeat(64)}"
end
`;

  const updated = updateFormula(formula, "0.15.0", "b".repeat(64));

  assert.match(updated, /libre-webui-0\.15\.0\.tgz/);
  assert.match(updated, new RegExp(`sha256 "${"b".repeat(64)}"`));
});

test("updates only the cask version and checksum", () => {
  const cask = `cask "libre-webui-frontend" do
  version "0.14.1"
  sha256 "${"a".repeat(64)}"
end
`;

  const updated = updateCask(cask, "0.15.0", "b".repeat(64));

  assert.match(updated, /^cask "libre-webui-frontend" do/m);
  assert.match(updated, /version "0\.15\.0"/);
  assert.match(updated, new RegExp(`sha256 "${"b".repeat(64)}"`));
});

test("keeps the CLI and desktop packages on distinct tokens", () => {
  const formula = fs.readFileSync(
    path.join(repoRoot, "Formula/libre-webui.rb"),
    "utf8",
  );
  const cask = fs.readFileSync(
    path.join(repoRoot, "Casks/libre-webui-frontend.rb"),
    "utf8",
  );
  const renames = JSON.parse(
    fs.readFileSync(path.join(repoRoot, "cask_renames.json"), "utf8"),
  );

  assert.match(formula, /^class LibreWebui < Formula/m);
  assert.match(cask, /^cask "libre-webui-frontend" do/m);
  assert.doesNotMatch(cask, /^cask "libre-webui" do/m);
  assert.match(cask, /brew install --formula libre-webui/);
  assert.equal(renames["libre-webui"], "libre-webui-frontend");
  assert.equal(
    fs.existsSync(path.join(repoRoot, "Casks/libre-webui.rb")),
    false,
  );
});
