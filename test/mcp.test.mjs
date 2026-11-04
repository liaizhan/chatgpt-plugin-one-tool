import assert from 'node:assert/strict';
import { test } from 'node:test';
import { handleMcp, PROTOCOL_VERSIONS } from '../src/mcp.mjs';
import worker from '../src/worker.mjs';

const URL_MCP = 'https://example.com/mcp';

function post(body) {
  const text = typeof body === 'string' ? body : JSON.stringify(body);
  return handleMcp(new Request(URL_MCP, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: text }));
}

async function rpc(method, params = {}) {
  const response = await post({ jsonrpc: '2.0', id: 1, method, params });
  return { status: response.status, body: await response.json() };
}

test('initialize echoes a known protocol version', async () => {
  const { body } = await rpc('initialize', { protocolVersion: '2025-06-18' });
  assert.equal(body.result.protocolVersion, '2025-06-18');
  assert.deepEqual(body.result.capabilities, { tools: { listChanged: false } });
});

test('initialize falls back to our newest version', async () => {
  const { body } = await rpc('initialize', { protocolVersion: '1999-01-01' });
  assert.equal(body.result.protocolVersion, PROTOCOL_VERSIONS[0]);
});

test('notification gets 202 and no body', async () => {
  const response = await post({ jsonrpc: '2.0', method: 'notifications/initialized' });
  assert.equal(response.status, 202);
  assert.equal(await response.text(), '');
});

test('tools/list has one read-only tool', async () => {
  const { body } = await rpc('tools/list');
  assert.equal(body.result.tools.length, 1);
  const [tool] = body.result.tools;
  assert.equal(tool.name, 'who5_score');
  assert.equal(tool.annotations.readOnlyHint, true);
  assert.equal(tool.annotations.destructiveHint, false);
  assert.equal(tool.annotations.openWorldHint, false);
});

test('who5_score returns score, band and the same JSON as text', async () => {
  const { body } = await rpc('tools/call', { name: 'who5_score', arguments: { answers: [3, 3, 2, 2, 3] } });
  assert.deepEqual(
    { score: body.result.structuredContent.score, band: body.result.structuredContent.band },
    { score: 52, band: 'normal' },
  );
  assert.deepEqual(JSON.parse(body.result.content[0].text), body.result.structuredContent);
});

test('band edges: 28 is low, 50 is reduced', async () => {
  const low = await rpc('tools/call', { name: 'who5_score', arguments: { answers: [2, 2, 1, 1, 1] } });
  assert.equal(low.body.result.structuredContent.band, 'low');
  const reduced = await rpc('tools/call', { name: 'who5_score', arguments: { answers: [3, 3, 2, 2, 2] } });
  assert.equal(reduced.body.result.structuredContent.band, 'reduced');
});

test('bad answers are a readable tool error', async () => {
  const { body } = await rpc('tools/call', { name: 'who5_score', arguments: { answers: [5, 5] } });
  assert.equal(body.result.isError, true);
  assert.match(body.result.content[0].text, /exactly 5 answers/);
});

test('protocol errors: parse, unknown method, unknown tool', async () => {
  assert.equal((await post('{oops')).status, 400);
  assert.equal((await rpc('resources/list')).body.error.code, -32601);
  assert.equal((await rpc('tools/call', { name: 'delete_everything', arguments: {} })).body.error.code, -32602);
});

test('GET is 405, OPTIONS is CORS, other paths are 404', async () => {
  assert.equal((await handleMcp(new Request(URL_MCP))).status, 405);
  const preflight = await handleMcp(new Request(URL_MCP, { method: 'OPTIONS' }));
  assert.equal(preflight.status, 204);
  assert.equal(preflight.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal((await worker.fetch(new Request('https://example.com/'))).status, 404);
});

test('oversized request is refused', async () => {
  const response = await post({ jsonrpc: '2.0', id: 1, method: 'ping', params: { pad: 'x'.repeat(40_000) } });
  assert.equal(response.status, 413);
});
