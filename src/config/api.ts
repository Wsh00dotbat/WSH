import * as vscode from 'vscode';

export interface APIConfig {
    anthropic: {
        apiKey: string;
        model: 'claude-3-opus-20240229' | 'claude-3-sonnet-20240229' | 'claude-3-haiku-20240307';
    };
    openai: {
        apiKey: string;
        model: 'gpt-4-turbo-preview' | 'gpt-3.5-turbo';
    };
    deepseek: {
        apiKey: string;
        model: 'deepseek-coder-33b-instruct' | 'deepseek-chat';
    };
    gemini: {
        apiKey: string;
        model: 'gemini-pro' | 'gemini-pro-vision';
    };
}

export class APIConfigManager {
    private static instance: APIConfigManager;
    private config: APIConfig;

    private constructor() {
        this.config = this.loadConfig();
    }

    public static getInstance(): APIConfigManager {
        if (!APIConfigManager.instance) {
            APIConfigManager.instance = new APIConfigManager();
        }
        return APIConfigManager.instance;
    }

    private loadConfig(): APIConfig {
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

    public getConfig(): APIConfig {
        return this.config;
    }

    public async updateConfig(newConfig: Partial<APIConfig>): Promise<void> {
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

    public validateConfig(): boolean {
        return !!(
            this.config.anthropic.apiKey &&
            this.config.openai.apiKey &&
            this.config.deepseek.apiKey &&
            this.config.gemini.apiKey
        );
    }
} 