import * as vscode from 'vscode';
import { ProjectAnalyzer } from '../services/ProjectAnalyzer';

export class ArchitectureView {
    private panel: vscode.WebviewPanel | undefined;
    private analyzer: ProjectAnalyzer;

    constructor(analyzer: ProjectAnalyzer) {
        this.analyzer = analyzer;
    }

    public async show(): Promise<void> {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }

        this.panel = vscode.window.createWebviewPanel(
            'projectArchitecture',
            'Project Architecture',
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
                case 'selectComponent':
                    await this.selectComponent(message.component);
                    break;
            }
        });

        await this.refresh();
    }

    private async refresh(): Promise<void> {
        if (!this.panel) return;

        try {
            const architecture = await this.analyzer.getArchitecture();
            this.panel.webview.postMessage({
                command: 'updateArchitecture',
                architecture
            });
        } catch (error) {
            vscode.window.showErrorMessage('Failed to refresh architecture view');
        }
    }

    private async selectComponent(component: string): Promise<void> {
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (!workspaceFolders) return;

        const componentPath = vscode.Uri.joinPath(workspaceFolders[0].uri, component);
        try {
            const document = await vscode.workspace.openTextDocument(componentPath);
            await vscode.window.showTextDocument(document);
        } catch (error) {
            vscode.window.showErrorMessage(`Failed to open component: ${component}`);
        }
    }

    private getWebviewContent(): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Project Architecture</title>
                <style>
                    body {
                        padding: 20px;
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    .component {
                        margin: 10px 0;
                        padding: 10px;
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .component:hover {
                        background-color: var(--vscode-list-hoverBackground);
                    }
                    .relationship {
                        margin-left: 20px;
                        color: var(--vscode-descriptionForeground);
                    }
                    .refresh-button {
                        margin-bottom: 20px;
                        padding: 8px 16px;
                        background-color: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                    .refresh-button:hover {
                        background-color: var(--vscode-button-hoverBackground);
                    }
                </style>
            </head>
            <body>
                <button class="refresh-button" onclick="refresh()">Refresh</button>
                <div id="architecture"></div>

                <script>
                    const vscode = acquireVsCodeApi();
                    let currentArchitecture = null;

                    function refresh() {
                        vscode.postMessage({ command: 'refresh' });
                    }

                    function selectComponent(component) {
                        vscode.postMessage({ command: 'selectComponent', component });
                    }

                    function updateArchitecture(architecture) {
                        currentArchitecture = architecture;
                        const container = document.getElementById('architecture');
                        container.innerHTML = '';

                        architecture.components.forEach(component => {
                            const componentDiv = document.createElement('div');
                            componentDiv.className = 'component';
                            componentDiv.textContent = component;
                            componentDiv.onclick = () => selectComponent(component);
                            container.appendChild(componentDiv);

                            const relationships = architecture.relationships
                                .filter(r => r.from === component)
                                .map(r => r.to);

                            if (relationships.length > 0) {
                                const depsDiv = document.createElement('div');
                                depsDiv.className = 'relationship';
                                depsDiv.textContent = 'Depends on: ' + relationships.join(', ');
                                container.appendChild(depsDiv);
                            }
                        });
                    }

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'updateArchitecture':
                                updateArchitecture(message.architecture);
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
} 