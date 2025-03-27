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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIConfigManager = void 0;
const vscode = __importStar(require("vscode"));
class APIConfigManager {
    constructor() {
        this.config = this.loadConfig();
    }
    static getInstance() {
        if (!APIConfigManager.instance) {
            APIConfigManager.instance = new APIConfigManager();
        }
        return APIConfigManager.instance;
    }
    loadConfig() {
        const config = vscode.workspace.getConfiguration('wsh');
        return {
            anthropic: {
                apiKey: config.get('anthropic.apiKey') || '',
                model: config.get('anthropic.model') || 'claude-3-sonnet-20240229'
            },
            openai: {
                apiKey: config.get('openai.apiKey') || '',
                model: config.get('openai.model') || 'gpt-4-turbo-preview'
            },
            deepseek: {
                apiKey: config.get('deepseek.apiKey') || '',
                model: config.get('deepseek.model') || 'deepseek-coder-33b-instruct'
            },
            gemini: {
                apiKey: config.get('gemini.apiKey') || '',
                model: config.get('gemini.model') || 'gemini-pro'
            }
        };
    }
    getConfig() {
        return this.config;
    }
    async updateConfig(newConfig) {
        const config = vscode.workspace.getConfiguration('wsh');
        await config.update('anthropic.apiKey', newConfig.anthropic?.apiKey, true);
        await config.update('anthropic.model', newConfig.anthropic?.model, true);
        await config.update('openai.apiKey', newConfig.openai?.apiKey, true);
        await config.update('openai.model', newConfig.openai?.model, true);
        await config.update('deepseek.apiKey', newConfig.deepseek?.apiKey, true);
        await config.update('deepseek.model', newConfig.deepseek?.model, true);
        await config.update('gemini.apiKey', newConfig.gemini?.apiKey, true);
        await config.update('gemini.model', newConfig.gemini?.model, true);
        this.config = this.loadConfig();
    }
    validateConfig() {
        return !!(this.config.anthropic.apiKey &&
            this.config.openai.apiKey &&
            this.config.deepseek.apiKey &&
            this.config.gemini.apiKey);
    }
}
exports.APIConfigManager = APIConfigManager;
//# sourceMappingURL=api.js.map