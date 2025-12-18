# Bright Data MCP Setup Guide

## Installation Complete

The Bright Data MCP server has been installed and configured for Claude Code.

### Package Details
- **Package**: `@brightdata/mcp` v2.7.1
- **Location**: Global npm installation
- **Binary**: `mcp` (available at `/home/runner/workspace/.config/npm/node_global/bin/mcp`)

## Configuration

The MCP server is configured in `~/.claude.json`:

```json
{
  "mcpServers": {
    "brightdata": {
      "type": "stdio",
      "command": "npx",
      "args": ["@brightdata/mcp"],
      "env": {
        "API_TOKEN": "${BRIGHTDATA_API_TOKEN}",
        "PRO_MODE": "true"
      }
    }
  }
}
```

## Getting Your API Token

1. Go to [Bright Data Dashboard](https://brightdata.com/cp)
2. Sign up or log in to your account
3. Navigate to **Settings** → **API tokens**
4. Create a new API token
5. Copy the token

## Setting Up the API Token

### Option 1: Environment Variable
```bash
export BRIGHTDATA_API_TOKEN="your-api-token-here"
```

Add to your shell profile (`~/.bashrc`, `~/.zshrc`) for persistence.

### Option 2: Direct Configuration
Edit `~/.claude.json` and replace `${BRIGHTDATA_API_TOKEN}` with your actual token:

```json
"env": {
  "API_TOKEN": "your-actual-api-token-here",
  "PRO_MODE": "true"
}
```

## Available Tools

### Free Tier (5,000 requests/month)
- `search_engine` - Google, Bing, Yandex search
- `scrape_as_markdown` - Convert webpages to markdown
- `search_engine_batch` - Bulk search queries
- `scrape_batch` - Bulk webpage scraping

### Pro Mode (PRO_MODE=true)
Enables 60+ tools organized by groups:

| Group | Tools |
|-------|-------|
| `ecommerce` | Amazon, Walmart, eBay, Best Buy, Etsy, Zara, Home Depot, Google Shopping |
| `social` | LinkedIn, TikTok, Instagram, Facebook, YouTube, X (Twitter), Reddit |
| `browser` | Scraping browser automation (navigate, click, type, screenshot) |
| `finance` | Yahoo Finance business data |
| `business` | Crunchbase, ZoomInfo, Google Maps, Zillow, Booking.com |
| `research` | GitHub repositories, Reuters news |
| `app_stores` | Google Play Store, Apple App Store |
| `travel` | Booking.com hotel listings |
| `advanced_scraping` | Batch operations, HTML scraping, data extraction |

## Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `API_TOKEN` | **Required** - Your Bright Data API token | - |
| `PRO_MODE` | Enable all 60+ tools | `false` |
| `GROUPS` | Comma-separated tool groups (e.g., `ecommerce,social`) | All if PRO_MODE |
| `TOOLS` | Comma-separated specific tools | - |
| `RATE_LIMIT` | Request throttling (e.g., `100/1h`) | - |
| `WEB_UNLOCKER_ZONE` | Custom Web Unlocker zone | `mcp_unlocker` |
| `BROWSER_ZONE` | Custom Browser zone | `mcp_browser` |

## Selective Tool Configuration

To enable only specific tool groups:

```json
"env": {
  "API_TOKEN": "your-token",
  "GROUPS": "ecommerce,social,browser"
}
```

To enable only specific tools:

```json
"env": {
  "API_TOKEN": "your-token",
  "TOOLS": "search_engine,scrape_as_markdown,web_data_amazon_product"
}
```

## Hosted Server Alternative

Instead of local installation, you can use Bright Data's hosted MCP server:

```
https://mcp.brightdata.com/mcp?token=YOUR_API_TOKEN_HERE
```

## Testing the Integration

After setting up your API token, restart Claude Code or run:
```bash
claude mcp list
```

## Troubleshooting

### "Cannot run MCP server without API_TOKEN env"
- Ensure `BRIGHTDATA_API_TOKEN` environment variable is set
- Or add the token directly in `~/.claude.json`

### Rate Limit Exceeded
- Free tier: 5,000 requests/month
- Create a custom Web Unlocker zone for more capacity

## Resources

- [Bright Data MCP Documentation](https://docs.brightdata.com/mcp-server/overview)
- [GitHub Repository](https://github.com/brightdata/brightdata-mcp)
- [Bright Data Dashboard](https://brightdata.com/cp)
