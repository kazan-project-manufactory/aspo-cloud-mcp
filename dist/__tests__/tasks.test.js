"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const client_js_1 = require("../client.js");
const tasks_js_1 = require("../tools/tasks.js");
vitest_1.vi.mock("../client.js", () => ({
    apiGet: vitest_1.vi.fn(),
    apiPost: vitest_1.vi.fn(),
}));
const mockApiGet = vitest_1.vi.mocked(client_js_1.apiGet);
const mockApiPost = vitest_1.vi.mocked(client_js_1.apiPost);
const handlers = {};
(0, vitest_1.beforeAll)(() => {
    const server = new mcp_js_1.McpServer({ name: "test", version: "0.0.1" });
    vitest_1.vi.spyOn(server, "tool").mockImplementation((_name, _desc, _schema, handler) => {
        handlers[_name] = handler;
        return server;
    });
    (0, tasks_js_1.registerTaskTools)(server);
});
(0, vitest_1.beforeEach)(() => {
    mockApiGet.mockReset();
    mockApiPost.mockReset();
});
(0, vitest_1.describe)("list_tasks", () => {
    (0, vitest_1.it)("calls apiGet with no params when no filters provided", async () => {
        mockApiGet.mockResolvedValueOnce({ total: 0, page: 1, count: 0, items: [] });
        await handlers["list_tasks"]({});
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledWith("/task/tasks/list", {});
    });
    (0, vitest_1.it)("passes all provided filters to apiGet", async () => {
        mockApiGet.mockResolvedValueOnce({ total: 1, page: 1, count: 1, items: [] });
        await handlers["list_tasks"]({
            responsible_id: 5,
            status: 3,
            type: 0,
            module: "crm",
            model: "lead",
            model_id: 12,
            page: 2,
        });
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledWith("/task/tasks/list", {
            responsible_id: 5,
            status: 3,
            type: 0,
            module: "crm",
            model: "lead",
            model_id: 12,
            page: 2,
        });
    });
    (0, vitest_1.it)("returns JSON-stringified result in content[0].text", async () => {
        const data = { total: 1, page: 1, count: 1, items: [{ id: 1, name: "Task A" }] };
        mockApiGet.mockResolvedValueOnce(data);
        const result = await handlers["list_tasks"]({});
        (0, vitest_1.expect)(result.content[0].type).toBe("text");
        (0, vitest_1.expect)(JSON.parse(result.content[0].text)).toEqual(data);
    });
    (0, vitest_1.it)("propagates API errors", async () => {
        mockApiGet.mockRejectedValueOnce(new Error("HTTP 401: Unauthorized"));
        await (0, vitest_1.expect)(handlers["list_tasks"]({})).rejects.toThrow("HTTP 401: Unauthorized");
    });
});
(0, vitest_1.describe)("get_task", () => {
    (0, vitest_1.it)("calls apiGet with correct path including id", async () => {
        mockApiGet.mockResolvedValueOnce({ id: 99, name: "My Task" });
        await handlers["get_task"]({ id: 99 });
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledWith("/task/tasks/get/99");
    });
    (0, vitest_1.it)("returns task data as JSON in content", async () => {
        const task = { id: 99, name: "My Task", status: 1 };
        mockApiGet.mockResolvedValueOnce(task);
        const result = await handlers["get_task"]({ id: 99 });
        (0, vitest_1.expect)(JSON.parse(result.content[0].text)).toEqual(task);
    });
});
(0, vitest_1.describe)("create_task", () => {
    (0, vitest_1.it)("calls apiPost with /task/tasks/create and provided args", async () => {
        mockApiPost.mockResolvedValueOnce({ id: 20, name: "New Task" });
        const args = { name: "New Task", responsible_id: 4, status: 1 };
        await handlers["create_task"](args);
        (0, vitest_1.expect)(mockApiPost).toHaveBeenCalledWith("/task/tasks/create", args);
    });
    (0, vitest_1.it)("returns created task as JSON in content", async () => {
        const created = { id: 20, name: "New Task" };
        mockApiPost.mockResolvedValueOnce(created);
        const result = await handlers["create_task"]({ name: "New Task" });
        (0, vitest_1.expect)(JSON.parse(result.content[0].text)).toEqual(created);
    });
});
(0, vitest_1.describe)("update_task", () => {
    (0, vitest_1.it)("separates id from body and calls apiPost with correct path", async () => {
        mockApiPost.mockResolvedValueOnce({ id: 8, name: "Updated Task" });
        await handlers["update_task"]({ id: 8, name: "Updated Task", status: 5 });
        (0, vitest_1.expect)(mockApiPost).toHaveBeenCalledWith("/task/tasks/update/8", {
            name: "Updated Task",
            status: 5,
        });
    });
    (0, vitest_1.it)("does not include id in the POST body", async () => {
        mockApiPost.mockResolvedValueOnce({ id: 8 });
        await handlers["update_task"]({ id: 8, priority: 3 });
        const body = mockApiPost.mock.calls[mockApiPost.mock.calls.length - 1][1];
        (0, vitest_1.expect)(body).not.toHaveProperty("id");
    });
});
(0, vitest_1.describe)("delete_task", () => {
    (0, vitest_1.it)("uses apiGet (not apiPost) to delete", async () => {
        mockApiGet.mockResolvedValueOnce({ id: 15 });
        await handlers["delete_task"]({ id: 15 });
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledWith("/task/tasks/delete/15");
        (0, vitest_1.expect)(mockApiPost).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("returns delete response as JSON in content", async () => {
        mockApiGet.mockResolvedValueOnce({ id: 15 });
        const result = await handlers["delete_task"]({ id: 15 });
        (0, vitest_1.expect)(JSON.parse(result.content[0].text)).toEqual({ id: 15 });
    });
});
(0, vitest_1.describe)("list_workflows", () => {
    (0, vitest_1.it)("calls apiGet /task/workflows/list with no params", async () => {
        mockApiGet.mockResolvedValueOnce({ total: 2, page: 1, count: 2, items: [] });
        await handlers["list_workflows"]({});
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledWith("/task/workflows/list");
    });
});
(0, vitest_1.describe)("list_workflow_stages", () => {
    (0, vitest_1.it)("calls apiGet with empty params when no workflow_id provided", async () => {
        mockApiGet.mockResolvedValueOnce({ total: 0, page: 1, count: 0, items: [] });
        await handlers["list_workflow_stages"]({});
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledWith("/task/stages/list", {});
    });
    (0, vitest_1.it)("passes workflow_id to apiGet when provided", async () => {
        mockApiGet.mockResolvedValueOnce({ total: 4, page: 1, count: 4, items: [] });
        await handlers["list_workflow_stages"]({ workflow_id: 2 });
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledWith("/task/stages/list", { workflow_id: 2 });
    });
});
//# sourceMappingURL=tasks.test.js.map