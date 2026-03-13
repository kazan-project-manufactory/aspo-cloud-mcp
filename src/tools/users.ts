import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet } from "../client.js";
import { ListResponse } from "../types.js";

const MAX_PAGES = 50;

interface User {
  id: number | string;
  name: string;
  username: string;
  image?: string;
  role_admin?: number;
  role_login?: number;
  role_external?: number;
  register_date?: string;
  last_active?: string;
  [key: string]: unknown;
}

async function fetchAllUsers(): Promise<User[]> {
  const all: User[] = [];
  let page = 1;

  while (true) {
    const result = await apiGet<ListResponse<User>>("/core/user/list", { page });
    all.push(...result.items);
    if (all.length >= result.total || result.items.length === 0 || page >= MAX_PAGES) break;
    page++;
  }

  return all;
}

export function registerUserTools(server: McpServer): void {
  server.tool(
    "search_users",
    "Search users by name or email. Returns id, name and username (email) — use id as responsible_id for tasks or assignee_id for deals",
    {
      query: z.string().describe("Name or email to search for (case-insensitive partial match)"),
    },
    async (args) => {
      const users = await fetchAllUsers();
      const q = args.query.toLowerCase();
      const matched = users.filter(
        (u) => u.name?.toLowerCase().includes(q) || u.username?.toLowerCase().includes(q),
      );
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
    }
  );

  server.tool(
    "get_user",
    "Get detailed information about a user by ID",
    {
      id: z.number().describe("User ID"),
    },
    async (args) => {
      const result = await apiGet<User>(`/core/user/get/${args.id}`);
      return {
        content: [{ type: "text", text: JSON.stringify({ ...result, id: Number(result.id) }, null, 2) }],
      };
    }
  );
}
