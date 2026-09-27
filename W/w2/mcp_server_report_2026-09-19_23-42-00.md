# MCP Server Services Test Report

**Generated:** 2026-09-19 23:42:00

## Executive Summary

| Server | Enabled | Config | Test Status | Tools |
|--------|---------|--------|-------------|-------|
| agentql | Yes | In mcp_services.json | **PASS** | 1 |
| exa | Yes | In mcp_services.json | **PASS** | 4 |
| firecrawl | Yes | In mcp_services.json | **PARTIAL** (402 Payment Required) | 22 |
| tinyfish | Yes | Not in config | **FAIL** (Port 3711 in use) | 0 |
| contrastapi | No | In mcp_services.json | Not tested (disabled) | 55 |
| QuranAI | No | In mcp_services.json | Not tested (disabled) | 4+ |

## Detailed Results

### 1. agentql — **PASS**

**Tool:** `extract-web-data` — Extracts structured data as JSON from a web page given a URL using a Natural Language description.

**Test call:**
```json
{ "url": "https://example.com", "prompt": "Extract the title and main heading of the page" }
```

**Result:** Returned `{"page_title": "Example Domain"}` — service responsive and functional.

### 2. exa — **PASS**

**Tools:** `web_search_exa`, `web_search_advanced_exa`, `web_fetch_exa`, `agent_run`

**Test call 1 (search):** `web_search_exa` query: "model context protocol", numResults: 2 — PASSED, returned search results with highlights.

**Test call 2 (fetch):** `web_fetch_exa` URLs: ["https://example.com"], maxCharacters: 500 — PASSED, returned page content as markdown.

### 3. firecrawl — **PARTIAL** (HTTP 402 Payment Required)

**Tools (22):** firecrawl_scrape, firecrawl_map, firecrawl_search, firecrawl_crawl, firecrawl_check_crawl_status, firecrawl_agent, firecrawl_agent_status, firecrawl_interact, firecrawl_interact_stop, firecrawl_parse, firecrawl_monitor_create, firecrawl_monitor_list, firecrawl_monitor_get, firecrawl_monitor_update, firecrawl_monitor_delete, firecrawl_monitor_run, firecrawl_monitor_checks, firecrawl_monitor_check, firecrawl_research_search_papers, firecrawl_research_inspect_paper, firecrawl_research_related_papers, firecrawl_research_read_paper, firecrawl_research_search_github, firecrawl_developer_search

**Test call:** `firecrawl_search` query: "MCP model context protocol", limit: 2, categories: ["developer"]

**Result:** HTTP 402 — Insufficient credits. Service endpoint is reachable and responsive but free tier exhausted; requires paid plan or added credits.

### 4. tinyfish — **FAIL** (Port Conflict)

**Error:**
```
MCP stdio server failed during startup (MCPError: Connection closed).
Stderr: tinyfish-mcp [error] Port 3711 is already in use — stop the other process or set PORT to a free port
```

**Status:** MCP server failed to start. Port 3711 is occupied by another process; server cannot bind.

## Disabled Servers (Present in Config, Not Enabled in Environment)

### contrastapi
**Tools:** 55 (domain intelligence, email security, web security, vulnerability management, MITRE ATLAS/D3FEND, IOC/threat intel, code security, identity, network)
**Note:** Comprehensive security/OSINT toolkit. Not available in current MCP environment.

### QuranAI
**Tools:** 4+ (list_editions, fetch_quran, fetch_translation, fetch_tafsir)
**Note:** Quranic text, translation, and tafsir retrieval with grounding rules. Not available in current MCP environment.

## Recommendations

1. **tinyfish:** Resolve port 3711 conflict by stopping the occupying process or configuring tinyfish to use a different PORT.
2. **firecrawl:** Add API credits or upgrade plan to unlock full functionality (currently blocked by 402 Payment Required).
3. **Monitoring:** Implement periodic health checks for enabled MCP servers to detect startup/port conflicts early.
4. **Optional:** Evaluate enabling `contrastapi` and `QuranAI` if their specialized toolsets are needed.

*Report generated automatically by MCP server enumeration and testing script.*
*All tests performed with bounded timeouts (max 1 minute per call).*