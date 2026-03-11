import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// Each test that needs a fresh module state uses vi.resetModules() + dynamic import
// to force the singleton `instance` back to null.

const VALID_ENV = {
  ASPRO_COMPANY: "testcompany",
  ASPRO_API_KEY: "testapikey",
};

describe("getClient", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("throws when ASPRO_COMPANY is missing", async () => {
    vi.stubEnv("ASPRO_API_KEY", "key");
    vi.stubEnv("ASPRO_COMPANY", ""); // empty string is falsy — triggers the guard

    const { getClient } = await import("../client.js");
    expect(() => getClient()).toThrow("ASPRO_COMPANY environment variable is required");
  });

  it("throws when ASPRO_API_KEY is missing", async () => {
    vi.stubEnv("ASPRO_COMPANY", "mycompany");
    vi.stubEnv("ASPRO_API_KEY", ""); // empty string is falsy — triggers the guard

    const { getClient } = await import("../client.js");
    expect(() => getClient()).toThrow("ASPRO_API_KEY environment variable is required");
  });

  it("creates an axios instance with correct baseURL", async () => {
    vi.stubEnv("ASPRO_COMPANY", "mycompany");
    vi.stubEnv("ASPRO_API_KEY", "mykey");

    const { getClient } = await import("../client.js");
    const client = getClient();

    expect(client.defaults.baseURL).toBe("https://mycompany.aspro.cloud/api/v1/module");
  });

  it("embeds api_key in default params", async () => {
    vi.stubEnv("ASPRO_COMPANY", "mycompany");
    vi.stubEnv("ASPRO_API_KEY", "mykey");

    const { getClient } = await import("../client.js");
    const client = getClient();

    expect((client.defaults.params as Record<string, string>).api_key).toBe("mykey");
  });

  it("returns the same instance on repeated calls (singleton)", async () => {
    vi.stubEnv("ASPRO_COMPANY", "mycompany");
    vi.stubEnv("ASPRO_API_KEY", "mykey");

    const { getClient } = await import("../client.js");
    const first = getClient();
    const second = getClient();

    expect(first).toBe(second);
  });
});

describe("apiGet", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("ASPRO_COMPANY", VALID_ENV.ASPRO_COMPANY);
    vi.stubEnv("ASPRO_API_KEY", VALID_ENV.ASPRO_API_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("calls client.get with path and params, returns response.data.response", async () => {
    const mockGet = vi.fn().mockResolvedValue({ data: { response: { id: 1, name: "Test" } } });

    vi.doMock("axios", () => ({
      default: {
        create: () => ({ defaults: { baseURL: "", params: {} }, get: mockGet }),
        isAxiosError: () => false,
      },
    }));

    const { apiGet } = await import("../client.js");
    const result = await apiGet<{ id: number; name: string }>("/crm/lead/list", { page: 2 });

    expect(mockGet).toHaveBeenCalledWith("/crm/lead/list", { params: { page: 2 } });
    expect(result).toEqual({ id: 1, name: "Test" });
  });

  it("calls client.get without params when none provided", async () => {
    const mockGet = vi.fn().mockResolvedValue({ data: { response: [] } });

    vi.doMock("axios", () => ({
      default: {
        create: () => ({ defaults: { baseURL: "", params: {} }, get: mockGet }),
        isAxiosError: () => false,
      },
    }));

    const { apiGet } = await import("../client.js");
    await apiGet("/crm/pipeline/list");

    expect(mockGet).toHaveBeenCalledWith("/crm/pipeline/list", { params: undefined });
  });

  it("throws a readable Error when HTTP 500 is returned", async () => {
    const axiosError = Object.assign(new Error("Internal Server Error"), {
      isAxiosError: true,
      response: { status: 500, data: { message: "Server error" } },
    });
    const mockGet = vi.fn().mockRejectedValue(axiosError);

    vi.doMock("axios", () => ({
      default: {
        create: () => ({ defaults: { baseURL: "", params: {} }, get: mockGet }),
        isAxiosError: (e: unknown) => (e as { isAxiosError?: boolean }).isAxiosError === true,
      },
    }));

    const { apiGet } = await import("../client.js");
    await expect(apiGet("/crm/lead/list")).rejects.toThrow("HTTP 500: Server error");
  });
});

describe("apiPost", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.unstubAllEnvs();
    vi.stubEnv("ASPRO_COMPANY", VALID_ENV.ASPRO_COMPANY);
    vi.stubEnv("ASPRO_API_KEY", VALID_ENV.ASPRO_API_KEY);
  });

  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("sends form-encoded body and returns response.data.response", async () => {
    const mockPost = vi.fn().mockResolvedValue({ data: { response: { id: 5 } } });

    vi.doMock("axios", () => ({
      default: {
        create: () => ({ defaults: { baseURL: "", params: {} }, post: mockPost }),
        isAxiosError: () => false,
      },
    }));

    const { apiPost } = await import("../client.js");
    const result = await apiPost<{ id: number }>("/crm/lead/create", { name: "Deal", budget: 1000 });

    expect(mockPost).toHaveBeenCalledTimes(1);
    const [path, body, config] = mockPost.mock.calls[0];
    expect(path).toBe("/crm/lead/create");
    expect(body).toBeInstanceOf(URLSearchParams);
    expect(body.get("name")).toBe("Deal");
    expect(body.get("budget")).toBe("1000");
    expect(config.headers["Content-Type"]).toBe("application/x-www-form-urlencoded");
    expect(result).toEqual({ id: 5 });
  });

  it("skips null and undefined fields in form body", async () => {
    const mockPost = vi.fn().mockResolvedValue({ data: { response: {} } });

    vi.doMock("axios", () => ({
      default: {
        create: () => ({ defaults: { baseURL: "", params: {} }, post: mockPost }),
        isAxiosError: () => false,
      },
    }));

    const { apiPost } = await import("../client.js");
    await apiPost("/crm/lead/create", { name: "Deal", description: null, budget: undefined });

    const body: URLSearchParams = mockPost.mock.calls[0][1];
    expect(body.has("name")).toBe(true);
    expect(body.has("description")).toBe(false);
    expect(body.has("budget")).toBe(false);
  });

  it("converts non-string values to strings in form body", async () => {
    const mockPost = vi.fn().mockResolvedValue({ data: { response: {} } });

    vi.doMock("axios", () => ({
      default: {
        create: () => ({ defaults: { baseURL: "", params: {} }, post: mockPost }),
        isAxiosError: () => false,
      },
    }));

    const { apiPost } = await import("../client.js");
    await apiPost("/task/tasks/create", { name: "Task", priority: 2, active: 1 });

    const body: URLSearchParams = mockPost.mock.calls[0][1];
    expect(body.get("priority")).toBe("2");
    expect(body.get("active")).toBe("1");
  });

  it("throws a readable Error when HTTP 422 is returned", async () => {
    const axiosError = Object.assign(new Error("Unprocessable Entity"), {
      isAxiosError: true,
      response: { status: 422, data: { message: "Validation failed" } },
    });
    const mockPost = vi.fn().mockRejectedValue(axiosError);

    vi.doMock("axios", () => ({
      default: {
        create: () => ({ defaults: { baseURL: "", params: {} }, post: mockPost }),
        isAxiosError: (e: unknown) => (e as { isAxiosError?: boolean }).isAxiosError === true,
      },
    }));

    const { apiPost } = await import("../client.js");
    await expect(apiPost("/crm/lead/create", { name: "x" })).rejects.toThrow(
      "HTTP 422: Validation failed",
    );
  });
});
