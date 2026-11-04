# chatgpt-plugin-one-tool

[![DOI](https://zenodo.org/badge/DOI/10.5281/zenodo.23961717.svg)](https://doi.org/10.5281/zenodo.23961717)

A minimal MCP server with one read-only tool, written to show how small a ChatGPT plugin server can be.
No framework, no dependencies, no sign-in, no storage. About 150 lines of code and 10 tests.

It comes with [REVIEW.md](REVIEW.md): the step-by-step story of how our plugin
[Ladder by Aizhan Li](https://chatgpt.com/plugins/plugin_asdk_app_6ada41b9737081919d0b0cd3b582b3c4)
went through OpenAI review and was approved for the ChatGPT plugin directory on 4 November 2026.
In Russian: [REVIEW.ru.md](REVIEW.ru.md).

This repository does not contain the code of the Ladder plugin or of 108psy.com.
It is a teaching example built on the same pattern.

## The tool

`who5_score` scores the [WHO-5 Well-Being Index](https://github.com/liaizhan/ladder-who5):
five answers from 0 to 5 give a score from 0 to 100 and a band (low, reduced, normal).
The score is not a diagnosis, and the tool description tells the model so.

Why this tool: it is deterministic, needs no network or model, and still shows the parts reviewers
look at: a clear description of when to use the tool and when not to, an input schema, an output schema,
annotations, readable errors and safe wording for a low result.

## Run it

```bash
npm test
npm start
```

Then call it:

```bash
curl -s -X POST http://localhost:8787/mcp -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/call","params":{"name":"who5_score","arguments":{"answers":[3,3,2,2,3]}}}'
```

Deploy to Cloudflare Workers with `npx wrangler deploy`. The endpoint is `/mcp`.
You can also open it in [MCP Inspector](https://github.com/modelcontextprotocol/inspector).

## Files

- `src/tool.mjs`: the tool definition and the scoring. Start reading here.
- `src/mcp.mjs`: JSON-RPC over Streamable HTTP: `initialize`, `ping`, `tools/list`, `tools/call`.
- `src/worker.mjs`: Cloudflare Workers entry.
- `src/node.mjs`: local run on Node 18+.
- `example/plugin.json`, `example/mcp.json`: a submission package template with review test cases.
- `test/mcp.test.mjs`: protocol and tool tests (`node --test`).

## Design choices

- **Stateless.** Each POST is one JSON-RPC message. No sessions, so any instance can answer.
- **Plain JSON, no SSE.** The MCP spec allows a JSON response to a POST. GET returns 405.
- **Tool errors are results.** Wrong input returns `isError: true` with a sentence the model can fix.
  Protocol errors (unknown method, unknown tool) are JSON-RPC errors.
- **Read-only annotations.** `readOnlyHint: true`, `destructiveHint: false`, `openWorldHint: false`.
- **Nothing is logged.** The server never writes the answers anywhere.

## About the method

The Ladder method, its structure and pilot data are described in a preprint (in Russian):

Li, A. (2026). Онлайн-самопроверка внутренних препятствий на пути к цели: структура, операционализация и пилотные данные методики «Лестница». Zenodo. https://doi.org/10.5281/zenodo.23960425

## Author

Aizhan Li, author of the Ladder method, [108psy.com](https://108psy.com/en).
The plugin, the site and this repository were built by one person with Claude Code.

## License

MIT, see [LICENSE](LICENSE). WHO-5 is by the WHO Collaborating Centre in Mental Health;
this repository contains only its scoring rule, not the item wording.
