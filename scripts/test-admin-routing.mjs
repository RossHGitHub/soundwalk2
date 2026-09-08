import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import handler from '../api/auth.ts';

const cases = [
  ['GET', 401, 'Missing admin token.'],
  ['DELETE', 405, 'Method not allowed'],
];

async function request(query, method, origin = 'https://soundwalk.uk') {
  let status, body;
  await handler({ query, method, headers: { origin }, body: {} }, {
    status(value) { status = value; return this; },
    json(value) { body = value; return this; },
    setHeader() {},
  });
  return { status, body };
}

for (const [method, status, error] of cases) {
  assert.deepEqual(await request({}, method), { status, body: { error } });
  assert.equal((await request({}, method, 'https://untrusted.example')).status, 403);
}

function entrypoints(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith('_') || entry.name.startsWith('.')) return [];
    const path = new URL(entry.name + (entry.isDirectory() ? '/' : ''), directory);
    return entry.isDirectory() ? entrypoints(path) : /\.(ts|js)$/.test(entry.name) ? [path.pathname] : [];
  });
}
const functions = entrypoints(new URL('../api/', import.meta.url));
assert.ok(functions.length <= 12, `Function budget exceeded: ${functions.length}/12`);
console.log(`Auth method/origin guards passed; ${functions.length}/12 function entrypoints.`);
