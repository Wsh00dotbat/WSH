import * as vscode from 'vscode';
import * as path from 'path';

interface DependencyNode {
    id: string;
    label: string;
    type: 'file' | 'module' | 'component';
    dependencies: string[];
}

interface DependencyEdge {
    from: string;
    to: string;
    type: string;
}

export class DependencyGraph {
    private nodes: Map<string, DependencyNode> = new Map();
    private edges: DependencyEdge[] = [];

    public addNode(id: string, label: string, type: 'file' | 'module' | 'component'): void {
        this.nodes.set(id, {
            id,
            label,
            type,
            dependencies: []
        });
    }

    public addEdge(from: string, to: string, type: string = 'depends_on'): void {
        if (!this.nodes.has(from) || !this.nodes.has(to)) {
            return;
        }

        const fromNode = this.nodes.get(from)!;
        if (!fromNode.dependencies.includes(to)) {
            fromNode.dependencies.push(to);
            this.edges.push({ from, to, type });
        }
    }

    public getDependencies(nodeId: string): string[] {
        return this.nodes.get(nodeId)?.dependencies || [];
    }

    public getDependents(nodeId: string): string[] {
        return this.edges
            .filter(edge => edge.to === nodeId)
            .map(edge => edge.from);
    }

    public getCircularDependencies(): string[][] {
        const visited = new Set<string>();
        const recursionStack = new Set<string>();
        const circularDeps: string[][] = [];

        const dfs = (nodeId: string, path: string[]): void => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);

            const node = this.nodes.get(nodeId);
            if (!node) return;

            for (const depId of node.dependencies) {
                if (!visited.has(depId)) {
                    dfs(depId, [...path]);
                } else if (recursionStack.has(depId)) {
                    const cycleStart = path.indexOf(depId);
                    if (cycleStart !== -1) {
                        circularDeps.push(path.slice(cycleStart));
                    }
                }
            }

            recursionStack.delete(nodeId);
        };

        for (const nodeId of this.nodes.keys()) {
            if (!visited.has(nodeId)) {
                dfs(nodeId, []);
            }
        }

        return circularDeps;
    }

    public getModuleDependencies(modulePath: string): string[] {
        const moduleFiles = Array.from(this.nodes.entries())
            .filter(([id]) => id.startsWith(modulePath))
            .map(([id]) => id);

        const moduleDeps = new Set<string>();
        for (const fileId of moduleFiles) {
            const deps = this.getDependencies(fileId);
            for (const dep of deps) {
                if (!dep.startsWith(modulePath)) {
                    moduleDeps.add(dep);
                }
            }
        }

        return Array.from(moduleDeps);
    }

    public getDependencyTree(nodeId: string, depth: number = 3): any {
        if (depth <= 0) return null;

        const node = this.nodes.get(nodeId);
        if (!node) return null;

        const tree: any = {
            id: nodeId,
            label: node.label,
            type: node.type,
            dependencies: []
        };

        for (const depId of node.dependencies) {
            const depTree = this.getDependencyTree(depId, depth - 1);
            if (depTree) {
                tree.dependencies.push(depTree);
            }
        }

        return tree;
    }

    public getVisualizationData(): any {
        return {
            nodes: Array.from(this.nodes.values()),
            edges: this.edges
        };
    }

    public clear(): void {
        this.nodes.clear();
        this.edges = [];
    }
} 