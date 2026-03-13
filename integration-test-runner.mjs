import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const results = [];
const vars = {};

function record(num, method, status, details) {
  results.push({ num, method, status, details });
}

async function callTool(client, name, args = {}) {
  const res = await client.callTool({ name, arguments: args });
  if (res.isError) throw new Error(res.content?.[0]?.text || "MCP tool error");
  const text = res.content?.[0]?.text;
  if (!text) throw new Error("Empty response from tool");
  return JSON.parse(text);
}

async function runTests() {
  const transport = new StdioClientTransport({
    command: "node",
    args: ["/Users/timurv/src/kpm/aspo-cloud-mcp/dist/index.js"],
    env: {
      ...process.env,
      ASPRO_COMPANY: "kazan-project-manufactory",
      ASPRO_API_KEY: "UThESnJ2MWlNRnpMeGJMSTlqWTZlT0xwMmVqY2RkR0VfMTIxMDI0",
    },
  });

  const client = new Client({ name: "integration-test", version: "1.0.0" });
  await client.connect(transport);
  console.log("Connected to MCP server\n");

  // Test 1: search_users
  try {
    const data = await callTool(client, "search_users", { query: "" });
    if (!Array.isArray(data)) throw new Error("Response is not an array");
    if (data.length > 0) {
      for (const u of data) {
        if (typeof u.id !== "number") throw new Error(`user.id is not a number: ${u.id}`);
        if (typeof u.name !== "string") throw new Error(`user.name is not a string`);
        if (typeof u.username !== "string") throw new Error(`user.username is not a string`);
      }
    }
    vars.first_user_id = data.length > 0 ? data[0].id : null;
    record(1, "search_users", "PASS", `найдено ${data.length} пользователей`);
  } catch (e) {
    vars.first_user_id = null;
    record(1, "search_users", "FAIL", e.message);
  }

  // Test 2: get_user
  if (vars.first_user_id === null) {
    record(2, "get_user", "SKIP", "search_users не вернул пользователей");
  } else {
    try {
      const data = await callTool(client, "get_user", { id: vars.first_user_id });
      if (!data || typeof data !== "object") throw new Error("Response is not an object");
      if (data.id !== vars.first_user_id) throw new Error(`id mismatch: expected ${vars.first_user_id}, got ${data.id}`);
      if (typeof data.name !== "string") throw new Error("name is not a string");
      if (typeof data.username !== "string") throw new Error("username is not a string");
      record(2, "get_user", "PASS", `пользователь id=${data.id}, name="${data.name}"`);
    } catch (e) {
      record(2, "get_user", "FAIL", e.message);
    }
  }

  // Test 3: list_tasks
  try {
    const data = await callTool(client, "list_tasks", {});
    if (!data || typeof data !== "object") throw new Error("Response is not an object");
    if (!Array.isArray(data.items)) throw new Error("items is not an array");
    if (typeof data.total !== "number") throw new Error("total is not a number");
    if (typeof data.page !== "number") throw new Error("page is not a number");
    vars.first_task_id = data.items.length > 0 ? data.items[0].id : null;
    record(3, "list_tasks", "PASS", `total=${data.total}, items на странице=${data.items.length}`);
  } catch (e) {
    vars.first_task_id = null;
    record(3, "list_tasks", "FAIL", e.message);
  }

  // Test 4: get_task
  if (vars.first_task_id === null) {
    record(4, "get_task", "SKIP", "list_tasks не вернул задач");
  } else {
    try {
      const data = await callTool(client, "get_task", { id: vars.first_task_id });
      if (!data || typeof data !== "object") throw new Error("Response is not an object");
      if (data.id !== vars.first_task_id) throw new Error(`id mismatch: expected ${vars.first_task_id}, got ${data.id}`);
      if (typeof data.name !== "string") throw new Error("name is not a string");
      record(4, "get_task", "PASS", `задача id=${data.id}, name="${data.name}"`);
    } catch (e) {
      record(4, "get_task", "FAIL", e.message);
    }
  }

  // Test 5: list_workflows
  try {
    const data = await callTool(client, "list_workflows", {});
    if (!Array.isArray(data)) throw new Error("Response is not an array");
    if (data.length > 0) {
      for (const w of data) {
        if (typeof w.id !== "number") throw new Error(`workflow.id is not a number: ${w.id}`);
      }
    }
    vars.first_workflow_id = data.length > 0 ? data[0].id : null;
    record(5, "list_workflows", "PASS", `найдено ${data.length} воркфлоу`);
  } catch (e) {
    vars.first_workflow_id = null;
    record(5, "list_workflows", "FAIL", e.message);
  }

  // Test 6: list_workflow_stages
  try {
    const data = await callTool(client, "list_workflow_stages", {});
    if (!Array.isArray(data)) throw new Error("Response is not an array");
    if (data.length > 0) {
      for (const s of data) {
        if (typeof s.id !== "number") throw new Error(`stage.id is not a number: ${s.id}`);
      }
    }
    let extra = "";
    if (vars.first_workflow_id !== null) {
      try {
        const filtered = await callTool(client, "list_workflow_stages", { workflow_id: vars.first_workflow_id });
        if (!Array.isArray(filtered)) throw new Error("Filtered response is not an array");
        extra = `, фильтр workflow_id=${vars.first_workflow_id}: ${filtered.length} стадий`;
      } catch (fe) {
        extra = `, фильтр workflow_id=${vars.first_workflow_id}: ОШИБКА: ${fe.message}`;
      }
    }
    record(6, "list_workflow_stages", "PASS", `найдено ${data.length} стадий${extra}`);
  } catch (e) {
    record(6, "list_workflow_stages", "FAIL", e.message);
  }

  // Test 7: list_leads
  try {
    const data = await callTool(client, "list_leads", {});
    if (!data || typeof data !== "object") throw new Error("Response is not an object");
    if (!Array.isArray(data.items)) throw new Error("items is not an array");
    if (typeof data.total !== "number") throw new Error("total is not a number");
    if (typeof data.page !== "number") throw new Error("page is not a number");
    vars.first_lead_id = data.items.length > 0 ? data.items[0].id : null;
    record(7, "list_leads", "PASS", `total=${data.total}, items на странице=${data.items.length}`);
  } catch (e) {
    vars.first_lead_id = null;
    record(7, "list_leads", "FAIL", e.message);
  }

  // Test 8: get_lead
  if (vars.first_lead_id === null) {
    record(8, "get_lead", "SKIP", "list_leads не вернул сделок");
  } else {
    try {
      const data = await callTool(client, "get_lead", { id: vars.first_lead_id });
      if (!data || typeof data !== "object") throw new Error("Response is not an object");
      if (data.id !== vars.first_lead_id) throw new Error(`id mismatch: expected ${vars.first_lead_id}, got ${data.id}`);
      if (typeof data.name !== "string") throw new Error("name is not a string");
      record(8, "get_lead", "PASS", `сделка id=${data.id}, name="${data.name}"`);
    } catch (e) {
      record(8, "get_lead", "FAIL", e.message);
    }
  }

  // Test 9: list_pipelines
  try {
    const data = await callTool(client, "list_pipelines", {});
    if (!Array.isArray(data)) throw new Error("Response is not an array");
    if (data.length > 0) {
      for (const p of data) {
        if (typeof p.id !== "number") throw new Error(`pipeline.id is not a number: ${p.id}`);
      }
    }
    vars.first_pipeline_id = data.length > 0 ? data[0].id : null;
    record(9, "list_pipelines", "PASS", `найдено ${data.length} воронок`);
  } catch (e) {
    vars.first_pipeline_id = null;
    record(9, "list_pipelines", "FAIL", e.message);
  }

  // Test 10: list_pipeline_stages
  try {
    const data = await callTool(client, "list_pipeline_stages", {});
    if (!Array.isArray(data)) throw new Error("Response is not an array");
    if (data.length > 0) {
      for (const s of data) {
        if (typeof s.id !== "number") throw new Error(`stage.id is not a number: ${s.id}`);
      }
    }
    let extra = "";
    if (vars.first_pipeline_id !== null) {
      try {
        const filtered = await callTool(client, "list_pipeline_stages", { pipeline_id: vars.first_pipeline_id });
        if (!Array.isArray(filtered)) throw new Error("Filtered response is not an array");
        extra = `, фильтр pipeline_id=${vars.first_pipeline_id}: ${filtered.length} стадий`;
      } catch (fe) {
        extra = `, фильтр pipeline_id=${vars.first_pipeline_id}: ОШИБКА: ${fe.message}`;
      }
    }
    record(10, "list_pipeline_stages", "PASS", `найдено ${data.length} стадий${extra}`);
  } catch (e) {
    record(10, "list_pipeline_stages", "FAIL", e.message);
  }

  // Test 11: list_tasks status=1
  try {
    const data = await callTool(client, "list_tasks", { status: 1 });
    if (!data || typeof data !== "object") throw new Error("Response is not an object");
    if (!Array.isArray(data.items)) throw new Error("items is not an array");
    if (typeof data.total !== "number") throw new Error("total is not a number");
    if (typeof data.page !== "number") throw new Error("page is not a number");
    if (data.items.length > 0) {
      const bad = data.items.filter(t => t.status !== 1);
      if (bad.length > 0) throw new Error(`${bad.length} задач со status != 1 (найдены: ${bad.map(t => t.status).join(",")})`);
    }
    record(11, "list_tasks (status=1, новые)", "PASS", `${data.items.length} задач со статусом 1`);
  } catch (e) {
    record(11, "list_tasks (status=1, новые)", "FAIL", e.message);
  }

  // Test 12: list_tasks status=3
  try {
    const data = await callTool(client, "list_tasks", { status: 3 });
    if (!data || typeof data !== "object") throw new Error("Response is not an object");
    if (!Array.isArray(data.items)) throw new Error("items is not an array");
    if (typeof data.total !== "number") throw new Error("total is not a number");
    if (typeof data.page !== "number") throw new Error("page is not a number");
    if (data.items.length > 0) {
      const bad = data.items.filter(t => t.status !== 3);
      if (bad.length > 0) throw new Error(`${bad.length} задач со status != 3 (найдены: ${bad.map(t => t.status).join(",")})`);
    }
    record(12, "list_tasks (status=3, в работе)", "PASS", `${data.items.length} задач со статусом 3`);
  } catch (e) {
    record(12, "list_tasks (status=3, в работе)", "FAIL", e.message);
  }

  // Test 13: list_tasks type=0
  try {
    const data = await callTool(client, "list_tasks", { type: 0 });
    if (!data || typeof data !== "object") throw new Error("Response is not an object");
    if (!Array.isArray(data.items)) throw new Error("items is not an array");
    if (typeof data.total !== "number") throw new Error("total is not a number");
    if (typeof data.page !== "number") throw new Error("page is not a number");
    if (data.items.length > 0) {
      const bad = data.items.filter(t => t.type !== 0);
      if (bad.length > 0) throw new Error(`${bad.length} задач с type != 0 (найдены: ${bad.map(t => t.type).join(",")})`);
    }
    record(13, "list_tasks (type=0, задачи)", "PASS", `${data.items.length} задач типа 0`);
  } catch (e) {
    record(13, "list_tasks (type=0, задачи)", "FAIL", e.message);
  }

  // Test 14: list_tasks responsible_id
  if (vars.first_user_id === null) {
    record(14, `list_tasks (responsible_id)`, "SKIP", "search_users не вернул пользователей");
  } else {
    try {
      const data = await callTool(client, "list_tasks", { responsible_id: vars.first_user_id });
      if (!data || typeof data !== "object") throw new Error("Response is not an object");
      if (!Array.isArray(data.items)) throw new Error("items is not an array");
      if (typeof data.total !== "number") throw new Error("total is not a number");
      if (typeof data.page !== "number") throw new Error("page is not a number");
      if (data.items.length > 0) {
        const bad = data.items.filter(t => t.responsible_id !== vars.first_user_id);
        if (bad.length > 0) throw new Error(`${bad.length} задач с responsible_id != ${vars.first_user_id}`);
      }
      record(14, `list_tasks (responsible_id=${vars.first_user_id})`, "PASS", `${data.items.length} задач для пользователя ${vars.first_user_id}`);
    } catch (e) {
      record(14, `list_tasks (responsible_id=${vars.first_user_id})`, "FAIL", e.message);
    }
  }

  // Test 15: list_leads active=1
  try {
    const data = await callTool(client, "list_leads", { active: 1 });
    if (!data || typeof data !== "object") throw new Error("Response is not an object");
    if (!Array.isArray(data.items)) throw new Error("items is not an array");
    if (typeof data.total !== "number") throw new Error("total is not a number");
    if (typeof data.page !== "number") throw new Error("page is not a number");
    if (data.items.length > 0) {
      const bad = data.items.filter(l => l.active !== 1);
      if (bad.length > 0) throw new Error(`${bad.length} сделок с active != 1 (найдены: ${bad.map(l => l.active).join(",")})`);
    }
    record(15, "list_leads (active=1, активные)", "PASS", `${data.items.length} активных сделок`);
  } catch (e) {
    record(15, "list_leads (active=1, активные)", "FAIL", e.message);
  }

  // Test 16: list_leads pipeline_id
  if (vars.first_pipeline_id === null) {
    record(16, "list_leads (pipeline_id)", "SKIP", "list_pipelines не вернул воронок");
  } else {
    try {
      const data = await callTool(client, "list_leads", { pipeline_id: vars.first_pipeline_id });
      if (!data || typeof data !== "object") throw new Error("Response is not an object");
      if (!Array.isArray(data.items)) throw new Error("items is not an array");
      if (typeof data.total !== "number") throw new Error("total is not a number");
      if (typeof data.page !== "number") throw new Error("page is not a number");
      if (data.items.length > 0) {
        const bad = data.items.filter(l => l.pipeline_id !== vars.first_pipeline_id);
        if (bad.length > 0) throw new Error(`${bad.length} сделок с pipeline_id != ${vars.first_pipeline_id}`);
      }
      record(16, `list_leads (pipeline_id=${vars.first_pipeline_id})`, "PASS", `${data.items.length} сделок в воронке ${vars.first_pipeline_id}`);
    } catch (e) {
      record(16, `list_leads (pipeline_id=${vars.first_pipeline_id})`, "FAIL", e.message);
    }
  }

  // Report
  console.log("\n=== Интеграционные тесты ASPO MCP (readonly) ===\n");
  console.log("|  # | Метод                                   | Статус | Детали");
  console.log("|----|----------------------------------------|--------|-------");
  for (const r of results) {
    const num = String(r.num).padStart(2);
    const method = r.method.padEnd(40);
    const status = r.status.padEnd(6);
    console.log(`| ${num} | ${method}| ${status} | ${r.details}`);
  }

  const passed = results.filter(r => r.status === "PASS").length;
  const failed = results.filter(r => r.status === "FAIL").length;
  const skipped = results.filter(r => r.status === "SKIP").length;
  console.log(`\nИтого: ${passed} прошло, ${failed} упало, ${skipped} пропущено\n`);

  if (failed > 0) {
    console.log("❌ Интеграционные тесты НЕ ПРОШЛИ");
  } else {
    console.log("✅ Все интеграционные тесты прошли успешно");
  }

  await client.close();
}

runTests().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
