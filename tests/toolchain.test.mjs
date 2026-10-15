import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

test("workspace pins the verified runtime and package manager", async () => {
  const packageJson = await readJson("package.json");

  assert.equal(packageJson.engines.node, "22.20.0");
  assert.equal(packageJson.packageManager, "pnpm@11.25.0");
  assert.equal((await readFile(".node-version", "utf8")).trim(), "22.20.0");
});

test("workspace exposes the required quality commands", async () => {
  const packageJson = await readJson("package.json");

  for (const command of [
    "bootstrap",
    "lint",
    "typecheck",
    "test",
    "build",
    "check",
  ]) {
    assert.equal(
      typeof packageJson.scripts[command],
      "string",
      `${command} script is missing`,
    );
  }
});

test("official OKX and x402 packages are exactly pinned", async () => {
  const packageJson = await readJson("package.json");

  assert.equal(packageJson.devDependencies["@okx_ai/okx-trade-cli"], "1.4.8");
  assert.equal(packageJson.devDependencies["@okx_ai/okx-trade-mcp"], "1.4.8");
  assert.equal(packageJson.devDependencies["@x402/core"], "2.28.0");
  assert.equal(packageJson.devDependencies["@x402/hono"], "2.28.0");
  assert.equal(packageJson.devDependencies["@x402/fetch"], "2.28.0");
});

test("every planned workspace package has a manifest", async () => {
  const manifests = [
    "apps/web/package.json",
    "apps/api/package.json",
    "apps/agent-client/package.json",
    "packages/okx-adapter/package.json",
    "packages/pricing/package.json",
    "packages/policy/package.json",
    "packages/report-schema/package.json",
    "packages/avalanche/package.json",
    "packages/observability/package.json",
  ];

  for (const manifest of manifests) {
    const packageJson = await readJson(manifest);
    assert.equal(packageJson.private, true, `${manifest} must stay private`);
  }
});
