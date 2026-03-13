import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost } from "../client.js";
import { ListResponse } from "../types.js";

interface Task {
  id: number;
  name: string;
  description?: string;
  status?: number;
  type?: number;
  responsible_id?: number;
  owner_id?: number;
  deadline?: string;
  priority?: number;
  module?: string;
  model?: string;
  model_id?: number;
  workflow_id?: number;
  workflow_stage_id?: number;
  [key: string]: unknown;
}

interface Workflow {
  id: number;
  name: string;
  [key: string]: unknown;
}

interface WorkflowStage {
  id: number;
  name: string;
  workflow_id: number;
  task_status?: number;
  color?: string;
  [key: string]: unknown;
}

const DEADLINE_REGEX = /^\d{4}-\d{2}-\d{2}( \d{2}:\d{2}:\d{2})?$/;
const DEADLINE_MSG = "Expected YYYY-MM-DD or YYYY-MM-DD HH:MM:SS";
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MSG = "Expected format: YYYY-MM-DD";

export function registerTaskTools(server: McpServer): void {
  server.tool(
    "list_tasks",
    `List tasks with optional filters.

Status values (use 'status' param):
  1 = New (created but not started — most tasks accumulate here as backlog)
  3 = In Progress (actively being worked on right now)
  4 = Waiting Review (done by assignee, pending verification)
  5 = Done (completed but not yet archived)

IMPORTANT: 'archive_status=0' means NOT archived — it does NOT mean incomplete.
A task can be status=5 (Done) and archive_status=0 at the same time.
To find tasks truly in progress, use status=3.
To find all incomplete tasks, use status values 1, 3, or 4 (separately or combined).

Type values: 0=Task, 1=Inbox, 20=Event, 30=Template`,
    {
      responsible_id: z.coerce.number().optional().describe("Filter by responsible user ID"),
      owner_id: z.coerce.number().optional().describe("Filter by task owner (creator) user ID"),
      status: z.coerce.number().optional().describe("Status: 1=New (backlog), 3=In Progress, 4=Waiting Review, 5=Done. Use 3 for 'currently working on', use 1 for backlog."),
      type: z.coerce.number().optional().describe("Type: 0=Task, 1=Inbox, 20=Event, 30=Template"),
      module: z.string().optional().describe("Module binding (e.g. 'crm')"),
      model: z.string().optional().describe("Model binding (e.g. 'lead')"),
      model_id: z.coerce.number().optional().describe("ID of the bound object"),
      parent_id: z.coerce.number().optional().describe("Filter by parent task ID"),
      archive_status: z.coerce.number().optional().describe("0=Not archived (includes Done tasks!), 10=Archived. Omit to get all tasks regardless of archive state."),
      page: z.coerce.number().optional().describe("Page number for pagination"),
    },
    async (args) => {
      const { page, ...filters } = args;
      const params: Record<string, unknown> = {};
      if (page !== undefined) params.page = page;
      for (const [key, value] of Object.entries(filters)) {
        if (value !== undefined) params[`filter[${key}]`] = value;
      }

      const result = await apiGet<ListResponse<Task>>("/task/tasks/list", params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "get_task",
    "Get a task by ID",
    {
      id: z.number().describe("Task ID"),
    },
    async (args) => {
      const result = await apiGet<Task>(`/task/tasks/get/${args.id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "create_task",
    "Create a new task",
    {
      name: z.string().describe("Task name"),
      description: z.string().optional().describe("Task description"),
      responsible_id: z.number().optional().describe("Responsible user ID"),
      owner_id: z.number().optional().describe("Task owner (creator) user ID"),
      deadline: z.string().regex(DEADLINE_REGEX, DEADLINE_MSG).optional().describe("Deadline date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)"),
      status: z.number().optional().describe("Status: 1=New, 3=In Progress, 4=Waiting Review, 5=Done"),
      priority: z.number().optional().describe("Priority level"),
      type: z.number().optional().describe("Type: 0=Task, 1=Inbox, 20=Event, 30=Template"),
      parent_id: z.number().optional().describe("Parent task ID for subtasks"),
      module: z.string().optional().describe("Module to bind task to (e.g. 'crm')"),
      model: z.string().optional().describe("Model to bind task to (e.g. 'lead')"),
      model_id: z.number().optional().describe("ID of the object to bind task to"),
      workflow_id: z.number().optional().describe("Workflow ID"),
      workflow_stage_id: z.number().optional().describe("Workflow stage ID"),
      time_estimate: z.number().optional().describe("Estimated time in seconds"),
      plan_start_date: z.string().regex(DATE_REGEX, DATE_MSG).optional().describe("Planned start date (YYYY-MM-DD)"),
    },
    async (args) => {
      const result = await apiPost<Task>("/task/tasks/create", args as Record<string, unknown>);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "update_task",
    "Update an existing task",
    {
      id: z.number().describe("Task ID to update"),
      name: z.string().optional().describe("Task name"),
      description: z.string().optional().describe("Task description"),
      responsible_id: z.number().optional().describe("Responsible user ID"),
      deadline: z.string().regex(DEADLINE_REGEX, DEADLINE_MSG).optional().describe("Deadline date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)"),
      status: z.number().optional().describe("Status: 1=New, 3=In Progress, 4=Waiting Review, 5=Done"),
      priority: z.number().optional().describe("Priority level"),
      workflow_stage_id: z.number().optional().describe("Workflow stage ID"),
      report: z.string().optional().describe("Task completion report"),
      rating: z.number().optional().describe("Rating: 1=Bad, 3=OK, 5=Good"),
      archive_status: z.number().optional().describe("0=Active, 10=Archived"),
      time_spent: z.number().optional().describe("Spent time in seconds"),
    },
    async (args) => {
      const { id, ...data } = args;
      const result = await apiPost<Task>(`/task/tasks/update/${id}`, data as Record<string, unknown>);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_task",
    "Delete a task by ID",
    {
      id: z.number().describe("Task ID to delete"),
    },
    async (args) => {
      const result = await apiGet<{ id: number }>(`/task/tasks/delete/${args.id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "list_workflows",
    "List all task workflows",
    {},
    async () => {
      const result = await apiGet<ListResponse<Workflow>>("/task/workflows/list");
      return {
        content: [{ type: "text", text: JSON.stringify(result.items, null, 2) }],
      };
    }
  );

  server.tool(
    "list_workflow_stages",
    "List workflow stages, optionally filtered by workflow",
    {
      workflow_id: z.number().optional().describe("Filter by workflow ID"),
    },
    async (args) => {
      const params: Record<string, unknown> = {};
      if (args.workflow_id !== undefined) params["filter[workflow_id]"] = args.workflow_id;

      const result = await apiGet<ListResponse<WorkflowStage>>("/task/stages/list", params);
      return {
        content: [{ type: "text", text: JSON.stringify(result.items, null, 2) }],
      };
    }
  );
}
