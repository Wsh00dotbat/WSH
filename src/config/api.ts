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
    private readonly MAX_RETRIES = 3;
    private readonly RETRY_DELAY = 1000; // 1 second

    private constructor() {
        this.config = this.loadConfig();
    }

    public static getInstance(): APIConfigManager {
        if (!APIConfigManager.instance) {
            APIConfigManager.instance = new APIConfigManager();
        }
        return APIConfigManager.instance;
    }

    private async retryOperation<T>(operation: () => Promise<T>, retries: number = this.MAX_RETRIES): Promise<T> {
        let lastError: Error | undefined;
        
        for (let i = 0; i < retries; i++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error as Error;
                if (i < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, this.RETRY_DELAY));
                }
            }
        }
        
        throw lastError;
    }

    private validateApiKey(apiKey: string): boolean {
        return typeof apiKey === 'string' && apiKey.length > 0;
    }

    private validateModel(model: string, validModels: readonly string[]): boolean {
        return validModels.includes(model);
    }

    private loadConfig(): APIConfig {
        const config = vscode.workspace.getConfiguration('projectmind');
        
        const anthropicModel = config.get<string>('anthropic.model') || 'claude-3-sonnet-20240229';
        const openaiModel = config.get<string>('openai.model') || 'gpt-4-turbo-preview';
        const deepseekModel = config.get<string>('deepseek.model') || 'deepseek-coder-33b-instruct';
        const geminiModel = config.get<string>('gemini.model') || 'gemini-pro';

        const validAnthropicModels = ['claude-3-opus-20240229', 'claude-3-sonnet-20240229', 'claude-3-haiku-20240307'] as const;
        const validOpenAIModels = ['gpt-4-turbo-preview', 'gpt-3.5-turbo'] as const;
        const validDeepSeekModels = ['deepseek-coder-33b-instruct', 'deepseek-chat'] as const;
        const validGeminiModels = ['gemini-pro', 'gemini-pro-vision'] as const;

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
                apiKey: config.get<string>('anthropic.apiKey') || '',
                model: anthropicModel as APIConfig['anthropic']['model']
            },
            openai: {
                apiKey: config.get<string>('openai.apiKey') || '',
                model: openaiModel as APIConfig['openai']['model']
            },
            deepseek: {
                apiKey: config.get<string>('deepseek.apiKey') || '',
                model: deepseekModel as APIConfig['deepseek']['model']
            },
            gemini: {
                apiKey: config.get<string>('gemini.apiKey') || '',
                model: geminiModel as APIConfig['gemini']['model']
            }
        };
    }

    public getConfig(): APIConfig {
        return this.config;
    }

    public async updateConfig(newConfig: Partial<APIConfig>): Promise<void> {
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
        } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            vscode.window.showErrorMessage(`Failed to update configuration: ${errorMessage}`);
            throw error;
        }
    }

    public validateConfig(): boolean {
        return !!(
            this.validateApiKey(this.config.anthropic.apiKey) &&
            this.validateApiKey(this.config.openai.apiKey) &&
            this.validateApiKey(this.config.deepseek.apiKey) &&
            this.validateApiKey(this.config.gemini.apiKey)
        );
    }
} 