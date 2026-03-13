import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiGet, apiPost } from "../client.js";
import { registerLeadTools } from "../tools/leads.js";

vi.mock("../client.js", () => ({
  apiGet: vi.fn(),
  apiPost: vi.fn(),
}));

const mockApiGet = vi.mocked(apiGet);
const mockApiPost = vi.mocked(apiPost);

type ToolHandler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[];
}>;

const handlers: Record<string, ToolHandler> = {};

beforeAll(() => {
  const server = new McpServer({ name: "test", version: "0.0.1" });
  // Capture each registered handler by name
  vi.spyOn(server, "tool").mockImplementation(
    (_name: string, _desc: string, _schema: unknown, handler: unknown) => {
      handlers[_name] = handler as ToolHandler;
      return {} as ReturnType<typeof server.tool>;
    }
  );
  registerLeadTools(server);
});

beforeEach(() => {
  mockApiGet.mockReset();
  mockApiPost.mockReset();
});

describe("list_leads", () => {
  it("calls apiGet with no params when no filters provided", async () => {
    mockApiGet.mockResolvedValueOnce({ total: 0, page: 1, count: 0, items: [] });

    await handlers["list_leads"]({});

    expect(mockApiGet).toHaveBeenCalledWith("/crm/lead/list", {});
  });

  it("passes filters to apiGet", async () => {
    mockApiGet.mockResolvedValueOnce({ total: 1, page: 1, count: 1, items: [{ id: 1, name: "Deal" }] });

    await handlers["list_leads"]({ pipeline_id: 3, active: 1, page: 2 });

    expect(mockApiGet).toHaveBeenCalledWith("/crm/lead/list", {
      "filter[pipeline_id]": 3,
      "filter[active]": 1,
      page: 2,
    });
  });

  it("returns JSON-stringified result in content[0].text", async () => {
    const data = { total: 1, page: 1, count: 1, items: [{ id: 7, name: "Lead A" }] };
    mockApiGet.mockResolvedValueOnce(data);

    const result = await handlers["list_leads"]({});

    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual(data);
  });

  it("propagates API errors", async () => {
    mockApiGet.mockRejectedValueOnce(new Error("HTTP 500: Internal Server Error"));

    await expect(handlers["list_leads"]({})).rejects.toThrow("HTTP 500: Internal Server Error");
  });
});

describe("get_lead", () => {
  it("calls apiGet with correct path including id", async () => {
    mockApiGet.mockResolvedValueOnce({ id: 42, name: "Big Deal" });

    await handlers["get_lead"]({ id: 42 });

    expect(mockApiGet).toHaveBeenCalledWith("/crm/lead/get/42");
  });

  it("returns lead data as JSON in content", async () => {
    const lead = { id: 42, name: "Big Deal", budget: 5000 };
    mockApiGet.mockResolvedValueOnce(lead);

    const result = await handlers["get_lead"]({ id: 42 });

    expect(JSON.parse(result.content[0].text)).toEqual(lead);
  });
});

describe("create_lead", () => {
  it("calls apiPost with /crm/lead/create and provided args", async () => {
    mockApiPost.mockResolvedValueOnce({ id: 10, name: "New Deal" });

    const args = { name: "New Deal", budget: 2000, contact_email: "test@test.com" };
    await handlers["create_lead"](args);

    expect(mockApiPost).toHaveBeenCalledWith("/crm/lead/create", args);
  });

  it("returns created lead as JSON in content", async () => {
    const created = { id: 10, name: "New Deal" };
    mockApiPost.mockResolvedValueOnce(created);

    const result = await handlers["create_lead"]({ name: "New Deal" });

    expect(JSON.parse(result.content[0].text)).toEqual(created);
  });
});

describe("update_lead", () => {
  it("separates id from body and calls apiPost with correct path", async () => {
    mockApiPost.mockResolvedValueOnce({ id: 5, name: "Updated" });

    await handlers["update_lead"]({ id: 5, name: "Updated", budget: 3000 });

    expect(mockApiPost).toHaveBeenCalledWith("/crm/lead/update/5", {
      name: "Updated",
      budget: 3000,
    });
  });

  it("does not include id in the POST body", async () => {
    mockApiPost.mockResolvedValueOnce({ id: 5, name: "Updated" });

    await handlers["update_lead"]({ id: 5, active: 2 });

    const body = mockApiPost.mock.calls[mockApiPost.mock.calls.length - 1][1];
    expect(body).not.toHaveProperty("id");
  });
});

describe("delete_lead", () => {
  it("uses apiGet (not apiPost) to delete", async () => {
    mockApiGet.mockResolvedValueOnce({ id: 3 });

    await handlers["delete_lead"]({ id: 3 });

    expect(mockApiGet).toHaveBeenCalledWith("/crm/lead/delete/3");
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("returns delete response as JSON in content", async () => {
    mockApiGet.mockResolvedValueOnce({ id: 3 });

    const result = await handlers["delete_lead"]({ id: 3 });

    expect(JSON.parse(result.content[0].text)).toEqual({ id: 3 });
  });
});

describe("list_pipelines", () => {
  it("calls apiGet /crm/pipeline/list with no params", async () => {
    mockApiGet.mockResolvedValueOnce({ total: 2, page: 1, count: 2, items: [] });

    await handlers["list_pipelines"]({});

    expect(mockApiGet).toHaveBeenCalledWith("/crm/pipeline/list");
  });
});

describe("list_pipeline_stages", () => {
  it("calls apiGet with empty params when no pipeline_id provided", async () => {
    mockApiGet.mockResolvedValueOnce({ total: 0, page: 1, count: 0, items: [] });

    await handlers["list_pipeline_stages"]({});

    expect(mockApiGet).toHaveBeenCalledWith("/crm/pipeline_stage/list", {});
  });

  it("passes pipeline_id to apiGet when provided", async () => {
    mockApiGet.mockResolvedValueOnce({ total: 3, page: 1, count: 3, items: [] });

    await handlers["list_pipeline_stages"]({ pipeline_id: 7 });

    expect(mockApiGet).toHaveBeenCalledWith("/crm/pipeline_stage/list", { "filter[pipeline_id]": 7 });
  });
});
