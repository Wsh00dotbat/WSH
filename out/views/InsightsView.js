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
exports.InsightsView = void 0;
const vscode = __importStar(require("vscode"));
class InsightsView {
    constructor(analyzer) {
        this.analyzer = analyzer;
    }
    async show() {
        if (this.panel) {
            this.panel.reveal(vscode.ViewColumn.One);
            return;
        }
        this.panel = vscode.window.createWebviewPanel('projectInsights', 'Project Insights', vscode.ViewColumn.One, {
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
            }
        });
        await this.refresh();
    }
    async refresh() {
        if (!this.panel)
            return;
        try {
            const insights = await this.analyzer.getProjectInsights();
            this.panel.webview.postMessage({
                command: 'updateInsights',
                insights
            });
        }
        catch (error) {
            vscode.window.showErrorMessage('Failed to refresh insights view');
        }
    }
    getWebviewContent() {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Project Insights</title>
                <style>
                    body {
                        padding: 20px;
                        font-family: var(--vscode-font-family);
                        color: var(--vscode-editor-foreground);
                        background-color: var(--vscode-editor-background);
                    }
                    .insights-container {
                        display: grid;
                        grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                        gap: 20px;
                        margin-top: 20px;
                    }
                    .metric-card {
                        padding: 20px;
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                        background-color: var(--vscode-editor-background);
                    }
                    .metric-title {
                        font-size: 1.2em;
                        font-weight: bold;
                        margin-bottom: 10px;
                        color: var(--vscode-editor-foreground);
                    }
                    .metric-value {
                        font-size: 1.5em;
                        color: var(--vscode-editor-foreground);
                    }
                    .metric-description {
                        margin-top: 10px;
                        color: var(--vscode-descriptionForeground);
                        font-size: 0.9em;
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
                    .chart-container {
                        margin-top: 20px;
                        height: 300px;
                        border: 1px solid var(--vscode-panel-border);
                        border-radius: 4px;
                    }
                </style>
            </head>
            <body>
                <button class="refresh-button" onclick="refresh()">Refresh</button>
                <div id="insights" class="insights-container"></div>
                <div id="chart" class="chart-container"></div>

                <script>
                    const vscode = acquireVsCodeApi();

                    function refresh() {
                        vscode.postMessage({ command: 'refresh' });
                    }

                    function updateInsights(insights) {
                        const container = document.getElementById('insights');
                        container.innerHTML = '';

                        // Parse insights string into metrics
                        const metrics = insights.split('\\n').filter(line => line.trim());
                        
                        metrics.forEach(metric => {
                            const [label, value] = metric.split(':').map(s => s.trim());
                            const card = document.createElement('div');
                            card.className = 'metric-card';
                            
                            const title = document.createElement('div');
                            title.className = 'metric-title';
                            title.textContent = label;
                            
                            const valueDiv = document.createElement('div');
                            valueDiv.className = 'metric-value';
                            valueDiv.textContent = value;
                            
                            const description = document.createElement('div');
                            description.className = 'metric-description';
                            description.textContent = getMetricDescription(label);
                            
                            card.appendChild(title);
                            card.appendChild(valueDiv);
                            card.appendChild(description);
                            container.appendChild(card);
                        });
                    }

                    function getMetricDescription(metric) {
                        const descriptions = {
                            'Total Files': 'Number of source code files in the project',
                            'Total Lines': 'Total number of lines of code',
                            'Complexity': 'Average cyclomatic complexity of the codebase',
                            'Components': 'Number of distinct components/modules',
                            'Relationships': 'Number of dependencies between components'
                        };
                        return descriptions[metric] || '';
                    }

                    window.addEventListener('message', event => {
                        const message = event.data;
                        switch (message.command) {
                            case 'updateInsights':
                                updateInsights(message.insights);
                                break;
                        }
                    });
                </script>
            </body>
            </html>
        `;
    }
}
exports.InsightsView = InsightsView;
//# sourceMappingURL=InsightsView.js.map