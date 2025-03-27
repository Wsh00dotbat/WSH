"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyGraph = void 0;
class DependencyGraph {
    constructor() {
        this.nodes = new Map();
        this.edges = [];
    }
    addNode(id, label, type) {
        this.nodes.set(id, {
            id,
            label,
            type,
            dependencies: []
        });
    }
    addEdge(from, to, type = 'depends_on') {
        if (!this.nodes.has(from) || !this.nodes.has(to)) {
            return;
        }
        const fromNode = this.nodes.get(from);
        if (!fromNode.dependencies.includes(to)) {
            fromNode.dependencies.push(to);
            this.edges.push({ from, to, type });
        }
    }
    getDependencies(nodeId) {
        return this.nodes.get(nodeId)?.dependencies || [];
    }
    getDependents(nodeId) {
        return this.edges
            .filter(edge => edge.to === nodeId)
            .map(edge => edge.from);
    }
    getCircularDependencies() {
        const visited = new Set();
        const recursionStack = new Set();
        const circularDeps = [];
        const dfs = (nodeId, path) => {
            visited.add(nodeId);
            recursionStack.add(nodeId);
            path.push(nodeId);
            const node = this.nodes.get(nodeId);
            if (!node)
                return;
            for (const depId of node.dependencies) {
                if (!visited.has(depId)) {
                    dfs(depId, [...path]);
                }
                else if (recursionStack.has(depId)) {
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
    getModuleDependencies(modulePath) {
        const moduleFiles = Array.from(this.nodes.entries())
            .filter(([id]) => id.startsWith(modulePath))
            .map(([id]) => id);
        const moduleDeps = new Set();
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
    getDependencyTree(nodeId, depth = 3) {
        if (depth <= 0)
            return null;
        const node = this.nodes.get(nodeId);
        if (!node)
            return null;
        const tree = {
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
    getVisualizationData() {
        return {
            nodes: Array.from(this.nodes.values()),
            edges: this.edges
        };
    }
    clear() {
        this.nodes.clear();
        this.edges = [];
    }
}
exports.DependencyGraph = DependencyGraph;
//# sourceMappingURL=DependencyGraph.js.map