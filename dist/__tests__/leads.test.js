"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const client_js_1 = require("../client.js");
const leads_js_1 = require("../tools/leads.js");
vitest_1.vi.mock("../client.js", () => ({
    apiGet: vitest_1.vi.fn(),
    apiPost: vitest_1.vi.fn(),
}));
const mockApiGet = vitest_1.vi.mocked(client_js_1.apiGet);
const mockApiPost = vitest_1.vi.mocked(client_js_1.apiPost);
const handlers = {};
(0, vitest_1.beforeAll)(() => {
    const server = new mcp_js_1.McpServer({ name: "test", version: "0.0.1" });
    // Capture each registered handler by name
    vitest_1.vi.spyOn(server, "tool").mockImplementation((_name, _desc, _schema, handler) => {
        handlers[_name] = handler;
        return {};
    });
    (0, leads_js_1.registerLeadTools)(server);
});
(0, vitest_1.beforeEach)(() => {
    mockApiGet.mockReset();
    mockApiPost.mockReset();
});
(0, vitest_1.describe)("list_leads", () => {
    (0, vitest_1.it)("calls apiGet with no params when no filters provided", async () => {
        mockApiGet.mockResolvedValueOnce({ total: 0, page: 1, count: 0, items: [] });
        await handlers["list_leads"]({});
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledWith("/crm/lead/list", {});
    });
    (0, vitest_1.it)("passes filters to apiGet", async () => {
        mockApiGet.mockResolvedValueOnce({ total: 1, page: 1, count: 1, items: [{ id: 1, name: "Deal" }] });
        await handlers["list_leads"]({ pipeline_id: 3, active: 1, page: 2 });
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledWith("/crm/lead/list", {
            "filter[pipeline_id]": 3,
            "filter[active]": 1,
            page: 2,
        });
    });
    (0, vitest_1.it)("returns JSON-stringified result in content[0].text", async () => {
        const data = { total: 1, page: 1, count: 1, items: [{ id: 7, name: "Lead A" }] };
        mockApiGet.mockResolvedValueOnce(data);
        const result = await handlers["list_leads"]({});
        (0, vitest_1.expect)(result.content[0].type).toBe("text");
        (0, vitest_1.expect)(JSON.parse(result.content[0].text)).toEqual(data);
    });
    (0, vitest_1.it)("propagates API errors", async () => {
        mockApiGet.mockRejectedValueOnce(new Error("HTTP 500: Internal Server Error"));
        await (0, vitest_1.expect)(handlers["list_leads"]({})).rejects.toThrow("HTTP 500: Internal Server Error");
    });
});
(0, vitest_1.describe)("get_lead", () => {
    (0, vitest_1.it)("calls apiGet with correct path including id", async () => {
        mockApiGet.mockResolvedValueOnce({ id: 42, name: "Big Deal" });
        await handlers["get_lead"]({ id: 42 });
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledWith("/crm/lead/get/42");
    });
    (0, vitest_1.it)("returns lead data as JSON in content", async () => {
        const lead = { id: 42, name: "Big Deal", budget: 5000 };
        mockApiGet.mockResolvedValueOnce(lead);
        const result = await handlers["get_lead"]({ id: 42 });
        (0, vitest_1.expect)(JSON.parse(result.content[0].text)).toEqual(lead);
    });
});
(0, vitest_1.describe)("create_lead", () => {
    (0, vitest_1.it)("calls apiPost with /crm/lead/create and provided args", async () => {
        mockApiPost.mockResolvedValueOnce({ id: 10, name: "New Deal" });
        const args = { name: "New Deal", budget: 2000, contact_email: "test@test.com" };
        await handlers["create_lead"](args);
        (0, vitest_1.expect)(mockApiPost).toHaveBeenCalledWith("/crm/lead/create", args);
    });
    (0, vitest_1.it)("returns created lead as JSON in content", async () => {
        const created = { id: 10, name: "New Deal" };
        mockApiPost.mockResolvedValueOnce(created);
        const result = await handlers["create_lead"]({ name: "New Deal" });
        (0, vitest_1.expect)(JSON.parse(result.content[0].text)).toEqual(created);
    });
});
(0, vitest_1.describe)("update_lead", () => {
    (0, vitest_1.it)("separates id from body and calls apiPost with correct path", async () => {
        mockApiPost.mockResolvedValueOnce({ id: 5, name: "Updated" });
        await handlers["update_lead"]({ id: 5, name: "Updated", budget: 3000 });
        (0, vitest_1.expect)(mockApiPost).toHaveBeenCalledWith("/crm/lead/update/5", {
            name: "Updated",
            budget: 3000,
        });
    });
    (0, vitest_1.it)("does not include id in the POST body", async () => {
        mockApiPost.mockResolvedValueOnce({ id: 5, name: "Updated" });
        await handlers["update_lead"]({ id: 5, active: 2 });
        const body = mockApiPost.mock.calls[mockApiPost.mock.calls.length - 1][1];
        (0, vitest_1.expect)(body).not.toHaveProperty("id");
    });
});
(0, vitest_1.describe)("delete_lead", () => {
    (0, vitest_1.it)("uses apiGet (not apiPost) to delete", async () => {
        mockApiGet.mockResolvedValueOnce({ id: 3 });
        await handlers["delete_lead"]({ id: 3 });
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledWith("/crm/lead/delete/3");
        (0, vitest_1.expect)(mockApiPost).not.toHaveBeenCalled();
    });
    (0, vitest_1.it)("returns delete response as JSON in content", async () => {
        mockApiGet.mockResolvedValueOnce({ id: 3 });
        const result = await handlers["delete_lead"]({ id: 3 });
        (0, vitest_1.expect)(JSON.parse(result.content[0].text)).toEqual({ id: 3 });
    });
});
(0, vitest_1.describe)("list_pipelines", () => {
    (0, vitest_1.it)("calls apiGet /crm/pipeline/list with no params", async () => {
        mockApiGet.mockResolvedValueOnce({ total: 2, page: 1, count: 2, items: [] });
        await handlers["list_pipelines"]({});
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledWith("/crm/pipeline/list");
    });
});
(0, vitest_1.describe)("list_pipeline_stages", () => {
    (0, vitest_1.it)("calls apiGet with empty params when no pipeline_id provided", async () => {
        mockApiGet.mockResolvedValueOnce({ total: 0, page: 1, count: 0, items: [] });
        await handlers["list_pipeline_stages"]({});
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledWith("/crm/pipeline_stage/list", {});
    });
    (0, vitest_1.it)("passes pipeline_id to apiGet when provided", async () => {
        mockApiGet.mockResolvedValueOnce({ total: 3, page: 1, count: 3, items: [] });
        await handlers["list_pipeline_stages"]({ pipeline_id: 7 });
        (0, vitest_1.expect)(mockApiGet).toHaveBeenCalledWith("/crm/pipeline_stage/list", { "filter[pipeline_id]": 7 });
    });
});
//# sourceMappingURL=leads.test.js.map