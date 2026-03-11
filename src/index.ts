#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { registerLeadTools } from "./tools/leads.js";
import { registerTaskTools } from "./tools/tasks.js";
import { registerUserTools } from "./tools/users.js";

const server = new McpServer({
  name: "aspo-cloud-mcp",
  version: "1.0.0",
});

registerLeadTools(server);
registerTaskTools(server);
registerUserTools(server);

async function main(): Promise<void> {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
