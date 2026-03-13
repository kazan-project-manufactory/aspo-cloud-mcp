import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiGet } from "../client.js";
import { registerUserTools } from "../tools/users.js";

vi.mock("../client.js", () => ({
  apiGet: vi.fn(),
}));

const mockApiGet = vi.mocked(apiGet);

type ToolHandler = (args: Record<string, unknown>) => Promise<{
  content: { type: string; text: string }[];
}>;

const handlers: Record<string, ToolHandler> = {};

beforeAll(() => {
  const server = new McpServer({ name: "test", version: "0.0.1" });
  vi.spyOn(server, "tool").mockImplementation(
    (_name: string, _desc: string, _schema: unknown, handler: unknown) => {
      handlers[_name] = handler as ToolHandler;
      return {} as ReturnType<typeof server.tool>;
    }
  );
  registerUserTools(server);
});

beforeEach(() => {
  mockApiGet.mockReset();
});

const makeUserPage = (items: object[], total: number, page = 1) => ({
  total,
  page,
  count: items.length,
  items,
});

describe("search_users / fetchAllUsers", () => {
  it("fetches a single page when total equals items count", async () => {
    const users = [
      { id: 1, name: "Alice Smith", username: "alice@example.com", role_admin: 1, role_external: 0 },
      { id: 2, name: "Bob Jones", username: "bob@example.com", role_admin: 0, role_external: 0 },
    ];
    mockApiGet.mockResolvedValueOnce(makeUserPage(users, 2));

    await handlers["search_users"]({ query: "alice" });

    expect(mockApiGet).toHaveBeenCalledTimes(1);
    expect(mockApiGet).toHaveBeenCalledWith("/core/user/list", { page: 1 });
  });

  it("fetches multiple pages until total is reached", async () => {
    const page1 = [{ id: 1, name: "Alice", username: "alice@example.com" }];
    const page2 = [{ id: 2, name: "Bob", username: "bob@example.com" }];
    mockApiGet
      .mockResolvedValueOnce(makeUserPage(page1, 2, 1))
      .mockResolvedValueOnce(makeUserPage(page2, 2, 2));

    await handlers["search_users"]({ query: "bob" });

    expect(mockApiGet).toHaveBeenCalledTimes(2);
    expect(mockApiGet).toHaveBeenNthCalledWith(1, "/core/user/list", { page: 1 });
    expect(mockApiGet).toHaveBeenNthCalledWith(2, "/core/user/list", { page: 2 });
  });

  it("stops fetching when items array is empty", async () => {
    const page1 = [{ id: 1, name: "Alice", username: "alice@example.com" }];
    mockApiGet
      .mockResolvedValueOnce(makeUserPage(page1, 999, 1))
      .mockResolvedValueOnce(makeUserPage([], 999, 2));

    await handlers["search_users"]({ query: "alice" });

    expect(mockApiGet).toHaveBeenCalledTimes(2);
  });

  it("filters users by case-insensitive partial name match", async () => {
    const users = [
      { id: 1, name: "Alice Smith", username: "alice@example.com", role_admin: 0, role_external: 0 },
      { id: 2, name: "Bob Jones", username: "bob@example.com", role_admin: 1, role_external: 0 },
      { id: 3, name: "ALICE Brown", username: "abrown@example.com", role_admin: 0, role_external: 1 },
    ];
    mockApiGet.mockResolvedValueOnce(makeUserPage(users, 3));

    const result = await handlers["search_users"]({ query: "alice" });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed).toHaveLength(2);
    expect(parsed.map((u: { id: number }) => u.id)).toEqual([1, 3]);
  });

  it("returns only id, name, username, role_admin, role_external fields", async () => {
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

    expect(parsed[0]).toEqual({
      id: 1,
      name: "Alice",
      username: "alice@example.com",
      role_admin: 1,
      role_external: 0,
    });
    expect(parsed[0]).not.toHaveProperty("image");
    expect(parsed[0]).not.toHaveProperty("last_active");
  });

  it("returns empty array when no users match query", async () => {
    const users = [{ id: 1, name: "Alice", username: "alice@example.com" }];
    mockApiGet.mockResolvedValueOnce(makeUserPage(users, 1));

    const result = await handlers["search_users"]({ query: "zzznomatch" });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed).toEqual([]);
  });

  it("finds users by username (email) partial match", async () => {
    const users = [
      { id: 1, name: "Alice Smith", username: "alice@example.com", role_admin: 0, role_external: 0 },
      { id: 2, name: "Bob Jones", username: "bob@company.org", role_admin: 0, role_external: 0 },
    ];
    mockApiGet.mockResolvedValueOnce(makeUserPage(users, 2));

    const result = await handlers["search_users"]({ query: "company.org" });
    const parsed = JSON.parse(result.content[0].text);

    expect(parsed).toHaveLength(1);
    expect(parsed[0].id).toBe(2);
  });
});

describe("get_user", () => {
  it("calls apiGet with correct path including id", async () => {
    mockApiGet.mockResolvedValueOnce({ id: 7, name: "Alice", username: "alice@example.com" });

    await handlers["get_user"]({ id: 7 });

    expect(mockApiGet).toHaveBeenCalledWith("/core/user/get/7");
  });

  it("returns user data as JSON in content", async () => {
    const user = { id: 7, name: "Alice", username: "alice@example.com", role_admin: 1 };
    mockApiGet.mockResolvedValueOnce(user);

    const result = await handlers["get_user"]({ id: 7 });

    expect(JSON.parse(result.content[0].text)).toEqual(user);
  });
});
