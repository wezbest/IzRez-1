# MCP Server Issues and Solutions

## Summary of Issues

| Server | Status | Error |
|--------|--------|-------|
| **exa** | Connected but tool calls fail | `401: Invalid API key` |
| **firecrawl** | Connected but tool calls fail | `IP address looks suspicious, requires API key` |
| **tinyfish** | Not connected | `unsupported transport None` |

---

## 1. Exa - Invalid API Key (401)

### Error
```
McpToolError web_search_exa error (401): Invalid API key
Timestamp: 2026-09-19T22:51:00.328Z
```

### Root Cause
The Exa MCP server connects successfully, but the underlying Exa API requires a valid API key which is not configured in the environment.

### Solution
**Get an Exa API key:**
1. Sign up at [https://exa.ai](https://exa.ai)
2. Get your API key from the dashboard
2. Add it to your environment:
   ```bash
   export EXA_API_KEY="your-api-key-here"
   ```
3. Or configure it in Prime Agent settings via `/login` → MCP Connections → Exa

### Verification
After setting the API key, test with:
```python
import rlm.mcp as rmcp
result = await rmcp.call_tool("exa", "web_search_exa", {"query": "test", "num_results": 1})
```

---

## 2. Firecrawl - IP Address Suspicious / Requires API Key

### Error
```
McpToolError Tool 'firecrawl_scrape' execution failed: Unfortunately, your IP address looks suspicious, so Firecrawl can't be used without an API key from here. Sign up for a free API key at https://firecrawl.dev for 1000 credits and higher rate limits for free.
```

### Root Cause
The Firecrawl MCP server connects, but the underlying Firecrawl service:
1. Blocks requests from suspicious IP addresses (cloud/datacenter IPs)
2. Requires an API key for authenticated access

### Solution
**Get a Firecrawl API key:**
1. Sign up at [https://firecrawl.dev](https://firecrawl.dev) (1000 free credits)
2. Get your API key from the dashboard
3. Add it to your environment:
   ```bash
   export FIRECRAWL_API_KEY="your-api-key-here"
   ```
4. Or configure it in Prime Agent settings via `/login` → MCP Connections → Firecrawl

**Alternative:** Use the Firecrawl auth endpoint for agents:
- [https://firecrawl.dev/auth.md](https://firecrawl.dev/auth.md)

### Verification
After setting the API key, test with:
```python
import rlm.mcp as rmcp
result = await rmcp.call_tool("firecrawl", "firecrawl_scrape", {"url": "https://example.com"})
```

---

## 3. Tinyfish - Unsupported Transport None

### Error
```
ValueError MCP server 'tinyfish' has unsupported transport None
```

### Root Cause
The settings.json has `"transport": "http"` which is not a valid MCP transport type. Valid MCP transports are:
- `stdio` - for child processes
- `sse` - Server-Sent Events
- `streamable_http` - Streamable HTTP (correct for HTTPS URLs)

The invalid transport `"http"` gets normalized to `None`, causing the error.

### Solution
**Fix the settings.json configuration:**

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

**Or use the Prime Agent CLI to add it:**
```bash
# For prime-agent
# Configure via /login → MCP Connections → Tinyfish
```

**Get a TinyFish API key:**
1. Sign in at [https://agent.tinyfish.ai/api-keys](https://agent.tinyfish.ai/api-keys)
2. The `TINYFISH_API_KEY` environment variable is already configured
3. Ensure you're signed in to both [claude.ai](https://claude.ai) and [agent.tinyfish.ai](https://agent.tinyfish.ai) in your default browser before connecting

### Official Documentation
- TinyFish MCP Integration: [https://docs.tinyfish.ai/mcp-integration/index.md](https://docs.tinyfish.ai/mcp-integration/index.md)
- For specific clients (Cursor, Codex, Claude Code, etc.) see the "Quick Install" section on that page

---

## Environment Variables Check

Currently configured:
- ✅ `TINYFISH_API_KEY` - Set
- ❌ `EXA_API_KEY` - **Missing**
- ❌ `FIRECRAWL_API_KEY` - **Missing**

### To Fix All Issues
```bash
# Add to your shell profile or environment
export EXA_API_KEY="your-exa-key"
export FIRECRAWL_API_KEY="your-firecrawl-key"
# TINYFISH_API_KEY is already set
```

Then restart the Prime Agent session or reload the MCP connections.

---

## Quick Reference: MCP Transport Types

| Transport | Use Case |
|-----------|----------|
| `stdio` | Local subprocess servers |
| `sse` | Legacy HTTP streaming servers |
| `streamable_http` | Modern HTTP/SSE servers (most cloud MCP servers) |
| `"http"` | **INVALID** - Not a valid MCP transport |

---

## References

- [MCP Specification - Transports](https://github.com/modelcontextprotocol/specification)
- [Exa API Docs](https://docs.exa.ai/)
- [Firecrawl API Docs](https://docs.firecrawl.dev/)
- [TinyFish MCP Integration](https://docs.tinyfish.ai/mcp-integration/index.md)
- [Prime Agent MCP Connections](/login → MCP Connections)
