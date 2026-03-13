"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerLeadTools = registerLeadTools;
const zod_1 = require("zod");
const client_js_1 = require("../client.js");
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MSG = "Expected format: YYYY-MM-DD";
function registerLeadTools(server) {
    server.tool("list_leads", "List CRM deals (leads) with optional filters", {
        pipeline_id: zod_1.z.number().optional().describe("Filter by pipeline ID"),
        pipeline_stage_id: zod_1.z.number().optional().describe("Filter by pipeline stage ID"),
        assignee_id: zod_1.z.number().optional().describe("Filter by assignee user ID"),
        active: zod_1.z.number().optional().describe("Status: 1=in progress, 2=lost, 3=won"),
        page: zod_1.z.number().optional().describe("Page number for pagination"),
    }, async (args) => {
        const { page, ...filters } = args;
        const params = {};
        if (page !== undefined)
            params.page = page;
        for (const [key, value] of Object.entries(filters)) {
            if (value !== undefined)
                params[`filter[${key}]`] = value;
        }
        const result = await (0, client_js_1.apiGet)("/crm/lead/list", params);
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    });
    server.tool("get_lead", "Get a CRM deal (lead) by ID", {
        id: zod_1.z.number().describe("Lead ID"),
    }, async (args) => {
        const result = await (0, client_js_1.apiGet)(`/crm/lead/get/${args.id}`);
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    });
    server.tool("create_lead", "Create a new CRM deal (lead)", {
        name: zod_1.z.string().describe("Deal name"),
        description: zod_1.z.string().optional().describe("Deal description"),
        budget: zod_1.z.number().optional().describe("Deal budget amount"),
        assignee_id: zod_1.z.number().optional().describe("Responsible user ID"),
        pipeline_id: zod_1.z.number().optional().describe("Pipeline ID"),
        pipeline_stage_id: zod_1.z.number().optional().describe("Pipeline stage ID"),
        deadline: zod_1.z.string().regex(DATE_REGEX, DATE_MSG).optional().describe("Planned closing date (YYYY-MM-DD)"),
        contact_name: zod_1.z.string().optional().describe("Contact person name"),
        contact_phone: zod_1.z.string().optional().describe("Contact phone"),
        contact_email: zod_1.z.string().optional().describe("Contact email"),
        contact_company: zod_1.z.string().optional().describe("Contact company"),
    }, async (args) => {
        const result = await (0, client_js_1.apiPost)("/crm/lead/create", args);
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    });
    server.tool("update_lead", "Update an existing CRM deal (lead)", {
        id: zod_1.z.number().describe("Lead ID to update"),
        name: zod_1.z.string().optional().describe("Deal name"),
        description: zod_1.z.string().optional().describe("Deal description"),
        budget: zod_1.z.number().optional().describe("Deal budget amount"),
        assignee_id: zod_1.z.number().optional().describe("Responsible user ID"),
        pipeline_id: zod_1.z.number().optional().describe("Pipeline ID"),
        pipeline_stage_id: zod_1.z.number().optional().describe("Pipeline stage ID"),
        active: zod_1.z.number().optional().describe("Status: 1=in progress, 2=lost, 3=won"),
        deadline: zod_1.z.string().regex(DATE_REGEX, DATE_MSG).optional().describe("Planned closing date (YYYY-MM-DD)"),
        closing_date: zod_1.z.string().regex(DATE_REGEX, DATE_MSG).optional().describe("Actual closing date (YYYY-MM-DD)"),
        closing_comment: zod_1.z.string().optional().describe("Closing comment"),
        closing_status_id: zod_1.z.number().optional().describe("Loss reason ID (for lost deals)"),
        contact_name: zod_1.z.string().optional().describe("Contact person name"),
        contact_phone: zod_1.z.string().optional().describe("Contact phone"),
        contact_email: zod_1.z.string().optional().describe("Contact email"),
    }, async (args) => {
        const { id, ...data } = args;
        const result = await (0, client_js_1.apiPost)(`/crm/lead/update/${id}`, data);
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    });
    server.tool("delete_lead", "Delete a CRM deal (lead) by ID", {
        id: zod_1.z.number().describe("Lead ID to delete"),
    }, async (args) => {
        const result = await (0, client_js_1.apiGet)(`/crm/lead/delete/${args.id}`);
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    });
    server.tool("list_pipelines", "List all CRM sales pipelines", {}, async () => {
        const result = await (0, client_js_1.apiGet)("/crm/pipeline/list");
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    });
    server.tool("list_pipeline_stages", "List pipeline stages, optionally filtered by pipeline", {
        pipeline_id: zod_1.z.number().optional().describe("Filter by pipeline ID"),
    }, async (args) => {
        const params = {};
        if (args.pipeline_id !== undefined)
            params["filter[pipeline_id]"] = args.pipeline_id;
        const result = await (0, client_js_1.apiGet)("/crm/pipeline_stage/list", params);
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    });
}
//# sourceMappingURL=leads.js.map