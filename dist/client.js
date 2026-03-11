"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getClient = getClient;
exports.apiGet = apiGet;
exports.apiPost = apiPost;
const axios_1 = __importDefault(require("axios"));
let instance = null;
function getClient() {
    if (instance)
        return instance;
    const company = process.env.ASPRO_COMPANY;
    const apiKey = process.env.ASPRO_API_KEY;
    if (!company)
        throw new Error("ASPRO_COMPANY environment variable is required");
    if (!apiKey)
        throw new Error("ASPRO_API_KEY environment variable is required");
    instance = axios_1.default.create({
        baseURL: `https://${company}.aspro.cloud/api/v1/module`,
        params: { api_key: apiKey },
    });
    return instance;
}
function handleAxiosError(err) {
    if (axios_1.default.isAxiosError(err)) {
        const status = err.response?.status ?? 0;
        const data = err.response?.data;
        const msg = data?.message ?? err.message;
        throw new Error(`HTTP ${status}: ${msg}`);
    }
    throw err;
}
async function apiGet(path, params) {
    const client = getClient();
    try {
        const response = await client.get(path, { params });
        return response.data.response;
    }
    catch (err) {
        handleAxiosError(err);
    }
}
async function apiPost(path, data) {
    const client = getClient();
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && value !== null) {
            formData.append(key, String(value));
        }
    }
    try {
        const response = await client.post(path, formData, {
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
        });
        return response.data.response;
    }
    catch (err) {
        handleAxiosError(err);
    }
}
//# sourceMappingURL=client.js.map