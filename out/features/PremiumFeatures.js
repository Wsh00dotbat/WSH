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
exports.PremiumFeatures = void 0;
const vscode = __importStar(require("vscode"));
const axios_1 = __importDefault(require("axios"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const glob = __importStar(require("glob"));
const aiService_1 = require("../services/aiService");
class PremiumFeatures {
    constructor() {
        this.contextCache = new Map();
        this.isAgentRunning = false;
        this.cursorHistory = [];
        this.maxHistorySize = 50;
        this.tokenLimit = 4000;
        this.lastTokenReset = new Date();
        this.projectContext = {};
        this.codebaseCache = new Map();
        this.chatHistory = [];
        this.aiService = aiService_1.AIService.getInstance();
    }
    static getInstance() {
        if (!PremiumFeatures.instance) {
            PremiumFeatures.instance = new PremiumFeatures();
        }
        return PremiumFeatures.instance;
    }
    // Enhanced super elite agent with unlimited capabilities
    async startAgent() {
        try {
            this.isAgentRunning = true;
            // Set up event listeners for agent interactions
            vscode.window.onDidChangeActiveTextEditor(() => {
                if (this.isAgentRunning) {
                    this.handleEditorChange();
                }
            });
            vscode.workspace.onDidChangeTextDocument(() => {
                if (this.isAgentRunning) {
                    this.handleDocumentChange();
                }
            });
            // Initialize the agent's state with enhanced context
            this.agentState = {
                lastCommand: null,
                context: [],
                mode: 'elite',
                workspaceState: {
                    files: await this.getWorkspaceFiles(),
                    activeFile: vscode.window.activeTextEditor?.document.fileName,
                    lastEdit: null,
                    projectStructure: await this.analyzeProjectStructure(),
                    dependencies: await this.analyzeDependencies(),
                    codeMetrics: await this.calculateCodeMetrics(),
                    codebaseContext: await this.analyzeCodebaseContext()
                },
                taskQueue: [],
                isProcessing: false,
                tokenUsage: 0,
                lastTokenReset: new Date(),
                capabilities: {
                    codeGeneration: true,
                    codeAnalysis: true,
                    projectManagement: true,
                    codeCompletion: true,
                    prediction: true,
                    chat: true,
                    qa: true,
                    refactoring: true,
                    optimization: true,
                    documentation: true,
                    testing: true
                }
            };
            // Start the agent's main loop
            this.startAgentLoop();
            vscode.window.showInformationMessage('Super Elite AI agent initialized successfully');
        }
        catch (error) {
            console.error('Failed to initialize super elite AI agent:', error);
            throw new Error('Failed to initialize super elite AI agent');
        }
    }
    async analyzeProjectStructure() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders)
            return null;
        const rootPath = workspaceFolders[0].uri.fsPath;
        const structure = {
            root: rootPath,
            files: await this.getWorkspaceFiles(),
            directories: await this.getDirectories(rootPath),
            fileTypes: await this.analyzeFileTypes(rootPath)
        };
        return structure;
    }
    async analyzeDependencies() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders)
            return null;
        const rootPath = workspaceFolders[0].uri.fsPath;
        const packageJson = await this.readPackageJson(rootPath);
        const dependencies = {
            direct: packageJson?.dependencies || {},
            dev: packageJson?.devDependencies || {},
            peer: packageJson?.peerDependencies || {}
        };
        return dependencies;
    }
    async calculateCodeMetrics() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders)
            return null;
        const rootPath = workspaceFolders[0].uri.fsPath;
        const files = await this.getWorkspaceFiles();
        let totalLines = 0;
        let totalFiles = 0;
        let complexity = 0;
        for (const file of files) {
            const content = await fs.promises.readFile(path.join(rootPath, file), 'utf-8');
            const lines = content.split('\n').length;
            totalLines += lines;
            totalFiles++;
            complexity += this.calculateFileComplexity(content);
        }
        return {
            totalLines,
            totalFiles,
            averageComplexity: complexity / totalFiles,
            fileTypes: await this.analyzeFileTypes(rootPath)
        };
    }
    calculateFileComplexity(content) {
        // Basic complexity calculation based on control structures
        const controlStructures = [
            /if\s*\(/g,
            /for\s*\(/g,
            /while\s*\(/g,
            /switch\s*\(/g,
            /catch\s*\(/g,
            /\?\s*[^:]+:/g
        ];
        let complexity = 1; // Base complexity
        for (const structure of controlStructures) {
            const matches = content.match(structure);
            if (matches) {
                complexity += matches.length;
            }
        }
        return complexity;
    }
    async getDirectories(rootPath) {
        const dirs = await fs.promises.readdir(rootPath, { withFileTypes: true });
        return dirs
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
    }
    async analyzeFileTypes(rootPath) {
        const files = await this.getWorkspaceFiles();
        const types = {};
        for (const file of files) {
            const ext = path.extname(file).slice(1);
            types[ext] = (types[ext] || 0) + 1;
        }
        return types;
    }
    async readPackageJson(rootPath) {
        try {
            const content = await fs.promises.readFile(path.join(rootPath, 'package.json'), 'utf-8');
            return JSON.parse(content);
        }
        catch (error) {
            return null;
        }
    }
    async startAgentLoop() {
        while (this.isAgentRunning) {
            try {
                if (!this.agentState.isProcessing && this.agentState.taskQueue.length > 0) {
                    const task = this.agentState.taskQueue.shift();
                    if (task) {
                        await this.processTask(task);
                    }
                }
                // Reset token usage if needed
                const now = new Date();
                if (now.getTime() - this.agentState.lastTokenReset.getTime() > 24 * 60 * 60 * 1000) {
                    this.agentState.tokenUsage = 0;
                    this.agentState.lastTokenReset = now;
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            catch (error) {
                console.error('Error in agent loop:', error);
            }
        }
    }
    async processTask(task) {
        this.agentState.isProcessing = true;
        try {
            // Process the task based on its type
            switch (task.type) {
                case 'code_generation':
                    await this.handleCodeGeneration(task);
                    break;
                case 'code_optimization':
                    await this.handleCodeOptimization(task);
                    break;
                case 'error_fixing':
                    await this.handleErrorFixing(task);
                    break;
                case 'refactoring':
                    await this.handleRefactoring(task);
                    break;
                case 'documentation':
                    await this.handleDocumentation(task);
                    break;
                case 'testing':
                    await this.handleTesting(task);
                    break;
                default:
                    console.warn('Unknown task type:', task.type);
            }
        }
        finally {
            this.agentState.isProcessing = false;
        }
    }
    async handleCodeGeneration(task) {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        try {
            const response = await this.aiService.generateCode(task.prompt, editor.document.getText());
            await editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, response.text);
            });
            vscode.window.showInformationMessage(`Code generated using ${response.model}`);
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to generate code: ' + error);
        }
    }
    async handleCodeOptimization(task) {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        try {
            const response = await this.aiService.generateCode(`Optimize this code:\n${editor.document.getText(editor.selection)}`);
            await editor.edit(editBuilder => {
                editBuilder.replace(editor.selection, response.text);
            });
            vscode.window.showInformationMessage(`Code optimized using ${response.model}`);
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to optimize code: ' + error);
        }
    }
    async handleErrorFixing(task) {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        try {
            const response = await this.aiService.generateCode(`Fix the errors in this code:\n${editor.document.getText(editor.selection)}`);
            await editor.edit(editBuilder => {
                editBuilder.replace(editor.selection, response.text);
            });
            vscode.window.showInformationMessage(`Errors fixed using ${response.model}`);
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to fix code: ' + error);
        }
    }
    async handleRefactoring(task) {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        try {
            const response = await this.aiService.generateCode(`Refactor this code to improve its structure and maintainability:\n${editor.document.getText(editor.selection)}`);
            await editor.edit(editBuilder => {
                editBuilder.replace(editor.selection, response.text);
            });
            vscode.window.showInformationMessage(`Code refactored using ${response.model}`);
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to refactor code: ' + error);
        }
    }
    async handleDocumentation(task) {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        try {
            const response = await this.aiService.generateCode(`Generate comprehensive documentation for this code:\n${editor.document.getText(editor.selection)}`);
            await editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, response.text);
            });
            vscode.window.showInformationMessage(`Documentation generated using ${response.model}`);
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to generate documentation: ' + error);
        }
    }
    async handleTesting(task) {
        const editor = vscode.window.activeTextEditor;
        if (!editor)
            return;
        try {
            const response = await this.aiService.generateCode(`Generate unit tests for this code:\n${editor.document.getText(editor.selection)}`);
            await editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, response.text);
            });
            vscode.window.showInformationMessage(`Tests generated using ${response.model}`);
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to generate tests: ' + error);
        }
    }
    handleEditorChange() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            this.addToCursorHistory(editor.selection.active);
            this.agentState.context.push({
                type: 'editor_change',
                file: editor.document.fileName,
                timestamp: Date.now()
            });
        }
    }
    handleDocumentChange() {
        const editor = vscode.window.activeTextEditor;
        if (editor) {
            this.agentState.context.push({
                type: 'document_change',
                file: editor.document.fileName,
                timestamp: Date.now()
            });
        }
    }
    // Enhanced codebase search with context
    async searchCodebase(query) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders)
            return [];
        const rootPath = workspaceFolders[0].uri.fsPath;
        const files = await this.getWorkspaceFiles();
        const results = [];
        for (const file of files) {
            const content = await fs.promises.readFile(path.join(rootPath, file), 'utf-8');
            if (content.toLowerCase().includes(query.toLowerCase())) {
                results.push({
                    file,
                    content: this.getRelevantContext(content, query),
                    relevance: this.calculateRelevance(content, query)
                });
            }
        }
        return results.sort((a, b) => b.relevance - a.relevance);
    }
    getRelevantContext(content, query) {
        const lines = content.split('\n');
        const queryLower = query.toLowerCase();
        const contextLines = 5;
        const relevantLines = [];
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].toLowerCase().includes(queryLower)) {
                const start = Math.max(0, i - contextLines);
                const end = Math.min(lines.length, i + contextLines + 1);
                relevantLines.push(...lines.slice(start, end));
            }
        }
        return relevantLines.join('\n');
    }
    calculateRelevance(content, query) {
        const queryTerms = query.toLowerCase().split(/\s+/);
        const contentLower = content.toLowerCase();
        let relevance = 0;
        for (const term of queryTerms) {
            const matches = (contentLower.match(new RegExp(term, 'g')) || []).length;
            relevance += matches;
        }
        return relevance;
    }
    // Enhanced web search with better results
    async webSearch(query) {
        try {
            const response = await axios_1.default.get('https://api.codex.jaagrav.in/websearch', {
                params: {
                    query,
                    maxResults: 10,
                    includeCode: true
                }
            });
            return response.data.results.map((result) => ({
                title: result.title,
                url: result.url,
                snippet: result.snippet,
                code: result.code,
                relevance: result.relevance
            }));
        }
        catch (error) {
            console.error('Web search failed:', error);
            return [];
        }
    }
    // Enhanced documentation search
    async searchDocumentation(query) {
        try {
            const response = await axios_1.default.get('https://api.codex.jaagrav.in/docs', {
                params: {
                    query,
                    maxResults: 10,
                    includeExamples: true
                }
            });
            return response.data.results.map((result) => ({
                title: result.title,
                url: result.url,
                content: result.content,
                examples: result.examples,
                relevance: result.relevance
            }));
        }
        catch (error) {
            console.error('Documentation search failed:', error);
            return [];
        }
    }
    // Enhanced image analysis
    async analyzeImage(imagePath) {
        try {
            const imageData = await fs.promises.readFile(imagePath);
            const response = await axios_1.default.post('https://api.codex.jaagrav.in/analyze-image', {
                image: imageData.toString('base64'),
                analysisType: 'detailed',
                includeCode: true
            });
            return response.data.analysis;
        }
        catch (error) {
            console.error('Image analysis failed:', error);
            return 'Failed to analyze image';
        }
    }
    // Enhanced error fixing with multiple attempts
    async fixErrors(code, maxAttempts = 3) {
        let fixedCode = code;
        let attempts = 0;
        while (attempts < maxAttempts) {
            try {
                const response = await this.aiService.generateCode(`Fix the errors in this code:\n${fixedCode}`);
                fixedCode = response.text;
                if (this.validateCode(fixedCode)) {
                    break;
                }
            }
            catch (error) {
                console.error('Error fixing code:', error);
            }
            attempts++;
        }
        return fixedCode;
    }
    // Enhanced cursor prediction
    async predictCursorMovement(editor, position) {
        try {
            const context = editor.document.getText();
            const response = await this.aiService.generateCode(`Given this code context, predict the next logical cursor position:\n${context}`);
            const match = response.text.match(/line: (\d+), column: (\d+)/);
            if (match) {
                return new vscode.Position(parseInt(match[1]) - 1, parseInt(match[2]) - 1);
            }
        }
        catch (error) {
            console.error('Cursor prediction failed:', error);
        }
        return position;
    }
    // Cursor history management
    async getCursorHistory() {
        return this.cursorHistory;
    }
    addToCursorHistory(position) {
        this.cursorHistory.push(position);
        if (this.cursorHistory.length > this.maxHistorySize) {
            this.cursorHistory.shift();
        }
    }
    // Helper methods
    async getWorkspaceFiles() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders)
            return [];
        const rootPath = workspaceFolders[0].uri.fsPath;
        return glob.sync('**/*.{js,ts,py,java,cpp,cs}', {
            cwd: rootPath,
            ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
        });
    }
    validateCode(code) {
        // Enhanced code validation
        const basicValidation = code.length > 0 &&
            code.includes('function') ||
            code.includes('class') ||
            code.includes('const') ||
            code.includes('let') ||
            code.includes('var');
        if (!basicValidation)
            return false;
        // Check for common syntax errors
        try {
            // For JavaScript/TypeScript
            if (code.includes('function') || code.includes('const')) {
                new Function(code);
            }
            // For Python
            else if (code.includes('def') || code.includes('class')) {
                // Python validation would go here
            }
            // For Java
            else if (code.includes('public class')) {
                // Java validation would go here
            }
            // For C++
            else if (code.includes('int main()')) {
                // C++ validation would go here
            }
            // For C#
            else if (code.includes('namespace')) {
                // C# validation would go here
            }
            return true;
        }
        catch (error) {
            return false;
        }
    }
    // Enhanced codebase analysis
    async analyzeCodebaseContext() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders)
            return null;
        const rootPath = workspaceFolders[0].uri.fsPath;
        const files = await this.getWorkspaceFiles();
        const context = {
            totalFiles: files.length,
            fileTypes: await this.analyzeFileTypes(rootPath),
            imports: await this.analyzeImports(files),
            functions: await this.analyzeFunctions(files),
            classes: await this.analyzeClasses(files),
            dependencies: await this.analyzeDependencies(),
            architecture: await this.analyzeArchitecture(files)
        };
        return context;
    }
    // Enhanced code generation with context
    async generateCode(prompt, context = '') {
        try {
            const enhancedContext = await this.getEnhancedContext(context);
            const response = await this.aiService.generateCode(prompt, enhancedContext);
            return response.text;
        }
        catch (error) {
            console.error('Code generation failed:', error);
            throw error;
        }
    }
    // Smart code completion
    async getCodeCompletion(document, position) {
        try {
            const context = document.getText();
            const response = await this.aiService.generateCode(`Complete this code at position ${position.line}:${position.character}:\n${context}`);
            return this.parseCompletionResponse(response.text);
        }
        catch (error) {
            console.error('Code completion failed:', error);
            return [];
        }
    }
    // Enhanced chat capabilities
    async chat(message) {
        try {
            this.chatHistory.push({ role: 'user', content: message });
            const context = await this.getChatContext();
            const response = await this.aiService.generateCode(`Chat response with context:\n${context}\n\nUser message: ${message}`);
            this.chatHistory.push({ role: 'assistant', content: response.text });
            return response.text;
        }
        catch (error) {
            console.error('Chat failed:', error);
            throw error;
        }
    }
    // Smart code rewriting
    async rewriteCode(code, improvements) {
        try {
            const response = await this.aiService.generateCode(`Rewrite this code with the following improvements:\n${improvements.join('\n')}\n\nCode:\n${code}`);
            return response.text;
        }
        catch (error) {
            console.error('Code rewriting failed:', error);
            throw error;
        }
    }
    // Project creation and management
    async createProject(type, name, options) {
        try {
            const response = await this.aiService.generateCode(`Create a new ${type} project named ${name} with options:\n${JSON.stringify(options)}`);
            await this.executeProjectCreation(response.text);
        }
        catch (error) {
            console.error('Project creation failed:', error);
            throw error;
        }
    }
    // Enhanced code analysis
    async analyzeCode(code) {
        try {
            const response = await this.aiService.generateCode(`Analyze this code and provide detailed insights:\n${code}`);
            return this.parseAnalysisResponse(response.text);
        }
        catch (error) {
            console.error('Code analysis failed:', error);
            throw error;
        }
    }
    // Smart code prediction
    async predictNextCode(context) {
        try {
            const response = await this.aiService.generateCode(`Predict the next logical code based on this context:\n${context}`);
            return response.text;
        }
        catch (error) {
            console.error('Code prediction failed:', error);
            throw error;
        }
    }
    // Helper methods
    async getEnhancedContext(context) {
        const workspaceContext = await this.getWorkspaceContext();
        return `${workspaceContext}\n\n${context}`;
    }
    async getWorkspaceContext() {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders)
            return '';
        const rootPath = workspaceFolders[0].uri.fsPath;
        const files = await this.getWorkspaceFiles();
        const context = {
            projectStructure: await this.analyzeProjectStructure(),
            dependencies: await this.analyzeDependencies(),
            codeMetrics: await this.calculateCodeMetrics(),
            activeFile: vscode.window.activeTextEditor?.document.fileName
        };
        return JSON.stringify(context);
    }
    async getChatContext() {
        return this.chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    }
    parseCompletionResponse(response) {
        const completions = response.split('\n').filter(line => line.trim());
        return completions.map(completion => {
            const item = new vscode.CompletionItem(completion, vscode.CompletionItemKind.Snippet);
            item.detail = 'AI-generated completion';
            return item;
        });
    }
    parseAnalysisResponse(response) {
        try {
            return JSON.parse(response);
        }
        catch {
            return { analysis: response };
        }
    }
    async executeProjectCreation(instructions) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders)
            return;
        const rootPath = workspaceFolders[0].uri.fsPath;
        const steps = instructions.split('\n').filter(step => step.trim());
        for (const step of steps) {
            if (step.startsWith('CREATE_FILE:')) {
                const [_, filePath, content] = step.split(':');
                await fs.promises.writeFile(path.join(rootPath, filePath), content);
            }
            else if (step.startsWith('RUN_COMMAND:')) {
                const command = step.split(':')[1];
                await this.runCommand(command);
            }
        }
    }
    async runCommand(command) {
        const terminal = vscode.window.createTerminal('Project Creation');
        terminal.sendText(command);
        terminal.show();
    }
    async analyzeImports(files) {
        const imports = {};
        for (const file of files) {
            const content = await fs.promises.readFile(file, 'utf-8');
            const importMatches = content.match(/import\s+.*?from\s+['"](.*?)['"]/g);
            if (importMatches) {
                imports[file] = importMatches.map(imp => imp.replace(/import\s+.*?from\s+['"](.*?)['"]/, '$1'));
            }
        }
        return imports;
    }
    async analyzeFunctions(files) {
        const functions = {};
        for (const file of files) {
            const content = await fs.promises.readFile(file, 'utf-8');
            const functionMatches = content.match(/function\s+(\w+)\s*\([^)]*\)\s*{[\s\S]*?}/g);
            if (functionMatches) {
                functions[file] = functionMatches.map(func => ({
                    name: func.match(/function\s+(\w+)/)?.[1],
                    body: func
                }));
            }
        }
        return functions;
    }
    async analyzeClasses(files) {
        const classes = {};
        for (const file of files) {
            const content = await fs.promises.readFile(file, 'utf-8');
            const classMatches = content.match(/class\s+(\w+)\s*{[\s\S]*?}/g);
            if (classMatches) {
                classes[file] = classMatches.map(cls => ({
                    name: cls.match(/class\s+(\w+)/)?.[1],
                    body: cls
                }));
            }
        }
        return classes;
    }
    async analyzeArchitecture(files) {
        const architecture = {
            components: new Map(),
            relationships: new Map(),
            layers: new Map()
        };
        for (const file of files) {
            const content = await fs.promises.readFile(file, 'utf-8');
            const componentMatches = content.match(/class\s+(\w+)|interface\s+(\w+)|type\s+(\w+)/g);
            if (componentMatches) {
                const componentName = componentMatches[0].match(/(?:class|interface|type)\s+(\w+)/)?.[1];
                if (componentName) {
                    architecture.components.set(componentName, {
                        file,
                        type: componentMatches[0].startsWith('class') ? 'class' :
                            componentMatches[0].startsWith('interface') ? 'interface' : 'type',
                        dependencies: this.extractDependencies(content)
                    });
                }
            }
        }
        return {
            components: Object.fromEntries(architecture.components),
            relationships: Object.fromEntries(architecture.relationships),
            layers: Object.fromEntries(architecture.layers)
        };
    }
    extractDependencies(content) {
        const dependencies = [];
        // Extract import dependencies
        const importMatches = content.match(/import\s+.*?from\s+['"](.*?)['"]/g);
        if (importMatches) {
            dependencies.push(...importMatches.map(imp => imp.replace(/import\s+.*?from\s+['"](.*?)['"]/, '$1')));
        }
        // Extract class dependencies
        const classMatches = content.match(/extends\s+(\w+)|implements\s+(\w+)/g);
        if (classMatches) {
            dependencies.push(...classMatches.map(cls => cls.match(/(?:extends|implements)\s+(\w+)/)?.[1] || ''));
        }
        return dependencies.filter(Boolean);
    }
}
exports.PremiumFeatures = PremiumFeatures;
//# sourceMappingURL=PremiumFeatures.js.map