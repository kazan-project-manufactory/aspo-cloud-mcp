"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const vitest_1 = require("vitest");
// Each test that needs a fresh module state uses vi.resetModules() + dynamic import
// to force the singleton `instance` back to null.
const VALID_ENV = {
    ASPRO_COMPANY: "testcompany",
    ASPRO_API_KEY: "testapikey",
};
(0, vitest_1.describe)("getClient", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetModules();
        vitest_1.vi.unstubAllEnvs();
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.unstubAllEnvs();
    });
    (0, vitest_1.it)("throws when ASPRO_COMPANY is missing", async () => {
        vitest_1.vi.stubEnv("ASPRO_API_KEY", "key");
        vitest_1.vi.stubEnv("ASPRO_COMPANY", ""); // empty string is falsy — triggers the guard
        const { getClient } = await Promise.resolve().then(() => __importStar(require("../client.js")));
        (0, vitest_1.expect)(() => getClient()).toThrow("ASPRO_COMPANY environment variable is required");
    });
    (0, vitest_1.it)("throws when ASPRO_API_KEY is missing", async () => {
        vitest_1.vi.stubEnv("ASPRO_COMPANY", "mycompany");
        vitest_1.vi.stubEnv("ASPRO_API_KEY", ""); // empty string is falsy — triggers the guard
        const { getClient } = await Promise.resolve().then(() => __importStar(require("../client.js")));
        (0, vitest_1.expect)(() => getClient()).toThrow("ASPRO_API_KEY environment variable is required");
    });
    (0, vitest_1.it)("creates an axios instance with correct baseURL", async () => {
        vitest_1.vi.stubEnv("ASPRO_COMPANY", "mycompany");
        vitest_1.vi.stubEnv("ASPRO_API_KEY", "mykey");
        const { getClient } = await Promise.resolve().then(() => __importStar(require("../client.js")));
        const client = getClient();
        (0, vitest_1.expect)(client.defaults.baseURL).toBe("https://mycompany.aspro.cloud/api/v1/module");
    });
    (0, vitest_1.it)("embeds api_key in default params", async () => {
        vitest_1.vi.stubEnv("ASPRO_COMPANY", "mycompany");
        vitest_1.vi.stubEnv("ASPRO_API_KEY", "mykey");
        const { getClient } = await Promise.resolve().then(() => __importStar(require("../client.js")));
        const client = getClient();
        (0, vitest_1.expect)(client.defaults.params.api_key).toBe("mykey");
    });
    (0, vitest_1.it)("returns the same instance on repeated calls (singleton)", async () => {
        vitest_1.vi.stubEnv("ASPRO_COMPANY", "mycompany");
        vitest_1.vi.stubEnv("ASPRO_API_KEY", "mykey");
        const { getClient } = await Promise.resolve().then(() => __importStar(require("../client.js")));
        const first = getClient();
        const second = getClient();
        (0, vitest_1.expect)(first).toBe(second);
    });
});
(0, vitest_1.describe)("apiGet", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetModules();
        vitest_1.vi.unstubAllEnvs();
        vitest_1.vi.stubEnv("ASPRO_COMPANY", VALID_ENV.ASPRO_COMPANY);
        vitest_1.vi.stubEnv("ASPRO_API_KEY", VALID_ENV.ASPRO_API_KEY);
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.unstubAllEnvs();
    });
    (0, vitest_1.it)("calls client.get with path and params, returns response.data.response", async () => {
        const mockGet = vitest_1.vi.fn().mockResolvedValue({ data: { response: { id: 1, name: "Test" } } });
        vitest_1.vi.doMock("axios", () => ({
            default: {
                create: () => ({ defaults: { baseURL: "", params: {} }, get: mockGet }),
                isAxiosError: () => false,
            },
        }));
        const { apiGet } = await Promise.resolve().then(() => __importStar(require("../client.js")));
        const result = await apiGet("/crm/lead/list", { page: 2 });
        (0, vitest_1.expect)(mockGet).toHaveBeenCalledWith("/crm/lead/list", { params: { page: 2 } });
        (0, vitest_1.expect)(result).toEqual({ id: 1, name: "Test" });
    });
    (0, vitest_1.it)("calls client.get without params when none provided", async () => {
        const mockGet = vitest_1.vi.fn().mockResolvedValue({ data: { response: [] } });
        vitest_1.vi.doMock("axios", () => ({
            default: {
                create: () => ({ defaults: { baseURL: "", params: {} }, get: mockGet }),
                isAxiosError: () => false,
            },
        }));
        const { apiGet } = await Promise.resolve().then(() => __importStar(require("../client.js")));
        await apiGet("/crm/pipeline/list");
        (0, vitest_1.expect)(mockGet).toHaveBeenCalledWith("/crm/pipeline/list", { params: undefined });
    });
    (0, vitest_1.it)("throws a readable Error when HTTP 500 is returned", async () => {
        const axiosError = Object.assign(new Error("Internal Server Error"), {
            isAxiosError: true,
            response: { status: 500, data: { message: "Server error" } },
        });
        const mockGet = vitest_1.vi.fn().mockRejectedValue(axiosError);
        vitest_1.vi.doMock("axios", () => ({
            default: {
                create: () => ({ defaults: { baseURL: "", params: {} }, get: mockGet }),
                isAxiosError: (e) => e.isAxiosError === true,
            },
        }));
        const { apiGet } = await Promise.resolve().then(() => __importStar(require("../client.js")));
        await (0, vitest_1.expect)(apiGet("/crm/lead/list")).rejects.toThrow("HTTP 500: Server error");
    });
});
(0, vitest_1.describe)("apiPost", () => {
    (0, vitest_1.beforeEach)(() => {
        vitest_1.vi.resetModules();
        vitest_1.vi.unstubAllEnvs();
        vitest_1.vi.stubEnv("ASPRO_COMPANY", VALID_ENV.ASPRO_COMPANY);
        vitest_1.vi.stubEnv("ASPRO_API_KEY", VALID_ENV.ASPRO_API_KEY);
    });
    (0, vitest_1.afterEach)(() => {
        vitest_1.vi.unstubAllEnvs();
    });
    (0, vitest_1.it)("sends form-encoded body and returns response.data.response", async () => {
        const mockPost = vitest_1.vi.fn().mockResolvedValue({ data: { response: { id: 5 } } });
        vitest_1.vi.doMock("axios", () => ({
            default: {
                create: () => ({ defaults: { baseURL: "", params: {} }, post: mockPost }),
                isAxiosError: () => false,
            },
        }));
        const { apiPost } = await Promise.resolve().then(() => __importStar(require("../client.js")));
        const result = await apiPost("/crm/lead/create", { name: "Deal", budget: 1000 });
        (0, vitest_1.expect)(mockPost).toHaveBeenCalledTimes(1);
        const [path, body, config] = mockPost.mock.calls[0];
        (0, vitest_1.expect)(path).toBe("/crm/lead/create");
        (0, vitest_1.expect)(body).toBeInstanceOf(URLSearchParams);
        (0, vitest_1.expect)(body.get("name")).toBe("Deal");
        (0, vitest_1.expect)(body.get("budget")).toBe("1000");
        (0, vitest_1.expect)(config.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
        (0, vitest_1.expect)(result).toEqual({ id: 5 });
    });
    (0, vitest_1.it)("skips null and undefined fields in form body", async () => {
        const mockPost = vitest_1.vi.fn().mockResolvedValue({ data: { response: {} } });
        vitest_1.vi.doMock("axios", () => ({
            default: {
                create: () => ({ defaults: { baseURL: "", params: {} }, post: mockPost }),
                isAxiosError: () => false,
            },
        }));
        const { apiPost } = await Promise.resolve().then(() => __importStar(require("../client.js")));
        await apiPost("/crm/lead/create", { name: "Deal", description: null, budget: undefined });
        const body = mockPost.mock.calls[0][1];
        (0, vitest_1.expect)(body.has("name")).toBe(true);
        (0, vitest_1.expect)(body.has("description")).toBe(false);
        (0, vitest_1.expect)(body.has("budget")).toBe(false);
    });
    (0, vitest_1.it)("converts non-string values to strings in form body", async () => {
        const mockPost = vitest_1.vi.fn().mockResolvedValue({ data: { response: {} } });
        vitest_1.vi.doMock("axios", () => ({
            default: {
                create: () => ({ defaults: { baseURL: "", params: {} }, post: mockPost }),
                isAxiosError: () => false,
            },
        }));
        const { apiPost } = await Promise.resolve().then(() => __importStar(require("../client.js")));
        await apiPost("/task/tasks/create", { name: "Task", priority: 2, active: 1 });
        const body = mockPost.mock.calls[0][1];
        (0, vitest_1.expect)(body.get("priority")).toBe("2");
        (0, vitest_1.expect)(body.get("active")).toBe("1");
    });
    (0, vitest_1.it)("throws a readable Error when HTTP 422 is returned", async () => {
        const axiosError = Object.assign(new Error("Unprocessable Entity"), {
            isAxiosError: true,
            response: { status: 422, data: { message: "Validation failed" } },
        });
        const mockPost = vitest_1.vi.fn().mockRejectedValue(axiosError);
        vitest_1.vi.doMock("axios", () => ({
            default: {
                create: () => ({ defaults: { baseURL: "", params: {} }, post: mockPost }),
                isAxiosError: (e) => e.isAxiosError === true,
            },
        }));
        const { apiPost } = await Promise.resolve().then(() => __importStar(require("../client.js")));
        await (0, vitest_1.expect)(apiPost("/crm/lead/create", { name: "x" })).rejects.toThrow("HTTP 422: Validation failed");
    });
});
//# sourceMappingURL=client.test.js.map