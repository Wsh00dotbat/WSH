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
exports.DependenciesView = void 0;
const vscode = __importStar(require("vscode"));
class DependenciesView {
    constructor(graph) {
        this.graph = graph;
    }
    async show() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }
        this.panel = vscode.window.createWebviewPanel('projectDependencies', 'Project Dependencies', vscode.ViewColumn.One, {
            enableScripts: true,
            retainContextWhenHidden: true
        });
        this.panel.webview.html = this.getWebviewContent();
        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });
        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(async (message) => {
            switch (message.command) {
                case 'refresh':
                    await this.refresh();
                    break;
                case 'selectNode':
                    await this.selectNode(message.nodeId);
                    break;
                case 'showCircularDeps':
                    await this.showCircularDependencies();
                    break;
            }
        });
        await this.refresh();
    }
    async refresh() {
        if (!this.panel)
            return;
        try {
            const data = this.graph.getVisualizationData();
            this.panel.webview.postMessage({
                command: 'updateGraph',
                data
            });
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to refresh dependencies view');
        }
    }
    async selectNode(nodeId) {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders)
            return;
        const nodePath = vscode.Uri.joinPath(workspaceFolders[0].uri, nodeId);
        try {
            const document = await vscode.workspace.openTextDocument(nodePath);
            await vscode.window.showTextDocument(document);
        }
        catch (error) {
            vscode.window.showErrorMessage(`Failed to open file: ${nodeId}`);
        }
    }
    async showCircularDependencies() {
        const circularDeps = this.graph.getCircularDependencies();
        if (circularDeps.length === 0) {
            vscode.window.showInformationMessage('No circular dependencies found');
            return;
        }
        const message = circularDeps.map(cycle => cycle.join(' → ')).join('\n');
        vscode.window.showWarningMessage(`Circular Dependencies Found:\n${message}`);
    }
    getWebviewContent() {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Project Dependencies</title>
                <script src="https://unpkg.com/vis-network/standalone/umd/vis-network.min.js"></script>
                <style>
                    body {
                        padding: 20px;
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    #graph {
                        width: 100%;
                        height: 600px;
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                    }
                    .controls {
                        margin-bottom: 20px;
                    }
                    .button {
                        margin-right: 10px;
                        padding: 8px 16px;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <div class="controls">
                    <button class="button" onclick="refresh()">Refresh</button>
                    <button class="button" onclick="showCircularDeps()">Show Circular Dependencies</button>
                </div>
                <div id="graph"></div>

                <script>
                    const vscode = acquireVsCodeApi();
                    let network = null;

                    function refresh() {
                        vscode.postMessage({ command: 'refresh' });
                    }

                    function showCircularDeps() {
                        vscode.postMessage({ command: 'showCircularDeps' });
                    }

                    function updateGraph(data) {
                        const container = document.getElementById('graph');
                        const options = {
                            nodes: {
                                shape: 'box',
                                margin: 10,
                                font: {
                                    color: 'var(--vscode-editor-foreground)'
                                },
                                color: {
                                    background: 'var(--vscode-editor-background)',
                                    border: 'var(--vscode-panel-border)'
                                }
                            },
                            edges: {
                                arrows: 'to',
                                color: 'var(--vscode-editor-foreground)'
                            },
                            physics: {
                                enabled: true,
                                hierarchicalRepulsion: {
                                    nodeDistance: 120
                                }
                            }
                        };

                        if (network) {
                            network.destroy();
                        }

                        network = new vis.Network(container, data, options);

                        network.on('click', function(params) {
                            if (params.nodes.length > 0) {
                                const nodeId = params.nodes[0];
                                vscode.postMessage({ command: 'selectNode', nodeId });
                            }
                        });
                    }

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'updateGraph':
                                updateGraph(message.data);
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}
exports.DependenciesView = DependenciesView;
//# sourceMappingURL=DependenciesView.js.map