import assert from "node:assert/strict";
import test from "node:test";

import {
  normalizeVersion,
  updateCask,
  updateFormula,
} from "./update-homebrew.mjs";

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
  const cask = `cask "libre-webui" do
  version "0.14.1"
  sha256 "${"a".repeat(64)}"
end
`;

  const updated = updateCask(cask, "0.15.0", "b".repeat(64));

  assert.match(updated, /version "0\.15\.0"/);
  assert.match(updated, new RegExp(`sha256 "${"b".repeat(64)}"`));
});
