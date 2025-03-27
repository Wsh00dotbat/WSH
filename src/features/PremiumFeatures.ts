import * as vscode from 'vscode';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
import * as glob from 'glob';
import { AIService } from '../services/aiService';

export class PremiumFeatures {
    private static instance: PremiumFeatures;
    private contextCache: Map<string, any> = new Map();
    private isAgentRunning: boolean = false;
    private agentState: any;
    private aiService: AIService;
    private cursorHistory: vscode.Position[] = [];
    private maxHistorySize: number = 50;
    private tokenLimit: number = 4000;
    private lastTokenReset: Date = new Date();
    private projectContext: any = {};
    private codebaseCache: Map<string, any> = new Map();
    private chatHistory: Array<{ role: 'user' | 'assistant', content: string }> = [];

    private constructor() {
        this.aiService = AIService.getInstance();
    }

    public static getInstance(): PremiumFeatures {
        if (!PremiumFeatures.instance) {
            PremiumFeatures.instance = new PremiumFeatures();
        }
        return PremiumFeatures.instance;
    }

    // Enhanced super elite agent with unlimited capabilities
    public async startAgent(): Promise<void> {
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
        } catch (error) {
            console.error('Failed to initialize super elite AI agent:', error);
            throw new Error('Failed to initialize super elite AI agent');
        }
    }

    private async analyzeProjectStructure(): Promise<any> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return null;

        const rootPath = workspaceFolders[0].uri.fsPath;
        const structure = {
            root: rootPath,
            files: await this.getWorkspaceFiles(),
            directories: await this.getDirectories(rootPath),
            fileTypes: await this.analyzeFileTypes(rootPath)
        };

        return structure;
    }

    private async analyzeDependencies(): Promise<any> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return null;

        const rootPath = workspaceFolders[0].uri.fsPath;
        const packageJson = await this.readPackageJson(rootPath);
        const dependencies = {
            direct: packageJson?.dependencies || {},
            dev: packageJson?.devDependencies || {},
            peer: packageJson?.peerDependencies || {}
        };

        return dependencies;
    }

    private async calculateCodeMetrics(): Promise<any> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return null;

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

    private calculateFileComplexity(content: string): number {
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

    private async getDirectories(rootPath: string): Promise<string[]> {
        const dirs = await fs.promises.readdir(rootPath, { withFileTypes: true });
        return dirs
            .filter(dirent => dirent.isDirectory())
            .map(dirent => dirent.name);
    }

    private async analyzeFileTypes(rootPath: string): Promise<Record<string, number>> {
        const files = await this.getWorkspaceFiles();
        const types: Record<string, number> = {};

        for (const file of files) {
            const ext = path.extname(file).slice(1);
            types[ext] = (types[ext] || 0) + 1;
        }

        return types;
    }

    private async readPackageJson(rootPath: string): Promise<any> {
        try {
            const content = await fs.promises.readFile(path.join(rootPath, 'package.json'), 'utf-8');
            return JSON.parse(content);
        } catch (error) {
            return null;
        }
    }

    private async startAgentLoop() {
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
            } catch (error) {
                console.error('Error in agent loop:', error);
            }
        }
    }

    private async processTask(task: any) {
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
        } finally {
            this.agentState.isProcessing = false;
        }
    }

    private async handleCodeGeneration(task: any) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        try {
            const response = await this.aiService.generateCode(task.prompt, editor.document.getText());
            await editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, response.text);
            });
            vscode.window.showInformationMessage(`Code generated using ${response.model}`);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to generate code: ' + error);
        }
    }

    private async handleCodeOptimization(task: any) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        try {
            const response = await this.aiService.generateCode(
                `Optimize this code:\n${editor.document.getText(editor.selection)}`
            );
            await editor.edit(editBuilder => {
                editBuilder.replace(editor.selection, response.text);
            });
            vscode.window.showInformationMessage(`Code optimized using ${response.model}`);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to optimize code: ' + error);
        }
    }

    private async handleErrorFixing(task: any) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        try {
            const response = await this.aiService.generateCode(
                `Fix the errors in this code:\n${editor.document.getText(editor.selection)}`
            );
            await editor.edit(editBuilder => {
                editBuilder.replace(editor.selection, response.text);
            });
            vscode.window.showInformationMessage(`Errors fixed using ${response.model}`);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to fix code: ' + error);
        }
    }

    private async handleRefactoring(task: any) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        try {
            const response = await this.aiService.generateCode(
                `Refactor this code to improve its structure and maintainability:\n${editor.document.getText(editor.selection)}`
            );
            await editor.edit(editBuilder => {
                editBuilder.replace(editor.selection, response.text);
            });
            vscode.window.showInformationMessage(`Code refactored using ${response.model}`);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to refactor code: ' + error);
        }
    }

    private async handleDocumentation(task: any) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        try {
            const response = await this.aiService.generateCode(
                `Generate comprehensive documentation for this code:\n${editor.document.getText(editor.selection)}`
            );
            await editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, response.text);
            });
            vscode.window.showInformationMessage(`Documentation generated using ${response.model}`);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to generate documentation: ' + error);
        }
    }

    private async handleTesting(task: any) {
        const editor = vscode.window.activeTextEditor;
        if (!editor) return;

        try {
            const response = await this.aiService.generateCode(
                `Generate unit tests for this code:\n${editor.document.getText(editor.selection)}`
            );
            await editor.edit(editBuilder => {
                editBuilder.insert(editor.selection.active, response.text);
            });
            vscode.window.showInformationMessage(`Tests generated using ${response.model}`);
        } catch (error) {
            vscode.window.showErrorMessage('Failed to generate tests: ' + error);
        }
    }

    private handleEditorChange(): void {
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

    private handleDocumentChange(): void {
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
    public async searchCodebase(query: string): Promise<any[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return [];

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

    private getRelevantContext(content: string, query: string): string {
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

    private calculateRelevance(content: string, query: string): number {
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
    public async webSearch(query: string): Promise<any[]> {
        try {
            const response = await axios.get('https://api.codex.jaagrav.in/websearch', {
                params: { 
                    query,
                    maxResults: 10,
                    includeCode: true
                }
            });

            return response.data.results.map((result: any) => ({
                title: result.title,
                url: result.url,
                snippet: result.snippet,
                code: result.code,
                relevance: result.relevance
            }));
        } catch (error) {
            console.error('Web search failed:', error);
            return [];
        }
    }

    // Enhanced documentation search
    public async searchDocumentation(query: string): Promise<any[]> {
        try {
            const response = await axios.get('https://api.codex.jaagrav.in/docs', {
                params: { 
                    query,
                    maxResults: 10,
                    includeExamples: true
                }
            });

            return response.data.results.map((result: any) => ({
                title: result.title,
                url: result.url,
                content: result.content,
                examples: result.examples,
                relevance: result.relevance
            }));
        } catch (error) {
            console.error('Documentation search failed:', error);
            return [];
        }
    }

    // Enhanced image analysis
    public async analyzeImage(imagePath: string): Promise<string> {
        try {
            const imageData = await fs.promises.readFile(imagePath);
            const response = await axios.post('https://api.codex.jaagrav.in/analyze-image', {
                image: imageData.toString('base64'),
                analysisType: 'detailed',
                includeCode: true
            });

            return response.data.analysis;
        } catch (error) {
            console.error('Image analysis failed:', error);
            return 'Failed to analyze image';
        }
    }

    // Enhanced error fixing with multiple attempts
    public async fixErrors(code: string, maxAttempts: number = 3): Promise<string> {
        let fixedCode = code;
        let attempts = 0;

        while (attempts < maxAttempts) {
            try {
                const response = await this.aiService.generateCode(
                    `Fix the errors in this code:\n${fixedCode}`
                );
                fixedCode = response.text;

                if (this.validateCode(fixedCode)) {
                    break;
                }
            } catch (error) {
                console.error('Error fixing code:', error);
            }
            attempts++;
        }

        return fixedCode;
    }

    // Enhanced cursor prediction
    public async predictCursorMovement(editor: vscode.TextEditor, position: vscode.Position): Promise<vscode.Position> {
        try {
            const context = editor.document.getText();
            const response = await this.aiService.generateCode(
                `Given this code context, predict the next logical cursor position:\n${context}`
            );

            const match = response.text.match(/line: (\d+), column: (\d+)/);
            if (match) {
                return new vscode.Position(
                    parseInt(match[1]) - 1,
                    parseInt(match[2]) - 1
                );
            }
        } catch (error) {
            console.error('Cursor prediction failed:', error);
        }

        return position;
    }

    // Cursor history management
    public async getCursorHistory(): Promise<vscode.Position[]> {
        return this.cursorHistory;
    }

    public addToCursorHistory(position: vscode.Position): void {
        this.cursorHistory.push(position);
        if (this.cursorHistory.length > this.maxHistorySize) {
            this.cursorHistory.shift();
        }
    }

    // Helper methods
    private async getWorkspaceFiles(): Promise<string[]> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return [];

        const rootPath = workspaceFolders[0].uri.fsPath;
        return glob.sync('**/*.{js,ts,py,java,cpp,cs}', {
            cwd: rootPath,
            ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
        });
    }

    private validateCode(code: string): boolean {
        // Enhanced code validation
        const basicValidation = code.length > 0 && 
            code.includes('function') || 
            code.includes('class') || 
            code.includes('const') || 
            code.includes('let') || 
            code.includes('var');

        if (!basicValidation) return false;

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
        } catch (error) {
            return false;
        }
    }

    // Enhanced codebase analysis
    private async analyzeCodebaseContext(): Promise<any> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return null;

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
    public async generateCode(prompt: string, context: string = ''): Promise<string> {
        try {
            const enhancedContext = await this.getEnhancedContext(context);
            const response = await this.aiService.generateCode(prompt, enhancedContext);
            return response.text;
        } catch (error) {
            console.error('Code generation failed:', error);
            throw error;
        }
    }

    // Smart code completion
    public async getCodeCompletion(document: vscode.TextDocument, position: vscode.Position): Promise<vscode.CompletionItem[]> {
        try {
            const context = document.getText();
            const response = await this.aiService.generateCode(
                `Complete this code at position ${position.line}:${position.character}:\n${context}`
            );
            
            return this.parseCompletionResponse(response.text);
        } catch (error) {
            console.error('Code completion failed:', error);
            return [];
        }
    }

    // Enhanced chat capabilities
    public async chat(message: string): Promise<string> {
        try {
            this.chatHistory.push({ role: 'user', content: message });
            const context = await this.getChatContext();
            const response = await this.aiService.generateCode(
                `Chat response with context:\n${context}\n\nUser message: ${message}`
            );
            
            this.chatHistory.push({ role: 'assistant', content: response.text });
            return response.text;
        } catch (error) {
            console.error('Chat failed:', error);
            throw error;
        }
    }

    // Smart code rewriting
    public async rewriteCode(code: string, improvements: string[]): Promise<string> {
        try {
            const response = await this.aiService.generateCode(
                `Rewrite this code with the following improvements:\n${improvements.join('\n')}\n\nCode:\n${code}`
            );
            return response.text;
        } catch (error) {
            console.error('Code rewriting failed:', error);
            throw error;
        }
    }

    // Project creation and management
    public async createProject(type: string, name: string, options: any): Promise<void> {
        try {
            const response = await this.aiService.generateCode(
                `Create a new ${type} project named ${name} with options:\n${JSON.stringify(options)}`
            );
            
            await this.executeProjectCreation(response.text);
        } catch (error) {
            console.error('Project creation failed:', error);
            throw error;
        }
    }

    // Enhanced code analysis
    public async analyzeCode(code: string): Promise<any> {
        try {
            const response = await this.aiService.generateCode(
                `Analyze this code and provide detailed insights:\n${code}`
            );
            
            return this.parseAnalysisResponse(response.text);
        } catch (error) {
            console.error('Code analysis failed:', error);
            throw error;
        }
    }

    // Smart code prediction
    public async predictNextCode(context: string): Promise<string> {
        try {
            const response = await this.aiService.generateCode(
                `Predict the next logical code based on this context:\n${context}`
            );
            return response.text;
        } catch (error) {
            console.error('Code prediction failed:', error);
            throw error;
        }
    }

    // Helper methods
    private async getEnhancedContext(context: string): Promise<string> {
        const workspaceContext = await this.getWorkspaceContext();
        return `${workspaceContext}\n\n${context}`;
    }

    private async getWorkspaceContext(): Promise<string> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return '';

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

    private async getChatContext(): Promise<string> {
        return this.chatHistory.map(msg => `${msg.role}: ${msg.content}`).join('\n');
    }

    private parseCompletionResponse(response: string): vscode.CompletionItem[] {
        const completions = response.split('\n').filter(line => line.trim());
        return completions.map(completion => {
            const item = new vscode.CompletionItem(completion, vscode.CompletionItemKind.Snippet);
            item.detail = 'AI-generated completion';
            return item;
        });
    }

    private parseAnalysisResponse(response: string): any {
        try {
            return JSON.parse(response);
        } catch {
            return { analysis: response };
        }
    }

    private async executeProjectCreation(instructions: string): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return;

        const rootPath = workspaceFolders[0].uri.fsPath;
        const steps = instructions.split('\n').filter(step => step.trim());

        for (const step of steps) {
            if (step.startsWith('CREATE_FILE:')) {
                const [_, filePath, content] = step.split(':');
                await fs.promises.writeFile(
                    path.join(rootPath, filePath),
                    content
                );
            } else if (step.startsWith('RUN_COMMAND:')) {
                const command = step.split(':')[1];
                await this.runCommand(command);
            }
        }
    }

    private async runCommand(command: string): Promise<void> {
        const terminal = vscode.window.createTerminal('Project Creation');
        terminal.sendText(command);
        terminal.show();
    }

    private async analyzeImports(files: string[]): Promise<any> {
        const imports: Record<string, string[]> = {};
        
        for (const file of files) {
            const content = await fs.promises.readFile(file, 'utf-8');
            const importMatches = content.match(/import\s+.*?from\s+['"](.*?)['"]/g);
            
            if (importMatches) {
                imports[file] = importMatches.map(imp => imp.replace(/import\s+.*?from\s+['"](.*?)['"]/, '$1'));
            }
        }
        
        return imports;
    }

    private async analyzeFunctions(files: string[]): Promise<any> {
        const functions: Record<string, any[]> = {};
        
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

    private async analyzeClasses(files: string[]): Promise<any> {
        const classes: Record<string, any[]> = {};
        
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

    private async analyzeArchitecture(files: string[]): Promise<any> {
        const architecture = {
            components: new Map<string, any>(),
            relationships: new Map<string, string[]>(),
            layers: new Map<string, string[]>()
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

    private extractDependencies(content: string): string[] {
        const dependencies: string[] = [];
        
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