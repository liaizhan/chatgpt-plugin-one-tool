// A minimal MCP server over Streamable HTTP, without sessions and without sign-in.
// Every POST is one JSON-RPC message; we answer with plain JSON (the spec allows it)
// and never open an SSE stream, so GET gets 405.
// Works on any runtime with the web Request and Response classes:
// Cloudflare Workers, Deno, Bun, Node 18+.

import { InvalidAnswers, scoreWho5, TOOL } from './tool.mjs';

/** Protocol versions we understand, newest first. */
export const PROTOCOL_VERSIONS = ['2025-11-25', '2025-06-18', '2025-03-26'];
const MAX_BODY_BYTES = 32 * 1024;

const SERVER_INFO = { name: 'who5-one-tool', version: '1.0.0' };
const INSTRUCTIONS =
  'This server has one read-only tool, who5_score. Ask the five WHO-5 items one at a time, ' +
  'then call the tool with the five answers. Never present the score as a diagnosis.';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept, Mcp-Protocol-Version, Mcp-Session-Id',
};
const JSON_HEADERS = { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' };

// JSON-RPC 2.0 error codes.
const PARSE_ERROR = -32700;
const INVALID_REQUEST = -32600;
const METHOD_NOT_FOUND = -32601;
const INVALID_PARAMS = -32602;

const json = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
const error = (id, code, message, status = 200) => json({ jsonrpc: '2.0', id, error: { code, message } }, status);

export async function handleMcp(request) {
  if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: { ...CORS, Allow: 'POST, OPTIONS' } });
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).length > MAX_BODY_BYTES) return error(null, INVALID_REQUEST, 'Request too large', 413);

  let message;
  try {
    message = JSON.parse(text);
  } catch {
    return error(null, PARSE_ERROR, 'Parse error', 400);
  }
  if (!message || message.jsonrpc !== '2.0' || typeof message.method !== 'string') {
    return error(message?.id ?? null, INVALID_REQUEST, 'Invalid request', 400);
  }
  // Notifications have no id and get no body.
  if (message.id === undefined) return new Response(null, { status: 202, headers: CORS });

  const { id, method, params = {} } = message;
  switch (method) {
    case 'initialize': {
      const asked = params.protocolVersion;
      return json({
        jsonrpc: '2.0',
        id,
        result: {
          protocolVersion: PROTOCOL_VERSIONS.includes(asked) ? asked : PROTOCOL_VERSIONS[0],
          capabilities: { tools: { listChanged: false } },
          serverInfo: SERVER_INFO,
          instructions: INSTRUCTIONS,
        },
      });
    }
    case 'ping':
      return json({ jsonrpc: '2.0', id, result: {} });
    case 'tools/list':
      return json({ jsonrpc: '2.0', id, result: { tools: [TOOL] } });
    case 'tools/call':
      return callTool(id, params);
    default:
      return error(id, METHOD_NOT_FOUND, `Method not found: ${method}`);
  }
}

function callTool(id, params) {
  if (params.name !== TOOL.name) return error(id, INVALID_PARAMS, `Unknown tool: ${params.name}`);
  try {
    const result = scoreWho5(params.arguments);
    return json({
      jsonrpc: '2.0',
      id,
      result: { content: [{ type: 'text', text: JSON.stringify(result) }], structuredContent: result },
    });
  } catch (e) {
    if (!(e instanceof InvalidAnswers)) throw e;
    // Bad input is a tool error the model can read and fix, not a protocol error.
    return json({ jsonrpc: '2.0', id, result: { isError: true, content: [{ type: 'text', text: e.message }] } });
  }
}
