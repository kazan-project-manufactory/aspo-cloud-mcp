#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const leads_js_1 = require("./tools/leads.js");
const tasks_js_1 = require("./tools/tasks.js");
const users_js_1 = require("./tools/users.js");
const server = new mcp_js_1.McpServer({
    name: "aspo-cloud-mcp",
    version: "1.0.0",
});
(0, leads_js_1.registerLeadTools)(server);
(0, tasks_js_1.registerTaskTools)(server);
(0, users_js_1.registerUserTools)(server);
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
}
main().catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
});
//# sourceMappingURL=index.js.map