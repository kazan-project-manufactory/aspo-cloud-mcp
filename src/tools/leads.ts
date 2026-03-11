import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { apiGet, apiPost } from "../client.js";
import { ListResponse } from "../types.js";

interface Lead {
  id: number;
  name: string;
  description?: string;
  budget?: number;
  assignee_id?: number;
  pipeline_id?: number;
  pipeline_stage_id?: number;
  active?: number;
  deadline?: string;
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  [key: string]: unknown;
}

interface Pipeline {
  id: number;
  name: string;
  [key: string]: unknown;
}

interface PipelineStage {
  id: number;
  name: string;
  pipeline_id: number;
  color?: string;
  [key: string]: unknown;
}

const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MSG = "Expected format: YYYY-MM-DD";

export function registerLeadTools(server: McpServer): void {
  server.tool(
    "list_leads",
    "List CRM deals (leads) with optional filters",
    {
      pipeline_id: z.number().optional().describe("Filter by pipeline ID"),
      pipeline_stage_id: z.number().optional().describe("Filter by pipeline stage ID"),
      assignee_id: z.number().optional().describe("Filter by assignee user ID"),
      active: z.number().optional().describe("Status: 1=in progress, 2=lost, 3=won"),
      page: z.number().optional().describe("Page number for pagination"),
    },
    async (args) => {
      const params = Object.fromEntries(
        Object.entries(args).filter(([, v]) => v !== undefined),
      ) as Record<string, unknown>;

      const result = await apiGet<ListResponse<Lead>>("/crm/lead/list", params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "get_lead",
    "Get a CRM deal (lead) by ID",
    {
      id: z.number().describe("Lead ID"),
    },
    async (args) => {
      const result = await apiGet<Lead>(`/crm/lead/get/${args.id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "create_lead",
    "Create a new CRM deal (lead)",
    {
      name: z.string().describe("Deal name"),
      description: z.string().optional().describe("Deal description"),
      budget: z.number().optional().describe("Deal budget amount"),
      assignee_id: z.number().optional().describe("Responsible user ID"),
      pipeline_id: z.number().optional().describe("Pipeline ID"),
      pipeline_stage_id: z.number().optional().describe("Pipeline stage ID"),
      deadline: z.string().regex(DATE_REGEX, DATE_MSG).optional().describe("Planned closing date (YYYY-MM-DD)"),
      contact_name: z.string().optional().describe("Contact person name"),
      contact_phone: z.string().optional().describe("Contact phone"),
      contact_email: z.string().optional().describe("Contact email"),
      contact_company: z.string().optional().describe("Contact company"),
    },
    async (args) => {
      const result = await apiPost<Lead>("/crm/lead/create", args as Record<string, unknown>);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "update_lead",
    "Update an existing CRM deal (lead)",
    {
      id: z.number().describe("Lead ID to update"),
      name: z.string().optional().describe("Deal name"),
      description: z.string().optional().describe("Deal description"),
      budget: z.number().optional().describe("Deal budget amount"),
      assignee_id: z.number().optional().describe("Responsible user ID"),
      pipeline_id: z.number().optional().describe("Pipeline ID"),
      pipeline_stage_id: z.number().optional().describe("Pipeline stage ID"),
      active: z.number().optional().describe("Status: 1=in progress, 2=lost, 3=won"),
      deadline: z.string().regex(DATE_REGEX, DATE_MSG).optional().describe("Planned closing date (YYYY-MM-DD)"),
      closing_date: z.string().regex(DATE_REGEX, DATE_MSG).optional().describe("Actual closing date (YYYY-MM-DD)"),
      closing_comment: z.string().optional().describe("Closing comment"),
      closing_status_id: z.number().optional().describe("Loss reason ID (for lost deals)"),
      contact_name: z.string().optional().describe("Contact person name"),
      contact_phone: z.string().optional().describe("Contact phone"),
      contact_email: z.string().optional().describe("Contact email"),
    },
    async (args) => {
      const { id, ...data } = args;
      const result = await apiPost<Lead>(`/crm/lead/update/${id}`, data as Record<string, unknown>);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "delete_lead",
    "Delete a CRM deal (lead) by ID",
    {
      id: z.number().describe("Lead ID to delete"),
    },
    async (args) => {
      const result = await apiGet<{ id: number }>(`/crm/lead/delete/${args.id}`);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "list_pipelines",
    "List all CRM sales pipelines",
    {},
    async () => {
      const result = await apiGet<ListResponse<Pipeline>>("/crm/pipeline/list");
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );

  server.tool(
    "list_pipeline_stages",
    "List pipeline stages, optionally filtered by pipeline",
    {
      pipeline_id: z.number().optional().describe("Filter by pipeline ID"),
    },
    async (args) => {
      const params = Object.fromEntries(
        Object.entries(args).filter(([, v]) => v !== undefined),
      ) as Record<string, unknown>;

      const result = await apiGet<ListResponse<PipelineStage>>("/crm/pipeline_stage/list", params);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      };
    }
  );
}
