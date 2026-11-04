// Local run over stdio, for MCP clients that start the server themselves
// (Claude Desktop, MCP Inspector, Glama): node src/stdio.mjs.
// One JSON-RPC message per line in, one per line out. Nothing else goes to stdout.
import { createInterface } from 'node:readline';
import { handleMcp } from './mcp.mjs';

const lines = createInterface({ input: process.stdin, crlfDelay: Infinity });

for await (const line of lines) {
  if (!line.trim()) continue;
  const response = await handleMcp(new Request('http://localhost/mcp', { method: 'POST', body: line }));
  // Notifications come back empty and get no reply.
  const text = await response.text();
  if (text) process.stdout.write(`${text}\n`);
}
