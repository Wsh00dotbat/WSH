"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AIService = void 0;
const axios_1 = __importDefault(require("axios"));
const api_1 = require("../config/api");
class AIService {
    constructor() {
        this.configManager = api_1.APIConfigManager.getInstance();
    }
    static getInstance() {
        if (!AIService.instance) {
            AIService.instance = new AIService();
        }
        return AIService.instance;
    }
    async generateCode(prompt, context = '') {
        const config = this.configManager.getConfig();
        try {
            // Try Claude first
            const claudeResponse = await this.callClaude(prompt, context, config);
            if (claudeResponse)
                return claudeResponse;
            // Try GPT-4
            const gptResponse = await this.callGPT(prompt, context, config);
            if (gptResponse)
                return gptResponse;
            // Try DeepSeek
            const deepseekResponse = await this.callDeepSeek(prompt, context, config);
            if (deepseekResponse)
                return deepseekResponse;
            // Try Gemini as last resort
            return await this.callGemini(prompt, context, config);
        }
        catch (error) {
            console.error('All AI services failed:', error);
            throw new Error('Failed to generate code with any AI service');
        }
    }
    async callClaude(prompt, context, config) {
        try {
            const response = await axios_1.default.post('https://api.anthropic.com/v1/messages', {
                model: config.anthropic.model,
                max_tokens: 4000,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert programming assistant. Generate high-quality, efficient, and well-documented code.'
                    },
                    {
                        role: 'user',
                        content: `Context:\n${context}\n\nPrompt:\n${prompt}`
                    }
                ],
                temperature: 0.7
            }, {
                headers: {
                    'x-api-key': config.anthropic.apiKey,
                    'anthropic-version': '2023-06-01'
                }
            });
            return {
                text: response.data.content[0].text,
                model: config.anthropic.model,
                usage: response.data.usage
            };
        }
        catch (error) {
            console.error('Claude API failed:', error);
            return null;
        }
    }
    async callGPT(prompt, context, config) {
        try {
            const response = await axios_1.default.post('https://api.openai.com/v1/chat/completions', {
                model: config.openai.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert programming assistant. Generate high-quality, efficient, and well-documented code.'
                    },
                    {
                        role: 'user',
                        content: `Context:\n${context}\n\nPrompt:\n${prompt}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 4000
            }, {
                headers: {
                    'Authorization': `Bearer ${config.openai.apiKey}`
                }
            });
            return {
                text: response.data.choices[0].message.content,
                model: config.openai.model,
                usage: response.data.usage
            };
        }
        catch (error) {
            console.error('GPT API failed:', error);
            return null;
        }
    }
    async callDeepSeek(prompt, context, config) {
        try {
            const response = await axios_1.default.post('https://api.deepseek.com/v1/chat/completions', {
                model: config.deepseek.model,
                messages: [
                    {
                        role: 'system',
                        content: 'You are an expert programming assistant. Generate high-quality, efficient, and well-documented code.'
                    },
                    {
                        role: 'user',
                        content: `Context:\n${context}\n\nPrompt:\n${prompt}`
                    }
                ],
                temperature: 0.7,
                max_tokens: 4000
            }, {
                headers: {
                    'Authorization': `Bearer ${config.deepseek.apiKey}`
                }
            });
            return {
                text: response.data.choices[0].message.content,
                model: config.deepseek.model,
                usage: response.data.usage
            };
        }
        catch (error) {
            console.error('DeepSeek API failed:', error);
            return null;
        }
    }
    async callGemini(prompt, context, config) {
        try {
            const response = await axios_1.default.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent', {
                contents: [{
                        parts: [{
                                text: `Context:\n${context}\n\nPrompt:\n${prompt}`
                            }]
                    }],
                generationConfig: {
                    temperature: 0.7,
                    maxOutputTokens: 4000
                }
            }, {
                headers: {
                    'x-goog-api-key': config.gemini.apiKey
                }
            });
            return {
                text: response.data.candidates[0].content.parts[0].text,
                model: config.gemini.model
            };
        }
        catch (error) {
            console.error('Gemini API failed:', error);
            throw new Error('Failed to generate code with Gemini');
        }
    }
}
exports.AIService = AIService;
//# sourceMappingURL=aiService.js.map