// Local run on Node 18+: node src/node.mjs, then POST to http://localhost:8787/mcp.
import { createServer } from 'node:http';
import worker from './worker.mjs';

const PORT = Number(process.env.PORT ?? 8787);

createServer(async (req, res) => {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const hasBody = req.method !== 'GET' && req.method !== 'HEAD';
  const request = new Request(`http://localhost:${PORT}${req.url}`, {
    method: req.method,
    headers: req.headers,
    body: hasBody ? Buffer.concat(chunks) : undefined,
  });
  const response = await worker.fetch(request);
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(PORT, () => console.log(`MCP server on http://localhost:${PORT}/mcp`));
