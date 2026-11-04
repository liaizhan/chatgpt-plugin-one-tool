// Cloudflare Workers entry: the MCP endpoint is /mcp, everything else is 404.
import { handleMcp } from './mcp.mjs';

export default {
  fetch(request) {
    const { pathname } = new URL(request.url);
    if (pathname === '/mcp') return handleMcp(request);
    return new Response('Not found', { status: 404 });
  },
};
