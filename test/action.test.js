import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { chmodSync, cpSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';

const project = fileURLToPath(new URL('../', import.meta.url));
const fixtures = [
  {
    name: 'auto increment preserves the version name',
    inputs: {}, code: '1436', version: '1.2.3',
  },
  {
    name: 'explicit code and name remove the previous stage',
    originalVersion: '1.2.3-beta.1435',
    inputs: { versionCode: '42', versionName: '2.0.0' },
    code: '42', version: '2.0.0',
  },
  {
    name: 'stage uses the incremented version code',
    inputs: { versionStage: 'beta' },
    code: '1436', version: '1.2.3-beta.1436',
  },
  {
    name: 'limiter changes the stage suffix and preserves the full code',
    inputs: { versionCode: '20000345', versionCodeLimiter: '3', versionStage: 'alpha' },
    code: '20000345', version: '1.2.3-alpha.345',
  },
  {
    name: 'Kotlin assignments accept a new name, stage, and metadata',
    assignment: ' =',
    inputs: { versionCode: '42', versionName: '7.8.9', versionStage: 'rc', versionMetaInfo: '+debug.123' },
    code: '42', version: '7.8.9-rc.42+debug.123',
  },
  {
    name: 'stage replacement supports single quoted version names',
    quote: "'", originalVersion: '1.2.3-beta.1435',
    inputs: { versionStage: 'rc' },
    code: '1436', version: '1.2.3-rc.1436',
  },
  {
    name: 'metadata is appended without replacing the existing stage',
    originalVersion: '1.2.3-beta.1435',
    inputs: { versionMetaInfo: '+debug.123' },
    code: '1436', version: '1.2.3-beta.1435+debug.123',
  },
  {
    name: 'Kotlin auto increment preserves surrounding content',
    assignment: ' =',
    inputs: {}, code: '1436', version: '1.2.3',
  },
];

function gradleContent(code, version, assignment = '', quote = '"') {
  return `android {\n  defaultConfig {\n    applicationId = "com.example.app"\n    versionCode${assignment} ${code}\n    versionName${assignment} ${quote}${version}${quote}\n  }\n}\n`;
}

function readOutputs(path) {
  const lines = readFileSync(path, 'utf8').trimEnd().split(/\r?\n/);
  const outputs = {};
  for (let index = 0; index < lines.length;) {
    const [name, delimiter] = lines[index++].split('<<');
    assert.ok(delimiter, 'output must use the GitHub Actions file format');
    const value = [];
    while (index < lines.length && lines[index] !== delimiter) {
      value.push(lines[index++]);
    }
    assert.equal(lines[index++], delimiter);
    outputs[name] = value.join('\n');
  }
  return outputs;
}

for (const target of ['source', 'bundle']) {
  function run(t, fixture, { readOnly = false } = {}) {
    const directory = mkdtempSync(join(tmpdir(), 'advance-android-test-'));
    t.after(() => rmSync(directory, { recursive: true, force: true }));
    let entry = join(project, 'index.js');
    if (target === 'bundle') {
      // A release must execute without the project's node_modules directory.
      cpSync(join(project, 'dist'), join(directory, 'dist'), { recursive: true });
      entry = join(directory, 'dist/index.js');
    }
    const gradlePath = join(directory, 'build.gradle');
    const outputPath = join(directory, 'output');
    writeFileSync(outputPath, '');
    if (fixture) {
      writeFileSync(gradlePath, gradleContent('1435', fixture.originalVersion ?? '1.2.3', fixture.assignment, fixture.quote));
      if (readOnly) chmodSync(gradlePath, 0o444);
    }
    const env = { ...process.env, GITHUB_OUTPUT: outputPath };
    for (const name of ['gradlePath', 'versionCode', 'versionCodeLimiter', 'versionName', 'versionStage', 'versionMetaInfo']) {
      env[`INPUT_${name.toUpperCase()}`] = name === 'gradlePath' ? gradlePath : fixture?.inputs[name] ?? '';
    }
    const result = spawnSync(process.execPath, [entry], {
      cwd: directory, env, encoding: 'utf8', timeout: 10_000,
    });
    assert.ifError(result.error);
    return { result, outputPath, gradlePath };
  }

  for (const fixture of fixtures) {
    test(`${target}: ${fixture.name}`, (t) => {
      const { result, outputPath, gradlePath } = run(t, fixture);
      assert.equal(result.status, 0, result.stdout + result.stderr);
      assert.deepEqual(readOutputs(outputPath), {
        lastestVersionCode: fixture.code,
        latestVersionName: `"${fixture.version}"`,
        latestVersionNameWithoutStage: fixture.version.split(/[-+]/)[0],
        result: 'Done',
      });
      assert.equal(readFileSync(gradlePath, 'utf8'), gradleContent(fixture.code, fixture.version, fixture.assignment));
    });
  }

  test(`${target}: missing Gradle file fails the action`, (t) => {
    const { result, outputPath } = run(t);
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /::error::.*ENOENT/);
    assert.equal(readFileSync(outputPath, 'utf8'), '');
  });

  test(`${target}: an unwritable Gradle file fails without reporting success`, (t) => {
    const { result, outputPath, gradlePath } = run(t, fixtures[0], { readOnly: true });
    assert.equal(result.status, 1, result.stdout + result.stderr);
    assert.match(result.stdout, /::error::.*EACCES/);
    assert.equal(readOutputs(outputPath).result, undefined);
    assert.equal(readFileSync(gradlePath, 'utf8'), gradleContent('1435', '1.2.3'));
  });
}
