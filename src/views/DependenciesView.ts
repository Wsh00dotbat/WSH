import * as vscode from 'vscode';
import { DependencyGraph } from '../services/DependencyGraph';

export class DependenciesView {
    private panel: vscode.WebviewPanel | undefined;
    private graph: DependencyGraph;

    constructor(graph: DependencyGraph) {
        this.graph = graph;
    }

    public async show(): Promise<void> {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'projectDependencies',
            'Project Dependencies',
            vscode.ViewColumn.One,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = this.getWebviewContent();

        this.panel.onDidDispose(() => {
            this.panel = undefined;
        });

        // Handle messages from the webview
        this.panel.webview.onDidReceiveMessage(async message => {
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

    private async refresh(): Promise<void> {
        if (!this.panel) return;

        try {
            const data = this.graph.getVisualizationData();
            this.panel.webview.postMessage({
                command: 'updateGraph',
                data
            });
        } catch (error) {
            vscode.window.showErrorMessage('Failed to refresh dependencies view');
        }
    }

    private async selectNode(nodeId: string): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return;

        const nodePath = vscode.Uri.joinPath(workspaceFolders[0].uri, nodeId);
        try {
            const document = await vscode.workspace.openTextDocument(nodePath);
            await vscode.window.showTextDocument(document);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open file: ${nodeId}`);
        }
    }

    private async showCircularDependencies(): Promise<void> {
        const circularDeps = this.graph.getCircularDependencies();
        if (circularDeps.length === 0) {
            vscode.window.showInformationMessage('No circular dependencies found');
            return;
        }

        const message = circularDeps.map(cycle => cycle.join(' → ')).join('\n');
        vscode.window.showWarningMessage(`Circular Dependencies Found:\n${message}`);
    }

    private getWebviewContent(): string {
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