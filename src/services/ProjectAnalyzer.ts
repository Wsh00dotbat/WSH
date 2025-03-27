import * as vscode from 'vscode';
import * as glob from 'glob';
import * as path from 'path';
import * as fs from 'fs';
import { Project } from 'ts-morph';

interface ProjectAnalysis {
    structure: {
        files: string[];
        directories: string[];
        dependencies: Map<string, string[]>;
    };
    architecture: {
        components: string[];
        relationships: Array<{ from: string; to: string; type: string }>;
    };
    metrics: {
        totalFiles: number;
        totalLines: number;
        complexity: number;
    };
}

interface CacheEntry {
    timestamp: number;
    data: ProjectAnalysis;
}

export class ProjectAnalyzer {
    private project: Project;
    private analysis: ProjectAnalysis | null = null;
    private analysisInProgress: boolean = false;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    private readonly CACHE_SIZE = 100;
    private readonly PAGE_SIZE = 20;
    private cache: Map<string, CacheEntry> = new Map();

    constructor() {
        this.project = new Project();
    }

    private clearOldCache(): void {
        const now = Date.now();
        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.CACHE_DURATION) {
                this.cache.delete(key);
            }
        }
    }

    private getCachedAnalysis(rootPath: string): ProjectAnalysis | null {
        this.clearOldCache();
        const entry = this.cache.get(rootPath);
        if (entry && Date.now() - entry.timestamp <= this.CACHE_DURATION) {
            return entry.data;
        }
        return null;
    }

    private cacheAnalysis(rootPath: string, analysis: ProjectAnalysis): void {
        if (this.cache.size >= this.CACHE_SIZE) {
            const oldestKey = Array.from(this.cache.entries())
                .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
            this.cache.delete(oldestKey);
        }
        this.cache.set(rootPath, {
            timestamp: Date.now(),
            data: analysis
        });
    }

    private async getWorkspaceFiles(rootPath: string, page: number = 1): Promise<string[]> {
        const files = glob.sync('**/*.{ts,js,py,java,cpp,cs}', {
            cwd: rootPath,
            ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
        });

        const start = (page - 1) * this.PAGE_SIZE;
        const end = start + this.PAGE_SIZE;
        return files.slice(start, end);
    }

    private async analyzeStructure(rootPath: string, files: string[]): Promise<ProjectAnalysis['structure']> {
        const directories = new Set<string>();
        const dependencies = new Map<string, string[]>();

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

    private async analyzeArchitecture(files: string[]): Promise<ProjectAnalysis['architecture']> {
        const components = new Set<string>();
        const relationships: Array<{ from: string; to: string; type: string }> = [];

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

    private async calculateMetrics(files: string[]): Promise<ProjectAnalysis['metrics']> {
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

    private calculateFileComplexity(content: string): number {
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

    private async analyzeDependencies(filePath: string): Promise<string[]> {
        try {
            const content = fs.readFileSync(filePath, 'utf-8');
            const dependencies: string[] = [];

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
        } catch (error) {
            console.error(`Error analyzing dependencies for ${filePath}:`, error);
            return [];
        }
    }

    public async analyzeProject(rootPath: string, page: number = 1): Promise<ProjectAnalysis> {
        if (this.analysisInProgress) {
            throw new Error('Analysis already in progress');
        }

        // Check cache first
        const cachedAnalysis = this.getCachedAnalysis(rootPath);
        if (cachedAnalysis) {
            return cachedAnalysis;
        }

        this.analysisInProgress = true;
        try {
            // Get paginated source files
            const files = await this.getWorkspaceFiles(rootPath, page);

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

            // Cache the analysis
            this.cacheAnalysis(rootPath, this.analysis);

            return this.analysis;
        } finally {
            this.analysisInProgress = false;
        }
    }

    public getAnalysis(): ProjectAnalysis | null {
        return this.analysis;
    }

    public clearCache(): void {
        this.cache.clear();
    }

    public async updateAnalysis(changedFile: string): Promise<void> {
        if (!this.analysis) {
            return;
        }

        // Update the analysis for the changed file
        const fileContent = fs.readFileSync(changedFile, 'utf-8');
        const relativePath = path.relative(vscode.workspace.workspaceFolders![0].uri.fsPath, changedFile);
        
        // Update metrics
        this.analysis.metrics.totalLines += fileContent.split('\n').length;
        
        // Update dependencies
        const dependencies = await this.analyzeDependencies(changedFile);
        this.analysis.structure.dependencies.set(relativePath, dependencies);
    }

    public async getArchitecture(): Promise<ProjectAnalysis['architecture']> {
        if (!this.analysis) {
            throw new Error('Project not analyzed yet');
        }
        return this.analysis.architecture;
    }

    public async findRelatedFiles(filePath: string): Promise<string[]> {
        if (!this.analysis) {
            throw new Error('Project not analyzed yet');
        }

        const dependencies = this.analysis.structure.dependencies.get(filePath) || [];
        const dependents = Array.from(this.analysis.structure.dependencies.entries())
            .filter(([_, deps]) => deps.includes(filePath))
            .map(([file]) => file);

        return [...new Set([...dependencies, ...dependents])];
    }

    public async getProjectInsights(): Promise<string> {
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

    public isAnalysisInProgress(): boolean {
        return this.analysisInProgress;
    }
} 