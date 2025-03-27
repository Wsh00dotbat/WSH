import * as vscode from 'vscode';
import { marked } from 'marked';
import hljs from 'highlight.js';

interface ChatSettings {
    theme: 'light' | 'dark' | 'system';
    fontSize: number;
    showLineNumbers: boolean;
    wordWrap: boolean;
    showTokenCount: boolean;
    codeHighlighting: boolean;
    markdownPreview: boolean;
    fileReferences: boolean;
    autoScroll: boolean;
    compactMode: boolean;
    showTimestamps: boolean;
    showFileIcons: boolean;
    enableCodeActions: boolean;
    enableQuickActions: boolean;
    enableCodeLens: boolean;
    enableHoverInfo: boolean;
    enableInlineDiff: boolean;
    enableSmartSelection: boolean;
}

export class ChatView {
    private static instance: ChatView;
    private panel: vscode.WebviewPanel | undefined;
    private messages: Array<{ 
        role: 'user' | 'assistant', 
        content: string,
        timestamp: Date,
        fileReferences?: Array<{ file: string, line: number }>,
        codeBlocks?: Array<{ language: string, code: string }>
    }> = [];
    private settings: ChatSettings;
    private context: vscode.ExtensionContext;

    private constructor(private readonly extensionUri: vscode.Uri, context: vscode.ExtensionContext) {
        this.context = context;
        this.settings = this.loadSettings();
    }

    private loadSettings(): ChatSettings {
        const config = vscode.workspace.getConfiguration('projectmind.chat');
        return {
            theme: config.get('theme') || 'system',
            fontSize: config.get('fontSize') || 14,
            showLineNumbers: config.get('showLineNumbers') ?? true,
            wordWrap: config.get('wordWrap') ?? true,
            showTokenCount: config.get('showTokenCount') ?? true,
            codeHighlighting: config.get('codeHighlighting') ?? true,
            markdownPreview: config.get('markdownPreview') ?? true,
            fileReferences: config.get('fileReferences') ?? true,
            autoScroll: config.get('autoScroll') ?? true,
            compactMode: config.get('compactMode') ?? false,
            showTimestamps: config.get('showTimestamps') ?? true,
            showFileIcons: config.get('showFileIcons') ?? true,
            enableCodeActions: config.get('enableCodeActions') ?? true,
            enableQuickActions: config.get('enableQuickActions') ?? true,
            enableCodeLens: config.get('enableCodeLens') ?? true,
            enableHoverInfo: config.get('enableHoverInfo') ?? true,
            enableInlineDiff: config.get('enableInlineDiff') ?? true,
            enableSmartSelection: config.get('enableSmartSelection') ?? true
        };
    }

    public static getInstance(extensionUri: vscode.Uri, context: vscode.ExtensionContext): ChatView {
        if (!ChatView.instance) {
            ChatView.instance = new ChatView(extensionUri, context);
        }
        return ChatView.instance;
    }

