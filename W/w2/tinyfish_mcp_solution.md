# TinyFish MCP Configuration Fix

## Problem

MCP server 'tinyfish' has unsupported transport None

The error occurs because the `transport` field in the settings.json is set to `"http"`, which is not a valid MCP transport type.

## Root Cause

The MCP protocol supports three transport types:
- `stdio` - for child process connections
- `sse` - Server-Sent Events
- `streamable_http` - Streamable HTTP (the correct choice for HTTP/HTTPS URLs)

The value `"http"` is not recognized as a valid transport and gets normalized to `None`, causing the "unsupported transport None" error.

## Solution

Based on the official TinyFish MCP Integration documentation (docs.tinyfish.ai/mcp-integration/index.md), the correct configuration depends on your MCP client:

### For prime-agent / Generic MCP Client

Use `streamable_http` transport with the authorization header:

```json
{
  "tinyfish": {
    "transport": "streamable_http",
    "url": "https://agent.tinyfish.ai/mcp",
    "headers": {
      "Authorization": "Bearer YOUR_TINYFISH_API_KEY"
    }
  }
}
```

Or simply omit the `transport` field if your client defaults to streamable-http:

```json
{
  "tinyfish": {
    "url": "https://agent.tinyfish.ai/mcp",
    "headers": {
      "Authorization": "Bearer YOUR_TINYFISH_API_KEY"
    }
  }
}
```

### For Specific MCP Clients

| Client | Configuration |
|--------|--------------|
| **Codex** | `codex mcp add tinyfish --url https://agent.tinyfish.ai/mcp` |
| **Cursor** | Add to MCP settings: `{"url": "https://agent.tinyfish.ai/mcp"}` |
| **Claude** | Use the [TinyFish connector](https://claude.ai/directory/tinyfish) (one-tap OAuth) |
| **ChatGPT** | Use `https://agent.tinyfish.ai/mcp/chatgpt` or the official plugin |
| **Grok** | `grok mcp add --transport http tinyfish https://agent.tinyfish.ai/mcp` |
| **Command Code** | Add to `~/.commandcode/mcp.json` with API key auth |
| **OpenCode** | `opencode mcp add tinyfish --url https://agent.tinyfish.ai/mcp` |

### Authentication Required

Before the MCP server will work:

1. Get a TinyFish API key: [https://agent.tinyfish.ai/api-keys](https://agent.tinyfish.ai/api-keys)
2. Sign in to both [claude.ai](https://claude.ai) and [agent.tinyfish.ai](https://agent.tinyfish.ai) in your default browser
3. Complete the OAuth flow when connecting for the first time

### After Fix

The MCP client should successfully connect to the tinyfish server, enabling these tools:
- `search` - Web search functionality
- `fetch_content` - Fetch and extract web page content
- `run_web_automation` - Web automation capabilities
- Browser session tools

## References

- Official TinyFish MCP Integration: https://docs.tinyfish.ai/mcp-integration/index.md
- MCP Transport Types: https://github.com/modelcontextprotocol/specification
- TinyFish API Keys: https://agent.tinyfish.ai/api-keys
