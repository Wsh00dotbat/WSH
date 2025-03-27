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
exports.deactivate = exports.activate = void 0;
const vscode = __importStar(require("vscode"));
const ChatView_1 = require("./webview/ChatView");
const SettingsView_1 = require("./webview/SettingsView");
const CodebaseView_1 = require("./webview/CodebaseView");
const PremiumFeatures_1 = require("./features/PremiumFeatures");
const aiService_1 = require("./services/aiService");
const api_1 = require("./config/api");
const CodeCompletionProvider_1 = require("./providers/CodeCompletionProvider");
const ProjectAnalyzer_1 = require("./services/ProjectAnalyzer");
const DependencyGraph_1 = require("./services/DependencyGraph");
const ArchitectureView_1 = require("./views/ArchitectureView");
const DependenciesView_1 = require("./views/DependenciesView");
const InsightsView_1 = require("./views/InsightsView");
async function activate(context) {
    const config = vscode.workspace.getConfiguration('projectmind');
    const aiConfig = {
        mode: config.get('mode') || 'ask',
        searchDepth: config.get('searchDepth') || 3,
        ui: config.get('ui') || {
            theme: 'dark',
            fontSize: 14,
            showLineNumbers: true,
            wordWrap: true,
            showTokenCount: true
        }
    };
    // Initialize views and services
    const chatView = ChatView_1.ChatView.getInstance(context.extensionUri, context);
    const settingsView = SettingsView_1.SettingsView.getInstance(context.extensionUri, context);
    const codebaseView = CodebaseView_1.CodebaseView.getInstance(context.extensionUri, context);
    const premiumFeatures = PremiumFeatures_1.PremiumFeatures.getInstance();
    const aiService = aiService_1.AIService.getInstance();
    const apiConfigManager = api_1.APIConfigManager.getInstance();
    const projectAnalyzer = new ProjectAnalyzer_1.ProjectAnalyzer();
    const dependencyGraph = new DependencyGraph_1.DependencyGraph();
    const architectureView = new ArchitectureView_1.ArchitectureView(projectAnalyzer);
    const dependenciesView = new DependenciesView_1.DependenciesView(dependencyGraph);
    const insightsView = new InsightsView_1.InsightsView(projectAnalyzer);
    // Register all commands
    const commands = [
        // Project Analysis Commands
        vscode.commands.registerCommand('projectmind.analyzeProject', async () => {
            const workspaceFolders = vscode.workspace.workspaceFolders;
            if (!workspaceFolders) {
                vscode.window.showErrorMessage('No workspace folder found');
                return;
            }
            try {
                await projectAnalyzer.analyzeProject(workspaceFolders[0].uri.fsPath);
                vscode.window.showInformationMessage('Project analysis completed');
            }
            catch (error) {
                vscode.window.showErrorMessage('Failed to analyze project: ' + error);
            }
        }),
        vscode.commands.registerCommand('projectmind.showDependencies', async () => {
            await dependenciesView.show();
        }),
        vscode.commands.registerCommand('projectmind.showArchitecture', async () => {
            await architectureView.show();
        }),
        vscode.commands.registerCommand('projectmind.findRelatedFiles', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }
            try {
                const relatedFiles = await projectAnalyzer.findRelatedFiles(editor.document.fileName);
                const items = relatedFiles.map(file => ({
                    label: file,
                    description: 'Related file'
                }));
                const selected = await vscode.window.showQuickPick(items, {
                    placeHolder: 'Select a related file to open'
                });
                if (selected) {
                    const document = await vscode.workspace.openTextDocument(selected.label);
                    await vscode.window.showTextDocument(document);
                }
            }
            catch (error) {
                vscode.window.showErrorMessage('Failed to find related files: ' + error);
            }
        }),
        vscode.commands.registerCommand('projectmind.showInsights', async () => {
            await insightsView.show();
        }),
        // Code Generation and Manipulation Commands
        vscode.commands.registerCommand('projectmind.generateCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }
            const prompt = await vscode.window.showInputBox({
                prompt: 'Describe the code you want to generate'
            });
            if (!prompt)
                return;
            try {
                const context = editor.document.getText();
                const response = await aiService.generateCode(prompt, context);
                const position = editor.selection.active;
                editor.edit((editBuilder) => {
                    editBuilder.insert(position, response.text);
                });
                vscode.window.showInformationMessage(`Code generated using ${response.model}`);
            }
            catch (error) {
                vscode.window.showErrorMessage('Failed to generate code: ' + error);
            }
        }),
        vscode.commands.registerCommand('projectmind.optimizeCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }
            const document = editor.document;
            const selection = editor.selection;
            const text = document.getText(selection);
            try {
                const response = await aiService.generateCode(`Optimize this code:\n${text}`);
                editor.edit((editBuilder) => {
                    editBuilder.replace(selection, response.text);
                });
                vscode.window.showInformationMessage(`Code optimized using ${response.model}`);
            }
            catch (error) {
                vscode.window.showErrorMessage('Failed to optimize code: ' + error);
            }
        }),
        vscode.commands.registerCommand('projectmind.explainCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }
            const document = editor.document;
            const selection = editor.selection;
            const text = document.getText(selection);
            try {
                const response = await aiService.generateCode(`Explain this code:\n${text}`);
                chatView.show();
                chatView.addMessage(response.text);
            }
            catch (error) {
                vscode.window.showErrorMessage('Failed to explain code: ' + error);
            }
        }),
        vscode.commands.registerCommand('projectmind.fixCode', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }
            const document = editor.document;
            const selection = editor.selection;
            const text = document.getText(selection);
            try {
                const response = await aiService.generateCode(`Fix this code:\n${text}`);
                editor.edit((editBuilder) => {
                    editBuilder.replace(selection, response.text);
                });
                vscode.window.showInformationMessage(`Code fixed using ${response.model}`);
            }
            catch (error) {
                vscode.window.showErrorMessage('Failed to fix code: ' + error);
            }
        }),
        // Search Commands
        vscode.commands.registerCommand('projectmind.searchCodebase', async () => {
            const query = await vscode.window.showInputBox({
                prompt: 'Enter your search query'
            });
            if (!query)
                return;
            try {
                const results = await premiumFeatures.searchCodebase(query);
                chatView.show();
                chatView.addMessage(`Search results for "${query}":\n\n${results.map(r => `File: ${r.file}\nRelevance: ${(r.relevance * 100).toFixed(1)}%\n\n${r.content}\n---\n`).join('\n')}`);
            }
            catch (error) {
                vscode.window.showErrorMessage('Failed to search codebase: ' + error);
            }
        }),
        vscode.commands.registerCommand('projectmind.webSearch', async () => {
            const query = await vscode.window.showInputBox({
                prompt: 'Enter your web search query'
            });
            if (!query)
                return;
            try {
                const results = await premiumFeatures.webSearch(query);
                chatView.show();
                chatView.addMessage(`Web search results for "${query}":\n\n${results.map(r => `${r.title}\n${r.url}\n${r.snippet}\n---\n`).join('\n')}`);
            }
            catch (error) {
                vscode.window.showErrorMessage('Failed to search web: ' + error);
            }
        }),
        vscode.commands.registerCommand('projectmind.searchDocs', async () => {
            const query = await vscode.window.showInputBox({
                prompt: 'Enter your documentation search query'
            });
            if (!query)
                return;
            try {
                const results = await premiumFeatures.searchDocumentation(query);
                chatView.show();
                chatView.addMessage(`Documentation results for "${query}":\n\n${results.map(r => `${r.title}\n${r.url}\n${r.content}\n---\n`).join('\n')}`);
            }
            catch (error) {
                vscode.window.showErrorMessage('Failed to search documentation: ' + error);
            }
        }),
        // Image Analysis Command
        vscode.commands.registerCommand('projectmind.analyzeImage', async () => {
            const imagePath = await vscode.window.showOpenDialog({
                canSelectFiles: true,
                canSelectFolders: false,
                canSelectMany: false,
                filters: {
                    'Images': ['png', 'jpg', 'jpeg', 'gif']
                }
            });
            if (!imagePath || imagePath.length === 0)
                return;
            try {
                const analysis = await premiumFeatures.analyzeImage(imagePath[0].fsPath);
                chatView.show();
                chatView.addMessage(`Image Analysis:\n\n${analysis}`);
            }
            catch (error) {
                vscode.window.showErrorMessage('Failed to analyze image: ' + error);
            }
        }),
        // Error Fixing Command
        vscode.commands.registerCommand('projectmind.fixError', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }
            const document = editor.document;
            const selection = editor.selection;
            const text = document.getText(selection);
            try {
                const response = await aiService.generateCode(`Fix the errors in this code:\n${text}`);
                editor.edit((editBuilder) => {
                    editBuilder.replace(selection, response.text);
                });
                vscode.window.showInformationMessage(`Errors fixed using ${response.model}`);
            }
            catch (error) {
                vscode.window.showErrorMessage('Failed to fix code: ' + error);
            }
        }),
        // Cursor Movement Commands
        vscode.commands.registerCommand('projectmind.predictCursor', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor)
                return;
            const position = editor.selection.active;
            const predictedPosition = await premiumFeatures.predictCursorMovement(editor, position);
            editor.selection = new vscode.Selection(predictedPosition, predictedPosition);
        }),
        vscode.commands.registerCommand('projectmind.smartCursorJump', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor)
                return;
            const position = editor.selection.active;
            const context = editor.document.getText();
            const response = await aiService.generateCode(`Given this code context, where would be the most logical place to move the cursor next?\n${context}`);
            const match = response.text.match(/line: (\d+), column: (\d+)/);
            if (match) {
                const newPosition = new vscode.Position(parseInt(match[1]) - 1, parseInt(match[2]) - 1);
                editor.selection = new vscode.Selection(newPosition, newPosition);
                editor.revealRange(new vscode.Range(newPosition, newPosition));
            }
        }),
        vscode.commands.registerCommand('projectmind.selectSmartRange', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor)
                return;
            const position = editor.selection.active;
            const context = editor.document.getText();
            const response = await aiService.generateCode(`Given this code context, what would be the most logical range of code to select?\n${context}`);
            const match = response.text.match(/start: line: (\d+), column: (\d+); end: line: (\d+), column: (\d+)/);
            if (match) {
                const start = new vscode.Position(parseInt(match[1]) - 1, parseInt(match[2]) - 1);
                const end = new vscode.Position(parseInt(match[3]) - 1, parseInt(match[4]) - 1);
                editor.selection = new vscode.Selection(start, end);
                editor.revealRange(new vscode.Range(start, end));
            }
        }),
        vscode.commands.registerCommand('projectmind.cursorHistory', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor)
                return;
            const history = await premiumFeatures.getCursorHistory();
            const items = history.map((pos, index) => ({
                label: `Position ${index + 1}: Line ${pos.line + 1}, Column ${pos.character + 1}`,
                description: editor.document.lineAt(pos.line).text.trim(),
                position: pos
            }));
            const selected = await vscode.window.showQuickPick(items, {
                placeHolder: 'Select a cursor position to jump to'
            });
            if (selected && selected.position) {
                editor.selection = new vscode.Selection(selected.position, selected.position);
                editor.revealRange(new vscode.Range(selected.position, selected.position));
            }
        }),
        // Agent Commands
        vscode.commands.registerCommand('projectmind.startAgent', async () => {
            try {
                if (!apiConfigManager.validateConfig()) {
                    vscode.window.showErrorMessage('Please configure your API keys in settings first');
                    settingsView.show();
                    return;
                }
                const agentMode = vscode.workspace.getConfiguration('projectmind').get('agentMode', 'fast');
                const agent = PremiumFeatures_1.PremiumFeatures.getInstance();
                if (agentMode === 'fast') {
                    const fastRequestsLeft = vscode.workspace.getConfiguration('projectmind').get('fastRequestsPerDay', 100);
                    if (fastRequestsLeft <= 0) {
                        vscode.window.showErrorMessage('Daily fast request limit reached. Please try again tomorrow or switch to slow mode.');
                        return;
                    }
                }
                vscode.window.showInformationMessage(`Starting AI agent in ${agentMode} mode...`);
                await agent.startAgent();
                vscode.window.showInformationMessage('AI agent is now running and ready to assist!');
            }
            catch (error) {
                vscode.window.showErrorMessage(`Failed to start AI agent: ${error}`);
                console.error('Agent start error:', error);
            }
        }),
        vscode.commands.registerCommand('projectmind.runCommand', async () => {
            const command = await vscode.window.showInputBox({
                prompt: 'Enter command to run',
                placeHolder: 'e.g., git status'
            });
            if (command) {
                const terminal = vscode.window.createTerminal('AI Command');
                terminal.sendText(command);
                terminal.show();
            }
        }),
        // Code Rewriting Command
        vscode.commands.registerCommand('projectmind.smartRewrite', async () => {
            const editor = vscode.window.activeTextEditor;
            if (!editor) {
                vscode.window.showErrorMessage('No active editor');
                return;
            }
            const selection = editor.selection;
            const text = editor.document.getText(selection);
            if (!text) {
                vscode.window.showErrorMessage('No text selected');
                return;
            }
            try {
                const response = await aiService.generateCode(`Rewrite this code in a better way:\n${text}`);
                editor.edit(editBuilder => {
                    editBuilder.replace(selection, response.text);
                });
                vscode.window.showInformationMessage(`Code rewritten using ${response.model}`);
            }
            catch (error) {
                vscode.window.showErrorMessage('Failed to rewrite code: ' + error);
            }
        }),
        // View Commands
        vscode.commands.registerCommand('projectmind.openChat', () => {
            chatView.show();
        }),
        vscode.commands.registerCommand('projectmind.openSettings', () => {
            settingsView.show();
        }),
        vscode.commands.registerCommand('projectmind.openCodebase', () => {
            codebaseView.show();
        })
    ];
    // Register all commands with the extension context
    commands.forEach(command => context.subscriptions.push(command));
    // Register the completion provider
    const completionProvider = new CodeCompletionProvider_1.CodeCompletionProvider();
    context.subscriptions.push(vscode.languages.registerCompletionItemProvider(['javascript', 'typescript', 'python', 'java', 'cpp', 'csharp'], completionProvider));
    // Set up file system watcher for automatic project analysis
    const fileWatcher = vscode.workspace.createFileSystemWatcher('**/*.{ts,js,py,java,cpp,cs}');
    fileWatcher.onDidChange(async (uri) => {
        if (!projectAnalyzer.isAnalysisInProgress()) {
            await projectAnalyzer.updateAnalysis(uri.fsPath);
        }
    });
    context.subscriptions.push(fileWatcher);
}
exports.activate = activate;
function deactivate() {
    // Cleanup will be handled automatically by VS Code
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map