import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import test from 'node:test';
const root = path.resolve(import.meta.dirname, '..');
test('@spec:AC-002 documented local quality commands match the project gate', async () => {
    const readme = await readFile(path.join(root, 'README.md'), 'utf8');
    for (const command of ['npm ci', 'npm run lint', 'npm run typecheck', 'npm test', 'npm run build']) {
        assert.match(readme, new RegExp(command.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')));
    }
});
test('@spec:AC-008 CI installs from the lockfile and runs the complete Node 24 gate', async () => {
    const workflow = await readFile(path.join(root, '.github', 'workflows', 'ci.yml'), 'utf8');
    assert.match(workflow, /^  push:/m);
    assert.match(workflow, /^  pull_request:/m);
    assert.match(workflow, /actions\/setup-node@v4/);
    assert.match(workflow, /node-version: 24/);
    for (const command of ['npm ci', 'npm run lint', 'npm run typecheck', 'npm test', 'npm run build']) {
        assert.match(workflow, new RegExp(`- run: ${command.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}`));
    }
});