    public show() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.Two);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'aiChat',
            'AI Chat',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true,
                localResourceRoots: [this.extensionUri]
            }
        );

        this.panel.webview.html = this.getWebviewContent();

        this.panel.webview.onDidReceiveMessage(
            async message => {
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
                    case 'updateSettings':
                        await this.updateSettings(message.settings);
                        break;
                    case 'openFile':
                        this.openFile(message.file, message.line);
                        break;
                    case 'applyCodeAction':
                        await this.applyCodeAction(message.action);
                        break;
                    case 'showQuickActions':
                        await this.showQuickActions(message.context);
                        break;
                    case 'toggleCodeLens':
                        this.toggleCodeLens(message.enabled);
                        break;
                    case 'showHoverInfo':
                        await this.showHoverInfo(message.context);
                        break;
                    case 'applyInlineDiff':
                        await this.applyInlineDiff(message.diff);
                        break;
                    case 'smartSelect':
                        await this.smartSelect(message.context);
                        break;
                }
            },
            undefined,
            this.context.subscriptions
        );

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
    }

    private async handleUserMessage(text: string) {
        this.addMessage(text, 'user');
        try {
            // Here you would typically call your AI service
            const response = await this.getAIResponse(text);
            this.addMessage(response, 'assistant');
        } catch (error) {
            this.addMessage('Sorry, I encountered an error processing your request.', 'assistant');
        }
    }

    private async getAIResponse(text: string): Promise<string> {
        // Implement AI service call here
        return `I received your message: ${text}`;
    }

    private async openFile(file: string, line: number) {
        try {
            const document = await vscode.workspace.openTextDocument(file);
            await vscode.window.showTextDocument(document, {
                selection: new vscode.Range(line - 1, 0, line - 1, 0),
                preserveFocus: true
            });
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open file: ${error}`);
        }
    }

    private async applyCodeAction(action: any) {
        // Implement code action application
        console.log('Applying code action:', action);
    }

    private async showQuickActions(context: any) {
        // Implement quick actions menu
        console.log('Showing quick actions for:', context);
    }

    private toggleCodeLens(enabled: boolean) {
        this.settings.enableCodeLens = enabled;
        this.updateSettings(this.settings);
    }

    private async showHoverInfo(context: any) {
        // Implement hover info display
        console.log('Showing hover info for:', context);
    }

    private async applyInlineDiff(diff: any) {
        // Implement inline diff application
        console.log('Applying inline diff:', diff);
    }

    private async smartSelect(context: any) {
        // Implement smart selection
        console.log('Smart selecting:', context);
    }

    private clearChat() {
        this.messages = [];
        if (this.panel) {
            this.panel.webview.postMessage({ command: 'clearChat' });
        }
    }

    private saveChat() {
        const content = this.messages.map(m => `${m.role}: ${m.content}`).join('\n\n');
        vscode.workspace.fs.writeFile(
            vscode.Uri.joinPath(this.context.globalStorageUri, 'chat-history.txt'),
            Buffer.from(content)
        );
        vscode.window.showInformationMessage('Chat history saved!');
    }

    private async updateSettings(newSettings: Partial<ChatSettings>) {
        this.settings = { ...this.settings, ...newSettings };
        const config = vscode.workspace.getConfiguration('projectmind.chat');
        await config.update('theme', this.settings.theme, true);
        await config.update('fontSize', this.settings.fontSize, true);
        await config.update('showLineNumbers', this.settings.showLineNumbers, true);
        await config.update('wordWrap', this.settings.wordWrap, true);
        await config.update('showTokenCount', this.settings.showTokenCount, true);
        await config.update('codeHighlighting', this.settings.codeHighlighting, true);
        await config.update('markdownPreview', this.settings.markdownPreview, true);
        await config.update('fileReferences', this.settings.fileReferences, true);
        await config.update('autoScroll', this.settings.autoScroll, true);
        await config.update('compactMode', this.settings.compactMode, true);
        await config.update('showTimestamps', this.settings.showTimestamps, true);
        await config.update('showFileIcons', this.settings.showFileIcons, true);
        await config.update('enableCodeActions', this.settings.enableCodeActions, true);
        await config.update('enableQuickActions', this.settings.enableQuickActions, true);
        await config.update('enableCodeLens', this.settings.enableCodeLens, true);
        await config.update('enableHoverInfo', this.settings.enableHoverInfo, true);
        await config.update('enableInlineDiff', this.settings.enableInlineDiff, true);
        await config.update('enableSmartSelection', this.settings.enableSmartSelection, true);

        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'updateSettings',
                settings: this.settings
            });
        }
    }

    public addMessage(content: string, role: 'user' | 'assistant', fileReferences?: Array<{ file: string, line: number }>, codeBlocks?: Array<{ language: string, code: string }>) {
        this.messages.push({ 
            role, 
            content,
            timestamp: new Date(),
            fileReferences,
            codeBlocks
        });
        if (this.panel) {
            this.panel.webview.postMessage({
                command: 'addMessage',
                message: { 
                    role, 
                    content: this.formatMessage(content),
                    timestamp: new Date(),
                    fileReferences,
                    codeBlocks
                }
            });
        }
    }

    private formatMessage(content: string): string {
        const renderer = new marked.Renderer();
        renderer.code = (code: string, language: string | undefined): string => {
            if (language && hljs.getLanguage(language)) {
                try {
                    return hljs.highlight(code, { language }).value;
                } catch (err) {
                    console.error('Error highlighting code:', err);
                }
            }
            try {
                return hljs.highlightAuto(code).value;
            } catch (err) {
                console.error('Error auto-highlighting code:', err);
                return code;
            }
        };

        marked.use({ renderer });
        const result = marked.parse(content);
        return typeof result === 'string' ? result : 'Processing markdown...';
    }

    private getWebviewContent(): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>AI Chat</title>
                <style>
                    :root {
                        --vscode-font-family: var(--vscode-font-family);
                        --vscode-editor-foreground: var(--vscode-editor-foreground);
                        --vscode-editor-background: var(--vscode-editor-background);
                        --vscode-input-background: var(--vscode-input-background);
                        --vscode-input-foreground: var(--vscode-input-foreground);
                        --vscode-button-background: var(--vscode-button-background);
                        --vscode-button-foreground: var(--vscode-button-foreground);
                        --vscode-textLink-foreground: var(--vscode-textLink-foreground);
                        --vscode-editor-inactiveSelectionBackground: var(--vscode-editor-inactiveSelectionBackground);
                    }

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

                    .toolbar {
                        display: flex;
                        gap: 10px;
                        margin-bottom: 10px;
                        padding: 10px;
                        background-color: var(--vscode-editor-inactiveSelectionBackground);
                        border-radius: 6px;
                    }

                    .toolbar button {
                        padding: 5px 10px;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                        transition: background-color 0.2s;
                    }

                    .toolbar button:hover {
                        background-color: var(--vscode-button-hoverBackground);
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

                    .message-timestamp {
                        font-size: 0.8em;
                        opacity: 0.7;
                        margin-top: 5px;
                    }

                    .message-content {
                        margin-top: 5px;
                    }

                    .code-block {
                        background-color: var(--vscode-editor-background);
                        padding: 10px;
                        border-radius: 4px;
                        margin: 10px 0;
                        overflow-x: auto;
                    }

                    .code-block pre {
                        margin: 0;
                        white-space: pre-wrap;
                    }

                    .file-reference {
                        color: var(--vscode-textLink-foreground);
                        cursor: pointer;
                        text-decoration: underline;
                    }

                    .file-reference:hover {
                        opacity: 0.8;
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

                    .settings-panel {
                        position: fixed;
                        top: 0;
                        right: -300px;
                        width: 300px;
                        height: 100%;
                        background-color: var(--vscode-editor-background);
                        border-left: 1px solid var(--vscode-input-border);
                        padding: 20px;
                        transition: right 0.3s ease;
                        z-index: 1000;
                    }

                    .settings-panel.open {
                        right: 0;
                    }

                    .settings-group {
                        margin-bottom: 20px;
                    }

                    .settings-group h3 {
                        margin-top: 0;
                        margin-bottom: 10px;
                    }

                    .setting-item {
                        margin-bottom: 10px;
                    }

                    .setting-item label {
                        display: block;
                        margin-bottom: 5px;
                    }

                    .setting-item select,
                    .setting-item input[type="number"] {
                        width: 100%;
                        padding: 5px;
                        background-color: var(--vscode-input-background);
                        color: var(--vscode-input-foreground);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 4px;
                    }

                    .setting-item input[type="checkbox"] {
                        margin-right: 5px;
                    }

                    .code-lens {
                        position: absolute;
                        right: 10px;
                        top: 50%;
                        transform: translateY(-50%);
                        display: none;
                    }

                    .message:hover .code-lens {
                        display: block;
                    }

                    .quick-actions {
                        position: absolute;
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 4px;
                        padding: 5px;
                        display: none;
                    }

                    .message:hover .quick-actions {
                        display: block;
                    }

                    .hover-info {
                        position: absolute;
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 4px;
                        padding: 10px;
                        max-width: 300px;
                        display: none;
                    }

                    .message:hover .hover-info {
                        display: block;
                    }

                    .inline-diff {
                        background-color: var(--vscode-editor-background);
                        border: 1px solid var(--vscode-input-border);
                        border-radius: 4px;
                        padding: 10px;
                        margin: 10px 0;
                    }

                    .diff-add {
                        color: var(--vscode-gitDecoration-addedResourceForeground);
                    }

                    .diff-remove {
                        color: var(--vscode-gitDecoration-deletedResourceForeground);
                    }

                    .smart-selection {
                        background-color: var(--vscode-editor-selectionBackground);
                        color: var(--vscode-editor-selectionForeground);
                    }
                </style>
            </head>
            <body>
                <div class="chat-container">
                    <div class="toolbar">
                        <button onclick="clearChat()">Clear Chat</button>
                        <button onclick="saveChat()">Save Chat</button>
                        <button onclick="toggleSettings()">Settings</button>
                    </div>
                    <div class="messages" id="messages"></div>
                    <div class="input-container">
                        <input type="text" id="message-input" placeholder="Type your message...">
                        <button onclick="sendMessage()">Send</button>
                    </div>
                </div>

                <div class="settings-panel" id="settings-panel">
                    <h2>Chat Settings</h2>
                    <div class="settings-group">
                        <h3>Appearance</h3>
                        <div class="setting-item">
                            <label for="theme">Theme</label>
                            <select id="theme">
                                <option value="light">Light</option>
                                <option value="dark">Dark</option>
                                <option value="system">System</option>
                            </select>
                        </div>
                        <div class="setting-item">
                            <label for="fontSize">Font Size</label>
                            <input type="number" id="fontSize" min="8" max="24" value="14">
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3>Code Display</h3>
                        <div class="setting-item">
                            <input type="checkbox" id="showLineNumbers" checked>
                            <label for="showLineNumbers">Show Line Numbers</label>
                        </div>
                        <div class="setting-item">
                            <input type="checkbox" id="wordWrap" checked>
                            <label for="wordWrap">Word Wrap</label>
                        </div>
                        <div class="setting-item">
                            <input type="checkbox" id="codeHighlighting" checked>
                            <label for="codeHighlighting">Code Highlighting</label>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3>Features</h3>
                        <div class="setting-item">
                            <input type="checkbox" id="markdownPreview" checked>
                            <label for="markdownPreview">Markdown Preview</label>
                        </div>
                        <div class="setting-item">
                            <input type="checkbox" id="fileReferences" checked>
                            <label for="fileReferences">File References</label>
                        </div>
                        <div class="setting-item">
                            <input type="checkbox" id="autoScroll" checked>
                            <label for="autoScroll">Auto Scroll</label>
                        </div>
                    </div>

                    <div class="settings-group">
                        <h3>Advanced Features</h3>
                        <div class="setting-item">
                            <input type="checkbox" id="enableCodeActions" checked>
                            <label for="enableCodeActions">Code Actions</label>
                        </div>
                        <div class="setting-item">
                            <input type="checkbox" id="enableQuickActions" checked>
                            <label for="enableQuickActions">Quick Actions</label>
                        </div>
                        <div class="setting-item">
                            <input type="checkbox" id="enableCodeLens" checked>
                            <label for="enableCodeLens">Code Lens</label>
                        </div>
                        <div class="setting-item">
                            <input type="checkbox" id="enableHoverInfo" checked>
                            <label for="enableHoverInfo">Hover Info</label>
                        </div>
                        <div class="setting-item">
                            <input type="checkbox" id="enableInlineDiff" checked>
                            <label for="enableInlineDiff">Inline Diff</label>
                        </div>
                        <div class="setting-item">
                            <input type="checkbox" id="enableSmartSelection" checked>
                            <label for="enableSmartSelection">Smart Selection</label>
                        </div>
                    </div>
                </div>

                <script>
                    const vscode = acquireVsCodeApi();
                    const messagesContainer = document.getElementById('messages');
                    const messageInput = document.getElementById('message-input');
                    const settingsPanel = document.getElementById('settings-panel');
                    let currentSettings = ${JSON.stringify(this.settings)};

                    function addMessage(message) {
                        const messageDiv = document.createElement('div');
                        messageDiv.className = \`message \${message.role}-message\`;
                        
                        const content = document.createElement('div');
                        content.className = 'message-content';
                        content.innerHTML = message.content;
                        
                        const timestamp = document.createElement('div');
                        timestamp.className = 'message-timestamp';
                        timestamp.textContent = new Date(message.timestamp).toLocaleString();
                        
                        messageDiv.appendChild(content);
                        messageDiv.appendChild(timestamp);
                        
                        if (message.fileReferences) {
                            message.fileReferences.forEach(ref => {
                                const link = document.createElement('a');
                                link.className = 'file-reference';
                                link.textContent = \`\${ref.file}:\${ref.line}\`;
                                link.onclick = () => vscode.postMessage({
                                    command: 'openFile',
                                    file: ref.file,
                                    line: ref.line
                                });
                                messageDiv.appendChild(link);
                            });
                        }
                        
                        if (message.codeBlocks) {
                            message.codeBlocks.forEach(block => {
                                const codeDiv = document.createElement('div');
                                codeDiv.className = 'code-block';
                                const pre = document.createElement('pre');
                                pre.innerHTML = block.code;
                                codeDiv.appendChild(pre);
                                messageDiv.appendChild(codeDiv);
                            });
                        }
                        
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

                    function toggleSettings() {
                        settingsPanel.classList.toggle('open');
                    }

                    function sendMessage() {
                        const text = messageInput.value.trim();
                        if (text) {
                            vscode.postMessage({ command: 'sendMessage', text });
                            messageInput.value = '';
                        }
                    }

                    function updateSettings(settings) {
                        currentSettings = settings;
                        document.body.style.fontSize = \`\${settings.fontSize}px\`;
                        // Update other settings as needed
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
                            case 'updateSettings':
                                updateSettings(message.settings);
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
} 