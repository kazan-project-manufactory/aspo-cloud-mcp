"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerTaskTools = registerTaskTools;
const zod_1 = require("zod");
const client_js_1 = require("../client.js");
function registerTaskTools(server) {
    server.tool("list_tasks", "List tasks with optional filters. Status: 1=New, 3=In Progress, 4=Waiting Review, 5=Done. Type: 0=Task, 1=Inbox, 20=Event, 30=Template", {
        responsible_id: zod_1.z.number().optional().describe("Filter by responsible user ID"),
        owner_id: zod_1.z.number().optional().describe("Filter by task owner (creator) user ID"),
        status: zod_1.z.number().optional().describe("Status: 1=New, 3=In Progress, 4=Waiting Review, 5=Done"),
        type: zod_1.z.number().optional().describe("Type: 0=Task, 1=Inbox, 20=Event, 30=Template"),
        module: zod_1.z.string().optional().describe("Module binding (e.g. 'crm')"),
        model: zod_1.z.string().optional().describe("Model binding (e.g. 'lead')"),
        model_id: zod_1.z.number().optional().describe("ID of the bound object"),
        parent_id: zod_1.z.number().optional().describe("Filter by parent task ID"),
        archive_status: zod_1.z.number().optional().describe("0=Active, 10=Archived"),
        page: zod_1.z.number().optional().describe("Page number for pagination"),
    }, async (args) => {
        const params = {};
        if (args.responsible_id !== undefined)
            params.responsible_id = args.responsible_id;
        if (args.owner_id !== undefined)
            params.owner_id = args.owner_id;
        if (args.status !== undefined)
            params.status = args.status;
        if (args.type !== undefined)
            params.type = args.type;
        if (args.module !== undefined)
            params.module = args.module;
        if (args.model !== undefined)
            params.model = args.model;
        if (args.model_id !== undefined)
            params.model_id = args.model_id;
        if (args.parent_id !== undefined)
            params.parent_id = args.parent_id;
        if (args.archive_status !== undefined)
            params.archive_status = args.archive_status;
        if (args.page !== undefined)
            params.page = args.page;
        const result = await (0, client_js_1.apiGet)("/task/tasks/list", params);
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    });
    server.tool("get_task", "Get a task by ID", {
        id: zod_1.z.number().describe("Task ID"),
    }, async (args) => {
        const result = await (0, client_js_1.apiGet)(`/task/tasks/get/${args.id}`);
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    });
    server.tool("create_task", "Create a new task", {
        name: zod_1.z.string().describe("Task name"),
        description: zod_1.z.string().optional().describe("Task description"),
        responsible_id: zod_1.z.number().optional().describe("Responsible user ID"),
        owner_id: zod_1.z.number().optional().describe("Task owner (creator) user ID"),
        deadline: zod_1.z.string().optional().describe("Deadline date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)"),
        status: zod_1.z.number().optional().describe("Status: 1=New, 3=In Progress, 4=Waiting Review, 5=Done"),
        priority: zod_1.z.number().optional().describe("Priority level"),
        type: zod_1.z.number().optional().describe("Type: 0=Task, 1=Inbox, 20=Event, 30=Template"),
        parent_id: zod_1.z.number().optional().describe("Parent task ID for subtasks"),
        module: zod_1.z.string().optional().describe("Module to bind task to (e.g. 'crm')"),
        model: zod_1.z.string().optional().describe("Model to bind task to (e.g. 'lead')"),
        model_id: zod_1.z.number().optional().describe("ID of the object to bind task to"),
        workflow_id: zod_1.z.number().optional().describe("Workflow ID"),
        workflow_stage_id: zod_1.z.number().optional().describe("Workflow stage ID"),
        time_estimate: zod_1.z.number().optional().describe("Estimated time in seconds"),
        plan_start_date: zod_1.z.string().optional().describe("Planned start date (YYYY-MM-DD)"),
    }, async (args) => {
        const result = await (0, client_js_1.apiPost)("/task/tasks/create", args);
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    });
    server.tool("update_task", "Update an existing task", {
        id: zod_1.z.number().describe("Task ID to update"),
        name: zod_1.z.string().optional().describe("Task name"),
        description: zod_1.z.string().optional().describe("Task description"),
        responsible_id: zod_1.z.number().optional().describe("Responsible user ID"),
        deadline: zod_1.z.string().optional().describe("Deadline date (YYYY-MM-DD or YYYY-MM-DD HH:MM:SS)"),
        status: zod_1.z.number().optional().describe("Status: 1=New, 3=In Progress, 4=Waiting Review, 5=Done"),
        priority: zod_1.z.number().optional().describe("Priority level"),
        workflow_stage_id: zod_1.z.number().optional().describe("Workflow stage ID"),
        report: zod_1.z.string().optional().describe("Task completion report"),
        rating: zod_1.z.number().optional().describe("Rating: 1=Bad, 3=OK, 5=Good"),
        archive_status: zod_1.z.number().optional().describe("0=Active, 10=Archived"),
        time_spent: zod_1.z.number().optional().describe("Spent time in seconds"),
    }, async (args) => {
        const { id, ...data } = args;
        const result = await (0, client_js_1.apiPost)(`/task/tasks/update/${id}`, data);
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    });
    server.tool("delete_task", "Delete a task by ID", {
        id: zod_1.z.number().describe("Task ID to delete"),
    }, async (args) => {
        const result = await (0, client_js_1.apiGet)(`/task/tasks/delete/${args.id}`);
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    });
    server.tool("list_workflows", "List all task workflows", {}, async () => {
        const result = await (0, client_js_1.apiGet)("/task/workflows/list");
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    });
    server.tool("list_workflow_stages", "List workflow stages, optionally filtered by workflow", {
        workflow_id: zod_1.z.number().optional().describe("Filter by workflow ID"),
    }, async (args) => {
        const params = {};
        if (args.workflow_id !== undefined)
            params.workflow_id = args.workflow_id;
        const result = await (0, client_js_1.apiGet)("/task/stages/list", params);
        return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        };
    });
}
//# sourceMappingURL=tasks.js.map