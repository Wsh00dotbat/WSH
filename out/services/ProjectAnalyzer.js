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
exports.ProjectAnalyzer = void 0;
const vscode = __importStar(require("vscode"));
const glob = __importStar(require("glob"));
const path = __importStar(require("path"));
const fs = __importStar(require("fs"));
const ts_morph_1 = require("ts-morph");
class ProjectAnalyzer {
    constructor() {
        this.analysis = null;
        this.analysisInProgress = false;
        this.project = new ts_morph_1.Project();
    }
    async analyzeProject(rootPath) {
        this.analysisInProgress = true;
        try {
            // Get all source files
            const files = glob.sync('**/*.{ts,js,py,java,cpp,cs}', {
                cwd: rootPath,
                ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
            });
            // Analyze project structure
            const structure = await this.analyzeStructure(rootPath, files);
            // Analyze architecture
            const architecture = await this.analyzeArchitecture(files);
            // Calculate metrics
            const metrics = await this.calculateMetrics(files);
            this.analysis = {
                structure,
                architecture,
                metrics
            };
            return this.analysis;
        }
        finally {
            this.analysisInProgress = false;
        }
    }
    async updateAnalysis(changedFile) {
        if (!this.analysis) {
            return;
        }
        // Update the analysis for the changed file
        const fileContent = fs.readFileSync(changedFile, 'utf-8');
        const relativePath = path.relative(vscode.workspace.workspaceFolders[0].uri.fsPath, changedFile);
        // Update metrics
        this.analysis.metrics.totalLines += fileContent.split('\n').length;
        // Update dependencies
        const dependencies = await this.analyzeDependencies(changedFile);
        this.analysis.structure.dependencies.set(relativePath, dependencies);
    }
    async getArchitecture() {
        if (!this.analysis) {
            throw new Error('Project not analyzed yet');
        }
        return this.analysis.architecture;
    }
    async findRelatedFiles(filePath) {
        if (!this.analysis) {
            throw new Error('Project not analyzed yet');
        }
        const dependencies = this.analysis.structure.dependencies.get(filePath) || [];
        const dependents = Array.from(this.analysis.structure.dependencies.entries())
            .filter(([_, deps]) => deps.includes(filePath))
            .map(([file]) => file);
        return [...new Set([...dependencies, ...dependents])];
    }
    async getProjectInsights() {
        if (!this.analysis) {
            throw new Error('Project not analyzed yet');
        }
        return `Project Insights:
- Total Files: ${this.analysis.metrics.totalFiles}
- Total Lines: ${this.analysis.metrics.totalLines}
- Complexity: ${this.analysis.metrics.complexity}
- Components: ${this.analysis.architecture.components.length}
- Relationships: ${this.analysis.architecture.relationships.length}`;
    }
    isAnalysisInProgress() {
        return this.analysisInProgress;
    }
    async analyzeStructure(rootPath, files) {
        const directories = new Set();
        const dependencies = new Map();
        for (const file of files) {
            const dir = path.dirname(file);
            directories.add(dir);
            dependencies.set(file, await this.analyzeDependencies(path.join(rootPath, file)));
        }
        return {
            files,
            directories: Array.from(directories),
            dependencies
        };
    }
    async analyzeArchitecture(files) {
        const components = new Set();
        const relationships = [];
        for (const file of files) {
            const component = path.dirname(file);
            components.add(component);
            const deps = await this.analyzeDependencies(file);
            for (const dep of deps) {
                relationships.push({
                    from: component,
                    to: path.dirname(dep),
                    type: 'depends_on'
                });
            }
        }
        return {
            components: Array.from(components),
            relationships
        };
    }
    async calculateMetrics(files) {
        let totalLines = 0;
        let complexity = 0;
        for (const file of files) {
            const content = fs.readFileSync(file, 'utf-8');
            totalLines += content.split('\n').length;
            complexity += this.calculateFileComplexity(content);
        }
        return {
            totalFiles: files.length,
            totalLines,
            complexity
        };
    }
    calculateFileComplexity(content) {
        // Simple complexity calculation based on control structures
        const controlStructures = [
            /\bif\b/g,
            /\bfor\b/g,
            /\bwhile\b/g,
            /\bswitch\b/g,
            /\bcatch\b/g
        ];
        return controlStructures.reduce((sum, pattern) => {
            const matches = content.match(pattern);
            return sum + (matches ? matches.length : 0);
        }, 0);
    }
    async analyzeDependencies(filePath) {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const dependencies = [];
            // Analyze imports/exports
            const importPatterns = [
                /import\s+.*?from\s+['"]([^'"]+)['"]/g,
                /require\s*\(\s*['"]([^'"]+)['"]\s*\)/g,
                /import\s+['"]([^'"]+)['"]/g
            ];
            for (const pattern of importPatterns) {
                let match;
                while ((match = pattern.exec(content)) !== null) {
                    dependencies.push(match[1]);
                }
            }
            return dependencies;
        }
        catch (error) {
            console.error(`Error analyzing dependencies for ${filePath}:`, error);
            return [];
        }
    }
}
exports.ProjectAnalyzer = ProjectAnalyzer;
//# sourceMappingURL=ProjectAnalyzer.js.map