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
        this.MAX_RETRIES = 3;
        this.RETRY_DELAY = 1000; // 1 second
        this.config = this.loadConfig();
    }
    static getInstance() {
        if (!APIConfigManager.instance) {
            APIConfigManager.instance = new APIConfigManager();
        }
        return APIConfigManager.instance;
    }
    async retryOperation(operation, retries = this.MAX_RETRIES) {
        let lastError;
        for (let i = 0; i < retries; i++) {
            try {
                return await operation();
            }
            catch (error) {
                lastError = error;
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
                }
            }
        }
        throw lastError;
    }
    validateApiKey(apiKey) {
        return typeof apiKey === 'string' && apiKey.length > 0;
    }
    validateModel(model, validModels) {
        return validModels.includes(model);
    }
    loadConfig() {
        const config = vscode.workspace.getConfiguration('projectmind');
        const anthropicModel = config.get('anthropic.model') || 'claude-3-sonnet-20240229';
        const openaiModel = config.get('openai.model') || 'gpt-4-turbo-preview';
        const deepseekModel = config.get('deepseek.model') || 'deepseek-coder-33b-instruct';
        const geminiModel = config.get('gemini.model') || 'gemini-pro';
        const validAnthropicModels = ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'];
        const validOpenAIModels = ['gpt-4-turbo-preview', 'gpt-3.5-turbo'];
        const validDeepSeekModels = ['deepseek-coder-33b-instruct', 'deepseek-chat'];
        const validGeminiModels = ['gemini-pro', 'gemini-pro-vision'];
        if (!this.validateModel(anthropicModel, validAnthropicModels)) {
            throw new Error(`Invalid Anthropic model: ${anthropicModel}`);
        }
        if (!this.validateModel(openaiModel, validOpenAIModels)) {
            throw new Error(`Invalid OpenAI model: ${openaiModel}`);
        }
        if (!this.validateModel(deepseekModel, validDeepSeekModels)) {
            throw new Error(`Invalid DeepSeek model: ${deepseekModel}`);
        }
        if (!this.validateModel(geminiModel, validGeminiModels)) {
            throw new Error(`Invalid Gemini model: ${geminiModel}`);
        }
        return {
            anthropic: {
                apiKey: config.get('anthropic.apiKey') || '',
                model: anthropicModel
            },
            openai: {
                apiKey: config.get('openai.apiKey') || '',
                model: openaiModel
            },
            deepseek: {
                apiKey: config.get('deepseek.apiKey') || '',
                model: deepseekModel
            },
            gemini: {
                apiKey: config.get('gemini.apiKey') || '',
                model: geminiModel
            }
        };
    }
    getConfig() {
        return this.config;
    }
    async updateConfig(newConfig) {
        try {
            const config = vscode.workspace.getConfiguration('projectmind');
            // Validate API keys
            if (newConfig.anthropic?.apiKey && !this.validateApiKey(newConfig.anthropic.apiKey)) {
                throw new Error('Invalid Anthropic API key');
            }
            if (newConfig.openai?.apiKey && !this.validateApiKey(newConfig.openai.apiKey)) {
                throw new Error('Invalid OpenAI API key');
            }
            if (newConfig.deepseek?.apiKey && !this.validateApiKey(newConfig.deepseek.apiKey)) {
                throw new Error('Invalid DeepSeek API key');
            }
            if (newConfig.gemini?.apiKey && !this.validateApiKey(newConfig.gemini.apiKey)) {
                throw new Error('Invalid Gemini API key');
            }
            // Update configuration with retry mechanism
            await this.retryOperation(async () => {
                if (newConfig.anthropic) {
                    await config.update('anthropic.apiKey', newConfig.anthropic.apiKey, true);
                    await config.update('anthropic.model', newConfig.anthropic.model, true);
                }
                if (newConfig.openai) {
                    await config.update('openai.apiKey', newConfig.openai.apiKey, true);
                    await config.update('openai.model', newConfig.openai.model, true);
                }
                if (newConfig.deepseek) {
                    await config.update('deepseek.apiKey', newConfig.deepseek.apiKey, true);
                    await config.update('deepseek.model', newConfig.deepseek.model, true);
                }
                if (newConfig.gemini) {
                    await config.update('gemini.apiKey', newConfig.gemini.apiKey, true);
                    await config.update('gemini.model', newConfig.gemini.model, true);
                }
            });
            this.config = this.loadConfig();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to update configuration: ${errorMessage}`);
            throw error;
        }
    }
    validateConfig() {
        return !!(this.validateApiKey(this.config.anthropic.apiKey) &&
            this.validateApiKey(this.config.openai.apiKey) &&
            this.validateApiKey(this.config.deepseek.apiKey) &&
            this.validateApiKey(this.config.gemini.apiKey));
    }
}
exports.APIConfigManager = APIConfigManager;
//# sourceMappingURL=api.js.map