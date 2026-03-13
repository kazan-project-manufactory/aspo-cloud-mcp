"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUserTools = registerUserTools;
const zod_1 = require("zod");
const client_js_1 = require("../client.js");
const MAX_PAGES = 50;
async function fetchAllUsers() {
    const all = [];
    let page = 1;
    while (true) {
        const result = await (0, client_js_1.apiGet)("/core/user/list", { page });
        all.push(...result.items);
        if (all.length >= result.total || result.items.length === 0 || page >= MAX_PAGES)
            break;
        page++;
    }
    return all;
}
function registerUserTools(server) {
    server.tool("search_users", "Search users by name or email. Returns id, name and username (email) — use id as responsible_id for tasks or assignee_id for deals", {
        query: zod_1.z.string().describe("Name or email to search for (case-insensitive partial match)"),
    }, async (args) => {
        const users = await fetchAllUsers();
        const q = args.query.toLowerCase();
        const matched = users.filter((u) => u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q));
        const result = matched.map((u) => ({
            id: Number(u.id),
            name: u.name,
            username: u.username,
            role_admin: u.role_admin,
            role_external: u.role_external,
        }));
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    });
    server.tool("get_user", "Get detailed information about a user by ID", {
        id: zod_1.z.number().describe("User ID"),
    }, async (args) => {
        const result = await (0, client_js_1.apiGet)(`/core/user/get/${args.id}`);
        return {
            content: [{ type: "text", text: JSON.stringify({ ...result, id: Number(result.id) }, null, 2) }],
        };
    });
}
//# sourceMappingURL=users.js.map