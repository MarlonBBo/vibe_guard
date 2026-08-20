import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';

const packageJsonPath = new URL('../package.json', import.meta.url);
const lockfilePath = new URL('../package-lock.json', import.meta.url);

async function readJson(path: URL): Promise<Record<string, unknown>> {
  return JSON.parse(await readFile(path, 'utf8')) as Record<string, unknown>;
}

test('@spec:AC-001 npm ci has a Node 24 manifest and lockfile', async () => {
  const manifest = await readJson(packageJsonPath);
  const lockfile = await readJson(lockfilePath);

  assert.match(String((manifest.engines as Record<string, unknown>).node), /^>=24/);
  assert.equal(lockfile.name, manifest.name);
  assert.equal(lockfile.lockfileVersion, 3);
  assert.deepEqual(lockfile.packages && (lockfile.packages as Record<string, unknown>)[''] && ((lockfile.packages as Record<string, unknown>)[''] as Record<string, unknown>).dependencies, manifest.dependencies);
});

test('@spec:AC-002 manifest exposes the complete local quality gate', async () => {
  const manifest = await readJson(packageJsonPath);
  const scripts = manifest.scripts as Record<string, unknown>;

  for (const script of ['lint', 'typecheck', 'test', 'build']) {
    assert.equal(typeof scripts[script], 'string', `missing ${script} script`);
  }
});

test('@spec:AC-009 foundation manifest has no AI, LLM, or RAG dependency', async () => {
  const manifest = await readJson(packageJsonPath);
  const dependencies = {
    ...(manifest.dependencies as Record<string, unknown>),
    ...(manifest.devDependencies as Record<string, unknown>),
  };
  const prohibited = /(?:ai|llm|rag|openai|anthropic|langchain|embedding|vector)/i;

  assert.deepEqual(
    Object.keys(dependencies).filter((dependency) => prohibited.test(dependency)),
    [],
  );
});
