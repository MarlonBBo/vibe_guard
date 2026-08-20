import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { test } from 'node:test';
const packageJsonPath = new URL('../package.json', import.meta.url);
const lockfilePath = new URL('../package-lock.json', import.meta.url);
async function readJson(path) {
    return JSON.parse(await readFile(path, 'utf8'));
}
test('@spec:AC-001 npm ci has a Node 24 manifest and lockfile', async () => {
    const manifest = await readJson(packageJsonPath);
    const lockfile = await readJson(lockfilePath);
    assert.match(String(manifest.engines.node), /^>=24/);
    assert.equal(lockfile.name, manifest.name);
    assert.equal(lockfile.lockfileVersion, 3);
    assert.deepEqual(lockfile.packages && lockfile.packages[''] && lockfile.packages[''].dependencies, manifest.dependencies);
});
test('@spec:AC-002 manifest exposes the complete local quality gate', async () => {
    const manifest = await readJson(packageJsonPath);
    const scripts = manifest.scripts;
    for (const script of ['lint', 'typecheck', 'test', 'build']) {
        assert.equal(typeof scripts[script], 'string', `missing ${script} script`);
    }
});
test('@spec:AC-009 foundation manifest has no AI, LLM, or RAG dependency', async () => {
    const manifest = await readJson(packageJsonPath);
    const dependencies = {
        ...manifest.dependencies,
        ...manifest.devDependencies,
    };
    const prohibited = /(?:ai|llm|rag|openai|anthropic|langchain|embedding|vector)/i;
    assert.deepEqual(Object.keys(dependencies).filter((dependency) => prohibited.test(dependency)), []);
});
