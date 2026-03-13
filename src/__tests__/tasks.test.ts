import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiGet, apiPost } from "../client.js";
import { registerTaskTools } from "../tools/tasks.js";

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
  vi.spyOn(server, "tool").mockImplementation(
    (_name: string, _desc: string, _schema: unknown, handler: unknown) => {
      handlers[_name] = handler as ToolHandler;
      return server;
    }
  );
  registerTaskTools(server);
});

beforeEach(() => {
  mockApiGet.mockReset();
  mockApiPost.mockReset();
});

describe("list_tasks", () => {
  it("calls apiGet with no params when no filters provided", async () => {
    mockApiGet.mockResolvedValueOnce({ total: 0, page: 1, count: 0, items: [] });

    await handlers["list_tasks"]({});

    expect(mockApiGet).toHaveBeenCalledWith("/task/tasks/list", {});
  });

  it("passes all provided filters to apiGet", async () => {
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

    expect(mockApiGet).toHaveBeenCalledWith("/task/tasks/list", {
      "filter[responsible_id]": 5,
      "filter[status]": 3,
      "filter[type]": 0,
      "filter[module]": "crm",
      "filter[model]": "lead",
      "filter[model_id]": 12,
      page: 2,
    });
  });

  it("returns JSON-stringified result in content[0].text", async () => {
    const data = { total: 1, page: 1, count: 1, items: [{ id: 1, name: "Task A" }] };
    mockApiGet.mockResolvedValueOnce(data);

    const result = await handlers["list_tasks"]({});

    expect(result.content[0].type).toBe("text");
    expect(JSON.parse(result.content[0].text)).toEqual(data);
  });

  it("propagates API errors", async () => {
    mockApiGet.mockRejectedValueOnce(new Error("HTTP 401: Unauthorized"));

    await expect(handlers["list_tasks"]({})).rejects.toThrow("HTTP 401: Unauthorized");
  });
});

describe("get_task", () => {
  it("calls apiGet with correct path including id", async () => {
    mockApiGet.mockResolvedValueOnce({ id: 99, name: "My Task" });

    await handlers["get_task"]({ id: 99 });

    expect(mockApiGet).toHaveBeenCalledWith("/task/tasks/get/99");
  });

  it("returns task data as JSON in content", async () => {
    const task = { id: 99, name: "My Task", status: 1 };
    mockApiGet.mockResolvedValueOnce(task);

    const result = await handlers["get_task"]({ id: 99 });

    expect(JSON.parse(result.content[0].text)).toEqual(task);
  });
});

describe("create_task", () => {
  it("calls apiPost with /task/tasks/create and provided args", async () => {
    mockApiPost.mockResolvedValueOnce({ id: 20, name: "New Task" });

    const args = { name: "New Task", responsible_id: 4, status: 1 };
    await handlers["create_task"](args);

    expect(mockApiPost).toHaveBeenCalledWith("/task/tasks/create", args);
  });

  it("returns created task as JSON in content", async () => {
    const created = { id: 20, name: "New Task" };
    mockApiPost.mockResolvedValueOnce(created);

    const result = await handlers["create_task"]({ name: "New Task" });

    expect(JSON.parse(result.content[0].text)).toEqual(created);
  });
});

describe("update_task", () => {
  it("separates id from body and calls apiPost with correct path", async () => {
    mockApiPost.mockResolvedValueOnce({ id: 8, name: "Updated Task" });

    await handlers["update_task"]({ id: 8, name: "Updated Task", status: 5 });

    expect(mockApiPost).toHaveBeenCalledWith("/task/tasks/update/8", {
      name: "Updated Task",
      status: 5,
    });
  });

  it("does not include id in the POST body", async () => {
    mockApiPost.mockResolvedValueOnce({ id: 8 });

    await handlers["update_task"]({ id: 8, priority: 3 });

    const body = mockApiPost.mock.calls[mockApiPost.mock.calls.length - 1][1];
    expect(body).not.toHaveProperty("id");
  });
});

describe("delete_task", () => {
  it("uses apiGet (not apiPost) to delete", async () => {
    mockApiGet.mockResolvedValueOnce({ id: 15 });

    await handlers["delete_task"]({ id: 15 });

    expect(mockApiGet).toHaveBeenCalledWith("/task/tasks/delete/15");
    expect(mockApiPost).not.toHaveBeenCalled();
  });

  it("returns delete response as JSON in content", async () => {
    mockApiGet.mockResolvedValueOnce({ id: 15 });

    const result = await handlers["delete_task"]({ id: 15 });

    expect(JSON.parse(result.content[0].text)).toEqual({ id: 15 });
  });
});

describe("list_workflows", () => {
  it("calls apiGet /task/workflows/list with no params", async () => {
    mockApiGet.mockResolvedValueOnce({ total: 2, page: 1, count: 2, items: [] });

    await handlers["list_workflows"]({});

    expect(mockApiGet).toHaveBeenCalledWith("/task/workflows/list");
  });
});

describe("list_workflow_stages", () => {
  it("calls apiGet with empty params when no workflow_id provided", async () => {
    mockApiGet.mockResolvedValueOnce({ total: 0, page: 1, count: 0, items: [] });

    await handlers["list_workflow_stages"]({});

    expect(mockApiGet).toHaveBeenCalledWith("/task/stages/list", {});
  });

  it("passes workflow_id to apiGet when provided", async () => {
    mockApiGet.mockResolvedValueOnce({ total: 4, page: 1, count: 4, items: [] });

    await handlers["list_workflow_stages"]({ workflow_id: 2 });

    expect(mockApiGet).toHaveBeenCalledWith("/task/stages/list", { "filter[workflow_id]": 2 });
  });
});
