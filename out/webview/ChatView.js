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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatView = void 0;
const vscode = __importStar(require("vscode"));
const marked_1 = require("marked");
const highlight_js_1 = __importDefault(require("highlight.js"));
class ChatView {
    constructor(extensionUri, context) {
        this.extensionUri = extensionUri;
        this.context = context;
        this.messages = [];
    }
    static getInstance(extensionUri, context) {
        if (!ChatView.instance) {
            ChatView.instance = new ChatView(extensionUri, context);
        }
        return ChatView.instance;
    }
    show() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.Two);
            return;
        }
        this.panel = vscode.window.createWebviewPanel('aiChat', 'AI Chat', vscode.ViewColumn.Two, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        this.panel.webview.html = this.getWebviewContent();
        this.panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'sendMessage':
                    await this.handleUserMessage(message.text);
                    break;
                case 'clearChat':
                    this.clearChat();
                    break;
                case 'saveChat':
                    this.saveChat();
                    break;
            }
        }, undefined, this.context.subscriptions);
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }
    addMessage(content, role = 'assistant') {
        this.messages.push({ role, content });
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'addMessage',
                message: { role, content: this.formatMessage(content) }
            });
        }
    }
    async handleUserMessage(text) {
        this.addMessage(text, 'user');
        // Here you would typically call your AI service
        // For now, we'll just echo back
        this.addMessage(`I received your message: ${text}`);
    }
    clearChat() {
        this.messages = [];
        if (this.panel) {
            this.panel.webview.postMessage({ command: 'clearChat' });
        }
    }
    saveChat() {
        const content = this.messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
        vscode.workspace.fs.writeFile(vscode.Uri.joinPath(this.context.globalStorageUri, 'chat-history.txt'), Buffer.from(content));
        vscode.window.showInformationMessage('Chat history saved!');
    }
    formatMessage(content) {
        // Configure marked with proper types
        const renderer = new marked_1.marked.Renderer();
        renderer.code = (code, language) => {
            if (language && highlight_js_1.default.getLanguage(language)) {
                try {
                    return highlight_js_1.default.highlight(code, { language }).value;
                }
                catch (err) {
                    console.error('Error highlighting code:', err);
                }
            }
            try {
                return highlight_js_1.default.highlightAuto(code).value;
            }
            catch (err) {
                console.error('Error auto-highlighting code:', err);
                return code;
            }
        };
        marked_1.marked.use({ renderer });
        // marked.parse returns a Promise in newer versions
        const result = marked_1.marked.parse(content);
        if (typeof result === 'string') {
            return result;
        }
        // If it's a Promise, return a placeholder
        return 'Processing markdown...';
    }
    getWebviewContent() {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Chat</title>
                <style>
                    body {
                        padding: 20px;
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                        font-family: var(--vscode-font-family);
                    }
                    .chat-container {
                        display: flex;
                        flex-direction: column;
                        height: calc(100vh - 40px);
                    }
                    .messages {
                        flex: 1;
                        overflow-y: auto;
                        padding: 20px;
                        margin-bottom: 20px;
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 6px;
                    }
                    .message {
                        margin-bottom: 20px;
                        padding: 10px;
                        border-radius: 6px;
                        max-width: 80%;
                    }
                    .user-message {
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        margin-left: auto;
                    }
                    .assistant-message {
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        margin-right: auto;
                    }
                    .input-container {
                        display: flex;
                        gap: 10px;
                    }
                    #message-input {
                        flex: 1;
                        padding: 10px;
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 6px;
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        font-family: var(--vscode-font-family);
                    }
                    button {
                        padding: 10px 20px;
                        border: none;
                        border-radius: 6px;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        cursor: pointer;
                        transition: background-color 0.2s;
                    }
                    button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                    .toolbar {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 10px;
                    }
                    pre {
                        background-color: var(--vscode-editor-background);
                        padding: 10px;
                        border-radius: 4px;
                        overflow-x: auto;
                    }
                    code {
                        font-family: var(--vscode-editor-font-family);
                    }
                </style>
            </head>
            <body>
                <div class="chat-container">
                    <div class="toolbar">
                        <button onclick="clearChat()">Clear Chat</button>
                        <button onclick="saveChat()">Save Chat</button>
                    </div>
                    <div class="messages" id="messages"></div>
                    <div class="input-container">
                        <input type="text" id="message-input" placeholder="Type your message...">
                        <button onclick="sendMessage()">Send</button>
                    </div>
                </div>
                <script>
                    const vscode = acquireVsCodeApi();
                    const messagesContainer = document.getElementById('messages');
                    const messageInput = document.getElementById('message-input');

                    function addMessage(message) {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = \`message \${message.role}-message\`;
                        messageDiv.innerHTML = message.content;
                        messagesContainer.appendChild(messageDiv);
                        messagesContainer.scrollTop = messagesContainer.scrollHeight;
                    }

                    function clearChat() {
                        vscode.postMessage({ command: 'clearChat' });
                        messagesContainer.innerHTML = '';
                    }

                    function saveChat() {
                        vscode.postMessage({ command: 'saveChat' });
                    }

                    function sendMessage() {
                        const text = messageInput.value.trim();
                        if (text) {
                            vscode.postMessage({ command: 'sendMessage', text });
                            messageInput.value = '';
                        }
                    }

                    messageInput.addEventListener('keypress', (e) => {
                        if (e.key === 'Enter') {
                            sendMessage();
                        }
                    });

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'addMessage':
                                addMessage(message.message);
                                break;
                            case 'clearChat':
                                messagesContainer.innerHTML = '';
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}
exports.ChatView = ChatView;
//# sourceMappingURL=ChatView.js.map