# Aspro Cloud MCP

MCP server for [Aspro Cloud](https://aspro.cloud) — work with CRM deals and tasks directly from AI assistants (Claude, Cursor, etc.).

## Tools

### Deals (CRM)
| Tool | Description |
|---|---|
| `list_leads` | List deals with filters (pipeline, stage, assignee, status) |
| `get_lead` | Get deal details by ID |
| `create_lead` | Create a new deal |
| `update_lead` | Update an existing deal |
| `delete_lead` | Delete a deal |
| `list_pipelines` | List all sales pipelines |
| `list_pipeline_stages` | List pipeline stages |

### Tasks
| Tool | Description |
|---|---|
| `list_tasks` | List tasks with filters (responsible, status, type, module binding) |
| `get_task` | Get task details by ID |
| `create_task` | Create a new task |
| `update_task` | Update an existing task |
| `delete_task` | Delete a task |
| `list_workflows` | List all task workflows |
| `list_workflow_stages` | List workflow stages |

### Users
| Tool | Description |
|---|---|
| `search_users` | Search users by name (returns `id` for use in responsible_id / assignee_id) |
| `get_user` | Get user details by ID |

## Setup

### Prerequisites

- Node.js 18+
- Aspro Cloud account with API access
- API key from your Aspro Cloud settings

### Configuration

Two environment variables are required:

| Variable | Description | Example |
|---|---|---|
| `ASPRO_COMPANY` | Your company subdomain | `mycompany` |
| `ASPRO_API_KEY` | API key from Aspro Cloud settings | `abc123...` |

Your company subdomain is the part before `.aspro.cloud` in your workspace URL.

## Usage in Cursor

Add to your Cursor MCP configuration (`~/.cursor/mcp.json` or `.cursor/mcp.json` in your project):

### Via npx (recommended, no installation needed)

```json
{
  "mcpServers": {
    "aspro-cloud": {
      "command": "npx",
      "args": ["-y", "github:kazan-project-manufactory/aspo-cloud-mcp"],
      "env": {
        "ASPRO_COMPANY": "your_company",
        "ASPRO_API_KEY": "your_api_key"
      }
    }
  }
}
```

### Via local path (if cloned)

```bash
git clone https://github.com/kazan-project-manufactory/aspo-cloud-mcp.git
cd aspo-cloud-mcp
npm install
```

```json
{
  "mcpServers": {
    "aspro-cloud": {
      "command": "node",
      "args": ["/path/to/aspo-cloud-mcp/dist/index.js"],
      "env": {
        "ASPRO_COMPANY": "your_company",
        "ASPRO_API_KEY": "your_api_key"
      }
    }
  }
}
```

## Usage in Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS):

```json
{
  "mcpServers": {
    "aspro-cloud": {
      "command": "npx",
      "args": ["-y", "github:kazan-project-manufactory/aspo-cloud-mcp"],
      "env": {
        "ASPRO_COMPANY": "your_company",
        "ASPRO_API_KEY": "your_api_key"
      }
    }
  }
}
```

## Example prompts

```
Find user Ivan Petrov and assign him a task to prepare the contract by Friday
```

```
Show me all open deals in the "New Clients" pipeline
```

```
Create a deal "Website Redesign" for client Vasily Sidorov with budget 150000
```

```
List all tasks assigned to me that are in progress
```

## Development

```bash
npm run build    # compile TypeScript
npm run dev      # watch mode
```

## License

MIT
