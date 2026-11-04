import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { test } from 'node:test';

// Starts src/stdio.mjs, sends the lines, closes stdin and returns the parsed replies.
async function talk(lines) {
  const child = spawn(process.execPath, ['src/stdio.mjs'], { stdio: ['pipe', 'pipe', 'inherit'] });
  let out = '';
  child.stdout.on('data', (chunk) => (out += chunk));
  child.stdin.end(lines.map((l) => (typeof l === 'string' ? l : JSON.stringify(l))).join('\n') + '\n');
  await once(child, 'close');
  return out.trim().split('\n').filter(Boolean).map((l) => JSON.parse(l));
}

test('stdio answers requests line by line and skips notifications', async () => {
  const replies = await talk([
    { jsonrpc: '2.0', id: 1, method: 'initialize', params: { protocolVersion: '2025-06-18' } },
    { jsonrpc: '2.0', method: 'notifications/initialized' },
    { jsonrpc: '2.0', id: 2, method: 'tools/call', params: { name: 'who5_score', arguments: { answers: [3, 3, 2, 2, 3] } } },
  ]);
  assert.equal(replies.length, 2);
  assert.equal(replies[0].result.serverInfo.name, 'who5-one-tool');
  assert.deepEqual(replies[1].result.structuredContent, { score: 52, band: 'normal', message: 'The score is in the usual range.' });
});

test('stdio returns a parse error for a broken line', async () => {
  const [reply] = await talk(['{not json']);
  assert.equal(reply.error.code, -32700);
});
