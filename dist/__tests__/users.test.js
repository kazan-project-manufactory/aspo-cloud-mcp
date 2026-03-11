"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const client_js_1 = require("../client.js");
const users_js_1 = require("../tools/users.js");
vitest_1.vi.mock("../client.js", () => ({
    apiGet: vitest_1.vi.fn(),
}));
const mockApiGet = vitest_1.vi.mocked(client_js_1.apiGet);
const handlers = {};
(0, vitest_1.beforeAll)(() => {
    const server = new mcp_js_1.McpServer({ name: "test", version: "0.0.1" });
    vitest_1.vi.spyOn(server, "tool").mockImplementation((_name, _desc, _schema, handler) => {
        handlers[_name] = handler;
        return server;
    });
    (0, users_js_1.registerUserTools)(server);
});
(0, vitest_1.beforeEach)(() => {
    mockApiGet.mockReset();
});
const makeUserPage = (items, total, page = 1) => ({
    total,
    page,
    count: items.length,
    items,
});
(0, vitest_1.describe)("search_users / fetchAllUsers", () => {
    (0, vitest_1.it)("fetches a single page when total equals items count", async () => {
        const users = [
            { id: 1, name: "Alice Smith", username: "alice@example.com", role_admin: 1, role_external: 0 },
            { id: 2, name: "Bob Jones", username: "bob@example.com", role_admin: 0, role_external: 0 },
        ];
        mockApiGet.mockResolvedValueOnce(makeUserPage(users, 2));
        await handlers["search_users"]({ query: "alice" });
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledTimes(1);
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledWith("/core/user/list", { page: 1 });
    });
    (0, vitest_1.it)("fetches multiple pages until total is reached", async () => {
        const page1 = [{ id: 1, name: "Alice", username: "alice@example.com" }];
        const page2 = [{ id: 2, name: "Bob", username: "bob@example.com" }];
        mockApiGet
            .mockResolvedValueOnce(makeUserPage(page1, 2, 1))
            .mockResolvedValueOnce(makeUserPage(page2, 2, 2));
        await handlers["search_users"]({ query: "bob" });
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledTimes(2);
        (0, vitest_1.expect)(mockApiGet).toHaveBeenNthCalledWith(1, "/core/user/list", { page: 1 });
        (0, vitest_1.expect)(mockApiGet).toHaveBeenNthCalledWith(2, "/core/user/list", { page: 2 });
    });
    (0, vitest_1.it)("stops fetching when items array is empty", async () => {
        const page1 = [{ id: 1, name: "Alice", username: "alice@example.com" }];
        mockApiGet
            .mockResolvedValueOnce(makeUserPage(page1, 999, 1))
            .mockResolvedValueOnce(makeUserPage([], 999, 2));
        await handlers["search_users"]({ query: "alice" });
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledTimes(2);
    });
    (0, vitest_1.it)("filters users by case-insensitive partial name match", async () => {
        const users = [
            { id: 1, name: "Alice Smith", username: "alice@example.com", role_admin: 0, role_external: 0 },
            { id: 2, name: "Bob Jones", username: "bob@example.com", role_admin: 1, role_external: 0 },
            { id: 3, name: "ALICE Brown", username: "abrown@example.com", role_admin: 0, role_external: 1 },
        ];
        mockApiGet.mockResolvedValueOnce(makeUserPage(users, 3));
        const result = await handlers["search_users"]({ query: "alice" });
        const parsed = JSON.parse(result.content[0].text);
        (0, vitest_1.expect)(parsed).toHaveLength(2);
        (0, vitest_1.expect)(parsed.map((u) => u.id)).toEqual([1, 3]);
    });
    (0, vitest_1.it)("returns only id, name, username, role_admin, role_external fields", async () => {
        const users = [
            {
                id: 1,
                name: "Alice",
                username: "alice@example.com",
                role_admin: 1,
                role_external: 0,
                image: "avatar.png",
                last_active: "2024-01-01",
                register_date: "2023-01-01",
            },
        ];
        mockApiGet.mockResolvedValueOnce(makeUserPage(users, 1));
        const result = await handlers["search_users"]({ query: "alice" });
        const parsed = JSON.parse(result.content[0].text);
        (0, vitest_1.expect)(parsed[0]).toEqual({
            id: 1,
            name: "Alice",
            username: "alice@example.com",
            role_admin: 1,
            role_external: 0,
        });
        (0, vitest_1.expect)(parsed[0]).not.toHaveProperty("image");
        (0, vitest_1.expect)(parsed[0]).not.toHaveProperty("last_active");
    });
    (0, vitest_1.it)("returns empty array when no users match query", async () => {
        const users = [{ id: 1, name: "Alice", username: "alice@example.com" }];
        mockApiGet.mockResolvedValueOnce(makeUserPage(users, 1));
        const result = await handlers["search_users"]({ query: "zzznomatch" });
        const parsed = JSON.parse(result.content[0].text);
        (0, vitest_1.expect)(parsed).toEqual([]);
    });
    (0, vitest_1.it)("finds users by username (email) partial match", async () => {
        const users = [
            { id: 1, name: "Alice Smith", username: "alice@example.com", role_admin: 0, role_external: 0 },
            { id: 2, name: "Bob Jones", username: "bob@company.org", role_admin: 0, role_external: 0 },
        ];
        mockApiGet.mockResolvedValueOnce(makeUserPage(users, 2));
        const result = await handlers["search_users"]({ query: "company.org" });
        const parsed = JSON.parse(result.content[0].text);
        (0, vitest_1.expect)(parsed).toHaveLength(1);
        (0, vitest_1.expect)(parsed[0].id).toBe(2);
    });
});
(0, vitest_1.describe)("get_user", () => {
    (0, vitest_1.it)("calls apiGet with correct path including id", async () => {
        mockApiGet.mockResolvedValueOnce({ id: 7, name: "Alice", username: "alice@example.com" });
        await handlers["get_user"]({ id: 7 });
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledWith("/core/user/get/7");
    });
    (0, vitest_1.it)("returns user data as JSON in content", async () => {
        const user = { id: 7, name: "Alice", username: "alice@example.com", role_admin: 1 };
        mockApiGet.mockResolvedValueOnce(user);
        const result = await handlers["get_user"]({ id: 7 });
        (0, vitest_1.expect)(JSON.parse(result.content[0].text)).toEqual(user);
    });
});
//# sourceMappingURL=users.test.js.map