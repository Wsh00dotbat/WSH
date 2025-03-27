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
exports.SettingsView = void 0;
const vscode = __importStar(require("vscode"));
const api_1 = require("../config/api");
class SettingsView {
    constructor(extensionUri, context) {
        this.extensionUri = extensionUri;
        this.context = context;
    }
    static getInstance(extensionUri, context) {
        if (!SettingsView.instance) {
            SettingsView.instance = new SettingsView(extensionUri, context);
        }
        return SettingsView.instance;
    }
    show() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }
        this.panel = vscode.window.createWebviewPanel('settingsView', 'AI Assistant Settings', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        this.panel.webview.html = this.getWebviewContent();
        this.panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'updateSettings':
                    await this.updateSettings(message.settings);
                    break;
                case 'resetSettings':
                    await this.resetSettings();
                    break;
            }
        }, undefined, this.context.subscriptions);
    }
    async updateSettings(settings) {
        const configManager = api_1.APIConfigManager.getInstance();
        await configManager.updateConfig(settings);
        vscode.window.showInformationMessage('Settings updated successfully');
    }
    async resetSettings() {
        const configManager = api_1.APIConfigManager.getInstance();
        await configManager.updateConfig({
            anthropic: {
                apiKey: '',
                model: 'claude-3-sonnet-20240229'
            },
            openai: {
                apiKey: '',
                model: 'gpt-4-turbo-preview'
            },
            deepseek: {
                apiKey: '',
                model: 'deepseek-coder-33b-instruct'
            },
            gemini: {
                apiKey: '',
                model: 'gemini-pro'
            }
        });
        vscode.window.showInformationMessage('Settings reset to defaults');
    }
    getWebviewContent() {
        const configManager = api_1.APIConfigManager.getInstance();
        const config = configManager.getConfig();
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Assistant Settings</title>
                <style>
                    body {
                        padding: 20px;
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                        font-family: var(--vscode-font-family);
                    }
                    .settings-group {
                        margin-bottom: 20px;
                        padding: 15px;
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 4px;
                    }
                    .settings-group h2 {
                        margin-top: 0;
                        color: var(--vscode-editor-foreground);
                    }
                    .setting-item {
                        margin-bottom: 15px;
                    }
                    .setting-item label {
                        display: block;
                        margin-bottom: 5px;
                        color: var(--vscode-editor-foreground);
                    }
                    .setting-item input[type="text"],
                    .setting-item select {
                        width: 100%;
                        padding: 8px;
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 4px;
                    }
                    .setting-item input[type="checkbox"] {
                        margin-right: 8px;
                    }
                    button {
                        padding: 8px 16px;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        margin-right: 10px;
                    }
                    button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .status {
                        margin-top: 10px;
                        padding: 10px;
                        border-radius: 4px;
                        display: none;
                    }
                    .success {
                        background-color: var(--vscode-testing-iconPassed);
                        color: var(--vscode-editor-foreground);
                    }
                    .error {
                        background-color: var(--vscode-testing-iconFailed);
                        color: var(--vscode-editor-foreground);
                    }
                </style>
            </head>
            <body>
                <div class="settings-group">
                    <h2>API Configuration</h2>
                    
                    <div class="setting-item">
                        <h3>Anthropic (Claude)</h3>
                        <label for="anthropic-api-key">API Key</label>
                        <input type="text" id="anthropic-api-key" value="${config.anthropic.apiKey}" />
                        
                        <label for="anthropic-model">Model</label>
                        <select id="anthropic-model">
                            <option value="claude-3-opus-20240229" ${config.anthropic.model === 'claude-3-opus-20240229' ? 'selected' : ''}>Claude 3 Opus</option>
                            <option value="claude-3-sonnet-20240229" ${config.anthropic.model === 'claude-3-sonnet-20240229' ? 'selected' : ''}>Claude 3 Sonnet</option>
                            <option value="claude-3-haiku-20240307" ${config.anthropic.model === 'claude-3-haiku-20240307' ? 'selected' : ''}>Claude 3 Haiku</option>
                        </select>
                    </div>

                    <div class="setting-item">
                        <h3>OpenAI (GPT)</h3>
                        <label for="openai-api-key">API Key</label>
                        <input type="text" id="openai-api-key" value="${config.openai.apiKey}" />
                        
                        <label for="openai-model">Model</label>
                        <select id="openai-model">
                            <option value="gpt-4-turbo-preview" ${config.openai.model === 'gpt-4-turbo-preview' ? 'selected' : ''}>GPT-4 Turbo</option>
                            <option value="gpt-3.5-turbo" ${config.openai.model === 'gpt-3.5-turbo' ? 'selected' : ''}>GPT-3.5 Turbo</option>
                        </select>
                    </div>

                    <div class="setting-item">
                        <h3>DeepSeek</h3>
                        <label for="deepseek-api-key">API Key</label>
                        <input type="text" id="deepseek-api-key" value="${config.deepseek.apiKey}" />
                        
                        <label for="deepseek-model">Model</label>
                        <select id="deepseek-model">
                            <option value="deepseek-coder-33b-instruct" ${config.deepseek.model === 'deepseek-coder-33b-instruct' ? 'selected' : ''}>DeepSeek Coder 33B</option>
                            <option value="deepseek-chat" ${config.deepseek.model === 'deepseek-chat' ? 'selected' : ''}>DeepSeek Chat</option>
                        </select>
                    </div>

                    <div class="setting-item">
                        <h3>Google (Gemini)</h3>
                        <label for="gemini-api-key">API Key</label>
                        <input type="text" id="gemini-api-key" value="${config.gemini.apiKey}" />
                        
                        <label for="gemini-model">Model</label>
                        <select id="gemini-model">
                            <option value="gemini-pro" ${config.gemini.model === 'gemini-pro' ? 'selected' : ''}>Gemini Pro</option>
                            <option value="gemini-pro-vision" ${config.gemini.model === 'gemini-pro-vision' ? 'selected' : ''}>Gemini Pro Vision</option>
                        </select>
                    </div>
                </div>

                <div class="settings-group">
                    <h2>Agent Settings</h2>
                    <div class="setting-item">
                        <label for="agent-mode">Agent Mode</label>
                        <select id="agent-mode">
                            <option value="fast" ${vscode.workspace.getConfiguration('wsh').get('agentMode') === 'fast' ? 'selected' : ''}>Fast</option>
                            <option value="slow" ${vscode.workspace.getConfiguration('wsh').get('agentMode') === 'slow' ? 'selected' : ''}>Slow</option>
                        </select>
                    </div>
                    <div class="setting-item">
                        <label for="fast-requests">Fast Requests per Day</label>
                        <input type="number" id="fast-requests" value="${vscode.workspace.getConfiguration('wsh').get('fastRequestsPerDay')}" />
                    </div>
                </div>

                <div id="status" class="status"></div>
                <button onclick="saveSettings()">Save Settings</button>
                <button onclick="resetSettings()">Reset to Defaults</button>

                <script>
                    function saveSettings() {
                        const settings = {
                            anthropic: {
                                apiKey: document.getElementById('anthropic-api-key').value,
                                model: document.getElementById('anthropic-model').value
                            },
                            openai: {
                                apiKey: document.getElementById('openai-api-key').value,
                                model: document.getElementById('openai-model').value
                            },
                            deepseek: {
                                apiKey: document.getElementById('deepseek-api-key').value,
                                model: document.getElementById('deepseek-model').value
                            },
                            gemini: {
                                apiKey: document.getElementById('gemini-api-key').value,
                                model: document.getElementById('gemini-model').value
                            }
                        };

                        vscode.postMessage({
                            command: 'updateSettings',
                            settings: settings
                        });
                    }

                    function resetSettings() {
                        vscode.postMessage({
                            command: 'resetSettings'
                        });
                    }
                </script>
            </body>
            </html>
        `;
    }
}
exports.SettingsView = SettingsView;
//# sourceMappingURL=SettingsView.js.map